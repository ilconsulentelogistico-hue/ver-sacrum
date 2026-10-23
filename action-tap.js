// Action tap (Claude, 23/10/2026, from Simone's rule): the first tap selects, the next one acts.
// With people selected, a tap on one of your buildings does what can be done there: one action
// starts at once, several open small circles around the finger, none selects the building.
// Interface PROVVISORIA, da approvare da Simone.
(() => {
  'use strict';
  const node = id => (typeof document !== 'undefined' ? document.getElementById(id) : null);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const WORK = {farm:'Coltiva', pen:'Alleva', sawmill:'Lavora qui', mill:'Lavora qui', bakery:'Lavora qui', kiln:'Lavora qui', foundry:'Lavora qui', loom:'Lavora qui', press:'Lavora qui'};
  const onMap = g => (g.rtsSelectedUnits?.() || []).filter(u => u.owner === 0 && u.health > 0 && u.location?.kind === 'world');
  const say = (g, sent, one, many, errors) => {
    if (sent.length) g.message(sent.length > 1 ? many(sent.length) : one(sent[0].name));
    else if (errors.length) g.message(errors[0]);
  };

  // What the selected people can do with this building, in the order the circles show it.
  Game.prototype.buildingActions = function(group, b, pos, tx, ty) {
    if (!(b instanceof Building) || b.owner !== 0 || !b.alive || !group.length) return [];
    if (!b.built) return [{id:'build', icon:'⚒', label:'Costruisci', run:() => this.sendToSite(group, b)}];
    const out = [], workers = group.filter(u => !u.mobilized), soldiers = group.filter(u => u.mobilized);
    const carriers = group.filter(u => u.inventory?.amount);
    if (carriers.length && (b.type === 'base' || b.type === 'warehouse'))
      out.push({id:'deposit', icon:'⇩', label:'Deposita', run:() => { for (const u of carriers) this.applyOrder('deliver', pos, tx, ty, u); }});
    if (b.type === 'house') out.push({id:'enter', icon:'⌂', label:'Vai a vivere', run:() => this.moveInGroup(group, b)});
    if (WORK[b.type] && workers.length) out.push({id:'work', icon:'⚙', label:WORK[b.type], run:() => {
      const sent = [], errors = [];
      let free = b.type === 'farm' ? (TERRA_CROPS[b.crop] || TERRA_CROPS.grain).maxWorkers - this.cropWorkers(b).length : workers.length;
      for (const u of workers) {
        if (free <= 0) { errors.push(b.type === 'farm' ? 'Il campo ha già tutti i lavoratori.' : 'Non c’è posto.'); break; }
        const error = b.type === 'farm' ? (this.assignFarm(u, b) ? null : 'Il campo non è raggiungibile.') : b.type === 'pen' ? this.assignLivestockWorker(u, b) : this.assignProduction(u, b);
        if (error) errors.push(error); else { sent.push(u); free--; }
      }
      if (sent.length > 1 || !sent.length) say(this, sent, n => `${n} lavora qui.`, n => `${n} abitanti lavorano qui.`, errors);
    }});
    if (b.health < b.maxHealth) out.push({id:'repair', icon:'✚', label:'Ripara', run:() => {
      const sent = [], errors = [];
      for (const u of group) { const error = this.assignRepair(u, b); if (error) errors.push(error); else sent.push(u); }
      say(this, sent, n => `${n} ripara l’edificio.`, n => `${n} abitanti riparano l’edificio.`, errors);
    }});
    if (soldiers.length && (b.type === 'tower' || b.type === 'warehouse'))
      out.push({id:'guard', icon:'⚑', label:b.type === 'tower' ? 'Presidia' : 'Sentinella', run:() => {
        const error = (b.type === 'tower' ? this.assignTowerGuard : this.assignWarehouseGuard).call(this, soldiers[0], b);
        if (error) this.message(error);
      }});
    return out;
  };

  // The circles: one per action plus «Dettagli», which selects the building instead.
  Game.prototype.showActionWheel = function(sx, sy, target, actions) {
    const wheel = node('actionWheel');
    if (!wheel) { actions[0].run(); return; }
    const items = [...actions, {id:'select', icon:'i', label:'Dettagli'}], radius = 64, margin = radius + 38;
    wheel.innerHTML = items.map((a, i) => {
      const angle = -Math.PI / 2 + i * 2 * Math.PI / items.length;
      return `<button type="button" data-wheel="${a.id}" style="left:${Math.round(Math.cos(angle) * radius)}px;top:${Math.round(Math.sin(angle) * radius)}px"><b>${a.icon}</b><span>${esc(a.label)}</span></button>`;
    }).join('');
    // Keep the circles on the part of the map that the bar and the panel leave visible.
    const w = this.viewW || 390, h = this.viewH || 600, i = this.measurePanels?.() || {top:0, bottom:0, right:0, left:0};
    wheel.style.left = `${Math.round(clamp(sx, i.left + margin, Math.max(i.left + margin, w - i.right - margin)))}px`;
    wheel.style.top = `${Math.round(clamp(sy, i.top + margin, Math.max(i.top + margin, h - i.bottom - margin)))}px`;
    wheel.hidden = false;
    node('message')?.classList?.remove?.('show');
    this.actionWheel = {target, actions};
  };
  Game.prototype.hideActionWheel = function() {
    this.actionWheel = null;
    const wheel = node('actionWheel');
    if (wheel) { wheel.hidden = true; wheel.innerHTML = ''; }
  };
  Game.prototype.chooseAction = function(id) {
    const open = this.actionWheel;
    this.hideActionWheel();
    if (!open) return false;
    if (id === 'select') {
      this.groupSelection = []; for (const u of this.units) u.selected = false;
      this.selected = open.target;
    } else {
      const action = open.actions.find(a => a.id === id);
      if (!action) return false;
      action.run();
    }
    this.updateUI();
    return true;
  };

  const exploring = g => g.startExperienceStage === 'explore';
  const contextTap = Game.prototype.rtsContextTap;
  Game.prototype.rtsContextTap = function(sx, sy, ...rest) {
    if (this._swallowTap) { this._swallowTap = false; return; }
    if (this.buildMode || this.orderMode || this.routePick || exploring(this)) return contextTap.call(this, sx, sy, ...rest);
    const w = this.screenToWorld(sx, sy), pos = {x:w.x / TILE, y:w.y / TILE}, tx = Math.floor(pos.x), ty = Math.floor(pos.y);
    const entity = this.pickEntity(pos), group = onMap(this);
    const actions = this.buildingActions(group, entity, pos, tx, ty);
    if (!actions.length) return contextTap.call(this, sx, sy, ...rest);
    if (actions.length === 1) { actions[0].run(); this.updateUI(); return; }
    this.showActionWheel(sx, sy, entity, actions);
  };
  const leftTap = Game.prototype.rtsLeftTap;
  Game.prototype.rtsLeftTap = function(...args) {
    if (this._swallowTap) { this._swallowTap = false; return; }
    return leftTap.apply(this, args);
  };
  // A new touch on the map closes the circles and is not taken as an order.
  const pointerDown = Game.prototype.pointerDown;
  Game.prototype.pointerDown = function(...args) {
    this._swallowTap = !!this.actionWheel;
    if (this.actionWheel) this.hideActionWheel();
    return pointerDown.apply(this, args);
  };

  const initUI = Game.prototype.initUI;
  Game.prototype.initUI = function() {
    initUI.call(this);
    const wheel = node('actionWheel');
    if (wheel) wheel.addEventListener?.('click', event => {
      const button = event.target.closest?.('[data-wheel]');
      if (button) this.chooseAction(button.dataset.wheel);
    });
    if (typeof document !== 'undefined' && typeof document.createElement === 'function' && document.head && !node('actionWheelStyle')) {
      const style = document.createElement('style');
      style.id = 'actionWheelStyle';
      style.textContent = '.action-wheel{position:absolute;z-index:30;width:0;height:0;pointer-events:none}.action-wheel[hidden]{display:none!important}'
        + '.action-wheel button{position:absolute;transform:translate(-50%,-50%);pointer-events:auto;width:62px;height:62px;border-radius:50%;display:grid;place-content:center;gap:1px;padding:4px;'
        + 'background:#211b14ee;color:#f1e3c2;border:2px solid #c9a46a;box-shadow:0 2px 8px #0008;font:600 10px/1.1 system-ui,sans-serif;text-align:center}'
        + '.action-wheel button b{font-size:19px;line-height:1}.action-wheel button[data-wheel="select"]{border-color:#8d826c;background:#191612ee}.action-wheel button[data-wheel="select"] b{font:italic 700 21px/1 Georgia,serif}';
      document.head.appendChild(style);
    }
  };
})();
