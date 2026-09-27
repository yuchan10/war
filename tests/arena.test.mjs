import test from 'node:test';
import assert from 'node:assert/strict';
import { moveBody, traceBullet, routeDirection } from '../src/arena.js';
const wall={x:500,y:200,w:40,h:300};
test('fast body movement and dash cannot cross cover',()=>{
  const body={x:440,y:350,radius:15};moveBody(body,180,40,[wall]);
  assert.ok(body.x<=485);assert.ok(body.y>350);
});
test('bullet stops at first wall without tunnelling',()=>{
  const b={x:450,y:350,vx:900,vy:0,radius:4,bounces:2,active:true};let hits=0;
  traceBullet(b,.1,[wall],()=>false,()=>hits++);
  assert.equal(hits,1);assert.equal(b.vx,900);assert.equal(b.active,false);assert.equal(b.x,496);
});
test('cover truncates damage segment before targets behind it',()=>{
  const b={x:450,y:350,vx:900,vy:0,radius:4,bounces:0,active:true};const segments=[];
  traceBullet(b,.3,[wall],b=>{segments.push([b.px,b.x]);return false;});
  assert.equal(b.active,false);assert.ok(segments.every(([x,y])=>Math.max(x,y)<=496));
});
test('enemy finds route around wall instead of heading into it',()=>{
  const e={x:440,y:350,radius:16},target={x:600,y:350};
  for(let i=0;i<600;i++){const d=routeDirection(e,target,[wall]);moveBody(e,d.x*2,d.y*2,[wall]);}
  assert.ok(Math.hypot(e.x-target.x,e.y-target.y)<10);
});
test('outer boundary absorbs bullets',()=>{
  const b={x:1140,y:350,vx:200,vy:0,radius:6,bounces:1,active:true};
  traceBullet(b,.2,[]);assert.equal(b.active,false);
});
