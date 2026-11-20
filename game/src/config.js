/**
 * Configuration constants for Maravilla
 */

export const WORLD = {
  seed: 0xBADF00D,
  size: 2000,
  roadSpacing: 120,
  blockSize: 100,
  waterLevel: -2,
  skyColor: 0x87CEEB,
  fogColor: 0x87CEEB,
  fogNear: 200,
  fogFar: 1200,
};

export const DISTRICTS = [
  { name: "Downtown", center: { x: 0, z: 0 }, radius: 300, color: 0x4a4a6a, buildingDensity: 0.8, buildingHeight: { min: 20, max: 80 } },
  { name: "Costa Verde", center: { x: 500, z: 400 }, radius: 250, color: 0x2d8a2d, buildingDensity: 0.6, buildingHeight: { min: 10, max: 40 } },
  { name: "El Puerto", center: { x: -400, z: -300 }, radius: 280, color: 0x1a5a8a, buildingDensity: 0.7, buildingHeight: { min: 15, max: 50 } },
  { name: "Barrio Sol", center: { x: -300, z: 500 }, radius: 220, color: 0xd4a574, buildingDensity: 0.5, buildingHeight: { min: 8, max: 30 } },
  { name: "Industrial", center: { x: 300, z: -500 }, radius: 300, color: 0x555555, buildingDensity: 0.4, buildingHeight: { min: 12, max: 35 } },
  { name: "The Docks", center: { x: -600, z: -100 }, radius: 200, color: 0x334455, buildingDensity: 0.3, buildingHeight: { min: 10, max: 25 } },
];

export const PLAYER = {
  walkSpeed: 5,
  runSpeed: 10,
  jumpForce: 8,
  gravity: 25,
  health: 100,
  maxHealth: 100,
  enterVehicleRange: 3,
  cameraHeight: 1.7,
};

export const VEHICLE = {
  gravity: 20,
  drag: 0.98,
  brakeForce: 15,
  handbrakeForce: 8,
  steerSpeed: 3,
  maxSteerAngle: 0.6,
  wheelRadius: 0.4,
  suspensionStiffness: 30,
  suspensionDamping: 5,
  suspensionTravel: 0.3,
};

export const TRAFFIC = {
  maxVehicles: 40,
  spawnDistance: 200,
  despawnDistance: 300,
  speedLimit: 20,
  minGap: 15,
  laneWidth: 3.5,
};

export const PEDS = {
  maxPeds: 30,
  spawnDistance: 150,
  despawnDistance: 250,
  walkSpeed: 2.5,
  runSpeed: 6,
  fleeSpeed: 8,
  wanderRadius: 20,
  updateInterval: 0.2,
};

export const CAMERA = {
  footOffset: { x: 0, y: 3, z: -6 },
  carOffset: { x: 0, y: 4, z: -10 },
  lookAtHeight: 1.5,
  smoothing: 0.1,
  minDistance: 3,
  maxDistance: 30,
};

export const WANTED = {
  maxStars: 5,
  starDecayRate: 0.5,
  starThresholds: [100, 250, 500, 1000, 2000],
  copCarSpawnChance: [0, 0.3, 0.6, 0.9, 1.0],
  helicopterSpawnStars: 3,
  roadblockSpawnStars: 4,
  searchRadius: [50, 80, 120, 200, 300],
  copCarTypes: ['Interceptor', 'Interceptor', 'Crucero'],
};

export const WEAPONS = [
  { id: 0, name: 'Fist', damage: 10, range: 2, fireRate: 500, ammo: Infinity, maxAmmo: Infinity, spread: 0, auto: false, muzzleFlash: false },
  { id: 1, name: 'Pistol', damage: 25, range: 40, fireRate: 300, ammo: 60, maxAmmo: 120, spread: 0.02, auto: false, muzzleFlash: true },
  { id: 2, name: 'SMG', damage: 18, range: 35, fireRate: 100, ammo: 150, maxAmmo: 300, spread: 0.05, auto: true, muzzleFlash: true },
  { id: 3, name: 'Shotgun', damage: 8, range: 15, fireRate: 800, ammo: 20, maxAmmo: 40, spread: 0.25, auto: false, muzzleFlash: true, pellets: 8 },
];

