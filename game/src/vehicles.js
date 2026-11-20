/**
 * Vehicles for Maravilla - parked cars, traffic AI, player driving
 */
import { VEHICLE, TRAFFIC } from './config.js';
import { clamp, lerp, angleDiff, wrapAngle, normalizeVec2, vec2Length, distance2D } from './math.js';
import * as THREE from 'three';

export const CAR_TYPES = [
  { name: 'Vesper', color: 0x1a1a2e, maxSpeed: 40, accel: 18, steer: 2.2, weight: 1500 },
  { name: 'Solano', color: 0xd4a574, maxSpeed: 35, accel: 15, steer: 2.0, weight: 1700 },
  { name: 'Marinero', color: 0x4a90d9, maxSpeed: 45, accel: 20, steer: 2.5, weight: 1300 },
  { name: 'Crucero', color: 0xf4c2a0, maxSpeed: 38, accel: 16, steer: 2.1, weight: 1600 },
  { name: 'Interceptor', color: 0x1a1a2e, maxSpeed: 48, accel: 22, steer: 2.6, weight: 1400 },
  { name: 'Taxi', color: 0xffcc00, maxSpeed: 37, accel: 17, steer: 2.2, weight: 1500 },
];

export class Vehicle {
  constructor(world, position, heading, type = 0) {
    this.world = world;
    this.typeIndex = type;
    this.type = typeof type === 'number' ? CAR_TYPES[type] : (CAR_TYPES.find(t => t.name.toLowerCase() === type.toLowerCase()) || CAR_TYPES[0]);
    this.name = this.type.name;
    
    // Physics
    this.position = position.clone();
    this.heading = heading;
    this.speed = 0;
    this.velocity = new THREE.Vector3();
    this.steering = 0;
    
    // State
    this.driver = null;
    this.isPlayer = false;
    this.isTraffic = false;
    this.isPolice = false;
    this.officer = null;
    this.health = 500;
    this.isAlive = true;
    
    // Wheel orientation for visuals
    this.wheelRot = 0;
    
    // 3D model
    this.mesh = this.createMesh();
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;
    
    // Collision box
    this.width = 2.0;
    this.length = 4.5;
    this.height = 1.5;
  }

