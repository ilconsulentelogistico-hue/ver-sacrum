// Each existing person can lose nerve, withdraw, recover and retain morale on save.
(() => {
  "use strict";
  const clamp = n => Math.max(0, Math.min(100, Math.round(n)));
  Game.prototype.ensureMorale = function() {
    for (const person of this.units) if (!Number.isFinite(person.morale)) person.morale = 70;
  };
  const oldDay = Game.prototype.advanceDay;
  Game.prototype.advanceDay = function() {
    const result = oldDay.call(this);
    this.ensureMorale();
    for (const person of this.units) {
      if (person.health <= 0) continue;
      const hungry = person.hungry || person.unfedDays > 0;
      const recovery = hungry ? -7 : 2;
      const injury = person.health < 50 ? -3 : 0;
      const battle = person.task?.type === "attack" ? -2 : 0;
      person.morale = clamp(person.morale + recovery + injury + battle);
    }
    return result;
  };
  const oldAttack = Game.prototype.personAttackDamage;
  Game.prototype.personAttackDamage = function(person, raw) {
    const morale = person.morale ?? 70;
    const factor = morale < 25 ? .65 : morale < 50 ? .85 : morale >= 85 ? 1.1 : 1;
    return oldAttack.call(this, person, raw * factor);
  };
  const oldCombat = Game.prototype.combatTick;
  Game.prototype.combatTick = function(person, dt) {
    if (person.task?.type !== "attack" || !person.task?.siegeBaseId && !person.task?.defendSettlementId && !person.task?.siege)
      return oldCombat.call(this, person, dt);
    this.ensureMorale();
    if (person.morale < 25) {
      if (person.task.defendSettlementId) this.finishVillageDefense(person);
      else this.cancelTask(person);
      this.message(`${person.name} si ritira: morale troppo basso.`);
      return;
    }
    const target = this.findById(this.units, person.task.target);
    const before = target?.health ?? 0;
    const result = oldCombat.call(this, person, dt);
    if (target && target.health < before) {
      target.morale = clamp((target.morale ?? 70) - Math.max(3, (before - target.health) * .8));
      person.morale = clamp(person.morale + 1);
    }
    return result;
  };
  const oldSelection = Game.prototype.selectionHTML;
  Game.prototype.selectionHTML = function(entity) {
    const html = oldSelection.call(this, entity);
    return entity instanceof Unit ? html + `<p>Morale ${Math.round(entity.morale ?? 70)}/100 · sotto 25 si ritira dal combattimento.</p>` : html;
  };
  const oldLoad = Game.prototype.load;
  Game.prototype.load = function() {
    const ok = oldLoad.call(this);
    if (ok) this.ensureMorale();
    return ok;
  };
})();
