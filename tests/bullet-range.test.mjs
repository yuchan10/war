import test from 'node:test';
import assert from 'node:assert/strict';
import { traceBullet } from '../src/arena.js';
import { segmentHits } from '../src/core.js';
import { CONFIG, ENEMIES } from '../src/config.js';
import { updateEnemyFire } from '../src/enemy-fire.js';
import { World } from '../src/world.js';
import { Renderer } from '../src/renderer.js';

const bullet=()=>({x:100,y:300,vx:1000,vy:0,radius:4,remainingRange:360,active:true});

test('range clips the damage segment even when a frame overshoots',()=>{
  const b=bullet();let impacts=0;
  traceBullet(b,1,[],segment=>{
    assert.equal(segmentHits(segment.px,segment.py,segment.x,segment.y,450,300,4),true);
    assert.equal(segmentHits(segment.px,segment.py,segment.x,segment.y,480,300,4),false);
  },()=>impacts++);
  assert.equal(b.x,460);assert.equal(b.remainingRange,0);
  assert.equal(b.active,false);assert.equal(impacts,0);
});

test('range measures cumulative diagonal distance independently of speed',()=>{
  for(const speed of [500,1550]){
    const b={...bullet(),vx:speed*.6,vy:speed*.8,remainingRange:100};
    for(let i=0;i<100&&b.active;i++)traceBullet(b,.01,[]);
    assert.ok(Math.abs(b.x-160)<1e-8);assert.ok(Math.abs(b.y-380)<1e-8);
    assert.equal(b.active,false);
  }
});

test('walls still stop bullets before their maximum range',()=>{
  const b=bullet();let impacts=0;
  traceBullet(b,1,[{x:200,y:200,w:20,h:200}],()=>false,()=>impacts++);
  assert.equal(b.x,196);assert.equal(b.active,false);assert.equal(impacts,1);
});

test('player and enemy bursts initialize range, including reused bullets',()=>{
  const w=new World({play(){}});
  w.shoot(100,300,0,false,30,1550);
  assert.equal(w.bullets.items[0].remainingRange,CONFIG.weapon.bulletRange);
  for(const type of ['assault','shooter']){
    w.bullets.clear();
    const e={...ENEMIES[type],x:100,y:300,timer:0};
    const shoot=(...args)=>w.shoot(...args);
    updateEnemyFire(e,.01,{x:200,y:300},shoot);
    updateEnemyFire(e,e.aimDuration,{x:200,y:300},shoot);
    assert.equal(w.bullets.items[0].remainingRange,e.bulletRange);
    if(e.burstLeft){
      updateEnemyFire(e,e.burstInterval,{x:200,y:300},shoot);
      assert.equal(w.bullets.items[1].remainingRange,e.bulletRange);
    }
  }
});

test('prediction stops at remaining range without consuming the live bullet',()=>{
  const b={...bullet(),remainingRange:75};let end;
  const ctx={save(){},restore(){},setLineDash(){},beginPath(){},moveTo(){},lineTo(x,y){end={x,y};},stroke(){}};
  Renderer.prototype.prediction(ctx,{...b},[],'white');
  assert.deepEqual(end,{x:175,y:300});assert.equal(b.remainingRange,75);
});
