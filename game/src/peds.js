/**
 * Pedestrian system for Maravilla - walkers, fleers, NPCs
 */
import { PEDS } from './config.js';
import { clamp, distance2D, lerp, normalizeVec2 } from './math.js';
import * as THREE from 'three';

const SKINS = [
  { skin: 0xf4c2a0, shirt: 0x4a90d9, pants: 0x333333, hair: 0x222222 },
  { skin: 0xf4c2a0, shirt: 0xd4a574, pants: 0x444444, hair: 0x666666 },
  { skin: 0x8d6e63, shirt: 0x2d8a2d, pants: 0x222222, hair: 0x111111 },
  { skin: 0xc9a68a, shirt: 0x9c27b0, pants: 0x333333, hair: 0x1a1a1a },
  { skin: 0xf4c2a0, shirt: 0xff5722, pants: 0x555555, hair: 0xaaaaaa },
];

export class Ped {
  constructor(world, position) {
    this.world = world;
    this.position = position.clone();
    this.position.y = 1;
    this.heading = Math.random() * Math.PI * 2;
    this.speed = 0;
    this.walkSpeed = PEDS.walkSpeed + Math.random() * 0.4;
    this.state = 'wander';
    this.fleeTarget = null;
    this.fleeTimer = 0;
    this.health = 100;
    this.isAlive = true;
    this.isMissionTarget = false;
    this.skin = SKINS[Math.floor(Math.random() * SKINS.length)];
    
    this.mesh = this.createMesh();
    this.mesh.position.copy(this.position);
  }

  createMesh() {
    const group = new THREE.Group();
    
    // Body
    const bodyGeo = new THREE.BoxGeometry(0.4, 0.7, 0.3);
    const bodyMat = new THREE.MeshStandardMaterial({ color: this.skin.shirt, roughness: 0.8 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.1;
    body.castShadow = true;
    group.add(body);
    
    // Head
    const headGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: this.skin.skin, roughness: 0.6 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.65;
    head.castShadow = true;
    group.add(head);
    
    // Hair
    const hairGeo = new THREE.SphereGeometry(0.16, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const hairMat = new THREE.MeshStandardMaterial({ color: this.skin.hair });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 1.66;
    group.add(hair);
    
    // Legs
    const legGeo = new THREE.BoxGeometry(0.12, 0.6, 0.12);
    const legMat = new THREE.MeshStandardMaterial({ color: this.skin.pants });
    const leg1 = new THREE.Mesh(legGeo, legMat);
    leg1.position.set(-0.1, 0.5, 0);
    const leg2 = new THREE.Mesh(legGeo, legMat);
    leg2.position.set(0.1, 0.5, 0);
    group.add(leg1, leg2);
    this.legs = [leg1, leg2];
    
    return group;
  }

  update(delta, time, player) {
    if (!this.isAlive) return;
    
    const playerPos = player ? player.position : null;
    const dist = playerPos ? distance2D(this.position, playerPos) : Infinity;
    
    // React to player danger
    if (playerPos && dist < PEDS.reactionDistance && !this.isMissionTarget) {
      // Check if player is dangerous (in vehicle moving fast, or has weapon)
      const playerSpeeding = player && player.vehicle && Math.abs(player.vehicle.speed) > 5;
      const playerArmed = player && player.getCurrentWeapon() !== 'fist';
      
      if (playerSpeeding || playerArmed || (player && player.world.stars > 0)) {
        this.state = 'flee';
        this.fleeTarget = this.getFleeDirection(playerPos);
        this.fleeTimer = 3 + Math.random() * 2;
      }
    }
    
    // React to being shot
    if (this.lastDamageTime && time - this.lastDamageTime < 0.5 && !this.isMissionTarget) {
      this.state = 'flee';
      this.fleeTarget = this.getFleeDirection(playerPos);
      this.fleeTimer = 5;
    }
    
    switch (this.state) {
      case 'wander':
        this.updateWander(delta);
        break;
      case 'flee':
        this.updateFlee(delta);
        if (this.fleeTimer > 0) {
          this.fleeTimer -= delta;
          if (this.fleeTimer <= 0) this.state = 'wander';
        }
        break;
    }
    
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;
    
    // Animate legs
    const walkPhase = this.speed > 0.1 ? time * 8 : 0;
    this.legs[0].rotation.x = Math.sin(walkPhase) * 0.5;
    this.legs[1].rotation.x = -Math.sin(walkPhase) * 0.5;
  }

  updateWander(delta) {
    this.speed = lerp(this.speed, this.walkSpeed, 2 * delta);
    
    // Random heading change
    this.heading += Math.sin(Date.now() / 1000 + this.position.x * 0.01) * delta;
    
    this.position.x += Math.sin(this.heading) * this.speed * delta;
    this.position.z += Math.cos(this.heading) * this.speed * delta;
    
    // Stay on sidewalks-ish
    this.position.x = clamp(this.position.x, -1900, 1900);
    this.position.z = clamp(this.position.z, -1900, 1900);
  }

  updateFlee(delta) {
    this.speed = lerp(this.speed, PEDS.fleeSpeed, 8 * delta);
    
    if (this.fleeTarget) {
      this.position.x += this.fleeTarget.x * this.speed * delta;
      this.position.z += this.fleeTarget.z * this.speed * delta;
    }
  }

  getFleeDirection(from) {
    const dx = this.position.x - from.x;
    const dz = this.position.z - from.z;
    const len = Math.sqrt(dx * dx + dz * dz) || 1;
    return { x: dx / len, z: dz / len };
  }

  takeDamage(amount) {
    if (!this.isAlive) return;
    this.health -= amount;
    this.lastDamageTime = performance.now() / 1000;
    if (this.health <= 0) {
      this.kill();
    }
  }

  kill() {
    this.isAlive = false;
    this.mesh.visible = false;
  }

  dispose() {
    this.world.scene.remove(this.mesh);
    this.world.peds = this.world.peds.filter(p => p !== this);
  }
}

export function spawnPed(world, rng) {
  const x = rng.nextFloat(-1900, 1900);
  const z = rng.nextFloat(-1900, 1900);
  const pos = new THREE.Vector3(x, 1, z);
  const ped = new Ped(world, pos);
  world.scene.add(ped.mesh);
  world.peds.push(ped);
  return ped;
}
