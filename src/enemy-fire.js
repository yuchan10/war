// Telegraph once, then burst at a visible target or a still-valid remembered contact.
export function enemyShotAngle(e,shot=0){
  const spread=(e.shotSpread??.045)*(e.aimImpaired?2.5:1);
  return e.aimAngle+(shot-((e.burstCount||1)-1)/2)*spread+(e.aimImpaired?e.aimWobble||0:0);
}
export function updateEnemyFire(e,dt,target,shoot,visible=true){
  e.aimShakeTime=(e.aimShakeTime||0)+dt;
  e.aimWobble=e.aimImpaired?.12*Math.sin(e.aimShakeTime*41)+.06*Math.sin(e.aimShakeTime*23):0;
  if(!visible||e.armsDisabled){e.aimRemaining=0;e.burstLeft=0;return false;}
  const aim=()=>{
    const lead=e.predictiveLead===undefined?(e.leadTime||0):
      Math.hypot(target.x-e.x,target.y-e.y)/e.bulletSpeed*e.predictiveLead;
    return Math.atan2(target.y+(target.vy||0)*lead-e.y,target.x+(target.vx||0)*lead-e.x);
  };
  if(e.burstLeft>0){
    e.burstTimer-=dt;
    if(e.burstTimer<=0){const shot=(e.burstCount||1)-e.burstLeft;
      const fired=shoot(e.x,e.y,enemyShotAngle(e,shot),true,e.damage,e.bulletSpeed);
      e.muzzle=fired===false?0:.07;e.burstLeft--;e.burstTimer=e.burstInterval||.12;if(!e.burstLeft)e.timer=e.fireInterval;}
    return true;
  }
  if(e.aimRemaining>0){
    if(e.trackAim)e.aimAngle=aim();
    e.aimRemaining=Math.max(0,e.aimRemaining-dt);
    if(e.aimRemaining===0){const count=e.burstCount||1;
      const fired=shoot(e.x,e.y,enemyShotAngle(e,0),true,e.damage,e.bulletSpeed);
      e.muzzle=fired===false?0:.07;e.burstLeft=count-1;e.burstTimer=e.burstInterval||.12;if(!e.burstLeft)e.timer=e.fireInterval;}
    return true;
  }
  if(e.timer<=0){e.aimAngle=aim();e.aimRemaining=e.aimDuration;return true;}
  return false;
}
