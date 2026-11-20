export class Deliveries {
  constructor(scene, city, player, hud, config = {}) {
    this.scene = scene;
    this.city = city;
    this.player = player;
    this.hud = hud;
    this.config = {
      baseTimePerKm: 30,
      basePayoutPerKm: 50,
      streakBonus: 0.15,
      maxStreak: 10,
      ...config
    };
    
    this.active = false;
    this.currentJob = null;
    this.streak = 0;
    this.totalEarned = 0;
    this.markers = [];
    this.timer = 0;
    this.timeLimit = 0;
  }

  getRandomRoadPoint() {
    const roads = this.city.getRoadSegments();
    const seg = roads[Math.floor(Math.random() * roads.length)];
    const t = Math.random();
    const x = seg.x1 + (seg.x2 - seg.x1) * t;
    const z = seg.z1 + (seg.z2 - seg.z1) * t;
    return new THREE.Vector3(x, 0.5, z);
  }

  startJob() {
    if (this.active) return false;
    
    const pickup = this.getRandomRoadPoint();
    let dropoff;
    let dist = 0;
    do {
      dropoff = this.getRandomRoadPoint();
      dist = pickup.distanceTo(dropoff);
    } while (dist < 500 || dist > 5000);
    
    this.currentJob = {
      pickup,
      dropoff,
      distance: dist,
      state: 'pickup',
      startTime: performance.now()
    };
    
    this.timeLimit = (dist / 1000) * this.config.baseTimePerKm * 1000;
    this.timer = this.timeLimit;
    this.active = true;
    
    this.createMarkers();
    this.hud.showMessage(`New delivery: ${(dist/1000).toFixed(1)} km`);
    return true;
  }

  createMarkers() {
    this.clearMarkers();
    const { pickup, dropoff } = this.currentJob;
    
    const geo = new THREE.ConeGeometry(3, 6, 8);
    const pickupMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.8 });
    const dropoffMat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.8 });
    
    this.pickupMarker = new THREE.Mesh(geo, pickupMat);
    this.pickupMarker.position.copy(pickup);
    this.pickupMarker.rotation.x = -Math.PI / 2;
    this.scene.add(this.pickupMarker);
    
    this.dropoffMarker = new THREE.Mesh(geo, dropoffMat);
    this.dropoffMarker.position.copy(dropoff);
    this.dropoffMarker.rotation.x = -Math.PI / 2;
    this.scene.add(this.dropoffMarker);
    
    this.markers = [this.pickupMarker, this.dropoffMarker];
  }

  clearMarkers() {
    this.markers.forEach(m => {
      this.scene.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    });
    this.markers = [];
  }

  update(dt) {
    if (!this.active || !this.currentJob) return;
    
    const { pickup, dropoff, state } = this.currentJob;
    const pos = this.player.position;
    const target = state === 'pickup' ? pickup : dropoff;
    const dist = pos.distanceTo(target);
    
    this.timer -= dt;
    
    this.hud.updateDeliveryHUD({
      target: target.clone(),
      distance: dist,
      timeLeft: Math.max(0, this.timer),
      state
    });
    
    if (dist < 5) {
      if (state === 'pickup') {
        this.currentJob.state = 'dropoff';
        this.hud.showMessage('Package picked up! Deliver to destination.');
        this.scene.remove(this.pickupMarker);
        this.pickupMarker.geometry.dispose();
        this.pickupMarker.material.dispose();
      } else {
        this.completeDelivery(true);
      }
    }
    
    if (this.timer <= 0) {
      this.completeDelivery(false);
    }
    
    this.animateMarkers(dt);
  }

  animateMarkers(dt) {
    this.markers.forEach(m => {
      m.rotation.z += dt * 0.002;
      m.position.y = 0.5 + Math.sin(performance.now() * 0.003) * 0.3;
    });
  }

  completeDelivery(onTime) {
    const { distance } = this.currentJob;
    const km = distance / 1000;
    let payout = km * this.config.basePayoutPerKm;
    
    if (onTime) {
      this.streak = Math.min(this.streak + 1, this.config.maxStreak);
      payout *= 1 + this.streak * this.config.streakBonus;
      this.hud.showMessage(`Delivered! +$${Math.round(payout)} (Streak: ${this.streak})`);
    } else {
      this.streak = 0;
      payout *= 0.5;
      this.hud.showMessage(`Late! +$${Math.round(payout)} (Streak broken)`);
    }
    
    this.totalEarned += payout;
    this.active = false;
    this.currentJob = null;
    this.clearMarkers();
    this.hud.hideDeliveryHUD();
  }

  cancelJob() {
    if (!this.active) return;
    this.active = false;
    this.currentJob = null;
    this.streak = 0;
    this.clearMarkers();
    this.hud.hideDeliveryHUD();
    this.hud.showMessage('Delivery cancelled');
  }

  getStats() {
    return {
      active: this.active,
      streak: this.streak,
      totalEarned: this.totalEarned,
      timeLeft: this.timer
    };
  }
}
