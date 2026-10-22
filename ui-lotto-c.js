// UI/UX Lotto C: community actions and a complete, readable stock ledger.
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const usable = u => u.owner === 0 && u.health > 0 && u.location?.kind === "world" && !u.mobilized && u.state === "idle" && !(u.inventory?.amount > 0);
  const score = u => u.skills?.construction || 0;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

  Game.prototype.communityBuilders = function() {
    return this.units.filter(usable).sort((a,b) => score(b)-score(a) || String(a.name).localeCompare(String(b.name)) || String(a.id).localeCompare(String(b.id)));
  };
  Game.prototype.chooseCommunityBuilder = function() {
    const candidates = this.communityBuilders();
    return candidates.find(u => u.id === this.communityBuilderId) || candidates[0] || null;
  };
  const contextTabs = Game.prototype.contextTabs;
  Game.prototype.contextTabs = function() {
    const tabs = contextTabs.call(this);
    if (this.selected instanceof Building && this.selected.owner === 0 && this.selected.type === "base" && this.selected.alive && !tabs.includes("build")) tabs.splice(1,0,"build");
    return tabs;
  };
  Game.prototype.openCommunityView = function(panel) {
    if (this.startExperienceStage) { this.message("Fonda prima la Casa comune."); return false; }
    const base = this.buildings.find(b => b.owner === 0 && b.type === "base" && b.alive);
    if (!base) { this.message("Serve una Casa comune."); return false; }
    this.selected = base;
    this.groupSelection = [];
    for (const u of this.units) u.selected = false;
    $("stockPopover").hidden = true;
    $("gameMenu").open = false;
    this.refreshContextDock();
    this.activateContextTab(panel);
    this.updateUI();
    return true;
  };
  Game.prototype.renderCommunityBuilderChoice = function() {
    const wrap = $("builderChoiceWrap"), select = $("builderChoice");
    if (!wrap || !select) return;
    const active = this.selected instanceof Building && this.selected.owner === 0 && this.selected.type === "base" && !this.startExperienceStage;
    wrap.hidden = !active;
    if (!active) return;
    const people = this.communityBuilders();
    const signature = people.map(u => u.id + ":" + score(u)).join("|");
    if (select.dataset.builderList !== signature) {
      select.innerHTML = people.map(u => '<option value="' + escape(u.id) + '">' + escape(u.name) + ' · costruzione ' + score(u) + '</option>').join("");
      select.dataset.builderList = signature;
    }
    select.disabled = !people.length;
    const chosen = this.chooseCommunityBuilder();
    if (chosen) select.value = chosen.id;
    else select.innerHTML = '<option value="">Nessun costruttore libero</option>';
  };
  Game.prototype.renderStockOverview = function() {
    const list = $("stockOverview");
    if (!list || $("stockPopover").hidden) return;
    this.ensureInventories();
    const stored = {}, carried = {}, free = this.communalStock?.() || {};
    for (const b of this.buildings) if (b.owner === 0 && b.alive && b.built) for (const [good, amount] of Object.entries(b.inventory?.items || {})) stored[good] = (stored[good] || 0) + amount;
    for (const u of this.units) if (u.owner === 0 && u.health > 0 && u.inventory?.type && u.inventory.amount) carried[u.inventory.type] = (carried[u.inventory.type] || 0) + u.inventory.amount;
    const names = Object.keys(window.TERRA_GOODS).sort((a,b) => (stored[b]||0)+(carried[b]||0)-(stored[a]||0)-(carried[a]||0) || this.resourceName(a).localeCompare(this.resourceName(b)));
    const focus = $("stockPopover").dataset.focus;
    list.innerHTML = names.map(good => {
      const total = (stored[good]||0)+(carried[good]||0), available = free[good]||0, onPeople = carried[good]||0;
      return '<div class="stock-row' + (good===focus?' focus':'') + '"><div><b>' + escape(this.resourceName(good)) + '</b><small>Liberi per cantieri ' + available + ' · con abitanti ' + onPeople + '</small></div><strong>' + total + '</strong></div>';
    }).join("");
  };
  Game.prototype.openStockOverview = function(good) {
    if (this.startExperienceStage) { this.message("Fonda prima la Casa comune."); return false; }
    const popover = $("stockPopover");
    popover.dataset.focus = good || "";
    popover.hidden = false;
    $("gameMenu").open = false;
    $("partitaMenu").open = false;
    this.renderStockOverview();
    return true;
  };
  Game.prototype.refreshCommunityControls = function() {
    const ready = !this.startExperienceStage && this.buildings.some(b => b.owner === 0 && b.type === "base" && b.alive);
    for (const id of ["communityBuildBtn", "relationsBarBtn"]) { const button = $(id); if (button) { button.disabled = !ready; button.title = ready ? "" : "Fonda prima la Casa comune."; } }
    for (const button of document.querySelectorAll("[data-stock-focus]")) { button.disabled = !ready; button.title = ready ? "Mostra tutte le scorte." : "Fonda prima la Casa comune."; }
    this.renderCommunityBuilderChoice();
    this.renderStockOverview();
  };
  const finishStartExperience = Game.prototype.finishStartExperience;
  Game.prototype.finishStartExperience = function(...args) { const result = finishStartExperience.apply(this,args); this.refreshCommunityControls(); return result; };
  const updateUI = Game.prototype.updateUI;
  Game.prototype.updateUI = function(...args) { const result = updateUI.apply(this,args); this.refreshCommunityControls(); return result; };
  const initUI = Game.prototype.initUI;
  Game.prototype.initUI = function() {
    initUI.call(this);
    $("stockPopover").hidden = true;
    $("communityBuildBtn").onclick = () => this.openCommunityView("build");
    $("relationsBarBtn").onclick = () => this.openCommunityView("politicsDialog");
    $("stockCloseBtn").onclick = () => { $("stockPopover").hidden = true; };
    for (const button of document.querySelectorAll("[data-stock-focus]")) button.onclick = () => this.openStockOverview(button.dataset.stockFocus);
    $("builderChoice").onchange = event => { this.communityBuilderId = event.target.value || null; this.refreshLottoAControls(); };
  };
})();
