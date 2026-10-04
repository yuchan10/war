import test from 'node:test';
import assert from 'node:assert/strict';
import { spatialSound } from '../src/audio.js';
import { Settings } from '../src/settings.js';
test('enemy gunfire pans to its source and remains audible at distance',()=>{
  assert.ok(spatialSound(-300,0).pan<0);assert.ok(spatialSound(300,0).pan>0);
  assert.ok(spatialSound(900,200).gain<spatialSound(100,0).gain);
  assert.ok(spatialSound(2000,0).gain>=.18);assert.ok(spatialSound(2000,0).pan<=.85);
});
test('camera shake defaults on independently of sound and atmosphere',()=>{
  const settings=new Settings();assert.equal(settings.values.cameraShake,true);
  assert.equal(settings.values.sound,true);assert.equal(settings.values.ambience,true);
  settings.set('ambience',false);assert.equal(settings.values.sound,true);
});
