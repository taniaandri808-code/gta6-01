export class Minimap {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 180;
    this.canvas.height = 180;
    this.canvas.style.cssText = 'position: fixed; bottom: 20px; right: 20px; border: 2px solid #fff; border-radius: 4px; background: rgba(0, 0, 0, 0.7); image-rendering: pixelated; z-index: 100;';
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.scale = 0.05;
    this.range = 180 / this.scale / 2;
  }

  drawRoadGrid() {
    const { ctx, canvas, scale, range } = this;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    const gridSize = 50;
    
    ctx.beginPath();
    for (let x = -range; x <= range; x += gridSize) {
      const sx = (x * scale) + canvas.width / 2;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, canvas.height);
    }
    for (let z = -range; z <= range; z += gridSize) {
      const sy = canvas.height / 2 - (z * scale);
      ctx.moveTo(0, sy);
      ctx.lineTo(canvas.width, sy);
    }
    ctx.stroke();
  }

  drawPlayerArrow(heading) {
    const { ctx, canvas } = this;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-heading);
    
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(-6, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(6, 6);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  drawVehicleBlips(vehicles, playerPos) {
    const { ctx, canvas, scale } = this;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    for (const v of vehicles) {
      const dx = (v.position.x - playerPos.x) * scale;
      const dz = (v.position.z - playerPos.z) * scale;
      const x = cx + dx;
      const y = cy - dz;
      
      if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) continue;
      
      ctx.fillStyle = v.isPlayer ? '#00ffff' : '#ff4444';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  drawObjectiveMarker(objective, playerPos) {
    if (!objective) return;
    
    const { ctx, canvas, scale } = this;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    const dx = (objective.position.x - playerPos.x) * scale;
    const dz = (objective.position.z - playerPos.z) * scale;
    let x = cx + dx;
    let y = cy - dz;
    
    const dist = Math.hypot(objective.position.x - playerPos.x, objective.position.z - playerPos.z);
    
    const maxR = Math.min(canvas.width, canvas.height) / 2 - 10;
    const r = Math.hypot(dx, dz);
    
    if (r > maxR) {
      const angle = Math.atan2(-dz, dx);
      x = cx + Math.cos(angle) * maxR;
      y = cy + Math.sin(angle) * maxR;
    }
    
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x - 8, y + 4);
    ctx.lineTo(x + 8, y + 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(dist)}m`, x, y + 20);
  }

  drawNorthIndicator() {
    const { ctx, canvas } = this;
    const cx = canvas.width - 20;
    const cy = 20;
    
    ctx.save();
    ctx.translate(cx, cy);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', 0, 0);
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText('N', 0, 0);
    ctx.restore();
  }

  update(playerPos, heading, vehicles = [], objective = null) {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    this.drawRoadGrid();
    this.drawVehicleBlips(vehicles, playerPos);
    this.drawObjectiveMarker(objective, playerPos);
    this.drawPlayerArrow(heading);
    this.drawNorthIndicator();
  }
}
