// Select only body regions that still exist; surviving weights are normalized.
export const HIT_REGIONS=[
  {part:'head',chance:.10,damage:120},
  {part:'torso',chance:.50,multiplier:4/3},
  {part:'arm',chance:.20,damage:20},
  {part:'leg',chance:.20,damage:20}
];
export function injuryMoveScale(enemy){
  const base=enemy.speed??100;
  const arms=enemy.missingArms?.length||0;
  const armScale=base>0?Math.max(0,base-arms*25)/base:0;
  if(!enemy.legsDisabled)return armScale;
  const speed=(enemy.missingLegs?.length||1)>1?.025:.04;
  // Arms pull the body in short, very slow strokes; no standing gait remains.
  return armScale*speed*(.8+.2*Math.sin(enemy.crawlPhase||0));
}
export function applyInjury(enemy,baseDamage,random=Math.random){
  if(enemy.hp<=0)return {part:null,damage:0,killed:true,detached:false};
  const eligible=HIT_REGIONS.filter(r=>r.part==='arm'?(enemy.missingArms?.length||0)<2:r.part==='leg'?(enemy.missingLegs?.length||0)<2:true);
  let roll=random()*eligible.reduce((n,r)=>n+r.chance,0),region=eligible.at(-1);
  for(const candidate of eligible){roll-=candidate.chance;if(roll<0){region=candidate;break;}}
  const damage=region.damage??Math.round(baseDamage*region.multiplier);
  enemy.hp=Math.max(0,enemy.hp-damage);enemy.lastHitPart=region.part;
  if(region.part==='torso'){
    const marks=enemy.torsoMarks||[],index=marks.length;
    // Stable local positions: one mark per hit, spread across the uniform.
    const angle=index*2.399963+Math.PI,radius=3+(index%3)*1.1;
    enemy.torsoMarks=[...marks,{x:1+Math.cos(angle)*radius,y:Math.sin(angle)*radius*.8}];
  }
  let detached=false;
  if(region.part==='head'&&enemy.hp===0)enemy.headDestroyed=true;
  if(region.part==='arm'||region.part==='leg'){
    const key=region.part==='arm'?'missingArms':'missingLegs';
    const missing=enemy[key]||[],available=[-1,1].filter(side=>!missing.includes(side));
    const side=available.length===1?available[0]:available[random()<.5?0:1];
    // Replace rather than mutate so remembered poses retain their old silhouette.
    enemy[key]=[...missing,side];enemy[region.part==='arm'?'missingArm':'missingLeg']=side;detached=true;
  }
  if(region.part==='arm'){
    // Positive local side holds the trigger; the opposite hand supports the barrel.
    enemy.armsDisabled=enemy.missingArms.includes(1);
    enemy.aimImpaired=enemy.missingArms.includes(-1)&&!enemy.armsDisabled;
    if(enemy.armsDisabled){enemy.aimRemaining=0;enemy.burstLeft=0;enemy.muzzle=0;enemy.aimWobble=0;}
  }
  if(region.part==='leg'){enemy.legsDisabled=true;enemy.walking=false;}
  return {part:region.part,damage,killed:enemy.hp===0,detached};
}
