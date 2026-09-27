import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { playGunshot,fetchRifleSamples } from '../src/gunshot-audio.js';

test('recorded gunshot retains its buffer and releases nodes after playback',()=>{
  const nodes=[];
  const node=()=>{const n={connect(){},disconnect(){this.disconnected=true;}};nodes.push(n);return n;};
  const source=Object.assign(node(),{start(t){this.begin=t;}});
  const c={currentTime:5,createBufferSource:()=>source,
    createBiquadFilter:()=>Object.assign(node(),{frequency:{},Q:{}}),
    createGain:()=>Object.assign(node(),{gain:{}})};
  const output=node(),buffer={duration:1.2};
  assert.equal(playGunshot(c,buffer,output,{gain:.4,distance:800}),true);
  assert.equal(source.buffer,buffer);assert.equal(source.begin,5);
  assert.ok(!output.disconnected);
  source.onended();assert.ok(nodes.every(n=>n.disconnected));
});
test('missing recording never falls back to synthetic noise',()=>{
  let disconnected=false;
  assert.equal(playGunshot({},null,{disconnect(){disconnected=true;}}),false);
  assert.ok(disconnected);
});
test('both shipped rifle files are playable PCM WAV assets and preload failures are surfaced',async()=>{
  const buffers=await fetchRifleSamples(async url=>({ok:true,arrayBuffer:async()=>readFile(url)}));
  for(const bytes of buffers){
    assert.equal(bytes.toString('ascii',0,4),'RIFF');
    assert.equal(bytes.toString('ascii',8,12),'WAVE');
    assert.ok(bytes.length>10000);
  }
  await assert.rejects(fetchRifleSamples(async()=>({ok:false})),/unavailable/);
});
