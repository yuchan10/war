import { visiblePoint } from './visibility.js';

// Inverse of drawSoldier's upper-body and crawling transforms.
export function pointsAtHead(e,point){
  if(e.dead||e.headDestroyed||e.body?.head?.severed)return false;
  const angle=e.aimRemaining>0||e.burstLeft>0?e.aimAngle??e.angle:e.angle;
  const c=Math.cos(angle||0),s=Math.sin(angle||0),dx=point.x-e.x,dy=point.y-e.y;
  let x=dx*c+dy*s,y=-dx*s+dy*c;
  if(e.legsDisabled){
    x/=1.25;y/=.75;
    const crawl=e.crawling?Math.sin(e.crawlPhase||0):0,a=crawl*.05;
    [x,y]=[x*Math.cos(a)+y*Math.sin(a)+Math.abs(crawl)*3,-x*Math.sin(a)+y*Math.cos(a)];
  }
  const face=(x-4)**2+(y+3)**2<=36;
  const helmet=(!e.body||e.body.head.armor>0)&&((x-1)/7.5)**2+((y+4)/7)**2<=1;
  return face||helmet;
}

export function headAimTarget(world,point){
  if(world.state!=='playing'||world.player.unarmed||world.player.knifeEquipped)return null;
  return world.enemies.find(e=>e.active&&!e.dead&&e.born<=0&&pointsAtHead(e,point)&&visiblePoint(world.player,point,world.walls))??null;
}
