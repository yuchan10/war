import { hasLineOfSight } from './arena.js';

export function knifeTargets(player,targets,walls){
  return targets.filter(target=>{
    const angle=Math.atan2(target.y-player.y,target.x-player.x)-player.angle;
    return target.active!==false&&!target.subdued&&Math.hypot(target.x-player.x,target.y-player.y)<=55&&
      Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))<=Math.PI/3&&hasLineOfSight(player,target,walls);
  });
}

// One swing per click; the hit happens when the blade crosses in front of the player.
export function updateKnife(player,dt,down,play){
  const pressed=down&&!player.knifeAttackHeld;player.knifeAttackHeld=down;
  const previous=player.knifeSwing||0;
  player.knifeSwing=Math.max(0,previous-dt);
  player.knifeCooldown=Math.max(0,(player.knifeCooldown||0)-dt);
  if(!player.knifeEquipped)return false;
  if(pressed&&player.knifeCooldown<=0){
    player.knifeSwing=.32;player.knifeCooldown=.5;player.knifeHitDone=false;play('knife');
    return false;
  }
  if(previous>.22&&player.knifeSwing<=.22&&!player.knifeHitDone){
    player.knifeHitDone=true;return true;
  }
  return false;
}
