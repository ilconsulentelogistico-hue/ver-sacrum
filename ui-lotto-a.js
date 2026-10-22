// UI/UX Lotto A: contextual orders, build reasons and controls kept in the HUD.
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const buttons=(selector)=>[...document.querySelectorAll(selector)];
  const isWorldPerson=u=>u instanceof Unit&&u.owner===0&&u.health>0&&u.location?.kind==='world';
  const showButton=(button,show,reason='')=>{
    button.hidden=!show;
    button.disabled=!!reason;
    button.dataset.uiReason=reason;
    const span=button.querySelector?.('span');
    if(span){button.dataset.uiHelp??=span.textContent;span.textContent=reason||button.dataset.uiHelp;}
    button.title=reason;
    button.setAttribute('aria-disabled',String(!!reason));
  };
  const visible=(game,e)=>{
    const p=game.worldToScreen(e.x*TILE,e.y*TILE);
    return p.x>=-24&&p.y>=-24&&p.x<=game.viewW+24&&p.y<=game.viewH+24;
  };
  Game.prototype.refreshLottoAControls=function(){
    const group=(this.rtsSelectedUnits?.()||[]).filter(isWorldPerson);
    const selected=group[0];
    const ownBuilding=b=>b.owner===0&&b.alive&&b.built;
    const buildings=this.buildings.filter(ownBuilding);
    const farms=buildings.filter(b=>b.type==='farm');
    const houses=buildings.filter(b=>b.type==='house');
    const towers=buildings.filter(b=>b.type==='tower');
    const warehouses=buildings.filter(b=>b.type==='warehouse');
    const sheep=this.animals.some(a=>a.type==='sheep'&&a.owner===-1&&a.health>0&&visible(this,a));
    const threats=this.raiders.some(r=>r.health>0&&visible(this,r))||this.animals.some(a=>a.type==='wolf'&&a.health>0&&visible(this,a))||(this.warCamps||[]).some(c=>c.health>0&&visible(this,c));
    const wounded=this.units.some(u=>u.owner===0&&u.health>0&&u.health<u.maxHealth-(u.nutritionDamage||0));
    const stock=this.communalStock?.()||this.stock||{};
    const cloth=(stock.cloth||0)+group.reduce((n,u)=>n+(u.inventory?.type==='cloth'?u.inventory.amount:0),0);
    const base=buildings.find(b=>b.type==='base');
    const guardCandidates=group.length>0&&group.every(u=>u.mobilized);
    const guardReason=!guardCandidates?'Seleziona solo persone arruolate.':group.some(u=>(u.morale??70)<25||u.health<=35)?'Salute o morale insufficienti.':group.some(u=>base&&dist(u,base)>18)?'Avvicina alla Casa comune.':'';
    const orders={
      move:[false,''],gather:[false,''],
      farm:[true,farms.length?'':'Costruisci prima un campo.'],
      enter:[houses.length>0,houses.some(b=>b.residents.length<5)?'':'Tutti i Distretti sono pieni.'],
      tame:[sheep,''],attack:[threats,''],
      heal:[wounded,cloth>0?'':'Manca 1 tessuto per curare.'],
      'healer-duty':[group.length===1&&(wounded||!!selected?.healerDuty),!selected?.mobilized?(selected?.inventory?.amount&&selected.inventory.type!=='cloth'?'Consegna prima il carico.':''):'Non disponibile per persone arruolate.'],
      'follow-mentor':[group.length===1&&!!selected?.mentorId,this.units.some(u=>u.id===selected?.mentorId&&u.health>0&&u.location?.kind==='world')?'':'Il maestro deve essere sulla mappa.'],
      'guard-duty':[guardCandidates,guardReason],
      'tower-duty':[group.length===1&&!!selected?.mobilized&&towers.length>0,towers.some(b=>!this.units.some(u=>u.guardDuty&&u.guardPostId===b.id))?'':'Tutte le torri sono presidiate.'],
      'warehouse-duty':[group.length===1&&!!selected?.mobilized&&warehouses.length>0,warehouses.some(b=>!this.units.some(u=>u.guardDuty&&u.guardPostId===b.id))?'':'Tutti i magazzini sono sorvegliati.'],
      deliver:[group.some(u=>u.inventory?.amount>0),''],
      cancel:[true,group.some(u=>u.task||u.guardDuty||u.healerDuty)?'':'Nessun compito da annullare.']
    };
    for(const button of buttons('[data-order]')){
      const [show,reason]=orders[button.dataset.order]||[true,''];
      showButton(button,group.length>0&&show,reason);
    }
    const communityBase=this.selected instanceof Building&&this.selected.type==='base'&&this.selected.owner===0&&this.selected.alive;
    const builder=this.selected instanceof Unit&&isWorldPerson(this.selected)?this.selected:communityBase?this.chooseCommunityBuilder?.():this.lastSelectedUnit;
    for(const button of buttons('[data-build]')){
      const type=button.dataset.build,cost=type==='road'?{wood:1}:BUILD_COSTS[type];
      let reason='';
      if(!builder||!isWorldPerson(builder))reason='Serve un costruttore sulla mappa.';
      else if(!this.constructionCheck(type,builder).ok)reason=this.constructionRequirementText(type,builder);
      else if(cost){const missing=Object.entries(cost).filter(([item,amount])=>(stock[item]||0)<amount).map(([item,amount])=>`${item==='wood'?'legno':item==='stone'?'pietra':item}: ${amount-(stock[item]||0)}`);if(missing.length)reason=`Materiali mancanti: ${missing.join(', ')}.`;}
      showButton(button,!!group.length||communityBase,reason);
    }
    const idle=this.idlePeople?.().length||0,button=$('idleCountBtn');
    if(button){button.textContent=`${idle} ${idle===1?'libero':'liberi'}`;button.disabled=idle===0;button.title=idle?'Seleziona il prossimo abitante libero.':'Tutti al lavoro.';button.setAttribute('aria-label',idle?`${idle} abitanti liberi. Tocca per selezionare il prossimo.`:'Tutti al lavoro.');}
  };
  const refreshSessionState=Game.prototype.refreshSessionState;
  Game.prototype.refreshSessionState=function(){refreshSessionState.call(this);$('pauseNotice')?.classList.add('hidden');};
  const updateUI=Game.prototype.updateUI;
  Game.prototype.updateUI=function(){const result=updateUI.call(this);this.refreshLottoAControls();return result;};
  Game.prototype.toggleGroupGuardDuty=function(){
    const group=(this.rtsSelectedUnits?.()||[]).filter(isWorldPerson);
    if(!group.length||group.some(u=>!u.mobilized)){this.message('Seleziona solo persone arruolate.');return false;}
    const base=this.buildings.find(b=>b.owner===0&&b.type==='base'&&b.alive);
    const allAtBase=group.every(u=>u.guardDuty&&u.guardPostId===base?.id);
    const errors=[];
    for(const u of group){
      if(allAtBase){this.toggleGuardDuty(u);continue;}
      if(u.guardDuty&&u.guardPostId!==base?.id)this.cancelTask(u);
      if(!u.guardDuty){const error=this.toggleGuardDuty(u);if(error)errors.push(`${u.name}: ${error}`);}
    }
    this.orderMode=null;this.syncModeButtons();this.updateUI();
    this.message(errors.length?errors.join(' '):`${group.length} persone ${allAtBase?'lasciano la guardia':'presidiano la Casa comune'}.`);
    return errors.length===0;
  };
  const initUI=Game.prototype.initUI;
  Game.prototype.initUI=function(){
    initUI.call(this);
    const idle=$('idleCountBtn');if(idle)idle.onclick=()=>this.selectNextIdle();
    const guard=document.querySelector('[data-order="guard-duty"]');
    if(guard)guard.onclick=()=>this.toggleGroupGuardDuty();
  };
})();
