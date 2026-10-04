import test from 'node:test';
import assert from 'node:assert/strict';
import {initBody,applyInjury,bodyHit,tickWounds,PARTS,WOUNDS,resolvePart} from '../src/injury.js';
import {World} from '../src/world.js';
import {CONFIG} from '../src/config.js';
const idle={mouse:{x:900,y:360,down:false},movement:()=>({x:0,y:0})};
const entity=()=>{const e={x:300,y:300,angle:0};initBody(e);return e;};
const hit=(e,part,damage=30,time=0)=>applyInjury(e,damage,{region:part},time);

test('rotated swept side hitboxes select the actual arm and missing arms cannot be hit',()=>{
 for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2])for(const [part,y] of [['leftArm',-12],['rightArm',12]]){
  const e=entity();e.angle=angle;const rotate=(x,y)=>({x:e.x+x*Math.cos(angle)-y*Math.sin(angle),y:e.y+x*Math.sin(angle)+y*Math.cos(angle)});
  const a=rotate(35,y),b=rotate(-25,y),bullet={px:a.x,py:a.y,...b,radius:0};
  const contact=bodyHit(e,bullet);assert.equal(contact.region,part);assert.ok(contact.t>0&&contact.t<1);
  e.body[part].armor=0;hit(e,part,60);assert.equal(bodyHit(e,bullet),null);
 }
});
test('central hits use a small head probability and never randomly pick an arm',()=>{
 const e=entity();const results=Array.from({length:1000},(_,i)=>resolvePart(e,{region:'center'},()=>(i+.5)/1000));
 assert.equal(results.filter(x=>x==='head').length,100);assert.equal(results.filter(x=>x==='torso').length,300);
 assert.equal(results.filter(x=>x==='leftLeg').length,300);assert.equal(results.filter(x=>x==='rightLeg').length,300);
 assert.ok(results.every(x=>!x.includes('Arm')));
 assert.equal(bodyHit(e,{px:250,py:330,x:350,y:330,radius:2}),null);
});
test('armor break absorbs the breaking shot; only the next shot wounds or destroys an exposed head',()=>{
 const e=entity();assert.equal(hit(e,'head',60).armorBroken,true);assert.equal(e.body.head.damage,0);assert.equal(e.dead,false);
 const r=hit(e,'head',1,.1);assert.ok(r.detached&&r.killed);assert.ok(e.headDestroyed);assert.equal(e.hp,undefined);
});
test('rapid repeated hits wear the same armor faster, while pauses and other parts reset the bonus',()=>{
 const fast=entity(),slow=entity();hit(fast,'torso',20,0);hit(fast,'torso',20,.2);hit(slow,'torso',20,0);hit(slow,'torso',20,1);
 assert.equal(fast.body.torso.armor,43);assert.equal(slow.body.torso.armor,50);
 hit(fast,'leftArm',20,.3);assert.equal(fast.body.leftArm.armor,25);
 hit(fast,'torso',10,2);assert.equal(fast.body.torso.armor,33);
});
test('each exposed limb accumulates permanent damage and detaches once at its own threshold',()=>{
 for(const key of ['leftArm','rightArm','leftLeg','rightLeg']){
  const e=entity(),threshold=PARTS[key].threshold;e.body[key].armor=0;
  assert.equal(hit(e,key,threshold-1).detached,false);assert.equal(hit(e,key,1).detached,true);
  assert.equal(hit(e,key,50).detached,false);assert.equal(e.body[key].damage,threshold);
 }
});
test('bleeding scales with accumulated wounds, stops after five seconds and restarts before recovery begins',()=>{
 const e=entity();e.body.torso.armor=0;hit(e,'torso',10);const rate=e.body.torso.bleedRate;
 let drops=0;tickWounds(e,5,()=>drops++);const loss=e.bloodLoss;assert.ok(drops>0);tickWounds(e,.5,()=>drops++);
 assert.equal(e.bloodLoss,loss);assert.equal(e.body.torso.damage,10);assert.equal(e.body.torso.bleedRemaining,0);
 hit(e,'torso',10,40);assert.equal(e.body.torso.damage,20);assert.ok(e.body.torso.bleedRate>rate);assert.equal(e.body.torso.bleedRemaining,5);
});
test('bleeding is frame-rate independent and accumulated blood loss can kill',()=>{
 const a=entity(),b=entity();for(const e of [a,b]){e.body.leftArm.armor=0;hit(e,'leftArm',60);e.body.rightArm.armor=0;hit(e,'rightArm',60);}
 tickWounds(a,3);for(let i=0;i<300;i++)tickWounds(b,.01);
 assert.equal(a.dead,true);assert.equal(b.dead,true);assert.equal(a.bloodLoss,WOUNDS.bloodLimit);assert.equal(b.bloodLoss,WOUNDS.bloodLimit);
});
test('player and enemy use identical armor and wounds, with armor impacts producing no blood',()=>{
 const w=new World({play(){}},()=>.3);w.start();w.walls=[];const e=w.enemies[0];
 const a=w.hurt(30,{vx:1,vy:0},{region:'torso'}),b=hit(e,'torso',30,w.time);
 assert.equal(a.armorHit,b.armorHit);assert.deepEqual(w.player.body.torso,e.body.torso);assert.equal(w.effects.blood.marks.length,0);
 w.hurt(100,{vx:1,vy:0},{region:'torso'});assert.equal(w.effects.blood.marks.length,0);
 w.hurt(30,{vx:1,vy:0},{region:'torso'});assert.ok(w.effects.blood.marks.length>0);assert.equal(w.player.body.torso.damage,30);
});
test('real projectile collision kills only after head armor is broken and counts once',()=>{
 const w=new World({play(){}},()=>0);w.start();w.walls=[];w.enemies=[];w.spawnEnemy('assault',300,360);const e=w.enemies[0];e.born=0;e.timer=100;e.speed=0;
 e.body.head.armor=0;w.shoot(285,360,0,false,30,1550,false,CONFIG.weapon.bulletRange,e);w.update(CONFIG.step,idle);
 assert.ok(e.dead);assert.equal(w.kills,1);w.update(CONFIG.step,idle);assert.equal(w.kills,1);
});
test('player blood loss and exposed head death produce a single player corpse',()=>{
 for(const cause of ['head','bleed']){
  const w=new World({play(){}});w.start();
  if(cause==='head'){w.player.body.head.armor=0;w.hurt(1,null,{region:'head'});}
  else{w.player.bloodLoss=99;w.player.body.torso.bleedRate=10;w.player.body.torso.bleedRemaining=1;w.update(.2,idle);}
  assert.equal(w.state,'dead');assert.equal(w.effects.items.items.filter(x=>x.kind==='body').length,1);
  w.update(.2,idle);assert.equal(w.effects.items.items.filter(x=>x.kind==='body').length,1);
 }
});
test('pause freezes wounds and stage transitions preserve armor, damage and blood loss',()=>{
 const w=new World({play(){}});w.start();w.player.body.torso.armor=0;w.hurt(10,null,{region:'torso'});w.player.bloodLoss=15;
 const before=structuredClone(w.player.body);w.state='settings';w.update(10,idle);assert.deepEqual(w.player.body,before);
 w.nextStage();assert.deepEqual(w.player.body,before);assert.equal(w.player.bloodLoss,15);
 w.start();assert.equal(w.player.body.torso.armor,90);assert.equal(w.player.bloodLoss,0);
});

