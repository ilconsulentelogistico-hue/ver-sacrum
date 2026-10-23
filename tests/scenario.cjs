const {test}=require("node:test"),assert=require("node:assert/strict"),make=require("./harness.cjs");
const setup=()=>{const e=make([],{neutrals:true});e.g.gameMode="confederation";e.g.newGame(123456);return e;};

test("scenario asks for two real communities, eight people and two working crafts",()=>{
  const {g,run,byId}=setup();
  assert.equal(g.raidsEnabled,true);assert.equal(g.warOutcome(),null);
  const own=g.communalStores(0)[0];own.inventory.capacity=500;own.inventory.items.food=200;
  for(const owner of [1,2]){for(let i=0;i<7;i++)assert(g.diplomacyAction(owner,"gift",`scenario-${owner}-${i}`).ok);assert(g.diplomacyAction(owner,"alliance",`scenario-pact-${owner}`).ok);}
  let p=g.scenarioProgress();assert.equal(p.communities,2);assert.equal(g.warOutcome(),null);
  const base=g.buildings.find(b=>b.owner===0&&b.type==="base");
  for(let i=0;i<3;i++){const u=run(`new Unit("Nuovo ${i}",${base.x+1},${base.y+1},game.rng)`);g.units.push(u);}
  for(const type of ["house","market","mill","loom"]){const b=run(`new Building("${type}",${base.x+2},${base.y+2},0,true)`);g.buildings.push(b);}
  p=g.scenarioProgress();assert.equal(p.people,8);assert.equal(p.workshopTypes,2);assert(p.founded);assert.equal(g.warOutcome(),"victory");
  const house=g.buildings.find(b=>b.owner===0&&b.type==="house");house.integrationOriginOwner=1;assert.equal(g.warOutcome(),null);delete house.integrationOriginOwner;
  g.renderScenarioStatus();assert.match(byId.scenarioGoals.textContent,/2\/2 comunità/);
  assert(g.save(),g.lastSaveError);assert(g.load());assert.equal(g.gameMode,"confederation");assert.equal(g.raidsEnabled,true);assert.equal(g.warOutcome(),"victory");
});

test("confederation falls with its founding base even if a warehouse or integrated village survives",()=>{
  const {g,run}=setup();
  const base=g.buildings.find(b=>b.owner===0&&b.type==="base"&&!b.integratedFromOwner);
  const warehouse=run(`new Building("warehouse",${base.x+3},${base.y+3},0,true)`);
  g.buildings.push(warehouse);
  g.ensurePolitics();
  assert(g.transferNeutralSettlement(1,"integrate","base-defeat-test").ok);
  const alliedBase=g.buildings.find(b=>b.owner===0&&b.type==="base"&&b.integratedFromOwner===1);
  assert(alliedBase&&alliedBase.alive);
  assert.equal(g.warOutcome(),null);
  base.health=0;
  assert.equal(g.warOutcome(),"defeat");
  assert.match(g.scenarioDefeatReason,/Casa comune iniziale/);
  assert(g.save(),g.lastSaveError);
  assert(g.load());
  assert.equal(g.warOutcome(),"defeat","reload keeps the founding base loss");
  g.gameMode="sandbox";
  assert.equal(g.warOutcome(),null,"sandbox can continue from a surviving deposit");
});

test("defeat cause survives a fresh reload for base loss, population loss and deadline",()=>{
  for(const [cause,breakWorld,expected] of [
    ["base",g=>{g.buildings.find(b=>b.owner===0&&b.type==="base"&&!b.integratedFromOwner).health=0},/Casa comune iniziale/],
    ["people",g=>{g.units.filter(u=>u.owner===0).forEach(u=>u.health=0)},/tutti gli abitanti/],
    ["deadline",g=>{g.totalDays=1800},/tempo è scaduto/]
  ]){
    const {g,storage,byId}=setup();
    breakWorld(g);
    assert.equal(g.warOutcome(),"defeat",cause);
    g.endGame("defeat");
    assert.match(byId.gameResultText.textContent,expected,cause);
    const fresh=make([...storage],{neutrals:true});
    assert(fresh.g.load(),`load ${cause}`);
    assert.equal(fresh.g.gameEnded,true,cause);
    assert.match(fresh.byId.gameResultText.textContent,expected,`reason after fresh load: ${cause}`);
  }
});

test("scenario may be lost by deadline, sandbox has no scripted victory or raids",()=>{
  const {g}=setup();g.totalDays=1800;assert.equal(g.warOutcome(),"defeat");assert.match(g.scenarioDefeatReason,/tempo/);
  g.beginStartSelection(123456);assert(g.chooseStartMode("sandbox"));assert(g.chooseStartLocation(1));g.finishStartExperience();
  assert.equal(g.gameMode,"sandbox");assert.equal(g.raidsEnabled,false);g.totalDays=3000;g.warCamps.forEach(c=>c.health=0);
  assert.equal(g.warOutcome(),null);assert(g.save());assert(g.load());assert.equal(g.gameMode,"sandbox");assert.equal(g.raidsEnabled,false);
});

