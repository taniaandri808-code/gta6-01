export class WeatherSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.types = ['clear', 'rain', 'storm', 'fog'];
    this.current = 0;
    this.target = 0;
    this.transition = 0;
    this.cycleTime = 30000;
    this.lastChange = 0;
    
    this.rainParticles = null;
    this.rainGeometry = null;
    this.rainMaterial = null;
    this.rainCount = 2000;
    
    this.flashTimer = 0;
    this.flashDuration = 0;
    this.isFlashing = false;
    
    this.toastEl = document.createElement('div');
    this.toastEl.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:12px 24px;border-radius:8px;font-family:system-ui;font-size:14px;opacity:0;transition:opacity 0.3s;z-index:1000;pointer-events:none;';
    document.body.appendChild(this.toastEl);
    
    this.initRain();
  }

  initRain() {
    this.rainGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 3);
    const velocities = new Float32Array(this.rainCount * 3);
    for (let i = 0; i < this.rainCount; i++) {
      positions[i*3] = (Math.random()-0.5)*200;
      positions[i*3+1] = Math.random()*100+50;
      positions[i*3+2] = (Math.random()-0.5)*200;
      velocities[i*3] = 0;
      velocities[i*3+1] = -(Math.random()*10+20);
      velocities[i*3+2] = 0;
    }
    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rainGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    this.rainMaterial = new THREE.PointsMaterial({
      color: 0xaaccee,
      size: 0.3,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    this.rainParticles = new THREE.Points(this.rainGeometry, this.rainMaterial);
    this.scene.add(this.rainParticles);
  }

  update(dt, time) {
    if (time - this.lastChange > this.cycleTime) {
      this.target = (this.target + 1) % this.types.length;
      this.lastChange = time;
      this.showToast(this.types[this.target]);
    }
    
    this.transition += (this.target - this.transition) * 0.02;
    const t = this.transition;
    
    const rainAmount = Math.max(0, Math.sin(t * Math.PI/2)) * (t > 1 ? 1 : 0);
    const stormAmount = t > 2 ? (t-2)/2 : 0;
    const fogAmount = t > 3 ? (t-3) : (t < 1 ? 1-t : 0);
    
    this.rainMaterial.opacity = rainAmount * 0.6;
    
    if (rainAmount > 0) {
      const pos = this.rainGeometry.attributes.position.array;
      const vel = this.rainGeometry.attributes.velocity.array;
      for (let i = 0; i < this.rainCount; i++) {
        pos[i*3+1] += vel[i*3+1] * dt * 0.05;
        if (pos[i*3+1] < 0) {
          pos[i*3+1] = 100 + Math.random()*50;
          pos[i*3] = this.camera.position.x + (Math.random()-0.5)*200;
          pos[i*3+2] = this.camera.position.z + (Math.random()-0.5)*200;
        }
      }
      this.rainGeometry.attributes.position.needsUpdate = true;
      this.rainParticles.position.copy(this.camera.position);
    }
    
    if (stormAmount > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.flashTimer = Math.random()*3000 + 2000;
        this.flashDuration = 100;
        this.isFlashing = true;
      }
      if (this.isFlashing) {
        this.flashDuration -= dt;
        this.scene.background = new THREE.Color(0xffffff);
        if (this.flashDuration <= 0) {
          this.isFlashing = false;
          this.scene.background = new THREE.Color(0x87ceeb);
        }
      }
    }
    
    const fogDensity = fogAmount * 0.02;
    if (!this.scene.fog) this.scene.fog = new THREE.FogExp2(0x87ceeb, 0);
    this.scene.fog.density += (fogDensity - this.scene.fog.density) * 0.05;
    this.scene.fog.color.setHex(fogAmount > 0.5 ? 0x555555 : 0x87ceeb);
  }

  showToast(type) {
    const labels = {clear:'Clear Skies', rain:'Rain', storm:'Storm', fog:'Fog'};
    this.toastEl.textContent = labels[type];
    this.toastEl.style.opacity = '1';
    setTimeout(() => this.toastEl.style.opacity = '0', 2000);
  }
}
