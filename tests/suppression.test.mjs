import test from 'node:test';
import assert from 'node:assert/strict';
import { updateContact } from '../src/contact-memory.js';
import { updateCoverDefender } from '../src/cover-ai.js';
import { ENEMIES,CONFIG } from '../src/config.js';

test('memory preserves the last observed position without tracking hidden movement',()=>{
  const e={x:600,y:350},p={x:300,y:350,vx:0,vy:0};
  updateContact(e,p,[],.01);
  const walls=[{x:400,y:200,w:30,h:300}];
  let contact=updateContact(e,{x:200,y:270},walls,.1);
  assert.equal(contact.visible,false);assert.equal(contact.target.x,300);assert.equal(contact.target.y,350);
  contact=updateContact(e,{x:250,y:430},walls,.1);assert.equal(contact.target.y,350);
  assert.deepEqual(updateContact(e,p,walls,30).target,{x:300,y:350,vx:0,vy:0});
});
test('a defender with no prior sighting cannot suppress an unknown hidden player',()=>{
  const e={x:600,y:350};
  assert.equal(updateContact(e,{x:300,y:350},[{x:400,y:200,w:30,h:300}],.1).target,null);
});
test('defender fires at remembered cover position after sight is lost',()=>{
  const e={...ENEMIES.shooter,x:600,y:350,timer:0,flash:0,coverState:'peek',exposure:0,
    cover:{hide:{x:600,y:350},peek:{x:600,y:350},delay:1}};
  const p={x:300,y:350},shots=[];const fire=(...args)=>shots.push(args);
  updateCoverDefender(e,.01,p,[],fire);
  const walls=[{x:400,y:200,w:30,h:300}];
  for(let i=0;i<80;i++){e.timer-=.01;updateCoverDefender(e,.01,{x:200,y:270},walls,fire);}
  assert.ok(shots.length>0);assert.equal(e.suppressing,true);
  assert.ok(Math.abs(shots[0][2]-Math.PI)<.1);
  assert.equal(e.x,600);
});
