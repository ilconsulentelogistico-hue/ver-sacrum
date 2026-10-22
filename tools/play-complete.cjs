// Reproducible whole-game smoke runs. Run separately from the fast unit suite.
const assert = require("node:assert/strict");
const make = require("../tests/harness.cjs");
const rows = [];
const start = (seed, mode, location) => {
  const {g, storage} = make([], {neutrals:true});
  g.beginStartSelection(seed);
  const worldSize=Number(process.env.VER_SACRUM_PLAY_WORLD_SIZE)||0;
  if(worldSize) assert(g.chooseStartWorldSize(worldSize), `world size ${worldSize}`);
  assert(g.chooseStartMode(mode));
  const site=location==='stone'?g.findSpawnOptions().map((place,i)=>({i,stone:place.stone})).sort((a,b)=>b.stone-a.stone)[0].i:location;
  assert(g.chooseStartLocation(site));
  g.finishStartExperience();
  assert.equal(g.gameMode, mode);
  return {g, storage};
};
const checkpoint = (g, expectedMode) => {
  const day = g.totalDays, people = g.playerPeopleAlive().map(u => u.id), buildings = g.buildings.map(b => b.id);
  assert(g.save(), g.lastSaveError);
  assert(g.load());
  assert.equal(g.gameMode, expectedMode);
  assert.equal(g.totalDays, day);
  assert.equal(g.playerPeopleAlive().map(u => u.id).join(","), people.join(","));
  assert.equal(g.buildings.map(b => b.id).join(","), buildings.join(","));
  g.setPaused(false); // Loading deliberately pauses until the player resumes.
};
const tick = (g, count, dt=4.25) => {for (let i=0;i<count && !g.gameEnded;i++) g.update(dt);};
function victory() {
  const {g} = start(123456, "confederation", Number(process.env.VER_SACRUM_PLAY_WORLD_SIZE)>=512?'stone':0);
  const base = g.buildings.find(b => b.owner===0 && b.type==="base");
  const worker = g.playerPeopleAlive().find(u => u.location.kind==="world" && u.state==="idle");
  const gatherer = (person,good) => {
    const resource=g.world.resourcesInBounds(base.x-20,base.y-20,base.x+20,base.y+20)
      .filter(r => r.type===good && r.amount>0 && !r.cleared)
      .sort((a,b) => Math.hypot(a.x-person.x,a.y-person.y)-Math.hypot(b.x-person.x,b.y-person.y))
      .find(r => g.findPath(person.x,person.y,Math.floor(r.x),Math.floor(r.y),1).length);
    assert(resource, `reachable ${good}`);g.assignGather(person,resource);
  };
  const people=g.playerPeopleAlive().filter(u=>u.location.kind==="world");
  gatherer(people[1],"food");gatherer(people[2],"wood");gatherer(people[3],"stone");
  for (const [owner,count] of [[1,9],[2,7]]) {
    for (let i=0;i<count;i++) assert(g.diplomacyAction(owner,"gift",`complete-${owner}-${i}`).ok, `food gift ${owner}-${i}`);
    assert(g.diplomacyAction(owner,"alliance",`complete-alliance-${owner}`).ok, `alliance ${owner}`);
  }
  const place = type => {
    let building=null;
    for (let radius=2;radius<13 && !building;radius++) for (let dy=-radius;dy<=radius && !building;dy++) for (let dx=-radius;dx<=radius && !building;dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy))!==radius) continue;
      const x=Math.floor(base.x)+dx,y=Math.floor(base.y)+dy;
      if (g.villagePlacementError(type,x,y,null,null)) continue;
      g.selected=worker;g.placeBuild(type,x,y);
      building=g.buildings.find(b => b.owner===0 && b.type===type);
    }
    assert(building, `reachable ${type} plot`);
    for (let i=0;i<40 && !building.built;i++) tick(g,1);
    assert(building.built, `${type} built with physical materials and worker`);
    return building;
  };
  place("sawmill");place("house");
  for(let i=0;i<45 && (g.stock.wood<22 || g.stock.stone<10);i++) {
    if(g.stock.stone<10 && !people[3].task && !people[3].inventory.amount) gatherer(people[3],"stone");
    tick(g,1);
  }
  assert(g.stock.wood>=22 && g.stock.stone>=10,"gatherers delivered market materials");
  place("market");
  assert.equal(g.scenarioProgress().communities,2);
  assert(g.scenarioProgress().founded);
  checkpoint(g,"confederation");
  let result=null;
  for (let i=0;i<150 && !result;i++) {
    tick(g,1);
    const village=g.neutralSettlement(1);
    if (village && g.integrationEligible(1) && Number.isFinite(village.base.integrationSinceDay) && g.totalDays-village.base.integrationSinceDay>=60)
      result=g.diplomacyAction(1,"integrate","complete-integration");
  }
  assert(result?.ok, `peaceful accession: ${result?.error||"trust not matured"}`);
  assert.equal(g.civicStage(),3);
  assert.equal(g.warOutcome(),"victory");
  tick(g,1,.85);
  assert.equal(g.gameResult,"victory");
  rows.push({mode:"confederation",seed:123456,result:"victory",day:g.totalDays,people:g.playerPeopleAlive().length,crafts:g.scenarioProgress().workshopTypes});
}
function defeat() {
  const {g}=start(654321,"confederation",1);
  for (let i=0;i<430 && !g.gameEnded;i++) {
    tick(g,1);
    if (i===80) checkpoint(g,"confederation");
  }
  assert.equal(g.gameResult,"defeat",`campaign outcome on day ${g.totalDays}`);
  rows.push({mode:"confederation",seed:654321,result:"defeat",day:g.totalDays,reason:g.scenarioDefeatReason});
}
function sandbox() {
  const {g}=start(24680,"sandbox",2);
  for (let i=0;i<90;i++) {
    tick(g,1);
    if (i===45) checkpoint(g,"sandbox");
    assert.equal(g.raidsEnabled,false);
    assert.equal(g.gameEnded,false,`sandbox must survive through day ${g.totalDays}`);
  }
  assert(g.totalDays>400);
  rows.push({mode:"sandbox",seed:24680,result:"alive",day:g.totalDays,people:g.playerPeopleAlive().length});
}
for (const [name,fn] of [["victory",victory],["defeat",defeat],["sandbox",sandbox]].filter(([name])=>!process.env.VER_SACRUM_PLAY_CASE||process.env.VER_SACRUM_PLAY_CASE===name)) {
  const begin=performance.now();fn();
  console.log(JSON.stringify({...rows.at(-1),seconds:Math.round((performance.now()-begin)/1000)}));
}
