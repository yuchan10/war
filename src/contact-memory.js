import { visiblePoint } from './visibility.js';
import { HEARING } from './hearing.js';

export function updateContact(e,player,walls,dt,visible=visiblePoint({...e,angle:e.angle??Math.PI},player,walls)){
  e.contactAge=(e.contactAge??Infinity)+dt;
  e.heardAge=(e.heardAge??Infinity)+dt;
  if(e.heardAge>HEARING.memory)e.heardPosition=null;
  if(visible){
    e.heardPosition=null;
    e.lastContact={x:player.x,y:player.y,vx:player.vx||0,vy:player.vy||0};
    e.contactAge=0;
    return {visible:true,target:player};
  }
  if(e.heardPosition&&e.heardAge<=e.contactAge)return {visible:false,target:{...e.heardPosition,vx:0,vy:0},heard:true};
  if(!e.lastContact)return {visible:false,target:null};
  // Keep the actual last sighting until a new observation replaces it.
  return {visible:false,target:{x:e.lastContact.x,y:e.lastContact.y,vx:0,vy:0}};
}
