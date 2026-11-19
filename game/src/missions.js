/**
 * Mission system for Maravilla - 7 story missions
 */
import { MISSIONS } from './config.js';
import { distance2D, clamp } from './math.js';
import * as THREE from 'three';

export class MissionManager {
  constructor(world, player, dialogue, ui, audio) {
    this.world = world;
    this.player = player;
    this.dialogue = dialogue;
    this.ui = ui;
    this.audio = audio;
    this.missions = MISSIONS;
    this.currentMission = null;
    this.currentObjectiveIndex = 0;
    this.missionProgress = {};
    this.objectiveStartTime = 0;
    this.missionStartTime = 0;
    this.marker = null;
    this.checkpoints = [];
    this.currentCheckpoint = 0;
    this.completedMissions = [];
    this.availableMissions = ['intro_drive'];
    this.onMissionComplete = null;
    this.onMissionFail = null;
  }

  startMission(missionId) {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return false;
    
    this.currentMission = mission;
    this.currentObjectiveIndex = 0;
    this.missionStartTime = Date.now() / 1000;
    this.missionProgress = {};
    
    if (this.dialogue) {
      this.dialogue.show(mission.giver, mission.giverPortrait, mission.storyText, () => {
        this.beginObjective(0);
      });
    } else {
      this.beginObjective(0);
    }
    
    return true;
  }

  beginObjective(index) {
    if (!this.currentMission) return;
    if (index >= this.currentMission.objectives.length) {
      this.completeMission();
      return;
    }
    
    this.currentObjectiveIndex = index;
    const obj = this.currentMission.objectives[index];
    this.objectiveStartTime = Date.now() / 1000;
    this.missionProgress[obj.type] = 0;
    
    this.createMarker(obj);
    
    if (this.ui) {
      this.ui.setMissionObjective(obj.description);
    }
    
    if (obj.type === 'checkpoint') {
      this.checkpoints = obj.checkpoints.map(c => new THREE.Vector3(c.x, 0, c.z));
      this.currentCheckpoint = 0;
      this.updateCheckpointMarker();
    }
    
    if (obj.type === 'survive') {
      if (this.world.police) {
        this.world.police.addWanted(obj.wantedLevel * 500);
      }
    }
  }

  createMarker(obj) {
    if (this.marker) {
      this.world.scene.remove(this.marker);
    }
    
    const target = obj.target;
    if (!target) return;
    
    const geo = new THREE.CylinderGeometry(0.5, 2, 4, 8);
    const mat = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, 
      transparent: true, 
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    this.marker = new THREE.Mesh(geo, mat);
    this.marker.position.set(target.x, 2, target.z);
    this.world.scene.add(this.marker);
    
    this.marker.userData.pulseTime = 0;
  }

  updateCheckpointMarker() {
    if (this.marker && this.checkpoints[this.currentCheckpoint]) {
      const cp = this.checkpoints[this.currentCheckpoint];
      this.marker.position.set(cp.x, 2, cp.z);
    }
  }

