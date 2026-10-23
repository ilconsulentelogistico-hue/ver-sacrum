const {test}=require("node:test"),assert=require("node:assert/strict"),make=require("./harness.cjs");
const setup=(storage=[])=>{const e=make(storage,{neutrals:true});e.g.gameMode="confederation";e.g.newGame(123456);return e;};

test("a raid on a remote store offers one Difendi choice between the common house and the store",()=>{
  const {g,run,byId}=setup();
  const store=run('new Building("warehouse",50,41,0,true)');g.buildings.push(store);g.ensureInventories();store.inventory.items.food=8;
  g.spawnRaid();const raider=g.raiders[0];raider.x=store.x+1.5;raider.y=store.y;raider.raidStoreId=store.id;
  for(const other of g.raiders.slice(1))other.health=0;
  g.renderScenarioStatus();
  for(const id of ["scenarioStoreDefenseButton","scenarioStoreFocusButton","scenarioThiefButton","scenarioRecoveredFoodButton"])assert.equal(byId[id].hidden,true,`${id} is merged`);
  assert.match(byId.scenarioRallyButton.textContent,/^Difendi… · Casa comune o magazzino minacciato/);
  assert.equal(byId.scenarioDefendChoices.hidden,true);
  assert.equal(g.toggleDefendChoices(),true);
  assert.equal(byId.scenarioDefendChoices.hidden,false);
  assert.match(byId.scenarioDefendChoices.innerHTML,/data-defend="base"/);
  assert(byId.scenarioDefendChoices.innerHTML.includes(`data-defend="${store.id}"`));
  const count=g.chooseScenarioDefense(store.id);
  assert(count>0&&count<=3);assert.equal(byId.scenarioDefendChoices.hidden,true);
  assert.equal(g.camera.x,store.x*30);
  assert(g.units.filter(u=>u.ralliedRaidLevel===g.raidLevel).every(u=>!u.task||Math.hypot(u.task.x-store.x,u.task.y-store.y)<4));
});

test("a raid on the village alone defends the common house with one touch",()=>{
  const {g,byId}=setup();g.spawnRaid();g.renderScenarioStatus();
  assert.equal(byId.scenarioRallyButton.textContent,"Difendi la Casa comune");
  if(!byId.scenarioNextButton.classList.contains("hidden")&&byId.scenarioNextButton.textContent===byId.scenarioThreatButton.textContent)assert.equal(byId.scenarioNextButton.hidden,true,"no duplicate Show button");
  assert(g.chooseScenarioDefense("base")>0);
});

test("a fleeing thief and dropped food each need a single button",()=>{
  const {g,run,byId}=setup();
  const store=g.buildings.find(b=>b.owner===0&&b.type==="warehouse");
  const thief=run(`new Raider(${store.x+2},${store.y+1},1)`);thief.lootFood=5;thief.lootStoreId=store.id;g.raiders.push(thief);
  g.renderScenarioStatus();
  assert.equal(byId.scenarioThiefButton.hidden,true);
  assert.equal(byId.scenarioThiefInterceptButton.textContent,"Insegui il ladro · 5 cibo");
  byId.scenarioThiefInterceptButton.onclick();
  assert.equal(g.camera.x,thief.x*30,"Insegui also shows the thief");
  thief.health=0;g.recoverDeadCargo();g.renderScenarioStatus();
  assert.equal(byId.scenarioRecoveredFoodButton.hidden,true);
  assert.equal(byId.scenarioCollectFoodButton.textContent,"Recupera 5 cibo a terra");
});

test("the end of the game summarises the community",()=>{
  const {g,byId}=setup();g.totalDays=123;g.endGame();
  assert.match(byId.gameSummary.innerHTML,/Giorni vissuti: 123/);
  assert.match(byId.gameSummary.innerHTML,/Abitanti in vita: 5/);
  assert.match(byId.gameSummary.innerHTML,/Comunità alleate o unite: 0/);
});

test("the guide reopens during a game and gives the time back as it was",()=>{
  const {g,byId}=setup();g.setPaused(false);
  assert(g.openGuide());
  assert.equal(g.startExperienceStage,"tutorial");assert.equal(g.paused,true);
  assert(!byId.startExperience.classList.contains("hidden"));assert.equal(byId.startTitle.textContent,"Guida");
  assert.equal(g.save(),false,"no save while the guide is open");
  assert.equal(g.openGuide(),false);
  g.finishStartExperience();
  assert.equal(g.startExperienceStage,null);assert.equal(g.paused,false);
  assert(byId.startExperience.classList.contains("hidden"));
  assert(g.save());
});

test("the minimap folds away and stays folded on this device",()=>{
  const {g,byId,storage}=setup();
  assert.equal(g.setMinimapCollapsed(true),true);
  assert.equal(byId.minimap.hidden,true);assert.equal(byId.minimapToggle.textContent,"Mappa");
  assert.equal(storage.get("ver-sacrum-minimap-collapsed-v1"),"1");
  assert.equal(g.drawMinimap(),undefined);
  const again=make([...storage],{});assert.equal(again.g.minimapCollapsed,true);
  again.g.setMinimapCollapsed(false);assert.equal(again.byId.minimap.hidden,false);
});

test("touching a slot on the figure removes and wears the item there",()=>{
  const {g}=setup();const u=g.units.find(p=>p.owner===0);
  assert(g.openCharacter(u.id));
  assert.equal(g.personEquipment(u.id).slots.body?.type,"tunic");
  assert(g.characterSlotTap("body"));
  assert.equal(g.personEquipment(u.id).slots.body,null);
  assert(g.characterSlotTap("body"));
  assert.equal(g.personEquipment(u.id).slots.body?.type,"tunic");
  assert.equal(g.characterSlotTap("head"),false,"nothing fits the head yet");
});
