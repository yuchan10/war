// Training changes shooting ability independently of the soldier's tactical role.
export const ENEMY_SKILLS={
  rookie:{aimDuration:.55,accuracy:51,predictiveLead:.35,trackAim:false,firePace:1.2},
  regular:{aimDuration:.3,accuracy:77,predictiveLead:.7,trackAim:true,firePace:.9},
  veteran:{aimDuration:.17,accuracy:92,predictiveLead:1,trackAim:true,firePace:.7}
};
export function skillStats(base,skill){
  const profile=ENEMY_SKILLS[skill];
  return profile?{...profile,skill,fireInterval:base.fireInterval*profile.firePace}:{};
}
