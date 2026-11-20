/**
 * Player controller for Maravilla - on foot and in vehicle
 */
import { PLAYER, VEHICLE } from './config.js';
import * as THREE from 'three';
import { clamp, lerp, distance2D, angleDiff, wrapAngle } from './math.js';

const STATE = {
  ON_FOOT: 'on_foot',
  IN_VEHICLE: 'in_vehicle',
  ENTERING: 'entering',
  EXITING: 'exiting',
};

export class Player {
  constructor(camera, input, world) {
    this.camera = camera;
    this.input = input;
    this.world = world;
    
    // Physics
    this.position = new THREE.Vector3(-200, 1, -150);
    this.velocity = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();
    
    // State
    this.state = STATE.ON_FOOT;
    this.vehicle = null;
    this.health = PLAYER.maxHealth;
    this.armor = 0;
    this.stamina = PLAYER.maxStamina;
    this.money = 0;
    this.rep = 0;
    
    // Movement
    this.yaw = 0;
    this.targetYaw = 0;
    this.isSprinting = false;
    this.isCrouching = false;
    this.onGround = true;
    
    // Collision capsule
    this.radius = 0.4;
    this.height = 1.8;
    
    // Visual representation
    this.mesh = this.createPlayerMesh();
    this.mesh.position.copy(this.position);
    
    // Weapons
    this.weapons = ['fist', 'pistol', 'smg', 'shotgun'];
    this.currentWeapon = 0;
    this.ammo = { fist: Infinity, pistol: 120, smg: 200, shotgun: 60 };
    this.magAmmo = { fist: 0, pistol: 15, smg: 30, shotgun: 8 };
    this.reloading = false;
    this.reloadTime = 0;
    
    // Stats
    this.kills = 0;
    this.stunts = 0;
    
    // Enter/exit cooldown
    this.enterCooldown = 0;
  }

