// UI/UX Lotto B: separate menus, visible save time and confirmations.
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const SAVE_PREFIX = "terra-italica-save-v5";
  const SAVED_AT_PREFIX = "ver-sacrum-saved-at-v1-";
  const worldSize = game => game.world?.size || game.experimentalWorldSize || WORLD_SIZE;
  const saveSlot = game => worldSize(game) > WORLD_SIZE ? `${SAVE_PREFIX}-${worldSize(game)}` : SAVE_PREFIX;
  const savedAtKey = game => `${SAVED_AT_PREFIX}${worldSize(game)}`;
  const stored = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const hasSave = game => {
    if (stored(saveSlot(game))) return true;
    return worldSize(game) <= WORLD_SIZE && ["terra-italica-save-v4", "terra-italica-save-v3", SAVE_KEY].some(stored);
  };
  const assaultBase = (game, pos, radius) => game.nearestAt(game.buildings, pos, radius,
    b => b instanceof Building && b.type === "base" && b.alive && b.built && [1, 2].includes(b.owner));

  Game.prototype.refreshSaveControls = function() {
    const exists = hasSave(this), load = $("loadBtn"), note = $("loadStatus"), status = $("saveStatus");
    if (load) { load.disabled = !exists; load.title = exists ? "Ricarica il salvataggio dopo una conferma." : "Nessun salvataggio disponibile per questa mappa."; }
    if (note) note.textContent = exists ? "chiede conferma" : "nessun salvataggio per questa mappa";
    if (status) {
      const stamp = exists ? stored(savedAtKey(this)) : null;
      const date = stamp && new Date(stamp);
      status.textContent = date && !Number.isNaN(date.getTime())
        ? `Salvato alle ${date.toLocaleTimeString("it-IT", {hour:"2-digit", minute:"2-digit"})}`
        : exists ? "Salvataggio esistente · ora non disponibile" : "Nessun salvataggio";
    }
  };
  const save = Game.prototype.save;
  Game.prototype.save = function(show = false) {
    const ok = save.call(this, show);
    if (ok) { try { localStorage.setItem(savedAtKey(this), new Date().toISOString()); } catch {} this.refreshSaveControls(); }
    return ok;
  };
  const newGame = Game.prototype.newGame;
  Game.prototype.newGame = function(...args) { const result = newGame.apply(this, args); this.refreshSaveControls(); return result; };
  const message = Game.prototype.message;
  Game.prototype.message = function(text, ...args) {
    return message.call(this, typeof text === "string" ? text.replace("Puoi salvare dal menu ☰.", "Puoi salvare dal menu Partita.") : text, ...args);
  };
  const load = Game.prototype.load;
  Game.prototype.load = function() { const ok = load.call(this); this.refreshSaveControls(); return ok; };
  const initUI = Game.prototype.initUI;
  Game.prototype.initUI = function() {
    initUI.call(this);
    $("loadBtn").onclick = () => {
      if (!hasSave(this)) { this.refreshSaveControls(); return; }
      if (!confirm("Caricare la partita salvata? I progressi dopo l’ultimo salvataggio andranno persi.")) return;
      this.load();
    };
    const gameMenu = $("gameMenu"), partitaMenu = $("partitaMenu");
    gameMenu?.addEventListener("toggle", () => { if (gameMenu.open && partitaMenu) partitaMenu.open = false; });
    partitaMenu?.addEventListener("toggle", () => { if (partitaMenu.open && gameMenu) gameMenu.open = false; });
    partitaMenu?.addEventListener("click", event => {
      const id = event.target.closest?.("button")?.id;
      if (["saveBtn", "loadBtn", "newWorldBtn"].includes(id)) partitaMenu.open = false;
    });
    this.refreshSaveControls();
  };
  const applyOrder = Game.prototype.applyOrder;
  Game.prototype.applyOrder = function(order, pos, tx, ty, unit = this.selected) {
    if (order === "attack" && unit?.mobilized && assaultBase(this, pos, .9)
        && !confirm("Assaltare questa Casa comune? Le relazioni cambieranno e i mobilitati rischieranno la vita.")) return;
    return applyOrder.call(this, order, pos, tx, ty, unit);
  };
  const contextTap = Game.prototype.rtsContextTap;
  Game.prototype.rtsContextTap = function(sx, sy) {
    const point = this.screenToWorld(sx, sy), pos = {x:point.x/TILE, y:point.y/TILE};
    if (assaultBase(this, pos, .65) && (this.rtsSelectedUnits?.() || []).some(u => u.mobilized)
        && !confirm("Assaltare questa Casa comune? Le relazioni cambieranno e i mobilitati rischieranno la vita.")) return;
    return contextTap.call(this, sx, sy);
  };
})();
