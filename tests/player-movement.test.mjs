import test from 'node:test';
import assert from 'node:assert/strict';
import {playerMoveSpeed} from '../src/player-movement.js';
import {World} from '../src/world.js';
import {CONFIG} from '../src/config.js';
test('firing and reload movement modifiers have priority and recover when complete',()=>{
 const p={shotTimer:0},gun={ammo:12,reloading:false};
 assert.equal(playerMoveSpeed(p,gun,false),126);assert.equal(playerMoveSpeed(p,gun,true),81.9);
 p.shotTimer=.1;assert.equal(playerMoveSpeed(p,gun,false),81.9);
 gun.reloading=true;assert.ok(Math.abs(playerMoveSpeed(p,gun,true)-69.3)<1e-8);
 gun.reloading=false;p.shotTimer=0;assert.equal(playerMoveSpeed(p,gun,false),126);
 p.unarmed=true;gun.reloading=true;assert.equal(playerMoveSpeed(p,gun,true),126);
});
test('first firing frame and manual reload immediately reduce actual movement and tracked velocity',()=>{
 const w=new World({play(){}});w.start();w.enemies=[];w.walls=[];
 const input={mouse:{x:900,y:360,down:true},movement:()=>({x:1,y:0})};
 const before=w.player.x;w.update(CONFIG.step,input);
 assert.ok(Math.abs(w.player.x-before-81.9*CONFIG.step)<1e-8);assert.equal(w.player.vx,81.9);
 const x=w.player.x;w.update(CONFIG.step,{...input,consumeReload:()=>true});
 assert.ok(Math.abs(w.player.x-x-69.3*CONFIG.step)<1e-8);
});
