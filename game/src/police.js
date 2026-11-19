/**
 * Police/wanted system for Maravilla
 */
import { WANTED, COPS, CAR_TYPES } from './config.js';
import { clamp, distance2D, lerp, angleDiff, wrapAngle, normalizeVec2, vec2Length, vec2Add, vec2Scale, randomRange, randomChoice } from './math.js';
import * as THREE from 'three';

class CopCar {
  constructor(world, position, officerName, tactic) {
    this.world = world;
    this.position = position.clone();
    this.velocity = new THREE.Vector3();
    this.heading = 0;
    this.speed = 0;
    this.maxSpeed = 48;
    this.accel = 22;
    this.steer = 2.6;
    this.officerName = officerName;
    this.tactic = tactic;
    this.state = 'PURSUE';
    this.targetPosition = new THREE.Vector3();
    this.roadblockPosition = null;
    
    // Create mesh (Interceptor)
    const type = CAR_TYPES.find(t => t.name === 'Interceptor');
    const bodyGeo = new THREE.BoxGeometry(4.5, 1.4, 2.2);
    bodyGeo.translate(0, 0.7, 0);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x001133, roughness: 0.4, metalness: 0.3 });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.castShadow = true;
    
    const cabinGeo = new THREE.BoxGeometry(2.5, 1.2, 2.0);
    cabinGeo.translate(0, 1.7, -0.3);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x001133, roughness: 0.4 });
    this.cabin = new THREE.Mesh(cabinGeo, cabinMat);
    this.cabin.castShadow = true;
    
    this.mesh = new THREE.Group();
    this.mesh.add(this.body);
    this.mesh.add(this.cabin);
    
    // Police lights
    this.lightBar = new THREE.Group();
    const barGeo = new THREE.BoxGeometry(2.0, 0.3, 0.5);
    const blueMat = new THREE.MeshBasicMaterial({ color: 0x0066ff });
    const redMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.blueLight = new THREE.Mesh(barGeo, blueMat);
    this.blueLight.position.set(-0.6, 1.5, 1.15);
    this.redLight = new THREE.Mesh(barGeo, redMat);
    this.redLight.position.set(0.6, 1.5, 1.15);
    this.lightBar.add(this.blueLight);
    this.lightBar.add(this.redLight);
    this.mesh.add(this.lightBar);
    
    this.mesh.position.copy(this.position);
    this.world.scene.add(this.mesh);
    this.world.copCars.push(this);
  }

  getDistanceToPlayer() {
    return distance2D(this.position, this.world.player.position);
  }

  update(delta, playerPos) {
    this.targetPosition.copy(playerPos);
    
    // Compute desired heading toward player
    const dx = this.targetPosition.x - this.position.x;
    const dz = this.targetPosition.z - this.position.z;
    const desiredHeading = Math.atan2(dx, dz);
    
    // Apply tactic-specific behavior
    if (this.tactic === 'RAM') {
      this.maxSpeed = 52;
      this.accel = 24;
    } else if (this.tactic === 'PURSUIT BOX') {
      // Try to flank - approach from side
      const perp = wrapAngle(desiredHeading + Math.PI / 2);
      this.targetPosition.x += Math.sin(perp) * 15;
      this.targetPosition.z += Math.cos(perp) * 15;
    } else if (this.tactic === 'ROADBLOCK') {
      if (!this.roadblockPosition) {
        // Set up roadblock ahead of player
        const aheadX = playerPos.x + Math.sin(this.world.player.heading || 0) * 80;
        const aheadZ = playerPos.z + Math.cos(this.world.player.heading || 0) * 80;
        this.roadblockPosition = new THREE.Vector3(aheadX, 0, aheadZ);
      }
      this.targetPosition.copy(this.roadblockPosition);
      if (distance2D(this.position, this.roadblockPosition) < 5) {
        this.speed = 0;
        this.state = 'ROADBLOCK';
      }
    }
    
    // Steer toward target
    let diff = angleDiff(this.heading, desiredHeading);
    const maxTurn = this.steer * delta;
    diff = clamp(diff, -maxTurn, maxTurn);
    this.heading = wrapAngle(this.heading + diff);
    
    // Accelerate
    this.speed = clamp(this.speed + this.accel * delta, 0, this.maxSpeed);
    
    // Physics
    this.velocity.x = Math.sin(this.heading) * this.speed;
    this.velocity.z = Math.cos(this.heading) * this.speed;
    this.position.addScaledVector(this.velocity, delta);
    
    // Keep on ground
    this.position.y = 1;
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;
    
    // Flash lights
    const flash = Math.floor(Date.now() / 100) % 2;
    this.blueLight.visible = flash === 0;
    this.redLight.visible = flash === 1;
  }

  dispose() {
    this.world.scene.remove(this.mesh);
    const idx = this.world.copCars.indexOf(this);
    if (idx >= 0) this.world.copCars.splice(idx, 1);
  }
}

