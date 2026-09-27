import { CONFIG } from './config.js';

// Weapon state is independent of input, rendering and enemy simulation.
export class Weapon {
  constructor(config = CONFIG.weapon) {
    this.capacity = config.magazineSize;
    this.ammo = this.capacity;
    this.reloadDuration = config.reloadDuration;
    this.reloadRemaining = 0;
  }

  get reloading() { return this.reloadRemaining > 0; }

  reload() {
    if (this.reloading || this.ammo === this.capacity) return false;
    this.reloadRemaining = this.reloadDuration;
    return true;
  }

  update(dt) {
    if (!this.reloading) return false;
    this.reloadRemaining = Math.max(0, this.reloadRemaining - dt);
    if (this.reloading) return false;
    this.ammo = this.capacity;
    return true;
  }

  consume() {
    if (this.reloading || this.ammo <= 0) return false;
    this.ammo--;
    return true;
  }
}
