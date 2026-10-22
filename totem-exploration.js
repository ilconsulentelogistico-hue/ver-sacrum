// Ver sacrum: the young founders choose a sacred animal, explore the land in fog
// and found the village where they plant the totem. Loaded last, before boot.js.
(() => {
  'use strict';
  // Ancient traditions of the Italic ver sacrum; no gameplay bonus yet (Simone, 23/10/2026).
  const TOTEMS = [
    {id:'hirpus', animal:'Lupo', italic:'Hirpus', people:'Irpini',
      text:'I Sanniti chiamavano il lupo «hirpus»: fu un lupo a guidare i giovani che presero il nome di Irpini.',
      source:'Strabone, Geografia V 4, 12; Paolo Diacono da Festo, voce «Irpini»'},
    {id:'picus', animal:'Picchio', italic:'Picus', people:'Piceni',
      text:'Un picchio, uccello sacro a Marte, guidò i giovani partiti dalla Sabina: da lui vennero chiamati Piceni.',
      source:'Strabone, Geografia V 4, 2; Paolo Diacono da Festo, voce «Picena regio»'},
    {id:'bos', animal:'Toro', italic:'Bos', people:'Sanniti',
      text:'Un toro condusse i giovani sabelli nella terra degli Opici; lì si fermarono e lo sacrificarono a Marte.',
      source:'Strabone, Geografia V 4, 12'}
  ];
  const REVEAL_RADIUS = 11, MIN_NEIGHBOUR_DISTANCE = 18, WOOD_RADIUS = 9;
  const FIELD_BIOMES = ['grass', 'scrub', 'plain'];
  window.VER_SACRUM_TOTEMS = TOTEMS;
  const totemById = id => TOTEMS.find(t => t.id === id) || null;
  const exploring = g => g.startExperienceStage === 'explore';
  const node = id => (typeof document !== 'undefined' ? document.getElementById(id) : null);
  // The panel ignores the class `hidden` in app.css: the attribute is what hides it.
  // While exploring the panel hides and the toast moves above the exploration bar.
  const scenarioPanel = (hide) => { const el = node('scenarioStatus'); if (el) el.hidden = !!hide; node('worldWrap')?.classList.toggle('exploring', !!hide); };
  // Messages from the provisional camp (harvests, stores) mean nothing before the founding.
  const say = (g, text) => { g._exploreSay = true; try { g.message(text); } finally { g._exploreSay = false; } };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  // While exploring, the provisional camp, its store and the hostile camps stay off the map.
  const withExploreView = (g, fn) => {
    if (!exploring(g)) return fn();
    const buildings = g.buildings, camps = g.warCamps, raiders = g.raiders;
    g.buildings = buildings.filter(b => b.owner !== 0);
    g.warCamps = []; g.raiders = [];
    try { return fn(); } finally { g.buildings = buildings; g.warCamps = camps; g.raiders = raiders; }
  };

  Game.prototype.totemInfo = function(id) { return totemById(id ?? this.buildings?.find(b => b.owner === 0 && b.type === 'base')?.totem); };

  Game.prototype.renderStartTotems = function() {
    const list = node('startTotems');
    if (list) list.innerHTML = TOTEMS.map(t =>
      `<button type="button" data-start-totem="${t.id}" class="${this.pendingTotem === t.id ? 'active' : ''}" aria-pressed="${this.pendingTotem === t.id}"><b>${esc(t.animal)} · ${esc(t.italic)}</b><span>${esc(t.text)}</span><small>${esc(t.people)} · ${esc(t.source)}</small></button>`
    ).join('');
    const start = node('startExplore');
    if (start) {
      start.disabled = !this.pendingTotem;
      start.textContent = this.pendingTotem ? `Parti con i cinque giovani · ${totemById(this.pendingTotem).animal}` : 'Scegli l’animale sacro';
    }
  };

  Game.prototype.chooseTotem = function(id) {
    if (this.startExperienceStage !== 'places' || !totemById(id)) return false;
    this.pendingTotem = id;
    this.renderStartTotems();
    return true;
  };

  // Fog of war at chunk resolution: cheap enough to draw every frame on a phone.
  Game.prototype.initExplorationFog = function() {
    const side = this.world.chunkSize || 8, cols = Math.ceil(this.world.size / side), rows = cols;
    this.exploration = {side, cols, rows, revealed: new Uint8Array(cols * rows), lastHint: 0};
    this.revealAroundBand();
  };
  Game.prototype.isTileRevealed = function(x, y) {
    const f = this.exploration;
    if (!f) return true;
    const cx = Math.floor(x / f.side), cy = Math.floor(y / f.side);
    return cx >= 0 && cy >= 0 && cx < f.cols && cy < f.rows && f.revealed[cy * f.cols + cx] === 1;
  };
  Game.prototype.revealAroundBand = function() {
    const f = this.exploration;
    if (!f) return 0;
    let opened = 0;
    for (const u of this.units) {
      if (u.owner !== 0 || u.health <= 0 || u.location?.kind !== 'world') continue;
      const reach = REVEAL_RADIUS + f.side / 2;
      const x0 = Math.max(0, Math.floor((u.x - reach) / f.side)), x1 = Math.min(f.cols - 1, Math.floor((u.x + reach) / f.side));
      const y0 = Math.max(0, Math.floor((u.y - reach) / f.side)), y1 = Math.min(f.rows - 1, Math.floor((u.y + reach) / f.side));
      for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
        const i = cy * f.cols + cx;
        if (f.revealed[i]) continue;
        if (Math.hypot((cx + .5) * f.side - u.x, (cy + .5) * f.side - u.y) <= reach) { f.revealed[i] = 1; opened++; }
      }
    }
    return opened;
  };
  Game.prototype.revealedShare = function() {
    const f = this.exploration;
    return f ? f.revealed.reduce((n, v) => n + v, 0) / f.revealed.length : 1;
  };

  Game.prototype.canPlantTotemAt = function(x, y) {
    const size = this.world.size;
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 8 || y < 8 || x >= size - 8 || y >= size - 8) return {ok:false, reason:'Troppo vicino al bordo del territorio.'};
    if (!this.isTileRevealed(x, y)) return {ok:false, reason:'Questa zona non è ancora stata esplorata.'};
    const tile = this.world.tile(x, y);
    if (!tile || !FIELD_BIOMES.includes(tile.biome)) return {ok:false, reason:'Serve un prato o una macchia: qui il terreno non regge un villaggio.'};
    if (tile.nearWater) return {ok:false, reason:'Troppo vicino all’acqua: spostati su un terreno asciutto.'};
    const wood = this.world.resourcesInBounds(x - WOOD_RADIUS, y - WOOD_RADIUS, x + WOOD_RADIUS, y + WOOD_RADIUS)
      .filter(n => n.type === 'wood' && n.amount > 0 && Math.hypot(n.x - x, n.y - y) < WOOD_RADIUS).length;
    if (!wood) return {ok:false, reason:'Nessun bosco entro 9 caselle: senza legna il villaggio non parte.'};
    const neighbour = this.buildings.find(b => b.type === 'base' && b.owner > 0 && b.alive && Math.hypot(b.x - x, b.y - y) < MIN_NEIGHBOUR_DISTANCE);
    if (neighbour) return {ok:false, reason:`Troppo vicino a ${neighbour.cityName || neighbour.factionName || 'un’altra comunità'}.`};
    const stone = this.world.resourcesInBounds(x - 20, y - 20, x + 20, y + 20)
      .filter(n => n.type === 'stone' && n.amount > 0 && Math.hypot(n.x - x, n.y - y) < 20).length;
    return {ok:true, reason:`Qui si può fondare: ${wood} boschi vicini, ${stone ? stone + ' cave di pietra entro 20 caselle' : 'nessuna pietra entro 20 caselle'}.`, wood, stone};
  };
  Game.prototype.explorationLeader = function() {
    const own = u => u instanceof Unit && u.owner === 0 && u.health > 0 && u.location?.kind === 'world';
    const group = this.rtsSelectedUnits?.() || [];
    return [this.selected, ...group].find(own) || null;
  };
  Game.prototype.updateExploreBar = function() {
    if (!exploring(this)) return;
    const leader = this.explorationLeader(), button = node('plantTotem'), hint = node('exploreHint'), title = node('exploreTitle');
    const totem = totemById(this.pendingTotem);
    if (title) title.textContent = `Esplorazione · ${totem ? totem.animal + ' (' + totem.italic + ')' : 'animale sacro'} · ${Math.round(this.revealedShare() * 100)}% del territorio`;
    let check = {ok:false, reason:'Seleziona un giovane e portalo dove vuoi fondare: la nebbia si dirada dove passa.'};
    if (leader) check = this.canPlantTotemAt(Math.floor(leader.x), Math.floor(leader.y));
    if (hint) hint.textContent = leader ? `${leader.name}: ${check.reason}` : check.reason;
    if (button) { button.disabled = !check.ok; button.textContent = leader ? `Pianta il totem dove si trova ${leader.name}` : 'Pianta il totem qui'; }
    return check;
  };

  Game.prototype.beginExploration = function() {
    if (this.startExperienceStage !== 'places' || !totemById(this.pendingTotem)) return false;
    this.startExperienceStage = 'explore';
    this.raidsEnabled = false; this.nextRaidDay = 1e9;
    this.initExplorationFog();
    // The whole band walks together; the first youth is the one who plants the totem.
    const band = this.units.filter(u => u.owner === 0 && u.health > 0);
    this.selected = band[0] || null; this.groupSelection = band;
    for (const u of this.units) u.selected = this.groupSelection.includes(u);
    this.lastSelectedUnit = this.selected;
    this.orderMode = null; this.buildMode = null; this.syncModeButtons?.();
    node('startExperience')?.classList.add('hidden');
    node('exploreBar')?.classList.remove('hidden');
    scenarioPanel(true);
    this.setPaused(false);
    node('pauseNotice')?.classList.add('hidden');
    this.refreshContextDock?.();
    this.updateExploreBar();
    say(this, `I cinque giovani partono guidati dal ${totemById(this.pendingTotem).animal.toLowerCase()}. Esplorate il territorio e piantate il totem dove volete fondare.`);
    return true;
  };

  // Founding reuses the normal new-game path, so neighbours, hostile camps and stores
  // are built around the chosen site exactly as for any other start.
  Game.prototype.plantTotem = function() {
    if (!exploring(this)) return false;
    const leader = this.explorationLeader();
    if (!leader) { say(this, 'Seleziona prima un giovane.'); return false; }
    const x = Math.floor(leader.x), y = Math.floor(leader.y), check = this.canPlantTotemAt(x, y);
    if (!check.ok) { say(this, check.reason); this.updateExploreBar(); return false; }
    const totem = this.pendingTotem, seed = this.seed;
    this.startExperienceStage = 'tutorial';
    this.startSiteOverride = {x, y};
    try { this.newGame(seed); } finally { this.startSiteOverride = null; }
    const base = this.buildings.find(b => b.owner === 0 && b.type === 'base');
    if (base) base.totem = totem;
    this.exploration = null;
    scenarioPanel(false);
    this.setPaused(true);
    node('exploreBar')?.classList.add('hidden');
    node('pauseNotice')?.classList.add('hidden');
    this.showStartTutorialAfterFounding();
    this.message(`Totem del ${totemById(totem).animal.toLowerCase()} piantato: qui nasce il villaggio.`);
    return true;
  };
  Game.prototype.showStartTutorialAfterFounding = function() {
    this.startExperienceStage = 'tutorial';
    this.startTutorialIndex = 0;
    const set = (id, text) => { const el = node(id); if (el) el.textContent = text; };
    set('startTitle', 'I primi passi');
    set('startDescription', 'Il tempo resta fermo finché termini la guida.');
    for (const id of ['startPlaces', 'startModes', 'startWorldSizes', 'startTotems', 'startExplore']) node(id)?.classList.add('hidden');
    node('startTutorial')?.classList.remove('hidden');
    node('startExperience')?.classList.remove('hidden');
    this.showStartTutorialStep();
    this.refreshContextDock?.();
  };
  Game.prototype.cancelExploration = function() {
    if (!exploring(this)) return false;
    const totem = this.pendingTotem;
    this.exploration = null;
    scenarioPanel(false);
    this.beginStartSelection(this.seed);
    this.pendingTotem = totem; this.renderStartTotems();
    return true;
  };

  const findSpawn = Game.prototype.findSpawn;
  Game.prototype.findSpawn = function() { return this.startSiteOverride ? {...this.startSiteOverride} : findSpawn.call(this); };

  const begin = Game.prototype.beginStartSelection;
  Game.prototype.beginStartSelection = function(seed = null) {
    this.exploration = null;
    node('exploreBar')?.classList.add('hidden');
    const result = begin.call(this, seed);
    this.pendingTotem = null;
    node('startPlaces')?.classList.add('hidden');
    node('startTotems')?.classList.remove('hidden');
    node('startExplore')?.classList.remove('hidden');
    const title = node('startTitle'), description = node('startDescription');
    if (title) title.textContent = 'La primavera sacra';
    if (description) description.textContent = 'Scegli modalità, grandezza della mappa e l’animale sacro che guida i cinque giovani. Poi esplorate il territorio e piantate il totem dove fondare il villaggio.';
    this.renderStartTotems();
    return result;
  };
  // The legacy preset sites stay available to tests and automatic games.
  const chooseLocation = Game.prototype.chooseStartLocation;
  Game.prototype.chooseStartLocation = function(index) {
    const totem = this.pendingTotem;
    const ok = chooseLocation.call(this, index);
    if (ok) {
      const base = this.buildings.find(b => b.owner === 0 && b.type === 'base');
      if (base && totem) base.totem = totem;
      for (const id of ['startTotems', 'startExplore']) node(id)?.classList.add('hidden');
    }
    return ok;
  };
  const finish = Game.prototype.finishStartExperience;
  Game.prototype.finishStartExperience = function() {
    node('exploreBar')?.classList.add('hidden');
    return finish.call(this);
  };

  const save = Game.prototype.save;
  Game.prototype.save = function(show = false) { return exploring(this) ? false : save.call(this, show); };
  const load = Game.prototype.load;
  Game.prototype.load = function() {
    const wasExploring = exploring(this);
    const ok = load.call(this);
    if (ok && wasExploring) { this.startExperienceStage = null; this.exploration = null; scenarioPanel(false); node('exploreBar')?.classList.add('hidden'); this.refreshContextDock?.(); }
    return ok;
  };

  const update = Game.prototype.update;
  Game.prototype.update = function(dt) {
    const result = update.call(this, dt);
    if (exploring(this)) this.revealAroundBand();
    return result;
  };

  // During exploration the band only walks: work and building start with the village.
  const blocked = 'Durante l’esplorazione i giovani possono solo spostarsi. Piantate il totem per iniziare a lavorare.';
  const applyOrder = Game.prototype.applyOrder;
  Game.prototype.applyOrder = function(order, pos, tx, ty, person = this.selected) {
    if (exploring(this) && order !== 'move') { this.orderMode = null; this.syncModeButtons?.(); say(this, blocked); return; }
    return applyOrder.call(this, order, pos, tx, ty, person);
  };
  const contextTap = Game.prototype.rtsContextTap;
  Game.prototype.rtsContextTap = function(sx, sy) {
    if (!exploring(this)) return contextTap.call(this, sx, sy);
    const w = this.screenToWorld(sx, sy), pos = {x:w.x / TILE, y:w.y / TILE}, entity = this.pickEntity(pos);
    const group = this.rtsSelectedUnits?.() || [];
    if (entity instanceof Unit && entity.owner === 0 || !group.length) return contextTap.call(this, sx, sy);
    const tx = Math.floor(pos.x), ty = Math.floor(pos.y);
    if (tx < 0 || ty < 0 || tx >= this.world.size || ty >= this.world.size) return;
    for (const u of group) this.assignMove(u, tx, ty);
    this.updateExploreBar();
  };
  const placeBuild = Game.prototype.placeBuild;
  Game.prototype.placeBuild = function(...args) {
    if (exploring(this)) { this.buildMode = null; this.syncModeButtons?.(); say(this, blocked); return false; }
    return placeBuild.apply(this, args);
  };
  const pickEntity = Game.prototype.pickEntity;
  Game.prototype.pickEntity = function(pos) {
    if (!exploring(this)) return pickEntity.call(this, pos);
    if (!this.isTileRevealed(Math.floor(pos.x), Math.floor(pos.y))) return null;
    const entity = withExploreView(this, () => pickEntity.call(this, pos));
    return entity instanceof Building && entity.owner === 0 ? null : entity;
  };

  const draw = Game.prototype.draw;
  Game.prototype.draw = function(...args) {
    if (!exploring(this)) return draw.apply(this, args);
    const result = withExploreView(this, () => draw.apply(this, args));
    this.drawExplorationFog();
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (this.exploration && now - this.exploration.lastHint > 400) { this.exploration.lastHint = now; this.updateExploreBar(); }
    return result;
  };
  Game.prototype.drawExplorationFog = function() {
    const f = this.exploration, ctx = this.ctx;
    if (!f || !ctx) return;
    const z = this.camera.zoom, w = this.viewW || 390, h = this.viewH || 600;
    const a = this.screenToWorld(0, 0), b = this.screenToWorld(w, h), span = f.side * TILE;
    const cx0 = Math.max(0, Math.floor(a.x / span)), cx1 = Math.min(f.cols - 1, Math.floor(b.x / span));
    const cy0 = Math.max(0, Math.floor(a.y / span)), cy1 = Math.min(f.rows - 1, Math.floor(b.y / span));
    ctx.save();
    ctx.fillStyle = 'rgba(11,14,9,.94)';
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      if (f.revealed[cy * f.cols + cx]) continue;
      const p = this.worldToScreen(cx * span, cy * span);
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.ceil(span * z) + 1, Math.ceil(span * z) + 1);
    }
    ctx.restore();
  };
  const drawMinimap = Game.prototype.drawMinimap;
  Game.prototype.drawMinimap = function(...args) {
    const result = withExploreView(this, () => drawMinimap.apply(this, args));
    const f = this.exploration, canvas = node('minimap');
    if (exploring(this) && f && canvas?.getContext) {
      const ctx = canvas.getContext('2d'), sx = canvas.width / this.world.size, sy = canvas.height / this.world.size;
      ctx.fillStyle = 'rgba(11,14,9,.9)';
      // One rectangle per run of hidden chunks keeps 512×512 cheap on the minimap.
      for (let cy = 0; cy < f.rows; cy++) for (let cx = 0; cx < f.cols;) {
        if (f.revealed[cy * f.cols + cx]) { cx++; continue; }
        const from = cx;
        while (cx < f.cols && !f.revealed[cy * f.cols + cx]) cx++;
        ctx.fillRect(from * f.side * sx, cy * f.side * sy, (cx - from) * f.side * sx + .5, f.side * sy + .5);
      }
    }
    return result;
  };

  const updateUI = Game.prototype.updateUI;
  Game.prototype.updateUI = function(...args) {
    const result = updateUI.apply(this, args);
    if (exploring(this)) { scenarioPanel(true); this.updateExploreBar(); }
    return result;
  };
  // The Confederazione panel describes a founded village: it waits for the totem.
  const renderScenario = Game.prototype.renderScenarioStatus;
  if (renderScenario) Game.prototype.renderScenarioStatus = function(...args) {
    const result = renderScenario.apply(this, args);
    if (exploring(this)) scenarioPanel(true);
    return result;
  };
  const message = Game.prototype.message;
  Game.prototype.message = function(text, ...rest) {
    if (exploring(this) && !this._exploreSay) return;
    return message.call(this, text, ...rest);
  };
  const selectionHTML = Game.prototype.selectionHTML;
  Game.prototype.selectionHTML = function(e) {
    let html = selectionHTML.call(this, e);
    const totem = e instanceof Building && e.type === 'base' && e.owner === 0 ? totemById(e.totem) : null;
    if (totem) html += `<p>Animale sacro: ${esc(totem.animal)} (${esc(totem.italic)}) · tradizione degli ${esc(totem.people)}.</p>`;
    return html;
  };

  const initUI = Game.prototype.initUI;
  Game.prototype.initUI = function() {
    initUI.call(this);
    const totems = node('startTotems');
    if (totems) totems.onclick = event => { const button = event.target.closest?.('[data-start-totem]'); if (button) this.chooseTotem(button.dataset.startTotem); };
    const start = node('startExplore');
    if (start) start.onclick = () => this.beginExploration();
    const plant = node('plantTotem');
    if (plant) plant.onclick = () => this.plantTotem();
    const back = node('exploreBack');
    if (back) back.onclick = () => this.cancelExploration();
    if (typeof document !== 'undefined' && typeof document.createElement === 'function' && document.head && !node('totemExplorationStyle')) {
      const style = document.createElement('style');
      style.id = 'totemExplorationStyle';
      style.textContent = '.start-totems button{display:grid;gap:3px;text-align:left}.start-totems small{opacity:.7;font-size:11px;line-height:1.3}.start-explore{width:100%;margin-top:10px;padding:12px;border-radius:10px;border:1px solid #b08a45;background:#b08a45;color:#1a1405;font-weight:700;font-size:15px}.start-explore:disabled{opacity:.55;background:transparent;color:inherit}.explore-bar{position:absolute;left:92px;right:8px;bottom:8px;z-index:6;display:grid;gap:6px;padding:8px 10px;border-radius:10px;border:1px solid #8a6a32;background:rgba(23,26,22,.94);color:#efe6cf;font-size:13px;line-height:1.35}.explore-bar.hidden{display:none}.explore-text{display:grid;gap:2px}.explore-actions{display:flex;gap:6px;flex-wrap:wrap}.explore-actions button{flex:1 1 auto;min-height:40px;border-radius:8px;border:1px solid #b08a45;background:#b08a45;color:#1a1405;font-weight:700}.explore-actions button:disabled{opacity:.5;background:transparent;color:inherit}.explore-actions .secondary{flex:0 0 auto;background:transparent;color:inherit;font-weight:400}#worldWrap.exploring .message{bottom:178px}';
      document.head.appendChild(style);
    }
  };
})();
