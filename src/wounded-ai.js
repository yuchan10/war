import { woundSeverity } from './injury.js';
import { visiblePoint } from './visibility.js';
import { routeDirection } from './arena.js';
import { updateContact } from './contact-memory.js';
import { updateEnemyFire } from './enemy-fire.js';
import { safeShot, suppressionTarget } from './suppression-target.js';
import { courageProfile } from './enemy-courage.js';
import { concealed, findRetreatCover } from './cover-retreat.js';

// Injured soldiers fight a forward threat or seek cover from its last known position.
export function updateWounded(e,dt,player,walls,shoot){
  const wounded=e.wasHit||e.armsDisabled||e.legsDisabled||
    !!(e.missingArms?.length||e.missingLegs?.length);
  if(!wounded)return null;
  const bearing=Math.atan2(player.y-e.y,player.x-e.x);
  const visible=visiblePoint({...e,angle:e.angle??Math.PI},player,walls);
  const contact=updateContact(e,player,walls,dt,visible),courage=courageProfile(e);
  e.suppressing=false;
  const armed=!e.armsDisabled&&!e.unarmed;
  const retreat=courage.retreatOnHit||woundSeverity(e)>=courage.retreatSeverity;
  if(!retreat&&visible&&armed){
    e.woundedState='fight';e.angle=bearing;e.suppressionWall=null;
    updateEnemyFire(e,dt,player,(x,y,angle,...args)=>{
      if(!safeShot(e,angle,walls))return false;
      shoot(x,y,angle,...args);return true;
    },true);
    return {x:0,y:0};
  }
  if(!retreat){
    e.woundedState='hold';e.suppressing=armed&&!visible&&!!contact.target;
    const target=e.suppressing?suppressionTarget(e,contact.target,walls):null;
    if(target)e.angle=Math.atan2(target.y-e.y,target.x-e.x);
    updateEnemyFire(e,dt,target||player,(x,y,angle,...args)=>{
      if(!safeShot(e,angle,walls))return false;
      shoot(x,y,angle,...args);e.suppressionShots=(e.suppressionShots||0)+1;return true;
    },!!target);
    return {x:0,y:0};
  }
  e.woundedState='cover';e.aimRemaining=0;e.burstLeft=0;e.muzzle=0;
  const threat=contact.target||e.lastContact||e.heardPosition||
    (e.retreatThreat??={x:e.x-Math.cos(e.angle||0)*100,y:e.y-Math.sin(e.angle||0)*100});
  if(concealed(e,threat,walls,e.radius??17)){e.woundedState='hidden';return {x:0,y:0};}
  e.coverSearchTimer=(e.coverSearchTimer||0)-dt;
  if(e.coverSearchTimer<=0){
    e.retreatCover=findRetreatCover(e,threat,walls);e.coverSearchTimer=.6;e.retreatNavTimer=0;
  }
  const target=e.retreatCover;
  if(!target)return {x:0,y:0};
  const distance=Math.hypot(target.x-e.x,target.y-e.y);
  if(distance<2)return {x:0,y:0};
  e.retreatNavTimer=(e.retreatNavTimer||0)-dt;
  if(e.retreatNavTimer<=0){
    e.retreatDirection=routeDirection(e,target,walls);e.retreatNavTimer=.2;
  }
  const dir=e.retreatDirection,speed=Math.min(e.speed,distance/Math.max(dt,.00001));
  if(dir.x||dir.y)e.angle=Math.atan2(dir.y,dir.x);
  return {x:dir.x*speed,y:dir.y*speed};
}
