const {test}=require("node:test"),assert=require("node:assert/strict"),make=require("./harness.cjs");

test("three starting locations are distinct, walkable and supplied with wood",()=>{
  const {g}=make();
  for(const seed of [7,123456,321456,905317]){
    g.newGame(seed);
    const places=g.findSpawnOptions();
    assert.equal(places.length,3);
    assert(places.every(p=>p.wood>0&&["grass","scrub","plain"].includes(g.world.tile(p.x,p.y).biome)));
    for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert(Math.hypot(places[i].x-places[j].x,places[i].y-places[j].y)>=12);
  }
});

test("512 map shows nearby stone at the start and distinguishes viable sites",()=>{
  const {g,byId}=make();
  g.beginStartSelection(123456);
  assert(g.chooseStartWorldSize(512));
  const sites=g.findSpawnOptions();
  assert.equal(sites.length,3);
  assert(sites[2].stone>sites[0].stone,"the southern site has more nearby stone");
  const nearby=g.world.resourcesInBounds(sites[2].x-20,sites[2].y-20,sites[2].x+20,sites[2].y+20)
    .filter(n=>n.type==="stone"&&n.amount>0&&Math.hypot(n.x-sites[2].x,n.y-sites[2].y)<20).length;
  assert.equal(sites[2].stone,nearby);
  assert.match(byId.startPlaces.innerHTML,/pietra entro 20 caselle/);
});

test("choosing a site founds the actual village there and preserves five novice people",()=>{
  const {g,byId}=make();g.newGame(123456);
  const sites=g.findSpawnOptions();
  g.beginStartSelection();
  assert(g.paused);assert.equal(g.startExperienceStage,"places");
  assert.equal(byId.commandDock.hidden,true,"character dock must not cover start choices");
  assert.match(byId.startPlaces.innerHTML,/Terre a nord-ovest/);
  assert.equal(g.chooseStartLocation(2),true);
  const base=g.buildings.find(b=>b.owner===0&&b.type==="base");
  assert.equal(base.x,sites[2].x+.5);assert.equal(base.y,sites[2].y+.5);
  assert.equal(g.units.filter(u=>u.owner===0).length,5);
  assert(g.paused);
  assert.equal(g.chooseStartLocation(0),false);
  assert.equal(g.save(),false,"the unfinished tutorial cannot overwrite a save");
  g.finishStartExperience();assert.equal(g.paused,false);assert(g.save());assert(g.load());
  assert.equal(g.buildings.find(b=>b.owner===0&&b.type==="base").x,sites[2].x+.5);assert.equal(g.paused,true,"loading a completed save pauses it");assert(byId.startExperience.classList.contains("hidden"));
  assert.equal(byId.commandDock.hidden,false,"character dock returns after tutorial");
});

test("new game can choose a broad map and keep its size after save/load",()=>{
  const {g,storage}=make();g.beginStartSelection(123456);
  assert.equal(g.chooseStartWorldSize(256),true);assert.equal(g.world.size,256);
  assert.equal(g.chooseStartMode("sandbox"),true);assert.equal(g.world.size,256);
  assert.equal(g.chooseStartLocation(0),true);assert.equal(g.chooseStartWorldSize(512),false);
  g.finishStartExperience();assert(g.save(),g.lastSaveError);
  assert(storage.get("terra-italica-save-v5-256"));assert(g.load());
  assert.equal(g.world.size,256);assert.equal(g.gameMode,"sandbox");
});

test("suspending during site choice keeps the previous completed save",()=>{
  const {g,storage}=make();
  g.beginStartSelection(123456);g.chooseStartLocation(0);g.finishStartExperience();
  assert(g.save());const key='terra-italica-save-v5-256',before=storage.get(key);
  g.beginStartSelection(905317);assert.equal(g.startExperienceStage,'places');
  assert.equal(g.save(),false);assert.equal(storage.get(key),before);
  g.chooseStartLocation(2);assert.equal(g.save(),false);assert.equal(storage.get(key),before);
});
