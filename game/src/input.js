/**
 * Input handling for Maravilla
 */

export class InputManager {
  constructor() {
    this.keys = new Set();
    this.keysPressed = new Set();
    this.keysReleased = new Set();
    this.mouse = { x: 0, y: 0, deltaX: 0, deltaY: 0, buttons: new Set() };
    this.locked = false;
    this._listeners = {};
    this._bindEvents();
  }

  on(code, fn) {
    (this._listeners[code] = this._listeners[code] || []).push(fn);
  }

  _fire(code) {
    const fns = this._listeners[code];
    if (fns) for (const fn of fns) { try { fn(); } catch (err) { console.error(err); } }
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (!this.keys.has(code)) {
        this.keysPressed.add(code);
        this._fire(code);
      }
      this.keys.add(code);
      
      // Prevent default for game keys
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight', 'KeyE', 'KeyR', 'KeyM', 'KeyP', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'ControlLeft'].includes(code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      this.keys.delete(code);
      this.keysReleased.add(code);
    });

    window.addEventListener('mousemove', (e) => {
      if (this.locked) {
        this.mouse.deltaX = e.movementX;
        this.mouse.deltaY = e.movementY;
      } else {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      }
    });

    window.addEventListener('mousedown', (e) => {
      this.mouse.buttons.add(e.button);
      if (!this.locked && e.button === 0) {
        this.lockPointer();
      }
    });

    window.addEventListener('mouseup', (e) => {
      this.mouse.buttons.delete(e.button);
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === document.body;
    });
  }

  lockPointer() {
    document.body.requestPointerLock().catch(() => {});
  }

  unlockPointer() {
    document.exitPointerLock();
  }

  isDown(code) {
    return this.keys.has(code);
  }

  wasPressed(code) {
    return this.keysPressed.has(code);
  }

  wasReleased(code) {
    return this.keysReleased.has(code);
  }

  isMouseDown(button = 0) {
    return this.mouse.buttons.has(button);
  }

  getMouseDelta() {
    const dx = this.mouse.deltaX;
    const dy = this.mouse.deltaY;
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
    return { x: dx, y: dy };
  }

  clearFrame() {
    this.keysPressed.clear();
    this.keysReleased.clear();
  }
}