test("save from before scenario keeps its historic rules",()=>{
  const {g,storage}=setup();g.gameMode="legacy";g.raidsEnabled=false;assert(g.save());const raw=JSON.parse(storage.get("terra-italica-save-v5"));delete raw.gameMode;storage.set("terra-italica-save-v5",JSON.stringify(raw));assert(g.load());assert.equal(g.gameMode,"legacy");g.warCamps.forEach(c=>c.health=0);assert.equal(g.warOutcome(),"victory");
});

test("campaign reload keeps real raiders active midway through a battle",()=>{const {g}=setup();g.spawnRaid();assert(g.raiders.length>0);const ids=g.raiders.map(r=>r.id);assert(g.save());assert(g.load());assert.equal(g.gameMode,"confederation");assert.equal(g.raidsEnabled,true);assert.equal(g.raiders.length,ids.length);assert(ids.every(id=>g.raiders.some(r=>r.id===id)))});

test("scenario warns of a raid and touch navigation finds a real threat after reload",()=>{
  const {g,byId}=setup();
  const camp=g.closestScenarioThreat();
  assert(camp&&camp.type==="enemy_camp");
  g.renderScenarioStatus();
  assert.match(byId.scenarioThreat.textContent,/giorno 65/);
  assert.equal(byId.scenarioThreatButton.classList.contains("hidden"),false);
  assert.equal(g.focusScenarioThreat(),true);
  assert.equal(g.selected.id,camp.id);
  assert.equal(g.camera.x,camp.x*30);
  g.spawnRaid();
  g.renderScenarioStatus();
  assert.match(byId.scenarioSummary.textContent,/RAZZIA/);
  assert.match(byId.scenarioThreat.textContent,/3 razziatori/);
  assert.equal(byId.scenarioThreatButton.textContent,"Mostra razziatore");
  assert.equal(g.focusScenarioThreat(),true);
  assert(g.raiders.some(r=>r.id===g.selected.id));
  assert(g.save());assert(g.load());
  assert.equal(g.focusScenarioThreat(),true);
  assert(g.raiders.some(r=>r.id===g.selected.id));
  g.gameMode="sandbox";g.renderScenarioStatus();
  assert.equal(byId.scenarioThreatButton.classList.contains("hidden"),true);
  assert.equal(g.focusScenarioThreat(),false);
});

test("raid rally mobilizes three real available people and keeps their identity on reload",()=>{
  const {g,byId}=setup();
  const ids=g.units.filter(u=>u.owner===0).map(u=>u.id);
  const busy=g.units.find(u=>u.id===ids[0]);const resource=g.world.resources.find(r=>r.amount>0);busy.task={type:"gather",target:resource.id};busy.state="moving";
  const afraid=g.units.find(u=>u.id===ids[1]);afraid.morale=20;
  const veteran=g.units.find(u=>u.id===ids[2]);veteran.mobilized=true;
  assert.equal(g.rallyVillageDefenders(),0,"there is no raid to respond to");
  g.spawnRaid();g.renderScenarioStatus();
  assert.equal(byId.scenarioRallyButton.classList.contains("hidden"),false);
  assert.equal(g.rallyVillageDefenders(),3);
  assert.equal(busy.task.target,resource.id,"existing work is not cancelled");
  assert.equal(busy.mobilized,false);assert.equal(afraid.mobilized,false);
  const defenders=g.units.filter(u=>ids.includes(u.id)&&u.mobilized);
  assert.equal(defenders.length,3);
  assert(defenders.every(u=>u.stance==="defensive"&&u.location.kind==="world"));
  assert(defenders.every(u=>!u.task||u.task.type==="move"));
  assert(g.save());assert(g.load());
  assert(ids.every(id=>g.units.some(u=>u.id===id)));
  assert.equal(g.units.filter(u=>ids.includes(u.id)&&u.mobilized).length,3);
  assert.equal(g.units.find(u=>u.id===busy.id).task.target,resource.id);
  assert.equal(g.rallyVillageDefenders(),0,"already rallied defenders are not mobilized twice");
  assert.equal(g.releaseRalliedDefenders(),0,"active raiders prevent premature release");
  g.raiders.forEach(r=>r.health=0);g.renderScenarioStatus();
  assert.equal(byId.scenarioReleaseButton.classList.contains("hidden"),false);
  assert.equal(g.releaseRalliedDefenders(),2,"only people mobilized by the rally are released");
  assert.equal(g.units.find(u=>u.id===veteran.id).mobilized,true,"a previously mobilized person stays on duty");
  assert.equal(g.units.find(u=>u.id===busy.id).task.target,resource.id,"civilian work is still intact");
  assert.equal(g.units.filter(u=>ids.includes(u.id)&&u.mobilized).length,1);
  assert.equal(g.releaseRalliedDefenders(),0,"release is idempotent");
  assert(g.save());assert(g.load());
  assert.equal(g.units.find(u=>u.id===veteran.id).mobilized,true);
  assert.equal(g.units.filter(u=>ids.includes(u.id)&&u.mobilized).length,1);
});

