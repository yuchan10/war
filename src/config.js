export const CONFIG= {
  healing:{dropChance:.25,amount:25,pickupRadius:28},
  suppression: { memory:4.5,extrapolation:.2 },
  stage: { heal:15 },
  width:1200,height:720,step:1/120,maxFrame:.1,particleLimit:420,bulletLimit:600,arena: {
    left:42,right:1158,top:62,bottom:658
  },player: {
    radius:15,speed:180,hp:100,invulnerability:.24,firingMoveScale:.65,reloadMoveScale:.55
  },weapon: {
    interval:.16,speed:1550,damage:30,radius:4,life:2.4,magazineSize:12,reloadDuration:1.6
  },knockback: { enemy:180,player:100,drag:10,maxSpeed:1000 }
};
export const ENEMIES= {
  assault: {
    role:'assault',hp:100,speed:145,radius:17,damage:18,color:'#b99e78',score:180,range:360,fireInterval:.95,bulletSpeed:1050,aimDuration:.4,burstCount:2,burstInterval:.15,leadTime:.2
  },
  chaser: {
    hp:40,speed:105,radius:16,damage:13,color:'#ff9279',score:100
  },shooter: {
    role:'support',
    hp:100,speed:85,radius:17,damage:22,color:'#b99e78',score:180,range:590,fireInterval:1.05,bulletSpeed:1050,aimDuration:.45,burstCount:3,burstInterval:.14,leadTime:.35
  },charger: {
    hp:80,speed:80,radius:22,damage:20,color:'#c2a0ff',score:250,windup:.9,rushSpeed:490,knockbackScale:.65
  },boss: {
    hp:1000,speed:44,radius:46,damage:18,color:'#ff728a',score:2500,range:280,fireInterval:1.1,bulletSpeed:205,knockbackScale:.18
  }
};

