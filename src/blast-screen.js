export function blastScreenState(w){
 const b=w.blastShock;if(!b)return {strength:0,flash:0,age:0};
 const age=Math.max(0,w.time-b.started),fade=Math.max(0,1-age/b.duration);
 return {strength:b.strength*fade*fade,flash:b.strength*Math.max(0,1-age/.18),age};
}
export function triggerBlastShock(w,g){
 const distance=Math.hypot(w.player.x-g.x,w.player.y-g.y,g.height||0);
 const strength=Math.max(0,1-distance/360);if(!strength)return;
 const current=blastScreenState(w).strength;
 w.blastShock={strength:Math.min(1,Math.max(current,strength)+current*.15),started:w.time,duration:1.5+strength*3};
}
export function drawBlastScreen(c,w,buffer,motion,width,height){
 const s=blastScreenState(w);if(s.strength<=0)return;
 c.save();
 if(motion){
  const copy=buffer.getContext('2d');copy.clearRect(0,0,width,height);copy.drawImage(c.canvas,0,0);
  c.globalAlpha=s.strength*.25;c.filter=`blur(${s.strength*2.5}px)`;
  const drift=Math.sin(s.age*7)*s.strength*17;
  c.drawImage(buffer,drift,Math.cos(s.age*5)*s.strength*7);c.filter='none';c.globalAlpha=1;
 }
 const edge=c.createRadialGradient(width/2,height/2,height*.2,width/2,height/2,width*.65);
 edge.addColorStop(0,'rgba(31,26,20,0)');edge.addColorStop(1,`rgba(31,26,20,${s.strength*.7})`);
 c.fillStyle=edge;c.fillRect(0,0,width,height);
 c.fillStyle=`rgba(255,237,196,${s.flash*.65})`;c.fillRect(0,0,width,height);c.restore();
}
