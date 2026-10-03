export const CONFIG= {
  width:1200,height:720,step:1/120,maxFrame:.1,particleLimit:420,bulletLimit:600,arena: {
    left:42,right:1158,top:62,bottom:658
  },player: {
    radius:15,speed:126,accuracy:100,knifeMoveScale:1.25,firingMoveScale:.65,reloadMoveScale:.55
  },weapon: {
    bulletRange:526,interval:.144,speed:1783,damage:45,radius:4,life:2.4,magazineSize:24,reserveCapacity:72,reloadDuration:1.6
  },knockback: { enemy:180,player:100,knife:70,drag:10,maxSpeed:1000 }
};
export const ENEMIES= {
  assault: {
    role:'assault',reloadDuration:2.4,accuracy:100,speed:101.5,radius:17,damage:30,color:'#b99e78',score:180,bulletRange:324,range:324,fireInterval:.9,bulletSpeed:1208,aimDuration:.4,burstCount:1,burstInterval:.135,leadTime:.2
  },
  shooter: {
    role:'support',reloadDuration:1.8,accuracy:100,
    speed:59.5,radius:17,damage:22,color:'#b99e78',score:180,bulletRange:526,range:526,fireInterval:.945,bulletSpeed:1208,aimDuration:.45,burstCount:3,burstInterval:.126,leadTime:.35
  }
};

