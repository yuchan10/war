// Courage is independent of role and shooting skill.
export const ENEMY_COURAGE={
  cautious:{name:'겁이 많음',retreatOnHit:true,retreatSeverity:0},
  steady:{name:'보통',retreatOnHit:false,retreatSeverity:.5},
  resolute:{name:'결사적',retreatOnHit:false,retreatSeverity:Infinity}
};
export function courageProfile(enemy){return ENEMY_COURAGE[enemy.courage]||ENEMY_COURAGE.steady;}
