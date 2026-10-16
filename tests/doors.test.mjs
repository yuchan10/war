import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {nearbyDoor,interactDoor,updateDoors} from '../src/doors.js';
import {hasLineOfSight,moveBody,traceBullet} from '../src/arena.js';
const scene=()=>{const w=new World({play(){}},()=>.5);w.start();return w;};
test('closed door blocks walking, sight and bullets; E opens passage',()=>{
 const w=scene(),d=w.doors[0],p=w.player;Object.assign(p,{x:d.x-25,y:d.y+d.h/2});const target={x:d.x+d.w+30,y:p.y};
 assert.equal(nearbyDoor(w),d);assert.equal(hasLineOfSight(p,target,w.walls),false);
 const body={...p};moveBody(body,100,0,w.walls);assert.ok(body.x<=d.x-body.radius);
 const bullet={x:p.x,y:p.y,vx:1000,vy:0,radius:2,active:true};traceBullet(bullet,.15,w.walls);assert.equal(bullet.active,false);
 w.update(.01,{mouse:{x:target.x,y:target.y,down:false},movement:()=>({x:0,y:0}),consumeLoot:()=>true});
 assert.ok(d.open);assert.ok(!w.walls.includes(d));assert.equal(hasLineOfSight(p,target,w.walls),true);moveBody(p,80,0,w.walls);assert.ok(p.x>d.x+d.w);
 updateDoors(w,.3);assert.equal(d.slide,1);
});
test('door cannot close on an actor; reset restores closed doors without mutating level data',()=>{
 const w=scene(),d=w.doors[0];Object.assign(w.player,{x:d.x-20,y:d.y+40});interactDoor(w);w.player.x=d.x+20;
 assert.ok(interactDoor(w));assert.ok(d.open);w.player.x=d.x-20;interactDoor(w);assert.equal(d.open,false);assert.ok(w.walls.includes(d));
 interactDoor(w);w.start();assert.ok(w.doors.every(d=>!d.open));assert.ok(w.stage.doors.every(d=>d.open===undefined));
});
test('door sound alerts nearby enemy and E prioritizes door over loot',()=>{
 const w=scene(),d=w.doors[0];w.enemies=[];Object.assign(w.player,{x:d.x-20,y:d.y+40});w.spawnEnemy('assault',d.x+d.w+35,d.y+40);const e=w.enemies[0];
 let looted=false;w.pickups.collectAmmo=()=>{looted=true;};w.update(.01,{mouse:{x:600,y:500,down:false},movement:()=>({x:0,y:0}),consumeLoot:()=>true,lootHeld:()=>true});
 assert.equal(looted,false);assert.equal(e.heardType,'door');assert.ok(d.open);
});
