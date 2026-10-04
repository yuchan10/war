const clamp=n=>Math.max(0,Math.min(1,n));

export function damageScreenState(player,time){
  const rate=Object.values(player.body||{}).reduce((sum,part)=>sum+(part.bleedRemaining>0?Math.max(0,part.bleedRate||0):0),0);
  const severity=rate>0?clamp(rate/36*.8+(player.bloodLoss||0)/100*.2):0;
  const flash=clamp((player.hitFlash||0)/.35);
  const phase=time*(2.8+severity*2.4);
  const pulse=.5+.5*Math.sin(phase);
  return {rate,severity,flash,phase,
    opacity:Math.min(.82,flash*.34+(rate>0?.38+severity*.28+pulse*.10:0)),
    depth:rate>0?.20+severity*.16+pulse*.025:.14,
    driftX:Math.sin(time*.8+player.x*.012)*(8+severity*22),
    driftY:Math.cos(time*.65+player.y*.012)*(6+severity*16)};
}

// Screen-space veins of color leave the center clear and flow with time/movement.
export function drawDamageScreen(c,player,time,width,height){
  const s=damageScreenState(player,time);if(s.opacity<=0)return;
  c.save();
  c.translate(width/2+s.driftX,height/2+s.driftY);c.scale(width/2,height/2);
  const edge=c.createRadialGradient(0,0,1-s.depth*2,0,0,1.35);
  edge.addColorStop(0,'rgba(110,0,8,0)');
  edge.addColorStop(.5,`rgba(145,5,16,${s.opacity*.52})`);
  edge.addColorStop(1,`rgba(100,0,10,${s.opacity})`);
  c.fillStyle=edge;c.fillRect(-1.2,-1.2,2.4,2.4);c.restore();
  if(s.rate<=0)return;
  c.save();
  for(let i=0;i<10;i++){
    const a=i*Math.PI/5+.05*Math.sin(s.phase*.35+i);
    const x=width/2+Math.cos(a)*(width*.51+s.driftX),y=height/2+Math.sin(a)*(height*.54+s.driftY);
    const radius=height*(.10+s.severity*.10)*(1+.12*Math.sin(s.phase+i*1.7));
    const stain=c.createRadialGradient(x,y,0,x,y,radius);
    stain.addColorStop(0,`rgba(160,4,18,${.13+s.severity*.17})`);stain.addColorStop(1,'rgba(100,0,8,0)');
    c.fillStyle=stain;c.fillRect(x-radius,y-radius,radius*2,radius*2);
  }
  c.restore();
}

export function drawSkull(c,x,y){
  c.save();c.translate(x,y);c.lineCap='round';c.lineJoin='round';
  c.beginPath();
  c.moveTo(-4,5);c.lineTo(-7,3);c.lineTo(-8,-2);
  c.bezierCurveTo(-8,-11,8,-11,8,-2);
  c.lineTo(7,3);c.lineTo(4,5);c.lineTo(4,8);c.lineTo(-4,8);c.closePath();
  // Angled eye sockets and separated teeth, drawn entirely with fine outlines.
  for(const side of [-1,1]){
    c.moveTo(side*2,-2);c.lineTo(side*6,-3);c.lineTo(side*5,1);c.lineTo(side*2,0);c.closePath();
  }
  c.moveTo(-1,3);c.lineTo(0,1.5);c.lineTo(1,3);
  for(const tooth of [-1.5,1.5]){c.moveTo(tooth,5.5);c.lineTo(tooth,8);}
  // A narrow dark under-stroke keeps the ivory line readable over bright terrain.
  c.strokeStyle='#101810cc';c.lineWidth=3.4;c.stroke();
  c.strokeStyle='#f3eedb';c.lineWidth=1.3;c.stroke();c.restore();
}