test("a rallied resident returns to the same house after defenders are released",()=>{
  const {g,run}=setup(),base=g.buildings.find(b=>b.owner===0&&b.type==="base");
  let site=null;
  for(let radius=5;radius<12&&!site;radius++)for(let dy=-radius;dy<=radius&&!site;dy++)for(let dx=-radius;dx<=radius&&!site;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;
    const x=Math.floor(base.x)+dx,y=Math.floor(base.y)+dy;
    if(!g.villagePlacementError("house",x,y))site={x,y};
  }
  assert(site,"a nearby legal house site exists");
  const house=run(`new Building("house",${site.x},${site.y},0,true)`);g.buildings.push(house);
  const person=g.units.find(u=>u.owner===0);person.location={kind:"resident",settlementId:house.id};person.x=house.x;person.y=house.y;house.residents.push(person.id);
  for(const other of g.units)if(other!==person)other.morale=0;
  g.spawnRaid();assert.equal(g.rallyVillageDefenders(),1);
  assert.equal(person.location.kind,"world");assert.equal(person.rallyHomeId,house.id);
  g.raiders.forEach(r=>r.health=0);assert.equal(g.releaseRalliedDefenders(),1);
  assert.equal(person.mobilized,false);
  assert(person.location.kind==="resident"||person.task?.type==="enter","resident either arrived immediately or is walking home");
  for(let i=0;i<160&&person.location.kind==="world";i++)g.updateUnit(person,.5);
  assert.equal(person.location.kind,"resident");
  assert.equal(person.location.settlementId,house.id);
  assert(house.residents.includes(person.id));
});

test("manual duty change excludes a person from later automatic release",()=>{
  const {g}=setup();g.spawnRaid();assert.equal(g.rallyVillageDefenders(),3);
  const person=g.units.find(u=>Number.isFinite(u.rallyAutoMobilizedRaidLevel));assert(person);
  assert(g.demobilizePerson(person.id));
  assert.equal(person.rallyAutoMobilizedRaidLevel,undefined);
  assert(g.mobilizePerson(person.id));
  assert(g.save());assert(g.load());
  g.raiders.forEach(r=>r.health=0);
  assert.equal(g.releaseRalliedDefenders(),2);
  assert.equal(g.units.find(u=>u.id===person.id).mobilized,true);
});

test("remote warehouse defense is an explicit touch choice using nearby real people",()=>{
  const {g,run,byId}=setup();
  const store=run('new Building("warehouse",50,41,0,true)');
  g.buildings.push(store);g.ensureInventories();store.inventory.items.food=8;
  const base=g.buildings.find(b=>b.owner===0&&b.type==="base");
  assert(Math.hypot(store.x-base.x,store.y-base.y)>6);
  g.spawnRaid();
  const raider=g.raiders[0];raider.x=store.x+1.5;raider.y=store.y;raider.raidStoreId=store.id;
  for(const other of g.raiders.slice(1))other.health=0;
  g.renderScenarioStatus();
  assert.match(byId.scenarioThreat.textContent,/magazzino lontano/);
  assert.equal(byId.scenarioStoreDefenseButton.classList.contains("hidden"),false);
  assert.equal(g.rallyVillageDefenders("no-such-store"),0);
  const count=g.rallyVillageDefenders(store.id);
  assert(count>0&&count<=3);
  const defenders=g.units.filter(u=>u.ralliedRaidLevel===g.raidLevel);
  assert.equal(defenders.length,count);
  assert(defenders.every(u=>u.mobilized&&u.stance==="defensive"));
  assert(defenders.every(u=>!u.task||Math.hypot(u.task.x-store.x,u.task.y-store.y)<4));
  assert(g.save());assert(g.load());
  assert.equal(g.units.filter(u=>u.ralliedRaidLevel===g.raidLevel).length,count);
  g.raiders.forEach(r=>r.health=0);
  assert(g.releaseRalliedDefenders()>0);
  g.renderScenarioStatus();
  assert.equal(byId.scenarioStoreDefenseButton.classList.contains("hidden"),true);
});

test("an unreachable remote warehouse does not leave civilians mobilized",()=>{
  const {g,run}=setup();
  const store=run('new Building("warehouse",50,41,0,true)');
  g.buildings.push(store);g.ensureInventories();store.inventory.items.food=8;
  g.spawnRaid();g.raiders[0].raidStoreId=store.id;
  const oldPath=g.pathToBuilding;
  g.pathToBuilding=function(person,target){return target?.id===store.id?null:oldPath.call(this,person,target);};
  const before=g.units.filter(u=>u.owner===0).map(u=>({id:u.id,mobilized:u.mobilized}));
  assert.equal(g.rallyVillageDefenders(store.id),0);
  assert(before.every(({id,mobilized})=>g.units.find(u=>u.id===id).mobilized===mobilized));
  assert.equal(g.units.some(u=>Number.isFinite(u.rallyAutoMobilizedRaidLevel)),false);
});

