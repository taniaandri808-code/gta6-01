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
import { Radio } from './radio.js';
import { SaveSystem } from './save.js';
import { AudioManager } from './audio.js';

// Maravilla main loop: wires the world, player, police, traffic, missions, HUD and radio together.
let scene, camera, renderer, world, player, police, missions, ui, dialogue, audio, save, radio, traffic;
let camCtl, input, clock, elapsed = 0;
let started = false, paused = false, missionTimer = 0;

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
  clock = { last: performance.now() };
  requestAnimationFrame(loop);
}
function bindUI() {
  const start = () => {
    document.getElementById('start-screen').classList.add('hidden');
    started = true;
    audio.init();
    radio.init();
    radio.nextStation();
    ui.setRadio(radio.getCurrentStationInfo()?.name || 'Radio off');
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
  radio.update(delta);
  renderer.render(scene, camera);
}

const PLAYER_MAX = 100;
init();
