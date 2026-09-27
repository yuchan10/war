import { moveBody } from './arena.js';
import { clamp, direction } from './core.js';
import { CONFIG } from './config.js';

export function applyKnockback(entity, vx, vy, strength) {
  const d = direction(vx, vy);
  const impulse = strength * (entity.knockbackScale ?? 1);
  entity.knockX = (entity.knockX || 0) + d.x * impulse;
  entity.knockY = (entity.knockY || 0) + d.y * impulse;
  const speed = Math.hypot(entity.knockX, entity.knockY);
  if (speed > CONFIG.knockback.maxSpeed) {
    entity.knockX *= CONFIG.knockback.maxSpeed / speed;
    entity.knockY *= CONFIG.knockback.maxSpeed / speed;
  }
}

export function moveKnockback(entity, dt, walls) {
  const a = CONFIG.arena, decay = Math.exp(-CONFIG.knockback.drag * dt);
  const distance = (1 - decay) / CONFIG.knockback.drag;
  moveBody(entity,(entity.knockX || 0)*distance,(entity.knockY || 0)*distance,walls);
  entity.knockX = (entity.knockX || 0) * decay;
  entity.knockY = (entity.knockY || 0) * decay;
}
