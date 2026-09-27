import test from 'node:test';
import assert from 'node:assert/strict';
import {applyInjury} from '../src/injury.js';
import {updateEnemyFire} from '../src/enemy-fire.js';
import {updateCoverDefender} from '../src/cover-ai.js';
import {World} from '../src/world.js';
import {CONFIG} from '../src/config.js';
const input={mouse:{x:900,y:360,down:false},movement:()=>({x:0,y:0})};
test('headshots deal a fixed 120 damage rather than unconditional death',()=>{
  for(const hp of [100,120,200]){
    const enemy={hp};const hit=applyInjury(enemy,30,()=>0);
    assert.equal(hit.damage,120);assert.equal(enemy.hp,Math.max(0,hp-120));
    assert.equal(!!enemy.headDestroyed,hp<=120);
  }
});
test('body rolls determine damage and permanent disabilities',()=>{
  for(const [roll,part,hp] of [[0,'head',0],[.1,'torso',60],[.59,'torso',60],[.61,'arm',80],[.81,'leg',80]]){
    const e={hp:100};const result=applyInjury(e,30,()=>roll);
    assert.equal(result.part,part);assert.equal(e.hp,hp);
    assert.equal(!!e.armsDisabled,part==='arm');assert.equal(!!e.legsDisabled,part==='leg');
  }
  const e={hp:100};applyInjury(e,30,()=>.3);applyInjury(e,30,()=>.3);assert.equal(e.hp,20);
  assert.ok(applyInjury(e,30,()=>.3).killed);
});
test('arm injury cancels an active burst and blocks all future fire',()=>{
  const e={hp:100,x:0,y:0,aimRemaining:.1,burstLeft:2,burstTimer:0,timer:-1};let shots=0;
  applyInjury(e,30,()=>.7);
  for(let i=0;i<100;i++)updateEnemyFire(e,.1,{x:100,y:0},()=>shots++);
  assert.equal(shots,0);assert.equal(e.burstLeft,0);assert.equal(e.aimRemaining,0);
});
test('leg injury leaves a defender stationary but able to return fire',()=>{
  const e={hp:100,x:600,y:360,angle:Math.PI,legsDisabled:true,aimDuration:.1,burstCount:1,damage:22,bulletSpeed:1050,fireInterval:1,timer:0};let shots=0;
  for(let i=0;i<10;i++){
    const motion=updateCoverDefender(e,.1,{x:300,y:360},[],()=>shots++);
    assert.deepEqual(motion,{x:0,y:0});
  }
  assert.ok(shots>0);
});
test('real projectile collision applies injury and headshot kill only once',()=>{
  const w=new World({play(){}},()=>0);w.start();w.walls=[];w.enemies=[];
  w.spawnEnemy('assault',300,360);const e=w.enemies[0];e.born=0;
  w.shoot(285,360,0,false,30,1550);w.update(CONFIG.step,input);
  assert.equal(e.lastHitPart,'head');assert.equal(w.kills,1);assert.equal(w.enemies.length,0);
  w.update(CONFIG.step,input);assert.equal(w.kills,1);
});
test('leg-disabled assault crawls slowly and reset creates healthy enemies',()=>{
  const w=new World({play(){}},()=>.85);w.start();w.walls=[];w.enemies=[];
  w.spawnEnemy('assault',800,360);const e=w.enemies[0];e.born=0;e.courage='cautious';e.angle=0;applyInjury(e,30,()=>.85);
  w.walls=[{x:690,y:400,w:80,h:40}];e.lastContact={x:700,y:250};
  for(let i=0;i<100;i++)w.update(CONFIG.step,input);
  assert.ok(Math.hypot(e.x-800,e.y-360)>0&&Math.hypot(e.x-800,e.y-360)<20);assert.equal(e.walking,false);assert.ok(e.crawling);
  w.start();assert.ok(w.enemies.every(e=>!e.legsDisabled&&!e.armsDisabled&&e.hp===e.maxHp));
});

