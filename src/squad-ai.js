import {updateContact} from './contact-memory.js';
import {hasLineOfSight} from './arena.js';
const live=e=>e.active!==false&&!e.dead&&!e.subdued&&!(e.born>0);
export function prepareSquad(enemies,player,walls,dt){
 const active=enemies.filter(live);
 // Stable pairs keep casualties meaningful instead of re-pairing every frame.
 const fresh=active.filter(e=>e.squadId===undefined);
 let id=Math.max(-1,...enemies.map(e=>e.squadId??-1))+1;
 while(fresh.length){const a=fresh.shift();fresh.sort((b,c)=>(b.role===a.role?300:0)+Math.hypot(b.x-a.x,b.y-a.y)-((c.role===a.role?300:0)+Math.hypot(c.x-a.x,c.y-a.y)));a.squadId=id;if(fresh.length)fresh.shift().squadId=id;id++;}
 let nextId=Math.max(-1,...enemies.map(e=>e.aiId??-1))+1;
 for(const e of active){
  e.aiId??=nextId++;e.stress=Math.max(0,(e.stress||0)-dt*.18);e.coverRetry=Math.max(0,(e.coverRetry||0)-dt);e.reportCooldown=Math.max(0,(e.reportCooldown||0)-dt);
  if(e.pendingReport){e.pendingReport.delay-=dt;e.pendingReport.age+=dt;if(e.pendingReport.delay<=0){e.reportPosition={...e.pendingReport.position};e.reportAge=e.pendingReport.age;e.pendingReport=null;}}
  e.reportAge=(e.reportAge??Infinity)+dt;if(e.reportAge>8)e.reportPosition=null;
  if(e.lastContact&&e.contactAge>18)e.lastContact=null;
  const contact=updateContact(e,player,walls,dt);
  contact.age=contact.visible?0:contact.heard?e.heardAge:e.contactAge;contact.source=contact.visible?'sight':contact.heard?'sound':'memory';
  if(!contact.visible&&e.reportPosition&&e.reportAge<(contact.age??Infinity))e.contact={visible:false,target:{...e.reportPosition},age:e.reportAge,source:'report'};else e.contact=contact;
 }
 for(const e of active){
  if(!e.contact.visible||e.reportCooldown>0)continue;e.reportCooldown=e.skill==='veteran'?.7:1.2;
  for(const other of active){if(other===e||other.pendingReport||Math.hypot(e.x-other.x,e.y-other.y)>360||!hasLineOfSight(e,other,walls))continue;
   other.pendingReport={position:{x:e.contact.target.x,y:e.contact.target.y,vx:0,vy:0},delay:e.skill==='rookie'?.8:.4,age:0};
  }
 }
 for(const e of active){
  const buddy=active.find(a=>a!==e&&a.squadId===e.squadId);e.buddyReady=!!buddy&&Math.hypot(e.x-buddy.x,e.y-buddy.y)<450;e.buddyReloading=!!buddy&&(buddy.ammo===0||buddy.reloadRemaining>0);
  e.assignment='hold';
  if(e.contact.target&&buddy?.contact.target&&e.buddyReady){
   const mover=e.role==='assault'&&buddy.role!=='assault'?e:buddy.role==='assault'&&e.role!=='assault'?buddy:(e.aiId<buddy.aiId?e:buddy);
   if(e===mover&&!e.buddyReloading&&buddy.ammo>0&&buddy.aiState!=='retreat'&&buddy.contact.visible&&((buddy.aiClock??0)-(buddy.lastFiredAt??-Infinity)<1.5||buddy.aimRemaining>0||buddy.burstLeft>0))e.assignment='flank';else e.assignment='support';
  }
 }
}
export function registerNearMiss(enemies,bullet){
 const dx=bullet.x-bullet.px,dy=bullet.y-bullet.py,len=dx*dx+dy*dy;
 bullet.alertedEnemies??=new Set();
 for(const e of enemies){if(!live(e)||bullet.alertedEnemies.has(e))continue;
  const t=len?Math.max(0,Math.min(1,((e.x-bullet.px)*dx+(e.y-bullet.py)*dy)/len)):0;
  if(Math.hypot(e.x-bullet.px-dx*t,e.y-bullet.py-dy*t)>55)continue;
  bullet.alertedEnemies.add(e);e.stress=Math.min(2,(e.stress||0)+.45);
  e.incomingThreat={x:bullet.px,y:bullet.py};e.incomingAge=0;
 }
}
export function notifyCasualty(dead,enemies,walls){
 for(const e of enemies)if(e!==dead&&live(e)&&Math.hypot(e.x-dead.x,e.y-dead.y)<350&&hasLineOfSight(e,dead,walls))e.stress=Math.min(2,(e.stress||0)+.8);
}
