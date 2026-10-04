import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {CONFIG} from '../src/config.js';
import {Input} from '../src/input.js';
import {createGrenade,updateGrenades,blastDamage} from '../src/grenade.js';
const idle={mouse:{x:600,y:300,down:false},movement:()=>({x:0,y:0})};
test('grenade flies to aim point within range, waits for fuse and detonates only once',()=>{
 for(const dt of [1/30,1/60,1/120]){
  const g=createGrenade({x:100,y:300,angle:0},{x:600,y:300});let hits=0;
  for(let i=0;i<Math.round(1/dt);i++)updateGrenades([g],dt,[],()=>hits++);
  assert.ok(Math.abs(g.x-460)<1e-8);assert.equal(hits,0);
  for(let i=0;i<Math.round(.3/dt);i++)updateGrenades([g],dt,[],()=>hits++);
  assert.equal(hits,1);assert.equal(g.active,false);
 }
});
test('walls stop thrown grenades but their fuses continue',()=>{
 const g=createGrenade({x:100,y:300,angle:0},{x:600,y:300});let hits=0;
 updateGrenades([g],1,[{x:200,y:250,w:3,h:100}],()=>hits++);
 assert.ok(g.x<=196);assert.equal(g.remainingRange,0);assert.equal(g.active,true);
 updateGrenades([g],.3,[],()=>hits++);assert.equal(hits,1);
});
test('blast falls off with distance and cannot cross cover',()=>{
 const g={x:300,y:300};assert.equal(blastDamage(g,g,[]),CONFIG.grenade.damage);
 assert.ok(blastDamage(g,{x:330,y:300},[])>blastDamage(g,{x:390,y:300},[]));
 assert.equal(blastDamage(g,{x:420,y:300},[]),0);
 assert.equal(blastDamage(g,{x:350,y:300},[{x:320,y:280,w:5,h:40}]),0);
});
test('grenades consume a limited supply, reject invalid throws and refill at the next stage',()=>{
 const w=new World({play(){}},()=>.5);w.start();
 assert.ok(w.throwGrenade(idle.mouse));assert.equal(w.grenadeAmmo,2);assert.equal(w.throwGrenade(idle.mouse),false);
 for(let i=0;i<2;i++){w.grenadeCooldown=0;assert.ok(w.throwGrenade(idle.mouse));}
 w.grenadeCooldown=0;assert.equal(w.throwGrenade(idle.mouse),false);
 w.nextStage();assert.equal(w.grenadeAmmo,3);assert.equal(w.grenades.length,0);
 w.player.armsDisabled=true;assert.equal(w.throwGrenade(idle.mouse),false);
 w.startPrologue();assert.equal(w.throwGrenade(idle.mouse),false);
});
test('G input in normal combat throws once and a grenade detonates through the game update loop',()=>{
 const w=new World({play(){}},()=>.5);w.start();w.walls=[];w.enemies=[];Object.assign(w.player,{x:100,y:300});
 w.spawnEnemy('assault',700,600);Object.assign(w.enemies[0],{born:100,timer:100,speed:0});
 let pending=true;
 const input={...idle,mouse:{x:350,y:300,down:false},consumeGrenade(){const value=pending;pending=false;return value;}};
 w.update(.01,input);assert.equal(w.grenadeAmmo,2);assert.equal(w.grenades.length,1);
 for(let i=0;i<125;i++)w.update(.01,input);
 assert.equal(w.grenades.length,0);assert.equal(w.grenadeAmmo,2);
 assert.ok(w.effects.items.items.some(e=>e.kind==='explosion'));
});
test('blast damages multiple enemies, respects armor and can kill the thrower',()=>{
 const w=new World({play(){}},()=>.5);w.start();w.walls=[];w.enemies=[];Object.assign(w.player,{x:100,y:300});
 for(const x of [400,430,530]){w.spawnEnemy('assault',x,300);w.enemies.at(-1).born=0;}
 const [near,middle,far]=w.enemies;w.explodeGrenade({x:400,y:300});
 assert.equal(near.dead,true);assert.equal(middle.wasHit,true);assert.equal(far.wasHit,undefined);
 assert.equal(near.body.torso.armor,0);assert.equal(w.kills,1);
 w.explodeGrenade({x:100,y:300});assert.equal(w.player.dead,true);assert.equal(w.deathRemaining,.4);
});
test('pause freezes fuses and death continues visuals without further blast damage',()=>{
 const w=new World({play(){}},()=>.5);w.start();w.walls=[];w.enemies=[];
 w.throwGrenade({x:w.player.x+200,y:w.player.y});const g=w.grenades[0];
 w.state='settings';w.update(1,idle);assert.equal(g.fuse,1.2);
 w.state='playing';w.player.body.head.armor=0;w.hurt(1,null,{region:'head'});
 g.fuse=.01;const score=w.score;w.update(.4,idle);assert.equal(w.score,score);assert.equal(w.grenades.length,0);
});
test('G queues one throw per press, ignores repeat and clears on pause',t=>{
 const old=globalThis.window,events={};globalThis.window={addEventListener(name,fn){events[name]=fn;}};t.after(()=>globalThis.window=old);
 const input=new Input({addEventListener(){}},()=>{},()=>{});
 events.keydown({code:'KeyG',repeat:false});assert.equal(input.consumeGrenade(),true);assert.equal(input.consumeGrenade(),false);
 events.keydown({code:'KeyG',repeat:true});assert.equal(input.consumeGrenade(),false);
 events.keydown({code:'KeyG',repeat:false});input.clear();assert.equal(input.consumeGrenade(),false);
});
