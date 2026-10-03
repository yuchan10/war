import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGES } from '../src/stages.js';
import { routeDirection,moveBody } from '../src/arena.js';
function clear(p,walls,r=18){return walls.every(w=>Math.hypot(p.x-Math.max(w.x,Math.min(w.x+w.w,p.x)),p.y-Math.max(w.y,Math.min(w.y+w.h,p.y)))>=r);}
test('six distinct terrain layouts keep spawn, exit, soldiers and firing posts clear',()=>{
  assert.equal(STAGES.length,6);assert.equal(new Set(STAGES.map(s=>s.theme)).size,6);
  for(const s of STAGES){
    for(const p of [s.spawn,s.exit,...s.enemies,...s.enemies.filter(e=>e.cover).map(e=>e.cover.peek)])assert.ok(clear(p,s.walls),s.name+' blocked position '+JSON.stringify(p));
    for(const e of s.enemies.filter(e=>e.cover)){
      const body={x:e.x,y:e.y,radius:17},target=e.cover.peek;
      for(let i=0;i<100;i++){const dx=target.x-body.x,dy=target.y-body.y,d=Math.hypot(dx,dy);if(d<2)break;moveBody(body,dx/d*2,dy/d*2,s.walls);}
      assert.ok(Math.hypot(body.x-target.x,body.y-target.y)<3,s.name+' blocked peek');
    }
  }
});
test('assault paths from every deployment reach the approach area',()=>{
  for(const s of STAGES)for(const e of s.enemies.filter(e=>e.type==='assault')){
    const body={x:e.x,y:e.y,radius:17},target=e.advancePoint;
    for(let i=0;i<1500&&Math.hypot(body.x-target.x,body.y-target.y)>10;i++){
      const d=routeDirection(body,target,s.walls);moveBody(body,d.x*2,d.y*2,s.walls);
    }
    assert.ok(Math.hypot(body.x-target.x,body.y-target.y)<=10,s.name+' assault trapped');
  }
});

test('every exit and enemy position is reachable from its sector entrance',()=>{
 for(const s of STAGES)for(const target of [s.exit,...s.enemies]){
  const body={...s.spawn,radius:17};
  for(let i=0;i<2200&&Math.hypot(body.x-target.x,body.y-target.y)>10;i++){
   const direction=routeDirection(body,target,s.walls);moveBody(body,direction.x*3,direction.y*3,s.walls);
  }
  assert.ok(Math.hypot(body.x-target.x,body.y-target.y)<=10,s.name+' unreachable '+JSON.stringify(target));
 }
});
test('sectors vary approach direction, squad composition and tactical guidance',()=>{
 assert.equal(new Set(STAGES.map(s=>JSON.stringify(s.spawn))).size,6);
 assert.equal(new Set(STAGES.map(s=>JSON.stringify(s.exit))).size,6);
 assert.ok(new Set(STAGES.map(s=>s.enemies.filter(e=>e.type==='shooter').length)).size>=3);
 assert.equal(new Set(STAGES.map(s=>s.strategy)).size,6);
});
