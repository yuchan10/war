import test from 'node:test';
import assert from 'node:assert/strict';
import {hearGrenadeLanding,updateGrenadeAvoidance} from '../src/grenade-ai.js';
import {createGrenade,updateGrenades,grenadeCountdown,blastGroundRadius} from '../src/grenade.js';
import {World} from '../src/world.js';
const enemy=()=>({x:400,y:300,angle:0,radius:17,speed:100,active:true,born:0});
const grenade=()=>({x:450,y:300,height:0,active:true,held:false});
test('visible grenade causes hesitation, retreat, then return to tactics after explosion',()=>{
 const e=enemy(),g=grenade();
 assert.deepEqual(updateGrenadeAvoidance(e,[g],[],.1),{x:0,y:0});assert.equal(e.aiState,'grenade-startle');
 for(let i=0;i<3;i++)updateGrenadeAvoidance(e,[g],[],.1);
 const motion=updateGrenadeAvoidance(e,[g],[],.1);assert.ok(motion.x<0);assert.equal(e.aiState,'grenade-flee');
 g.active=false;assert.equal(updateGrenadeAvoidance(e,[],[],.1),null);
});
test('rear landing sound turns the enemy before visual confirmation; cover prevents identification',()=>{
 const e=enemy(),g={...grenade(),x:350};assert.equal(updateGrenadeAvoidance(e,[g],[],.1),null);
 hearGrenadeLanding([e],g,[]);updateGrenadeAvoidance(e,[g],[],.1);assert.equal(e.aiState,'grenade-investigate');assert.ok(e.angle!==0);assert.equal(e.grenadeThreat,undefined);
 for(let i=0;i<10;i++)updateGrenadeAvoidance(e,[g],[],.1);assert.equal(e.grenadeThreat,g);
 const hidden=enemy(),walls=[{x:420,y:250,w:10,h:100}];hearGrenadeLanding([hidden],grenade(),walls);
 for(let i=0;i<15;i++)updateGrenadeAvoidance(hidden,[grenade()],walls,.1);
 assert.equal(hidden.grenadeThreat,undefined);assert.equal(hidden.grenadeSound,null);
});
test('landing occurs once and an early airborne explosion never makes a landing sound',()=>{
 for(const fuse of [3,.2]){
  const g=createGrenade({x:100,y:300,angle:0},{x:460,y:300});g.fuse=fuse;let landed=0,exploded=0;
  for(let i=0;i<400;i++)updateGrenades([g],.01,[],()=>exploded++,()=>landed++);
  assert.equal(landed,fuse===3?1:0);assert.equal(exploded,1);
 }
});
test('cooked airborne explosion damages its actual location, not the intended landing point',()=>{
 for(const dt of [1/30,1/60,1/120]){
  const w=new World({play(){}},()=>.5);w.start();w.walls=[];w.enemies=[];w.player.x=100;w.player.y=100;
  for(const x of [220,460]){w.spawnEnemy('assault',x,300);w.enemies.at(-1).born=0;}
  const [near,landing]=w.enemies,g=createGrenade({x:100,y:300,angle:0},{x:460,y:300});g.fuse=.3;
  for(let i=0;i<60;i++)updateGrenades([g],dt,[],g=>w.explodeGrenade(g));
  assert.ok(Math.abs(g.x-220)<1e-8);assert.ok(g.height>80);assert.ok(near.wasHit);assert.equal(landing.wasHit,undefined);
  const fx=w.effects.items.items.find(e=>e.kind==='explosion');assert.equal(fx.height,g.height);assert.equal(fx.size,blastGroundRadius(g.height));
 }
});
test('live fuse display never rounds down to zero before explosion',()=>{
 assert.equal(grenadeCountdown(.001),'0.1초');assert.equal(grenadeCountdown(1.01),'1.1초');assert.equal(grenadeCountdown(0),'0.0초');
});
