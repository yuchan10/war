export function drawHood(c,x,y,hit=false){
  c.save();c.translate(x,y);
  c.fillStyle='#b6aa8b';c.strokeStyle='#665e4b';c.lineWidth=1;
  c.beginPath();c.moveTo(-8,-7);c.lineTo(6,-8);c.lineTo(9,-3);c.lineTo(8,7);c.lineTo(-7,8);c.closePath();c.fill();c.stroke();
  c.strokeStyle='#8c8168';c.beginPath();c.moveTo(-4,-6);c.lineTo(-2,5);c.moveTo(4,-6);c.lineTo(5,4);c.stroke();
  c.fillStyle='#746950';c.fillRect(-8,-6,2,12);
  if(hit){
    c.fillStyle='#87453f';c.beginPath();c.ellipse(1,0,6,5.5,.3,0,Math.PI*2);c.fill();
    c.fillStyle='#69322e';c.beginPath();c.ellipse(2,1,3.5,4,-.2,0,Math.PI*2);c.fill();
    c.strokeStyle='#753d35';c.lineWidth=2;c.beginPath();c.moveTo(2,2);c.lineTo(3,6);c.stroke();
    c.fillStyle='#392a25';c.beginPath();c.arc(2,0,1.2,0,Math.PI*2);c.fill();
  }
  c.restore();
}
export function drawWristBinding(c,x,y){
  c.save();c.translate(x,y);
  c.fillStyle='#c4ad87';c.fillRect(-2,-5,4,10);
  c.strokeStyle='#d2c395';c.lineWidth=1.5;
  for(const offset of [-1.5,1.5]){c.beginPath();c.moveTo(offset,-5);c.lineTo(offset,5);c.stroke();}
  c.beginPath();c.moveTo(-2,-3);c.lineTo(3,3);c.lineTo(5,5);c.stroke();c.restore();
}
