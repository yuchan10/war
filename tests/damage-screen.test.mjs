import test from 'node:test';
import assert from 'node:assert/strict';
import {damageScreenState,drawDamageScreen} from '../src/damage-screen.js';
import {initBody,tickWounds} from '../src/injury.js';
import {World} from '../src/world.js';

const player=()=>{const p={x:300,y:300};initBody(p);return p;};
test('hit flashes fade, bleeding is stronger and persists until the final wound stops',()=>{
  const p=player();assert.equal(damageScreenState(p,0).opacity,0);
  p.hitFlash=.35;const flash=damageScreenState(p,0).opacity;assert.ok(flash>0);
  p.hitFlash=.1;assert.ok(damageScreenState(p,0).opacity<flash);p.hitFlash=0;
  Object.assign(p.body.torso,{bleedRemaining:2,bleedRate:4});
  Object.assign(p.body.leftArm,{bleedRemaining:5,bleedRate:7});
  assert.ok(damageScreenState(p,0).opacity>flash);
  tickWounds(p,2);assert.equal(damageScreenState(p,2).rate,7);
  tickWounds(p,2.9);assert.ok(damageScreenState(p,4.9).opacity>0);
  tickWounds(p,.2);assert.equal(damageScreenState(p,5.1).opacity,0);assert.ok(p.bloodLoss>0);
});
test('severity increases depth and strength, moves with time and position, and stays bounded',()=>{
  const p=player();Object.assign(p.body.torso,{bleedRemaining:5,bleedRate:4});
  const mild=damageScreenState(p,0);p.body.torso.bleedRate=18;p.bloodLoss=65;
  Object.assign(p.body.leftArm,{bleedRemaining:5,bleedRate:18});
  const severe=damageScreenState(p,0);assert.ok(severe.opacity>mild.opacity);assert.ok(severe.depth>mild.depth);
  assert.notEqual(damageScreenState(p,1).driftX,severe.driftX);p.x+=100;assert.notEqual(damageScreenState(p,0).driftX,severe.driftX);
  p.hitFlash=.35;
  for(let t=0;t<30;t+=.1){const s=damageScreenState(p,t);assert.ok(s.opacity<=.82&&s.opacity>=0);assert.ok(s.depth<.4);}
});
test('damage overlay uses balanced canvas transforms and stops drawing after bleeding',()=>{
  const p=player(),stops=[];let saves=0,fills=0;
  const c={save(){saves++;},restore(){saves--;},translate(){},scale(){},createRadialGradient(){return {addColorStop(n,color){stops.push([n,color]);}};},fillRect(){fills++;}};
  drawDamageScreen(c,p,0,1200,720);assert.equal(fills,0);
  p.body.torso.bleedRemaining=5;p.body.torso.bleedRate=10;
  drawDamageScreen(c,p,1,1200,720);assert.equal(saves,0);assert.ok(fills>1);assert.ok(stops.some(([n,color])=>n===0&&color.endsWith(',0)')));
});
test('player hit flash decays in both normal combat and the prologue and resets on restart',()=>{
  for(const intro of [false,true]){
    const w=new World({play(){}},()=>.5);intro?w.startPrologue():w.start();
    w.hurt(10,{vx:1,vy:0},{region:'torso'});assert.equal(w.player.hitFlash,.35);
    const input={mouse:{x:900,y:300,down:false},movement:()=>({x:0,y:0})};
    w.update(.01,input);assert.ok(w.player.hitFlash<.35);
    w.reset();assert.equal(damageScreenState(w.player,0).opacity,0);
  }
});
