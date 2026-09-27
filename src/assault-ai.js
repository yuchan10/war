import { updateContact } from './contact-memory.js';
import { routeDirection } from './arena.js';
import { updateEnemyFire } from './enemy-fire.js';
import { safeShot } from './suppression-target.js';

// Mobile riflemen advance on observed/heard information; no live tracking through walls.
export function updateAssault(e,dt,player,walls,shoot){
  e.retreatPoint??={x:e.x,y:e.y};
  if(e.armsDisabled){
    e.aimRemaining=0;e.burstLeft=0;
    if(Math.hypot(e.x-e.retreatPoint.x,e.y-e.retreatPoint.y)<8)return {x:0,y:0};
    const dir=routeDirection(e,e.retreatPoint,walls);
    return {x:dir.x*e.speed,y:dir.y*e.speed};
  }
  const contact=updateContact(e,player,walls,dt);
  const objective=contact.visible?player:contact.target||e.heardPosition||e.advancePoint;
  const fire=(x,y,angle,...args)=>{
    if(!safeShot(e,angle,walls))return false;
    shoot(x,y,angle,...args);return true;
  };
  const distance=Math.hypot(player.x-e.x,player.y-e.y);
  const canFire=contact.visible&&distance<=e.range;
  if(updateEnemyFire(e,dt,player,fire,canFire))return {x:0,y:0};
  if(!objective)return {x:0,y:0};
  e.assaultNavTimer=(e.assaultNavTimer||0)-dt;
  if(e.assaultNavTimer<=0){e.assaultNav=routeDirection(e,objective,walls);e.assaultNavTimer=.18;}
  if(Math.hypot(objective.x-e.x,objective.y-e.y)<12)return {x:0,y:0};
  const factor=contact.visible?(distance<160?-.5:distance>230?1:0):1;
  return {x:e.assaultNav.x*e.speed*factor,y:e.assaultNav.y*e.speed*factor};
}
