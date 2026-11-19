/**
 * Seeded random number generator for deterministic gameplay
 */

export class SeededRandom {
  constructor(seed = 12345) {
    this.seed = seed >>> 0;
  }

  next() {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min, max) {
    return this.next() * (max - min) + min;
  }

  nextBool(prob = 0.5) {
    return this.next() < prob;
  }

  choice(arr) {
    return arr[this.nextInt(0, arr.length - 1)];
  }

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  getState() {
    return this.seed;
  }

  setState(seed) {
    this.seed = seed >>> 0;
  }
}

export const globalRandom = new SeededRandom();
