// Cached once per stage. Decorative ground never creates invisible collision.
export function drawTerrain(c,stage){
  const t=stage.terrain;let seed=71+stage.theme.length*137;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  c.fillStyle=t.base;c.fillRect(0,0,1200,720);
  const path=()=>{c.beginPath();t.road.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));};
  c.lineJoin='round';c.lineCap='round';path();c.strokeStyle='#252c2780';c.lineWidth=t.roadWidth+14;c.stroke();
  path();c.strokeStyle=stage.theme==='relay'?'#63604b':'#383c36';c.lineWidth=t.roadWidth;c.stroke();
  if(t.markings){c.setLineDash([25,35]);path();c.strokeStyle='#c0b68b65';c.lineWidth=3;c.stroke();c.setLineDash([]);}
  if(t.courtyard){const {x,y,w,h}=t.courtyard;c.fillStyle='#66675b';c.fillRect(x,y,w,h);c.strokeStyle='#313d3460';c.lineWidth=1;
    for(let n=x;n<x+w;n+=35){c.beginPath();c.moveTo(n,y);c.lineTo(n,y+h);c.stroke();}
    for(let n=y;n<y+h;n+=35){c.beginPath();c.moveTo(x,n);c.lineTo(x+w,n);c.stroke();}}
  if(stage.theme==='checkpoint'){
    for(const x of [350,610,960]){c.fillStyle='#b4aa7855';for(let y=280;y<450;y+=27)c.fillRect(x,y,8,15);}
    c.strokeStyle='#99937c';c.lineWidth=3;c.strokeRect(710,110,120,190);
  }
  if(stage.theme==='depot'){
    c.strokeStyle='#baa65d70';c.lineWidth=2;
    for(const w of stage.walls)c.strokeRect(w.x-12,w.y-12,w.w+24,w.h+24);
    c.fillStyle='#b4aa7460';for(let x=220;x<1060;x+=180){c.fillRect(x,340,30,5);c.beginPath();c.moveTo(x+30,334);c.lineTo(x+40,342);c.lineTo(x+30,350);c.fill();}
  }
  if(t.mast){const {x,y}=t.mast;c.strokeStyle='#1d2725';c.lineWidth=3;
    c.beginPath();c.moveTo(x,y);c.lineTo(820,345);c.lineTo(750,345);c.lineTo(750,220);c.stroke();
    c.strokeStyle='#81928444';c.lineWidth=2;c.beginPath();c.arc(x,y,80,0,Math.PI*2);c.stroke();}
  if(stage.theme==='barracks'){
    for(const w of stage.walls.filter(w=>w.kind==='barracks')){c.fillStyle='#777360';c.fillRect(w.x+w.w,w.y+35,35,w.h-70);}
    c.strokeStyle='#a69c7866';c.lineWidth=2;c.strokeRect(555,265,120,160);
  }
  if(stage.theme==='command'){
    c.strokeStyle='#b7b29455';c.lineWidth=2;c.strokeRect(670,90,385,515);
    c.fillStyle='#b6aa6155';for(let x=790;x<1040;x+=24)c.fillRect(x,318,10,6);
  }
  for(let i=0;i<13000;i++){c.fillStyle=random()>.5?'#e2dab00c':'#1118101a';c.fillRect(random()*1200,random()*720,1+random()*3,1+random()*2);}
  for(const [x,y,r] of t.craters||[]){const g=c.createRadialGradient(x,y,3,x,y,r);g.addColorStop(0,'#111a14');g.addColorStop(.65,'#282d23');g.addColorStop(1,'#171c1800');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
  for(let i=0;i<110;i++){const x=60+random()*1080,y=80+random()*555;c.fillStyle=i%2?'#79766360':'#202c2360';c.fillRect(x,y,2+random()*5,2+random()*3);}
  c.fillStyle='#242b24';c.fillRect(25,45,1150,15);c.fillRect(25,660,1150,15);c.fillRect(25,60,15,600);c.fillRect(1160,60,15,600);
  c.strokeStyle='#8c8a6e55';c.lineWidth=1;c.strokeRect(40,60,1120,600);
}

