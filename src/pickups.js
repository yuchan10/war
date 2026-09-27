import { moveBody, hasLineOfSight } from './arena.js';
import { CONFIG } from './config.js';

export class Pickups {
  constructor(){this.items=[];}
  clear(){this.items=[];}
  drop(soldier,walls,random=Math.random){
    if(random()>=CONFIG.healing.dropChance)return;
    const item={x:soldier.x,y:soldier.y,radius:7};
    const angle=(soldier.angle||0)+Math.PI/2;
    moveBody(item,Math.cos(angle)*22,Math.sin(angle)*22,walls);
    this.items.push(item);
  }
  collect(player,walls){
    if(player.hp<=0||player.hp>=player.maxHp)return 0;
    let healed=0;
    this.items=this.items.filter(item=>{
      if(player.hp>=player.maxHp||Math.hypot(player.x-item.x,player.y-item.y)>CONFIG.healing.pickupRadius||!hasLineOfSight(player,item,walls))return true;
      const amount=Math.min(CONFIG.healing.amount,player.maxHp-player.hp);
      player.hp+=amount;healed+=amount;return false;
    });
    return healed;
  }
  draw(c,isVisible){
    for(const item of this.items){
      if(!isVisible(item))continue;
      c.save();c.translate(item.x,item.y);
      c.fillStyle='#0a140e88';c.fillRect(-9,-6,20,16);
      c.fillStyle='#7c9270';c.fillRect(-9,-9,18,15);
      c.strokeStyle='#c3d2a8';c.lineWidth=1;c.strokeRect(-9,-9,18,15);
      c.fillStyle='#e5ecd5';c.fillRect(-2,-7,4,11);c.fillRect(-6,-3,12,3);
      c.restore();
    }
  }
}
