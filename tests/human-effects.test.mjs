import test from 'node:test';
import assert from 'node:assert/strict';
import { Effects } from '../src/effects.js';
import { CONFIG, ENEMIES } from '../src/config.js';
import { traceBullet } from '../src/arena.js';
test('infantry hit produces small impact effects and a fallen body instead of an explosion',()=>{
  const fx=new Effects();fx.impact(100,100,0);fx.fallen({x:100,y:100,angle:0});
  assert.equal(fx.items.items.some(e=>e.kind==='ring'),false);
  assert.equal(fx.items.items.filter(e=>e.kind==='body').length,1);
  fx.update(.5);assert.equal(fx.items.items.find(e=>e.kind==='body').active,true);
  fx.clear();assert.equal(fx.items.items.some(e=>e.active),false);
});
test('faster bullets still stop at thin cover without tunnelling',()=>{
  assert.ok(CONFIG.weapon.speed>900);assert.ok(ENEMIES.shooter.bulletSpeed>520);
  for(const speed of [CONFIG.weapon.speed,ENEMIES.shooter.bulletSpeed]){
    const b={x:300,y:350,vx:speed,vy:0,radius:4,active:true};
    traceBullet(b,.2,[{x:340,y:250,w:10,h:200}]);
    assert.equal(b.active,false);assert.equal(b.x,336);
  }
});