  createPlayerMesh() {
    const group = new THREE.Group();
    
    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.0, 12);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a90d9, roughness: 0.7 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);
    
    // Head
    const headGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xf4c2a0, roughness: 0.7 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.8;
    head.castShadow = true;
    group.add(head);
    
    return group;
  }

  update(delta, time) {
    this.enterCooldown = Math.max(0, this.enterCooldown - delta);
    
    if (this.state === STATE.ON_FOOT) {
      this.updateOnFoot(delta);
    } else if (this.state === STATE.IN_VEHICLE) {
      this.updateInVehicle(delta);
    } else if (this.state === STATE.ENTERING) {
      this.updateEntering(delta);
    } else if (this.state === STATE.EXITING) {
      this.updateExiting(delta);
    }
    
    // Health regen
    if (this.health < PLAYER.maxHealth) {
      this.healthRegenTimer = (this.healthRegenTimer || 0) + delta;
      if (this.healthRegenTimer > PLAYER.healthRegenDelay) {
        this.health = Math.min(PLAYER.maxHealth, this.health + PLAYER.healthRegenRate * delta);
      }
    } else {
      this.healthRegenTimer = 0;
    }
    
    // Stamina regen
    if (this.stamina < PLAYER.maxStamina && !this.isSprinting) {
      this.stamina = Math.min(PLAYER.maxStamina, this.stamina + PLAYER.staminaRegen * delta);
    }
    
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.yaw;
  }

  updateOnFoot(delta) {
    // Get camera-relative movement
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
    
    // Input
    let moveX = 0, moveZ = 0;
    if (this.input.isDown('KeyW')) moveZ -= 1;
    if (this.input.isDown('KeyS')) moveZ += 1;
    if (this.input.isDown('KeyA')) moveX -= 1;
    if (this.input.isDown('KeyD')) moveX += 1;
    
    const inputLen = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (inputLen > 0) {
      moveX /= inputLen;
      moveZ /= inputLen;
    }
    
    // Sprint
    this.isSprinting = this.input.isDown('ShiftLeft') && this.stamina > 10 && inputLen > 0;
    this.isCrouching = this.input.isDown('ControlLeft');
    
    let speed = PLAYER.walkSpeed;
    if (this.isSprinting) {
      speed = PLAYER.sprintSpeed;
      this.stamina = Math.max(0, this.stamina - PLAYER.staminaDrain * delta);
    } else if (this.isCrouching) {
      speed = PLAYER.crouchSpeed;
    } else if (inputLen > 0) {
      speed = PLAYER.runSpeed;
    }
    
    // Calculate target velocity
    const targetVel = new THREE.Vector3();
    targetVel.addScaledVector(forward, -moveZ * speed);
    targetVel.addScaledVector(right, moveX * speed);
    
    // Smooth velocity
    this.velocity.x = lerp(this.velocity.x, targetVel.x, 10 * delta);
    this.velocity.z = lerp(this.velocity.z, targetVel.z, 10 * delta);
    
    // Jump
    if (this.input.wasPressed('Space') && this.onGround) {
      this.velocity.y = PLAYER.jumpForce;
      this.onGround = false;
    }
    
    // Gravity
    this.velocity.y += -9.81 * delta;
    
    // Apply movement
    const newPos = this.position.clone().addScaledVector(this.velocity, delta);
    
    // Simple ground collision
    if (newPos.y <= 1) {
      newPos.y = 1;
      this.velocity.y = 0;
      this.onGround = true;
    }
    
    // Wall collision (simplified - check against buildings)
    this.position.copy(newPos);
    
    // Update yaw to face movement direction
    if (inputLen > 0) {
      this.targetYaw = Math.atan2(moveX, -moveZ);
      this.yaw = lerp(this.yaw, this.targetYaw, 15 * delta);
    }
    
    // Enter vehicle
    if (this.input.wasPressed('KeyE') && this.enterCooldown === 0) {
      this.tryEnterVehicle();
    }
    
    // Weapon switch
    if (this.input.wasPressed('Digit1')) this.selectWeapon(0);
    if (this.input.wasPressed('Digit2')) this.selectWeapon(1);
    if (this.input.wasPressed('Digit3')) this.selectWeapon(2);
    if (this.input.wasPressed('Digit4')) this.selectWeapon(3);
    
    // Reload
    if (this.input.wasPressed('KeyR')) this.reload();
  }

  updateInVehicle(delta) {
    if (!this.vehicle) {
      this.exitVehicle();
      return;
    }
    
    // Vehicle handles its own physics, just sync position
    this.position.copy(this.vehicle.position);
    this.position.y = this.vehicle.position.y + 1;
    this.yaw = this.vehicle.rotation.y;
    
    // Exit vehicle
    if (this.input.wasPressed('KeyE') && this.enterCooldown === 0) {
      this.exitVehicle();
    }
    
    // Weapon switch (drive-by)
    if (this.input.wasPressed('Digit1')) this.selectWeapon(0);
    if (this.input.wasPressed('Digit2')) this.selectWeapon(1);
    if (this.input.wasPressed('Digit3')) this.selectWeapon(2);
    if (this.input.wasPressed('Digit4')) this.selectWeapon(3);
    
    // Reload
    if (this.input.wasPressed('KeyR')) this.reload();
  }

  updateEntering(delta) {
    // Animation would go here
    this.enterTimer = (this.enterTimer || 0) + delta;
    if (this.enterTimer > 1.0) {
      this.state = STATE.IN_VEHICLE;
      this.enterTimer = 0;
      this.mesh.visible = false;
      if (this.vehicle) this.vehicle.setDriver(this);
    }
  }

  updateExiting(delta) {
    this.exitTimer = (this.exitTimer || 0) + delta;
    if (this.exitTimer > 0.5) {
      this.state = STATE.ON_FOOT;
      this.exitTimer = 0;
      this.mesh.visible = true;
      this.position.copy(this.vehicle.position).add(new THREE.Vector3(3, 0, 0));
      this.vehicle.setDriver(null);
      this.vehicle = null;
      this.enterCooldown = 1.0;
    }
  }

  tryEnterVehicle() {
    // Find nearest vehicle
    let nearest = null;
    let nearestDist = PLAYER.enterVehicleRange;
    
    if (this.world.vehicles) {
      for (const v of this.world.vehicles) {
        if (v.driver) continue;
        const dist = distance2D(this.position, v.position);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = v;
        }
      }
    }
    
    if (nearest) {
      this.vehicle = nearest;
      this.state = STATE.ENTERING;
      this.enterTimer = 0;
      this.enterCooldown = 1.0;
    }
  }

  exitVehicle() {
    if (!this.vehicle) return;
    
    // Find exit position
    const exitPos = this.vehicle.position.clone().add(new THREE.Vector3(3, 0, 0));
    this.state = STATE.EXITING;
    this.exitTimer = 0;
    this.enterCooldown = 1.0;
  }

  selectWeapon(index) {
    if (index >= 0 && index < this.weapons.length) {
      this.currentWeapon = index;
    }
  }

  getCurrentWeapon() {
    return this.weapons[this.currentWeapon];
  }

  reload() {
    const weapon = this.getCurrentWeapon();
    const weaponData = { pistol: { mag: 15, ammo: this.ammo.pistol },
                         smg: { mag: 30, ammo: this.ammo.smg },
                         shotgun: { mag: 8, ammo: this.ammo.shotgun } };
    
    if (!weaponData[weapon]) return;
    
    const data = weaponData[weapon];
    const needed = data.mag - this.magAmmo[weapon];
    if (needed <= 0 || data.ammo <= 0) return;
    
    const toReload = Math.min(needed, data.ammo);
    this.magAmmo[weapon] += toReload;
    this.ammo[weapon] -= toReload;
    this.reloading = true;
    this.reloadTime = { pistol: 1.8, smg: 2.2, shotgun: 2.8 }[weapon] || 2;
  }

  shoot(targetPos) {
    const weapon = this.getCurrentWeapon();
    if (this.magAmmo[weapon] <= 0 && weapon !== 'fist') {
      this.reload();
      return null;
    }
    
    if (this.reloading) return null;
    
    this.magAmmo[weapon]--;
    
    // Return shot data for effects
    return {
      weapon,
      origin: this.getMuzzlePosition(),
      target: targetPos,
      spread: { pistol: 0.02, smg: 0.06, shotgun: 0.15 }[weapon] || 0,
    };
  }

  getMuzzlePosition() {
    if (this.state === STATE.IN_VEHICLE && this.vehicle) {
      return this.vehicle.position.clone().add(new THREE.Vector3(0, 1.5, 0));
    }
    const pos = this.position.clone();
    pos.y += 1.6;
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    pos.addScaledVector(forward, 0.5);
    return pos;
  }

  takeDamage(amount, source) {
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, amount);
      this.armor -= absorbed;
      amount -= absorbed;
    }
    this.health = Math.max(0, this.health - amount);
    this.healthRegenTimer = 0;
    
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    // Respawn at safehouse
    this.position.set(-500, 1, 300);
    this.velocity.set(0, 0, 0);
    this.health = PLAYER.maxHealth;
    this.armor = 0;
    this.money = Math.floor(this.money * 0.9); // Lose 10%
    if (this.vehicle) {
      this.vehicle.setDriver(null);
      this.vehicle = null;
    }
    this.state = STATE.ON_FOOT;
    this.mesh.visible = true;
  }

  addMoney(amount) {
    this.money += amount;
  }

  addRep(amount) {
    this.rep += amount;
  }

  getRank() {
    const { RANKS } = require('./config.js');
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (this.rep >= RANKS[i].minRep) return RANKS[i];
    }
    return RANKS[0];
  }
}
