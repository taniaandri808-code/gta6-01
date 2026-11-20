import * as THREE from 'three';

export class BoostSystem {
  constructor(car) {
    this.car = car;
    this.gauge = 100;
    this.active = false;
    this.drainRate = 28;
    this.rechargeRate = 9;
    this.particles = this.createParticles();
    this.root = this.car.group || this.car.mesh || this.car;
    this.root.add(this.particles);
    this.domGauge = this.createDomGauge();
    document.body.appendChild(this.domGauge);
  }

  createParticles() {
    const count = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const alphas = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) this.resetParticle(i, positions, alphas, sizes, true);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    const material = new THREE.PointsMaterial({ color: 0x00ffff, size: 0.5, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace('void main()', `attribute float alpha; attribute float size; varying float vAlpha; void main() { vAlpha = alpha; gl_PointSize = size * (300.0 / -mvPosition.z);`);
      shader.fragmentShader = shader.fragmentShader.replace('void main()', `varying float vAlpha; void main() { if (vAlpha <= 0.0) discard; gl_FragColor = vec4(0.0, 1.0, 1.0, vAlpha);`);
    };
    return new THREE.Points(geometry, material);
  }

  resetParticle(i, positions, alphas, sizes, initial = false) {
    const spread = initial ? 40 : 8;
    positions[i * 3] = (Math.random() - 0.5) * 2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
    positions[i * 3 + 2] = -Math.random() * spread - 2;
    alphas[i] = initial ? Math.random() * 0.5 : 0;
    sizes[i] = 0.3 + Math.random() * 0.4;
  }

  createDomGauge() {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;bottom:20px;right:20px;width:180px;height:18px;background:#111;border:2px solid #0ff;border-radius:9px;overflow:hidden;font:11px monospace;color:#0ff;z-index:100';
    wrap.innerHTML = '<div id="boost-fill" style="width:100%;height:100%;background:linear-gradient(90deg,#0ff,#08f);transition:width 0.1s"></div><div style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;pointer-events:none">BOOST <span id="boost-val">100</span></div>';
    return wrap;
  }

  activate() { if (this.gauge > 0) this.active = true; }
  release() { this.active = false; }

  update(dt) {
    if (this.active && this.gauge > 0) { this.gauge = Math.max(0, this.gauge - this.drainRate * dt); if (this.gauge === 0) this.active = false; }
    else if (!this.active && this.gauge < 100) this.gauge = Math.min(100, this.gauge + this.rechargeRate * dt);
    this.updateParticles(dt);
    this.updateDomGauge();
    return this.active;
  }

  updateParticles(dt) {
    const positions = this.particles.geometry.attributes.position.array;
    const alphas = this.particles.geometry.attributes.alpha.array;
    const sizes = this.particles.geometry.attributes.size.array;
    const count = positions.length / 3;
    const speed = this.active ? 80 : 20;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 2] += speed * dt;
      alphas[i] = Math.max(0, alphas[i] - dt * (this.active ? 1.5 : 3));
      if (positions[i * 3 + 2] > 2 || alphas[i] <= 0) { this.resetParticle(i, positions, alphas, sizes); positions[i * 3 + 2] = -2; }
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
    this.particles.geometry.attributes.alpha.needsUpdate = true;
  }

  updateDomGauge() {
    const fill = this.domGauge.querySelector('#boost-fill');
    const val = this.domGauge.querySelector('#boost-val');
    if (fill) fill.style.width = `${this.gauge}%`;
    if (val) val.textContent = Math.round(this.gauge);
  }

  destroy() { this.domGauge.remove(); this.particles.geometry.dispose(); this.particles.material.dispose(); }
}
