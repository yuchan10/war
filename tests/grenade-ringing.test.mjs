import test from 'node:test';
import assert from 'node:assert/strict';
import {Audio} from '../src/audio.js';
test('ringing is bounded, fades, releases nodes, respects mute and replaces earlier rings',()=>{
 const nodes=[],params=[];
 const param=()=>({setValueAtTime(v){params.push(v);},linearRampToValueAtTime(v){params.push(v);},exponentialRampToValueAtTime(v){params.push(v);},cancelScheduledValues(){},setTargetAtTime(){}});
 const node=()=>({connect(to){this.output=to;},disconnect(){this.disconnected=true;}});
 const context={currentTime:0,state:'running',createOscillator(){const osc={...node(),frequency:param(),start(){this.started=true;},stop(t){this.stops??=[];this.stops.push(t);}};nodes.push(osc);return osc;},createGain(){const gain={...node(),gain:param()};nodes.push(gain);return gain;}};
 const a=Object.assign(Object.create(Audio.prototype),{_enabled:true,context,ringingBus:node()});
 a.ringExplosion(1);const first=a.ringing;assert.ok(first.osc.started);assert.equal(first.gain.output,a.ringingBus);
 assert.ok(params.includes(.035));assert.equal(first.osc.stops[0],4.05);
 a.ringExplosion(.2);assert.equal(first.osc.stops.at(-1),.1);first.osc.onended();assert.ok(first.gain.disconnected);assert.ok(a.ringing);
 a.stopRinging();assert.equal(a.ringing,null);
 a._enabled=false;a.ringExplosion(1);assert.equal(a.ringing,null);
});
