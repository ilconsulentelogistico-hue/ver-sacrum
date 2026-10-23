const {test}=require("node:test"),assert=require("node:assert/strict"),make=require("./harness.cjs");
function setup(){const e=make([],{neutrals:true}),g=e.g;g.gameMode="sandbox";g.newGame(123456);const base=g.buildings.find(b=>b.owner===0&&b.type==="base");return{...e,g,base,add(type,dx){const b=e.run(`new Building("${type}",${Math.floor(base.x)+dx},${Math.floor(base.y)+3},0,true)`);g.buildings.push(b);g.ensureInventories();return b;}};}

test("civil stages come from real buildings, people and alliances and survive reload",()=>{
  const {g,base,add,run,byId}=setup();assert.equal(g.civicStage(),0);
  add("house",2);add("market",4);assert.equal(g.civicStage(),1);
  add("mill",6);add("loom",8);
  for(let i=0;i<3;i++)g.units.push(run(`new Unit("Nuovo ${i}",${base.x+1},${base.y+1},game.rng)`));
  assert.equal(g.civicStage(),2);
  const store=g.communalStores(0)[0];store.inventory.capacity=500;store.inventory.items.food=200;
  for(const owner of [1,2]){for(let i=0;i<7;i++)assert(g.diplomacyAction(owner,"gift",`civic-${owner}-${i}`).ok);assert(g.diplomacyAction(owner,"alliance",`civic-pact-${owner}`).ok);}
  assert.equal(g.civicStage(),3);g.renderScenarioStatus();assert.match(byId.scenarioSummary.textContent,/Confederazione/);
  assert(g.save(),g.lastSaveError);assert(g.load());assert.equal(g.civicStage(),3);
});

test("village knowledge actually shortens the same construction job",()=>{
  const {g,base,add,run}=setup(),worker=g.units[0],site=run(`new Building("warehouse",${Math.floor(base.x)+5},${Math.floor(base.y)+5})`);
  g.buildings.push(site);g.ensureInventories();site.materialsConsumed=true;worker.task={type:"build",target:site.id};worker.state="building";worker.x=site.x+1;worker.y=site.y;
  const first=site.progress;g.buildTick(worker,.5);const normal=site.progress-first;site.progress=first;
  add("house",2);add("market",4);assert.equal(g.civicStage(),1);
  g.buildTick(worker,.5);assert(site.progress-first>normal*1.09);
});

test("artisan center speeds a physical batch without changing its output",()=>{
  const {g,base,add,run}=setup(),mill=add("mill",6),worker=g.units[0];
  worker.task={type:"production",target:mill.id};worker.state="producing";worker.x=mill.x+1;worker.y=mill.y;worker.fedUntil=1e6;mill.workers=[worker.id];
  mill.batch={recipeId:"grain-flour",inputs:{grain:2},outputs:{flour:2},input:"grain",output:"flour",amount:2,outputVolume:2,remaining:6};
  g.updateBuilding(mill,1);const normal=6-mill.batch.remaining;assert(normal>0);mill.batch.remaining=6;
  add("house",2);add("market",4);add("loom",8);for(let i=0;i<3;i++)g.units.push(run(`new Unit("Nuovo ${i}",${base.x+1},${base.y+1},game.rng)`));
  assert.equal(g.civicStage(),2);g.updateBuilding(mill,1);assert(6-mill.batch.remaining>normal*1.09);assert.equal(mill.batch.outputs.flour,2);
});

test("confederation adds one daily morale recovery only for fed members",()=>{const {g,base,add,run}=setup();add("house",2);add("market",4);add("mill",6);add("loom",8);for(let i=0;i<3;i++)g.units.push(run(`new Unit("Nuovo ${i}",${base.x+1},${base.y+1},game.rng)`));for(const owner of [1,2]){const b=g.neutralSettlement(owner).base;b.allianceSignedDay=0;b.relationship="allied";}assert.equal(g.civicStage(),3);const u=g.units[0];u.morale=60;u.fedUntil=g.totalDays+60;u.hungry=false;g.advanceDay();assert.equal(u.morale,63);});
