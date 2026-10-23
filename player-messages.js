// The message bar speaks of the player's people and buildings (Claude, 23/10/2026). The everyday
// work of other villages (gathering, fields, workshops, leaving a District, harvests, births)
// stays silent; diplomacy, raids and threats are announced elsewhere and are not touched.
(() => {
  'use strict';
  const quiet = (g, owner, run) => {
    if (owner === 0 || owner === undefined || owner === null) return run();
    const was = g._quietOthers;
    g._quietOthers = true;
    try { return run(); } finally { g._quietOthers = was; }
  };
  const message = Game.prototype.message;
  Game.prototype.message = function(...args) {
    if (this._quietOthers) return;
    return message.apply(this, args);
  };
  // Methods whose first argument is the person doing the work.
  for (const name of ['assignGather', 'assignFarm', 'assignBuild', 'assignTame', 'assignEnter', 'assignAttack', 'assignRepair', 'assignProduction', 'assignHaul', 'assignMove', 'continueGather', 'returnToStorage', 'deposit', 'updateUnit']) {
    const fn = Game.prototype[name];
    if (!fn) continue;
    Game.prototype[name] = function(u, ...rest) { return quiet(this, u?.owner, () => fn.call(this, u, ...rest)); };
  }
  // Methods whose first argument is the building.
  for (const name of ['buildingDay', 'updateBuilding']) {
    const fn = Game.prototype[name];
    if (!fn) continue;
    Game.prototype[name] = function(b, ...rest) { return quiet(this, b?.owner, () => fn.call(this, b, ...rest)); };
  }
  // Neutral villages barter among themselves.
  const neutralTrade = Game.prototype.assignNeutralTradeCaravans;
  if (neutralTrade) Game.prototype.assignNeutralTradeCaravans = function(...args) { return quiet(this, 1, () => neutralTrade.apply(this, args)); };
  const release = Game.prototype.releaseResident;
  Game.prototype.releaseResident = function(id, ...rest) {
    return quiet(this, this.units.find(u => u.id === id)?.owner, () => release.call(this, id, ...rest));
  };
})();
