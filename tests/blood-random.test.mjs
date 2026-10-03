import test from 'node:test';
import assert from 'node:assert/strict';
import {Effects} from '../src/effects.js';
test('gunshot blood samples varied trajectories and stains once at impact',()=>{
 let seed=42,calls=0;const random=()=>{calls++;seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const fx=new Effects(random);fx.impact(300,300,.2);
 const drops=fx.items.items.filter(e=>e.active&&e.kind==='blood');
 assert.ok(drops.length>=12&&drops.length<=18);
 for(const key of ['angle','size','speed','duration'])assert.ok(new Set(drops.map(e=>e[key])).size>3);
 const before=fx.blood.marks.map(m=>({...m})),count=calls;fx.update(.01);
 assert.equal(calls,count);assert.ok(drops.every(e=>Number.isFinite(e.x)&&Number.isFinite(e.y)));
 assert.deepEqual(fx.blood.marks.map(m=>[m.x,m.y,m.size]),before.map(m=>[m.x,m.y,m.size]));
 fx.impact(300,300,.2);assert.notDeepEqual(fx.blood.marks.slice(before.length).map(m=>[m.x,m.y,m.size]),before.map(m=>[m.x,m.y,m.size]));
});
test('reused blood particle resets its speed for small hood splashes',()=>{
 const fx=new Effects(()=>.5);fx.impact(300,300);fx.update(1);fx.hoodImpact(300,300);
 assert.ok(fx.items.items.filter(e=>e.active&&e.kind==='blood').every(e=>e.speed===95));
});

test('ground blood grows gradually instead of appearing at full size',()=>{
 const fx=new Effects(()=>.5);fx.impact(300,300);const mark=fx.blood.marks[0];
 assert.equal(mark.spread,.08);fx.update(.3);assert.ok(mark.spread>.08&&mark.spread<.5);
 fx.update(.3);assert.ok(mark.spread>.5&&mark.spread<1);fx.update(.5);assert.equal(mark.spread,1);
});

test('fresh drops do not make an existing blood pool disappear again',()=>{
 const fx=new Effects();fx.blood.drip(300,300,3,0);fx.update(1);const pool=fx.blood.marks[0];
 fx.blood.drip(300,300,3,0);assert.equal(pool.reveal,1);assert.equal(pool.spread,1);
});
