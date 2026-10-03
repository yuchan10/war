import test from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/config.js';
import { updateAssault } from '../src/assault-ai.js';
import { updateCoverDefender } from '../src/cover-ai.js';
import { updateWounded } from '../src/wounded-ai.js';
import { World } from '../src/world.js';

test('healthy assault continues to the exact last sighting after prolonged loss of contact',()=>{
  const e={...ENEMIES.assault,maxHp:120,x:800,y:350,timer:10,angle:Math.PI};
  updateAssault(e,.01,{x:300,y:350,vx:100},[],()=>{});
  const walls=[{x:400,y:100,w:30,h:500}];
  const first=updateAssault(e,20,{x:200,y:250},walls,()=>{});
  const second=updateAssault(e,.2,{x:100,y:500},walls,()=>{});
  assert.ok(Math.hypot(first.x,first.y)>0);assert.deepEqual(first,second);
  assert.equal(e.lastContact.x,300);assert.equal(e.lastContact.y,350);
});

test('support suppresses a remembered position even after thirty seconds out of sight',()=>{
  const e={...ENEMIES.shooter,x:600,y:350,timer:0,coverState:'peek',exposure:0,
    cover:{hide:{x:600,y:350},peek:{x:600,y:350},delay:0}};
  updateCoverDefender(e,.01,{x:300,y:350},[],()=>{});
  e.contactAge=30;let shots=0;
  for(let i=0;i<200;i++){e.timer-=.01;updateCoverDefender(e,.01,{x:200,y:270},[{x:400,y:200,w:30,h:300}],()=>shots++);}
  assert.ok(shots>0);assert.ok(e.suppressing);assert.equal(e.lastContact.x,300);
});

test('wounded soldiers only fight a visible forward target with a usable rifle',()=>{
  const ally={x:700,y:350,hp:100,active:true};
  for(const role of ['assault','shooter']){
    const base={...ENEMIES[role],wasHit:true,x:500,y:350,angle:0,timer:0};
    const e={...base};let shots=0;
    assert.deepEqual(updateWounded(e,.01,{x:650,y:350},[],()=>shots++,[ally]),{x:0,y:0});
    updateWounded(e,e.aimDuration,{x:650,y:350},[],()=>shots++,[ally]);assert.equal(shots,1);
    for(const variant of ['behind','unarmed','wall']){
      const hurt={...base,armsDisabled:variant==='unarmed',burstLeft:2};
      const p={x:variant==='behind'?350:650,y:350};
      const walls=variant==='wall'?[{x:580,y:300,w:20,h:100}]:[];
      const motion=updateWounded(hurt,.01,p,walls,()=>assert.fail('must retreat'),[ally]);
      assert.equal(hurt.woundedState,'hold');assert.ok(Number.isFinite(motion.x)&&Number.isFinite(motion.y));
      assert.equal(hurt.burstLeft,0);
    }
  }
});

test('world does not rotate a wounded soldier toward an unseen rear threat before deciding to retreat',()=>{
  const w=new World({play(){}});w.start();w.walls=[];w.enemies=[];
  w.spawnEnemy('assault',500,350);w.spawnEnemy('shooter',750,350);
  const e=w.enemies[0];Object.assign(e,{born:0,wasHit:true,angle:0});
  Object.assign(w.player,{x:350,y:350});
  w.update(.01,{mouse:{x:500,y:350,down:false},movement:()=>({x:0,y:0})});
  assert.equal(e.woundedState,'hold');assert.equal(e.x,500);
  assert.equal(e.aimRemaining,0);
});
