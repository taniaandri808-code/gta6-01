export class Achievements {
  constructor() {
    // 12 original named achievements
    this.definitions = [
      { id: 'first-blood', name: 'First Blood', desc: 'Complete your first mission', progress: 0, target: 1 },
      { id: 'wheelman', name: 'Wheelman', desc: 'Drive 100km total', progress: 0, target: 100 },
      { id: 'sharpshooter', name: 'Sharpshooter', desc: 'Land 50 headshots', progress: 0, target: 50 },
      { id: 'ghost', name: 'Ghost', desc: 'Complete 5 missions undetected', progress: 0, target: 5 },
      { id: 'tycoon', name: 'Tycoon', desc: 'Accumulate $1,000,000', progress: 0, target: 1000000 },
      { id: 'explorer', name: 'Explorer', desc: 'Discover all 20 districts', progress: 0, target: 20 },
      { id: 'collector', name: 'Collector', desc: 'Find 50 hidden packages', progress: 0, target: 50 },
      { id: 'speed-demon', name: 'Speed Demon', desc: 'Reach 300 km/h in any vehicle', progress: 0, target: 1 },
      { id: 'survivor', name: 'Survivor', desc: 'Survive 10 minutes at 5-star wanted', progress: 0, target: 1 },
      { id: 'arsenal', name: 'Arsenal', desc: 'Own all 30 weapon types', progress: 0, target: 30 },
      { id: 'property-mogul', name: 'Property Mogul', desc: 'Purchase 10 properties', progress: 0, target: 10 },
      { id: 'legend', name: 'Legend', desc: 'Unlock all other achievements', progress: 0, target: 11 }
    ];
    this.storageKey = 'gta6-achievements';
    this.listeners = new Set();
    this.load();
  }

  // Load progress from localStorage
  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      this.definitions.forEach(def => {
        if (saved[def.id]) {
          def.unlocked = saved[def.id].unlocked;
          def.progress = saved[def.id].progress ?? def.progress;
          def.unlockedAt = saved[def.id].unlockedAt;
        }
      });
    } catch (e) {
      console.warn('Failed to load achievements:', e);
    }
  }

  // Save progress to localStorage
  save() {
    const data = {};
    this.definitions.forEach(def => {
      data[def.id] = { unlocked: def.unlocked, progress: def.progress, unlockedAt: def.unlockedAt };
    });
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    this.notify();
  }

  // Unlock achievement by id, shows DOM toast
  unlock(id) {
    const def = this.definitions.find(d => d.id === id);
    if (!def || def.unlocked) return false;
    def.unlocked = true;
    def.unlockedAt = Date.now();
    def.progress = def.target;
    this.save();
    this.toast(def);
    this.checkLegend();
    return true;
  }

  // Increment progress counter, auto-unlocks when target reached
  increment(id, amount = 1) {
    const def = this.definitions.find(d => d.id === id);
    if (!def || def.unlocked) return;
    def.progress = Math.min(def.progress + amount, def.target);
    if (def.progress >= def.target) {
      this.unlock(id);
    } else {
      this.save();
    }
  }

  // Display DOM toast notification
  toast(def) {
    const el = document.createElement('div');
    el.className = 'achievement-toast';
    el.innerHTML = `<strong>🏆 Achievement Unlocked:</strong> ${def.name}<br><small>${def.desc}</small>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, 4000);
  }

  // Check and unlock Legend achievement when 11 others unlocked
  checkLegend() {
    const unlockedCount = this.definitions.filter(d => d.unlocked).length;
    if (unlockedCount >= 11) this.unlock('legend');
  }

  // Render achievement list to container element
  renderList(container) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return;
    container.innerHTML = '';
    this.definitions.forEach(def => {
      const row = document.createElement('div');
      row.className = 'achievement-row' + (def.unlocked ? ' unlocked' : '');
      const pct = Math.round((def.progress / def.target) * 100);
      row.innerHTML = `
        <span class="name">${def.name}</span>
        <span class="desc">${def.desc}</span>
        <div class="progress"><div class="bar" style="width:${pct}%"></div></div>
        <span class="status">${def.unlocked ? '✓' : pct + '%'}</span>
      `;
      container.appendChild(row);
    });
  }

  // Event subscription for UI updates
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.getAll()));
  }

  // Getters and utilities
  getAll() { return [...this.definitions]; }
  getUnlocked() { return this.definitions.filter(d => d.unlocked); }
  getLocked() { return this.definitions.filter(d => !d.unlocked); }
  getProgress(id) {
    const d = this.definitions.find(x => x.id === id);
    return d ? { current: d.progress, target: d.target, percent: Math.round((d.progress / d.target) * 100) } : null;
  }
  isUnlocked(id) { const d = this.definitions.find(x => x.id === id); return d ? d.unlocked : false; }
  getCompletionRate() { return Math.round((this.getUnlocked().length / this.definitions.length) * 100); }
  getRecent(limit = 5) { return this.getUnlocked().sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0)).slice(0, limit); }
  hasAnyUnlocked() { return this.definitions.some(d => d.unlocked); }
  reset() { this.definitions.forEach(d => { d.unlocked = false; d.progress = 0; d.unlockedAt = null; }); this.save(); }
  exportData() { return JSON.stringify(this.definitions.map(d => ({ id: d.id, name: d.name, unlocked: d.unlocked, progress: d.progress, unlockedAt: d.unlockedAt })), null, 2); }
  importData(json) { try { const arr = JSON.parse(json); arr.forEach(item => { const d = this.definitions.find(x => x.id === item.id); if (d) { d.unlocked = item.unlocked; d.progress = item.progress; d.unlockedAt = item.unlockedAt; } }); this.save(); return true; } catch (e) { console.error('Import failed:', e); return false; } }
}
