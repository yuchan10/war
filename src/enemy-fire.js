import { CONFIG } from './config.js';
import { shotAngle } from './accuracy.js';
// Telegraph once, then burst at a visible target or a still-valid remembered contact.
export function enemyShotAngle(e,shot=0,random=Math.random){
  return shotAngle(e,e.aimAngle,random);
}
export function updateEnemyReload(e,dt){
  if(e.dead||e.armsDisabled||e.unarmed)return;
  e.ammo??=CONFIG.weapon.magazineSize;
  if(e.ammo>0)return;
  e.aimRemaining=0;e.burstLeft=0;e.muzzle=0;
  e.reloadRemaining??=e.reloadDuration??1.8;
  e.reloadRemaining=Math.max(0,e.reloadRemaining-dt);
  if(e.reloadRemaining===0){e.ammo=CONFIG.weapon.magazineSize;e.reloadRemaining=null;}
}
export function updateEnemyFire(e,dt,target,shoot,visible=true,random=Math.random){
  e.ammo??=CONFIG.weapon.magazineSize;
  if(e.dead||e.unarmed||e.ammo<=0||e.reloadRemaining>0||!visible||e.armsDisabled){e.aimRemaining=0;e.burstLeft=0;return false;}
  const aim=()=>{
    const lead=e.predictiveLead===undefined?(e.leadTime||0):
      Math.hypot(target.x-e.x,target.y-e.y)/e.bulletSpeed*e.predictiveLead;
    return Math.atan2(target.y+(target.vy||0)*lead-e.y,target.x+(target.vx||0)*lead-e.x);
  };
  if(e.burstLeft>0){
    e.burstTimer-=dt;
    if(e.burstTimer<=0){const shot=(e.burstCount||1)-e.burstLeft;
      const fired=shoot(e.x,e.y,enemyShotAngle(e,shot,random),true,e.damage,e.bulletSpeed,false,e.bulletRange);
      if(fired!==false)e.ammo--;e.muzzle=fired===false?0:.07;e.burstLeft--;e.burstTimer=e.burstInterval||.12;if(!e.burstLeft)e.timer=e.fireInterval;}
    return true;
  }
  if(e.aimRemaining>0){
    if(e.trackAim)e.aimAngle=aim();
    e.aimRemaining=Math.max(0,e.aimRemaining-dt);
    if(e.aimRemaining===0){const count=e.burstCount||1;
      const fired=shoot(e.x,e.y,enemyShotAngle(e,0,random),true,e.damage,e.bulletSpeed,false,e.bulletRange);
      if(fired!==false)e.ammo--;e.muzzle=fired===false?0:.07;e.burstLeft=count-1;e.burstTimer=e.burstInterval||.12;if(!e.burstLeft)e.timer=e.fireInterval;}
    return true;
  }
  if(e.timer<=0){e.aimAngle=aim();e.aimRemaining=e.aimDuration;return true;}
  return false;
}
