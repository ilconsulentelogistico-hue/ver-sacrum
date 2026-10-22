// Community views refer to the same persistent Unit records as the map.
(() => {
  'use strict';
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  Game.prototype.communityCounts = function (people=this.units.filter(u => u.owner === 0 && u.health > 0)) {
    return {total:people.length, residents:people.filter(u => u.location.kind === 'resident').length,
      occupied:people.filter(u => !u.mobilized && u.task !== null).length,
      available:people.filter(u => !u.mobilized && u.task === null).length,
      mobilized:people.filter(u => u.mobilized).length};
  };
  Game.prototype.mobilizePerson = function (id) {
    const u = this.units.find(u => u.id === id && u.owner === 0 && u.health > 0);
    if (!u || u.mobilized || u.task) return false;
    // Exit must succeed before changing duty; a blocked exit changes nothing.
    if (u.location.kind === 'resident' && !this.releaseResident(id)) return false;
    u.mobilized = true;
    this.message(`${u.name} è mobilitato. Assegna gli ordini dalla mappa.`);
    return true;
  };
  Game.prototype.demobilizePerson = function (id) {
    const u = this.units.find(u => u.id === id && u.owner === 0 && u.health > 0 && u.mobilized);
    if (!u) return false;
    this.cancelTask(u); // releases reservations, retaining any cargo already picked up
    u.mobilized = false;
    delete u.rallyAutoMobilizedRaidLevel;
    delete u.rallyHomeId;
    this.message(`${u.name} è disponibile. Usa Entra per farlo rientrare in un Distretto.`);
    return true;
  };
  const enterResident = Game.prototype.enterResident;
  Game.prototype.enterResident = function (u,b) {
    if (!u || u.health <= 0 || u.location.kind !== 'world' || b?.owner !== u.owner) return false;
    enterResident.call(this,u,b);
    if (u.location.kind === 'resident') {u.mobilized = false; return true;}
    return false;
  };
  Game.prototype.selectCommunityPerson = function (id) {
    const u = this.units.find(u => u.id === id && u.owner === 0 && u.health > 0);
    if (!u) return false;
    this.groupSelection = u.location.kind === 'world' ? [u] : [];
    for (const person of this.units) person.selected = this.groupSelection.includes(person);
    this.selected = u;
    this.lastSelectedUnit = u.location.kind === 'world' ? u : null;
    this.orderMode = null; this.buildMode = null; this.pointerCancel(); this.syncModeButtons();
    this.camera.x = u.x*TILE; this.camera.y = u.y*TILE;
    this.updateUI(); return true;
  };
  Game.prototype.renderCommunity = function () {
    const c = this.communityCounts(this.contextPeople());
    $('#communitySummary').textContent = `${c.total} persone · ${c.residents} residenti nei Distretti · ${c.occupied} occupati · ${c.available} disponibili · ${c.mobilized} mobilitati`;
    $('#communityRoster').innerHTML = this.contextPeople().map(u => {
      const home = this.buildings.find(b => b.id === u.location.settlementId);
      const place = home ? `Distretto (${Math.floor(home.x)}, ${Math.floor(home.y)})` : 'Sulla mappa';
      const duty = u.mobilized ? 'Mobilitato' : u.task ? 'Occupato' : 'Disponibile';
      return `<article><div><b>${escape(u.name)}</b><p>${escape(this.personOriginLabel(u))} · ${place} · ${duty}<br>${escape(this.unitStatus(u))} · Salute ${Math.ceil(u.health)}${u.unfedDays?` · Senza razione ${u.unfedDays} giorni`:''} · Carico ${u.inventory.amount}/${u.inventory.cap}</p></div><div class="community-actions"><button type="button" data-community="select" data-id="${u.id}">Seleziona</button><button type="button" data-community="${u.mobilized?'demobilize':'mobilize'}" data-id="${u.id}" ${!u.mobilized&&u.task?'disabled':''}>${u.mobilized?'Smobilita':u.task?'Al lavoro':'Mobilita'}</button></div></article>`;
    }).join('') || '<p>Nessun abitante disponibile.</p>';
  };
  const initUI = Game.prototype.initUI;
  Game.prototype.initUI = function () {
    initUI.call(this);
    const dialog = $('#communityDialog');
    $('#people').addEventListener('click', e => {
      if (!e.target.closest?.('[data-open-community]')) return;
      this.pauseBeforeCommunity = this.paused; this.backgroundDuringCommunity = false;
       this.pointerCancel(); this.orderMode=null; this.buildMode=null; this.syncModeButtons();
      this.renderCommunity(); $('#communityStatus').textContent=''; this.showManagement('communityDialog');
    });
    $('#closeCommunity').onclick = () => this.closeManagement();
    dialog.addEventListener('close', () => {
      if (!this.suspended && !this.backgroundDuringCommunity) this.setPaused(this.pauseBeforeCommunity);
      this.backgroundDuringCommunity=false;
    });
    $('#communityRoster').addEventListener('click', e => {
      const button=e.target.closest?.('[data-community]');
      if (!button || button.disabled) return;
      const {community:action,id}=button.dataset;
      if (action === 'select') {if(this.selectCommunityPerson(id)) this.closeManagement(); return;}
      const changed=action==='mobilize'?this.mobilizePerson(id):action==='demobilize'?this.demobilizePerson(id):false;
      $('#communityStatus').textContent=changed?$('#message').textContent:'Operazione non riuscita: verifica disponibilità e uscita dal Distretto.';
      if(changed&&!this.save(true)) $('#communityStatus').textContent+=' Salvataggio non riuscito: riprova da Mondo → Salva.';
      this.renderCommunity(); this.updateUI();
    });
  };
  const suspend=Game.prototype.suspend;
  Game.prototype.suspend=function(){if($('#communityDialog').open)this.backgroundDuringCommunity=true;suspend.call(this);};
  const updateUI=Game.prototype.updateUI;
  Game.prototype.updateUI=function(){
    updateUI.call(this);
    const c=this.communityCounts(),people=$('#people');
    const html=`<b>Gestisci comunità · ${c.total}</b><span>${c.residents} residenti · ${c.mobilized} mobilitati</span>`;
    const button=people.querySelector?.('[data-open-community]');
    if(button){if(button.innerHTML!==html)button.innerHTML=html;}
    else people.insertAdjacentHTML?.('afterbegin',`<button type="button" data-open-community class="community-open">${html}</button>`);
  };
})();

