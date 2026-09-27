// Recorded rifle reports keep their original attack and outdoor decay.
export function playGunshot(c,buffer,output,{gain=1,distance=0}={}){
  if(!buffer){output.disconnect();return false;}
  const source=c.createBufferSource(),air=c.createBiquadFilter(),level=c.createGain();
  source.buffer=buffer;air.type='lowpass';air.Q.value=.707;
  air.frequency.value=18000-Math.min(1,distance/1000)*11000;
  level.gain.value=.75*gain;
  source.connect(air);air.connect(level);level.connect(output);
  source.onended=()=>{source.disconnect();air.disconnect();level.disconnect();output.disconnect();};
  source.start(c.currentTime);
  return true;
}

export async function fetchRifleSamples(fetcher=fetch){
  return Promise.all(['rifle-player.wav','rifle-enemy.wav'].map(async file=>{
    const response=await fetcher(new URL('../assets/audio/'+file,import.meta.url));
    if(!response.ok)throw new Error('Rifle audio unavailable: '+file);
    return response.arrayBuffer();
  }));
}
