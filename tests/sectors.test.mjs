import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {STAGES} from '../src/stages.js';
import {updateSectors} from '../src/sectors.js';
import {hasLineOfSight,routeDirection,moveBody} from '../src/arena.js';
const idle={mouse:{x:1000,y:550,down:false},movement:()=>({x:0,y:0})};
test('capture requires local enemies cleared and occupation, rewards only once',()=>{
 const w=new World({play(){}});w.start();const z=w.stage.zones[0];Object.assign(w.player,z);w.weapon.reserve=0;
 updateSectors(w,1);assert.equal(w.sectorIndex,0);
 w.enemies=w.enemies.filter(e=>e.zoneIndex!==0);updateSectors(w,.4);assert.equal(w.sectorIndex,0);
 w.player.x=100;updateSectors(w,.1);assert.equal(w.sectorHold,0);Object.assign(w.player,z);updateSectors(w,.8);assert.equal(w.sectorIndex,1);assert.equal(w.weapon.reserve,12);
 updateSectors(w,1);assert.equal(w.weapon.reserve,12);
});
test('remote guards stay at their sectors rather than joining on distant gunfire',()=>{
 const w=new World({play(){}});w.start();updateSectors(w,.01);const guards=w.enemies.filter(e=>e.holdingSector);assert.ok(guards.length>=2);
 const e=guards[0],pos={x:e.x,y:e.y};e.born=0;w.emitPlayerSound('gunshot');for(let i=0;i<60;i++)w.update(1/120,idle);assert.equal(e.x,pos.x);assert.equal(e.y,pos.y);
 e.wasHit=true;updateSectors(w,.01);assert.equal(e.holdingSector,false);
});
test('every capture point is reachable and opening sightlines exclude later squads',()=>{
 for(const s of STAGES){
  assert.ok(s.enemies.filter(e=>e.zoneIndex>0).every(e=>!hasLineOfSight(s.spawn,e,s.walls)),s.name+' exposed later squad');
  for(const target of s.zones){const body={...s.spawn,radius:15};for(let i=0;i<2500&&Math.hypot(body.x-target.x,body.y-target.y)>10;i++){const d=routeDirection(body,target,s.walls);moveBody(body,d.x*3,d.y*3,s.walls);}assert.ok(Math.hypot(body.x-target.x,body.y-target.y)<=10,s.name+' capture unreachable');}
 }
});
test('clearing enemies alone does not open exit, all sectors must be captured',()=>{
 const w=new World({play(){}});w.start();w.enemies=[];w.update(.01,idle);assert.equal(w.exitOpen,false);
 for(const z of w.stage.zones){Object.assign(w.player,z);w.update(.8,idle);}assert.equal(w.sectorIndex,3);assert.equal(w.exitOpen,true);
 Object.assign(w.player,w.stage.exit);w.update(.01,idle);assert.equal(w.wave,2);assert.equal(w.completedStages.length,1);assert.equal(w.completedStages[0].stage,1);
});
