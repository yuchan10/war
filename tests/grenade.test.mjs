import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {Input} from '../src/input.js';
import {Pickups} from '../src/pickups.js';
import {initBody} from '../src/injury.js';
import {createGrenade,updateGrenades,blastDamage} from '../src/grenade.js';
const idle={mouse:{x:460,y:300,down:false},movement:()=>({x:0,y:0})};
function scene(){const w=new World({play(){}},()=>.5);w.start();w.walls=[];w.enemies=[];Object.assign(w.player,{x:100,y:300,angle:0});w.spawnEnemy('assault',1100,600);w.enemies[0].born=100;return w;}
test('parabolic throw passes above walls and lands before its three-second fuse',()=>{
 for(const dt of [1/30,1/60,1/120]){
  const walls=[{x:240,y:250,w:20,h:100}],g=createGrenade({x:100,y:300,angle:0},{x:600,y:300},walls);let hits=0,peak=0;
  for(let i=0;i<Math.round(1/dt);i++){updateGrenades([g],dt,walls,()=>hits++);peak=Math.max(peak,g.height);}
  assert.ok(Math.abs(g.x-460)<1e-8);assert.equal(g.height,0);assert.ok(peak>85);assert.equal(hits,0);
  for(let i=0;i<Math.round(2.1/dt);i++)updateGrenades([g],dt,walls,()=>hits++);
  assert.equal(hits,1);assert.equal(g.active,false);
 }
});
test('landing inside cover moves to its edge; blast cannot penetrate cover',()=>{
 const walls=[{x:300,y:250,w:20,h:100}],g=createGrenade({x:100,y:300,angle:0},{x:310,y:300},walls);
 updateGrenades([g],1,walls,()=>{});assert.ok(g.x<=296||g.x>=324);assert.equal(g.height,0);
 assert.equal(blastDamage({x:290,y:300},{x:340,y:300},walls),0);
 assert.equal(blastDamage({x:300,y:300},{x:470,y:300},[]),0);
});
test('G primes, fresh click throws, and that click cannot shoot until released',()=>{
 const w=scene(),ammo=w.weapon.ammo;
 w.update(.01,{...idle,consumeGrenade:()=>true});const g=w.primedGrenade;
 assert.ok(g.held);assert.equal(w.grenadeAmmo,2);assert.equal(w.grenades.length,1);
 w.update(.5,idle);const fuse=g.fuse;
 w.update(.01,{...idle,mouse:{...idle.mouse,down:true}});
 assert.equal(w.primedGrenade,null);assert.equal(g.held,false);assert.ok(g.fuse<fuse);assert.equal(w.weapon.ammo,ammo);
 w.update(.2,{...idle,mouse:{...idle.mouse,down:true}});assert.equal(w.weapon.ammo,ammo);
 w.update(.01,idle);w.update(.01,{...idle,mouse:{...idle.mouse,down:true}});assert.equal(w.weapon.ammo,ammo-1);
});
test('cannot throw without priming and stage transitions never refill inventory',()=>{
 const w=scene();assert.equal(w.throwGrenade(idle.mouse),false);
 assert.ok(w.primeGrenade());assert.equal(w.primeGrenade(),false);assert.ok(w.throwGrenade(idle.mouse));
 w.nextStage();assert.equal(w.grenadeAmmo,2);assert.equal(w.grenades.length,0);
 w.grenadeCooldown=0;w.primeGrenade();const held=w.primedGrenade;w.nextStage();assert.equal(w.primedGrenade,held);assert.equal(w.grenadeAmmo,1);
 w.player.armsDisabled=true;assert.equal(w.throwGrenade(idle.mouse),false);
 w.reset();assert.equal(w.grenadeAmmo,3);assert.equal(w.primedGrenade,null);
});
test('held fuse follows hand, pauses with settings, and kills owner if not thrown',()=>{
 const w=scene();w.primeGrenade();const g=w.primedGrenade;w.player.x=150;
 w.update(.1,idle);assert.ok(g.x>150);assert.ok(g.fuse<3);
 const fuse=g.fuse;w.state='settings';w.update(2,idle);assert.equal(g.fuse,fuse);
 w.state='playing';w.update(3,idle);assert.equal(w.player.dead,true);assert.equal(w.primedGrenade,null);assert.equal(w.deathRemaining,1);
});
test('close blast kills and dismembers all nearby enemies; outer blast severs limbs and knocks back',()=>{
 const w=scene();w.enemies=[];
 for(const x of [400,450,500,540,580]){w.spawnEnemy('assault',x,300);w.enemies.at(-1).born=0;}
 const [near,near2,outer,edge,far]=w.enemies;w.explodeGrenade({x:400,y:300});
 for(const e of [near,near2]){assert.equal(e.dead,true);assert.equal(e.missingArms.length,2);assert.equal(e.missingLegs.length,2);}
 assert.equal(outer.dead,false);assert.equal((outer.missingArms?.length||0)+(outer.missingLegs?.length||0),2);
 assert.equal(edge.dead,false);assert.equal((edge.missingArms?.length||0)+(edge.missingLegs?.length||0),1);
 assert.ok(outer.knockX>400);assert.equal(far.wasHit,undefined);assert.equal(w.kills,2);
 const corpse=w.effects.items.items.find(e=>e.kind==='body'),x=corpse.x;w.effects.update(.1,[]);assert.notEqual(corpse.x,x);
});
test('near explosions trigger ringing with distance-dependent strength',()=>{
 const w=scene(),heard=[];w.audio.ringExplosion=s=>heard.push(s);
 w.explodeGrenade({x:280,y:300});assert.equal(heard.length,1);assert.ok(heard[0]>0&&heard[0]<1);
 w.explodeGrenade({x:600,y:300});assert.equal(heard.length,1);
});
test('random drops survive ammo looting and enforce cap including primed grenade',()=>{
 const w=scene(),p=w.player,loot=new Pickups(),e={x:p.x,y:p.y,ammo:0};initBody(e);
 for(const part of Object.values(e.body))part.armor=0;
 loot.drop(e,[],()=>.31);assert.equal(loot.items.length,0);
 loot.drop(e,[],()=>.1);assert.equal(loot.items[0].grenades,1);
 loot.collectAmmo(p,[],w.weapon);assert.equal(loot.items.length,1);
 assert.equal(loot.collectGrenades(p,[],w),0);w.primeGrenade();assert.equal(loot.collectGrenades(p,[],w),0);
 w.throwGrenade(idle.mouse);assert.equal(loot.collectGrenades(p,[],w),1);assert.equal(w.grenadeAmmo,3);assert.equal(loot.items.length,0);
});
test('E collects grenade loot once, preserves overflow, and loot follows blast-thrown corpses',()=>{
 const w=scene();w.grenadeAmmo=2;w.pickups.items=[{x:100,y:300,armor:{},ammo:0,grenades:2,corpse:{x:100,y:300}}];
 const item=w.pickups.items[0];w.update(.01,{...idle,consumeLoot:()=>true,lootHeld:()=>true});assert.equal(w.grenadeAmmo,3);assert.equal(item.grenades,1);
 w.update(.01,{...idle,consumeLoot:()=>true,lootHeld:()=>true});assert.equal(item.grenades,1);
 item.corpse.x=400;assert.equal(w.pickups.nearby(w.player,[]).length,0);assert.equal(item.x,400);
});
test('G queues only once per press and clears on pause',t=>{
 const old=globalThis.window,events={};globalThis.window={addEventListener(name,fn){events[name]=fn;}};t.after(()=>globalThis.window=old);
 const input=new Input({addEventListener(){}},()=>{},()=>{});
 events.keydown({code:'KeyG',repeat:false});assert.equal(input.consumeGrenade(),true);assert.equal(input.consumeGrenade(),false);
 events.keydown({code:'KeyG',repeat:true});assert.equal(input.consumeGrenade(),false);
 events.keydown({code:'KeyG',repeat:false});input.clear();assert.equal(input.consumeGrenade(),false);
});
