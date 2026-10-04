import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {Audio} from '../src/audio.js';
const input={mouse:{x:1100,y:500,down:true},movement:()=>({x:1,y:1}),consumeWeaponSwitch:()=>true};
test('death lasts 0.4 real seconds at quarter speed with no player input or repeat corpse',()=>{
 for(const intro of [false,true])for(const dt of [1/30,1/60,1/120]){
  const audioStates=[],w=new World({play(){},setDeathEffect(v){audioStates.push(v);}},()=>.5);
  intro?w.startPrologue():w.start();w.walls=[];
  w.shoot(100,100,0,false,30,100);const bullet=w.bullets.items[0];
  w.player.body.head.armor=0;w.hurt(1,null,{region:'head'});
  const time=w.time,x=w.player.x,y=w.player.y,angle=w.player.angle,ammo=w.weapon.ammo,corpse=w.playerCorpse;
  const bodies=w.effects.items.items.filter(e=>e.kind==='body').length;
  assert.equal(w.deathRemaining,.4);assert.equal(audioStates.at(-1),true);
  for(let i=0;i<Math.round(.4/dt);i++)w.update(dt,input);
  assert.equal(w.deathRemaining,0);assert.ok(Math.abs(w.time-time-.1)<1e-8);
  assert.ok(Math.abs(bullet.x-110)<1e-8);assert.ok(Math.abs(corpse.age-.1)<1e-8);
  assert.deepEqual([w.player.x,w.player.y,w.player.angle,w.weapon.ammo],[x,y,angle,ammo]);
  w.checkPlayerDeath();w.update(1,input);assert.equal(w.effects.items.items.filter(e=>e.kind==='body').length,bodies);
  assert.ok(Math.abs(w.time-time-.1)<1e-8);
  w.reset();assert.equal(w.playerCorpse,null);assert.equal(audioStates.at(-1),false);
 }
});
test('bleeding death starts the same sequence and settings pause it',()=>{
 const w=new World({play(){}},()=>.5);w.start();w.player.bloodLoss=100;w.updateWounds(w.player,.01);
 assert.equal(w.state,'dead');assert.equal(w.deathRemaining,.4);
 w.state='settings';w.update(1,input);assert.equal(w.deathRemaining,.4);
 w.state='dead';w.update(1,input);assert.equal(w.deathRemaining,0);
});
test('death audio smoothly filters and lowers the shared bus then restores it once',()=>{
 const changes=[];
 const a=Object.assign(Object.create(Audio.prototype),{deathEffect:false,context:{currentTime:3},deathFilter:{frequency:{setTargetAtTime(...v){changes.push(['filter',...v]);}}},deathGain:{gain:{setTargetAtTime(...v){changes.push(['gain',...v]);}}}});
 a.setDeathEffect(true);assert.deepEqual(changes,[['filter',650,3,.035],['gain',.28,3,.06]]);
 a.setDeathEffect(true);assert.equal(changes.length,2);
 a.setDeathEffect(false);assert.deepEqual(changes.slice(2),[['filter',22000,3,.08],['gain',1,3,.08]]);
 const silent=Object.assign(Object.create(Audio.prototype),{context:null,deathEffect:false});assert.doesNotThrow(()=>silent.setDeathEffect(true));
});
