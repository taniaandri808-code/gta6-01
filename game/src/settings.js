export class SettingsMenu {
  constructor(renderer, audioManager, inputManager) {
    this.renderer = renderer;
    this.audio = audioManager;
    this.input = inputManager;
    this.tab = null;
    this.defaults = {
      quality: 'high',
      drawDistance: 500,
      masterVolume: 0.8,
      radioVolume: 0.6,
      invertY: false,
      sensitivity: 1.0
    };
    this.settings = { ...this.defaults };
  }

  init() {
    this.load();
    this.buildTab();
    this.applyAll();
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem('gta6-settings') || '{}');
      this.settings = { ...this.defaults, ...saved };
    } catch {
      this.settings = { ...this.defaults };
    }
  }

  save() {
    localStorage.setItem('gta6-settings', JSON.stringify(this.settings));
  }

  buildTab() {
    this.tab = document.createElement('div');
    this.tab.className = 'settings-tab';
    this.tab.innerHTML = `
      <div class="setting-group">
        <label>Quality Preset
          <select id="quality-preset">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="ultra">Ultra</option>
          </select>
        </label>
      </div>
      <div class="setting-group">
        <label>Draw Distance: <span id="draw-distance-val">${this.settings.drawDistance}</span>m
          <input type="range" id="draw-distance" min="100" max="2000" step="50">
        </label>
      </div>
      <div class="setting-group">
        <label>Master Volume: <span id="master-vol-val">${Math.round(this.settings.masterVolume * 100)}%</span>
          <input type="range" id="master-volume" min="0" max="1" step="0.05">
        </label>
      </div>
      <div class="setting-group">
        <label>Radio Volume: <span id="radio-vol-val">${Math.round(this.settings.radioVolume * 100)}%</span>
          <input type="range" id="radio-volume" min="0" max="1" step="0.05">
        </label>
      </div>
      <div class="setting-group">
        <label>Invert Y Axis
          <input type="checkbox" id="invert-y">
        </label>
      </div>
      <div class="setting-group">
        <label>Sensitivity: <span id="sens-val">${this.settings.sensitivity.toFixed(1)}</span>
          <input type="range" id="sensitivity" min="0.2" max="3.0" step="0.1">
        </label>
      </div>
      <button id="reset-settings" class="danger">Reset to Defaults</button>
    `;
    this.bindEvents();
  }

  bindEvents() {
    this.tab.querySelector('#quality-preset').value = this.settings.quality;
    this.tab.querySelector('#draw-distance').value = this.settings.drawDistance;
    this.tab.querySelector('#master-volume').value = this.settings.masterVolume;
    this.tab.querySelector('#radio-volume').value = this.settings.radioVolume;
    this.tab.querySelector('#invert-y').checked = this.settings.invertY;
    this.tab.querySelector('#sensitivity').value = this.settings.sensitivity;

    this.tab.querySelector('#quality-preset').addEventListener('change', e => {
      this.settings.quality = e.target.value;
      this.applyQuality();
      this.save();
    });

    this.tab.querySelector('#draw-distance').addEventListener('input', e => {
      this.settings.drawDistance = parseInt(e.target.value);
      this.tab.querySelector('#draw-distance-val').textContent = this.settings.drawDistance;
      this.renderer.setFogDistance(this.settings.drawDistance);
      this.save();
    });

    this.tab.querySelector('#master-volume').addEventListener('input', e => {
      this.settings.masterVolume = parseFloat(e.target.value);
      this.tab.querySelector('#master-vol-val').textContent = Math.round(this.settings.masterVolume * 100) + '%';
      this.audio.setMasterGain(this.settings.masterVolume);
      this.save();
    });

    this.tab.querySelector('#radio-volume').addEventListener('input', e => {
      this.settings.radioVolume = parseFloat(e.target.value);
      this.tab.querySelector('#radio-vol-val').textContent = Math.round(this.settings.radioVolume * 100) + '%';
      this.audio.setRadioGain(this.settings.radioVolume);
      this.save();
    });

    this.tab.querySelector('#invert-y').addEventListener('change', e => {
      this.settings.invertY = e.target.checked;
      this.input.setInvertY(this.settings.invertY);
      this.save();
    });

    this.tab.querySelector('#sensitivity').addEventListener('input', e => {
      this.settings.sensitivity = parseFloat(e.target.value);
      this.tab.querySelector('#sens-val').textContent = this.settings.sensitivity.toFixed(1);
      this.input.setSensitivity(this.settings.sensitivity);
      this.save();
    });

    this.tab.querySelector('#reset-settings').addEventListener('click', () => {
      this.settings = { ...this.defaults };
      this.buildTab();
      this.applyAll();
      this.save();
    });
  }

  applyQuality() {
    const presets = {
      low: { pixelRatio: 0.5, shadows: false, ssao: false },
      medium: { pixelRatio: 0.75, shadows: true, ssao: false },
      high: { pixelRatio: 1.0, shadows: true, ssao: true },
      ultra: { pixelRatio: 1.5, shadows: true, ssao: true }
    };
    const p = presets[this.settings.quality] || presets.high;
    this.renderer.setPixelRatio(p.pixelRatio);
    this.renderer.setShadows(p.shadows);
    this.renderer.setSSAO(p.ssao);
  }

  applyAll() {
    this.applyQuality();
    this.renderer.setFogDistance(this.settings.drawDistance);
    this.audio.setMasterGain(this.settings.masterVolume);
    this.audio.setRadioGain(this.settings.radioVolume);
    this.input.setInvertY(this.settings.invertY);
    this.input.setSensitivity(this.settings.sensitivity);
  }

  getTab() {
    return this.tab;
  }

  getSettings() {
    return { ...this.settings };
  }
}
