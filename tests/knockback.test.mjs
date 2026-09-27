import test from 'node:test';
import assert from 'node:assert/strict';
import { applyKnockback, moveKnockback } from '../src/knockback.js';
import { World } from '../src/world.js';
import { CONFIG } from '../src/config.js';

test('impulse moves along impact direction and decays independent of timestep',()=>{
  const a={x:600,y:360,radius:16},b={...a};
  applyKnockback(a,900,0,460);applyKnockback(b,900,0,460);
  moveKnockback(a,.1);for(let i=0;i<12;i++)moveKnockback(b,1/120);
  assert.ok(a.x>600);assert.equal(a.y,360);
  assert.ok(Math.abs(a.x-b.x)<1e-8);assert.ok(a.knockX<460);
});
test('knockback resistance and boundaries limit displacement',()=>{
  const a={x:600,y:360,radius:20},b={...a,knockbackScale:.18};
  applyKnockback(a,1,0,460);applyKnockback(b,1,0,460);
  moveKnockback(a,.1);moveKnockback(b,.1);assert.ok(b.x<a.x);
  a.x=CONFIG.arena.right-a.radius;moveKnockback(a,.1);
  assert.equal(a.x,CONFIG.arena.right-a.radius);
});
test('actual player bullet impact applies knockback to enemy',()=>{
  const w=new World({play(){}},()=>.3);w.start();w.enemies=[];w.spawnEnemy('assault');
  const e=w.enemies[0];Object.assign(e,{x:700,y:360,born:0});
  w.shoot(680,360,0,false,1,900);
  const input={mouse:{x:900,y:360,down:false},movement:()=>({x:0,y:0}),consumeDash:()=>false};
  w.update(CONFIG.step,input);assert.ok(e.knockX>0);
  const x=e.x;w.update(CONFIG.step,input);assert.ok(e.x>x);
});
test('player invulnerability prevents repeated knockback',()=>{
  const w=new World({play(){}});w.start();w.player.invulnerable=0;
  const bullet={vx:1,vy:0};w.hurt(10,bullet);const impulse=w.player.knockX;
  assert.ok(impulse>0);w.hurt(10,bullet);assert.equal(w.player.knockX,impulse);
});

