const defaults={enemyVision:false,playerPrediction:false,enemyPrediction:false,sound:true,ambience:true,cameraShake:false};
export class Settings {
  constructor(storage){this.storage=storage;this.values={...defaults};try{const saved=JSON.parse(storage?.getItem('pulse-break-settings')||'{}');for(const key of Object.keys(defaults))if(typeof saved[key]==='boolean')this.values[key]=saved[key];}catch{}}
  set(key,value){if(!(key in defaults)||typeof value!=='boolean')return;this.values[key]=value;try{this.storage?.setItem('pulse-break-settings',JSON.stringify(this.values));}catch{}}
}
