// Playable campaign objective; old saves retain their original camp-based outcome.
(() => {
  "use strict";
  const RULES = Object.freeze({deadlineDays:1800,communities:2,people:8,workshopTypes:2});
  const WORKSHOPS = new Set(["sawmill","mill","bakery","kiln","loom","press","foundry"]);
  window.TERRA_SCENARIO = RULES;
  Game.prototype.scenarioProgress = function() {
    const communities = [1,2].filter(owner => {
      const neutral = this.neutralSettlement(owner);
      return neutral?.base.relationship === "allied" || this.buildings.some(b => b.type === "base" && b.owner === 0 && b.integratedFromOwner === owner && b.alive);
    }).length;
    const people = this.units.filter(u => u.owner === 0 && u.health > 0).length;
    const workshopTypes = new Set(this.buildings.filter(b => b.owner === 0 && b.alive && b.built && WORKSHOPS.has(b.type)).map(b => b.type)).size;
    const founded = ["house","market"].every(type => this.buildings.some(b => b.owner === 0 && b.alive && b.built && b.type === type && !b.integrationOriginOwner));
    return {communities, people, workshopTypes, founded, day:this.totalDays};
  };
  Game.prototype.closestScenarioThreat = function() {
    const base = this.buildings.find(b => b.owner === 0 && b.type === "base" && b.alive);
    const active = this.raiders.filter(r => r.health > 0);
    const camps = (this.warCamps || []).filter(c => c.health > 0);
    const candidates = active.length ? active : camps;
    if (!candidates.length) return null;
    const origin = base || this.units.find(u => u.owner === 0 && u.health > 0) || {x:0,y:0};
    let nearest = candidates[0], distance = Infinity;
    for (const candidate of candidates) {
      const d = (candidate.x-origin.x)**2 + (candidate.y-origin.y)**2;
      if (d < distance) {nearest = candidate; distance = d;}
    }
    return nearest;
  };
  Game.prototype.focusScenarioThreat = function() {
    if (this.gameMode !== "confederation") return false;
    const base = this.buildings.find(b => b.owner === 0 && b.type === "base" && b.alive);
    const origin = base || this.units.find(u => u.owner === 0 && u.health > 0) || {x:0,y:0};
    const active = this.raiders.filter(r => r.health > 0);
    const threats = (active.length ? active : (this.warCamps || []).filter(c => c.health > 0))
      .sort((a,b) => (a.x-origin.x)**2 + (a.y-origin.y)**2 - (b.x-origin.x)**2 - (b.y-origin.y)**2);
    if (!threats.length) return false;
    if (!active.length) this.scenarioPreferredRallyDefenderId = null;
    else if (this.selected instanceof Unit && this.selected.owner === 0) this.scenarioPreferredRallyDefenderId = this.selected.id;
    else if (!(this.selected instanceof Raider && this.selected.id === this.scenarioSelectedThreatId))
      this.scenarioPreferredRallyDefenderId = null;
    const kind = active.length ? "raiders" : "camps";
    const liveIds = new Set(threats.map(t => t.id));
    const seen = this.scenarioThreatCycleKind === kind ?
      (this.scenarioThreatSeenIds || []).filter(id => liveIds.has(id)) : [];
    if (seen.length === threats.length) seen.length = 0;
    const threat = threats.find(t => !seen.includes(t.id));
    seen.push(threat.id);
    this.scenarioThreatCycleKind = kind;
    this.scenarioThreatSeenIds = seen;
    this.scenarioSelectedThreatId = threat.id;
    this.camera.x = threat.x * TILE;
    this.camera.y = threat.y * TILE;
    this.selected = threat;
    this.groupSelection = [];
    $("#scenarioStatus").open = false;
    this.updateUI();
    return true;
  };
  Game.prototype.activeScenarioThieves = function() {
    return this.raiders.filter(r => r.health > 0 && r.lootFood > 0);
  };
  Game.prototype.focusScenarioThief = function() {
    if (this.gameMode !== "confederation") return false;
    const thieves = this.activeScenarioThieves();
    if (!thieves.length) return false;
    this.scenarioPreferredInterceptorId = this.selected instanceof Unit && this.selected.owner === 0 ? this.selected.id :
      this.selected instanceof Raider && this.selected.id === this.scenarioSelectedThiefId ? this.scenarioPreferredInterceptorId : null;
    const current = thieves.findIndex(r => r.id === this.scenarioSelectedThiefId);
    const thief = thieves[(current + 1) % thieves.length];
    this.scenarioSelectedThiefId = thief.id;
    this.camera.x = thief.x * TILE;
    this.camera.y = thief.y * TILE;
    this.selected = thief;
    this.groupSelection = [];
    $("#scenarioStatus").open = false;
    this.updateUI();
    return true;
  };
  Game.prototype.interceptScenarioThief = function() {
    if (this.gameMode !== "confederation") return false;
    const thieves = this.activeScenarioThieves();
    const thief = thieves.find(r => r.id === this.scenarioSelectedThiefId) || thieves[0];
    if (!thief) return false;
    const engaged = this.units.find(u => u.owner === 0 && u.health > 0 && u.mobilized && u.task?.type === "attack" && u.task.target === thief.id);
    if (engaged) { this.message(`${engaged.name} affronta già il ladro.`); return true; }
    const distance = u => Math.hypot(u.x-thief.x,u.y-thief.y);
    const candidates = this.units.filter(u => u.owner === 0 && u.health > 35 && (u.morale ?? 70) >= 25 &&
      u.mobilized && u.location?.kind === "world" && !u.task && !u.guardDuty && !u.healerDuty && distance(u) <= 12)
      .sort((a,b) => distance(a)-distance(b));
    const reachable = u => distance(u) <= 1.15 || this.findPath(u.x,u.y,Math.floor(thief.x),Math.floor(thief.y),1).length;
    const preferred=this.selected instanceof Unit ? this.selected :
      this.selected === thief ? this.units.find(u=>u.id===this.scenarioPreferredInterceptorId) : null;
    const person = candidates.find(u => u === preferred && reachable(u)) || candidates.find(reachable);
    if (!person) {
      this.message("Nessun difensore mobilitato, libero e raggiungibile vicino al ladro.");
      return false;
    }
    this.assignAttack(person,thief);
    person.task.interceptThief = true;
    person.task.repathIn = 0;
    person.task.interceptOriginX = thief.x;
    person.task.interceptOriginY = thief.y;
    this.scenarioPreferredInterceptorId = null;
    this.message(`${person.name} insegue il ladro con ${thief.lootFood} cibo.`);
    this.updateUI();
    return true;
  };
  const previousCombatTick = Game.prototype.combatTick;
  Game.prototype.combatTick = function(person,dt) {
    if (!person.task?.interceptThief) return previousCombatTick.call(this,person,dt);
    const thief = this.raiders.find(r => r.id === person.task.target && r.health > 0 && r.lootFood > 0);
    if (!thief) return this.cancelTask(person);
    // BUILD 159 saves lack an origin: establish it at the first resumed tick.
    if (!Number.isFinite(person.task.interceptOriginX) || !Number.isFinite(person.task.interceptOriginY)) {
      person.task.interceptOriginX = thief.x;
      person.task.interceptOriginY = thief.y;
    }
    if (Math.hypot(thief.x-person.task.interceptOriginX,thief.y-person.task.interceptOriginY) > 18 ||
        Math.hypot(person.x-person.task.interceptOriginX,person.y-person.task.interceptOriginY) > 18) {
      this.cancelTask(person);
      this.message(`${person.name} interrompe l'inseguimento: il ladro è troppo lontano.`);
      return;
    }
    const gap = Math.hypot(person.x-thief.x,person.y-thief.y);
    if (gap > 1.15) {
      person.task.repathIn = Math.max(0,(person.task.repathIn || 0)-dt);
      if (person.task.repathIn === 0) {
        person.path = this.findPath(person.x,person.y,Math.floor(thief.x),Math.floor(thief.y),1);
        person.task.repathIn = person.path.length ? 1 : 2;
      }
      if (person.path.length) this.followPath(person,dt,1.7);
    } else if (person.attackCooldown <= 0) {
      person.path = [];
      person.attackCooldown = .85;
      thief.health -= this.personAttackDamage(person,7+person.skills.combat*2+person.strength*.15);
      person.gain("combat",1);
    }
  };
  Game.prototype.recoveredScenarioFood = function() {
    return this.world.resources.filter(r => r.type === 'food' && r.recoveredLoot === true && r.amount > 0);
  };
  Game.prototype.selectedRecoveredScenarioFood = function() {
    const food=this.recoveredScenarioFood();
    return food.find(r => r.id === this.scenarioSelectedRecoveredFoodId) || food[0] || null;
  };
  Game.prototype.focusRecoveredScenarioFood = function() {
    if (this.gameMode !== 'confederation') return false;
    const food=this.recoveredScenarioFood();
    if (!food.length) return false;
    this.scenarioPreferredCollectorId=this.selected instanceof Unit && this.selected.owner===0 ? this.selected.id :
      this.selected instanceof ResourceNode && this.selected.id===this.scenarioSelectedRecoveredFoodId ? this.scenarioPreferredCollectorId : null;
    const index=food.findIndex(r => r.id === this.scenarioSelectedRecoveredFoodId);
    const pile=food[(index+1)%food.length];
    this.scenarioSelectedRecoveredFoodId=pile.id;
    this.camera.x=pile.x*TILE;
    this.camera.y=pile.y*TILE;
    this.selected=pile;
    this.groupSelection=[];
    $('#scenarioStatus').open=false;
    this.updateUI();
    return true;
  };
  Game.prototype.collectRecoveredScenarioFood = function() {
    if (this.gameMode !== 'confederation') return false;
    const pile=this.selectedRecoveredScenarioFood();
    if (!pile) return false;
    const gathering=this.units.find(u=>u.owner===0 && u.health>0 && u.task?.type==='gather' && u.task.target===pile.id);
    if (gathering) { this.message(`${gathering.name} sta già raccogliendo quel cibo.`); return true; }
    const distance=u=>Math.hypot(u.x-pile.x,u.y-pile.y);
    const workers=this.units.filter(u=>u.owner===0 && u.health>0 && u.location?.kind==='world' &&
      !u.task && !u.guardDuty && !u.healerDuty && u.inventory.amount===0 && distance(u)<=12)
      .sort((a,b)=>distance(a)-distance(b));
    const reachable=u=>distance(u)<=1 || this.findPath(u.x,u.y,Math.floor(pile.x),Math.floor(pile.y),1).length;
    const preferred=this.selected instanceof Unit ? this.selected :
      this.selected===pile ? this.units.find(u=>u.id===this.scenarioPreferredCollectorId) : null;
    const chosen=workers.find(u=>u===preferred && reachable(u)) || workers.find(reachable);
    if (!chosen) {
      this.message('Nessun abitante libero e raggiungibile vicino al cibo recuperato.');
      return false;
    }
    this.assignGather(chosen,pile);
    this.scenarioPreferredCollectorId=null;
    this.message(`${chosen.name} raccoglie ${pile.amount} cibo recuperato.`);
    this.updateUI();
    return true;
  };
  Game.prototype.endangeredScenarioStores = function() {
    const base = this.buildings.find(b => b.owner === 0 && b.type === "base" && b.alive);
    if (!base) return [];
    const stores = [], seen = new Set();
    for (const raider of this.raiders) {
      if (raider.health <= 0 || !raider.raidStoreId || raider.lootFood > 0 || seen.has(raider.raidStoreId)) continue;
      const store = this.buildings.find(b => b.id === raider.raidStoreId && b.type === "warehouse" &&
        b.owner === 0 && b.alive && b.built && Math.hypot(b.x-base.x,b.y-base.y) > 6 &&
        this.available(b,"food") > 0);
      if (store) { stores.push(store); seen.add(store.id); }
    }
    return stores;
  };
  Game.prototype.endangeredScenarioStore = function() {
    const stores = this.endangeredScenarioStores();
    return stores.find(b => b.id === this.scenarioSelectedStoreId) || stores[0] || null;
  };
  Game.prototype.focusScenarioStore = function() {
    if (this.gameMode !== "confederation") return false;
    const stores = this.endangeredScenarioStores();
    if (!stores.length) return false;
    this.scenarioPreferredStoreDefenderId = this.selected instanceof Unit && this.selected.owner === 0 ? this.selected.id :
      this.selected instanceof Building && this.selected.id === this.scenarioSelectedStoreId ? this.scenarioPreferredStoreDefenderId : null;
    const current = stores.findIndex(b => b.id === this.scenarioSelectedStoreId);
    const store = stores[(current + 1) % stores.length];
    this.scenarioSelectedStoreId = store.id;
    this.camera.x = store.x * TILE;
    this.camera.y = store.y * TILE;
    this.selected = store;
    this.groupSelection = [];
    $("#scenarioStatus").open = false;
    this.updateUI();
    return true;
  };
  Game.prototype.rallyVillageDefenders = function(targetId=null) {
    if (this.gameMode !== "confederation" || !this.raiders.some(r => r.health > 0)) return 0;
    const base = this.buildings.find(b => b.owner === 0 && b.type === "base" && b.alive);
    if (!base) return 0;
    const target = targetId ? this.endangeredScenarioStores().find(b => b.id === targetId) : base;
    if (!target) return 0;
    let preferredId = null;
    if (this.selected instanceof Unit && this.selected.owner === 0) preferredId = this.selected.id;
    else if (targetId && this.selected === target) preferredId = this.scenarioPreferredStoreDefenderId;
    else if (!targetId && this.selected instanceof Raider && this.selected.id === this.scenarioSelectedThreatId)
      preferredId = this.scenarioPreferredRallyDefenderId;
    const candidates = this.units.filter(u => u.owner === 0 && u.health > 35 &&
      (u.morale ?? 70) >= 25 && !u.task && u.ralliedRaidLevel !== this.raidLevel &&
      ["world","resident"].includes(u.location?.kind) &&
      Math.hypot(u.x-target.x,u.y-target.y) <= 18)
      .sort((a,b) => Number(b.id === preferredId)-Number(a.id === preferredId) ||
        Number(b.mobilized)-Number(a.mobilized) ||
        Math.hypot(a.x-target.x,a.y-target.y)-Math.hypot(b.x-target.x,b.y-target.y));
    let ready = 0;
    for (const person of candidates) {
      if (ready >= 3) break;
      const newlyMobilized = !person.mobilized;
      const homeId = person.location.kind === "resident" ? person.location.settlementId : null;
      if (newlyMobilized && !this.mobilizePerson(person.id)) continue;
      if (newlyMobilized) {
        person.rallyAutoMobilizedRaidLevel = this.raidLevel;
        person.rallyHomeId = homeId;
      }
      const path = this.pathToBuilding(person,target);
      if (path === null) {
        if (newlyMobilized) {
          this.demobilizePerson(person.id);
          const home = homeId && this.buildings.find(b => b.id === homeId && b.owner === 0 && b.alive && b.built && b.type === "house");
          if (home) this.assignEnter(person,home);
        }
        continue;
      }
      person.stance = "defensive";
      person.ralliedRaidLevel = this.raidLevel;
      if (path.length) {
        const goal = path[path.length-1];
        person.task = {type:"move",x:goal.x,y:goal.y};
        person.path = path;
        person.state = "moving";
      }
      ready++;
    }
    if (targetId) this.scenarioPreferredStoreDefenderId = null;
    else this.scenarioPreferredRallyDefenderId = null;
    this.message(ready ? `${ready} abitanti mobilitati raggiungono ${target === base ? "la casa comune per difenderla" : "il magazzino per difenderlo"}.` :
      "Nessun abitante libero e raggiungibile per la difesa.");
    this.updateUI();
    return ready;
  };
  Game.prototype.releaseRalliedDefenders = function() {
    if (this.gameMode !== "confederation" || this.raiders.some(r => r.health > 0)) return 0;
    let released = 0;
    for (const person of this.units) {
      if (person.owner !== 0 || person.health <= 0 || !person.mobilized ||
          !Number.isFinite(person.rallyAutoMobilizedRaidLevel)) continue;
      const homeId = person.rallyHomeId;
      if (!this.demobilizePerson(person.id)) continue;
      delete person.rallyAutoMobilizedRaidLevel;
      delete person.rallyHomeId;
      const home = homeId && this.buildings.find(b => b.id === homeId && b.owner === 0 && b.alive && b.built && b.type === "house");
      if (home) this.assignEnter(person,home);
      released++;
    }
    this.message(released ? `${released} difensori congedati; i residenti tornano alla propria casa.` :
      "Nessun difensore richiamato da congedare.");
    this.updateUI();
    return released;
  };
  Game.prototype.scenarioNextStep = function() {
    if (this.gameMode !== "confederation" || this.gameEnded) return null;
    if (this.raiders.some(r => r.health > 0)) return {kind:"raid", text:"Una razzia è in corso: controlla i razziatori e raduna i difensori liberi.", button:"Mostra razziatore"};
    const own = type => this.buildings.filter(b => b.owner === 0 && b.alive && b.type === type && !b.integrationOriginOwner);
    for (const [type, label] of [["house","casa"],["market","mercato"]]) {
      const buildings = own(type);
      if (buildings.some(b => b.built)) continue;
      const site = buildings.find(b => !b.built);
      if (site) return {kind:"site", targetId:site.id, text:`Completa la ${label} del tuo villaggio: il cantiere ha bisogno di materiali e di un costruttore.`, button:"Mostra cantiere"};
      return {kind:"build", text:`Costruisci una ${label} del tuo villaggio. Scegli un abitante, poi apri Costruisci.`, button:"Apri Costruisci"};
    }
    const progress = this.scenarioProgress();
    if (progress.people < RULES.people) {
      const house = own("house").find(b => b.built);
      return {kind:"people", targetId:house?.id, text:`Fai crescere la comunità fino a ${RULES.people} abitanti: controlla case, razioni e residenti.`, button:"Mostra abitanti"};
    }
    if (progress.workshopTypes < RULES.workshopTypes) {
      const site = this.buildings.find(b => b.owner === 0 && b.alive && !b.built && WORKSHOPS.has(b.type));
      if (site) return {kind:"site", targetId:site.id, text:`Completa la bottega in costruzione: servono materiali e lavoro sul posto.`, button:"Mostra cantiere"};
      return {kind:"build", text:`Attiva ${RULES.workshopTypes} tipi diversi di botteghe: assegna una persona alla costruzione.`, button:"Apri Costruisci"};
    }
    if (progress.communities < RULES.communities) return {kind:"politics", text:`Unisci ancora ${RULES.communities-progress.communities} comunità con alleanza o integrazione. Apri Relazioni per valutare influenza e fiducia.`, button:"Apri Relazioni"};
    return {kind:"done", text:"Tutti gli obiettivi della Confederazione sono raggiunti.", button:null};
  };
  Game.prototype.focusScenarioNext = function() {
    const step = this.scenarioNextStep();
    if (!step || step.kind === "done") return false;
    if (step.kind === "raid") return this.focusScenarioThreat();
    const target = step.kind === "build" ? this.units.find(u => u.owner === 0 && u.health > 0 && u.location?.kind === "world") :
      step.kind === "politics" ? this.buildings.find(b => b.owner === 0 && b.type === "base" && b.alive) :
      this.buildings.find(b => b.id === step.targetId && b.alive);
    if (!target) { this.message("Nessuna persona o struttura disponibile per questo passo."); return false; }
    this.selected = target;
    this.groupSelection = target instanceof Unit ? [target] : [];
    for (const person of this.units) person.selected = this.groupSelection.includes(person);
    this.camera.x = target.x * TILE; this.camera.y = target.y * TILE;
    $("#scenarioStatus").open = false;
    this.updateUI();
    if (step.kind === "build") this.activateContextTab("build");
    else if (step.kind === "people") this.activateContextTab("communityDialog");
    else if (step.kind === "politics") this.activateContextTab("politicsDialog");
    return true;
  };
  Game.prototype.renderScenarioStatus = function() {
    const panel = $("#scenarioStatus");
    const mode = this.gameMode || "legacy";
    panel.classList.toggle("hidden", mode === "legacy");
    $("#scenarioThreat").classList.toggle("hidden", mode !== "confederation");
    $("#scenarioThreatButton").classList.toggle("hidden", mode !== "confederation");
    $("#scenarioThiefButton").classList.toggle("hidden", mode !== "confederation");
    $("#scenarioThiefInterceptButton").classList.toggle("hidden", mode !== "confederation");
    $("#scenarioRecoveredFoodButton").classList.toggle("hidden", mode !== "confederation");
    $("#scenarioCollectFoodButton").classList.toggle("hidden", mode !== "confederation");
    $("#scenarioRallyButton").classList.toggle("hidden", mode !== "confederation");
    $("#scenarioStoreDefenseButton").classList.toggle("hidden", mode !== "confederation");
    $("#scenarioStoreFocusButton").classList.toggle("hidden", mode !== "confederation");
    $("#scenarioReleaseButton").classList.toggle("hidden", mode !== "confederation");
    $("#scenarioNext").classList.toggle("hidden", mode !== "confederation");
    $("#scenarioNextButton").classList.toggle("hidden", mode !== "confederation");
    if (mode === "legacy") return;
    if (mode === "sandbox") {
      $("#scenarioSummary").textContent = "Sandbox · nessun limite";
      $("#scenarioGoals").textContent = "Costruisci e incontra le comunità vicine. Non c’è una vittoria prestabilita; se perdi tutti gli abitanti o la casa comune, la partita termina.";
      return;
    }
    const p = this.scenarioProgress();
    const next = this.scenarioNextStep();
    $("#scenarioNext").textContent = next ? `Prossimo passo: ${next.text}` : "";
    const nextButton = $("#scenarioNextButton");
    nextButton.classList.toggle("hidden", !next?.button);
    nextButton.textContent = next?.button || "";
    nextButton.onclick = () => this.focusScenarioNext();
    const active = this.raiders.filter(r => r.health > 0);
    const threat = this.closestScenarioThreat();
    const threatButton = $("#scenarioThreatButton");
    $("#scenarioThreat").textContent = active.length
      ? `Razzia in corso: ${active.length} ${active.length === 1 ? "razziatore" : "razziatori"}. Tocca per vedere il più vicino al villaggio${active.length > 1 ? " e poi gli altri" : ""}.`
      : threat ? `Prossima razzia dal giorno ${Math.max(this.totalDays, this.nextRaidDay)}. Puoi vedere il campo ostile più vicino.`
      : "Nessun campo ostile ancora attivo.";
    threatButton.classList.toggle("hidden", !threat);
    threatButton.textContent = active.length > 1 && active.some(r => r.id === this.scenarioSelectedThreatId) ?
      "Mostra altro razziatore" : active.length ? "Mostra razziatore" : "Mostra campo ostile";
    threatButton.onclick = () => this.focusScenarioThreat();
    const thieves = this.activeScenarioThieves();
    const thiefButton = $("#scenarioThiefButton");
    thiefButton.classList.toggle("hidden", !thieves.length);
    thiefButton.textContent = thieves.length > 1 ? `Segui ladro col cibo (${thieves.length})` : "Segui ladro col cibo";
    thiefButton.onclick = () => this.focusScenarioThief();
    const interceptButton = $("#scenarioThiefInterceptButton");
    interceptButton.classList.toggle("hidden", !thieves.length);
    interceptButton.onclick = () => this.interceptScenarioThief();

    if (thieves.length) $("#scenarioThreat").textContent += ` Cibo in fuga: ${thieves.reduce((sum,r)=>sum+r.lootFood,0)}; puoi seguire ${thieves.length === 1 ? "il ladro" : "i ladri"}.`;
    const recovered=this.recoveredScenarioFood();
    const recoveredButton=$("#scenarioRecoveredFoodButton");
    const collectButton=$("#scenarioCollectFoodButton");
    recoveredButton.classList.toggle("hidden", !recovered.length);
    collectButton.classList.toggle("hidden", !recovered.length);
    recoveredButton.textContent=recovered.length>1 ? `Mostra cibo recuperato (${recovered.length})` : "Mostra cibo recuperato";
    recoveredButton.onclick=()=>this.focusRecoveredScenarioFood();
    collectButton.onclick=()=>this.collectRecoveredScenarioFood();
    if (recovered.length) $("#scenarioThreat").textContent += ` Cibo recuperabile a terra: ${recovered.reduce((sum,r)=>sum+r.amount,0)}.`;

    const rallyButton = $("#scenarioRallyButton");
    rallyButton.classList.toggle("hidden", !active.length);
    rallyButton.onclick = () => this.rallyVillageDefenders();
    const endangeredStores = this.endangeredScenarioStores();
    const endangeredStore = endangeredStores.find(b => b.id === this.scenarioSelectedStoreId) || endangeredStores[0];
    const storeNumber = endangeredStores.indexOf(endangeredStore) + 1;
    const storeButton = $("#scenarioStoreDefenseButton");
    storeButton.classList.toggle("hidden", !endangeredStore);
    storeButton.textContent = endangeredStores.length > 1 ? `Difendi magazzino ${storeNumber}/${endangeredStores.length}` : "Difendi magazzino";
    storeButton.onclick = () => endangeredStore && this.rallyVillageDefenders(endangeredStore.id);
    const focusButton = $("#scenarioStoreFocusButton");
    focusButton.classList.toggle("hidden", !endangeredStore);
    focusButton.textContent = endangeredStores.length > 1 && this.scenarioSelectedStoreId ? "Mostra altro magazzino" : "Mostra magazzino";
    focusButton.onclick = () => this.focusScenarioStore();
    if (endangeredStore) $("#scenarioThreat").textContent += endangeredStores.length > 1 ?
      ` ${endangeredStores.length} magazzini lontani sotto minaccia; difesa sul deposito ${storeNumber}/${endangeredStores.length}.` :
      " Un magazzino lontano è sotto minaccia.";
    const releaseButton = $("#scenarioReleaseButton");
    const releasable = this.units.filter(u => u.owner === 0 && u.health > 0 && u.mobilized &&
      Number.isFinite(u.rallyAutoMobilizedRaidLevel)).length;
    releaseButton.classList.toggle("hidden", !!active.length || !releasable);
    releaseButton.textContent = `Congeda ${releasable} difensori`;
    releaseButton.onclick = () => this.releaseRalliedDefenders();
    $("#scenarioSummary").textContent = `Confederazione · ${p.communities}/${RULES.communities} comunità${active.length ? " · RAZZIA" : ""}`;
    $("#scenarioGoals").textContent = `Obiettivi: ${p.communities}/${RULES.communities} comunità alleate o integrate, ${p.people}/${RULES.people} abitanti, ${p.workshopTypes}/${RULES.workshopTypes} tipi di botteghe attive, villaggio proprio ${p.founded ? "fondato" : "da fondare (casa e mercato)"}. Giorno ${p.day}/${RULES.deadlineDays}. Vittoria quando tutti sono raggiunti; sconfitta se perdi comunità/casa comune o scade il tempo.`;
  };
  const oldNew = Game.prototype.newGame;
  Game.prototype.newGame = function(seed) {
    this.scenarioDefeatReason = null;
    oldNew.call(this, seed);
    this.gameMode = this.gameMode || "legacy";
    this.raidsEnabled = this.gameMode === "confederation";
    this.scenarioPreferredInterceptorId=null;
    this.scenarioPreferredCollectorId=null;
    this.scenarioPreferredStoreDefenderId=null;
    this.scenarioSelectedThreatId=null;
    this.scenarioThreatCycleKind=null;
    this.scenarioThreatSeenIds=[];
    this.scenarioPreferredRallyDefenderId=null;
    this.renderScenarioStatus();
  };
  const oldOutcome = Game.prototype.warOutcome;
  Game.prototype.warOutcome = function() {
    if (this.gameMode !== "confederation" && this.gameMode !== "sandbox") return oldOutcome.call(this);
    if (!this.playerPeopleAlive().length) {
      this.scenarioDefeatReason = "La comunità ha perso tutti gli abitanti.";
      return "defeat";
    }
    if (this.gameMode === "confederation") {
      const homeBase = this.buildings.find(b => b.owner === 0 && b.type === "base" && b.alive && b.built &&
        !b.integratedFromOwner && !b.integrationOriginOwner);
      if (!homeBase) {
        this.scenarioDefeatReason = "La Casa comune iniziale è caduta.";
        return "defeat";
      }
    } else if (!this.playerDepositsAlive().length) {
      this.scenarioDefeatReason = "La comunità non ha più depositi operativi.";
      return "defeat";
    }
    if (this.gameMode === "sandbox") return null;
    const p = this.scenarioProgress();
    if (p.communities >= RULES.communities && p.people >= RULES.people && p.workshopTypes >= RULES.workshopTypes && p.founded && this.civicStage() >= 3) return "victory";
    if (p.day >= RULES.deadlineDays) {
      this.scenarioDefeatReason = "Il tempo è scaduto prima di formare la confederazione.";
      return "defeat";
    }
    return null;
  };
  const oldResult = Game.prototype.showGameResult;
  Game.prototype.showGameResult = function(outcome) {
    oldResult.call(this, outcome);
    if (this.gameMode !== "confederation") return;
    $("#gameResultEyebrow").textContent = outcome === "victory" ? "CONFEDERAZIONE FONDATA" : "SCENARIO CONCLUSO";
    $("#gameResultTitle").textContent = outcome === "victory" ? "La comunità è cresciuta" : "La confederazione non è nata";
    $("#gameResultText").textContent = outcome === "victory" ? "Hai fondato casa e mercato, unito due comunità, fatto crescere almeno otto persone e avviato due tipi di botteghe." : this.scenarioDefeatReason || "La comunità ha perso tutti gli abitanti o la casa comune, oppure è scaduto il tempo.";
  };
  const oldUI = Game.prototype.updateUI;
  Game.prototype.updateUI = function() { oldUI.call(this); this.renderScenarioStatus(); };
  const oldDay = Game.prototype.advanceDay;
  Game.prototype.advanceDay = function() { const result = oldDay.call(this); this.renderScenarioStatus(); return result; };
  const oldSpawnRaid = Game.prototype.spawnRaid;
  Game.prototype.spawnRaid = function() {
    const before = this.raiders.length;
    const result = oldSpawnRaid.call(this);
    if (this.gameMode === "confederation" && this.raiders.length > before && this.timeScale > 1) {
      this.setTimeScale(1);
      this.message(`Razzia in arrivo: ${this.raiders.length-before} razziatori. Velocità ridotta a 1× per organizzare la difesa.`);
    }
    return result;
  };
  const oldSnapshot = Game.prototype.snapshot;
  Game.prototype.snapshot = function() { const data = oldSnapshot.call(this); data.gameMode = this.gameMode || "legacy"; return data; };
  const oldLoad = Game.prototype.load;
  Game.prototype.load = function() {
    // The war loader must not discard raiders before the saved mode is restored.
    const previousRaids = this.raidsEnabled;
    this.raidsEnabled = true;
    const ok = oldLoad.call(this);
    if (!ok) { this.raidsEnabled = previousRaids; return false; }
    this.scenarioDefeatReason = null;
    this.gameMode = this.gameMode || "legacy";
    if (this.gameMode === "confederation" && this.gameResult === "defeat") this.warOutcome();
    this.raidsEnabled = this.gameMode === "confederation" || this.gameMode === "legacy" && previousRaids;
    if (!this.raidsEnabled) this.clearDisabledRaids();
    this.scenarioPreferredInterceptorId=null;
    this.scenarioPreferredCollectorId=null;
    this.scenarioPreferredStoreDefenderId=null;
    this.scenarioSelectedThreatId=null;
    this.scenarioThreatCycleKind=null;
    this.scenarioThreatSeenIds=[];
    this.scenarioPreferredRallyDefenderId=null;
    this.renderScenarioStatus();
    this.showGameResult(this.gameResult || "defeat");
    return true;
  };
})();
