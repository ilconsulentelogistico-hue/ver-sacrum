// Civil development is earned from existing people, buildings and agreements.
(() => {
  "use strict";
  const WORKSHOPS = new Set(["sawmill","mill","bakery","kiln","loom","press","foundry"]);
  const LABELS = ["Accampamento", "Villaggio", "Centro artigiano", "Confederazione"];
  window.TERRA_CIVIC_STAGES = LABELS;
  Game.prototype.civicStage = function() {
    const owned = this.buildings.filter(b => b.owner === 0 && b.alive && b.built);
    const types = new Set(owned.map(b => b.type));
    if (!types.has("house") || !types.has("market")) return 0;
    const people = this.units.filter(u => u.owner === 0 && u.health > 0).length;
    const crafts = [...types].filter(type => WORKSHOPS.has(type)).length;
    if (people < 8 || crafts < 2) return 1;
    const partners = [1,2].filter(owner => this.neutralSettlement(owner)?.base.relationship === "allied" || owned.some(b => b.type === "base" && b.integratedFromOwner === owner)).length;
    return partners >= 2 ? 3 : 2;
  };
  const oldUpdate = Game.prototype.update;
  Game.prototype.update = function(dt) {
    this._civicFrameStage = this.civicStage();
    try { return oldUpdate.call(this, dt); }
    finally { this._civicFrameStage = null; }
  };
  const stage = game => game._civicFrameStage ?? game.civicStage();
  const oldBuild = Game.prototype.buildTick;
  Game.prototype.buildTick = function(person, dt) {
    return oldBuild.call(this, person, person.owner === 0 && stage(this) >= 1 ? dt * 1.1 : dt);
  };
  const oldFactory = Game.prototype.updateBuilding;
  Game.prototype.updateBuilding = function(building, dt) {
    return oldFactory.call(this, building, building.owner === 0 && WORKSHOPS.has(building.type) && stage(this) >= 2 ? dt * 1.1 : dt);
  };
  const oldDay = Game.prototype.advanceDay;
  Game.prototype.advanceDay = function() {
    const result = oldDay.call(this);
    if (this.civicStage() >= 3) for (const person of this.units) if (person.owner === 0 && person.health > 0 && !person.hungry) person.morale = Math.min(100, (person.morale ?? 70) + 1);
    return result;
  };
  const oldStatus = Game.prototype.renderScenarioStatus;
  Game.prototype.renderScenarioStatus = function() {
    oldStatus.call(this);
    if (this.gameMode === "legacy") return;
    const level = this.civicStage();
    $("#scenarioSummary").textContent += ` · ${LABELS[level]}`;
    const next = ["Costruisci una casa e un mercato per fondare il Villaggio (+10% costruzione).", "Raggiungi 8 persone e attiva 2 tipi di botteghe per il Centro artigiano (+10% produzione).", "Stringi alleanza o integra 2 comunità per la Confederazione (+1 morale al giorno per i nutriti).", "Tutte le fasi civili raggiunte: costruzione, produzione e morale migliorati."][level];
    $("#scenarioGoals").textContent += ` Fase civile: ${next}`;
  };
})();
