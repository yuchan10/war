import test from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/config.js';
import { STAGES } from '../src/stages.js';
import { updateAssault } from '../src/assault-ai.js';
import { World } from '../src/world.js';
test('each squad uses exactly two shared role definitions',()=>{
  for(const s of STAGES){
    assert.ok(s.enemies.some(e=>ENEMIES[e.type].role==='assault'));
    assert.ok(s.enemies.some(e=>ENEMIES[e.type].role==='support'));
    assert.ok(s.enemies.filter(e=>ENEMIES[e.type].role==='support').every(e=>e.cover));
  }
});
test('assault fires at visible targets beyond bullet range and advances between shots',()=>{
  const e={...ENEMIES.assault,x:800,y:350,timer:0};let shots=0;
  const p={x:200,y:350};const motion=updateAssault(e,.01,p,[],()=>shots++);assert.deepEqual(motion,{x:0,y:0});
  assert.deepEqual(updateAssault(e,.01,p,[],()=>shots++),{x:0,y:0});
  updateAssault(e,.4,p,[],()=>shots++);assert.equal(shots,1);
  assert.ok(updateAssault(e,.01,p,[],()=>shots++).x<0);
});
test('firing gives assault soldiers a fixed heard position, not a moving tracker',()=>{
  const w=new World({play(){}});w.start();const e=w.enemies.find(e=>e.role==='assault');
  w.shoot(e.x-200,e.y,0,false,30,1550);assert.ok(Math.hypot(e.heardPosition.x-(e.x-200),e.heardPosition.y-e.y)<=55);
  const heard={...e.heardPosition};w.player.x+=100;assert.deepEqual(e.heardPosition,heard);
});
