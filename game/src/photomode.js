export class PhotoMode {
  constructor(scene, camera, hud) {
    this.scene = scene;
    this.camera = camera;
    this.hud = hud;
    this.enabled = false;
    this.keys = { w: false, a: false, s: false, d: false, q: false, e: false };
    this.moveSpeed = 10;
    this.mouseSensitivity = 0.002;
    this.pitch = 0;
    this.yaw = 0;
    this.toastEl = null;
    this.pointerLocked = false;

    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundClick = this.onClick.bind(this);
  }

  init() {
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('mousemove', this.boundMouseMove);
    this.canvas = this.scene.canvas || document.querySelector('canvas');
    this.canvas.addEventListener('click', this.boundClick);
  }

  onKeyDown(e) {
    const k = e.key.toLowerCase();
    if (k === 'p') this.toggle();
    if (this.enabled && k in this.keys) this.keys[k] = true;
  }

  onKeyUp(e) {
    const k = e.key.toLowerCase();
    if (this.enabled && k in this.keys) this.keys[k] = false;
  }

  onMouseMove(e) {
    if (!this.enabled || !this.pointerLocked) return;
    this.yaw -= e.movementX * this.mouseSensitivity;
    this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch - e.movementY * this.mouseSensitivity));
    this.updateCameraRotation();
  }

  onClick() {
    if (this.enabled && !this.pointerLocked) {
      this.canvas.requestPointerLock();
    }
  }

  updateCameraRotation() {
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  update(dt) {
    if (!this.enabled) return;
    const dir = new THREE.Vector3();
    if (this.keys.w) dir.z -= 1;
    if (this.keys.s) dir.z += 1;
    if (this.keys.a) dir.x -= 1;
    if (this.keys.d) dir.x += 1;
    if (this.keys.q) dir.y -= 1;
    if (this.keys.e) dir.y += 1;
    if (dir.lengthSq() > 0) {
      dir.normalize().applyEuler(new THREE.Euler(0, this.yaw, 0));
      this.camera.position.addScaledVector(dir, this.moveSpeed * dt);
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.hud?.hide?.();
      this.yaw = this.camera.rotation.y;
      this.pitch = this.camera.rotation.x;
      this.showToast('Photo Mode: ON — WASD/QE + Mouse, P to exit, Click to capture');
    } else {
      this.hud?.show?.();
      document.exitPointerLock();
      this.pointerLocked = false;
      this.showToast('Photo Mode: OFF');
    }
  }

  capture() {
    const renderer = this.scene.renderer;
    if (!renderer) return;
    const dataUrl = renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `gta6-photo-${Date.now()}.png`;
    a.click();
    this.showToast('Screenshot saved!');
  }

  showToast(msg) {
    if (this.toastEl) this.toastEl.remove();
    this.toastEl = document.createElement('div');
    this.toastEl.textContent = msg;
    this.toastEl.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:10px 20px;border-radius:4px;font-family:monospace;z-index:9999;pointer-events:none;';
    document.body.appendChild(this.toastEl);
    setTimeout(() => this.toastEl?.remove(), 2500);
  }

  dispose() {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('mousemove', this.boundMouseMove);
    this.canvas?.removeEventListener('click', this.boundClick);
    document.exitPointerLock();
  }
}
