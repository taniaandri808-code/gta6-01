export class Garage {
  constructor(carMesh) {
    this.carMesh = carMesh;
    this.liveries = [
      { name: 'Midnight', primary: '#0a0a0f', secondary: '#1a1a2e', decal: 'none' },
      { name: 'Neon Vice', primary: '#ff006e', secondary: '#8338ec', decal: 'stripes' },
      { name: 'Desert Storm', primary: '#e8c58d', secondary: '#c9a66b', decal: 'camouflage' },
      { name: 'Arctic Wolf', primary: '#f0f0f5', secondary: '#a8b2d1', decal: 'tribal' },
      { name: 'Carbon Phantom', primary: '#111111', secondary: '#2d2d2d', decal: 'carbon' }
    ];
    this.currentLiver = this.loadChoice() || this.liveries[0];
    this.panel = null;
    this.initPanel();
    this.apply(this.currentLiver);
  }

  initPanel() {
    this.panel = document.createElement('div');
    this.panel.id = 'garage-panel';
    this.panel.style.cssText = 'position: fixed; bottom: 20px; left: 20px; z-index: 1000; background: rgba(10,10,20,0.95); border: 1px solid #333; border-radius: 8px; padding: 12px; font-family: monospace; display: flex; gap: 8px; flex-wrap: wrap; max-width: 400px;';
    this.liveries.forEach(livery => {
      const card = document.createElement('button');
      card.type = 'button';
      card.title = livery.name;
      card.style.cssText = 'width: 60px; height: 40px; border: 2px solid transparent; border-radius: 4px; cursor: pointer; position: relative; background: linear-gradient(135deg, ' + livery.primary + ', ' + livery.secondary + ');';
      if (livery.decal !== 'none') {
        card.style.backgroundImage = this.getDecalPattern(livery.decal);
      }
      card.addEventListener('click', () => this.apply(livery));
      if (livery === this.currentLiver) card.style.borderColor = '#ffd700';
      card.dataset.livery = livery.name;
      this.panel.appendChild(card);
    });
    document.body.appendChild(this.panel);
  }

  getDecalPattern(style) {
    const patterns = {
      stripes: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 8px)',
      camouflage: 'radial-gradient(circle at 20% 30%, rgba(0,0,0,0.2) 20%, transparent 20%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.15) 15%, transparent 15%)',
      tribal: 'repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(255,255,255,0.1) 6px, rgba(255,255,255,0.1) 12px)',
      carbon: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.3), rgba(0,0,0,0.3) 2px, transparent 2px, transparent 4px)'
    };
    return patterns[style] || 'none';
  }

  apply(livery) {
    this.currentLiver = livery;
    if (!this.carMesh) return;
    this.carMesh.traverse(child => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat, i) => {
          const color = i % 2 === 0 ? livery.primary : livery.secondary;
          if (mat.color) mat.color.setStyle(color);
          if (mat.emissive) mat.emissive.setStyle(color).multiplyScalar(0.1);
        });
      }
    });
    this.updateSelectionUI();
    this.persistChoice();
  }

  updateSelectionUI() {
    this.panel.querySelectorAll('button').forEach(btn => {
      btn.style.borderColor = btn.dataset.livery === this.currentLiver.name ? '#ffd700' : 'transparent';
    });
  }

  persistChoice() {
    try { localStorage.setItem('garage_livery', JSON.stringify(this.currentLiver)); } catch (_) {}
  }

  loadChoice() {
    try { const saved = localStorage.getItem('garage_livery'); return saved ? JSON.parse(saved) : null; } catch (_) { return null; }
  }

  destroy() {
    this.panel?.remove();
    this.panel = null;
  }
}
