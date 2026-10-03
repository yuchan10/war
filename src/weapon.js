import { CONFIG } from './config.js';

// Weapon state is independent of input, rendering and enemy simulation.
export class Weapon {
  constructor(config = CONFIG.weapon) {
    this.capacity = config.magazineSize;
    this.ammo = this.capacity;
    this.reserveCapacity=config.reserveCapacity??CONFIG.weapon.reserveCapacity;this.reserve=this.reserveCapacity;
    this.reloadDuration = config.reloadDuration;
    this.reloadRemaining = 0;
  }

  get reloading() { return this.reloadRemaining > 0; }

  reload() {
    if (this.reloading || this.ammo === this.capacity || this.reserve<=0) return false;
    this.reloadRemaining = this.reloadDuration;
    return true;
  }

  update(dt) {
    if (!this.reloading) return false;
    this.reloadRemaining = Math.max(0, this.reloadRemaining - dt);
    if (this.reloading) return false;
    const loaded=Math.min(this.capacity-this.ammo,this.reserve);
    this.ammo+=loaded;this.reserve-=loaded;
    return true;
  }

  collectAmmo(amount) {
    const taken=Math.max(0,Math.min(amount,this.reserveCapacity-this.reserve));this.reserve+=taken;return taken;
  }

  consume() {
    if (this.reloading || this.ammo <= 0) return false;
    this.ammo--;
    return true;
  }
}
