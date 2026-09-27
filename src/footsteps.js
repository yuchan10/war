export function updateFootsteps(entity,oldX,oldY,listener,play,isPlayer=false){
  if(entity.legsDisabled){entity.stepDistance=0;return;}
  const distance=Math.hypot(entity.x-oldX,entity.y-oldY);
  if(distance<.02)return;
  entity.stepDistance=(entity.stepDistance||0)+distance;
  if(entity.stepDistance<58)return;
  entity.stepDistance%=58;
  if(!isPlayer&&Math.hypot(entity.x-listener.x,entity.y-listener.y)>750)return;
  play(isPlayer?'footstep':'enemyFootstep',{dx:entity.x-listener.x,dy:entity.y-listener.y});
}
