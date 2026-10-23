// UI/UX redesign, lot D (Claude, 23/10/2026): one "Defend" choice during raids, one alert
// for stolen food, an end-of-game summary, a guide that reopens, a folding minimap and
// equipment chosen by touching the figure. Logic stays in the existing modules.
(() => {
  'use strict';
  const node = id => (typeof document !== 'undefined' ? document.getElementById(id) : null);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const MINIMAP_KEY = 'ver-sacrum-minimap-collapsed-v1';

  // --- Raids: the separate show/defend buttons collapse into Difendi, Insegui and Recupera.
  // The old buttons keep their class-based state for the scenario rules; the attribute hides them.
  const MERGED = ['scenarioThiefButton', 'scenarioRecoveredFoodButton', 'scenarioStoreDefenseButton', 'scenarioStoreFocusButton'];
  const renderScenario = Game.prototype.renderScenarioStatus;
  Game.prototype.renderScenarioStatus = function(...args) {
    const result = renderScenario.apply(this, args);
    const confederation = (this.gameMode || 'legacy') === 'confederation';
    for (const id of MERGED) { const el = node(id); if (el) el.hidden = confederation; }
    const choices = node('scenarioDefendChoices');
    if (!confederation) { if (choices) choices.hidden = true; this.defendChoicesOpen = false; return result; }
    const active = this.raiders.filter(r => r.health > 0), stores = active.length ? this.endangeredScenarioStores() : [];
    const rally = node('scenarioRallyButton');
    if (rally) {
      rally.textContent = stores.length ? `Difendi… · Casa comune o ${stores.length === 1 ? 'magazzino minacciato' : stores.length + ' magazzini minacciati'}` : 'Difendi la Casa comune';
      rally.setAttribute?.('aria-expanded', String(!!(stores.length && this.defendChoicesOpen)));
      rally.onclick = () => stores.length ? this.toggleDefendChoices() : this.chooseScenarioDefense('base');
    }
    if (!stores.length) this.defendChoicesOpen = false;
    this.renderDefendChoices(stores);
    const thieves = this.activeScenarioThieves(), intercept = node('scenarioThiefInterceptButton');
    if (intercept && thieves.length) {
      const food = thieves.reduce((sum, r) => sum + (r.lootFood || 0), 0);
      intercept.textContent = `Insegui il ladro · ${food} cibo${thieves.length > 1 ? ` · ${thieves.length} ladri` : ''}`;
      intercept.onclick = () => { this.focusScenarioThief(); this.interceptScenarioThief(); };
    }
    // The next-step hint often repeats «Mostra razziatore» during a raid: show it once.
    const next = node('scenarioNextButton'), threat = node('scenarioThreatButton');
    if (next) next.hidden = !!threat && !threat.classList.contains('hidden') && next.textContent === threat.textContent;
    const piles = this.recoveredScenarioFood(), collect = node('scenarioCollectFoodButton');
    if (collect && piles.length) {
      collect.textContent = `Recupera ${piles.reduce((sum, p) => sum + (p.amount || 0), 0)} cibo a terra`;
      collect.onclick = () => { this.focusRecoveredScenarioFood(); this.collectRecoveredScenarioFood(); };
    }
    return result;
  };
  Game.prototype.renderDefendChoices = function(stores = this.endangeredScenarioStores()) {
    const box = node('scenarioDefendChoices');
    if (!box) return;
    box.hidden = !this.defendChoicesOpen || !stores.length;
    box.innerHTML = box.hidden ? '' : [`<button type="button" data-defend="base">Casa comune</button>`,
      ...stores.map((b, i) => `<button type="button" data-defend="${esc(b.id)}">Magazzino ${stores.length > 1 ? `${i + 1} di ${stores.length} ` : ''}(${Math.floor(b.x)}, ${Math.floor(b.y)})</button>`)].join('');
  };
  Game.prototype.toggleDefendChoices = function(open = !this.defendChoicesOpen) {
    this.defendChoicesOpen = !!open;
    this.renderDefendChoices();
    node('scenarioRallyButton')?.setAttribute?.('aria-expanded', String(this.defendChoicesOpen));
    return this.defendChoicesOpen;
  };
  // Returns how many real people moved to defend, like rallyVillageDefenders.
  Game.prototype.chooseScenarioDefense = function(target) {
    this.defendChoicesOpen = false;
    let count;
    if (target === 'base') count = this.rallyVillageDefenders();
    else {
      const store = this.endangeredScenarioStores().find(b => b.id === target);
      if (!store) { this.renderScenarioStatus(); return 0; }
      this.scenarioSelectedStoreId = store.id;
      this.camera.x = store.x * TILE; this.camera.y = store.y * TILE;
      count = this.rallyVillageDefenders(store.id);
    }
    this.renderScenarioStatus();
    return count;
  };

  // --- End of the game: what the community became.
  Game.prototype.renderGameSummary = function() {
    const list = node('gameSummary');
    if (!list) return [];
    const people = this.units.filter(u => u.owner === 0 && u.health > 0).length;
    const bonds = this.buildings.filter(b => b.type === 'base' && b.alive && (b.owner === 0 && Number.isFinite(b.integratedFromOwner) || b.owner > 0 && Number.isFinite(b.allianceSignedDay))).length;
    const progress = this.gameMode === 'confederation' && this.scenarioProgress ? this.scenarioProgress() : null;
    const totem = this.totemInfo?.();
    const lines = [
      `Giorni vissuti: ${this.totalDays}`,
      `Abitanti in vita: ${people}`,
      `Comunità alleate o unite: ${progress ? progress.communities : bonds}`,
      progress ? `Tipi di botteghe attive: ${progress.workshopTypes}` : null,
      totem ? `Animale sacro: ${totem.animal} (${totem.italic})` : null
    ].filter(Boolean);
    list.innerHTML = lines.map(line => `<li>${esc(line)}</li>`).join('');
    return lines;
  };
  const showResult = Game.prototype.showGameResult;
  if (showResult) Game.prototype.showGameResult = function(...args) { const result = showResult.apply(this, args); this.renderGameSummary(); return result; };
  const endGame = Game.prototype.endGame;
  Game.prototype.endGame = function(...args) { const result = endGame.apply(this, args); this.renderGameSummary(); return result; };

  // --- The first-steps guide can be read again at any time; the game waits meanwhile.
  Game.prototype.openGuide = function() {
    if (this.startExperienceStage || this.gameEnded) return false;
    this.guideOpen = true; this.guideReturnPaused = this.paused;
    this.setPaused(true);
    this.startExperienceStage = 'tutorial'; this.startTutorialIndex = 0;
    for (const id of ['startPlaces', 'startModes', 'startWorldSizes', 'startTotems', 'startExplore']) node(id)?.classList.add('hidden');
    const title = node('startTitle'), description = node('startDescription');
    if (title) title.textContent = 'Guida';
    if (description) description.textContent = 'La partita resta in pausa mentre leggi.';
    node('startTutorial')?.classList.remove('hidden');
    node('startExperience')?.classList.remove('hidden');
    node('pauseNotice')?.classList.add('hidden');
    for (const id of ['partitaMenu', 'gameMenu']) { const menu = node(id); if (menu) menu.open = false; }
    this.showStartTutorialStep();
    this.refreshContextDock?.();
    return true;
  };
  const finish = Game.prototype.finishStartExperience;
  Game.prototype.finishStartExperience = function(...args) {
    if (!this.guideOpen) return finish.apply(this, args);
    this.guideOpen = false; this.startExperienceStage = null;
    node('startExperience')?.classList.add('hidden');
    this.refreshContextDock?.();
    this.setPaused(this.guideReturnPaused);
    this.message('Guida chiusa.');
    return true;
  };

  // --- Folding minimap, remembered on this device.
  Game.prototype.setMinimapCollapsed = function(collapsed) {
    this.minimapCollapsed = !!collapsed;
    const map = node('minimap'), button = node('minimapToggle');
    if (map) map.hidden = this.minimapCollapsed;
    if (button) {
      button.textContent = this.minimapCollapsed ? 'Mappa' : '×';
      button.setAttribute?.('aria-pressed', String(this.minimapCollapsed));
      button.setAttribute?.('aria-label', this.minimapCollapsed ? 'Mostra la minimappa' : 'Nascondi la minimappa');
      button.classList.toggle('collapsed', this.minimapCollapsed);
    }
    try { localStorage.setItem(MINIMAP_KEY, this.minimapCollapsed ? '1' : '0'); } catch {}
    return this.minimapCollapsed;
  };
  const drawMinimap = Game.prototype.drawMinimap;
  Game.prototype.drawMinimap = function(...args) { return this.minimapCollapsed ? undefined : drawMinimap.apply(this, args); };

  // --- Equipment: touch a slot on the figure to wear or remove what fits there.
  const SLOT_NAME = {head:'Testa', body:'Corpo', hand:'Mano'};
  Game.prototype.characterSlotTap = function(slot) {
    const u = this.units.find(p => p.id === this.characterPersonId && p.owner === 0 && p.health > 0);
    if (!u || !SLOT_NAME[slot]) return false;
    const kit = this.personEquipment(u.id), catalog = window.TERRA_EQUIPMENT.catalog, worn = kit.slots[slot];
    const select = node('characterItems'), status = node('characterStatus');
    if (worn) { if (select) select.value = worn.id; return this.characterTransfer('bag'); }
    // Items this person can reach now, as computed by renderCharacter.
    const options = [...(this.characterExpected?.keys?.() || [])];
    const fit = (this.gear || []).find(i => options.includes(i.id) && i.location.kind !== 'equipped' && catalog[i.type]?.slot === slot);
    if (!fit) { if (status) status.textContent = `${SLOT_NAME[slot]}: nessun oggetto adatto qui vicino o nella borsa.`; return false; }
    if (select) select.value = fit.id;
    return this.characterTransfer('equipped');
  };
  const renderCharacter = Game.prototype.renderCharacter;
  Game.prototype.renderCharacter = function(...args) {
    const result = renderCharacter.apply(this, args);
    const u = this.units.find(p => p.id === this.characterPersonId && p.owner === 0 && p.health > 0);
    if (!u) return result;
    for (const slot of window.TERRA_EQUIPMENT.rules.slots) {
      const el = node('gear-' + slot);
      if (!el) continue;
      el.setAttribute?.('role', 'button'); el.setAttribute?.('tabindex', '0');
      el.classList.add('gear-slot');
      el.title = this.personEquipment(u.id).slots[slot] ? 'Tocca per metterlo in borsa' : 'Tocca per indossare un oggetto adatto';
    }
    // Sewing and forging appear only beside a rack or a foundry.
    const racks = node('characterRacks'), foundries = node('characterFoundries');
    const hasRack = !!racks?.value, hasFoundry = !!foundries?.value;
    const show = (id, visible) => { const el = node(id); if (el) el.hidden = !visible; const label = el?.closest?.('label'); if (label) label.hidden = !visible; };
    show('characterRacks', hasRack); show('characterStore', hasRack); show('characterCraftTunic', hasRack);
    show('characterFoundries', hasFoundry); show('characterForgeAxe', hasFoundry);
    return result;
  };

  const initUI = Game.prototype.initUI;
  Game.prototype.initUI = function() {
    initUI.call(this);
    const choices = node('scenarioDefendChoices');
    if (choices) choices.onclick = event => { const button = event.target.closest?.('[data-defend]'); if (button) this.chooseScenarioDefense(button.dataset.defend); };
    const guide = node('guideBtn');
    if (guide) guide.onclick = () => this.openGuide();
    const toggle = node('minimapToggle');
    if (toggle) toggle.onclick = () => this.setMinimapCollapsed(!this.minimapCollapsed);
    let collapsed = false;
    try { collapsed = localStorage.getItem(MINIMAP_KEY) === '1'; } catch {}
    this.setMinimapCollapsed(collapsed);
    for (const slot of ['head', 'body', 'hand']) {
      const el = node('gear-' + slot);
      if (!el) continue;
      el.onclick = () => this.characterSlotTap(slot);
      el.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault?.(); this.characterSlotTap(slot); } };
    }
    if (typeof document !== 'undefined' && typeof document.createElement === 'function' && document.head && !node('playerPanelsStyle')) {
      const style = document.createElement('style');
      style.id = 'playerPanelsStyle';
      style.textContent = '.scenario-defend{display:grid;gap:6px;margin:0 12px 10px}.scenario-defend button{margin:0}.game-summary{margin:0 0 12px;padding-left:18px;display:grid;gap:3px;text-align:left}.minimap-toggle{position:absolute;right:144px;top:144px;z-index:5;width:26px;height:26px;padding:0;border-radius:7px;border:1px solid #bca36b;background:#283126ee;color:#f3e9cb;font-size:14px;line-height:1}.minimap-toggle.collapsed{right:10px;top:100px;width:auto;height:32px;padding:0 10px;font-size:12px}@media(max-width:420px){.minimap-toggle{right:116px;top:124px}.minimap-toggle.collapsed{right:10px;top:100px}}.gear-slot{cursor:pointer;border:1px dashed #b59b6580;border-radius:6px;padding:4px 6px}.gear-slot:focus-visible{outline:2px solid #c99d4e}';
      document.head.appendChild(style);
    }
  };
})();
