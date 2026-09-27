import { CONFIG } from './config.js';
export function playerMoveSpeed(player,weapon,triggerDown){
  const c=CONFIG.player;
  if(player.unarmed)return c.speed;
  if(weapon.reloading)return c.speed*c.reloadMoveScale;
  if(player.shotTimer>0||(triggerDown&&weapon.ammo>0))return c.speed*c.firingMoveScale;
  return c.speed;
}