// Solid landmarks use exactly the same rectangular footprint as physics/vision.
export function drawLandmark(c,w){
  const {x,y,w:width,h}=w;
  c.save();c.beginPath();c.rect(x,y,width,h);c.clip();
  if(w.kind==='container'){
    c.fillStyle='#526769';c.fillRect(x+3,y+3,width-6,h-6);c.strokeStyle='#9eaaaa66';c.lineWidth=2;
    for(let n=10;n<width;n+=12){c.beginPath();c.moveTo(x+n,y+5);c.lineTo(x+n,y+h-5);c.stroke();}
    c.fillStyle='#c0ae7066';c.fillRect(x+8,y+h-24,22,12);
  }else if(w.kind==='wreck'){
    c.fillStyle='#292e28';c.fillRect(x,y,width,h);c.fillStyle='#5b5e44';c.fillRect(x+5,y+6,width-10,h-12);
    c.fillStyle='#101916';c.fillRect(x+9,y+20,width-18,24);c.fillStyle='#333b2b';c.fillRect(x+10,y+55,width-20,h-70);
    c.strokeStyle='#211f17';c.lineWidth=5;c.beginPath();c.moveTo(x+9,y+65);c.lineTo(x+width-9,y+h-16);c.moveTo(x+width-9,y+65);c.lineTo(x+9,y+h-16);c.stroke();
  }else if(w.kind==='crates'){
    for(let a=3;a<width;a+=28)for(let b=3;b<h;b+=28){c.fillStyle='#827354';c.fillRect(x+a,y+b,24,24);c.strokeStyle='#4e4936';c.lineWidth=2;c.strokeRect(x+a+2,y+b+2,20,20);c.beginPath();c.moveTo(x+a,y+b);c.lineTo(x+a+24,y+b+24);c.stroke();}
  }else if(w.kind==='rock'){
    c.fillStyle='#626452';c.fillRect(x+2,y+2,width-4,h-4);c.strokeStyle='#969780';c.lineWidth=2;c.beginPath();c.moveTo(x+5,y+h*.7);c.lineTo(x+width*.35,y+6);c.lineTo(x+width*.65,y+h*.7);c.lineTo(x+width-5,y+12);c.stroke();
  }else if(['barracks','bunker','booth'].includes(w.kind)){
    c.fillStyle=w.kind==='barracks'?'#726b56':'#727b72';c.fillRect(x+5,y+5,width-10,h-10);
    c.strokeStyle='#292f2980';c.lineWidth=3;c.beginPath();c.moveTo(x+width/2,y+6);c.lineTo(x+width/2,y+h-6);c.stroke();
    c.fillStyle='#24322d';for(let n=18;n<h-15;n+=33)c.fillRect(x+width-11,y+n,7,15);
    c.fillStyle='#aca997';c.fillRect(x+width*.3,y+h*.4,width*.4,18);
  }else if(w.kind==='generator'){
    c.fillStyle='#414d42';c.fillRect(x+4,y+4,width-8,h-8);c.fillStyle='#202b25';for(let n=12;n<h-8;n+=9)c.fillRect(x+10,y+n,width-20,3);
  }else if(w.kind==='mast'){
    c.fillStyle='#505c52';c.fillRect(x+3,y+3,width-6,h-6);c.strokeStyle='#b1b8a5';c.lineWidth=3;
    c.beginPath();c.moveTo(x+12,y+12);c.lineTo(x+width-12,y+h-12);c.moveTo(x+width-12,y+12);c.lineTo(x+12,y+h-12);c.stroke();
    c.fillStyle='#adb9aa';c.beginPath();c.arc(x+width/2,y+h/2,16,0,Math.PI*2);c.fill();c.fillStyle='#3b4b40';c.beginPath();c.arc(x+width/2+4,y+h/2-3,10,0,Math.PI*2);c.fill();
  }
  c.restore();
}