test("the threatened warehouse can be opened on the map and remains findable after reload",()=>{
  const {g,run,byId}=setup();
  const store=run('new Building("warehouse",50,41,0,true)');
  g.buildings.push(store);g.ensureInventories();store.inventory.items.food=8;
  g.spawnRaid();const raider=g.raiders[0];raider.raidStoreId=store.id;
  g.renderScenarioStatus();
  assert.equal(byId.scenarioStoreFocusButton.classList.contains("hidden"),false);
  byId.scenarioStatus.open=true;
  assert.equal(g.focusScenarioStore(),true);
  assert.equal(g.selected.id,store.id);
  assert.equal(g.camera.x,store.x*30);assert.equal(g.camera.y,store.y*30);
  assert.equal(byId.scenarioStatus.open,false);
  assert(g.save());assert(g.load());
  assert.equal(g.focusScenarioStore(),true);
  assert.equal(g.selected.id,store.id);
  g.raiders.forEach(r=>r.health=0);g.renderScenarioStatus();
  assert.equal(byId.scenarioStoreFocusButton.classList.contains("hidden"),true);
  assert.equal(g.focusScenarioStore(),false);
  g.gameMode="sandbox";assert.equal(g.focusScenarioStore(),false);
});

test("two simultaneous warehouse raids can be viewed and defended separately",()=>{
  const {g,run,byId}=setup();
  const first=run('new Building("warehouse",50,41,0,true)');
  const second=run('new Building("warehouse",38,40,0,true)');
  g.buildings.push(first,second);g.ensureInventories();
  first.inventory.items.food=8;second.inventory.items.food=9;
  g.spawnRaid();
  g.raiders[0].raidStoreId=first.id;
  g.raiders[1].raidStoreId=second.id;
  g.raiders[2].raidStoreId=first.id;
  g.renderScenarioStatus();
  assert.equal(g.endangeredScenarioStores().length,2,"same store appears only once");
  assert.match(byId.scenarioThreat.textContent,/2 magazzini/);
  assert.match(byId.scenarioStoreDefenseButton.textContent,/1\/2/);
  assert(g.focusScenarioStore());assert.equal(g.selected.id,first.id);
  assert(g.focusScenarioStore());assert.equal(g.selected.id,second.id);
  assert.match(byId.scenarioStoreDefenseButton.textContent,/2\/2/);
  const sent=g.rallyVillageDefenders(second.id);
  assert(sent>0);
  assert(g.units.filter(u=>u.ralliedRaidLevel===g.raidLevel).every(u=>!u.task||Math.hypot(u.task.x-second.x,u.task.y-second.y)<4));
  assert(g.save());assert(g.load());
  assert.equal(g.endangeredScenarioStores().length,2);
  assert(g.focusScenarioStore());
  assert(g.endangeredScenarioStores().some(b=>b.id===g.selected.id));
  const old=g.raiders.find(r=>r.raidStoreId===first.id);old.health=0;
  const duplicate=g.raiders.find(r=>r.raidStoreId===first.id&&r.health>0);duplicate.health=0;
  g.renderScenarioStatus();
  assert.equal(g.endangeredScenarioStores().length,1);
  assert.match(byId.scenarioStoreDefenseButton.textContent,/Difendi magazzino/);
  assert.doesNotMatch(byId.scenarioStoreDefenseButton.textContent,/\//);
});


test("the campaign tracks a fleeing food thief, including after reload",()=>{
  const {g,run,byId}=setup();
  const store=g.buildings.find(b=>b.owner===0&&b.type==="warehouse");
  const thief=run(`new Raider(${store.x+2},${store.y+1},1)`);
  thief.lootFood=5;thief.lootStoreId=store.id;g.raiders.push(thief);
  g.renderScenarioStatus();
  assert.equal(byId.scenarioThiefButton.classList.contains("hidden"),false);
  assert.match(byId.scenarioThreat.textContent,/1 razziatore/);
  assert.match(byId.scenarioThreat.textContent,/Cibo in fuga: 5/);
  assert.equal(g.focusScenarioThief(),true);
  assert.equal(g.selected.id,thief.id);assert.equal(g.camera.x,thief.x*30);
  assert(g.save());assert(g.load());
  const restored=g.raiders.find(r=>r.id===thief.id);
  g.renderScenarioStatus();assert.equal(byId.scenarioThiefButton.classList.contains("hidden"),false);
  assert.equal(g.focusScenarioThief(),true);assert.equal(g.selected.id,restored.id);
  const second=run(`new Raider(${store.x+3},${store.y+1},1)`);
  second.lootFood=3;g.raiders.push(second);g.renderScenarioStatus();
  assert.match(byId.scenarioThreat.textContent,/Cibo in fuga: 8/);
  assert.match(byId.scenarioThiefButton.textContent,/\(2\)/);
  assert.equal(g.focusScenarioThief(),true);assert.equal(g.selected.id,second.id);
  assert.equal(g.focusScenarioThief(),true);assert.equal(g.selected.id,restored.id);
  restored.health=0;second.health=0;g.renderScenarioStatus();
  assert.equal(byId.scenarioThiefButton.classList.contains("hidden"),true);
  assert.equal(g.focusScenarioThief(),false);
  g.gameMode="sandbox";g.renderScenarioStatus();
  assert.equal(byId.scenarioThiefButton.classList.contains("hidden"),true);
});


test("a free mobilized defender can intercept the selected food thief without stopping workers",()=>{
  const {g,run,byId}=setup();
  const base=g.buildings.find(b=>b.owner===0&&b.type==="base");
  const thief=run(`new Raider(${base.x+4},${base.y+1},1)`);
  thief.lootFood=5;g.raiders.push(thief);g.renderScenarioStatus();
  assert.equal(byId.scenarioThiefInterceptButton.classList.contains("hidden"),false);
  assert.equal(g.interceptScenarioThief(),false,"a civilian is not silently mobilized");
  const workers=g.units.filter(u=>u.owner===0);
  const busy=workers[0],resource=g.world.resources.find(r=>r.amount>0);
  busy.task={type:"gather",target:resource.id};busy.state="moving";
  const defender=workers[1];defender.x=thief.x+1;defender.y=thief.y;
  assert(g.mobilizePerson(defender.id));
  assert.equal(g.interceptScenarioThief(),true);
  assert.equal(defender.task?.type,"attack");assert.equal(defender.task?.target,thief.id);
  assert.equal(defender.task?.interceptThief,true);
  assert.equal(defender.task?.interceptOriginX,thief.x);
  assert.equal(defender.task?.interceptOriginY,thief.y);
  assert.equal(g.interceptScenarioThief(),true,"an existing pursuit is not duplicated");
  assert.equal(g.units.filter(u=>u.task?.target===thief.id).length,1);
  assert.equal(busy.task.target,resource.id);
  assert.equal(defender.mobilized,true);
  assert(g.save());assert(g.load());
  assert.equal(g.units.find(u=>u.id===defender.id).task?.target,thief.id);
  assert.equal(g.units.find(u=>u.id===defender.id).task?.interceptOriginX,thief.x);
  assert.equal(g.units.find(u=>u.id===busy.id).task?.target,resource.id);
  g.gameMode="sandbox";g.renderScenarioStatus();
  assert.equal(byId.scenarioThiefInterceptButton.classList.contains("hidden"),true);
  assert.equal(g.interceptScenarioThief(),false);
});


test("interception repaths at a bounded rate while chasing a moving thief",()=>{
  const {g,run}=setup();
  const base=g.buildings.find(b=>b.owner===0&&b.type==="base");
  const thief=run(`new Raider(${base.x+5},${base.y+1},1)`);thief.lootFood=5;g.raiders.push(thief);
  const defender=g.units.find(u=>u.owner===0);defender.x=base.x+1;defender.y=base.y+1;
  assert(g.mobilizePerson(defender.id));
  assert.equal(g.interceptScenarioThief(),true);
  const path=g.findPath;let calls=0;g.findPath=function(...args){calls++;return path.apply(this,args)};
  for(let i=0;i<20;i++)g.updateUnit(defender,.05);
  assert(calls<=3,`path searches must be bounded, saw ${calls}`);
  assert.equal(defender.task?.target,thief.id);
  thief.health=0;g.updateUnit(defender,.1);
  assert.equal(defender.task,null);assert.equal(defender.mobilized,true);
});


test("interception ends beyond eighteen cells without releasing the defender",()=>{
  const {g,run}=setup();
  const base=g.buildings.find(b=>b.owner===0&&b.type==="base");
  const thief=run(`new Raider(${base.x+3},${base.y+1},1)`);thief.lootFood=5;g.raiders.push(thief);
  const defender=g.units.find(u=>u.owner===0);defender.x=thief.x+1;defender.y=thief.y;
  assert(g.mobilizePerson(defender.id));assert(g.interceptScenarioThief());
  const origin={x:defender.task.interceptOriginX,y:defender.task.interceptOriginY};
  const path=g.findPath;let calls=0;g.findPath=function(...args){calls++;return path.apply(this,args)};
  thief.x=origin.x+19;g.updateUnit(defender,.1);
  assert.equal(calls,0,"no route search after the target leaves the pursuit area");
  assert.equal(defender.task,null);assert.equal(defender.mobilized,true);
  assert.equal(defender.location.kind,"world");
});

test("build 159 pursuit without stored origin resumes and gains a bounded origin",()=>{
  const {g,run,storage}=setup();
  const base=g.buildings.find(b=>b.owner===0&&b.type==="base");
  const thief=run(`new Raider(${base.x+3},${base.y+1},1)`);thief.lootFood=5;g.raiders.push(thief);
  const defender=g.units.find(u=>u.owner===0);defender.x=thief.x+1;defender.y=thief.y;
  assert(g.mobilizePerson(defender.id));assert(g.interceptScenarioThief());
  assert(g.save());
  const raw=JSON.parse(storage.get("terra-italica-save-v5"));
  const saved=raw.units.find(u=>u.id===defender.id);
  delete saved.task.interceptOriginX;delete saved.task.interceptOriginY;
  storage.set("terra-italica-save-v5",JSON.stringify(raw));
  assert(g.load(),g.lastSaveError);
  const restored=g.units.find(u=>u.id===defender.id);
  g.updateUnit(restored,.1);
  assert.equal(restored.task?.interceptOriginX,thief.x);
  assert.equal(restored.task?.interceptOriginY,thief.y);
  assert.equal(restored.mobilized,true);
});


test("stolen food on the ground can be found and gathered by one real free villager after reload",()=>{
  const {g,run,byId}=setup();
  const base=g.buildings.find(b=>b.owner===0&&b.type==="base");
  const thief=run(`new Raider(${base.x+3},${base.y+1},1)`);
  thief.lootFood=5;thief.health=0;g.raiders.push(thief);g.recoverDeadCargo();
  const pile=g.world.resources.at(-1);
  assert.equal(pile.recoveredLoot,true);assert.equal(pile.amount,5);
  const people=g.units.filter(u=>u.owner===0);
  const worker=people[0];worker.x=pile.x;worker.y=pile.y;
  const busy=people[1],resource=g.world.resources.find(r=>r.id!==pile.id&&r.amount>0);
  busy.task={type:"gather",target:resource.id};busy.state="moving";
  g.renderScenarioStatus();
  assert.equal(byId.scenarioRecoveredFoodButton.classList.contains("hidden"),false);
  assert.equal(byId.scenarioCollectFoodButton.classList.contains("hidden"),false);
  assert.match(byId.scenarioThreat.textContent,/Cibo recuperabile a terra: 5/);
  assert.equal(g.focusRecoveredScenarioFood(),true);
  assert.equal(g.selected.id,pile.id);assert.equal(g.camera.x,pile.x*30);
  assert.equal(g.collectRecoveredScenarioFood(),true);
  assert.equal(g.collectRecoveredScenarioFood(),true,"a second tap reuses the existing worker");
  assert.equal(g.units.filter(u=>u.task?.target===pile.id).length,1);
  assert.equal(worker.task?.target,pile.id);assert.equal(busy.task.target,resource.id);
  assert(g.save());assert(g.load());
  const restoredPile=g.world.resources.find(r=>r.id===pile.id);
  const restoredWorker=g.units.find(u=>u.id===worker.id);
  assert.equal(restoredPile.recoveredLoot,true);
  assert.equal(restoredWorker.task?.target,pile.id);
  for(let i=0;i<40&&restoredPile.amount===5;i++)g.updateUnit(restoredWorker,.25);
  assert(restoredPile.amount<5,"real gathering removes food from the marked pile");
  restoredPile.amount=0;g.renderScenarioStatus();
  assert.equal(byId.scenarioRecoveredFoodButton.classList.contains("hidden"),true);
  assert.equal(byId.scenarioCollectFoodButton.classList.contains("hidden"),true);
});

test("food recovery never commandeers workers or reaches across the map",()=>{
  const {g,run}=setup();
  const base=g.buildings.find(b=>b.owner===0&&b.type==="base");
  const thief=run(`new Raider(${base.x+3},${base.y+1},1)`);
  thief.lootFood=4;thief.health=0;g.raiders.push(thief);g.recoverDeadCargo();
  for(const person of g.units.filter(u=>u.owner===0))person.task={type:"move",x:base.x,y:base.y};
  assert.equal(g.collectRecoveredScenarioFood(),false);
  assert(g.units.filter(u=>u.owner===0).every(u=>u.task?.type==="move"));
  g.gameMode="sandbox";g.renderScenarioStatus();
  assert.equal(g.focusRecoveredScenarioFood(),false);
  assert.equal(g.collectRecoveredScenarioFood(),false);
});


test("a selected eligible mobilized person takes the thief interception order",()=>{
  const {g,run}=setup();
  const base=g.buildings.find(b=>b.owner===0&&b.type==="base");
  const thief=run(`new Raider(${base.x+3},${base.y+1},1)`);thief.lootFood=5;g.raiders.push(thief);
  const [near,chosen]=g.units.filter(u=>u.owner===0);
  assert(g.mobilizePerson(near.id));assert(g.mobilizePerson(chosen.id));
  near.x=thief.x+.2;near.y=thief.y;chosen.x=thief.x+1;chosen.y=thief.y;
  g.selected=chosen;
  assert.equal(g.interceptScenarioThief(),true);
  assert.equal(chosen.task?.target,thief.id);
  assert.equal(near.task,null);
});

test("recovered food goes to a selected free person, otherwise to another eligible one",()=>{
  const {g,run}=setup();
  const base=g.buildings.find(b=>b.owner===0&&b.type==="base");
  const first=run(`new ResourceNode('food',${base.x+3},${base.y+1},5)`);
  first.recoveredLoot=true;g.world.resources.push(first);
  const [near,chosen]=g.units.filter(u=>u.owner===0);
  near.x=first.x+.2;near.y=first.y;chosen.x=first.x+1;chosen.y=first.y;
  g.selected=chosen;
  assert.equal(g.collectRecoveredScenarioFood(),true);
  assert.equal(chosen.task?.target,first.id);assert.equal(near.task,null);
  const second=run(`new ResourceNode('food',${base.x+5},${base.y+1},4)`);
  second.recoveredLoot=true;g.world.resources.push(second);
  g.scenarioSelectedRecoveredFoodId=second.id;
  near.x=second.x+.2;near.y=second.y;
  assert.equal(g.collectRecoveredScenarioFood(),true);
  assert.equal(near.task?.target,second.id);
  assert.equal(chosen.task?.target,first.id,"a busy selected person keeps the original job");
});


test("showing a thief remembers the previously selected defender for the next touch order",()=>{
  const {g,run}=setup();
  const base=g.buildings.find(b=>b.owner===0&&b.type==="base");
  const thief=run(`new Raider(${base.x+3},${base.y+1},1)`);thief.lootFood=5;g.raiders.push(thief);
  const [near,chosen]=g.units.filter(u=>u.owner===0);
  assert(g.mobilizePerson(near.id));assert(g.mobilizePerson(chosen.id));
  near.x=thief.x+.2;near.y=thief.y;chosen.x=thief.x+1;chosen.y=thief.y;
  g.selected=chosen;assert(g.focusScenarioThief());
  assert.equal(g.selected.id,thief.id);assert.equal(g.scenarioPreferredInterceptorId,chosen.id);
  assert(g.interceptScenarioThief());
  assert.equal(chosen.task?.target,thief.id);assert.equal(near.task,null);
  assert.equal(g.scenarioPreferredInterceptorId,null);
});

test("cycling recovered piles keeps the selected collector until an order is given",()=>{
  const {g,run}=setup();
  const base=g.buildings.find(b=>b.owner===0&&b.type==="base");
  const first=run(`new ResourceNode('food',${base.x+3},${base.y+1},5)`);
  const second=run(`new ResourceNode('food',${base.x+5},${base.y+1},4)`);
  first.recoveredLoot=true;second.recoveredLoot=true;g.world.resources.push(first,second);
  const [near,chosen]=g.units.filter(u=>u.owner===0);
  near.x=second.x+.2;near.y=second.y;chosen.x=second.x+1;chosen.y=second.y;
  g.selected=chosen;assert(g.focusRecoveredScenarioFood());
  assert.equal(g.selected.id,first.id);assert.equal(g.scenarioPreferredCollectorId,chosen.id);
  assert(g.focusRecoveredScenarioFood());assert.equal(g.selected.id,second.id);
  assert.equal(g.scenarioPreferredCollectorId,chosen.id);
  assert(g.collectRecoveredScenarioFood());
  assert.equal(chosen.task?.target,second.id);assert.equal(near.task,null);
  assert.equal(g.scenarioPreferredCollectorId,null);
});


test("a chosen defender survives Show warehouse and takes a place in the three-person rally",()=>{
  const {g,run}=setup();
  const store=run('new Building("warehouse",50,41,0,true)');
  g.buildings.push(store);g.ensureInventories();store.inventory.items.food=8;
  g.spawnRaid();g.raiders[0].raidStoreId=store.id;
  const people=g.units.filter(u=>u.owner===0).slice(0,4);
  assert.equal(people.length,4);
  for(const person of people){person.x=store.x-3;person.y=store.y+1;}
  for(const person of people.slice(0,3))assert(g.mobilizePerson(person.id));
  const chosen=people[3];g.selected=chosen;
  assert(g.focusScenarioStore());assert.equal(g.selected.id,store.id);
  assert.equal(g.scenarioPreferredStoreDefenderId,chosen.id);
  assert.equal(g.rallyVillageDefenders(store.id),3);
  assert.equal(chosen.ralliedRaidLevel,g.raidLevel);
  assert.equal(g.scenarioPreferredStoreDefenderId,null);
});

test("a busy preferred warehouse defender is skipped without losing the other rally candidates",()=>{
  const {g,run}=setup();
  const store=run('new Building("warehouse",50,41,0,true)');
  g.buildings.push(store);g.ensureInventories();store.inventory.items.food=8;
  g.spawnRaid();g.raiders[0].raidStoreId=store.id;
  const people=g.units.filter(u=>u.owner===0).slice(0,4);
  for(const person of people){person.x=store.x-3;person.y=store.y+1;}
  const chosen=people[3];g.selected=chosen;
  assert(g.focusScenarioStore());
  chosen.task={type:'move',x:store.x-5,y:store.y};
  assert.equal(g.rallyVillageDefenders(store.id),3);
  assert.equal(chosen.ralliedRaidLevel,undefined);
  assert.equal(g.scenarioPreferredStoreDefenderId,null);
});


test("base rally includes a chosen eligible person ahead of three closer mobilized people",()=>{
  const {g}=setup();g.spawnRaid();
  const base=g.buildings.find(b=>b.owner===0&&b.type==='base');
  const people=g.units.filter(u=>u.owner===0).slice(0,4);
  assert.equal(people.length,4);
  for(const person of people){person.x=base.x+3;person.y=base.y+1;}
  for(const person of people.slice(0,3))assert(g.mobilizePerson(person.id));
  const chosen=people[3];g.selected=chosen;
  assert.equal(g.rallyVillageDefenders(),3);
  assert.equal(chosen.ralliedRaidLevel,g.raidLevel);
  assert.equal(g.units.filter(u=>u.ralliedRaidLevel===g.raidLevel).length,3);
});


test("Show raider cycles every active attacker starting with the nearest",()=>{
  const {g,byId}=setup();g.spawnRaid();
  const base=g.buildings.find(b=>b.owner===0&&b.type==='base');
  const ordered=g.raiders.filter(r=>r.health>0).sort((a,b)=>(a.x-base.x)**2+(a.y-base.y)**2-(b.x-base.x)**2-(b.y-base.y)**2);
  assert.equal(ordered.length,3);
  for(const raider of ordered){
    assert(g.focusScenarioThreat());assert.equal(g.selected.id,raider.id);
    assert.equal(g.camera.x,raider.x*30);
  }
  assert.match(byId.scenarioThreatButton.textContent,/altro razziatore/);
  assert(g.focusScenarioThreat());assert.equal(g.selected.id,ordered[0].id,"cycle wraps");
  ordered[0].health=0;
  assert(g.focusScenarioThreat());assert.notEqual(g.selected.id,ordered[0].id,"dead raiders are skipped");
  assert(g.save());assert(g.load());
  assert.equal(g.scenarioSelectedThreatId,null,"UI choice is not saved");
  const nearest=g.closestScenarioThreat();
  assert(g.focusScenarioThreat());assert.equal(g.selected.id,nearest.id);
});


test("Show raider keeps a chosen defender through cycling for the next rally",()=>{
  const {g}=setup();g.spawnRaid();
  const base=g.buildings.find(b=>b.owner===0&&b.type==='base');
  const people=g.units.filter(u=>u.owner===0).slice(0,4);
  for(const person of people){person.x=base.x+3;person.y=base.y+1;}
  for(const person of people.slice(0,3))assert(g.mobilizePerson(person.id));
  const chosen=people[3];g.selected=chosen;
  assert(g.focusScenarioThreat());assert.equal(g.scenarioPreferredRallyDefenderId,chosen.id);
  assert(g.focusScenarioThreat());assert.equal(g.scenarioPreferredRallyDefenderId,chosen.id);
  assert(g.rallyVillageDefenders()===3);
  assert.equal(chosen.ralliedRaidLevel,g.raidLevel);
  assert.equal(g.scenarioPreferredRallyDefenderId,null);
});

test("a busy defender remembered through Show raider is skipped and not saved as UI state",()=>{
  const {g}=setup();g.spawnRaid();
  const base=g.buildings.find(b=>b.owner===0&&b.type==='base');
  const people=g.units.filter(u=>u.owner===0).slice(0,4);
  for(const person of people){person.x=base.x+3;person.y=base.y+1;}
  const chosen=people[3];g.selected=chosen;
  assert(g.focusScenarioThreat());
  chosen.task={type:'move',x:base.x+4,y:base.y+1};
  assert.equal(g.rallyVillageDefenders(),3);
  assert.equal(chosen.ralliedRaidLevel,undefined);
  g.selected=chosen;assert(g.focusScenarioThreat());assert.equal(g.scenarioPreferredRallyDefenderId,chosen.id);
  assert(g.save());assert(g.load());assert.equal(g.scenarioPreferredRallyDefenderId,null);
});


test("moving raiders each appear once per Show cycle even when their distance order changes",()=>{
  const {g}=setup();g.spawnRaid();
  const ids=g.raiders.filter(r=>r.health>0).map(r=>r.id);
  assert.equal(ids.length,3);
  assert(g.focusScenarioThreat());
  const shown=[g.selected.id],remaining=g.raiders.filter(r=>r.health>0&&r.id!==shown[0]);
  const firstPos={x:remaining[0].x,y:remaining[0].y};
  remaining[0].x=remaining[1].x;remaining[0].y=remaining[1].y;
  remaining[1].x=firstPos.x;remaining[1].y=firstPos.y;
  for(let i=0;i<2;i++){assert(g.focusScenarioThreat());shown.push(g.selected.id);}
  assert.deepEqual(new Set(shown),new Set(ids),"moving attackers are not repeated or skipped");
  assert.equal(g.scenarioThreatSeenIds.length,3);
  assert(g.focusScenarioThreat());assert.equal(g.scenarioThreatSeenIds.length,1,"new cycle begins after all are seen");
  assert(g.save());assert(g.load());assert.equal(g.scenarioThreatSeenIds.length,0);
});
