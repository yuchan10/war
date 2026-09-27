// Short mechanical layers: magazine release/handling, then a bolt snap on completion.
export function playReload(c,noiseBuffer,output,ready=false){
  const layers=ready?
    [[0,.09,1800,.13,220],[.065,.055,3200,.1,470],[.12,.08,900,.08,150]]:
    [[0,.055,2400,.1,380],[.07,.15,650,.07,0],[.2,.075,1300,.09,180]];
  let pending=layers.reduce((count,layer)=>count+1+(layer[4]?1:0),0);
  const connect=(source,filter,start,duration,volume)=>{
    const gain=c.createGain(),at=c.currentTime+start;
    gain.gain.setValueAtTime(.0001,at);
    gain.gain.linearRampToValueAtTime(volume*3,at+.003);
    gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
    source.connect(filter);filter.connect(gain);gain.connect(output);
    source.onended=()=>{
      source.disconnect();filter.disconnect();gain.disconnect();
      if(--pending===0)output.disconnect();
    };
    source.start(at);source.stop(at+duration+.01);
  };
  for(const [start,duration,frequency,volume,tone] of layers){
    const noise=c.createBufferSource(),filter=c.createBiquadFilter();
    noise.buffer=noiseBuffer;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=1.1;
    connect(noise,filter,start,duration,volume);
    if(tone){
      const body=c.createOscillator(),lowpass=c.createBiquadFilter();
      body.type='triangle';body.frequency.setValueAtTime(tone,c.currentTime+start);
      body.frequency.exponentialRampToValueAtTime(tone*.55,c.currentTime+start+.04);
      lowpass.type='lowpass';lowpass.frequency.value=1600;
      connect(body,lowpass,start,.055,volume*.3);
    }
  }
}
