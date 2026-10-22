// One selection, one dock. Management views never acquire modal focus or pause time.
(() => {
  'use strict';
  const panels=['overview','orders','build','characterDialog','skillsDialog','knowledgeDialog','communityDialog','logisticsDialog','linksDialog','tradeDialog','politicsDialog'];
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  Game.prototype.contextTabs=function(){
    const e=this.selected;
    if(!e)return [];
    const tabs=['overview'];
    if(e.owner!==0)return tabs;
    if(e instanceof Unit){
      if(this.rtsSelectedUnits().length>1)return [...tabs,'orders','build'];
      if(e.location.kind==='world')tabs.push('orders','build','logisticsDialog');
      return [...tabs,'characterDialog','skillsDialog','knowledgeDialog'];
    }
    if(e instanceof Building){
      if(e.type==='house'||e.type==='base')tabs.push('communityDialog');
      if(e.inventory)tabs.push('logisticsDialog');
      tabs.push('linksDialog');
      if(e.type==='market'&&e.built)tabs.push('tradeDialog');
      if(e.type==='base')tabs.push('politicsDialog');
    }
    return tabs;
  };
  Game.prototype.contextPeople=function(){
    const e=this.selected,own=this.units.filter(u=>u.owner===0&&u.health>0);
    return e instanceof Building&&e.type==='house'?this.villagePeople(e):own;
  };
  Game.prototype.showManagement=function(id){
    if(!this.contextTabs().includes(id))return false;
    this.refreshContextDock();this.contextPanel=id;
    this.buildMode=null;this.buildPreview=null;this.orderMode=null;
    this.syncModeButtons();this.refreshContextDock();
    $('#contextBody').scrollTop=0;
    return true;
  };
  Game.prototype.closeManagement=function(){
    this.contextPanel='overview';
    this.characterPersonId=null;this.characterExpected=null;this.skillsPersonId=null;this.knowledgePersonId=null;
    this.refreshContextDock();
  };
  Game.prototype.activateContextTab=function(id){
    if(!this.contextTabs().includes(id))return;
    this.refreshContextDock();this.contextPanel=id;
    this.orderMode=null;this.buildMode=null;this.buildPreview=null;this.pointerCancel();this.syncModeButtons();
    if(id==='characterDialog')this.openCharacter(this.selected.id);
    else if(id==='skillsDialog')this.openSkills(this.selected.id);
    else if(id==='knowledgeDialog')this.openKnowledge(this.selected.id);
    else if(id==='linksDialog')this.openLinks(this.selected);
    else if(id==='tradeDialog')this.openTrade();
    else if(id==='logisticsDialog'){this.renderLogistics();this.showManagement(id);}
    else if(id==='communityDialog'){this.renderCommunity();this.showManagement(id);}
    else if(id==='politicsDialog'){this.renderPolitics();this.showManagement(id);}
    this.refreshContextDock();$('#contextBody').scrollTop=0;
  };
  Game.prototype.refreshContextDock=function(){
    const e=this.selected,tabs=this.contextTabs(),group=e instanceof Unit?this.rtsSelectedUnits():[];
    const signature=(e?.id||'')+':'+(group.length>1?group.map(u=>u.id).sort().join(','):'single');
    if(this.contextSelection!==signature){
      this.contextSelection=signature;this.contextPanel='overview';
      this.characterPersonId=null;this.characterExpected=null;this.skillsPersonId=null;this.knowledgePersonId=null;
      $('#contextBody').scrollTop=0;
    }
    if(!tabs.includes(this.contextPanel))this.contextPanel='overview';
    $('#commandDock').hidden=!e||!!this.startExperienceStage;
    $('#contextTitle').textContent=group.length>1?`${group.length} abitanti selezionati`:e instanceof Unit?e.name:e instanceof Building?BUILD_LABEL[e.type]:e instanceof ResourceNode?this.resourceName(e.type):e instanceof Animal?(e.type==='wolf'?'Lupo':'Animale'):'Selezione';
    for(const id of panels){
      const active=!!e&&id===this.contextPanel,tab=$('#tab-'+id),panel=$('#'+id);
      tab.hidden=!tabs.includes(id);tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));
      panel.hidden=!active;panel.classList.toggle('active',active);
      if(id.endsWith('Dialog'))panel.open=active; // legacy lifecycle readers; no dialog API
    }
    $('#placementStatus').hidden=!this.buildMode;
    $('#placementLabel').textContent=this.buildMode?`${BUILD_LABEL[this.buildMode]||'Sentiero'} · tieni premuto, poi rilascia`:'';
    const layout=`${!!e}:${this.contextPanel}:${!!this.buildMode}`;
    if(this.contextLayout!==layout)this.contextLayout=layout;
  };
  // Programmatic entry points follow the same selected identity as the map.
  for(const [method,collection] of [['openCharacter','units'],['openSkills','units'],['openKnowledge','units'],['openLinks','buildings']]){
    const open=Game.prototype[method];
    Game.prototype[method]=function(target){
      const entity=collection==='units'?this.units.find(u=>u.id===target&&u.owner===0&&u.health>0):(target||this.selected);
      if(entity){
        if(this.selected!==entity){this.selected=entity;this.groupSelection=entity instanceof Unit&&entity.location.kind==='world'?[entity]:[];for(const u of this.units)u.selected=this.groupSelection.includes(u);}
        this.refreshContextDock();
      }
      return open.call(this,target);
    };
  }
  const init=Game.prototype.initUI;
  Game.prototype.initUI=function(){
    init.call(this);
    for(const id of panels)$('#tab-'+id).onclick=()=>this.activateContextTab(id);
    $('#clearSelection').onclick=()=>{
      this.selected=null;this.groupSelection=[];for(const u of this.units)u.selected=false;
      this.orderMode=null;this.buildMode=null;this.buildPreview=null;this.pointerCancel();this.syncModeButtons();this.updateUI();
    };
    $('#cancelPlacement').onclick=()=>{this.cancelBuildPlacement();this.updateUI();};
    // Selectors describe the selected object, never silently redirect its editor.
    for(const id of ['characterPeople','skillsPeople','knowledgePeople','linkBuilding']){
      $('#'+id).disabled=true;$('#'+id).closest?.('label')?.setAttribute('hidden','');
    }
    $('#gameMenu').addEventListener('click',e=>{if(e.target.closest?.('button')&&e.target.closest('button').id!=='pauseBtn')$('#gameMenu').open=false;});
    if(typeof ResizeObserver!=='undefined'){
      this.dockResizeObserver=new ResizeObserver(()=>this.resize());this.dockResizeObserver.observe(this.wrap);
    }
  };
  const ui=Game.prototype.updateUI;
  Game.prototype.updateUI=function(){
    // Reject stale selection when an entity dies or disappears, but keep renewable empty spots.
    if(this.selected&&(this.selected.health<=0||this.selected.alive===false||this.selected.cleared))this.selected=null;
    ui.call(this);this.refreshContextDock();
    if(this.contextPanel==='logisticsDialog')this.refreshContextInventory();
    if(this.contextPanel==='tradeDialog')this.updateTradePreview();
  };
  const selection=Game.prototype.selectionHTML;
  Game.prototype.selectionHTML=function(e){
    const group=e instanceof Unit?this.rtsSelectedUnits():[];
    if(group.length>1)return `<h3>${group.length} abitanti</h3><p>${group.map(u=>escape(u.name)).join(' · ')}</p><p>Gli ordini si applicano all’intero gruppo.</p>`;
    let html=selection.call(this,e).replace(/<button id="openLinks"[^>]*>.*?<\/button>/,'').replace('usa Mondo → Filiera','scheda Scorte e lavori');
    if(e instanceof Unit)html+=`<p>Salute ${Math.ceil(e.health)}/${e.maxHealth} · Carico ${e.inventory.amount}/${e.inventory.cap}${e.inventory.amount?' '+escape(this.resourceName(e.inventory.type)):''}</p>`;
    if(e instanceof Building&&e.type==='house')html+=`<p>Cibo disponibile ${this.populationFood(e)} · ${escape(this.admissionBlocker(e)||`crescita ${e.birthDays||0}/150 giorni`)}</p>`;
    if(e instanceof ResourceNode){
      const state=e.amount<=0?'vuoto':e.amount>=e.max?'intatto':e.amount>e.max*.35?'quasi pieno':'quasi vuoto';
      html+=`<p>Spot ${state}${e.regrowing?' · in ricrescita':''}${e.renewable&&e.amount<=0?` · ricrescita fra ${Math.max(0,(e.regrowDelay||0)-(this.totalDays-(e.depletedAt??this.totalDays)))} giorni`:e.renewable?'':' · non rigenerabile'}</p>`;
    }
    if(e instanceof Building&&e.type==='warehouse')html+=`<p>${this.linkedBuildings(e,'base').length?'Collegato al totem: materiali disponibili per la comunità.':'Non collegato al totem: scorte solo locali.'}</p>`;
    if(e instanceof Building&&e.type==='market'){
      const people=this.linkedBuildings(e,'house').reduce((n,b)=>n+this.villagePeople(b).length,0);
      html+=`<p>Rifornisce ${people} abitanti nei villaggi collegati · ${this.linkedBuildings(e).filter(b=>TERRA_RECIPES[b.type]).length} strutture di lavorazione.</p>`;
      const caravans=this.units.filter(u=>u.task?.type==='caravan'&&u.task.source===e.id);
      html+=caravans.map(u=>`<p>${escape(u.name)} · ${escape(this.unitStatus(u))}</p>`).join('');
    }
    if(e instanceof Building&&e.batch)html+=`<p>Lotto: ${Object.entries(e.batch.outputs||{}).map(([k,n])=>`${n} ${escape(this.resourceName(k))}`).join(' · ')} · ${Math.ceil(e.batch.remaining)} s di lavorazione residui.</p>`;
    return html;
  };
  Game.prototype.refreshContextInventory=function(){
    const e=this.selected;
    const stores=this.buildings.filter(b=>b.alive&&b.owner===0&&(e instanceof Building?b===e:e instanceof Unit&&Math.hypot(b.x-e.x,b.y-e.y)<=2));
    $('#inventoryList').innerHTML=stores.map(b=>`<article><b>${BUILD_LABEL[b.type]}</b><span>${Object.entries(b.inventory?.items||{}).filter(([,n])=>n>0).map(([k,n])=>`${escape(this.resourceName(k))}: ${n}`).join(' · ')||'Scorte vuote'}</span>${b.batch?`<span>Lotto in corso · ${Math.ceil(b.batch.remaining)} s di lavorazione residui</span>`:''}</article>`).join('')||'<p>Nessuna struttura locale entro 2 tile.</p>';
  };
  const logistics=Game.prototype.renderLogistics;
  Game.prototype.renderLogistics=function(){
    logistics.call(this);
    const e=this.selected;
    const lock=(id,entity,label)=>{const node=$('#'+id);node.disabled=!!entity;if(entity){node.innerHTML=`<option value="${entity.id}">${escape(label)}</option>`;node.value=entity.id;}};
    lock('carrierSelect',e instanceof Unit?e:null,e?.name);
    lock('workerSelect',e instanceof Unit?e:null,e?.name);
    lock('sourceSelect',e instanceof Building?e:null,BUILD_LABEL[e?.type]);
    const factory=e instanceof Building&&(TERRA_RECIPES[e.type]||e.type==='pen');
    lock('factorySelect',factory?e:null,BUILD_LABEL[e?.type]);
    $('#productionForm').hidden=e instanceof Building&&!factory;
    this.refreshContextInventory();
  };
  const trade=Game.prototype.renderTrade;
  Game.prototype.renderTrade=function(){
    trade.call(this);const e=this.selected;
    if(e instanceof Building&&e.type==='market'&&e.owner===0){
      $('#tradeSource').innerHTML=`<option value="${e.id}">Mercato selezionato</option>`;$('#tradeSource').value=e.id;$('#tradeSource').disabled=true;this.updateTradePreview();
    }
  };
})();
