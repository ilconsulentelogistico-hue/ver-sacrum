const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),make=require('./harness.cjs');
function setup(){
  const {g,run,storage}=make(),u=g.units[0],kiln=run("new Building('kiln',40,40,0,true)");
  g.buildings.push(kiln);g.ensureInventories();g.feedPeople();u.x=kiln.x+1;u.y=kiln.y;
  assert.equal(g.assignProduction(u,kiln),null);
  return {g,u,kiln,storage};
}
test('clay and wood become pottery only after a staffed batch',()=>{
  const {g,u,kiln}=setup();assert.equal(u.task.profession,'ceramista');
  kiln.inventory.items.clay=4;kiln.inventory.items.wood=2;
  g.updateBuilding(kiln,.1);
  assert(kiln.batch);assert.equal(kiln.inventory.items.clay,0);assert.equal(kiln.inventory.items.wood,0);
  assert.equal(u.xp.pottery||0,0);assert.equal(kiln.inventory.items.pottery||0,0);
  g.updateBuilding(kiln,20);
  assert.equal(kiln.batch,null);assert.equal(kiln.inventory.items.pottery,2);assert.equal(u.xp.pottery,1);
  assert.equal(g.resourceName('pottery'),'ceramica');
});
test('a kiln cannot produce without either material or without a worker',()=>{
  const {g,u,kiln}=setup();kiln.inventory.items.clay=4;
  g.updateBuilding(kiln,20);assert.equal(kiln.batch,null);assert.equal(kiln.inventory.items.pottery||0,0);
  kiln.inventory.items.wood=2;g.cancelTask(u);
  g.updateBuilding(kiln,20);assert.equal(kiln.batch,null);assert.equal(kiln.inventory.items.clay,4);
});
test('construction requires furnace knowledge and old saves gain novice pottery skill',()=>{
  const {g,u,kiln,storage}=setup();
  assert.equal(g.constructionCheck('kiln',u).ok,false);
  u.skills.construction=4;g.ensureConstructionKnowledge();assert.equal(g.constructionCheck('kiln',u).ok,true);
  assert(g.save(),g.lastSaveError);const key='terra-italica-save-v5',data=JSON.parse(storage.get(key));
  for(const person of data.units)delete person.skills.pottery;
  storage.set(key,JSON.stringify(data));assert(g.load());
  assert.equal(g.units.find(p=>p.id===u.id).skills.pottery,1);
  assert.equal(g.buildings.find(b=>b.id===kiln.id).type,'kiln');
});
test('an old market without pottery demand loads with a neutral value',()=>{
  const {g,storage,run}=make(),market=run("new Building('market',40,40,0,true)");
  g.buildings.push(market);
  g.ensureMarkets();assert(g.save(),g.lastSaveError);
  const key='terra-italica-save-v5',data=JSON.parse(storage.get(key));
  for(const b of data.buildings)if(b.type==='market')delete b.demand.pottery;
  storage.set(key,JSON.stringify(data));assert(g.load());
  assert(g.buildings.filter(b=>b.type==='market').every(b=>b.demand.pottery===1));
});
test('kiln graphic exists and pottery has a market price',()=>{
  const {g}=make(),file=path.join(__dirname,'../assets/p16/buildings/building_kiln_p16.png');
  assert(fs.statSync(file).size>100);
  assert.equal(g.marketPrice(g.buildings.find(b=>b.type==='market')||{inventory:{items:{}},demand:{pottery:1}},'pottery')>0,true);
});
