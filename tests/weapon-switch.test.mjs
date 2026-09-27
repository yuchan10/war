import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/world.js';
import { Input } from '../src/input.js';
import { playerMoveSpeed } from '../src/player-movement.js';
const idle={mouse:{x:500,y:300,down:false},movement:()=>({x:0,y:0})};
const swap={...idle,consumeWeaponSwitch:()=>true};

test('wheel changes weapon once per gesture and clear discards queued changes',t=>{
  const oldWindow=globalThis.window,events={};
  globalThis.window={addEventListener(){}};t.after(()=>globalThis.window=oldWindow);
  const input=new Input({addEventListener(name,fn){events[name]=fn;}},()=>{},()=>{});
  let prevented=0;
  const event={deltaY:100,timeStamp:1000,preventDefault(){prevented++;}};
  events.wheel(event);assert.equal(input.consumeWeaponSwitch(),true);
  events.wheel({...event,timeStamp:1010});assert.equal(input.consumeWeaponSwitch(),false);
  events.wheel({...event,deltaY:-100,timeStamp:1250});assert.equal(input.consumeWeaponSwitch(),true);
  events.wheel({...event,timeStamp:1500});input.clear();assert.equal(input.consumeWeaponSwitch(),false);
  assert.equal(prevented,4);
});

test('knife movement is faster, cancels reload and preserves rifle ammunition on swap',()=>{
  const w=new World({play(){}});w.start();w.walls=[];
  w.weapon.ammo=5;w.weapon.reload();
  const before=w.player.x;
  w.update(.01,{...swap,movement:()=>({x:1,y:0})});
  assert.equal(w.player.knifeEquipped,true);assert.equal(w.player.unarmed,true);
  assert.equal(w.weapon.reloading,false);assert.equal(w.weapon.ammo,5);
  assert.ok(Math.abs(w.player.x-before-1.575)<1e-8);
  assert.equal(playerMoveSpeed(w.player,w.weapon,true),157.5);
  w.update(.01,swap);assert.equal(w.player.knifeEquipped,false);
  assert.equal(w.player.unarmed,false);assert.equal(w.weapon.ammo,5);
  assert.equal(playerMoveSpeed(w.player,w.weapon,false),126);
});

test('normal combat knife kills once without shooting and rifle still fires after switching back',()=>{
  const w=new World({play(){}});w.start();w.walls=[];w.enemies=[];
  Object.assign(w.player,{x:300,y:300});w.spawnEnemy('assault',340,300);
  Object.assign(w.enemies[0],{born:0,speed:0,timer:10});
  w.update(.01,swap);
  const attack={...idle,mouse:{...idle.mouse,down:true}};
  for(let i=0;i<20;i++)w.update(.01,attack);
  assert.equal(w.kills,1);assert.equal(w.weapon.ammo,12);
  assert.equal(w.effects.items.items.filter(e=>e.kind==='droppedHead').length,1);
  w.update(.01,swap);w.update(.01,attack);assert.equal(w.weapon.ammo,11);
});

test('prologue cannot equip a rifle before acquisition; stage transitions preserve selected knife',()=>{
  const w=new World({play(){}});w.startPrologue();w.update(.01,swap);
  assert.equal(w.player.hasRifle,false);assert.equal(w.player.knifeEquipped,true);
  w.prologue.beginRevenge(w,idle);w.update(.01,swap);
  assert.equal(w.player.hasRifle,true);assert.equal(w.player.knifeEquipped,true);
  w.nextStage();assert.equal(w.player.knifeEquipped,true);
  w.start();assert.equal(w.player.knifeEquipped,false);
});
