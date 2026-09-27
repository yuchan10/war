import test from 'node:test';
import assert from 'node:assert/strict';
import { animateStride } from '../src/soldier.js';
test('infantry gait advances on movement and stops at rest',()=>{
  const e={x:105,y:100};animateStride(e,100,100);
  assert.equal(e.walking,true);assert.ok(e.walkPhase>0);
  const phase=e.walkPhase;animateStride(e,105,100);
  assert.equal(e.walking,false);assert.equal(e.walkPhase,phase);
});
test('sideways walking follows travel direction without changing aim',()=>{
  const e={x:100,y:105,angle:0};animateStride(e,100,100);
  assert.equal(e.walkAngle,Math.PI/2);assert.equal(e.angle,0);
});
