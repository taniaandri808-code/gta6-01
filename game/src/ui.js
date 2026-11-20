// UI module for GTA6 entry
export class UI {
  constructor() {
    // Create HUD container
    this.hud = document.createElement('div');
    this.hud.id = 'hud';
    document.body.appendChild(this.hud);
    // Health element
    this.healthEl = document.createElement('div');
    this.healthEl.id = 'hud-health';
    this.hud.appendChild(this.healthEl);
    // Armor element
    this.armorEl = document.createElement('div');
    this.armorEl.id = 'hud-armor';
    this.hud.appendChild(this.armorEl);
    // Money element
    this.moneyEl = document.createElement('div');
    this.moneyEl.id = 'hud-money';
    this.hud.appendChild(this.moneyEl);
    // Weapon element
    this.weaponEl = document.createElement('div');
    this.weaponEl.id = 'hud-weapon';
    this.hud.appendChild(this.weaponEl);
    // Wanted stars container
    this.starsEl = document.createElement('div');
    this.starsEl.id = 'hud-stars';
    this.hud.appendChild(this.starsEl);
    // Radio element
    this.radioEl = document.createElement('div');
    this.radioEl.id = 'hud-radio';
    this.hud.appendChild(this.radioEl);
    // Objective element
    this.objectiveEl = document.createElement('div');
    this.objectiveEl.id = 'hud-objective';
    this.hud.appendChild(this.objectiveEl);
    // Minimap canvas
    this.minimap = document.createElement('canvas');
    this.minimap.id = 'minimap';
    this.hud.appendChild(this.minimap);
    this.minimapCtx = this.minimap.getContext('2d');
    this.minimapBlips = [];
  }
  setHealth(h, max) {
    const pct = Math.max(0, Math.min(100, (h / max) * 100));
    this.healthEl.style.width = pct + '%';
    this.healthEl.style.background = h / max > 0.35 ? '#5ad05a' : '#e04a4a';
  }

  setArmor(a, max) {
    this.armorEl.style.width = Math.max(0, Math.min(100, (a / max) * 100)) + '%';
  }

  setMoney(n) {
    this.moneyEl.textContent = '$' + Math.floor(n).toLocaleString('en-US');
  }

  setWeapon(name) {
    this.weaponEl.textContent = (name || 'Fist').toUpperCase();
  }

  setWanted(level) {
    const stars = '★'.repeat(Math.round(level)) + '☆'.repeat(Math.max(0, 5 - Math.round(level)));
    this.starsEl.textContent = stars;
    this.starsEl.style.color = level > 0 ? '#ff4a4a' : '#666';
  }
  setRadio(name) {
    this.radioEl.textContent = name ? '\u25B6 ' + name : 'Radio off';
  }

  setMissionObjective(text) {
    this.objectiveEl.textContent = text || '';
  }

  showMissionBanner(title, rewards) {
    const b = document.createElement('div');
    b.className = 'mission-banner';
    b.textContent = title + (rewards ? '  +$' + (rewards.cash || 0) + '  +' + (rewards.rep || 0) + ' rep' : '');
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 4000);
  }

  notify(text) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  addMinimapBlip(x, z, color) {
    this.minimapBlips.push({ x, z, color, t: performance.now() });
  }
  update(delta, world, player) {
    const ctx = this.minimapCtx;
    const size = 180;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(10, 20, 30, 0.85)';
    ctx.fillRect(0, 0, size, size);
    if (!player || !player.position) return;
    const px = player.position.x, pz = player.position.z;
    const scale = size / 500;
    ctx.strokeStyle = 'rgba(120, 120, 120, 0.35)';
    ctx.lineWidth = 3;
    for (let r = -1000; r <= 1000; r += 120) {
      ctx.beginPath();
      ctx.moveTo(size / 2 + (r - px) * scale, 0);
      ctx.lineTo(size / 2 + (r - px) * scale, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, size / 2 + (r - pz) * scale);
      ctx.lineTo(size, size / 2 + (r - pz) * scale);
      ctx.stroke();
    }
    const now = performance.now();
    for (const b of this.minimapBlips) {
      if (now - b.t > 4000) continue;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(size / 2 + (b.x - px) * scale, size / 2 + (b.z - pz) * scale, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    const blip = (obj, color, radius) => {
      if (!obj || !obj.position) return;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(size / 2 + (obj.position.x - px) * scale, size / 2 + (obj.position.z - pz) * scale, radius, 0, Math.PI * 2);
      ctx.fill();
    };
    (world?.vehicles || []).forEach(v => blip(v, 'rgba(230,230,230,0.7)', 2));
    (world?.police?.copCars || []).forEach(c => blip(c, '#ff3b3b', 3.5));
    if (this.missionMarker) blip(this.missionMarker, '#ffd23f', 5);
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(-(player.yaw || 0));
    ctx.fillStyle = '#39d0ff';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 6);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, size - 2, size - 2);
  }
}

