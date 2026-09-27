import test from 'node:test';
import assert from 'node:assert/strict';
import { visiblePoint,visionPolygon } from '../src/visibility.js';
const p={x:300,y:350,angle:0};
test('rear targets remain hidden without a near-vision exemption',()=>{
  assert.equal(visiblePoint(p,{x:800,y:350},[]),true);
  assert.equal(visiblePoint(p,{x:100,y:350},[]),false);
  assert.equal(visiblePoint(p,{x:290,y:350},[]),false);
  assert.equal(visiblePoint(p,{x:1000,y:350},[]),true);
});
test('solid cover hides enemies even in the near vision circle',()=>{
  const walls=[{x:340,y:290,w:30,h:120}];
  assert.equal(visiblePoint(p,{x:400,y:350},walls),false);
  assert.equal(visiblePoint(p,{x:400,y:150},walls),true);
  assert.equal(visiblePoint(p,{x:500,y:260},[]),true);
});
test('turning aim changes visible targets',()=>{
  assert.equal(visiblePoint({...p,angle:Math.PI},{x:550,y:350},[]),false);
  assert.equal(visiblePoint({...p,angle:Math.PI},{x:60,y:350},[]),true);
});
test('light polygon stops at the face of cover',()=>{
  const points=visionPolygon(p,[{x:500,y:200,w:30,h:300}]);
  const forward=points.find(q=>Math.abs(q.y-350)<1e-6&&q.x>p.x);
  assert.ok(forward);assert.ok(Math.abs(forward.x-500)<1e-6);
  assert.ok(points.every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)));
});
