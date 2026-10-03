// Only drawn in the same visibility mask as the soldier.
export function drawEnemyIntent(c,e){
 if(e.dead||e.fallen)return;
 c.save();c.translate(e.x,e.y);
 if(e.reloadRemaining>0){c.strokeStyle='#cbbb83';c.lineWidth=2;c.beginPath();c.arc(0,0,25,-Math.PI/2,-Math.PI/2+(1-e.reloadRemaining/(e.reloadDuration??1.8))*Math.PI*2);c.stroke();}
 const mark=e.aiState==='react'?'!':e.aiState==='search'?'?':null;
 if(mark){c.fillStyle=mark==='!'?'#e9b17c':'#cfcea7';c.font='bold 15px sans-serif';c.textAlign='center';c.fillText(mark,0,-29);}
 c.restore();
}
