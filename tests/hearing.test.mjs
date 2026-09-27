import test from 'node:test';
import assert from 'node:assert/strict';
import { hearSound,HEARING } from '../src/hearing.js';
import { updateContact } from '../src/contact-memory.js';
import { World } from '../src/world.js';

test('gunshots reach farther than footsteps regardless of facing, with wall attenuation',()=>{
  const near={x:400,y:300,angle:0},far={x:700,y:300,angle:0},source={x:300,y:300};
  hearSound([near,far],source,'footstep');assert.deepEqual(near.heardPosition,source);assert.equal(far.heardPosition,undefined);
  hearSound([far],source,'gunshot');assert.deepEqual(far.heardPosition,source);
  near.heardPosition=null;
  hearSound([near],source,'footstep',[{x:345,y:250,w:10,h:100}]);assert.equal(near.heardPosition,null);
});

test('sound is a snapshot, overrides older sightings, expires, and yields to fresh sight',()=>{
  const e={x:500,y:300,angle:0,lastContact:{x:800,y:300},contactAge:0},p={x:400,y:300};
  hearSound([e],p,'footstep');p.x=350;
  let contact=updateContact(e,p,[],.01);assert.equal(contact.visible,false);assert.equal(contact.target.x,400);
  e.angle=Math.PI;contact=updateContact(e,p,[],.01);assert.equal(contact.target.x,350);assert.equal(e.heardPosition,null);
  e.angle=0;hearSound([e],{x:380,y:300},'footstep');
  contact=updateContact(e,p,[],HEARING.memory+1);assert.equal(e.heardPosition,null);assert.equal(contact.target.x,350);
});

test('actual player footsteps alert nearby soldiers even with silent audio and do not emit at rest',()=>{
  const w=new World({play(){}});w.start();w.walls=[];w.enemies=[];
  Object.assign(w.player,{x:300,y:300,stepDistance:57.5});
  w.spawnEnemy('assault',400,300);const e=w.enemies[0];e.angle=0;
  const input={mouse:{x:600,y:300,down:false},movement:()=>({x:0,y:0})};
  w.update(.01,input);assert.equal(e.heardPosition,undefined);
  w.update(.01,{...input,movement:()=>({x:1,y:0})});assert.ok(e.heardPosition);
  const remembered={...e.heardPosition};w.player.x=600;assert.deepEqual(e.heardPosition,remembered);
});

test('opening scout investigates a sound outside its narrow visual cone',()=>{
  const w=new World({play(){}});w.startPrologue();w.prologue.phase='search';w.walls=[];
  const g=w.prologue.guards[0];w.prologue.guards=[g];Object.assign(g,{x:500,y:300,angle:0});
  Object.assign(w.player,{x:400,y:300});w.emitPlayerSound('footstep');
  w.update(.01,{mouse:{x:500,y:300,down:false},movement:()=>({x:0,y:0})});
  assert.ok(g.x<500);assert.equal(g.lastContact.x,400);
});
