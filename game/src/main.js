import * as THREE from 'three';
import { WORLD } from './config.js';
import { createWorld, updateWorld } from './world.js';
import { Player } from './player.js';
import { Vehicle } from './vehicles.js';
import { TrafficSystem } from './traffic.js';
import { PoliceSystem } from './police.js';
import { MissionManager } from './missions.js';
import { ChaseCamera } from './camera.js';
import { InputManager } from './input.js';
import { UI, Dialogue } from './ui.js';
import { RadioStations as Radio } from './radio.js';
import { SaveSystem } from './save.js';
import { AudioManager } from './audio.js';

// Maravilla main loop: wires the world, player, police, traffic, missions, HUD and radio together.
let scene, camera, renderer, world, player, police, missions, ui, dialogue, audio, save, radio, traffic;
let camCtl, input, clock, elapsed = 0;
let started = false, paused = false, missionTimer = 0;
let extrasUpdate = null;

function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(WORLD.skyColor);
  scene.fog = new THREE.Fog(WORLD.fogColor, WORLD.fogNear, WORLD.fogFar);
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 4000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 0.9));
  const sun = new THREE.DirectionalLight(0xfff2d0, 1.1);
  sun.position.set(300, 500, 200);
  scene.add(sun);
  world = createWorld(scene);
  world.scene = scene;
  world.vehicles = [];
  world.peds = [];
  world.copCars = [];
  world.stars = 0;
  world.getPlayerPosition = () => (player ? player.position : new THREE.Vector3());
  input = new InputManager();
  audio = new AudioManager();
  ui = new UI();
  dialogue = new Dialogue();
  player = new Player(camera, input, world);
  world.player = player;
  police = new PoliceSystem(world);
  world.police = police;
  traffic = new TrafficSystem(world);
  missions = new MissionManager(world, player, dialogue, ui, audio);
  world.missions = missions;
  camCtl = new ChaseCamera(camera, player.mesh);
  radio = new Radio();
  save = new SaveSystem(player, missions, police);
  const starter = new Vehicle(world, new THREE.Vector3(-195, 0.7, -140), Math.PI / 2, 0);
  scene.add(starter.mesh);
  world.vehicles.push(starter);
  bindUI();
  extrasUpdate = initExtras({ world, player, camera, police, traffic, missions, ui, audio, input, camCtl, save, renderer, scene });
  clock = { last: performance.now() };
  requestAnimationFrame(loop);
}
function bindUI() {
  const start = () => {
    document.getElementById('start-screen').classList.add('hidden');
    started = true;
    audio.init();
    radio.init();
    radio.next();
    ui.setRadio(radio.stations[radio.currentStation]?.name || 'Radio off');
    ui.setHealth(player.health, PLAYER_MAX);
    ui.setMoney(player.money);
    setTimeout(() => {
      if (missions.availableMissions.length) missions.startMission(missions.availableMissions[0]);
    }, 1500);
  };
  document.getElementById('play-btn').onclick = start;
  const cont = document.getElementById('continue-btn');
  if (save.hasSave()) cont.classList.remove('hidden');
  cont.onclick = () => {
    if (save.load()) ui.notify('Game loaded');
    start();
  };
  document.getElementById('resume-btn').onclick = () => togglePause(false);
  document.getElementById('save-btn').onclick = () => { save.save(); ui.notify('Saved'); togglePause(false); };
  document.getElementById('quit-btn').onclick = () => { save.save(); location.reload(); };
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && started) togglePause(!paused);
    if (e.code === 'KeyM' && started) {
      radio.nextStation();
      ui.setRadio(radio.getCurrentStationInfo()?.name || 'Radio off');
    }
    if (e.code === 'KeyP' && started) { if (radio.isPlaying) radio.stop(); else radio.nextStation(); }
  });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function togglePause(p) {
  paused = p;
  document.getElementById('pause-menu').classList.toggle('hidden', !p);
  if (p) input.unlockPointer(); else input.lockPointer();
}

function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  const delta = Math.min(0.05, (now - clock.last) / 1000);
  clock.last = now;
  if (!started || paused) { renderer.render(scene, camera); return; }
  elapsed += delta;
  player.update(delta, elapsed);
  traffic.update(delta, elapsed);
  police.update(delta);
  missions.update(delta);
  updateWorld(world, elapsed);
  camCtl.update(delta, input);
  ui.update(delta, world, player);
  ui.setHealth(player.health, PLAYER_MAX);
  ui.setMoney(player.money);
  ui.setWanted(police.wantedLevel);
  if (radio.update) radio.update(delta);
  if (extrasUpdate) extrasUpdate(delta, elapsed);
  renderer.render(scene, camera);
}

const PLAYER_MAX = 100;

// --- Extras integration ---
import { BoostSystem } from './boost.js';
import { PhotoMode } from './photomode.js';
import { RadioStations } from './radio.js';
import { WeatherSystem } from './weather.js';
import { Minimap } from './minimap.js';
import { WantedSystem } from './wanted.js';
import { ChaseCam } from './chasecam.js';
import { Achievements } from './achievements.js';
import { SettingsMenu } from './settings.js';
import { Deliveries } from './deliveries.js';

let boost, photo, radioStations, weather, minimap, wantedSys, chaseCam, achievements, settings, deliveries;

export function initExtras(GAME) {
  const { world, player, camera, police, traffic, missions, ui, audio, input, camCtl, save, renderer, scene } = GAME;
  
  boost = new BoostSystem(player, input);
  photo = new PhotoMode(camera, renderer, scene);
  radioStations = new RadioStations(audio);
  weather = new WeatherSystem(scene, world);
  minimap = new Minimap(player, world, camera);
  wantedSys = new WantedSystem(police, player, world);
  chaseCam = new ChaseCam(camera, player.mesh, input);
  achievements = new Achievements(player, missions, ui);
  settings = new SettingsMenu(audio, radio, ui, input);
  deliveries = new Deliveries(world, player, missions, ui);

  // Key handlers
  input.on('KeyB', () => boost.toggle());        // Shift handled in BoostSystem
  input.on('KeyP', () => photo.toggle());        // Photo mode
  input.on('KeyM', () => radioStations.cycle()); // Radio stations
  input.on('KeyC', () => chaseCam.toggle());     // Chase cam
  input.on('Escape', () => settings.toggle());   // Settings menu

  // Return update function for game loop
  return (dt, elapsed) => {
    if (boost.update) boost.update(dt);
    if (photo.update) photo.update(dt);
    if (radioStations.update) radioStations.update(dt);
    if (weather.update) weather.update(dt, elapsed);
    if (minimap.update) minimap.update(dt);
    if (wantedSys.update) wantedSys.update(dt);
    if (chaseCam.update) chaseCam.update(dt);
    if (achievements.update) achievements.update(dt);
    if (deliveries.update) deliveries.update(dt);
    if (settings.update) settings.update(dt);
  };
}

init();