const UI_CSS = `
#hud { position: fixed; inset: 0; pointer-events: none; z-index: 30;
  font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #fff; }
#hud-health, #hud-armor { position: absolute; left: 216px; bottom: 22px; height: 12px;
  width: 180px; background: #2a2a2a; border: 1px solid #000; }
#hud-armor { bottom: 40px; width: 150px; background: #223344; }
#hud-money { position: absolute; right: 24px; top: 18px; font-weight: 700;
  font-size: 22px; color: #7ee081; text-shadow: 0 2px 4px #000; }
#hud-weapon { position: absolute; right: 24px; top: 50px; font-size: 14px;
  letter-spacing: 2px; text-shadow: 0 2px 4px #000; }
#hud-stars { position: absolute; right: 24px; top: 78px; font-size: 18px;
  text-shadow: 0 2px 4px #000; }
#hud-radio { position: absolute; left: 24px; top: 18px; font-size: 14px;
  opacity: 0.9; text-shadow: 0 2px 4px #000; }
#hud-objective { position: absolute; left: 50%; top: 18px; transform: translateX(-50%);
  font-size: 15px; font-weight: 600; background: rgba(0,0,0,0.45);
  padding: 6px 14px; border-radius: 6px; }
#minimap { position: absolute; left: 24px; bottom: 22px; width: 180px; height: 180px;
  border-radius: 50%; overflow: hidden; }
.mission-banner { position: fixed; left: 50%; top: 35%; transform: translateX(-50%);
  z-index: 40; background: rgba(0,0,0,0.75); color: #ffd23f; font-size: 20px;
  font-weight: 700; padding: 14px 28px; border-radius: 8px; pointer-events: none; }
.toast { position: fixed; left: 50%; bottom: 140px; transform: translateX(-50%);
  z-index: 40; background: rgba(0,0,0,0.6); color: #fff; font-size: 14px;
  padding: 8px 18px; border-radius: 6px; pointer-events: none; }
#dialogue { position: fixed; left: 50%; bottom: 40px; transform: translateX(-50%);
  z-index: 45; width: min(640px, 80vw); background: rgba(0,0,0,0.85);
  border: 1px solid #444; border-radius: 10px; padding: 16px 20px; color: #fff; }
#dialogue .dg-giver { font-weight: 700; color: #ffd23f; margin-bottom: 6px; }
#dialogue .dg-text { font-size: 15px; line-height: 1.5; min-height: 60px; }
#dialogue .dg-btn { margin-top: 10px; pointer-events: auto; background: #ffd23f;
  color: #111; border: 0; padding: 8px 20px; font-weight: 700; border-radius: 6px; cursor: pointer; }
`;
if (!document.getElementById('maravilla-ui-css')) {
  const st = document.createElement('style');
  st.id = 'maravilla-ui-css';
  st.textContent = UI_CSS;
  document.head.appendChild(st);
}

export class Dialogue {
  show(giver, portrait, text, onDone) {
    let box = document.getElementById('dialogue');
    if (!box) {
      box = document.createElement('div');
      box.id = 'dialogue';
      document.body.appendChild(box);
    }
    box.innerHTML = '<div class="dg-giver"></div><div class="dg-text"></div><button class="dg-btn">Continue</button>';
    box.querySelector('.dg-giver').textContent = giver || '';
    const textEl = box.querySelector('.dg-text');
    textEl.textContent = '';
    const full = text || '';
    let i = 0;
    const timer = setInterval(() => {
      i += 2;
      textEl.textContent = full.slice(0, i);
      if (i >= full.length) clearInterval(timer);
    }, 20);
    const btn = box.querySelector('.dg-btn');
    btn.onclick = () => {
      clearInterval(timer);
      textEl.textContent = full;
      box.remove();
      if (onDone) onDone();
    };
  }
}