class PoliceHelicopter {
  constructor(world) {
    this.world = world;
    this.position = new THREE.Vector3(0, 50, 0);
    this.velocity = new THREE.Vector3();
    this.targetPosition = new THREE.Vector3();
    this.state = 'SEARCH';
    
    // Helicopter body
    const bodyGeo = new THREE.BoxGeometry(3, 1, 8);
    bodyGeo.translate(0, 0, 0);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x001133, roughness: 0.4, metalness: 0.3 });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.castShadow = true;
    
    // Tail
    const tailGeo = new THREE.BoxGeometry(0.5, 1.5, 4);
    tailGeo.translate(0, 0.5, 5.5);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.castShadow = true;
    
    // Main rotor
    this.rotorGeo = new THREE.CylinderGeometry(6, 6, 0.1, 4);
    const rotorMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, side: THREE.DoubleSide });
    this.mainRotor = new THREE.Mesh(this.rotorGeo, rotorMat);
    this.mainRotor.position.set(0, 2.5, 0);
    
    // Tail rotor
    const tailRotorGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.05, 4);
    this.tailRotor = new THREE.Mesh(tailRotorGeo, rotorMat);
    this.tailRotor.position.set(0, 1.5, 7.5);
    this.tailRotor.rotation.z = Math.PI / 2;
    
    // Searchlight
    this.searchlight = new THREE.SpotLight(0xffffff, 2.5, 100, Math.PI / 6, 0.5, 1);
    this.searchlight.position.set(0, 0, 0);
    this.searchlight.target = new THREE.Object3D();
    this.searchlight.target.position.set(0, -100, 0);
    this.searchlight.castShadow = true;
    this.searchlight.shadow.mapSize.width = 512;
    this.searchlight.shadow.mapSize.height = 512;
    
    this.mesh = new THREE.Group();
    this.mesh.add(this.body);
    this.mesh.add(tail);
    this.mesh.add(this.mainRotor);
    this.mesh.add(this.tailRotor);
    this.mesh.add(this.searchlight);
    this.mesh.add(this.searchlight.target);
    
    this.mesh.position.copy(this.position);
    this.world.scene.add(this.mesh);
    this.world.policeHelicopter = this;
    
    this.rotorSpeed = 0;
  }

  update(delta, playerPos) {
    if (!this.world.player) return;
    
    // Spin rotors
    this.rotorSpeed = Math.min(this.rotorSpeed + delta * 10, 50);
    this.mainRotor.rotation.y += this.rotorSpeed * delta;
    this.tailRotor.rotation.x += this.rotorSpeed * delta * 2;
    
    // Follow player with offset
    this.targetPosition.set(
      playerPos.x + Math.sin(Date.now() / 3000) * 30,
      50,
      playerPos.z + Math.cos(Date.now() / 3000) * 30
    );
    
    // Smooth follow
    this.position.lerp(this.targetPosition, 0.02);
    this.mesh.position.copy(this.position);
    
    // Point searchlight at player
    this.searchlight.target.position.set(playerPos.x, 0, playerPos.z);
    this.searchlight.target.updateMatrixWorld();
    
    // Sweep searchlight
    const sweepAngle = Math.sin(Date.now() / 2000) * 0.3;
    this.searchlight.target.position.x += Math.sin(sweepAngle) * 20;
    this.searchlight.target.position.z += Math.cos(sweepAngle) * 20;
  }

  dispose() {
    this.world.scene.remove(this.mesh);
    this.world.policeHelicopter = null;
  }
}

