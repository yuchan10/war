import test from 'node:test';
import assert from 'node:assert/strict';
import { Weapon } from '../src/weapon.js';
import { World } from '../src/world.js';
import { CONFIG } from '../src/config.js';

test('magazine has finite rounds and cannot fire during reload', () => {
  const gun = new Weapon();
  for(let i=0;i<gun.capacity;i++) assert.equal(gun.consume(),true);
  assert.equal(gun.consume(),false);
  assert.equal(gun.reload(),true);
  assert.equal(gun.consume(),false);
  gun.update(gun.reloadDuration/2);
  assert.equal(gun.reload(),false);
  assert.equal(gun.update(gun.reloadDuration/2),true);
  assert.equal(gun.ammo,gun.capacity);
});
test('full magazine cannot reload; partial reload fills magazine', () => {
  const gun=new Weapon();
  assert.equal(gun.reload(),false);
  gun.consume();gun.reload();gun.update(10);
  assert.equal(gun.ammo,gun.capacity);
});
test('empty magazine auto reloads, pause freezes it, restart resets it', () => {
  const w=new World({play(){}});w.start();w.spawnTimer=1000;
  const input={mouse:{x:900,y:360,down:true},movement:()=>({x:0,y:0}),consumeDash:()=>false};
  for(let i=0;i<600&&!w.weapon.reloading;i++)w.update(CONFIG.step,input);
  assert.equal(w.weapon.ammo,0);assert.equal(w.weapon.reloading,true);
  const remaining=w.weapon.reloadRemaining;
  w.state='paused';w.update(1,input);assert.equal(w.weapon.reloadRemaining,remaining);
  w.start();assert.equal(w.weapon.ammo,12);assert.equal(w.weapon.reloading,false);
});
test('manual reload blocks firing without consuming another round', () => {
  const w=new World({play(){}});w.start();w.weapon.consume();
  const input={mouse:{x:900,y:360,down:true},movement:()=>({x:0,y:0}),consumeDash:()=>false,consumeReload:()=>true};
  w.update(CONFIG.step,input);
  assert.equal(w.weapon.reloading,true);assert.equal(w.weapon.ammo,11);
assert.equal(w.bullets.items.length,0);
});
