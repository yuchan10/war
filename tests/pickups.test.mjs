import test from 'node:test';
import assert from 'node:assert/strict';
import {Pickups} from '../src/pickups.js';
import {World} from '../src/world.js';
import {CONFIG} from '../src/config.js';
test('25 percent boundary and full health preserve an unconsumed medical pack',()=>{
 const p=new Pickups(),e={x:300,y:300,angle:0};p.drop(e,[],()=>.25);assert.equal(p.items.length,0);
 p.drop(e,[],()=>.249);assert.equal(p.items.length,1);
 const player={...p.items[0],hp:100,maxHp:100};assert.equal(p.collect(player,[]),0);assert.equal(p.items.length,1);
 player.hp=60;assert.equal(p.collect(player,[]),25);assert.equal(player.hp,85);assert.equal(p.items.length,0);
});
test('healing caps at max HP and cannot be collected through cover or after death',()=>{
 const p=new Pickups();p.items=[{x:110,y:100}];const player={x:90,y:100,hp:90,maxHp:100};
 assert.equal(p.collect(player,[{x:98,y:80,w:4,h:40}]),0);
 assert.equal(p.collect(player,[]),10);assert.equal(player.hp,100);
 p.items=[{x:90,y:100}];player.hp=0;assert.equal(p.collect(player,[]),0);assert.equal(p.items.length,1);
});
test('actual kill rolls one drop, and stage changes and restart clear pickups',()=>{
 const w=new World({play(){}},()=>0);w.start();w.walls=[];w.enemies=[];
 w.spawnEnemy('assault',300,360);w.enemies[0].born=0;
 const input={mouse:{x:900,y:360,down:false},movement:()=>({x:0,y:0})};
 w.shoot(285,360,0,false,30,1550);w.update(CONFIG.step,input);assert.equal(w.pickups.items.length,1);
 w.update(CONFIG.step,input);assert.equal(w.pickups.items.length,1);
 w.nextStage();assert.equal(w.pickups.items.length,0);
 w.pickups.drop(w.player,[],()=>0);w.start();assert.equal(w.pickups.items.length,0);
});