export class PoliceSystem {
  constructor(world) {
    this.world = world;
    this.wantedLevel = 0;
    this.wantedScore = 0;
    this.copCars = [];
    this.helicopter = null;
    this.lastSpawnTime = 0;
    this.spawnCooldown = 5;
    this.lastDecayTime = 0;
  }

  addWanted(amount) {
    this.wantedScore = Math.min(this.wantedScore + amount, WANTED.starThresholds[WANTED.maxStars - 1] * 2);
    const newLevel = Math.min(WANTED.maxStars, WANTED.starThresholds.findIndex(t => this.wantedScore < t));
    if (newLevel === -1) this.wantedLevel = WANTED.maxStars;
    else this.wantedLevel = Math.max(this.wantedLevel, newLevel + 1);
    
    // Spawn helicopter at 3+ stars
    if (this.wantedLevel >= WANTED.helicopterSpawnStars && !this.helicopter) {
      this.helicopter = new PoliceHelicopter(this.world);
    }
  }

  update(delta) {
    const player = this.world.player;
    if (!player) return;

    // Decay wanted level
    if (this.wantedScore > 0) {
      this.wantedScore = Math.max(0, this.wantedScore - WANTED.starDecayRate * delta);
      const newLevel = Math.min(WANTED.maxStars, WANTED.starThresholds.findIndex(t => this.wantedScore < t));
      if (newLevel === -1) this.wantedLevel = WANTED.maxStars;
      else this.wantedLevel = Math.max(0, newLevel + 1);
      
      // Remove helicopter if stars drop below 3
      if (this.wantedLevel < WANTED.helicopterSpawnStars && this.helicopter) {
        this.helicopter.dispose();
        this.helicopter = null;
      }
    }

    // Spawn cop cars
    this.lastSpawnTime += delta;
    if (this.wantedLevel > 0 && this.lastSpawnTime > this.spawnCooldown) {
      const chance = WANTED.copCarSpawnChance[this.wantedLevel - 1] || 0;
      if (Math.random() < chance && this.copCars.length < this.wantedLevel * 2) {
        this.spawnCopCar(player.position);
      }
      this.lastSpawnTime = 0;
    }

    // Update cop cars
    for (const cop of this.copCars) {
      cop.update(delta, player.position);
      
      // Check if cop is too far - despawn
      if (cop.getDistanceToPlayer() > 300) {
        cop.dispose();
      }
    }
    this.copCars = this.copCars.filter(c => !c.disposed);

    // Update helicopter
    if (this.helicopter) {
      this.helicopter.update(delta, player.position);
    }
  }

  spawnCopCar(playerPos) {
    // Spawn on road near player
    const roadSpacing = 120;
    const roadX = Math.round((playerPos.x + randomRange(-200, 200)) / roadSpacing) * roadSpacing;
    const roadZ = Math.round((playerPos.z + randomRange(-200, 200)) / roadSpacing) * roadSpacing;
    
    const spawnPos = new THREE.Vector3(roadX, 1, roadZ);
    if (distance2D(spawnPos, playerPos) < 30) return;
    
    const officerName = randomChoice(COPS.names);
    const tactic = randomChoice(COPS.tactics);
    const cop = new CopCar(this.world, spawnPos, officerName, tactic);
    
    // Store reference for HUD panel
    cop.officerName = officerName;
    cop.tactic = tactic;
  }

  getActiveCops() {
    return this.copCars.map(cop => ({
      name: cop.officerName,
      tactic: cop.tactic,
      distance: Math.round(cop.getDistanceToPlayer()),
      speed: Math.round(cop.speed * 3.6)
    }));
  }
}

// Fix: add disposed flag to CopCar
CopCar.prototype.disposed = false;
const originalDispose = CopCar.prototype.dispose;
CopCar.prototype.dispose = function() {
  this.disposed = true;
  originalDispose.call(this);
};
