const {test}=require('node:test'),assert=require('node:assert/strict'),make=require('./harness.cjs');
const setup=()=>{const e=make([],{neutrals:true});e.g.gameMode='confederation';e.g.newGame(123456);return e};

test('next step follows actual founding, population, crafts and diplomacy',()=>{
  const {g,run,byId}=setup();const base=g.buildings.find(b=>b.owner===0&&b.type==='base');
  assert.equal(g.scenarioNextStep().kind,'build');assert.match(byId.scenarioNext.textContent,/casa/);
  assert(g.focusScenarioNext());assert.equal(g.contextPanel,'build');assert.equal(g.selected.owner,0);
  const house=run(`new Building("house",${base.x+6},${base.y+6},0,false)`);g.buildings.push(house);
  assert.equal(g.scenarioNextStep().kind,'site');assert(g.focusScenarioNext());assert.equal(g.selected.id,house.id);
  house.built=true;house.progress=1;
  assert.match(g.scenarioNextStep().text,/mercato/);
  const market=run(`new Building("market",${base.x+8},${base.y+8},0,true)`);g.buildings.push(market);
  assert.equal(g.scenarioNextStep().kind,'people');assert(g.focusScenarioNext());assert.equal(g.selected.id,house.id);assert.equal(g.contextPanel,'communityDialog');
  for(let i=0;i<3;i++)g.units.push(run(`new Unit("Nuovo ${i}",${base.x+1},${base.y+1},game.rng)`));
  assert.equal(g.scenarioNextStep().kind,'build');assert.match(g.scenarioNextStep().text,/botteghe/);
  for(const type of ['sawmill','mill'])g.buildings.push(run(`new Building("${type}",${base.x+10},${base.y+10},0,true)`));
  assert.equal(g.scenarioNextStep().kind,'politics');assert(g.focusScenarioNext());assert.equal(g.selected.id,base.id);assert.equal(g.contextPanel,'politicsDialog');
  for(const owner of [1,2])g.neutralSettlement(owner).base.relationship='allied';
  g.renderScenarioStatus();assert.equal(g.scenarioNextStep().kind,'done');assert.equal(byId.scenarioNextButton.classList.contains('hidden'),true);
});

test('next step survives reload and yields to immediate danger; sandbox hides it',()=>{
  const {g,run,byId}=setup(),base=g.buildings.find(b=>b.owner===0&&b.type==='base');
  for(const type of ['house','market'])g.buildings.push(run(`new Building("${type}",${base.x+7},${base.y+7},0,true)`));
  assert(g.save(),g.lastSaveError);assert(g.load());assert.equal(g.scenarioNextStep().kind,'people');
  g.spawnRaid();g.renderScenarioStatus();assert.equal(g.scenarioNextStep().kind,'raid');assert(g.focusScenarioNext());assert(g.raiders.some(r=>r.id===g.selected.id));
  g.gameMode='sandbox';g.renderScenarioStatus();assert.equal(g.scenarioNextStep(),null);assert.equal(byId.scenarioNextButton.classList.contains('hidden'),true);
});

test('a real campaign raid returns accelerated time to 1× without stopping the game',()=>{
  const {g,byId}=setup();
  g.setTimeScale(4);g.setPaused(false);g.nextRaidDay=g.totalDays+1;g.dayAccumulator=.84;
  g.update(.05);
  assert(g.raiders.length>0);assert.equal(g.timeScale,1);assert.equal(g.paused,false);
  assert.equal(byId.speedBtn.textContent,'Velocità: 1×');
  assert.match(byId.message.textContent,/Velocità ridotta a 1×/);
  g.setTimeScale(4);g.gameMode='sandbox';g.raidsEnabled=false;const count=g.raiders.length;
  g.spawnRaid();assert.equal(g.raiders.length,count);assert.equal(g.timeScale,4);
});
