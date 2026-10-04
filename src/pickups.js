import { hasLineOfSight } from './arena.js';
import { initBody, PARTS } from './injury.js';
import { CONFIG } from './config.js';
export const ARMOR_CHANGE_SECONDS=2.5;
export class Pickups {
 constructor(){this.clear();}
 clear(){this.items=[];this.changing=null;}
 drop(soldier,walls=[],random=Math.random,corpse=null){
  initBody(soldier);const armor=Object.fromEntries(Object.entries(soldier.body).filter(([,s])=>s.armor>0&&!s.severed).map(([k,s])=>[k,{armor:s.armor,maxArmor:s.maxArmor}]));
  const ammo=Math.max(0,soldier.ammo??0);
  const grenades=random()<CONFIG.grenade.dropChance?1:0;
  if(Object.keys(armor).length||ammo||grenades)this.items.push({x:soldier.x,y:soldier.y,armor,ammo,grenades,corpse});
 }
 syncPositions(){for(const i of this.items)if(Number.isFinite(i.corpse?.x)&&Number.isFinite(i.corpse?.y)){i.x=i.corpse.x;i.y=i.corpse.y;}}
 nearby(p,walls){this.syncPositions();return this.items.filter(i=>Math.hypot(p.x-i.x,p.y-i.y)<=24&&hasLineOfSight(p,i,walls)).sort((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-b.x,p.y-b.y));}
 nextPart(p,item){return Object.keys(PARTS).find(k=>item.armor[k]&&!p.body[k].severed&&item.armor[k].armor>p.body[k].armor);}
 start(p,walls){
  initBody(p);if(p.dead||this.changing)return false;
  const item=this.nearby(p,walls).find(i=>this.nextPart(p,i));if(!item)return false;
  this.changing={item,x:p.x,y:p.y,elapsed:0,key:null};this.beginPart(p);return true;
 }
 beginPart(p){
  const job=this.changing,key=this.nextPart(p,job.item);
  if(!key){this.changing=null;return;}
  job.key=key;job.elapsed=0;const slot=p.body[key];
  // Removed armor remains on the ground if the player interrupts changing.
  if(slot.armor>0)this.items.push({x:job.item.x,y:job.item.y,armor:{[key]:{armor:slot.armor,maxArmor:slot.maxArmor}},corpse:null});
  slot.armor=0;
 }
 update(p,walls,dt,interrupted=false){
  const job=this.changing;if(!job)return 0;
  if(p.dead||p.body[job.key].severed||interrupted||Math.hypot(p.x-job.x,p.y-job.y)>.5||!hasLineOfSight(p,job.item,walls)){this.changing=null;return 0;}
  job.elapsed+=dt;if(job.elapsed<ARMOR_CHANGE_SECONDS)return 0;
  const armor=job.item.armor[job.key],slot=p.body[job.key];
  slot.armor=armor.armor;slot.maxArmor=armor.maxArmor;slot.burst=0;slot.lastArmorHit=-Infinity;
  delete job.item.armor[job.key];if(job.item.corpse?.armor)job.item.corpse.armor[job.key]=0;
  this.beginPart(p);this.items=this.items.filter(i=>Object.keys(i.armor).length||i.ammo>0||i.grenades>0);return 1;
 }
 collectAmmo(p,walls,weapon){
  if(p.dead)return 0;let count=0;
  for(const item of this.nearby(p,walls)){const taken=weapon.collectAmmo(item.ammo??0);item.ammo=(item.ammo??0)-taken;count+=taken;}
  this.items=this.items.filter(i=>Object.keys(i.armor).length||i.ammo>0||i.grenades>0);return count;
 }
 collectGrenades(p,walls,inventory){
  if(p.dead||!p.hasRifle)return 0;let count=0;
  for(const item of this.nearby(p,walls)){
   const room=Math.max(0,CONFIG.grenade.count-inventory.grenadeAmmo-(inventory.primedGrenade?1:0));
   const taken=Math.min(room,item.grenades||0);item.grenades=(item.grenades||0)-taken;inventory.grenadeAmmo+=taken;count+=taken;
  }
  this.items=this.items.filter(i=>Object.keys(i.armor).length||i.ammo>0||i.grenades>0);return count;
 }
 available(p,walls,weapon,inventory){return !p.dead&&this.nearby(p,walls).some(i=>this.nextPart(p,i)||(i.ammo>0&&weapon&&weapon.reserve<weapon.reserveCapacity)||(i.grenades>0&&p.hasRifle&&inventory&&inventory.grenadeAmmo+(inventory.primedGrenade?1:0)<CONFIG.grenade.count));}
 drawProgress(c,p){
  const job=this.changing;if(!job||p.dead)return;
  c.save();c.lineWidth=3;c.strokeStyle='#252b25';c.beginPath();c.arc(p.x,p.y,32,0,Math.PI*2);c.stroke();
  c.strokeStyle='#d9ddb1';c.beginPath();c.arc(p.x,p.y,32,-Math.PI/2,-Math.PI/2+Math.min(1,job.elapsed/ARMOR_CHANGE_SECONDS)*Math.PI*2);c.stroke();
  c.fillStyle='#eee9d3';c.font='12px sans-serif';c.textAlign='center';c.fillText(`${PARTS[job.key].label} 방어구 착용 중`,p.x,p.y-42);c.restore();
 }
 draw(c,isVisible,p,weapon,time=0,inventory){this.syncPositions();for(const i of this.items){const better=this.nextPart(p,i),ammo=i.ammo>0&&weapon.reserve<weapon.reserveCapacity,grenades=i.grenades>0&&p.hasRifle&&inventory&&inventory.grenadeAmmo+(inventory.primedGrenade?1:0)<CONFIG.grenade.count;if(!isVisible(i)||(!better&&!ammo&&!grenades))continue;c.save();c.translate(i.x,i.y);c.strokeStyle=grenades?'#9de0d0':better?'#b8ee81':'#e7c573';c.shadowColor=c.strokeStyle;c.shadowBlur=7+3*Math.sin(time*4);c.globalAlpha=.75+.25*Math.sin(time*4);c.lineWidth=2;c.strokeRect(-7,19,14,8);c.restore();}}
}
