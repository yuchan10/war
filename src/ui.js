import { enterFullscreen } from './fullscreen.js';
import { bodyStatusMarkup } from './body-status.js';
export class UI {
  constructor(world,input,audio,settings){
    this.w=world;this.input=input;this.audio=audio;this.settings=settings;
    this.overlay=document.querySelector('#overlay');this.lastState='';this.settingsOpen=false;
    this.audio.enabled=settings.values.sound;
    document.querySelector('#start').onclick=()=>this.start();
    document.querySelector('#settings').onclick=()=>this.openSettings();
    document.querySelector('#skip-prologue').onclick=()=>{
      if(this.w.skipPrologue()){this.input.clear();this.update();}
    };
  }
  start(){enterFullscreen();this.audio.unlock();this.input.clear();this.w.startPrologue();this.update();}
  toggleSound(){this.audio.enabled=!this.audio.enabled;this.settings.set('sound',this.audio.enabled);if(this.audio.enabled)this.audio.unlock();}
  toggleSettings(){if(this.settingsOpen)this.closeSettings();else this.openSettings();}
  openSettings(){
    if(this.settingsOpen)return;
    this.previousState=this.w.state;this.w.state='settings';this.settingsOpen=true;this.input.clear();
    this.savedMarkup=this.overlay.innerHTML;this.overlay.classList.remove('hidden','start-screen');const s=this.settings.values;
    this.overlay.innerHTML=`<div class="modal settings-panel"><h2>설정</h2>
    <label class="setting"><span>적 시야 범위</span><input type="checkbox" id="enemy-vision" ${s.enemyVision?'checked':''}></label>
    <label class="setting"><span>적 히트박스 보기</span><input type="checkbox" id="enemy-hitboxes" ${s.enemyHitboxes?'checked':''}></label>
    <label class="setting"><span>내 탄환 예상 경로</span><input type="checkbox" id="player-prediction" ${s.playerPrediction?'checked':''}></label>
    <label class="setting"><span>적 탄환 예상 경로</span><input type="checkbox" id="enemy-prediction" ${s.enemyPrediction?'checked':''}></label>
    <label class="setting"><span>효과음</span><input type="checkbox" id="sound-setting" ${s.sound?'checked':''}></label>
    <label class="setting"><span>전장 배경음</span><input type="checkbox" id="ambience-setting" ${s.ambience?'checked':''}></label>
    <label class="setting"><span>화면 흔들림</span><input type="checkbox" id="shake-setting" ${s.cameraShake?'checked':''}></label>
    <p class="muted">경로 표시는 각각 독립적으로 설정됩니다.</p><button id="close-settings" class="primary">돌아가기</button></div>`;
    document.querySelector('#enemy-vision').onchange=e=>this.settings.set('enemyVision',e.target.checked);
    document.querySelector('#enemy-hitboxes').onchange=e=>this.settings.set('enemyHitboxes',e.target.checked);
    document.querySelector('#player-prediction').onchange=e=>this.settings.set('playerPrediction',e.target.checked);
    document.querySelector('#enemy-prediction').onchange=e=>this.settings.set('enemyPrediction',e.target.checked);
    document.querySelector('#sound-setting').onchange=e=>{this.settings.set('sound',e.target.checked);this.audio.enabled=e.target.checked;if(e.target.checked)this.audio.unlock();};
    document.querySelector('#ambience-setting').onchange=e=>this.settings.set('ambience',e.target.checked);
    document.querySelector('#shake-setting').onchange=e=>this.settings.set('cameraShake',e.target.checked);
    document.querySelector('#close-settings').onclick=()=>this.closeSettings();
  }
  closeSettings(){if(this.previousState==='playing')enterFullscreen();this.settingsOpen=false;this.w.state=this.previousState;this.input.clear();this.overlay.innerHTML=this.savedMarkup;this.lastState='';const start=document.querySelector('#start');if(start)start.onclick=()=>this.start();this.update();}
  update(){
    const w=this.w,p=w.player,gun=w.weapon;
    document.querySelector('#skip-prologue').classList.toggle('hidden',w.state!=='playing'||w.prologue?.phase!=='witness');
    document.querySelector('#body-status').innerHTML=bodyStatusMarkup(p,w.time);
    document.querySelector('#body-panel').classList.toggle('hidden',w.state!=='playing');
    document.querySelector('#loot-hint').textContent=w.pickups.changing?'E 누른 채 정지 · 놓으면 교체 취소':w.pickups.available(p,w.walls,gun)?'E · 탄약 획득 / 길게 눌러 방어구 교체 (부위당 2.5초)':'';
    document.querySelector('#ammo').textContent=p.armsDisabled?'사격 불가':p.knifeEquipped?'전투용 칼':p.unarmed?'비무장':`${String(gun.ammo).padStart(2,'0')} / ${gun.reserve}`;
    const grenades=document.querySelector('#grenade-ammo');if(grenades)grenades.textContent=p.hasRifle?`G · 수류탄 ${w.grenadeAmmo}`:'';
    const caption=document.querySelector('#story-caption');
    caption.textContent=w.state==='playing'?(w.prologue?w.prologue.caption:(w.time-w.stageStartedAt<7?`${w.stage.name} · ${w.stage.strategy}`:'')):'';
    caption.classList.toggle('hidden',!caption.textContent);
    document.querySelector('#ammo').style.color=p.knifeEquipped?'#e1dfd1':gun.reloading?'#d4b77b':gun.ammo<=3?'#e39d83':'#e1dfd1';
    document.querySelector('#reload-progress').style.width=`${p.unarmed?0:(gun.reloading?1-gun.reloadRemaining/gun.reloadDuration:gun.ammo/gun.capacity)*100}%`;
    document.querySelector('.controls').classList.toggle('hidden',w.state!=='playing');
    document.querySelector('.combat-hud').classList.toggle('hidden',w.state!=='playing');
    const displayState=w.state==='dead'&&w.deathRemaining>0?'dying':w.state;
    if(this.settingsOpen||displayState===this.lastState)return;
    this.overlay.classList.toggle('start-screen',w.state==='menu');
    this.lastState=displayState;this.overlay.classList.toggle('hidden',displayState==='playing'||displayState==='dying');
    if(displayState==='playing'||displayState==='menu'||displayState==='dying')return;
    this.overlay.innerHTML=`<div class="modal"><h2>${w.state==='won'?'작전 완료':'작전 실패'}</h2><p>처치 ${w.kills} · ${Math.floor(w.time)}초</p><button id="resume" class="primary">다시 시작</button></div>`;
    document.querySelector('#resume').onclick=()=>this.start();
  }
}
