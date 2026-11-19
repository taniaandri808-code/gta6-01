/**
 * Chase camera for Maravilla
 */

export class ChaseCamera {
  constructor(camera, target) {
    this.camera = camera;
    this.target = target;
    this.offset = new THREE.Vector3(0, 5, -12);
    this.lookAtOffset = new THREE.Vector3(0, 2, 0);
    this.currentOffset = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0.3;
    this.distance = 12;
    this.minDistance = 5;
    this.maxDistance = 25;
    this.smoothing = 0.1;
    this.lookAtSmoothing = 0.15;
    this.collisionRadius = 0.5;
  }

  update(delta, input) {
    if (!this.target) return;

    // Handle mouse input for camera orbit
    if (input.isMouseDown(2) || (input.isMouseDown(0) && input.isDown('ControlLeft'))) {
      const { x, y } = input.getMouseDelta();
      this.yaw -= x * 0.002;
      this.pitch = Math.max(-0.5, Math.min(1.2, this.pitch - y * 0.002));
    }

    // Scroll to zoom
    // (wheel handled in main)

    // Calculate desired offset
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    this.offset.x = sinYaw * cosPitch * this.distance;
    this.offset.y = sinPitch * this.distance + 2;
    this.offset.z = cosYaw * cosPitch * this.distance;

    // Smooth camera position
    const targetPos = this.target.position.clone().add(this.lookAtOffset);
    const desiredPos = targetPos.clone().add(this.offset);
    
    // Simple collision check - raycast from target to desired camera pos
    // Simplified: just smooth
    this.currentOffset.lerp(this.offset, this.smoothing);
    this.currentLookAt.lerp(targetPos, this.lookAtSmoothing);

    this.camera.position.copy(this.currentLookAt).add(this.currentOffset);
    this.camera.lookAt(this.currentLookAt);
  }

  setDistance(dist) {
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, dist));
  }

  reset() {
    this.yaw = 0;
    this.pitch = 0.3;
    this.distance = 12;
  }
}

export class FootCamera {
  constructor(camera, player) {
    this.camera = camera;
    this.player = player;
    this.yaw = 0;
    this.pitch = 0;
    this.sensitivity = 0.002;
    this.height = 1.7;
  }

  update(delta, input) {
    if (!this.player) return;

    const { x, y } = input.getMouseDelta();
    this.yaw -= x * this.sensitivity;
    this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch - y * this.sensitivity));

    const cosPitch = Math.cos(this.pitch);
    const forward = new THREE.Vector3(
      Math.sin(this.yaw) * cosPitch,
      Math.sin(this.pitch),
      Math.cos(this.yaw) * cosPitch
    );

    const pos = this.player.position.clone();
    pos.y += this.height;
    this.camera.position.copy(pos);
    this.camera.lookAt(pos.clone().add(forward));
  }

  getForward() {
    const cosPitch = Math.cos(this.pitch);
    return new THREE.Vector3(
      Math.sin(this.yaw) * cosPitch,
      0,
      Math.cos(this.yaw) * cosPitch
    ).normalize();
  }

  getRight() {
    const forward = this.getForward();
    return new THREE.Vector3(-forward.z, 0, forward.x);
  }
}
