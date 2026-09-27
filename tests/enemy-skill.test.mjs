import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/world.js';
import { ENEMIES } from '../src/config.js';
import { skillStats } from '../src/enemy-skill.js';
import { updateEnemyFire } from '../src/enemy-fire.js';

function soldier(skill){return {...ENEMIES.shooter,...skillStats(ENEMIES.shooter,skill),x:0,y:0,timer:0};}
test('both tactical roles contain mixed skills without changing appearance or health',()=>{
  const w=new World({play(){}});w.start();
  for(const role of ['assault','support']){
    const soldiers=w.enemies.filter(e=>e.role===role);
    assert.equal(new Set(soldiers.map(e=>e.skill)).size,3);
  }
  assert.equal(new Set(w.enemies.map(e=>e.color)).size,1);
  assert.equal(new Set(w.enemies.map(e=>e.hp)).size,1);
});
test('veteran reacts sooner and fires a tighter burst than rookie',()=>{
  const shots={veteran:[],rookie:[]};
  for(const skill of Object.keys(shots)){
    const e=soldier(skill),target={x:400,y:0},fire=(x,y,a)=>shots[skill].push(a);
    updateEnemyFire(e,.01,target,fire);
    updateEnemyFire(e,.18,target,fire);
    assert.equal(shots[skill].length,skill==='veteran'?1:0);
    for(let i=0;i<80;i++)updateEnemyFire(e,.01,target,fire);
    assert.equal(shots[skill].length,3);
  }
  const width=a=>Math.max(...a)-Math.min(...a);
  assert.ok(width(shots.veteran)<width(shots.rookie)/4);
});
test('trained aim follows visible movement before firing then locks for the burst and cancels without contact',()=>{
  const e=soldier('veteran'),shots=[],fire=(x,y,a)=>shots.push(a);
  updateEnemyFire(e,.01,{x:400,y:0},fire);
  updateEnemyFire(e,.18,{x:400,y:100},fire);
  assert.ok(shots[0]>.2);
  const angle=e.aimAngle;
  updateEnemyFire(e,.15,{x:400,y:-100},fire);
  assert.equal(e.aimAngle,angle);
  updateEnemyFire(e,.2,{x:400,y:-100},fire,false);
  assert.equal(shots.length,2);
  assert.equal(e.burstLeft,0);
});
