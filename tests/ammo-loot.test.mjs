import test from 'node:test';
import assert from 'node:assert/strict';
import {Weapon} from '../src/weapon.js';
import {Pickups} from '../src/pickups.js';
import {World} from '../src/world.js';
import {updateEnemyFire,updateEnemyReload} from '../src/enemy-fire.js';
import {initBody} from '../src/injury.js';

test('reload transfers only available reserve and cannot create ammo',()=>{
 const gun=new Weapon();assert.equal(gun.capacity,24);assert.equal(gun.reserveCapacity,72);
 gun.ammo=3;gun.reserve=7;assert.ok(gun.reload());gun.update(2);
 assert.equal(gun.ammo,10);assert.equal(gun.reserve,0);assert.equal(gun.reload(),false);
 for(let i=0;i<10;i++)assert.ok(gun.consume());assert.equal(gun.consume(),false);
});
test('enemy stops exactly at magazine limit, including in the middle of a burst',()=>{
 const e={x:100,y:100,ammo:24,timer:0,aimDuration:.01,burstCount:3,burstInterval:.01,fireInterval:.01,bulletSpeed:100,damage:22};let shots=0;
 for(let i=0;i<500;i++){e.timer-=.02;updateEnemyFire(e,.02,{x:200,y:100},()=>{shots++;});}
 assert.equal(shots,24);assert.equal(e.ammo,0);assert.equal(e.burstLeft,0);
});
test('corpse ammo preserves shots spent, caps reserve and leaves excess for later',()=>{
 const p={x:300,y:300},e={x:300,y:300,ammo:9};initBody(p);initBody(e);
 const loot=new Pickups(),gun=new Weapon();loot.drop(e);gun.reserve=67;
 assert.equal(loot.collectAmmo(p,[],gun),5);assert.equal(gun.reserve,72);assert.equal(loot.items[0].ammo,4);
 assert.equal(loot.collectAmmo(p,[],gun),0);gun.reserve=0;
 assert.equal(loot.collectAmmo(p,[],gun),4);assert.equal(loot.collectAmmo(p,[],gun),0);
});
test('releasing E cancels changing; pressing again restarts the part timer',()=>{
 const w=new World({play(){}});w.start();w.enemies=[];w.walls=[];
 const p=w.player;const dead={x:p.x,y:p.y,ammo:0};initBody(dead);w.pickups.drop(dead);p.body.torso.armor=5;
 const idle={mouse:{x:900,y:360,down:false},movement:()=>({x:0,y:0})};
 w.update(.01,{...idle,consumeLoot:()=>true,lootHeld:()=>true});assert.equal(p.body.torso.armor,0);
 w.update(1,{...idle,lootHeld:()=>true});assert.ok(w.pickups.changing.elapsed>1);
 w.update(.01,{...idle,lootHeld:()=>false});assert.equal(w.pickups.changing,null);assert.equal(p.body.torso.armor,0);
 w.update(.01,{...idle,consumeLoot:()=>true,lootHeld:()=>true});assert.equal(w.pickups.changing.elapsed,.01);
});
test('equipment glow only marks upgrades and usable ammo',()=>{
 const p={x:300,y:300},e={x:300,y:300};initBody(p);initBody(e);const loot=new Pickups(),gun=new Weapon();loot.drop(e);
 let squares=0;const ctx={save(){},restore(){},translate(){},strokeRect(){squares++;}};
 loot.draw(ctx,()=>true,p,gun,0);assert.equal(squares,0);
 p.body.torso.armor=1;loot.draw(ctx,()=>true,p,gun,0);assert.equal(squares,1);
 p.body.torso.armor=90;loot.items[0].ammo=3;gun.reserve=72;loot.draw(ctx,()=>true,p,gun,0);assert.equal(squares,1);
 gun.reserve=71;loot.draw(ctx,()=>true,p,gun,0);assert.equal(squares,2);
});

test('enemy reloads out of sight, cannot shoot during reload and drops only loaded rounds',()=>{
 const e={x:300,y:300,ammo:0,reloadDuration:2.4,timer:0,aimDuration:.01,burstCount:3,bulletSpeed:100,damage:22};initBody(e);
 updateEnemyReload(e,1);assert.equal(e.ammo,0);let shots=0;
 updateEnemyFire(e,1,{x:400,y:300},()=>shots++);assert.equal(shots,0);
 const during=new Pickups();during.drop(e);assert.equal(during.items[0].ammo,0);
 updateEnemyReload(e,1.4);assert.equal(e.ammo,24);
 updateEnemyFire(e,.02,{x:400,y:300},()=>shots++);updateEnemyFire(e,.02,{x:400,y:300},()=>shots++);
 assert.equal(shots,1);assert.equal(e.ammo,23);const after=new Pickups();after.drop(e);assert.equal(after.items[0].ammo,23);
 e.dead=true;e.ammo=0;updateEnemyReload(e,10);assert.equal(e.ammo,0);
});
test('enemy has unlimited reserve but each magazine requires a reload gap',()=>{
 const e={x:100,y:100,ammo:24,reloadDuration:1.8,timer:0,aimDuration:.01,burstCount:3,burstInterval:.01,fireInterval:.01,bulletSpeed:100,damage:22};let shots=0;
 for(let i=0;i<500;i++){e.timer-=.02;updateEnemyReload(e,.02);updateEnemyFire(e,.02,{x:200,y:100},()=>{shots++;assert.ok(e.ammo>0);assert.ok(!e.reloadRemaining);});}
 assert.ok(shots>24);assert.ok(shots<24*6);assert.ok(e.ammo>=0&&e.ammo<=24);
});
