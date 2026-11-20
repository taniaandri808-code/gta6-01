/**
 * World generation for Maravilla - city geometry, districts, buildings, roads, water, palms
 */
import { DISTRICTS, WORLD } from './config.js';
import { SeededRandom } from './random.js';
import * as THREE from 'three';

const rng = new SeededRandom(WORLD.seed);

const buildingGeometries = [];
const buildingMaterials = [];

function createBuildingGeometry() {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0);
  return geo;
}

function createPalmGeometry() {
  const group = new THREE.Group();
  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 8, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.9 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 4;
  trunk.castShadow = true;
  group.add(trunk);
  
  // Fronds
  const frondGeo = new THREE.PlaneGeometry(3, 1.5);
  const frondMat = new THREE.MeshStandardMaterial({ 
    color: 0x2d8a2d, 
    roughness: 0.8,
    side: THREE.DoubleSide,
    alphaTest: 0.5,
    transparent: true
  });
  for (let i = 0; i < 6; i++) {
    const frond = new THREE.Mesh(frondGeo, frondMat);
    frond.position.y = 7.5 + i * 0.3;
    frond.rotation.y = (i / 6) * Math.PI * 2;
    frond.rotation.x = -0.3;
    frond.castShadow = true;
    group.add(frond);
  }
  return group;
}

function createStreetLightGeometry() {
  const group = new THREE.Group();
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 6, 6);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 3;
  pole.castShadow = true;
  group.add(pole);
  
  const lightGeo = new THREE.BoxGeometry(1.2, 0.15, 0.4);
  const lightMat = new THREE.MeshStandardMaterial({ 
    color: 0xfff8e7,
    emissive: 0xfff8e7,
    emissiveIntensity: 2,
    roughness: 0.3
  });
  const light = new THREE.Mesh(lightGeo, lightMat);
  light.position.set(0.6, 5.9, 0);
  light.castShadow = true;
  group.add(light);
  
  // Point light
  const pointLight = new THREE.PointLight(0xfff8e7, 0.5, 20, 2);
  pointLight.position.set(0.6, 5.9, 0);
  group.add(pointLight);
  group.userData.light = pointLight;
  
  return group;
}

