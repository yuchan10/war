// A short contact crack over a deeper, longer body impact.
export function playKnifeImpact(c,noiseBuffer,output,armor=false){
 const now=c.currentTime,nodes=[];
 const pitch=.94+Math.random()*.12;
 function tone(from,to,duration,volume,type='sine'){
  const source=c.createOscillator(),gain=c.createGain();nodes.push(source,gain);
  source.type=type;source.frequency.setValueAtTime(from*pitch,now);source.frequency.exponentialRampToValueAtTime(to*pitch,now+duration);
  gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(volume,now+.004);gain.gain.exponentialRampToValueAtTime(.001,now+duration);
  source.connect(gain);gain.connect(output);source.start(now);source.stop(now+duration+.01);
 }
 tone(armor?145:105,armor?55:38,.23,armor?.22:.3);
 tone(armor?420:190,armor?120:65,.12,.12,'triangle');
 const noise=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();nodes.push(noise,filter,gain);
 noise.buffer=noiseBuffer;filter.type='lowpass';filter.frequency.setValueAtTime(armor?2200:1100,now);filter.frequency.exponentialRampToValueAtTime(180,now+.14);
 gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(armor?.3:.38,now+.003);gain.gain.exponentialRampToValueAtTime(.001,now+.16);
 noise.connect(filter);filter.connect(gain);gain.connect(output);noise.start(now);noise.stop(now+.27);
 noise.onended=()=>{for(const node of nodes)node.disconnect();output.disconnect();};
}
