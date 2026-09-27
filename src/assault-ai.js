import { updateWounded } from './wounded-ai.js';
import { updateContact } from './contact-memory.js';
import { routeDirection } from './arena.js';
import { updateEnemyFire } from './enemy-fire.js';
import { safeShot } from './suppression-target.js';

// Mobile riflemen advance on observed/heard information; no live tracking through walls.
export function updateAssault(e,dt,player,walls,shoot){
  e.retreatPoint??={x:e.x,y:e.y};
  const wounded=updateWounded(e,dt,player,walls,shoot);
  if(wounded)return wounded;
  const contact=updateContact(e,player,walls,dt);
  const objective=contact.visible?player:contact.target||e.heardPosition||e.advancePoint;
  const fire=(x,y,angle,...args)=>{
    if(!safeShot(e,angle,walls))return false;
    shoot(x,y,angle,...args);return true;
  };
  const distance=contact.visible?Math.hypot(player.x-e.x,player.y-e.y):Infinity;
  if(contact.visible)e.angle=Math.atan2(player.y-e.y,player.x-e.x);
  const canFire=contact.visible;
  if(updateEnemyFire(e,dt,player,fire,canFire))return {x:0,y:0};
  if(!objective)return {x:0,y:0};
  e.assaultNavTimer=(e.assaultNavTimer||0)-dt;
  if(e.assaultNavTimer<=0){e.assaultNav=routeDirection(e,objective,walls);e.assaultNavTimer=.18;}
  if(Math.hypot(objective.x-e.x,objective.y-e.y)<12)return {x:0,y:0};
  const factor=contact.visible?(distance<160?-.5:distance>230?1:0):1;
  if(!contact.visible&&(e.assaultNav.x||e.assaultNav.y))e.angle=Math.atan2(e.assaultNav.y,e.assaultNav.x);
  return {x:e.assaultNav.x*e.speed*factor,y:e.assaultNav.y*e.speed*factor};
}
