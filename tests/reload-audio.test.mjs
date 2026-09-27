import test from 'node:test';
import assert from 'node:assert/strict';
import { playReload } from '../src/reload-audio.js';
import { Audio } from '../src/audio.js';
import { World } from '../src/world.js';

test('mechanical reload layers release every node only after the final source ends',()=>{
  for(const ready of [false,true]){
    const nodes=[],sources=[];
    const param=()=>({setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
    const node=()=>{const n={connect(){},disconnect(){this.disconnected=true;}};nodes.push(n);return n;};
    const source=()=>{const n=Object.assign(node(),{frequency:param(),start(at){this.at=at;},stop(at){this.end=at;}});sources.push(n);return n;};
    const c={currentTime:3,createBufferSource:source,createOscillator:source,
      createBiquadFilter:()=>Object.assign(node(),{frequency:{},Q:{}}),createGain:()=>Object.assign(node(),{gain:param()})};
    const output=node();playReload(c,{},output,ready);
    assert.ok(sources.length>=5);
    assert.ok(sources.every(s=>s.at>=3&&s.end>s.at&&s.end<3.4));
    sources.sort((a,b)=>a.end-b.end);
    for(const s of sources.slice(0,-1))s.onended();
    assert.ok(!output.disconnected);sources.at(-1).onended();
    assert.ok(nodes.every(n=>n.disconnected));
  }
});

test('muted reload audio creates no playback nodes',()=>{
  for(const type of ['reload','reloadReady']){
    Audio.prototype.play.call({enabled:false,context:{state:'running',createStereoPanner(){assert.fail('muted playback');}}},type);
  }
});

test('manual and automatic reload sounds follow simulation completion, including settings pause',()=>{
  for(const automatic of [false,true]){
    const sounds=[],w=new World({play(type){sounds.push(type);}});w.start();sounds.length=0;
    w.weapon.ammo=automatic?1:5;
    const input={mouse:{x:900,y:360,down:automatic},movement:()=>({x:0,y:0}),consumeReload:()=>!automatic};
    w.update(.01,input);
    assert.equal(sounds.filter(s=>s==='reload').length,1);
    w.state='settings';w.update(2,input);
    assert.equal(sounds.includes('reloadReady'),false);
    w.state='playing';input.mouse.down=false;input.consumeReload=()=>false;
    w.update(w.weapon.reloadDuration,input);
    assert.equal(sounds.filter(s=>s==='reloadReady').length,1);
  }
});
