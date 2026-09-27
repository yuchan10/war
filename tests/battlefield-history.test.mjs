import test from 'node:test';
import assert from 'node:assert/strict';
import { Effects } from '../src/effects.js';
import { World } from '../src/world.js';

test('corpses, detached parts and rifles survive time and particle pool pressure',()=>{
  const fx=new Effects(),soldier={x:300,y:300,angle:0,missingArm:1,armsDisabled:true};
  fx.detach(soldier,'arm',0);fx.detachHead(soldier,0);
  for(let i=0;i<150;i++)fx.fallen(soldier);
  for(let i=0;i<200;i++)fx.impact(300,300);
  fx.update(600);
  const remains=fx.items.items.filter(e=>e.persistent);
  assert.equal(remains.length,153);assert.ok(remains.every(e=>e.active));
  assert.ok(fx.items.items.filter(e=>!e.persistent).every(e=>!e.active));
  const count=fx.blood.marks.length;
  for(let i=0;i<2000;i++)fx.blood.add(300,300,3,0);
  assert.equal(fx.blood.marks.length,count+2000);
});

test('visited scenes preserve independent remains and blood until a new run',()=>{
  const w=new World({play(){}});w.startPrologue();
  w.effects.fallen({x:300,y:300,angle:0});w.effects.impact(300,300);
  const stage=w.stage;w.nextStage();
  assert.equal(w.battlefieldHistory.length,1);assert.equal(w.battlefieldHistory[0].stage,stage);
  assert.equal(w.battlefieldHistory[0].remains.length,1);assert.ok(w.battlefieldHistory[0].blood.length>0);
  assert.equal(w.effects.blood.marks.length,0);
  w.effects.fallen({x:600,y:300,angle:0});w.nextStage();
  assert.equal(w.battlefieldHistory.length,2);
  assert.equal(w.battlefieldHistory[0].remains[0].x,300);
  assert.equal(w.battlefieldHistory[1].remains[0].x,600);
  w.start();assert.equal(w.battlefieldHistory.length,0);
});
