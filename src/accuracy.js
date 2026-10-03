import { PARTS } from './injury.js';
// Base accuracy remains editable per soldier. Wounds never overwrite that value.
export function effectiveAccuracy(entity){
 const base=Number.isFinite(entity.accuracy)?entity.accuracy:100;
 const armDamage=['leftArm','rightArm'].reduce((sum,key)=>{
  const state=entity.body?.[key];return sum+(state?Math.min(1,state.damage/PARTS[key].threshold):0);
 },0);
 return Math.max(0,Math.min(100,base-armDamage*25));
}
export function accuracySpread(entity){return (100-effectiveAccuracy(entity))*.1*Math.PI/180;}
export function shotAngle(entity,intendedAngle,random=Math.random){
 const spread=accuracySpread(entity);
 return spread===0?intendedAngle:intendedAngle+(random()*2-1)*spread;
}
