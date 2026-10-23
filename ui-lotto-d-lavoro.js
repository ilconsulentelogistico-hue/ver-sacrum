// Lotto D: assign a real free person from a selected workplace.
(() => {
  'use strict';
  const skillFor = {farm:'farming',pen:'herding',sawmill:'carpentry',mill:'milling',bakery:'baking',kiln:'pottery',foundry:'metallurgy',loom:'weaving',press:'pressing'};
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  Game.prototype.workplaceCandidates = function(building) {
    const skill = skillFor[building?.type];
    if (!skill || building.owner !== 0 || !building.alive || !building.built) return [];
    return this.units.filter(u => u.owner === 0 && u.health > 0 && u.location?.kind === 'world' && !u.mobilized && u.state === 'idle' && !u.inventory?.amount)
      .sort((a,b) => (b.skills?.[skill] || 0) - (a.skills?.[skill] || 0) || String(a.name).localeCompare(String(b.name)));
  };
  Game.prototype.workplaceBlocker = function(building) {
    if (!building?.alive || !building.built) return 'Completa prima l’edificio.';
    if (building.type === 'farm') {
      const crop = TERRA_CROPS[building.crop] || TERRA_CROPS.grain;
      if (this.cropWorkers(building).length >= crop.maxWorkers) return 'Il campo ha già tutti i lavoratori.';
    }
    if (!this.workplaceCandidates(building).length) return 'Nessun abitante libero senza carico: libera un lavoratore o fai uscire un residente.';
    return null;
  };
  Game.prototype.addWorkerToWorkplace = function(building, personId) {
    const blocker = this.workplaceBlocker(building);
    if (blocker) { this.message(blocker); return false; }
    const candidates = this.workplaceCandidates(building);
    const worker = personId ? candidates.find(u => u.id === personId) : candidates[0];
    if (!worker) { this.message('L’abitante scelto non è più libero.'); return false; }
    const error = building.type === 'farm' ? (this.assignFarm(worker,building) ? null : 'Il campo non è raggiungibile.') : this.assignProduction(worker,building);
    if (error) { this.message(error); return false; }
    this.save(true);
    this.updateUI();
    return true;
  };
  const selectionHTML = Game.prototype.selectionHTML;
  Game.prototype.selectionHTML = function(entity) {
    let html = selectionHTML.call(this,entity);
    if (!(entity instanceof Building) || !skillFor[entity.type] || entity.owner !== 0) return html;
    const blocker = this.workplaceBlocker(entity);
    const candidates = this.workplaceCandidates(entity);
    const choice = '<div class="workplace-choice"><label>Aggiungi lavoratore <select id="workplacePerson" aria-label="Scegli un lavoratore"' + (blocker?' disabled':'') + '>'
      + candidates.map(u => '<option value="'+esc(u.id)+'">'+esc(u.name)+' · '+esc(TERRA_SKILLS.labels[skillFor[entity.type]])+' '+(u.skills?.[skillFor[entity.type]]||0)+'</option>').join('')
      + '</select></label><button id="addWorkplaceWorker" type="button"'+(blocker?' disabled':'')+'>Aggiungi lavoratore</button>'
      + (blocker?'<small>'+esc(blocker)+'</small>':'<small>Il più esperto è già proposto. Puoi sceglierne un altro.</small>')+'</div>';
    return html.replace('</h3>','</h3>'+choice);
  };
  const initUI = Game.prototype.initUI;
  Game.prototype.initUI = function() {
    initUI.call(this);
    document.getElementById('selectionCard').addEventListener('click', event => {
      if (event.target.id !== 'addWorkplaceWorker') return;
      const building = this.selected;
      if (!(building instanceof Building)) return;
      this.addWorkerToWorkplace(building,document.getElementById('workplacePerson')?.value);
    });
  };
})();