export const MISSIONS = [
  { id: 'intro_drive', name: 'Welcome to Maravilla', giver: 'Marisol Vega', giverPortrait: 'marisol',
    storyText: 'Marisol Vega leans against her Vesper. "Welcome to Maravilla, kid. This city eats the weak for breakfast. Let me show you the ropes — drive me to the safehouse in Costa Verde. Don\'t scratch the paint."',
    objectives: [{ type: 'drive', target: { x: 480, z: 380 }, radius: 15, description: 'Drive to Costa Verde safehouse' }],
    timeLimit: 180, rewards: { cash: 500, rep: 100 }, unlocks: ['car_theft'] },
  { id: 'car_theft', name: 'Midnight Requisition', giver: 'Dante Reyes', giverPortrait: 'dante',
    storyText: 'Dante Reyes taps ash from his cigarette. "The Marinero parked at El Puerto docks? It belongs to a... difficult client. Bring it to my garage in Industrial. Intact. The client has friends in blue."',
    objectives: [
      { type: 'goto', target: { x: -380, z: -320 }, radius: 5, description: 'Steal the Marinero at El Puerto' },
      { type: 'drive', target: { x: 320, z: -480 }, radius: 10, description: 'Deliver to Industrial garage' }],
    timeLimit: 300, rewards: { cash: 1500, rep: 250 }, unlocks: ['checkpoint_race'] },
  { id: 'checkpoint_race', name: 'Costa Verde Strip', giver: 'Marisol Vega', giverPortrait: 'marisol',
    storyText: 'Marisol grins. "The Strip. 6 checkpoints. 90 seconds. The locals bet on this. Win, and you eat good tonight. Lose... well, you don\'t want to lose."',
    objectives: [{ type: 'checkpoint', checkpoints: [
      { x: 500, z: 400 }, { x: 600, z: 450 }, { x: 680, z: 350 },
      { x: 580, z: 280 }, { x: 450, z: 300 }, { x: 480, z: 380 }
    ], timeLimit: 90, description: 'Complete the checkpoint race' }],
    timeLimit: 120, rewards: { cash: 2000, rep: 400 }, unlocks: ['target_elimination'] },
  { id: 'target_elimination', name: 'Silent Partner', giver: 'Old Tiburon', giverPortrait: 'tiburon',
    storyText: 'Old Tiburon\'s voice rasps like dry coral. "A snitch in Barrio Sol. Name of Ruiz. He talks to the federales. Make it quiet. Make it permanent. His crew patrols the plaza — watch your six."',
    objectives: [
      { type: 'goto', target: { x: -280, z: 520 }, radius: 30, description: 'Locate Ruiz in Barrio Sol plaza' },
      { type: 'kill', target: 'ruiz', count: 1, description: 'Eliminate Ruiz' },
      { type: 'escape', target: { x: -280, z: 520 }, radius: 80, description: 'Leave the area' }],
    timeLimit: 240, rewards: { cash: 3000, rep: 600 }, unlocks: ['evade_police'] },
  { id: 'evade_police', name: 'Heat Wave', giver: 'Yara Campos', giverPortrait: 'yara',
    storyText: 'Yara adjusts her headset. "You\'re hot. Three stars. I need you to survive 60 seconds while I scrub the databases. Don\'t get caught. Don\'t die. The chopper has thermal — stay under cover."',
    objectives: [{ type: 'survive', duration: 60, wantedLevel: 3, description: 'Evade police for 60 seconds at 3 stars' }],
    timeLimit: 90, rewards: { cash: 4000, rep: 800 }, unlocks: ['heli_escape'] },
  { id: 'heli_escape', name: 'Rotor Wash', giver: 'Dante Reyes', giverPortrait: 'dante',
    storyText: 'Dante hands you a rocket launcher with a smirk. "The chopper\'s been a problem. Take it down. Then get to the extract point at The Docks. My guy has a boat waiting."',
    objectives: [
      { type: 'destroy_heli', count: 1, description: 'Destroy the police helicopter' },
      { type: 'drive', target: { x: -580, z: -120 }, radius: 15, description: 'Reach The Docks extraction' }],
    timeLimit: 300, rewards: { cash: 6000, rep: 1200 }, unlocks: ['docks_heist'] },
  { id: 'docks_heist', name: 'Final Score', giver: 'Marisol Vega', giverPortrait: 'marisol',
    storyText: 'Marisol\'s eyes are hard. "The big one. Containers at The Docks. Four packages. Four-star getaway. Every cop in Maravilla will be on us. We do this, we own this city. You ready?"',
    objectives: [
      { type: 'collect', items: [
        { x: -620, z: -80 }, { x: -580, z: -120 }, { x: -540, z: -150 }, { x: -500, z: -100 }
      ], description: 'Collect all 4 packages at The Docks' },
      { type: 'drive', target: { x: 480, z: 380 }, radius: 20, description: 'Escape to Costa Verde safehouse' }],
    timeLimit: 600, rewards: { cash: 15000, rep: 3000 }, unlocks: [] },
];

