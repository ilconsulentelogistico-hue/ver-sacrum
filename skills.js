(() => {
  'use strict';
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  Game.prototype.openSkills=function(id){
    if(!this.units.some(u=>u.id===id&&u.owner===0&&u.health>0)){this.message('Seleziona un abitante dalla Comunità.');return false;}
    const dialog=$('#skillsDialog');
    if(!dialog.open){this.pauseBeforeSkills=this.paused;this.backgroundDuringSkills=false;}
    this.skillsPersonId=id;this.pointerCancel();this.orderMode=null;this.buildMode=null;this.syncModeButtons();
    this.renderSkills();$('#skillsStatus').textContent='';if(!dialog.open)this.showManagement('skillsDialog');return true;
  };
  Game.prototype.setWorkshopMentor=function(apprenticeId,mentorId){
    const apprentice=this.units.find(u=>u.id===apprenticeId&&u.owner===0&&u.health>0);
    if(!apprentice)return 'Abitante non disponibile.';
    if(!mentorId){if(apprentice.task?.type==='follow-mentor')this.cancelTask(apprentice);apprentice.mentorId=null;return null;}
    const mentor=this.units.find(u=>u.id===mentorId&&u.owner===apprentice.owner&&u.health>0&&u!==apprentice);
    if(!mentor)return 'Maestro non disponibile.';
    if(apprentice.task?.type==='follow-mentor'&&apprentice.mentorId!==mentor.id)this.cancelTask(apprentice);
    apprentice.mentorId=mentor.id;return null;
  };
  Game.prototype.grantMentoredWorkXp=function(worker,skill,amount,peers){
    const mentor=worker.mentorId&&peers.find(other=>other!==worker&&other.id===worker.mentorId&&other.owner===worker.owner&&other.health>0&&(other.skills[skill]??1)>=(worker.skills[skill]??1)+2);
    worker.gain(skill,amount*(mentor?1.5:1));
  };
  Game.prototype.renderSkills=function(){
    const u=this.units.find(p=>p.id===this.skillsPersonId&&p.owner===0&&p.health>0);
    if(!u){$('#skillsIdentity').textContent='Persona non disponibile';$('#skillsList').innerHTML='';return;}
    $('#skillsIdentity').textContent=u.name+' · '+this.personOriginLabel(u)+' · '+(u.location.kind==='resident'?'Residente nel Distretto':'Sulla mappa');
    $('#skillsId').textContent='ID '+u.id;
    const mentors=this.units.filter(p=>p!==u&&p.owner===u.owner&&p.health>0);
    $('#skillsMentor').innerHTML='<option value="">Nessun maestro</option>'+mentors.map(p=>`<option value="${p.id}">${escape(p.name)}</option>`).join('');
    $('#skillsMentor').value=mentors.some(p=>p.id===u.mentorId)?u.mentorId:'';
    $('#skillsPeople').innerHTML=this.units.filter(p=>p.owner===0&&p.health>0).map(p=>`<option value="${p.id}">${escape(p.name)} · ${p.id.slice(0,8)}</option>`).join('');
    $('#skillsPeople').value=u.id;
    $('#skillsList').innerHTML=Object.entries(window.TERRA_SKILLS.labels).map(([key,label])=>{
      const level=u.skills[key],xp=u.xp[key]||0,needed=level*window.TERRA_SKILLS.xpPerLevel,capped=level>=window.TERRA_SKILLS.maxLevel;
      const percent=capped?100:Math.min(100,xp/needed*100);
      const effect=key==='transport'?`Con carico: +${Math.round((window.TERRA_SKILLS.transportFactor(level)-1)*100)}% velocità`:['milling','carpentry','baking','pottery','weaving','metallurgy','pressing'].includes(key)?`Lotti: +${Math.round((window.TERRA_SKILLS.productionFactor(level)-1)*100)}% velocità`:key==='herding'?`Latte: +${Math.round((window.TERRA_SKILLS.herdingFactor(level)-1)*100)}% resa`:key==='trading'?`Baratto: +${Math.round((window.TERRA_SKILLS.tradeFactor(level)-1)*100)}% valore offerta`:key==='healing'?`Ferite: +${(6+level*.5).toFixed(1)} salute per cura · una volta al giorno, 1 tessuto`:'';
      return `<article class="skill-row" data-skill="${key}"><header><b>${label}</b><span>Livello ${level} · ${capped?'massimo':Math.floor(xp)+'/'+needed+' XP'}</span></header>${effect?`<small class="skill-effect">${effect}</small>`:''}<div class="skill-track" aria-label="${label}: ${Math.round(percent)}% verso il prossimo livello"><i style="width:${percent}%"></i></div></article>`;
    }).join('');
    $('#skillsRules').textContent=`Parametri provvisori configurabili: soglia XP = livello × ${window.TERRA_SKILLS.xpPerLevel}; livello massimo ${window.TERRA_SKILLS.maxLevel}. Nessun blocco è attivo. Cura: un allievo libero assegnato a un curante almeno 2 livelli più esperto impara se assiste da vicino a una medicazione conclusa.`;
  };
  const initUI=Game.prototype.initUI;
  Game.prototype.initUI=function(){
    initUI.call(this);const dialog=$('#skillsDialog');
    $('#skillsBtn').onclick=()=>this.openSkills(this.selected?.id);
    $('#skillsPeople').onchange=()=>{this.skillsPersonId=$('#skillsPeople').value;this.renderSkills();$('#skillsStatus').textContent='';};
    $('#setSkillsMentor').onclick=()=>{const error=this.setWorkshopMentor(this.skillsPersonId,$('#skillsMentor').value);$('#skillsStatus').textContent=error||'Maestro aggiornato.';if(!error&&!this.save(true))$('#skillsStatus').textContent+=' Salvataggio non riuscito.';this.renderSkills();};
    $('#closeSkills').onclick=()=>this.closeManagement();
    dialog.addEventListener('close',()=>{this.skillsPersonId=null;if(!this.suspended&&!this.backgroundDuringSkills)this.setPaused(this.pauseBeforeSkills);this.backgroundDuringSkills=false;});
  };
  const suspend=Game.prototype.suspend;
  Game.prototype.suspend=function(){if($('#skillsDialog').open)this.backgroundDuringSkills=true;suspend.call(this);};
})();

