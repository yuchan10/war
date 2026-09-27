export const CONFIG= {
  healing:{dropChance:.25,amount:25,pickupRadius:28},
  stage: { heal:15 },
  width:1200,height:720,step:1/120,maxFrame:.1,particleLimit:420,bulletLimit:600,arena: {
    left:42,right:1158,top:62,bottom:658
  },player: {
    radius:15,speed:126,knifeMoveScale:1.25,hp:100,invulnerability:.24,firingMoveScale:.65,reloadMoveScale:.55
  },weapon: {
    bulletRange:438,interval:.16,speed:1550,damage:30,radius:4,life:2.4,magazineSize:12,reloadDuration:1.6
  },knockback: { enemy:180,player:100,drag:10,maxSpeed:1000 }
};
export const ENEMIES= {
  assault: {
    role:'assault',hp:120,speed:101.5,radius:17,damage:30,color:'#b99e78',score:180,bulletRange:270,range:270,fireInterval:2,bulletSpeed:1050,aimDuration:.4,burstCount:1,burstInterval:.15,leadTime:.2
  },
  shooter: {
    role:'support',
    hp:100,speed:59.5,radius:17,damage:22,color:'#b99e78',score:180,bulletRange:438,range:438,fireInterval:1.05,bulletSpeed:1050,aimDuration:.45,burstCount:3,burstInterval:.14,leadTime:.35
  }
};

