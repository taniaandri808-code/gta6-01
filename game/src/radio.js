export class RadioStations {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.stationGain = null;
    this.currentStation = 0;
    this.isPlaying = false;
    this.schedulers = [];
    this.stations = [
      { name: 'NEON WAVE', genre: 'SYNTHWAVE', color: '#ff00ff', tempo: 110, waveform: 'sawtooth', scale: 'minor' },
      { name: 'MIDNIGHT FM', genre: 'LOFI', color: '#00ffff', tempo: 85, waveform: 'triangle', scale: 'pentatonic' },
      { name: 'COAST DRIVE', genre: 'CHILLWAVE', color: '#ff8800', tempo: 95, waveform: 'sine', scale: 'major' }
    ];
    this.trackNames = [
      'Neon Nights', 'Midnight Drive', 'Coastal Breeze', 'City Lights',
      'Underground', 'Sunset Boulevard', 'Harbor Freq', 'Downtown Pulse'
    ];
  }

  init() {
    if (this.audioContext) return;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.audioContext.destination);
  }

  play() {
    this.init();
    if (this.audioContext.state === 'suspended') this.audioContext.resume();
    this.startStation(this.currentStation);
    this.showToast(this.stations[this.currentStation].name);
  }

  stop() {
    if (!this.audioContext) return;
    for (const s of this.schedulers) clearTimeout(s);
    this.schedulers = [];
    this.isPlaying = false;
  }

  next() {
    this.stop();
    this.currentStation = (this.currentStation + 1) % this.stations.length;
    this.play();
  }

  startStation(index) {
    this.isPlaying = true;
    this.stationGain = this.audioContext.createGain();
    this.stationGain.gain.value = 0.5;
    this.stationGain.connect(this.masterGain);
    this.generateTrack(this.stations[index]);
  }

  generateTrack(station) {
    for (const s of this.schedulers) clearTimeout(s);
    this.schedulers = [];
    const ctx = this.audioContext;
    const beatDuration = 60 / station.tempo;
    const totalBeats = 16;
    const loopDuration = totalBeats * beatDuration;
    const scales = {
      major: [0, 2, 4, 5, 7, 9, 11, 12],
      minor: [0, 2, 3, 5, 7, 8, 10, 12],
      pentatonic: [0, 2, 4, 7, 9, 12]
    };
    const scale = scales[station.scale];
    const rootNote = 48;
    const waveform = station.waveform;
    this.currentTrackName = this.trackNames[Math.floor(Math.random() * this.trackNames.length)];
    let t = ctx.currentTime + 0.1;
    for (let beat = 0; beat < totalBeats; beat++) {
      const step = beat % 4;
      if (step === 0) this.scheduleBass(ctx, t, rootNote - 12, beatDuration * 1.5, waveform);
      if (Math.random() < 0.6) {
        const note = rootNote + scale[Math.floor(Math.random() * scale.length)];
        this.scheduleLead(ctx, t, note, beatDuration * 0.8, waveform);
      }
      if (step % 2 === 0) this.scheduleKick(ctx, t);
      else this.scheduleHihat(ctx, t, step === 2 ? 0.3 : 0.12);
      if (step === 2) this.scheduleSnare(ctx, t);
      if (step === 0) this.schedulePad(ctx, t, rootNote, beatDuration * 2, waveform);
      t += beatDuration;
    }
    const scheduler = setTimeout(() => {
      if (this.isPlaying) this.generateTrack(station);
    }, (loopDuration + 0.3) * 1000);
    this.schedulers.push(scheduler);
  }

  scheduleBass(ctx, time, note, dur, wave) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = 440 * 2 ** ((note - 69) / 12);
    osc.connect(gain).connect(this.stationGain);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
    osc.start(time);
    osc.stop(time + dur + 0.1);
  }

  scheduleLead(ctx, time, note, dur, wave) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave === 'sawtooth' ? 'triangle' : wave;
    osc.frequency.value = 440 * 2 ** ((note - 69) / 12);
    osc.connect(gain).connect(this.stationGain);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.15, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
    const vib = ctx.createOscillator();
    const vGain = ctx.createGain();
    vib.type = 'sine'; vib.frequency.value = 5;
    vib.connect(vGain).connect(osc.frequency);
    vGain.gain.value = 2;
    vib.start(time); vib.stop(time + dur + 0.1);
    osc.start(time); osc.stop(time + dur + 0.1);
  }

  schedulePad(ctx, time, root, dur, wave) {
    for (const iv of [0, 4, 7]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 440 * 2 ** ((root + iv - 69) / 12);
      osc.connect(gain).connect(this.stationGain);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.08, time + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.start(time); osc.stop(time + dur + 0.5);
    }
  }

  scheduleKick(ctx, time) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.3);
    osc.connect(gain).connect(this.stationGain);
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    osc.start(time); osc.stop(time + 0.4);
  }

  scheduleSnare(ctx, time) {
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buf;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass'; filter.frequency.value = 1000;
    noise.connect(filter).connect(gain).connect(this.stationGain);
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    noise.start(time);
  }

  scheduleHihat(ctx, time, vol) {
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i * 50);
    noise.buffer = buf;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass'; filter.frequency.value = 5000;
    noise.connect(filter).connect(gain).connect(this.stationGain);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    noise.start(time);
  }

  showToast(name) {
    let el = document.getElementById('radio-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'radio-toast';
      el.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#fff;padding:12px 24px;border-radius:8px;font-family:monospace;font-size:14px;letter-spacing:2px;z-index:1000;opacity:0;transition:opacity .3s';
      document.body.appendChild(el);
    }
    el.textContent = name;
    el.style.opacity = '1';
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.style.opacity = '0', 2000);
  }
}
