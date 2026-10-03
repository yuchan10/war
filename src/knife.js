import { bodyHit } from './injury.js';
export const KNIFE_DAMAGE=60;
export const KNIFE_DURATION=.42,KNIFE_HIT_TIME=.12;
const smooth=t=>t*t*(3-2*t);
// Slow preparation, fast cut through the target, then a relaxed return to guard.
export function knifePose(remaining=0){
 const t=remaining>0?Math.max(0,KNIFE_DURATION-remaining):KNIFE_DURATION;
 const keys=[[0,.25,22,-.15],[.07,-.9,17,-.35],[KNIFE_HIT_TIME,0,26,-.08],[.21,1,24,.2],[KNIFE_DURATION,.25,22,-.15]];
 let i=1;while(i<keys.length-1&&t>keys[i][0])i++;
 const a=keys[i-1],b=keys[i],u=smooth(Math.min(1,Math.max(0,(t-a[0])/(b[0]-a[0]))));
 return {angle:a[1]+(b[1]-a[1])*u,reach:a[2]+(b[2]-a[2])*u,wrist:a[3]+(b[3]-a[3])*u,trail:t>.07&&t<.21?Math.sin((t-.07)/.14*Math.PI):0};
}
export function knifeContact(player,target){
 const hit=bodyHit(target,{px:player.x,py:player.y,x:target.x,y:target.y,radius:0});
 return hit?{...hit,upperBodyOnly:true,weapon:'knife'}:null;
}
import { hasLineOfSight } from './arena.js';

export function knifeTargets(player,targets,walls){
  return targets.filter(target=>{
    const angle=Math.atan2(target.y-player.y,target.x-player.x)-player.angle;
    return target.active!==false&&!target.dead&&!target.subdued&&Math.hypot(target.x-player.x,target.y-player.y)<=55&&
      Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))<=Math.PI/3&&hasLineOfSight(player,target,walls);
  });
}

// One swing per click; the hit happens when the blade crosses in front of the player.
export function updateKnife(player,dt,down,play){
  const pressed=down&&!player.knifeAttackHeld;player.knifeAttackHeld=down;
  const previous=player.knifeSwing||0;
  player.knifeSwing=Math.max(0,previous-dt);
  player.knifeCooldown=Math.max(0,(player.knifeCooldown||0)-dt);
  if(!player.knifeEquipped||player.armsDisabled||player.dead)return false;
  if(pressed&&player.knifeCooldown<=0){
    player.knifeSwing=KNIFE_DURATION;player.knifeCooldown=.5;player.knifeHitDone=false;
    return false;
  }
  if(previous>KNIFE_DURATION-.07&&player.knifeSwing<=KNIFE_DURATION-.07)play('knife');
  if(previous>KNIFE_DURATION-KNIFE_HIT_TIME&&player.knifeSwing<=KNIFE_DURATION-KNIFE_HIT_TIME&&!player.knifeHitDone){
    player.knifeHitDone=true;return true;
  }
  return false;
}
