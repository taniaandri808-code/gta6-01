// Sound effects for Maravilla: tiny WebAudio synth, no audio files needed.
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = true;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    } catch (e) {
      this.enabled = false;
    }
  }

  play(name) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.connect(g);
    g.connect(this.master);
    const cfg = {
      blip: [880, 0.08, 'square', 0.12],
      pickup: [660, 0.15, 'triangle', 0.2],
      objective_complete: [520, 0.3, 'sine', 0.25],
      mission_complete: [740, 0.5, 'sine', 0.3],
      mission_failed: [180, 0.5, 'sawtooth', 0.3],
      hit: [140, 0.1, 'sawtooth', 0.2],
      gunshot: [90, 0.08, 'square', 0.3],
      explosion: [60, 0.6, 'sawtooth', 0.4],
      siren: [720, 0.4, 'triangle', 0.15],
      enter: [330, 0.12, 'sine', 0.15],
    }[name] || [440, 0.1, 'sine', 0.1];
    o.type = cfg[2];
    o.frequency.setValueAtTime(cfg[0], t);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, cfg[0] * 0.5), t + cfg[1]);
    g.gain.setValueAtTime(cfg[3], t);
    g.gain.exponentialRampToValueAtTime(0.001, t + cfg[1]);
    o.start(t);
    o.stop(t + cfg[1] + 0.05);
  }

  setVolume(v) { if (this.master) this.master.gain.value = v; }
}
