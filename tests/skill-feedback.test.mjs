import test from 'node:test';
import assert from 'node:assert/strict';
import { updateEnemyFire } from '../src/enemy-fire.js';
import { Feedback } from '../src/feedback.js';
import { World } from '../src/world.js';
import { CONFIG } from '../src/config.js';
import { STAGES } from '../src/stages.js';
import { traceBullet } from '../src/arena.js';

test('enemy telegraphs, locks aim and fires without tracking player movement',()=>{
  const e={x:0,y:0,timer:0,aimDuration:.75,fireInterval:1.3,damage:10,bulletSpeed:235};
  const shots=[];const fire=(...args)=>shots.push(args);
  updateEnemyFire(e,.01,{x:100,y:0},fire);assert.equal(shots.length,0);
  updateEnemyFire(e,.5,{x:0,y:100},fire);assert.equal(shots.length,0);
  updateEnemyFire(e,.25,{x:0,y:100},fire);assert.equal(shots.length,1);assert.equal(shots[0][2],0);
});
test('feedback counts consecutive kills only',()=>{
  const f=new Feedback();assert.equal(f.text,'');
  f.killed(1);f.killed(2);assert.equal(f.text,'2 연속 제압');
  f.damaged();f.killed(3);assert.equal(f.combo,1);
});
test('space input cannot dash and ordinary movement has fixed speed',()=>{
  const w=new World({play(){}});w.start();
  const x=w.player.x;
  w.update(CONFIG.step,{mouse:{x:900,y:360,down:false},movement:()=>({x:1,y:0}),consumeDash:()=>true});
  assert.ok(Math.abs(w.player.x-x-CONFIG.player.speed*CONFIG.step)<1e-6);
  assert.equal(w.player.dashTime,undefined);
});
test('enemy projectiles are stopped by cover instead of bouncing into shelter',()=>{
  const b={x:450,y:180,vx:0,vy:235,radius:6,active:true};
  traceBullet(b,1,[{x:400,y:220,w:150,h:30}]);assert.equal(b.active,false);assert.equal(b.reflected,undefined);
});
test('every stage limits cover count and has fixed enemies',()=>{
  for(const stage of STAGES){assert.ok(stage.enemies.length>0);assert.ok(stage.walls.length<=6);assert.ok(stage.enemies.length>=5);}
});
