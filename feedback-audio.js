// Quiet, optional cues for consequential game events. No audio files or autoplay.
(() => {
  "use strict";
  const KEY="ver-sacrum-sound-muted-v1";
  const NOTES={build:[[330,0,.09],[440,.1,.12]],treaty:[[392,0,.1],[523,.12,.17]],danger:[[196,0,.14],[174,.16,.19]],win:[[392,0,.11],[523,.13,.11],[659,.26,.24]],loss:[[294,0,.14],[247,.16,.14],[196,.33,.2]]};
  let context=null,lastCueAt=-Infinity;
  Game.prototype.playCue=function(kind){
    if(this.audioMuted||!NOTES[kind])return false;
    const Ctor=window.AudioContext||window.webkitAudioContext;if(!Ctor)return false;
    const now=performance.now();if(now-lastCueAt<110)return false;lastCueAt=now;
    try{
      context??=new Ctor();
      if(context.state==="suspended")context.resume().catch(()=>{});
      for(const [frequency,offset,duration] of NOTES[kind]){
        const oscillator=context.createOscillator(),gain=context.createGain(),start=context.currentTime+offset;
        oscillator.type="triangle";oscillator.frequency.value=frequency;
        gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.034,start+.018);
        gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
        oscillator.connect(gain);gain.connect(context.destination);oscillator.start(start);oscillator.stop(start+duration+.02);
      }
      return true;
    }catch{return false;}
  };
  const init=Game.prototype.initUI;
  Game.prototype.initUI=function(){
    init.call(this);
    try{this.audioMuted=localStorage.getItem(KEY)==="1";}catch{this.audioMuted=false;}
    const button=$("#soundToggle"),supported=!!(window.AudioContext||window.webkitAudioContext);
    const update=()=>{button.textContent=supported?`Suoni: ${this.audioMuted?"spenti":"attivi"}`:"Suoni non disponibili";button.disabled=!supported;button.setAttribute("aria-pressed",String(supported&&!this.audioMuted));};
    button.onclick=()=>{if(!supported)return;this.audioMuted=!this.audioMuted;try{localStorage.setItem(KEY,this.audioMuted?"1":"0");}catch{}update();if(!this.audioMuted)this.playCue("treaty");};
    update();
  };
  const start=Game.prototype.finishStartExperience;Game.prototype.finishStartExperience=function(){const result=start.call(this);this.playCue("build");return result;};
  const diplomacy=Game.prototype.diplomacyAction;Game.prototype.diplomacyAction=function(owner,kind,id){const result=diplomacy.call(this,owner,kind,id);if(result?.ok&&!result.replayed&&["alliance","integrate"].includes(kind))this.playCue("treaty");return result;};
  const assault=Game.prototype.beginVillageAssault;Game.prototype.beginVillageAssault=function(person,base){const result=assault.call(this,person,base);if(result)this.playCue("danger");return result;};
  const surrender=Game.prototype.demandVillageSurrender;Game.prototype.demandVillageSurrender=function(base,id){const result=surrender.call(this,base,id);if(result?.ok&&!result.replayed)this.playCue("treaty");return result;};
  const raid=Game.prototype.spawnRaid;Game.prototype.spawnRaid=function(){const before=this.raiders.length,result=raid.call(this);if(this.raiders.length>before)this.playCue("danger");return result;};
  const end=Game.prototype.endGame;Game.prototype.endGame=function(result){if(!this.gameEnded)this.playCue(result==="victory"?"win":"loss");return end.call(this,result);};
})();
