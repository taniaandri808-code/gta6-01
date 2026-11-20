export class ChaseCam {
  constructor() {
    this.modes = ['bumper', 'hood', 'chase', 'orbit'];
    this.modeIndex = 2;
    this.mode = this.modes[this.modeIndex];
    
    this.offset = new THREE.Vector3(0, 2.5, -8);
    this.target = new THREE.Vector3();
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    
    this.springK = 45;
    this.springD = 12;
    
    this.baseFov = 70;
    this.fov = this.baseFov;
    this.fovVel = 0;
    this.fovK = 8;
    this.fovD = 6;
    
    this.shakeIntensity = 0;
    this.shakeDecay = 15;
    this.shakeOffset = new THREE.Vector3();
    this.shakeRot = new THREE.Euler();
    
    this.orbitAngle = 0;
    this.orbitRadius = 12;
    this.orbitHeight = 4;
  }

  setMode(index) {
    this.modeIndex = (index + this.modes.length) % this.modes.length;
    this.mode = this.modes[this.modeIndex];
  }

  nextMode() { this.setMode(this.modeIndex + 1); }
  prevMode() { this.setMode(this.modeIndex - 1); }

  addShake(intensity) {
    this.shakeIntensity = Math.min(1, this.shakeIntensity + intensity);
  }

  update(dt, car, camera) {
    car = car || this._lastCar;
    if (car) this._lastCar = car;
    if (!car || !car.velocity || !car.quaternion) return;
    const speed = car.velocity.length();
    const speedKmh = speed * 3.6;
    
    // Spring-damped follow
    const desired = this.getDesiredOffset(car, speedKmh);
    this.target.lerp(desired, 1 - Math.exp(-this.springK * dt));
    
    const springForce = this.target.clone().sub(this.position).multiplyScalar(this.springK);
    const dampingForce = this.velocity.clone().multiplyScalar(-this.springD);
    this.velocity.add(springForce.add(dampingForce).multiplyScalar(dt));
    this.position.add(this.velocity.clone().multiplyScalar(dt));
    
    // Speed-based FOV kick
    const targetFov = this.baseFov + Math.min(20, speedKmh * 0.15);
    const fovForce = (targetFov - this.fov) * this.fovK;
    const fovDamp = -this.fovVel * this.fovD;
    this.fovVel += (fovForce + fovDamp) * dt;
    this.fov += this.fovVel * dt;
    camera.fov = this.fov;
    camera.updateProjectionMatrix();
    
    // Collision shake
    if (this.shakeIntensity > 0.001) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
      this.shakeOffset.set(
        (Math.random() - 0.5) * this.shakeIntensity * 0.5,
        (Math.random() - 0.5) * this.shakeIntensity * 0.3,
        (Math.random() - 0.5) * this.shakeIntensity * 0.5
      );
      this.shakeRot.set(
        (Math.random() - 0.5) * this.shakeIntensity * 0.05,
        (Math.random() - 0.5) * this.shakeIntensity * 0.05,
        (Math.random() - 0.5) * this.shakeIntensity * 0.03
      );
    } else {
      this.shakeOffset.set(0, 0, 0);
      this.shakeRot.set(0, 0, 0);
    }
    
    // Apply camera transform
    const worldPos = car.position.clone().add(this.position).add(this.shakeOffset);
    camera.position.copy(worldPos);
    
    const lookAt = car.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    camera.lookAt(lookAt);
    camera.rotateX(this.shakeRot.x);
    camera.rotateY(this.shakeRot.y);
    camera.rotateZ(this.shakeRot.z);
  }

  getDesiredOffset(car, speedKmh) {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(car.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(car.quaternion);
    const up = new THREE.Vector3(0, 1, 0);
    
    switch (this.mode) {
      case 'bumper':
        return forward.clone().multiplyScalar(-0.5).add(up.clone().multiplyScalar(0.8));
      case 'hood':
        return forward.clone().multiplyScalar(-2.5).add(up.clone().multiplyScalar(1.4));
      case 'chase': {
        const dist = 7 + Math.min(8, speedKmh * 0.08);
        const height = 2 + Math.min(3, speedKmh * 0.03);
        return forward.clone().multiplyScalar(-dist).add(up.clone().multiplyScalar(height));
      }
      case 'orbit': {
        this.orbitAngle += dt * 0.3;
        const orbitDir = new THREE.Vector3(
          Math.sin(this.orbitAngle), 0, Math.cos(this.orbitAngle)
        ).applyQuaternion(car.quaternion);
        return orbitDir.multiplyScalar(this.orbitRadius).add(up.clone().multiplyScalar(this.orbitHeight));
      }
    }
    return new THREE.Vector3();
  }
}
