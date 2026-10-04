import { CONFIG } from './config.js';
export function playerMoveSpeed(player,weapon,triggerDown){
  const c=CONFIG.player,speed=c.speed*CONFIG.movementScale;
  if(player.knifeEquipped)return speed*c.knifeMoveScale;
  if(player.unarmed)return speed;
  if(weapon.reloading)return speed*c.reloadMoveScale;
  if(player.shotTimer>0||(triggerDown&&weapon.ammo>0))return speed*c.firingMoveScale;
  return speed;
}
