import { CONFIG } from './config.js';
import { hasLineOfSight } from './arena.js';

export function updateContact(e,player,walls,dt){
  e.contactAge=(e.contactAge??Infinity)+dt;
  const visible=hasLineOfSight(e,player,walls);
  if(visible){
    e.lastContact={x:player.x,y:player.y,vx:player.vx||0,vy:player.vy||0};
    e.contactAge=0;
    return {visible:true,target:player};
  }
  if(!e.lastContact||e.contactAge>CONFIG.suppression.memory)return {visible:false,target:null};
  const last=e.lastContact,lead=CONFIG.suppression.extrapolation;
  // Estimate the nearby hiding place from the last observed movement only.
  return {visible:false,target:{x:last.x+last.vx*lead,y:last.y+last.vy*lead,vx:0,vy:0}};
}