export const RADIO_STATIONS = [
  { id: 'maravilla_fm', name: 'Maravilla FM 103.7', genre: 'Latin Pop', color: 0xff6b6b, tempo: 128, scale: 'major', waveform: 'sine' },
  { id: 'costa_verde_heat', name: 'Costa Verde Heat', genre: 'Electronic', color: 0x4ecdc4, tempo: 140, scale: 'minor', waveform: 'square' },
  { id: 'bay_static', name: 'Bay Static', genre: 'Hip Hop', color: 0xffe66d, tempo: 95, scale: 'pentatonic', waveform: 'sawtooth' },
  { id: 'dusk_tapes', name: 'Dusk Tapes', genre: 'Synthwave', color: 0xa855f7, tempo: 110, scale: 'phrygian', waveform: 'triangle' },
];

export const RANKS = [
  { name: 'Tourist', minRep: 0, color: 0x888888 },
  { name: 'Local', minRep: 500, color: 0x4ecdc4 },
  { name: 'Made', minRep: 1500, color: 0xffe66d },
  { name: 'Capo', minRep: 3500, color: 0xff6b6b },
  { name: 'Don', minRep: 7000, color: 0xa855f7 },
];

export const COLORS = {
  skyDay: 0x87CEEB, skyDusk: 0xFF7F50, skyNight: 0x0B1D3A,
  water: 0x1a4a6e, road: 0x333333, roadLine: 0xFFFFFF, sidewalk: 0x777777,
  building: 0x666666, buildingWindow: 0xFFFF88,
  palmTrunk: 0x8B6914, palmFrond: 0x2D8A2D,
  player: 0xFFD700, cop: 0x003366, copLight: 0x0066FF,
  wanted: 0xFF0000, mission: 0x00FF00, safehouse: 0x00AA00, garage: 0x886600,
};

export const PHYSICS = { fixedTimestep: 1/60, maxSubSteps: 4, gravity: 9.81 };

export const COPS = {
  names: ['Lt. Hargrove', 'Sgt. Imura', 'Officer Delgado', 'Ofc. Reyes'],
  tactics: ['RAM', 'PURSUIT BOX', 'HELICOPTER SWEEP', 'ROADBLOCK'],
  vehicleColors: [0x001133, 0x001133, 0x001133, 0x001133],
  helicopterColor: 0x001133, searchlightColor: 0xFFFFFF, searchlightIntensity: 2.5, searchlightAngle: Math.PI/6,
};

// Derived tuning values the simulation modules read (kept here so tuning lives in one file).
Object.assign(PLAYER, {
  sprintSpeed: 14,
  crouchSpeed: 3,
  maxStamina: 100,
  staminaRegen: 18,
  staminaDrain: 25,
  healthRegenDelay: 6,
  healthRegenRate: 8,
});
Object.assign(WORLD, { cityRadius: WORLD.size * 0.5 });
Object.assign(TRAFFIC, { maxCars: 32 });
Object.assign(PEDS, { reactionDistance: 40 });
