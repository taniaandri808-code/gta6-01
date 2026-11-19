/**
 * Procedural radio system for Maravilla
 * WebAudio synthesis - no audio files needed
 */
import { RADIO_STATIONS } from './config.js';

export class Radio {
  constructor() {
    this.audioContext = null;
    this.currentStationIndex = -1; // -1 = off
    this.stations = RADIO_STATIONS;
    this.gainNode = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.currentTrackName = '';
    this.schedulers = [];
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
    if (this.currentStationIndex >= 0) {
      this.startStation(this.currentStationIndex);
    }
  }

  stop() {
    if (!this.audioContext) return;
    for (const scheduler of this.schedulers) {
      clearTimeout(scheduler);
    }
    this.schedulers = [];
    this.isPlaying = false;
    this.currentTrackName = '';
  }

  nextStation() {
    this.stop();
    this.currentStationIndex = (this.currentStationIndex + 1) % (this.stations.length + 1) - 1;
    this.play();
    return this.getCurrentStationInfo();
  }

  prevStation() {
    this.stop();
    this.currentStationIndex = (this.currentStationIndex - 1 + this.stations.length + 1) % (this.stations.length + 1) - 1;
    this.play();
    return this.getCurrentStationInfo();
  }

  setStation(index) {
    if (index < -1 || index >= this.stations.length) return;
    this.stop();
    this.currentStationIndex = index;
    this.play();
    return this.getCurrentStationInfo();
  }

  getCurrentStationInfo() {
    if (this.currentStationIndex === -1) {
      return { name: 'RADIO OFF', genre: '', track: '', color: 0x888888 };
    }
    const station = this.stations[this.currentStationIndex];
    return {
      name: station.name,
      genre: station.genre,
      track: this.currentTrackName,
      color: station.color
    };
  }

  startStation(stationIndex) {
    const station = this.stations[stationIndex];
    this.isPlaying = true;
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0.5;
    this.gainNode.connect(this.masterGain);
    this.generateTrack(station);
  }

  generateTrack(station) {
    for (const s of this.schedulers) clearTimeout(s);
    this.schedulers = [];
    const ctx = this.audioContext;
    const tempo = station.tempo;
    const beatDuration = 60 / tempo;
    const bars = 4;
    const beatsPerBar = 4;
    const totalBeats = bars * beatsPerBar;
    const loopDuration = totalBeats * beatDuration;
    const scales = {
      major: [0, 2, 4, 5, 7, 9, 11, 12],
      minor: [0, 2, 3, 5, 7, 8, 10, 12],
      pentatonic: [0, 2, 4, 7, 9, 12],
      phrygian: [0, 1, 3, 5, 7, 8, 10, 12]
    };
    const scale = scales[station.scale] || scales.major;
    const rootNote = 48;
    const waveform = station.waveform;
    const trackNames = [
      'Neon Nights', 'Midnight Drive', 'Coastal Breeze', 'City Lights',
      'Underground', 'Sunset Boulevard', 'Harbor Freq', 'Downtown Pulse'
    ];
    this.currentTrackName = trackNames[Math.floor(Math.random() * trackNames.length)];
    let nextNoteTime = ctx.currentTime + 0.1;
    for (let beat = 0; beat < totalBeats; beat++) {
      const bar = Math.floor(beat / beatsPerBar);
      const step = beat % beatsPerBar;
      if (step === 0) this.scheduleBass(ctx, nextNoteTime, rootNote - 12, beatDuration * 1.5, waveform);
      if (Math.random() < 0.6) {
        const noteIndex = Math.floor(Math.random() * scale.length);
        const note = rootNote + scale[noteIndex] + (bar % 2 === 0 ? 0 : 12);
        this.scheduleLead(ctx, nextNoteTime, note, beatDuration * 0.8, waveform);
      }
      if (step % 2 === 0) this.scheduleKick(ctx, nextNoteTime);
      else this.scheduleHihat(ctx, nextNoteTime, step === 2 ? 0.3 : 0.12);
      if (step === 2) this.scheduleSnare(ctx, nextNoteTime);
      if (step === 0) this.schedulePad(ctx, nextNoteTime, rootNote, beatDuration * 2, waveform);
      nextNoteTime += beatDuration;
    }
    const restartMs = (loopDuration + 0.3) * 1000;
    const scheduler = setTimeout(() => {
      if (this.isPlaying && this.currentStationIndex >= 0) {
        this.generateTrack(this.stations[this.currentStationIndex]);
      }
    }, restartMs);
    this.schedulers.push(scheduler);
  }
  scheduleBass(ctx, time, note, duration, waveform) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = waveform;
    osc.frequency.value = 440 * Math.pow(2, (note - 69) / 12);
    osc.connect(gain);
    gain.connect(this.gainNode);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
    osc.start(time);
    osc.stop(time + duration + 0.1);
  }

  scheduleLead(ctx, time, note, duration, waveform) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = waveform === 'sawtooth' ? 'triangle' : waveform;
    osc.frequency.value = 440 * Math.pow(2, (note - 69) / 12);
    osc.connect(gain);
    gain.connect(this.gainNode);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.15, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.type = 'sine';
    vibrato.frequency.value = 5;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
    vibratoGain.gain.value = 2;
    vibrato.start(time);
    vibrato.stop(time + duration + 0.1);
    osc.start(time);
    osc.stop(time + duration + 0.1);
  }

  schedulePad(ctx, time, rootNote, duration, waveform) {
    const notes = [0, 4, 7];
    for (const interval of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 440 * Math.pow(2, (rootNote + interval - 69) / 12);
      osc.connect(gain);
      gain.connect(this.gainNode);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.08, time + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      osc.start(time);
      osc.stop(time + duration + 0.5);
    }
  }

  scheduleKick(ctx, time) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.3);
    osc.connect(gain);
    gain.connect(this.gainNode);
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    osc.start(time);
    osc.stop(time + 0.4);
  }

  scheduleSnare(ctx, time) {
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    noise.start(time);
  }

  scheduleHihat(ctx, time, volume) {
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i * 50);
    noise.buffer = buffer;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    noise.start(time);
  }

  setVolume(value) {
    if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, value));
  }

  update(delta) {}
}
