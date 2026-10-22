// Raids carry goods away with an existing mobilized person; ownership never changes.
(() => {
  "use strict";
  const targetable = base => base instanceof Building && base.type === "base" && base.alive && base.built && [1,2].includes(base.owner);
  const foodGoods = ["food", "bread", "barleyBread"];
  Game.prototype.beginVillageRaid = function(person, base) {
    if (!targetable(base) || !person || person.owner !== 0 || person.health <= 30 || !person.mobilized || person.location?.kind !== "world" || person.inventory.amount)
      return {ok:false,error:"Serve un abitante mobilitato, sano e senza carico per razziare questo villaggio."};
    if (Number.isFinite(base.raidCooldownDay) && this.totalDays < base.raidCooldownDay)
      return {ok:false,error:`Il villaggio è già stato razziato: riprova dal giorno ${base.raidCooldownDay}.`};
    if (Number.isFinite(base.siegeReadyDay) || this.units.some(u => u.task?.siegeBaseId === base.id))
      return {ok:false,error:"È già in corso un assedio: concludi prima lo scontro."};
    const route = this.pathToBuilding(person, base);
    if (route === null) return {ok:false,error:"Nessun percorso praticabile verso il villaggio."};
    this.cancelTask(person);
    person.task = {type:"raid",target:base.id};
    person.state = "moving";
    person.path = route;
    base.resistance = Math.max(75, base.resistance ?? 0);
    base.loyalty = Math.max(0, (base.loyalty ?? 50) - 15);
    base.allianceSignedDay = null;
    base.integrationSinceDay = null;
    base.siegeDefenderIds = null;
    this.ensurePolitics();
    this.message(`${person.name} va a razziare ${base.factionName || "il villaggio"}. I difensori reagiranno.`);
    return {ok:true};
  };
  Game.prototype.completeVillageRaid = function(person, base) {
    this.ensureInventories();
    const stores = this.buildings.filter(b => b.owner === base.owner && b.alive && b.built && b.inventory && ["market","warehouse","base"].includes(b.type) && Math.hypot(b.x-base.x,b.y-base.y) <= 8)
      .sort((a,b) => Math.hypot(a.x-base.x,a.y-base.y) - Math.hypot(b.x-base.x,b.y-base.y));
    const choice = foodGoods.flatMap(good => stores.map(store => ({good,store,amount:this.available(store,good)}))).find(item => item.amount > 0);
    if (!choice) { this.cancelTask(person); this.message("Razzia fallita: nessuna razione raggiungibile. Nessuna merce creata."); return false; }
    const amount = Math.min(person.inventory.cap, choice.amount);
    choice.store.inventory.items[choice.good] -= amount;
    person.inventory.type = choice.good;
    person.inventory.amount = amount;
    base.raidCooldownDay = this.totalDays + 30;
    base.siegeDefenderIds = null;
    this.cancelTask(person);
    if (!this.returnToStorage(person,null)) { person.state = "idle"; this.message(`${person.name} porta ${amount} razioni: scegli un deposito per consegnarle.`); }
    else this.message(`${person.name} fugge con ${amount} ${this.resourceName(choice.good)}: il bottino arriverà solo al deposito.`);
    return true;
  };
  const oldUnit = Game.prototype.updateUnit;
  Game.prototype.updateUnit = function(person, dt) {
    if (person.task?.type !== "raid") return oldUnit.call(this,person,dt);
    const base = this.findById(this.buildings,person.task.target);
    if (!targetable(base) || person.health <= 30 || (person.morale ?? 70) < 25) {
      this.cancelTask(person);
      this.message(`${person.name} interrompe la razzia.`);
      return;
    }
    if (Math.hypot(person.x-base.x,person.y-base.y) > 2) {
      if (!person.path.length) person.path = this.pathToBuilding(person,base) || [];
      if (!person.path.length) { this.cancelTask(person); this.message("Razzia interrotta: percorso bloccato."); return; }
      this.followPath(person,dt,1.6);
      return;
    }
    if (person.state !== "raiding") {
      person.state = "raiding";
      person.workTimer = 2;
      this.summonVillageDefenders(base,person);
      this.message("I difensori affrontano il razziatore. Tieni d’occhio salute e morale.");
    }
    person.workTimer -= dt;
    if (person.workTimer <= 0) this.completeVillageRaid(person,base);
  };
  const oldSelection = Game.prototype.selectionHTML;
  Game.prototype.selectionHTML = function(entity) {
    const html = oldSelection.call(this,entity);
    return targetable(entity) ? html + `<button id="raidVillage" type="button">Razzia cibo · mobilitato</button>${Number.isFinite(entity.raidCooldownDay) && this.totalDays < entity.raidCooldownDay ? `<p>Prossima razzia dal giorno ${entity.raidCooldownDay}.</p>` : ""}` : html;
  };
  const oldUI = Game.prototype.updateUI;
  Game.prototype.updateUI = function() {
    oldUI.call(this);
    const button = $("#raidVillage");
    if (button) button.onclick = () => {
      const person = this.lastSelectedUnit?.mobilized ? this.lastSelectedUnit : this.units.find(u => u.owner === 0 && u.mobilized && u.health > 30 && !u.task);
      const result = this.beginVillageRaid(person,this.selected);
      if (!result.ok) this.message(result.error);
      else this.save(true);
      this.updateUI();
    };
  };
})();
