// Save system for Maravilla: localStorage persistence of the player's run.
export class SaveSystem {
  constructor(player, missions, police) {
    this.player = player;
    this.missions = missions;
    this.police = police;
    this.key = 'maravilla_save_v1';
  }

  hasSave() {
    return !!localStorage.getItem(this.key);
  }

  save() {
    const p = this.player;
    const data = {
      money: p.money,
      rep: p.rep,
      health: p.health,
      armor: p.armor,
      weapons: p.weapons,
      currentWeapon: p.currentWeapon,
      position: { x: p.position.x, y: p.position.y, z: p.position.z },
      completedMissions: this.missions.completedMissions || [],
      availableMissions: this.missions.availableMissions || [],
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(this.key, JSON.stringify(data));
  }

  load() {
    const raw = localStorage.getItem(this.key);
    if (!raw) return false;
    try {
      const d = JSON.parse(raw);
      const p = this.player;
      p.money = d.money || 0;
      p.rep = d.rep || 0;
      p.health = d.health || 100;
      p.armor = d.armor || 0;
      if (Array.isArray(d.weapons)) p.weapons = d.weapons;
      if (typeof d.currentWeapon === 'number') p.selectWeapon(d.currentWeapon);
      if (d.position) p.position.set(d.position.x, d.position.y, d.position.z);
      if (this.missions) {
        this.missions.completedMissions = d.completedMissions || [];
        this.missions.availableMissions = d.availableMissions || ['intro_drive'];
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  clear() {
    localStorage.removeItem(this.key);
  }
}
