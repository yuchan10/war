import { CONFIG } from './config.js';
export const PARTS={
 head:{label:'머리',armor:60,threshold:1},torso:{label:'몸통',armor:90,threshold:150},
 leftArm:{label:'왼팔',armor:45,threshold:60,kind:'arm',side:-1},rightArm:{label:'오른팔',armor:45,threshold:60,kind:'arm',side:1},
 leftLeg:{label:'왼다리',armor:55,threshold:75,kind:'leg',side:-1},rightLeg:{label:'오른다리',armor:55,threshold:75,kind:'leg',side:1}
};
export const WOUNDS={burstWindow:.6,burstExtra:.35,maxMultiplier:2.4,bleedDuration:5,bloodLimit:100,recoveryDelay:6,bloodRecovery:1,bloodRecoveryMin:.25,damageRecovery:1.5};
export function initBody(e){
 e.body??=Object.fromEntries(Object.entries(PARTS).map(([key,p])=>[key,{armor:p.armor,maxArmor:p.armor,damage:0,bleedRemaining:0,bleedRate:0,lastArmorHit:-Infinity,burst:0,severed:false}]));
 e.bloodLoss??=0;e.recoveryRemaining??=WOUNDS.recoveryDelay;e.dead??=false;return e.body;
}
export function injuryMoveScale(e){
 const base=e.speed??CONFIG.player.speed,arms=e.missingArms?.length||0;
 const armScale=base>0?Math.max(0,base-arms*25)/base:0;
 const legDamage=['leftLeg','rightLeg'].reduce((sum,key)=>sum+Math.min(1,(e.body?.[key]?.damage||0)/PARTS[key].threshold),0);
 const legScale=Math.max(.3,1-legDamage*.35);
 return !e.legsDisabled?armScale*legScale:armScale*((e.missingLegs?.length||1)>1?.025:.04)*(.8+.2*Math.sin(e.crawlPhase||0));
}
// Swept rectangles in the soldier's aim frame. Outer lanes belong only to arms.
function intersect(a,b,box,r){
 let lo=0,hi=1;
 for(const [key,min,max] of [['x',box[0]-r,box[2]+r],['y',box[1]-r,box[3]+r]]){
  const d=b[key]-a[key];if(Math.abs(d)<1e-9){if(a[key]<min||a[key]>max)return null;continue;}
  let t1=(min-a[key])/d,t2=(max-a[key])/d;if(t1>t2)[t1,t2]=[t2,t1];lo=Math.max(lo,t1);hi=Math.min(hi,t2);if(lo>hi)return null;
 }return lo;
}
export function bodyHit(e,b){
 if(e.dead)return null;
 const angle=e.aimRemaining>0||e.burstLeft>0?e.aimAngle??e.angle:e.angle;
 const c=Math.cos(angle||0),s=Math.sin(angle||0);
 const local=(x,y)=>({x:(x-e.x)*c+(y-e.y)*s,y:-(x-e.x)*s+(y-e.y)*c});
 const a=local(b.px,b.py),z=local(b.x,b.y),r=Math.min(b.radius??0,2);
 // The rear leg lanes must disappear independently when a leg is severed.
 const boxes=[['center',[-13,-6,10,6]],['leftLeg',[-17,-6,-13,0]],['rightLeg',[-17,0,-13,6]],['leftArm',[-5,-16,20,-7]],['rightArm',[-5,7,20,16]]];
 let hit=null;
 for(const [region,box] of boxes){
  if(b.upperBodyOnly&&PARTS[region]?.kind==='leg')continue;
  if(e.body?.[region]?.severed||(region==='leftArm'&&e.missingArms?.includes(-1))||(region==='rightArm'&&e.missingArms?.includes(1))||(region==='leftLeg'&&e.missingLegs?.includes(-1))||(region==='rightLeg'&&e.missingLegs?.includes(1)))continue;
  const t=intersect(a,z,box,r);if(t===null||(hit&&hit.t<=t))continue;
  hit={region,t,localY:a.y+(z.y-a.y)*t,x:b.px+(b.x-b.px)*t,y:b.py+(b.y-b.py)*t};
 }return hit;
}
export function resolvePart(e,hit,random=Math.random){
 if(hit.region!=='center')return hit.region;
 if(hit.headshot===true&&!e.body.head.severed)return 'head';
 const candidates=(hit.upperBodyOnly?[['head',.05],['torso',.95]]:[['head',.10],['torso',.30],['leftLeg',.30],['rightLeg',.30]]).filter(([p])=>!e.body[p].severed&&(hit.headshot!==false||p!=='head'));
 let roll=random()*candidates.reduce((n,[,w])=>n+w,0);
 for(const [p,w] of candidates){roll-=w;if(roll<0)return p;}return candidates.at(-1)[0];
}
export function applyInjury(e,baseDamage,hit={region:'center'},now=0,random=Math.random){
 initBody(e);if(e.dead)return {part:null,damage:0,killed:true,detached:false};
 const key=resolvePart(e,hit,random),p=PARTS[key],state=e.body[key];
 if(!state||state.severed)return {part:key,damage:0,killed:false,detached:false};
 e.recoveryRemaining=WOUNDS.recoveryDelay;e.lastHitPart=key;e.wasHit=true;state.hitUntil=now+.35;
 const result={weapon:hit.weapon||'bullet',part:key,kind:p.kind||key,side:p.side,damage:0,detached:false,killed:false,armorHit:false,armorBroken:false};
 if(state.armor>0){
  state.burst=now-state.lastArmorHit<=WOUNDS.burstWindow?state.burst+1:0;state.lastArmorHit=now;
  const wear=baseDamage*Math.min(WOUNDS.maxMultiplier,1+state.burst*WOUNDS.burstExtra);
  state.armor=Math.max(0,state.armor-wear);result.armorHit=true;result.armorBroken=state.armor===0;return result;
 }
 result.damage=baseDamage;state.damage+=baseDamage;
 state.drip=0;state.nextDrip=undefined;
 state.bleedRemaining=WOUNDS.bleedDuration;state.bleedRate=Math.min(18,2+state.damage/p.threshold*7);
 if(key==='torso'){
  const marks=e.torsoMarks||[],i=marks.length,a=i*2.399963+Math.PI;
  const mark=hit.weapon==='knife'?{kind:'cut',x:-4+random()*10,y:-2+random()*4,angle:random()*Math.PI,length:6+random()*4}:{kind:'bullet',x:1+Math.cos(a)*(3+i%3),y:Math.sin(a)*3};
  e.torsoMarks=[...marks,mark];
 }
 if(key==='head'){state.severed=true;e.headDestroyed=true;e.dead=true;result.detached=true;}
 else if(p.kind&&state.damage>=p.threshold){
  state.severed=true;result.detached=true;state.bleedRate=18;
  const list=p.kind==='arm'?'missingArms':'missingLegs';e[list]=[...(e[list]||[]),p.side];e[p.kind==='arm'?'missingArm':'missingLeg']=p.side;
  if(p.kind==='arm'){
   e.armsDisabled=e.missingArms.includes(1);e.aimImpaired=e.missingArms.includes(-1)&&!e.armsDisabled;
   if(e.armsDisabled){e.aimRemaining=0;e.burstLeft=0;e.muzzle=0;e.knifeSwing=0;}
  }else{e.legsDisabled=true;e.walking=false;}
 }else if(key==='torso'&&state.damage>=p.threshold){e.dead=true;}
 result.killed=e.dead;return result;
}
export function tickWounds(e,dt,emit=()=>{},random=Math.random){
 initBody(e);if(e.dead)return;
 dt=Math.max(0,dt);
 const wait=Math.max(e.recoveryRemaining,...Object.values(e.body).map(s=>s.bleedRemaining));
 e.recoveryRemaining=Math.max(0,e.recoveryRemaining-dt);
 for(const [key,state] of Object.entries(e.body)){
  const active=Math.min(Math.max(0,dt),state.bleedRemaining);if(active<=0)continue;
  state.bleedRemaining=Math.max(0,state.bleedRemaining-dt);e.bloodLoss+=active*state.bleedRate;
  state.drip=(state.drip||0)+active;
  const interval=Math.max(.08,.55-state.bleedRate*.025);
  const nextInterval=()=>interval*(.35+random()*1.3);
  state.nextDrip??=nextInterval();
  while(state.drip>=state.nextDrip){
    state.drip-=state.nextDrip;state.nextDrip=nextInterval();
    emit(key,Math.min(7,1.5+state.bleedRate*.25));
  }
 }
 if(e.bloodLoss>=WOUNDS.bloodLimit){e.bloodLoss=WOUNDS.bloodLimit;e.dead=true;return;}
 const recoveryTime=Math.max(0,dt-wait);
 if(recoveryTime>0){
  // Integrate d(loss)/dt = -(1 - 0.0075 * loss) exactly, independent of frame size.
  const slope=(WOUNDS.bloodRecovery-WOUNDS.bloodRecoveryMin)/WOUNDS.bloodLimit;
  const rate=WOUNDS.bloodRecovery-slope*e.bloodLoss;
  e.bloodLoss=Math.max(0,e.bloodLoss-rate*Math.expm1(slope*recoveryTime)/slope);
  for(const state of Object.values(e.body))if(!state.severed)state.damage=Math.max(0,state.damage-WOUNDS.damageRecovery*recoveryTime);
  if(e.respondedSeverity!==undefined)e.respondedSeverity=Math.min(e.respondedSeverity,woundSeverity(e));
  if(e.wasHit&&e.bloodLoss===0&&Object.values(e.body).every(s=>s.damage===0&&!s.severed))e.wasHit=false;
 }
}
export function woundSeverity(e){
 return Math.max((e.bloodLoss||0)/WOUNDS.bloodLimit,...Object.entries(e.body||{}).map(([key,s])=>s.damage/PARTS[key].threshold),0);
}