export function createWorld(scene) {
  const worldGroup = new THREE.Group();
  worldGroup.name = 'World';
  
  // Ground plane
  const groundSize = WORLD.cityRadius * 2;
  const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, 64, 64);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x3a4a3a,
    roughness: 0.9,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  worldGroup.add(ground);
  
  // Water plane
  const waterGeo = new THREE.PlaneGeometry(groundSize * 1.5, groundSize * 1.5);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x1a3a5c,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = WORLD.waterLevel;
  water.position.z = -groundSize * 0.3;
  water.receiveShadow = true;
  worldGroup.add(water);
  worldGroup.userData.water = water;
  
  // Beach sand
  const beachGeo = new THREE.PlaneGeometry(groundSize * 1.5, 300);
  const beachMat = new THREE.MeshStandardMaterial({
    color: 0xf4d8a0,
    roughness: 0.95,
  });
  const beach = new THREE.Mesh(beachGeo, beachMat);
  beach.rotation.x = -Math.PI / 2;
  beach.position.y = 0.3;
  beach.position.z = -groundSize * 0.3 + 150;
  beach.receiveShadow = true;
  worldGroup.add(beach);
  
  // Roads grid
  const roadWidth = 12;
  const roadSpacing = 120;
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.9,
  });
  
  // Main roads - X axis
  for (let x = -WORLD.cityRadius; x <= WORLD.cityRadius; x += roadSpacing) {
    const roadGeo = new THREE.PlaneGeometry(roadWidth, WORLD.cityRadius * 2);
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(x, 0.15, 0);
    road.receiveShadow = true;
    worldGroup.add(road);
  }
  
  // Main roads - Z axis
  for (let z = -WORLD.cityRadius; z <= WORLD.cityRadius; z += roadSpacing) {
    const roadGeo = new THREE.PlaneGeometry(WORLD.cityRadius * 2, roadWidth);
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.15, z);
    road.receiveShadow = true;
    worldGroup.add(road);
  }
  
  // Road markings
  const markingMat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8 });
  const dashGeo = new THREE.PlaneGeometry(0.3, 3);
  for (let x = -WORLD.cityRadius; x <= WORLD.cityRadius; x += roadSpacing) {
    for (let z = -WORLD.cityRadius; z <= WORLD.cityRadius; z += 6) {
      const dash = new THREE.Mesh(dashGeo, markingMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(x, 0.16, z);
      worldGroup.add(dash);
    }
  }
  for (let z = -WORLD.cityRadius; z <= WORLD.cityRadius; z += roadSpacing) {
    for (let x = -WORLD.cityRadius; x <= WORLD.cityRadius; x += 6) {
      const dash = new THREE.Mesh(dashGeo, markingMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(x, 0.16, z);
      worldGroup.add(dash);
    }
  }
  
  // District buildings
  const buildingMatBase = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.1 });
  
  for (const district of DISTRICTS) {
    const bounds = district.bounds || { minX: district.center.x - district.radius, maxX: district.center.x + district.radius, minZ: district.center.z - district.radius, maxZ: district.center.z + district.radius };
    const density = district.density ?? district.buildingDensity ?? 0.5;
    const width = bounds.maxX - bounds.minX;
    const depth = bounds.maxZ - bounds.minZ;
    const blocksX = Math.floor(width / 60);
    const blocksZ = Math.floor(depth / 60);
    
    for (let bx = 0; bx < blocksX; bx++) {
      for (let bz = 0; bz < blocksZ; bz++) {
        if (rng.next() > density) continue;
        
        const blockX = bounds.minX + bx * 60 + rng.nextFloat(-10, 10);
        const blockZ = bounds.minZ + bz * 60 + rng.nextFloat(-10, 10);
        
        const buildingCount = rng.nextInt(1, 4);
        for (let i = 0; i < buildingCount; i++) {
          const bw = rng.nextFloat(15, 30);
          const bd = rng.nextFloat(15, 30);
          const bh = rng.nextFloat(district.buildingHeight.min, district.buildingHeight.max);
          
          const bx_pos = blockX + rng.nextFloat(-10, 10);
          const bz_pos = blockZ + rng.nextFloat(-10, 10);
          
          // Vary color per district
          const hueShift = rng.nextFloat(-0.05, 0.05);
          const color = new THREE.Color(district.color);
          color.offsetHSL(hueShift, rng.nextFloat(-0.1, 0.1), rng.nextFloat(-0.1, 0.1));
          
          const mat = buildingMatBase.clone();
          mat.color.copy(color);
          
          const geo = new THREE.BoxGeometry(bw, bh, bd);
          geo.translate(0, bh / 2, 0);
          
          const building = new THREE.Mesh(geo, mat);
          building.position.set(bx_pos, 0, bz_pos);
          building.castShadow = true;
          building.receiveShadow = true;
          worldGroup.add(building);
          
          // Add windows as emissive strips
          if (rng.next() > 0.5) {
            const windowGeo = new THREE.PlaneGeometry(bw * 0.8, bh * 0.8);
            const windowMat = new THREE.MeshBasicMaterial({
              color: 0xffffee,
              transparent: true,
              opacity: 0.6,
              side: THREE.DoubleSide
            });
            const windows = new THREE.Mesh(windowGeo, windowMat);
            windows.position.set(bx_pos, bh * 0.1, bz_pos + bd / 2 + 0.01);
            worldGroup.add(windows);
          }
        }
      }
    }
  }
  
  // Palm trees along beach and streets
  const palmProto = createPalmGeometry();
  for (let i = 0; i < 150; i++) {
    const angle = rng.next() * Math.PI * 2;
    const radius = rng.nextFloat(200, 1400);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    // Only place palms near water (negative Z) or along roads
    if (z < 100 || Math.abs(x % 120) < 15 || Math.abs(z % 120) < 15) {
      const palm = palmProto.clone();
      palm.position.set(x, 0, z);
      palm.rotation.y = rng.next() * Math.PI * 2;
      palm.scale.setScalar(rng.nextFloat(0.8, 1.3));
      worldGroup.add(palm);
    }
  }
  
  // Street lights along roads
  const lightProto = createStreetLightGeometry();
  for (let x = -WORLD.cityRadius; x <= WORLD.cityRadius; x += roadSpacing) {
    for (let z = -WORLD.cityRadius; z <= WORLD.cityRadius; z += 40) {
      if (rng.next() > 0.7) continue;
      const light = lightProto.clone();
      light.position.set(x + 7, 0, z);
      worldGroup.add(light);
      
      const light2 = lightProto.clone();
      light2.position.set(x - 7, 0, z);
      worldGroup.add(light2);
    }
  }
  for (let z = -WORLD.cityRadius; z <= WORLD.cityRadius; z += roadSpacing) {
    for (let x = -WORLD.cityRadius; x <= WORLD.cityRadius; x += 40) {
      if (rng.next() > 0.7) continue;
      const light = lightProto.clone();
      light.position.set(x, 0, z + 7);
      worldGroup.add(light);
      
      const light2 = lightProto.clone();
      light2.position.set(x, 0, z - 7);
      worldGroup.add(light2);
    }
  }
  
  // Safehouse marker
  const safehouseGeo = new THREE.CylinderGeometry(5, 5, 0.5, 16);
  const safehouseMat = new THREE.MeshBasicMaterial({ 
    color: 0x00ff88, 
    transparent: true, 
    opacity: 0.3,
    side: THREE.DoubleSide
  });
  const safehouse = new THREE.Mesh(safehouseGeo, safehouseMat);
  safehouse.position.set(-500, 0.3, 300);
  worldGroup.add(safehouse);
  worldGroup.userData.safehouse = safehouse;
  
  // Garage area
  const garageGeo = new THREE.BoxGeometry(20, 4, 30);
  const garageMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
  const garage = new THREE.Mesh(garageGeo, garageMat);
  garage.position.set(-500, 2, 350);
  garage.castShadow = true;
  garage.receiveShadow = true;
  worldGroup.add(garage);
  worldGroup.userData.garage = garage;
  
  // Garage door opening
  const doorGeo = new THREE.BoxGeometry(12, 3.5, 0.2);
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(-500, 1.75, 335);
  worldGroup.add(door);
  
  scene.add(worldGroup);
  
  return {
    group: worldGroup,
    water,
    safehouse,
    garage,
    districts: DISTRICTS,
  };
}

// Update water animation
export function updateWorld(world, time) {
  if (world.water) {
    world.water.material.emissiveIntensity = 0.1 + Math.sin(time * 2) * 0.05;
    // Simple wave effect via vertex displacement would need custom shader
    // For now just color shift
  }
  
  // Update street light intensity based on time of day
  world.group.traverse(obj => {
    if (obj.userData.light && obj.userData.light.isPointLight) {
      const hour = (time / 60) % 24;
      obj.userData.light.intensity = (hour > 6 && hour < 20) ? 0 : 0.8;
    }
  });
}
