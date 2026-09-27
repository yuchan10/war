export class UI {
  constructor(world,input,audio,settings){
    this.w=world;this.input=input;this.audio=audio;this.settings=settings;
    this.overlay=document.querySelector('#overlay');this.lastState='';this.settingsOpen=false;
    this.audio.enabled=settings.values.sound;
    document.querySelector('#start').onclick=()=>this.start();
    document.querySelector('#settings').onclick=()=>this.openSettings();
    document.querySelector('#pause').onclick=()=>this.pause();
  }
  start(){this.audio.unlock();this.input.clear();this.w.startPrologue();}
  toggleSound(){this.audio.enabled=!this.audio.enabled;this.settings.set('sound',this.audio.enabled);if(this.audio.enabled)this.audio.unlock();}
  pause(){if(this.settingsOpen){this.closeSettings();return;}if(this.w.state==='playing'){this.w.state='paused';this.input.clear();}else if(this.w.state==='paused'){this.input.clear();this.w.state='playing';}}
  openSettings(){
    if(this.settingsOpen)return;
    this.previousState=this.w.state;this.w.state='settings';this.settingsOpen=true;this.input.clear();
    this.savedMarkup=this.overlay.innerHTML;this.overlay.classList.remove('hidden');const s=this.settings.values;
    this.overlay.innerHTML=`<div class="modal settings-panel"><h2>설정</h2>
    <label class="setting"><span>내 탄환 예상 경로</span><input type="checkbox" id="player-prediction" ${s.playerPrediction?'checked':''}></label>
    <label class="setting"><span>적 탄환 예상 경로</span><input type="checkbox" id="enemy-prediction" ${s.enemyPrediction?'checked':''}></label>
    <label class="setting"><span>효과음</span><input type="checkbox" id="sound-setting" ${s.sound?'checked':''}></label>
    <label class="setting"><span>전장 배경음</span><input type="checkbox" id="ambience-setting" ${s.ambience?'checked':''}></label>
    <label class="setting"><span>화면 흔들림</span><input type="checkbox" id="shake-setting" ${s.cameraShake?'checked':''}></label>
    <p class="muted">경로 표시는 각각 독립적으로 설정됩니다.</p><button id="close-settings" class="primary">돌아가기</button></div>`;
    document.querySelector('#player-prediction').onchange=e=>this.settings.set('playerPrediction',e.target.checked);
    document.querySelector('#enemy-prediction').onchange=e=>this.settings.set('enemyPrediction',e.target.checked);
    document.querySelector('#sound-setting').onchange=e=>{this.settings.set('sound',e.target.checked);this.audio.enabled=e.target.checked;if(e.target.checked)this.audio.unlock();};
    document.querySelector('#ambience-setting').onchange=e=>this.settings.set('ambience',e.target.checked);
    document.querySelector('#shake-setting').onchange=e=>this.settings.set('cameraShake',e.target.checked);
    document.querySelector('#close-settings').onclick=()=>this.closeSettings();
  }
  closeSettings(){this.settingsOpen=false;this.w.state=this.previousState;this.input.clear();this.overlay.innerHTML=this.savedMarkup;this.lastState='';const start=document.querySelector('#start');if(start)start.onclick=()=>this.start();this.update();}
  update(){
    const w=this.w,p=w.player,gun=w.weapon;
    document.querySelector('#health').style.width=`${p.hp/p.maxHp*100}%`;
    document.querySelector('#health-meter').setAttribute('aria-valuenow',Math.ceil(p.hp));
    document.querySelector('#ammo').textContent=p.unarmed?'비무장':`${String(gun.ammo).padStart(2,'0')} / ${gun.capacity}`;
    const caption=document.querySelector('#story-caption');
    caption.textContent=w.prologue&&w.state==='playing'?w.prologue.caption:'';
    caption.classList.toggle('hidden',!caption.textContent);
    document.querySelector('#ammo').style.color=gun.reloading?'#d4b77b':gun.ammo<=3?'#e39d83':'#e1dfd1';
    document.querySelector('#reload-progress').style.width=`${p.unarmed?0:(gun.reloading?1-gun.reloadRemaining/gun.reloadDuration:gun.ammo/gun.capacity)*100}%`;
    if(this.settingsOpen||w.state===this.lastState)return;
    this.lastState=w.state;this.overlay.classList.toggle('hidden',w.state==='playing');
    if(w.state==='playing'||w.state==='menu')return;
    const paused=w.state==='paused';
    this.overlay.innerHTML=`<div class="modal"><h2>${paused?'일시정지':w.state==='won'?'작전 완료':'작전 실패'}</h2><p>${paused?'이동 WASD · 사격 마우스 · 장전 R':`처치 ${w.kills} · ${Math.floor(w.time)}초`}</p><button id="resume" class="primary">${paused?'계속하기':'다시 시작'}</button></div>`;
    document.querySelector('#resume').onclick=()=>paused?this.pause():this.start();
  }
}
