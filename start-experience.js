// First play: choose a real site on the generated map, then learn the first commands.
(() => {
  "use strict";
  const STEPS = [
    "1 di 4 · I cinque giovani sono persone vere: selezionane uno sulla mappa o nella scheda Abitanti. Le sue abilità restano anche se cambia mestiere.",
    "2 di 4 · Apri Ordini, scegli Raccogli e tocca un albero o una fonte di cibo. Il giovane porta la merce nel suo inventario.",
    "3 di 4 · Apri Costruisci per avviare case, campi e botteghe. Materiali e lavoratori devono arrivare davvero sul posto.",
    "4 di 4 · Apri Relazioni per conoscere i villaggi vicini. Puoi commerciare, stringere accordi o cercare un’integrazione pacifica. Buona partita!"
  ];
  const LABELS = ["Terre a nord-ovest", "Terre a nord-est", "Terre a sud"];
  const ACTIVE_WORLD_KEY = "ver-sacrum-active-world-size-v1";
  Game.prototype.beginStartSelection = function(seed = null) {
    this.gameMode = "confederation";
    if (typeof location !== "undefined" && !window.__TEST_HARNESS__ && !new URLSearchParams(location.search).has("worldSize") && this.experimentalWorldSize === WORLD_SIZE) this.experimentalWorldSize = 256;
    this.startLocationChoice = null;
    this.startExperienceStage = "places";
    this.newGame(seed === null ? this.seed : seed);
    this.setPaused(true);
    $("#pauseNotice").classList.add("hidden");
    this.startExperienceStage = "places";
    $("#startTitle").textContent = "Dove fondare il villaggio?";
    $("#startDescription").textContent = "Scegli grandezza della mappa, modalità e luogo dei cinque giovani. I luoghi mostrano le risorse vicine.";
    this.showStartPlaces();
    this.showStartModes();
    this.showStartWorldSizes();
    $("#startPlaces").classList.remove("hidden");
    $("#startModes").classList.remove("hidden");
    $("#startWorldSizes").classList.remove("hidden");
    $("#startTutorial").classList.add("hidden");
    $("#startExperience").classList.remove("hidden");
  };
  Game.prototype.showStartPlaces = function() {
    const options = this.findSpawnOptions();
    $("#startPlaces").innerHTML = options.map((site, i) =>
      `<button type="button" data-start-place="${i}"><b>${LABELS[i]}</b><span>${site.biome} · legna ${site.wood} · cibo ${site.food} · pietra entro 20 caselle ${site.stone}</span></button>`
    ).join("");
  };
  Game.prototype.showStartWorldSizes = function() {
    $("#startWorldSizes").querySelectorAll("[data-start-world-size]").forEach(button => button.classList.toggle("active",Number(button.dataset.startWorldSize)===this.experimentalWorldSize));
  };
  Game.prototype.chooseStartWorldSize = function(size) {
    if(this.startExperienceStage!=="places" || ![256,512].includes(size)) return false;
    this.experimentalWorldSize=size;this.newGame(this.seed);this.setPaused(true);
    this.showStartPlaces();this.showStartWorldSizes();this.showStartModes();
    return true;
  };
  Game.prototype.showStartModes = function() {
    $("#startModes").querySelectorAll("[data-start-mode]").forEach(button => button.classList.toggle("active", button.dataset.startMode === this.gameMode));
  };
  Game.prototype.chooseStartMode = function(mode) {
    if (this.startExperienceStage !== "places" || !["confederation", "sandbox"].includes(mode)) return false;
    this.gameMode = mode;
    this.newGame(this.seed);
    this.setPaused(true);
    $("#pauseNotice").classList.add("hidden");
    this.showStartModes();
    return true;
  };
  Game.prototype.chooseStartLocation = function(index) {
    if (this.startExperienceStage !== "places" || !Number.isInteger(index) || index < 0 || index > 2) return false;
    const seed = this.seed;
    this.startLocationChoice = index;
    try { this.newGame(seed); }
    finally { this.startLocationChoice = null; }
    this.setPaused(true);
    $("#pauseNotice").classList.add("hidden");
    this.startExperienceStage = "tutorial";
    this.startTutorialIndex = 0;
    $("#startTitle").textContent = "I primi passi";
    $("#startDescription").textContent = "Il tempo resta fermo finché termini la guida.";
    $("#startPlaces").classList.add("hidden");
    $("#startModes").classList.add("hidden");
    $("#startWorldSizes").classList.add("hidden");
    $("#startTutorial").classList.remove("hidden");
    this.showStartTutorialStep();
    return true;
  };
  Game.prototype.showStartTutorialStep = function() {
    $("#startTutorialStep").textContent = STEPS[this.startTutorialIndex];
    $("#startTutorialNext").textContent = this.startTutorialIndex === STEPS.length - 1 ? "Inizia a giocare" : "Avanti";
  };
  Game.prototype.finishStartExperience = function() {
    this.startExperienceStage = null;
    $("#startExperience").classList.add("hidden");
    this.refreshContextDock();
    this.setPaused(false);
    if(typeof location!=="undefined")try{localStorage.setItem(ACTIVE_WORLD_KEY,String(this.experimentalWorldSize));}catch{}
    this.message("Villaggio fondato. Puoi salvare dal menu ☰.");
  };
  const originalSnapshot=Game.prototype.snapshot;
  Game.prototype.snapshot=function(){return {...originalSnapshot.call(this),startComplete:this.startExperienceStage!=='places'&&this.startExperienceStage!=='tutorial'};};
  const originalSave=Game.prototype.save;
  Game.prototype.save=function(show=false){
    // A hidden tab or service-worker handover may suspend the game mid-choice.
    // Never replace a completed save with an unfinished village.
    if(this.startExperienceStage==='places'||this.startExperienceStage==='tutorial')return false;
    const ok=originalSave.call(this,show);if(ok&&typeof location!=="undefined")try{localStorage.setItem(ACTIVE_WORLD_KEY,String(this.world.size));}catch{}return ok;};
  const initUI = Game.prototype.initUI;
  Game.prototype.initUI = function() {
    initUI.call(this);
    $("#newWorldBtn").onclick = () => {
      if (confirm("Generare un nuovo territorio? Il salvataggio attuale resta disponibile.")) {
        $("#gameMenu").open = false;
        this.beginStartSelection((Math.random() * 2147483647) | 0);
      }
    };
    $("#restartSame").onclick = () => { $("#gameOver").classList.add("hidden"); this.beginStartSelection(this.seed); };
    $("#restartNew").onclick = () => { $("#gameOver").classList.add("hidden"); this.beginStartSelection((Math.random() * 2147483647) | 0); };
    $("#startWorldSizes").onclick = event => {const button=event.target.closest("[data-start-world-size]");if(button)this.chooseStartWorldSize(Number(button.dataset.startWorldSize));};
    $("#startModes").onclick = event => {
      const button = event.target.closest("[data-start-mode]");
      if (button) this.chooseStartMode(button.dataset.startMode);
    };
    $("#startPlaces").onclick = event => {
      const button = event.target.closest("[data-start-place]");
      if (button) this.chooseStartLocation(Number(button.dataset.startPlace));
    };
    $("#startTutorialNext").onclick = () => {
      if (++this.startTutorialIndex >= STEPS.length) this.finishStartExperience();
      else this.showStartTutorialStep();
    };
    $("#startTutorialSkip").onclick = () => this.finishStartExperience();
  };
})();