test('bleeding intervals vary while blood loss stays independent of visual randomness and frame rate',()=>{
 const make=()=>{const e={};initBody(e);e.body.torso.armor=0;applyInjury(e,30,{region:'torso'});return e;};
 const fast=make(),slow=make();let a=0,b=0;
 tickWounds(fast,5,()=>a++,()=>0);tickWounds(slow,5,()=>b++,()=>1);
 assert.ok(a>b);assert.equal(fast.bloodLoss,slow.bloodLoss);assert.equal(fast.body.torso.bleedRemaining,0);
 const e=make(),times=[];let t=0,i=0;const random=()=>[0,1,.2,.8][i++%4];
 for(let frame=0;frame<400;frame++){t+=.01;tickWounds(e,.01,()=>times.push(t),random);}
 const gaps=times.slice(1).map((v,i)=>Math.round((v-times[i])*100));assert.ok(new Set(gaps).size>2);
});

test('recovery waits six seconds, then gradually restores blood loss and non-severed damage',()=>{
 const e=entity();e.body.torso.armor=0;hit(e,'torso',45);tickWounds(e,6);const loss=e.bloodLoss;
 assert.equal(e.body.torso.damage,45);tickWounds(e,2);
 assert.ok(e.bloodLoss<loss&&e.bloodLoss>loss-4);assert.equal(e.body.torso.damage,42);assert.equal(e.body.torso.armor,0);
 tickWounds(e,100);assert.equal(e.bloodLoss,0);assert.equal(e.body.torso.damage,0);assert.equal(e.wasHit,false);
});
test('new hits delay recovery again, even when armor absorbs the shot',()=>{
 const e=entity();e.body.torso.damage=30;e.bloodLoss=20;tickWounds(e,7);const damage=e.body.torso.damage;
 hit(e,'leftArm',1);tickWounds(e,5.9);assert.equal(e.body.torso.damage,damage);
 tickWounds(e,.2);assert.ok(e.body.torso.damage<damage);
});
test('recovery does not regrow limbs, repair armor or revive the dead',()=>{
 const e=entity();e.body.leftArm.armor=0;hit(e,'leftArm',60);tickWounds(e,200);
 assert.equal(e.dead,false);assert.equal(e.body.leftArm.severed,true);assert.equal(e.body.leftArm.damage,60);assert.equal(e.body.leftArm.armor,0);assert.deepEqual(e.missingArms,[-1]);assert.equal(e.bloodLoss,0);
 e.dead=true;e.bloodLoss=100;tickWounds(e,100);assert.equal(e.bloodLoss,100);assert.equal(e.dead,true);
});
test('recovery across the delay boundary is independent of timestep',()=>{
 const a=entity(),b=entity();for(const e of [a,b]){e.body.torso.armor=0;hit(e,'torso',45);}
 tickWounds(a,10);for(let i=0;i<1000;i++)tickWounds(b,.01);
 assert.ok(Math.abs(a.bloodLoss-b.bloodLoss)<1e-8);assert.ok(Math.abs(a.body.torso.damage-b.body.torso.damage)<1e-8);
});

test('higher accumulated blood loss recovers more slowly and speeds up as it falls',()=>{
 const low=entity(),high=entity();low.bloodLoss=20;high.bloodLoss=80;low.recoveryRemaining=0;high.recoveryRemaining=0;
 tickWounds(low,1);tickWounds(high,1);
 const lowDrop=20-low.bloodLoss,highDrop=80-high.bloodLoss;
 assert.ok(lowDrop>highDrop);assert.ok(lowDrop>.85&&lowDrop<.86);assert.ok(highDrop>.4&&highDrop<.41);
 const before=high.bloodLoss;tickWounds(high,1);assert.ok(before-high.bloodLoss>highDrop);
 tickWounds(low,500);assert.equal(low.bloodLoss,0);
});