  update(delta) {
    if (!this.currentMission) return;
    
    const elapsed = Date.now() / 1000 - this.missionStartTime;
    if (this.currentMission.timeLimit && elapsed > this.currentMission.timeLimit) {
      this.failMission('Time limit exceeded');
      return;
    }
    
    const obj = this.currentMission.objectives[this.currentObjectiveIndex];
    if (!obj) return;
    
    const playerPos = this.player.position;
    
    switch (obj.type) {
      case 'drive':
      case 'goto':
        const dist = distance2D(playerPos, obj.target);
        if (dist <= obj.radius) {
          this.advanceObjective();
        }
        break;
      
      case 'checkpoint':
        if (this.currentCheckpoint < this.checkpoints.length) {
          const cp = this.checkpoints[this.currentCheckpoint];
          const cpDist = distance2D(playerPos, cp);
          if (cpDist <= 10) {
            this.currentCheckpoint++;
            if (this.audio) this.audio.play('blip');
            if (this.currentCheckpoint >= this.checkpoints.length) {
              this.advanceObjective();
            } else {
              this.updateCheckpointMarker();
              if (this.ui) this.ui.setMissionObjective('Checkpoint ' + (this.currentCheckpoint + 1) + ' / ' + this.checkpoints.length);
            }
          }
        }
        break;
      
      case 'kill':
        break;
      
      case 'collect':
        for (let i = obj.items.length - 1; i >= 0; i--) {
          const item = obj.items[i];
          const itemPos = new THREE.Vector3(item.x, 0, item.z);
          if (distance2D(playerPos, itemPos) <= 3) {
            obj.items.splice(i, 1);
            if (this.audio) this.audio.play('pickup');
            if (this.ui) this.ui.setMissionObjective('Packages: ' + obj.items.length + ' remaining');
          }
        }
        if (obj.items.length === 0) {
          this.advanceObjective();
        }
        break;
      
      case 'destroy_heli':
        if (this.world.police && !this.world.police.helicopter) {
          this.advanceObjective();
        }
        break;
      
      case 'escape':
        const escapeDist = distance2D(playerPos, obj.target);
        if (escapeDist >= obj.radius) {
          this.advanceObjective();
        }
        break;
      
      case 'survive':
        const surviveElapsed = Date.now() / 1000 - this.objectiveStartTime;
        if (surviveElapsed >= obj.duration) {
          this.advanceObjective();
        } else if (this.ui) {
          this.ui.setMissionObjective(obj.description + ' - ' + Math.ceil(obj.duration - surviveElapsed) + 's');
        }
        break;
    }
    
    if (this.marker) {
      this.marker.userData.pulseTime += delta;
      this.marker.scale.y = 1 + Math.sin(this.marker.userData.pulseTime * 3) * 0.1;
      this.marker.rotation.y += delta;
    }
  }

  advanceObjective() {
    if (this.marker) {
      this.world.scene.remove(this.marker);
      this.marker = null;
    }
    
    if (this.audio) this.audio.play('objective_complete');
    
    this.beginObjective(this.currentObjectiveIndex + 1);
  }

  completeMission() {
    if (!this.currentMission) return;
    
    const rewards = this.currentMission.rewards;
    this.player.addCash(rewards.cash);
    this.player.addRep(rewards.rep);
    
    this.completedMissions.push(this.currentMission.id);
    
    for (const unlock of this.currentMission.unlocks) {
      if (!this.availableMissions.includes(unlock)) {
        this.availableMissions.push(unlock);
      }
    }
    
    if (this.ui) {
      this.ui.showMissionBanner('MISSION COMPLETE: ' + this.currentMission.name, rewards);
    }
    
    if (this.dialogue) {
      this.dialogue.show(this.currentMission.giver, this.currentMission.giverPortrait, 
        'Good work. Here is your cut: $' + rewards.cash + '.', null);
    }
    
    if (this.onMissionComplete) {
      this.onMissionComplete(this.currentMission, rewards);
    }
    
    this.currentMission = null;
    this.currentObjectiveIndex = 0;
    this.checkpoints = [];
    this.currentCheckpoint = 0;
  }

  failMission(reason) {
    if (!this.currentMission) return;
    
    if (this.ui) {
      this.ui.showMissionBanner('MISSION FAILED: ' + reason, null);
    }
    
    if (this.onMissionFail) {
      this.onMissionFail(this.currentMission, reason);
    }
    
    if (this.marker) {
      this.world.scene.remove(this.marker);
      this.marker = null;
    }
    this.currentMission = null;
    this.currentObjectiveIndex = 0;
    this.checkpoints = [];
    this.currentCheckpoint = 0;
  }

  getAvailableMissions() {
    return this.availableMissions.map(id => this.missions.find(m => m.id === id)).filter(Boolean);
  }

  getCurrentMission() {
    return this.currentMission;
  }

  getCurrentObjective() {
    if (!this.currentMission) return null;
    return this.currentMission.objectives[this.currentObjectiveIndex];
  }
}
