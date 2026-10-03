import test from 'node:test';
import assert from 'node:assert/strict';
import { BloodTrails } from '../src/blood-trails.js';
import { Effects } from '../src/effects.js';
import { injuryMoveScale } from '../src/injury.js';
import { World } from '../src/world.js';

test('hit stains survive particles and reset with the stage',()=>{
  const fx=new Effects();fx.impact(300,300,0);const count=fx.blood.marks.length;
  assert.ok(count>0);fx.update(30);assert.equal(fx.blood.marks.length,count);
  fx.clear();assert.equal(fx.blood.marks.length,0);
  const w=new World({play(){}});w.start();w.player.body.torso.armor=0;w.hurt(10,{vx:1,vy:0},{region:'torso'});
  w.player.invulnerable=0;w.hurt(10,{vx:1,vy:0},{region:'torso'});assert.ok(w.effects.blood.marks.length>0);
  w.nextStage();assert.equal(w.effects.blood.marks.length,0);
});

test('blood follows traveled distance independent of update rate and stops when stationary',()=>{
  for(const limb of ['missingArms','missingLegs']){
    const a=new BloodTrails(),b=new BloodTrails();
    const first={x:140,y:300,[limb]:[-1]},second={x:100,y:300,[limb]:[-1]};
    a.trail(first,100,300);
    for(let i=0;i<40;i++){const x=second.x;second.x++;b.trail(second,x,300);}
    assert.deepEqual(a.marks,b.marks);assert.equal(a.marks.length,5);
    a.trail(first,first.x,first.y);assert.equal(a.marks.length,5);
    a.trail({x:200,y:300},140,300);assert.equal(a.marks.length,5);
  }
});

test('splatter does not cross walls and history has a fixed limit',()=>{
  const blood=new BloodTrails(10),walls=[{x:310,y:250,w:10,h:100}];
  blood.splatter(300,300,0,walls);
  assert.ok(blood.marks.every(mark=>mark.x<310));
  for(let i=0;i<100;i++)blood.add(100+i,400,3,0);
  assert.equal(blood.marks.length,10);assert.ok(blood.marks.some(m=>m.x===199));
});

test('each missing arm removes 25 speed, without compounding across frames',()=>{
  for(const speed of [101.5,59.5])for(const count of [0,1,2]){
    const e={speed,missingArms:[-1,1].slice(0,count)};
    for(let frame=0;frame<3;frame++)assert.ok(Math.abs(speed*injuryMoveScale(e)-(speed-count*25))<1e-8);
    assert.equal(e.speed,speed);
  }
  assert.equal(injuryMoveScale({speed:20,missingArms:[-1,1]}),0);
});

test('actual gunshot leaves terrain blood and a moving wounded enemy leaves a trail',()=>{
  const w=new World({play(){}},()=>.25);w.start();w.walls=[];w.enemies=[];
  w.spawnEnemy('assault',600,360);const e=w.enemies[0];e.born=0;e.body.torso.armor=0;e.speed=0;e.timer=100;
  const idle={mouse:{x:900,y:360,down:false},movement:()=>({x:0,y:0})};
  w.shoot(580,360,0,false,30,1550);w.update(1/120,idle);
  assert.equal(e.body.torso.damage,30);const count=w.effects.blood.marks.length;assert.ok(count>0);
  for(let i=0;i<120;i++)w.update(1/120,idle);
  assert.ok(w.effects.blood.marks.length>count);
});

test('bleeding drops land before pooling, spread, darken and stay finite beside cover',()=>{
 const fx=new Effects(),e={x:300,y:300,angle:0},walls=[{x:320,y:270,w:30,h:80}];
 fx.bleed(e,'torso',5,walls);assert.equal(fx.blood.marks.length,0);
 for(let i=0;i<30;i++)fx.update(.01,walls);
 assert.equal(fx.blood.marks.length,1);const mark=fx.blood.marks[0];assert.ok(Number.isFinite(mark.x)&&Number.isFinite(mark.y));
 const size=mark.size;fx.bleed(e,'torso',5,walls);for(let i=0;i<30;i++)fx.update(.01,walls);
 assert.equal(fx.blood.marks.length,1);assert.ok(mark.size>size);
 fx.update(45,walls);assert.equal(mark.spread,1);assert.ok(mark.age>=45);assert.equal(fx.blood.marks.length,1);
});
