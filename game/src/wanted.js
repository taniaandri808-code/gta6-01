export class WantedSystem {
  constructor(game) {
    this.game = game;
    this.stars = 0;
    this.maxStars = 5;
    this.heat = 0;
    this.maxHeat = 100;
    this.decayRate = 0.5;
    this.chaseCars = [];
    this.busted = false;
    this.bustedTimer = 0;
    this.hudElement = null;
    this.initHUD();
  }

  initHUD() {
    this.hudElement = document.createElement('div');
    this.hudElement.id = 'wanted-hud';
    this.hudElement.style.cssText = 'position: fixed; top: 20px; right: 20px; display: flex; gap: 4px; z-index: 1000; font-family: monospace; font-size: 24px;';
    for (let i = 0; i < this.maxStars; i++) {
      const star = document.createElement('span');
      star.className = 'wanted-star';
      star.textContent = '★';
      star.style.color = '#444';
      star.style.textShadow = '0 0 4px #000';
      this.hudElement.appendChild(star);
    }
    document.body.appendChild(this.hudElement);
  }

  addHeat(amount) {
    this.heat = Math.min(this.maxHeat, this.heat + amount);
    const newStars = Math.ceil((this.heat / this.maxHeat) * this.maxStars);
    if (newStars !== this.stars) {
      this.stars = newStars;
      this.updateHUD();
      if (this.stars >= 2) this.spawnChaseCars();
    }
  }

  reportCrime(type) {
    const values = { pedestrianHit: 25, gunfire: 35, vehicleTheft: 20, assault: 15 };
    this.addHeat(values[type] || 10);
  }

  update(dt) {
    if (this.busted) {
      this.bustedTimer += dt;
      if (this.bustedTimer > 3000) this.onBustedComplete();
      return;
    }
    this.heat = Math.max(0, this.heat - this.decayRate * dt);
    const newStars = Math.ceil((this.heat / this.maxHeat) * this.maxStars);
    if (newStars !== this.stars) {
      this.stars = newStars;
      this.updateHUD();
    }
    this.updateChaseCars(dt);
    this.checkBusted();
  }

  updateHUD() {
    const stars = this.hudElement.querySelectorAll('.wanted-star');
    stars.forEach((star, i) => {
      star.style.color = i < this.stars ? '#ffd700' : '#444';
      star.style.textShadow = i < this.stars ? '0 0 8px #ffd700' : '0 0 4px #000';
    });
  }

  spawnChaseCars() {
    const count = Math.min(this.stars, 3) - this.chaseCars.length;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 40;
      const car = {
        x: this.game.player.x + Math.cos(angle) * dist,
        y: this.game.player.y + Math.sin(angle) * dist,
        speed: 0.15 + this.stars * 0.02,
        angle: 0,
        state: 'chase'
      };
      this.chaseCars.push(car);
    }
  }

  updateChaseCars(dt) {
    this.chaseCars = this.chaseCars.filter(car => {
      const dx = this.game.player.x - car.x;
      const dy = this.game.player.y - car.y;
      const dist = Math.hypot(dx, dy);
      car.angle = Math.atan2(dy, dx);
      car.x += Math.cos(car.angle) * car.speed * dt;
      car.y += Math.sin(car.angle) * car.speed * dt;
      return dist < 200;
    });
  }

  checkBusted() {
    if (this.stars === 0) return;
    let nearby = 0;
    for (const car of this.chaseCars) {
      const dist = Math.hypot(this.game.player.x - car.x, this.game.player.y - car.y);
      if (dist < 15) nearby++;
    }
    if (nearby >= 2) this.triggerBusted();
  }

  triggerBusted() {
    this.busted = true;
    this.bustedTimer = 0;
    this.stars = 0;
    this.heat = 0;
    this.chaseCars = [];
    this.updateHUD();
    this.game.ui.showMessage('BUSTED', 3000);
  }

  onBustedComplete() {
    this.busted = false;
    this.game.player.respawn();
  }

  render(ctx) {
    for (const car of this.chaseCars) {
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(-12, -6, 24, 12);
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(-10, -4, 8, 8);
      ctx.fillRect(2, -4, 8, 8);
      ctx.restore();
    }
  }

  destroy() {
    this.hudElement?.remove();
  }
}
