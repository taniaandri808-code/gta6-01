import { spawnTraffic } from './vehicles.js';
import { spawnPed } from './peds.js';
import { SeededRandom } from './random.js';

// Traffic and pedestrian life for Maravilla: streams cars and peds around the player.
export class TrafficSystem {
  constructor(world) {
    this.world = world;
    this.rng = new SeededRandom(0x5EED);
    this.respawnTimer = 0;
    this.spawnInitial();
  }

  spawnInitial() {
    spawnTraffic(this.world, this.rng);
    for (let i = 0; i < 18; i++) spawnPed(this.world, this.rng);
  }

  update(delta, time) {
    for (const v of [...this.world.vehicles]) {
      if (!v.isPlayer) v.update(delta, null);
    }
    for (const p of [...this.world.peds]) {
      p.update(delta, time, this.world.player);
    }
    this.respawnTimer += delta;
    if (this.respawnTimer > 3) {
      this.respawnTimer = 0;
      this.prune();
    }
  }

  prune() {
    const player = this.world.player;
    if (!player) return;
    const pos = player.position;
    this.world.vehicles = this.world.vehicles.filter((v) => {
      if (v.isPlayer) return true;
      if (v.position.distanceTo(pos) > 380) {
        this.world.scene.remove(v.mesh);
        return false;
      }
      return true;
    });
    this.world.peds = this.world.peds.filter((p) => {
      if (p.position.distanceTo(pos) > 280) {
        p.dispose();
        return false;
      }
      return true;
    });
    while (this.world.vehicles.filter((v) => !v.isPlayer).length < 20) {
      const spawned = spawnTraffic(this.world, this.rng);
      if (!spawned.length) break;
    }
    while (this.world.peds.length < 12) spawnPed(this.world, this.rng);
  }
}
