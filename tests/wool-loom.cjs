const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),make=require('./harness.cjs');
function setup(){
  const {g,run,storage}=make(),u=g.units[0],loom=run("new Building('loom',40,40,0,true)");
  g.buildings.push(loom);g.ensureInventories();g.feedPeople();u.x=loom.x+1;u.y=loom.y;
  assert.equal(g.assignProduction(u,loom),null);
  return {g,run,storage,u,loom};
}
test('a staffed loom consumes wool before creating cloth and weaving XP',()=>{
  const {g,u,loom}=setup();assert.equal(u.task.profession,'tessitore');
  loom.inventory.items.wool=4;g.updateBuilding(loom,.1);
  assert(loom.batch);assert.equal(loom.inventory.items.wool,0);assert.equal(loom.inventory.items.cloth||0,0);assert.equal(u.xp.weaving||0,0);
  g.updateBuilding(loom,15);assert.equal(loom.batch,null);
  assert.equal(loom.inventory.items.cloth,2);assert.equal(u.xp.weaving,1);
});
test('no worker or insufficient wool leaves stock and experience untouched',()=>{
  const {g,u,loom}=setup();loom.inventory.items.wool=3;g.updateBuilding(loom,20);
  assert.equal(loom.batch,null);assert.equal(loom.inventory.items.wool,3);
  loom.inventory.items.wool=4;g.cancelTask(u);g.updateBuilding(loom,20);
  assert.equal(loom.batch,null);assert.equal(loom.inventory.items.wool,4);assert.equal(u.xp.weaving||0,0);
});
test('settlement knowledge permits a loom and old saves gain novice weaving and neutral cloth demand',()=>{
  const {g,run,storage,u,loom}=setup(),market=run("new Building('market',44,40,0,true)");
  assert.equal(g.constructionCheck('loom',u).ok,true);
  g.buildings.push(market);g.ensureMarkets();assert(g.save(),g.lastSaveError);
  const key='terra-italica-save-v5',data=JSON.parse(storage.get(key));
  for(const person of data.units)delete person.skills.weaving;
  for(const b of data.buildings)if(b.type==='market')delete b.demand.cloth;
  storage.set(key,JSON.stringify(data));assert(g.load());
  assert.equal(g.units.find(p=>p.id===u.id).skills.weaving,1);
  assert.equal(g.buildings.find(b=>b.id===market.id).demand.cloth,1);
  assert.equal(g.buildings.find(b=>b.id===loom.id).type,'loom');
});
test('woven cloth has a price and the loom uses a pixel art asset',()=>{
  const {g}=make(),asset=path.join(__dirname,'../assets/p16/buildings/building_loom_p16.png');
  assert(fs.statSync(asset).size>100);assert.equal(g.resourceName('cloth'),'tessuto');
  const market={owner:0,inventory:{items:{}},demand:{cloth:1}};
  assert(g.marketPrice(market,'cloth')>g.marketPrice(market,'wool'));
});
