import { playKnifeImpact } from './knife-audio.js';
import { playGunshot, fetchRifleSamples } from './gunshot-audio.js';
import { playReload } from './reload-audio.js';

export function spatialSound(dx=0,dy=0){
  const distance=Math.hypot(dx,dy);
  return {pan:Math.max(-.85,Math.min(.85,dx/650)),gain:Math.max(.18,1/(1+distance/380))};
}

export class Audio {
  constructor(){
    this.context=null;this._enabled=true;this.sceneActive=false;this.ambienceWanted=true;
    this.rifleData=fetchRifleSamples().catch(error=>{console.error(error);return null;});
  }
  get enabled(){return this._enabled;}
  set enabled(value){this._enabled=value;if(this.master)this.master.gain.setTargetAtTime(value?.65:0,this.context.currentTime,.035);}
  unlock(){
    if(!this.context){
      const c=this.context=new(window.AudioContext||window.webkitAudioContext)();
      this.rifleReady=this.rifleData.then(data=>data?Promise.all(data.map(bytes=>c.decodeAudioData(bytes))):null)
        .then(buffers=>{this.rifleBuffers=buffers;}).catch(error=>console.error('Rifle audio decode failed',error));
      this.master=c.createGain();this.master.gain.value=this.enabled?.65:0;
      const limiter=c.createDynamicsCompressor();limiter.threshold.value=-18;limiter.knee.value=16;limiter.ratio.value=6;
      limiter.attack.value=.003;limiter.release.value=.16;
      this.master.connect(limiter);limiter.connect(c.destination);
      this.noise=c.createBuffer(1,c.sampleRate*.7,c.sampleRate);
      const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
      this.atmosphere=c.createGain();this.atmosphere.gain.value=0;this.atmosphere.connect(this.master);
      const wind=c.createBufferSource();wind.buffer=this.noise;wind.loop=true;
      const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=180;
      wind.connect(filter);filter.connect(this.atmosphere);wind.start();
      const drone=c.createOscillator(),droneGain=c.createGain();drone.frequency.value=58;droneGain.gain.value=.15;
      drone.connect(droneGain);droneGain.connect(this.atmosphere);drone.start();
    }
    this.context.resume();this.applyAmbience();
  }
  setScene(active,ambience){
    if(active===this.sceneActive&&ambience===this.ambienceWanted)return;
    this.sceneActive=active;this.ambienceWanted=ambience;this.applyAmbience();
  }
  applyAmbience(){if(this.atmosphere)this.atmosphere.gain.setTargetAtTime(this.sceneActive&&this.ambienceWanted?.065:0,this.context.currentTime,.2);}
  play(type,position={}){
    if(!this.enabled||!this.context||this.context.state!=='running')return;
    const c=this.context,now=c.currentTime;
    const spatial=spatialSound(position.dx,position.dy);
    const pan=c.createStereoPanner();pan.pan.value=(type==='enemyShot'||type==='wallHit'||type==='enemyFootstep')?spatial.pan:0;pan.connect(this.master);
    const shot=type==='shot'||type==='enemyShot';
    const distanceGain=(type==='enemyShot'||type==='wallHit'||type==='enemyFootstep')?spatial.gain:1;
    if(type==='reload'||type==='reloadReady'){
      playReload(c,this.noise,pan,type==='reloadReady');return;
    }
    if(shot){
      playGunshot(c,this.rifleBuffers?.[type==='enemyShot'?1:0],pan,{gain:distanceGain,distance:Math.hypot(position.dx||0,position.dy||0)});
      return;
    }
    if(type==='knifeHit'||type==='knifeArmor'){
      playKnifeImpact(c,this.noise,pan,type==='knifeArmor');return;
    }
    if(type==='knife'){
      const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();
      source.buffer=this.noise;filter.type='bandpass';filter.frequency.value=1800;filter.Q.value=.7;
      gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(.18,now+.04);gain.gain.exponentialRampToValueAtTime(.001,now+.18);
      source.connect(filter);filter.connect(gain);gain.connect(pan);source.start();source.stop(now+.2);
      source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();pan.disconnect();};return;
    }
    const step=type==='footstep'||type==='enemyFootstep';
    if(step){
      // Quiet boot crunch, kept separate from the rifle's layered report.
      const noise=c.createBufferSource(),filter=c.createBiquadFilter(),envelope=c.createGain();
      noise.buffer=this.noise;filter.type='bandpass';filter.frequency.value=450;filter.Q.value=.65;
      envelope.gain.setValueAtTime(.06*distanceGain,now);envelope.gain.exponentialRampToValueAtTime(.001,now+.19);
      noise.connect(filter);filter.connect(envelope);envelope.connect(pan);noise.start();noise.stop(now+.2);
      noise.onended=()=>{noise.disconnect();filter.disconnect();envelope.disconnect();};
    }
    const sounds={heal:[420,720,.16,.04],footstep:[95,40,.09,.065],enemyFootstep:[85,35,.1,.065],enemyShot:[130,38,.24,.16],shot:[180,45,.12,.12],wallHit:[220,60,.05,.025],impact:[180,65,.075,.05],hit:[90,35,.15,.07],dead:[75,30,.16,.04],wave:[180,220,.2,.018]};
    const [from,to,duration,volume]=sounds[type]||sounds.impact;
    const oscillator=c.createOscillator(),gain=c.createGain();oscillator.type=shot?'triangle':'sine';
    oscillator.frequency.setValueAtTime(from,now);oscillator.frequency.exponentialRampToValueAtTime(to,now+duration);
    gain.gain.setValueAtTime(volume*distanceGain,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);
    oscillator.connect(gain);gain.connect(pan);oscillator.start();oscillator.stop(now+Math.max(duration,.21));
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();pan.disconnect();};
  }
}

