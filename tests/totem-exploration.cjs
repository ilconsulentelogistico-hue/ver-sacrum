const {test}=require("node:test"),assert=require("node:assert/strict"),make=require("./harness.cjs");

const own=(g,type)=>g.buildings.filter(b=>b.owner===0&&(!type||b.type===type));
const youths=g=>g.units.filter(u=>u.owner===0&&u.health>0);
function findPlantable(g){
  for(let y=8;y<g.world.size-8;y++)for(let x=8;x<g.world.size-8;x++){
    if(!g.isTileRevealed(x,y))continue;
    if(g.canPlantTotemAt(x,y).ok)return {x,y};
  }
  return null;
}
function revealAll(g){g.exploration.revealed.fill(1);}

test("the start offers three sacred animals and waits for a choice",()=>{
  const {g,byId}=make();g.beginStartSelection(123456);
  assert.equal(g.startExperienceStage,"places");
  for(const word of ["Hirpus","Picus","Bos","Irpini","Piceni","Strabone"])assert.match(byId.startTotems.innerHTML,new RegExp(word));
  assert.equal(byId.startExplore.disabled,true);
  assert(byId.startPlaces.classList.contains("hidden"),"preset sites are no longer offered");
  assert.equal(g.beginExploration(),false,"no exploration without an animal");
  assert.equal(g.chooseTotem("aquila"),false);
  assert.equal(g.chooseTotem("picus"),true);
  assert.equal(byId.startExplore.disabled,false);
  assert.match(byId.startExplore.textContent,/Picchio/);
});

test("exploration runs in fog with the whole band and no village yet",()=>{
  const {g,byId}=make();g.beginStartSelection(123456);g.chooseTotem("hirpus");
  assert(g.beginExploration());
  assert.equal(g.startExperienceStage,"explore");
  assert.equal(g.paused,false);assert.equal(g.raidsEnabled,false);
  assert(byId.startExperience.classList.contains("hidden"));
  assert(!byId.exploreBar.classList.contains("hidden"));
  assert.equal(byId.commandDock.hidden,true);
  assert.equal(g.rtsSelectedUnits().length,5,"the band moves together");
  const leader=youths(g)[0];
  assert(g.isTileRevealed(Math.floor(leader.x),Math.floor(leader.y)));
  const share=g.revealedShare();assert(share>0&&share<.5,`initial fog share ${share}`);
  assert.equal(g.save(),false,"exploration is never saved");
  assert.equal(byId.scenarioStatus.hidden,true,"the Confederazione panel waits for the village");
  g.message("Raccolto: 23 grano nel campo.");assert.doesNotMatch(byId.message.textContent||"",/Raccolto/,"camp messages stay silent");
  // walking reveals new land
  leader.x=Math.min(g.world.size-10,leader.x+30)+.5;leader.y=Math.min(g.world.size-10,leader.y)+.5;
  g.update(.05);
  assert(g.revealedShare()>share);
  assert.equal(g.pickEntity({x:2.5,y:2.5}),null,"hidden land cannot be picked");
});

test("only walking is allowed before the totem is planted",()=>{
  const {g}=make();g.beginStartSelection(123456);g.chooseTotem("bos");g.beginExploration();
  const u=youths(g)[0],x=Math.floor(u.x),y=Math.floor(u.y);
  g.applyOrder("gather",{x:u.x,y:u.y},x,y,u);
  assert.notEqual(u.task?.type,"gather");
  assert.equal(g.placeBuild("house",x+3,y+3),false);
  g.applyOrder("move",{x:x+2.5,y:y+.5},x+2,y,u);
  assert.equal(u.task?.type,"move");
});

test("planting the totem founds the village on the chosen tile and keeps the animal",()=>{
  const {g,byId}=make();g.beginStartSelection(123456);g.chooseTotem("picus");g.beginExploration();
  revealAll(g);
  const site=findPlantable(g);assert(site,"a plantable site exists");
  const water=(()=>{for(let y=8;y<g.world.size-8;y++)for(let x=8;x<g.world.size-8;x++)if(g.world.tile(x,y).nearWater)return {x,y};})();
  if(water)assert.equal(g.canPlantTotemAt(water.x,water.y).ok,false);
  const leader=youths(g)[0];leader.x=site.x+.5;leader.y=site.y+.5;
  assert.equal(g.updateExploreBar().ok,true);
  assert(g.plantTotem());
  const base=own(g,"base")[0];
  // The usual spawn normalisation may nudge the house off a tree or rock by a few tiles.
  assert(Math.hypot(base.x-(site.x+.5),base.y-(site.y+.5))<=3,`base ${base.x},${base.y} far from ${site.x},${site.y}`);
  assert.equal(base.totem,"picus");
  assert.equal(g.exploration,null);
  assert.equal(youths(g).length,5);
  assert.equal(g.startExperienceStage,"tutorial");assert(g.paused);
  assert(byId.exploreBar.classList.contains("hidden"));
  assert(!byId.startExperience.classList.contains("hidden"));
  assert.equal(byId.scenarioStatus.hidden,false);
  assert.match(g.selectionHTML(base),/Picchio \(Picus\)/);
  assert.equal(g.save(),false,"the tutorial still cannot overwrite a save");
  g.finishStartExperience();
  assert.equal(g.raidsEnabled,true,"raids return with the founded village in Confederazione");
  assert(g.save(),g.lastSaveError);assert(g.load());
  assert.equal(own(g,"base")[0].totem,"picus");
});

test("a bad spot explains why the totem cannot be planted",()=>{
  const {g,byId}=make();g.beginStartSelection(123456);g.chooseTotem("hirpus");g.beginExploration();
  const leader=youths(g)[0];leader.x=3.5;leader.y=3.5;
  assert.equal(g.plantTotem(),false);
  assert.equal(g.startExperienceStage,"explore");
  assert.match(byId.exploreHint.textContent,/bordo|esplorata/);
  assert.equal(byId.plantTotem.disabled,true);
});

test("changing the choice returns to the start with the same animal",()=>{
  const {g}=make();g.beginStartSelection(123456);g.chooseTotem("bos");g.beginExploration();
  assert(g.cancelExploration());
  assert.equal(g.startExperienceStage,"places");assert.equal(g.pendingTotem,"bos");assert.equal(g.exploration,null);
});

test("preset sites still work for automatic games and keep a chosen animal",()=>{
  const {g}=make();g.beginStartSelection(123456);g.chooseTotem("hirpus");
  assert(g.chooseStartLocation(1));g.finishStartExperience();
  assert.equal(own(g,"base")[0].totem,"hirpus");
});
