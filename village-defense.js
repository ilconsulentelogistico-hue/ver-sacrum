// A declared assault mobilizes real villagers; ownership changes in a separate step.
(() => {
  'use strict';
  const attackable=base=>base instanceof Building&&base.type==='base'&&base.alive&&base.built&&[1,2].includes(base.owner);
  Game.prototype.beginVillageAssault=function(u,base){
    if(!attackable(base)||!u||u.owner!==0||u.health<=0||!u.mobilized||u.location?.kind!=='world'){this.message('Per assaltare un villaggio servono abitanti mobilitati e una casa comune ostile.');return false;}
    const path=this.pathToBuilding(u,base);if(path===null){this.message('Nessun percorso praticabile verso il villaggio.');return false;}
    this.cancelTask(u);u.task={type:'attack',target:base.id,siege:true};u.state='combat';u.path=path;
    base.resistance=Math.max(base.resistance||0,75);base.integrationSinceDay=null;base.siegeDefenderIds=null;base.siegeReadyDay=null;this.ensurePolitics();
    this.message(`${u.name} avanza verso ${base.factionName||'il villaggio'}: gli abitanti chiameranno i difensori.`);return true;
  };
  Game.prototype.summonVillageDefenders=function(base,attacker){
    if(Array.isArray(base.siegeDefenderIds))return this.units.filter(u=>base.siegeDefenderIds.includes(u.id)&&u.health>30&&u.task?.defendSettlementId===base.id);
    const ready=[],candidates=this.units.filter(u=>u.owner===base.owner&&u.health>30&&(u.morale??70)>=25&&!u.task?.defendSettlementId)
      .sort((a,b)=>(a.task?1:0)-(b.task?1:0)||Math.hypot(a.x-base.x,a.y-base.y)-Math.hypot(b.x-base.x,b.y-base.y));
    for(const u of candidates){if(ready.length>=2)break;
      if(u.location?.kind==='resident'&&!this.releaseResident(u.id))continue;
      const previous=u.task?.type==='farm'||u.task?.type==='production'?{...u.task}:null;
      this.cancelTask(u);u.task={type:'attack',target:attacker.id,defendSettlementId:base.id,returnTask:previous};u.state='combat';u.path=[];ready.push(u);
    }
    base.siegeDefenderIds=ready.map(u=>u.id);
    return ready;
  };
  Game.prototype.finishVillageDefense=function(u){const previous=u.task?.returnTask;this.cancelTask(u);if(previous?.type==='farm'){const farm=this.findById(this.buildings,previous.target);if(farm?.alive&&farm.owner===u.owner)this.assignFarm(u,farm);}else if(previous?.type==='production'){const workshop=this.findById(this.buildings,previous.target);if(workshop?.alive&&workshop.owner===u.owner)this.assignProduction(u,workshop);}else if(u.homeVillageId){const home=this.findById(this.buildings,u.homeVillageId);if(home?.alive&&home.owner===u.owner)this.assignEnter(u,home);}};
  const oldCombat=Game.prototype.combatTick;
  Game.prototype.combatTick=function(u,dt){const task=u.task;
    if(task?.siege){const base=this.findById(this.buildings,task.target);if(!attackable(base)){this.cancelTask(u);return;}if(dist(u,base)>2){if(!u.path.length)u.path=this.pathToBuilding(u,base)||[];this.followPath(u,dt,1.7);return;}
      const defenders=this.summonVillageDefenders(base,u);if(!defenders.length){base.siegeReadyDay=this.totalDays;this.cancelTask(u);this.message('Difesa respinta: seleziona la casa comune e chiedi la resa con un mobilitato vicino.');return;}
      const nearest=defenders.sort((a,b)=>dist(u,a)-dist(u,b))[0];u.task={type:'attack',target:nearest.id,siegeBaseId:base.id};u.path=[];return;
    }
    if(task?.defendSettlementId&&u.health<=30){this.finishVillageDefense(u);return;}
    if(task?.siegeBaseId||task?.defendSettlementId){const target=this.findById(this.units,task.target),base=this.findById(this.buildings,task.siegeBaseId||task.defendSettlementId);
      if(!target||target.health<=0||!base?.alive||task.siegeBaseId&&target.task?.defendSettlementId!==base.id||task.defendSettlementId&&target.task?.siegeBaseId!==base.id&&target.task?.target!==base.id){if(task.siegeBaseId&&base?.alive){u.task={type:'attack',target:base.id,siege:true};u.path=[];}else this.finishVillageDefense(u);return;}
      const d=dist(u,target);if(d>1.15){if(!u.path.length||d>2)u.path=this.findPath(u.x,u.y,Math.floor(target.x),Math.floor(target.y),1);this.followPath(u,dt,1.7);}
      else if(u.attackCooldown<=0){u.attackCooldown=.85;target.health-=this.personCombatDamage(target,this.personAttackDamage(u,6+u.skills.combat*2+u.strength*.15));u.gain('combat',1);}return;
    }
    return oldCombat.call(this,u,dt);
  };
  Game.prototype.demandVillageSurrender=function(base,transactionId){
    if(typeof transactionId!=='string'||!transactionId)return{ok:false,error:'Resa non valida.'};
    const existing=base?.diplomacyLedger?.find(x=>x.id===transactionId);if(existing)return{...existing,replayed:true};
    if(!attackable(base))return{ok:false,error:'Resa non valida.'};this.ensurePolitics();
    if(!Number.isFinite(base.siegeReadyDay)||this.totalDays-base.siegeReadyDay>30||!Array.isArray(base.siegeDefenderIds))return{ok:false,error:'La difesa non è stata ancora respinta, oppure l’assedio è scaduto.'};
    const active=this.units.some(u=>base.siegeDefenderIds.includes(u.id)&&u.health>30&&u.task?.defendSettlementId===base.id);
    if(active)return{ok:false,error:'I difensori stanno ancora combattendo.'};
    const force=this.units.find(u=>u.owner===0&&u.health>0&&u.mobilized&&u.location?.kind==='world'&&dist(u,base)<=2.5);
    if(!force)return{ok:false,error:'Serve un assalitore mobilitato vicino alla casa comune.'};
    const result=this.transferNeutralSettlement(base.owner,'military-surrender',transactionId);if(result.ok)this.message(`${base.factionName||'Il villaggio'} si arrende: persone e beni restano nella comunità.`);return result;
  };
  const oldSelection=Game.prototype.selectionHTML;
  Game.prototype.selectionHTML=function(e){let html=oldSelection.call(this,e);if(attackable(e)&&Number.isFinite(e.siegeReadyDay)&&this.totalDays-e.siegeReadyDay<=30)html+='<button id="demandVillageSurrender" type="button">Chiedi resa militare</button>';return html;};
  const oldUI=Game.prototype.updateUI;
  Game.prototype.updateUI=function(){oldUI.call(this);const button=$('#demandVillageSurrender');if(button)button.onclick=()=>{const base=this.selected,transactionId=crypto.randomUUID?.()||`resa-${Date.now()}`,result=this.demandVillageSurrender(base,transactionId);this.message(result.ok?'Resa del villaggio registrata.':result.error);if(result.ok)this.save(true);this.updateUI();};};
  const oldOrder=Game.prototype.applyOrder;
  Game.prototype.applyOrder=function(o,pos,tx,ty,u=this.selected){if(o==='attack'){const base=this.nearestAt(this.buildings,pos,.9,attackable);if(base){this.beginVillageAssault(u,base);this.orderMode=null;this.syncModeButtons();this.updateUI();return;}}return oldOrder.call(this,o,pos,tx,ty,u);};
  const oldContext=Game.prototype.rtsContextTap;
  Game.prototype.rtsContextTap=function(sx,sy){const w=this.screenToWorld(sx,sy),pos={x:w.x/TILE,y:w.y/TILE},base=this.nearestAt(this.buildings,pos,.65,attackable),group=this.rtsSelectedUnits?.()||[];if(base&&group.length){let sent=0;for(const u of group)if(this.beginVillageAssault(u,base))sent++;this.message(`${sent} abitanti mobilitati avanzano verso il villaggio.`);return;}return oldContext.call(this,sx,sy);};
  const oldHelp=Game.prototype.orderHelp;Game.prototype.orderHelp=function(o){return o==='attack'?'Tocca un lupo, un razziatore, un campo ostile o una casa comune da assaltare con abitanti mobilitati.':oldHelp.call(this,o);};
})();
