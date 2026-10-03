import { STAGES } from '../src/stages.js';
import test from'node:test';
import assert from'node:assert/strict';
import {
  World
}from'../src/world.js';
import {
  Pool,segmentHits,SpatialHash
}from'../src/core.js';
import {
  CONFIG
}from'../src/config.js';
const audio= {
  play() {
  }
};
const idle= {
  mouse: {
    x:900,y:360,down:false
  },movement:()=>( {
    x:0,y:0
  }),consumeDash:()=>false
};
test('touching a soldier causes no damage, but a close bullet still hits',()=>{
  for(const type of ['assault','shooter']){
    const w=new World(audio);w.start();w.walls=[];w.enemies=[];
    Object.assign(w.player,{x:300,y:300,invulnerable:0});
    w.spawnEnemy(type,310,300);
    Object.assign(w.enemies[0],{born:0,timer:100,speed:0});
    for(let i=0;i<60;i++)w.update(CONFIG.step,idle);
    assert.equal(w.player.wasHit,undefined,`${type} must not deal contact damage`);
    w.shoot(310,300,Math.PI,true,22,1000);
    w.update(CONFIG.step,idle);
    assert.equal(w.player.wasHit,true,`${type} close-range bullets still deal damage`);
  }
});
test('swept collision catches a bullet crossing a small target',()=> {
  assert.equal(segmentHits(0,0,100,0,50,0,2),true);assert.equal(segmentHits(0,0,100,0,50,10,2),false);
});
test('pool reuses inactive objects and enforces cap',()=> {
  const p=new Pool(1),a=p.spawn( {
    x:1
  });assert.equal(p.spawn( {
    x:2
  }),null);a.active=false;assert.equal(p.spawn( {
    x:3
  }),a);assert.equal(a.x,3);
});
test('spatial hash returns large enemies across cell boundaries',()=> {
  const s=new SpatialHash(80),e= {
    x:80,y:80,radius:46
  };s.insert(e);assert.ok(s.query(35,80,4).has(e));
});
test('movement stays inside arena and armor absorbs rapid hits',()=> {
  const w=new World(audio);w.start();w.player.invulnerable=0;w.hurt(10,null,{region:'torso'});w.hurt(10,null,{region:'torso'});assert.equal(w.player.body.torso.armor,66.5);for(let i=0;i<300;i++)w.update(CONFIG.step, {
    ...idle,movement:()=>( {
      x:-1,y:0
    })
  });assert.ok(w.player.x>=CONFIG.arena.left+w.player.radius);
});
test('stage waits for exit and all enemies before advancing',()=> {
  const w=new World(audio);w.start();assert.equal(w.enemies.length,w.stage.enemies.length);
  Object.assign(w.player,w.stage.exit);w.update(CONFIG.step,idle);assert.equal(w.wave,1);
  w.player.x=150;w.enemies=[];
  for(let i=0;i<260;i++)w.update(CONFIG.step,idle);
  assert.equal(w.wave,1);assert.equal(w.exitOpen,true);
  const damage=w.player.damage;w.player.bloodLoss=50;w.weapon.consume();
  Object.assign(w.player,w.stage.exit);w.update(CONFIG.step,idle);
  assert.equal(w.wave,2);assert.equal(w.player.damage,damage);
  assert.equal(w.player.bloodLoss,50);assert.equal(w.weapon.ammo,11);
});
test('six fixed stages finish at final exit without upgrades',()=>{
  const w=new World(audio);w.start();
  for(let i=1;i<=STAGES.length;i++){w.enemies=[];Object.assign(w.player,w.stage.exit);w.update(CONFIG.step,idle);}
  assert.equal(w.state,'won');
});
test('pause does not simulate and reset removes previous run objects',()=> {
  const w=new World(audio);w.start();w.state='paused';w.update(1,idle);assert.equal(w.time,0);w.spawnEnemy('assault');w.start();assert.equal(w.enemies.length,w.stage.enemies.length);assert.equal(w.wave,1);assert.equal(w.player.dead,false);
});