  createMesh() {
    const group = new THREE.Group();
    
    // Body
    const bodyGeo = new THREE.BoxGeometry(2.0, 0.8, 4.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: this.type.color, roughness: 0.3, metalness: 0.6 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.7;
    body.castShadow = true;
    group.add(body);
    
    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.6, 0.6, 2.0);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.1, metalness: 0.8 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.2, -0.3);
    cabin.castShadow = true;
    group.add(cabin);
    
    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 8);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const wheelPositions = [[-0.9, 0.35, 1.5], [0.9, 0.35, 1.5], [-0.9, 0.35, -1.5], [0.9, 0.35, -1.5]];
    for (const [x, y, z] of wheelPositions) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(x, y, z);
      wheel.castShadow = true;
      group.add(wheel);
      this.wheelMesh = wheel;
    }
    
    // Headlights
    const lightGeo = new THREE.BoxGeometry(0.3, 0.15, 0.1);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    const hl1 = new THREE.Mesh(lightGeo, lightMat);
    hl1.position.set(-0.7, 0.6, 2.25);
    const hl2 = new THREE.Mesh(lightGeo, lightMat);
    hl2.position.set(0.7, 0.6, 2.25);
    group.add(hl1, hl2);
    
    // Taillights
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const tl1 = new THREE.Mesh(lightGeo, tailMat);
    tl1.position.set(-0.7, 0.6, -2.25);
    const tl2 = new THREE.Mesh(lightGeo, tailMat);
    tl2.position.set(0.7, 0.6, -2.25);
    group.add(tl1, tl2);
    
    return group;
  }

  update(delta, player) {
    if (!this.isAlive) return;
    
    if (this.isPlayer && this.driver) {
      this.updatePlayerControl(delta, player);
    } else if (this.isTraffic && this.isAlive) {
      this.updateTraffic(delta);
    } else if (this.isPolice && this.isAlive) {
      this.updatePolice(delta);
    }
    
    // Physics integration
    this.integrate(delta);
    
    // Update mesh
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;
    
    // Wheel rotation
    if (this.wheelMesh) {
      this.wheelMesh.rotation.x += this.speed * delta * 2;
    }
  }

  updatePlayerControl(delta, player) {
    const input = player.input;
    
    // Acceleration/braking
    const forward = input.isDown('KeyW') ? 1 : (input.isDown('KeyS') ? -0.5 : 0);
    const reverse = input.isDown('KeyS') && this.speed < 0.5;
    
    if (forward > 0) {
      this.speed = Math.min(this.speed + this.type.accel * forward * delta, this.type.maxSpeed);
    } else if (reverse) {
      this.speed = Math.max(this.speed - this.type.accel * 0.5 * delta, -this.type.maxSpeed * 0.3);
    } else if (input.isDown('KeyA') || input.isDown('KeyD')) {
      // Coast
      this.speed *= (1 - 0.02);
    } else if (input.isDown('ShiftLeft') || input.isDown('ShiftRight')) {
      // Handbrake
      this.speed *= (1 - VEHICLE.handbrakeForce * delta);
    } else {
      // Natural deceleration
      this.speed *= (1 - VEHICLE.drag * delta);
    }
    
    // Steering
    const steerInput = (input.isDown('KeyD') ? 1 : 0) - (input.isDown('KeyA') ? 1 : 0);
    const speedFactor = clamp(this.speed / this.type.maxSpeed, 0, 1);
    
    // Handbrake enables drift
    const drifting = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
    const steerMult = drifting ? 1.4 : 1;
    this.steering = lerp(this.steering, steerInput * this.type.steer * steerMult * speedFactor, 5 * delta);
    
    // Apply steering to heading
    this.heading += this.steering * delta * (this.speed / Math.max(1, Math.abs(this.speed)));
    
    // Drift effects
    if (drifting && Math.abs(this.speed) > 10) {
      // Add lateral slide
      if (player) player.addRep(0.5 * delta);
    }
  }

  updateTraffic(delta) {
    // Simple traffic: follow the road, avoid player
    const player = this.world.getPlayerPosition();
    
    // Follow road grid direction
    const roadDir = this.getRoadDirection();
    
    // Seek target position ahead
    const targetSpeed = TRAFFIC.speedLimit;
    this.speed = lerp(this.speed, targetSpeed, 2 * delta);
    
    // Avoid player
    if (player && distance2D(this.position, player) < 30) {
      this.speed = Math.min(this.speed, 5);
    }
    
    // Smooth steering towards road direction
    const targetHeading = Math.atan2(roadDir.z, roadDir.x);
    const diff = angleDiff(targetHeading, this.heading);
    this.heading += diff * 3 * delta;
    
    // Speed up on straights, slow down at corners
    this.heading += diff * 0.5;
  }

  updatePolice(delta) {
    const player = this.world.getPlayerPosition();
    if (!player) return;
    
    const dist = distance2D(this.position, player);
    
    if (dist < 100) {
      // Chase player
      const dir = normalizeVec2({
        x: player.x - this.position.x,
        z: player.z - this.position.z
      });
      
      const targetHeading = Math.atan2(dir.z, dir.x);
      const diff = angleDiff(targetHeading, this.heading);
      this.heading += clamp(diff, -4 * delta, 4 * delta);
      
      // Speed
      const targetSpeed = this.type.maxSpeed * 0.9;
      this.speed = lerp(this.speed, targetSpeed, 5 * delta);
      
      // Ram/PIT
      if (dist < 12) {
        if (this.type.maxSpeed > 40) {
          this.speed = this.type.maxSpeed;
          this.heading += this.heading * 0.1;
        }
      }
    } else {
      // Return to road
      this.updateTraffic(delta);
    }
  }

  getRoadDirection() {
    // Roads are at multiples of 120
    const roadSpacing = 120;
    const nearestX = Math.round(this.position.x / roadSpacing) * roadSpacing;
    const nearestZ = Math.round(this.position.z / roadSpacing) * roadSpacing;
    
    // Check if closer to X or Z road
    const distX = Math.abs(this.position.x - nearestX);
    const distZ = Math.abs(this.position.z - nearestZ);
    
    if (distX < distZ) {
      // On X road, drive along Z
      return new THREE.Vector3(0, 0, 1);
    } else {
      // On Z road, drive along X
      return new THREE.Vector3(1, 0, 0);
    }
  }

  integrate(delta) {
    // Convert heading + speed to velocity
    this.velocity.x = Math.sin(this.heading) * this.speed;
    this.velocity.z = Math.cos(this.heading) * this.speed;
    
    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;
    
    // Ground
    this.position.y = 0.7;
    
    // City boundaries
    this.position.x = clamp(this.position.x, -2000, 2000);
    this.position.z = clamp(this.position.z, -2000, 2000);
  }

  setDriver(driver) {
    this.driver = driver;
    if (driver) {
      this.isPlayer = true;
      this.isTraffic = false;
      this.isPolice = false;
    } else {
      this.isPlayer = false;
    }
  }

  setTraffic() {
    this.isTraffic = true;
    this.isPlayer = false;
    this.isPolice = false;
    this.driver = null;
  }

  setPolice(officer) {
    this.isPolice = true;
    this.isTraffic = false;
    this.isPlayer = false;
    this.officer = officer;
  }

  takeDamage(amount) {
    if (!this.isAlive) return;
    this.health -= amount;
    if (this.health <= 0) {
      this.isAlive = false;
      this.speed = 0;
      if (this.driver) this.driver.exitVehicle();
    }
  }

  getSpeedKmh() {
    return Math.abs(this.speed) * 3.6;
  }
}

export function spawnTraffic(world, rng) {
  const vehicles = [];
  
  // Spawn on road grid
  const roadSpacing = 120;
  for (let i = 0; i < TRAFFIC.maxCars / 2; i++) {
    const x = rng.nextInt(-1600, 1600);
    const z = rng.nextInt(-1600, 1600);
    
    // Snap to nearest road
    const nearestX = Math.round(x / roadSpacing) * roadSpacing;
    const nearestZ = Math.round(z / roadSpacing) * roadSpacing;
    
    const point = Math.random() < 0.5 ? [nearestX, z] : [x, nearestZ];
    
    const type = rng.nextInt(0, CAR_TYPES.length - 1);
    const heading = Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2;
    const vehicle = new Vehicle(world, new THREE.Vector3(point[0], 0.7, point[1]), heading, type);
    vehicle.setTraffic();
    vehicles.push(vehicle);
    world.scene.add(vehicle.mesh);
    world.vehicles.push(vehicle);
  }
  
  return vehicles;
}
