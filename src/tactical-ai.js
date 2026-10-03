import {routeDirection,hasLineOfSight} from './arena.js';
import {chooseTacticalCover,clearTacticalPoint} from './tactical-cover.js';
import {updateEnemyFire} from './enemy-fire.js';
import {woundSeverity} from './injury.js';
import {safeShot,suppressionTarget} from './suppression-target.js';
import {concealed,findRetreatCover} from './cover-retreat.js';
const still={x:0,y:0};
const profiles={cautious:{panic:.55,wound:.25},steady:{panic:1.1,wound:.7},resolute:{panic:1.9,wound:Infinity}};
function cancelAim(e){e.aimRemaining=0;e.burstLeft=0;e.muzzle=0;}
function face(e,target,dt){const desired=Math.atan2(target.y-e.y,target.x-e.x),delta=Math.atan2(Math.sin(desired-e.angle),Math.cos(desired-e.angle));e.angle+=Math.max(-dt*4,Math.min(dt*4,delta));}
function travel(e,target,walls,dt,keepAim=false){
 if(!keepAim)cancelAim(e);
 const distance=Math.hypot(target.x-e.x,target.y-e.y);if(distance<7)return still;
 e.navTime=(e.navTime||0)-dt;
 if(e.navTime<=0||!e.navTarget||Math.hypot(e.navTarget.x-target.x,e.navTarget.y-target.y)>12){e.navTarget={...target};e.navDirection=routeDirection(e,target,walls);e.navTime=.18;}
 const d=e.navDirection;
 // Retain visual contact while moving; do not turn away from a known visible threat.
 face(e,e.contact?.visible?e.contact.target:{x:e.x+d.x*100,y:e.y+d.y*100},dt);
 const speed=Math.min(e.speed*(keepAim?.55:1),distance/Math.max(dt,.001));return {x:d.x*speed,y:d.y*speed};
}
function selectCover(e,threat,walls,allies,flank=false){
 if(e.coverRetry>0)return;e.coverRetry=.8;
 const chosen=chooseTacticalCover(e,threat,walls,allies,flank);
 if(chosen){e.tacticalCover=chosen;e.cover=chosen;e.peekClock=0;e.coverPhase='hide';}
}
function shootAt(e,target,dt,walls,allies,shoot,random){
 face(e,target,dt);
 if(Math.abs(Math.atan2(Math.sin(e.angle-Math.atan2(target.y-e.y,target.x-e.x)),Math.cos(e.angle-Math.atan2(target.y-e.y,target.x-e.x))))>.2){cancelAim(e);return still;}
 updateEnemyFire(e,dt,target,(x,y,angle,...args)=>{
  if(!safeShot(e,angle,walls)){e.blockedFire=true;return false;}
  const range=Math.min(e.bulletRange??526,Math.hypot(target.x-e.x,target.y-e.y));
  if(allies.some(a=>a!==e&&!a.dead&&a.active!==false&&((a.x-x)*Math.cos(angle)+(a.y-y)*Math.sin(angle))>0&&((a.x-x)*Math.cos(angle)+(a.y-y)*Math.sin(angle))<range&&Math.abs((a.x-x)*Math.sin(angle)-(a.y-y)*Math.cos(angle))<23))return false;
  shoot(x,y,angle,...args);e.lastFiredAt=e.aiClock;e.shotsFired=(e.shotsFired||0)+1;e.suppressionShots=(e.suppressionShots||0)+1;return true;
 },true,random);return still;
}
function search(e,target,walls,dt){
 if(!e.searchOrigin||Math.hypot(e.searchOrigin.x-target.x,e.searchOrigin.y-target.y)>70){
  e.searchOrigin={x:target.x,y:target.y};e.searchIndex=0;e.searchWait=0;
  const corners=walls.flatMap(w=>[{x:w.x-30,y:w.y-30},{x:w.x+w.w+30,y:w.y-30},{x:w.x-30,y:w.y+w.h+30},{x:w.x+w.w+30,y:w.y+w.h+30}]).filter(p=>clearTacticalPoint(p,walls)&&Math.hypot(p.x-target.x,p.y-target.y)<230);
  corners.sort((a,b)=>Math.hypot(a.x-target.x,a.y-target.y)-Math.hypot(b.x-target.x,b.y-target.y));
  e.searchPoints=[target,...corners.slice(0,3)].filter(p=>clearTacticalPoint(p,walls));
 }
 const point=e.searchPoints[e.searchIndex];
 if(!point){e.lastContact=null;e.heardPosition=null;e.reportPosition=null;e.pendingReport=null;e.contact={visible:false,target:null};e.searchOrigin=null;e.alertTime=5;return still;}
 if(Math.hypot(point.x-e.x,point.y-e.y)>12){
  const motion=travel(e,point,walls,dt);if(!motion.x&&!motion.y)e.searchIndex++;return motion;
 }
 cancelAim(e);e.searchWait+=dt;e.angle+=dt*1.6;
 if(e.searchWait>1.6){e.searchIndex++;e.searchWait=0;}return still;
}
function allyInLine(e,target,allies){
 const dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy)||1;
 return allies.some(a=>a!==e&&!a.dead&&a.active!==false&&((a.x-e.x)*dx+(a.y-e.y)*dy)/d>0&&((a.x-e.x)*dx+(a.y-e.y)*dy)/d<d&&Math.abs((a.x-e.x)*dy-(a.y-e.y)*dx)/d<25);
}
function setPlan(e,point,kind,duration=5){
 e.plan={point:{...point},kind,until:e.aiClock+duration};e.navTime=0;e.progressAt=e.aiClock;e.progressPosition={x:e.x,y:e.y};
}
function followPlan(e,walls,dt,keepAim=false){
 const plan=e.plan;if(!plan)return null;
 if(Math.hypot(e.x-plan.point.x,e.y-plan.point.y)<10||e.aiClock>plan.until){e.plan=null;e.repositionAfter=e.aiClock+2.5;return null;}
 if(e.aiClock-e.progressAt>.8){
  const travelled=Math.hypot(e.x-e.progressPosition.x,e.y-e.progressPosition.y);
  e.progressAt=e.aiClock;e.progressPosition={x:e.x,y:e.y};
  if(travelled<3){e.failedPoint={...plan.point};e.failedUntil=e.aiClock+4;e.plan=null;e.tacticalCover=null;e.coverRetry=0;e.navTime=0;return null;}
 }
 e.aiState=plan.kind;return travel(e,plan.point,walls,dt,keepAim);
}
function sidestep(e,target,walls,allies){
 const angle=Math.atan2(target.y-e.y,target.x-e.x)+Math.PI/2;
 for(const side of [(e.aiId||0)%2?1:-1,(e.aiId||0)%2?-1:1])for(const distance of [65,110]){
  const p={x:e.x+Math.cos(angle)*distance*side,y:e.y+Math.sin(angle)*distance*side};
  if(clearTacticalPoint(p,walls)&&hasLineOfSight(e,p,walls)&&hasLineOfSight(p,target,walls)&&safeShot({...e,...p},Math.atan2(target.y-p.y,target.x-p.x),walls)&&!allyInLine(p,target,allies.filter(a=>a!==e))){setPlan(e,p,'reposition',2.5);return true;}
 }
 return false;
}
export function updateTacticalEnemy(e,dt,walls,allies,shoot,random=Math.random){
 const contact=e.contact??{visible:false,target:null},target=contact.target,profile=profiles[e.courage]??profiles.steady;
 e.aiClock=(e.aiClock||0)+dt;e.angle??=Math.PI;e.home??={x:e.x,y:e.y};e.homeAngle??=e.angle;
 e.incomingAge=(e.incomingAge??Infinity)+dt;if(e.incomingAge>3)e.incomingThreat=null;
 // Brief occlusion must not restart reaction/aim on every peek.
 if(contact.visible){
  if(!e.hadVisual&&(e.lastVisualAt===undefined||e.aiClock-e.lastVisualAt>3)){e.reactionRemaining=e.skill==='veteran'?.12:e.skill==='rookie'?.38:.22;e.timer=Math.min(e.timer||0,.1);}
  e.lastVisualAt=e.aiClock;e.searchOrigin=null;
 }
 e.hadVisual=contact.visible;e.reactionRemaining=Math.max(0,(e.reactionRemaining||0)-dt);
 const threat=target||e.incomingThreat,severity=woundSeverity(e);
 // Damage is permanent; retreat is a timed response, not a permanent disabled state.
 if(severity>(e.respondedSeverity||0)+.05&&severity>=profile.wound){e.respondedSeverity=severity;e.retreatUntil=e.aiClock+(e.courage==='cautious'?3:1.8);}
 if((e.stress||0)>=profile.panic&&e.aiClock>(e.nextPanicAt||0)){e.retreatUntil=e.aiClock+2;e.nextPanicAt=e.aiClock+5;}
 const reloading=e.ammo===0||e.reloadRemaining>0,retreat=e.aiClock<(e.retreatUntil||0)||(e.armsDisabled&&e.courage!=='resolute');
 if(threat&&(reloading||retreat)){
  e.plan=null;e.aiState=reloading?'reload':'retreat';e.woundedState='cover';cancelAim(e);
  if(!e.tacticalCover||!concealed(e.tacticalCover.hide,threat,walls,e.radius??17)){
   selectCover(e,threat,walls,allies);
   if(!e.tacticalCover){const hide=findRetreatCover(e,threat,walls);if(hide)e.tacticalCover={hide,peek:hide,defensiveOnly:true};}
  }
  if(e.tacticalCover){const motion=travel(e,e.tacticalCover.hide,walls,dt);if(!motion.x&&!motion.y){e.woundedState='hidden';face(e,threat,dt);}return motion;}
  if(contact.visible&&!reloading&&!e.armsDisabled){shootAt(e,target,dt,walls,allies,shoot,random);e.aiState='retreat';}return still;
 }
 if(e.tacticalCover?.defensiveOnly){e.tacticalCover=null;e.coverRetry=0;}
 if(!target){
  e.plan=null;e.suppressing=false;cancelAim(e);
  if(e.wasHit){e.aiState='guard';e.woundedState='hold';e.angle=e.homeAngle+Math.sin(e.aiClock*.8)*.9;return still;}
  e.aiState='patrol';const route=e.patrolPoints||(e.role==='assault'?[e.home,e.advancePoint||e.home]:[e.home]);e.patrolIndex??=0;
  const point=route[e.patrolIndex%route.length];if(Math.hypot(point.x-e.x,point.y-e.y)>12)return travel(e,point,walls,dt);
  e.patrolWait=(e.patrolWait||0)+dt;e.angle=e.homeAngle+Math.sin(e.patrolWait*1.3)*.7;
  if(e.patrolWait>2.5){e.patrolIndex++;e.patrolWait=0;}return still;
 }
 if(e.reactionRemaining>0){e.aiState='react';cancelAim(e);face(e,target,dt);return still;}
 if(!contact.visible){
  // A committed short move survives loss of sight, but never receives the hidden live position.
  if(e.plan){const motion=followPlan(e,walls,dt);if(motion)return motion;}
  if(e.tacticalCover&&!e.tacticalCover.defensiveOnly&&contact.source!=='sound'&&contact.age<5&&e.aiClock>(e.repositionAfter||0)){
   setPlan(e,e.tacticalCover.peek,'peek',4);const motion=followPlan(e,walls,dt);if(motion)return motion;
  }
  if(contact.source!=='sound'&&contact.age<1&&e.assignment==='support'&&e.ammo>3){
   const aim=suppressionTarget(e,target,walls);if(aim){e.aiState='suppress';e.suppressing=true;return shootAt(e,aim,dt,walls,allies,shoot,random);}
  }
  e.aiState='search';e.suppressing=false;e.suppressionWall=null;return search(e,target,walls,dt);
 }
 e.suppressing=false;e.suppressionWall=null;e.woundedState=e.wasHit?'fight':undefined;
 const distance=Math.hypot(target.x-e.x,target.y-e.y),blocked=allyInLine(e,target,allies);
 if(blocked){
  cancelAim(e);e.aiState='reposition';if(!e.plan)sidestep(e,target,walls,allies);
  return followPlan(e,walls,dt)||still;
 }
 if(e.plan?.kind==='reposition'){const motion=followPlan(e,walls,dt);if(motion)return motion;}
 // Shoot immediately when a real opportunity opens; do not hide on a fixed schedule.
 e.aiState='engage';e.blockedFire=false;shootAt(e,target,dt,walls,allies,shoot,random);
 if(e.blockedFire){cancelAim(e);if(!e.plan)sidestep(e,target,walls,allies);return followPlan(e,walls,dt)||still;}
 if(distance<140){e.plan=null;return still;}
 // Preserve a burst/aim rather than cancelling it for a new movement decision.
 if(e.aimRemaining>0||e.burstLeft>0)return still;
 if(e.plan?.kind==='flank'&&e.assignment!=='flank')e.plan=null;
 if(e.plan){const motion=followPlan(e,walls,dt,true);if(motion)return motion;}
 if(e.aiClock<(e.repositionAfter||0))return still;
 if(e.assignment==='flank'&&!e.legsDisabled&&!e.wasHit){
  const cover=chooseTacticalCover(e,target,walls,allies,true);
  if(cover&&(!e.failedPoint||e.aiClock>e.failedUntil||Math.hypot(cover.peek.x-e.failedPoint.x,cover.peek.y-e.failedPoint.y)>35)){
   e.tacticalCover=cover;e.cover=cover;setPlan(e,cover.peek,'flank',6);return followPlan(e,walls,dt,true)||still;
  }
 }
 const desired=Math.min((e.bulletRange??526)*.75,e.role==='assault'?230:360);
 if(distance>desired+70){
  const factor=(distance-desired)/distance,point={x:e.x+(target.x-e.x)*factor,y:e.y+(target.y-e.y)*factor};
  if(clearTacticalPoint(point,walls)){setPlan(e,point,'advance',4);return followPlan(e,walls,dt,true)||still;}
 }
 // Hold a working firing position. Reposition only when cover is compromised or under pressure.
 if(e.stress>.25&&e.coverRetry<=0){selectCover(e,target,walls,allies);if(e.tacticalCover){setPlan(e,e.tacticalCover.peek,'reposition',4);return followPlan(e,walls,dt,true)||still;}}
 return still;
}
