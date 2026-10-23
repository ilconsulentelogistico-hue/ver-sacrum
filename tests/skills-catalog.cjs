const {test}=require('node:test'),assert=require('node:assert/strict'),make=require('./harness.cjs'),economy=require('./economy-fixture.cjs');
const extra=['transport','milling','carpentry','baking','herding','trading'];

test('new skills belong to each person and survive a job change and reload',()=>{
  const {g,storage}=make(),u=g.units[0];
  for(const key of extra)assert.equal(u.skills[key],1);
  u.gain('milling',23);g.cancelTask(u);
  assert.equal(u.skills.milling,2);assert.equal(u.xp.milling,3);
  const id=u.id;assert(g.save());assert(g.load());
  const loaded=g.units.find(x=>x.id===id);assert.equal(loaded.skills.milling,2);assert.equal(loaded.xp.milling,3);
  assert(storage.size>0);
});

test('older saves acquire the new novice skills without losing existing experience',()=>{
  const {g,storage}=make(),id=g.units[0].id;g.units[0].gain('wood',25);
  assert(g.save());const key='terra-italica-save-v5',raw=JSON.parse(storage.get(key));
  for(const u of raw.units)for(const name of extra)delete u.skills[name];
  storage.set(key,JSON.stringify(raw));assert(g.load());
  const u=g.units.find(x=>x.id===id);assert.equal(u.skills.wood,2);assert.equal(u.xp.wood,5);
  for(const name of extra)assert.equal(u.skills[name],1);
  assert(g.save());const saved=JSON.parse(storage.get(key));
  assert.equal(saved.units.find(x=>x.id===id).skills.trading,1);
});

test('factory gives craft experience only after finished output',()=>{
  const {g,run}=make(),u=g.units[0],b=run("new Building('mill',40,40,0,true)");
  g.buildings.push(b);g.ensureInventories();g.feedPeople();u.x=b.x+1;u.y=b.y;
  assert.equal(g.assignProduction(u,b),null);b.inventory.items.grain=2;
  g.updateBuilding(b,.1);assert(b.batch);assert.equal(u.xp.milling||0,0);
  g.updateBuilding(b,10);assert.equal(b.batch,null);assert.equal(b.inventory.items.flour,2);assert(u.xp.milling>0);
});

test('trade experience follows successful physical barter only',()=>{
  const {g,d,u,b}=economy();g.marketPrice=()=>1;u.inventory.type='wood';u.inventory.amount=10;
  u.x=b.x+10;assert.equal(g.tradeAtMarket(d).ok,false);assert.equal(u.xp.trading||0,0);
  u.x=b.x;u.y=b.y;assert.equal(g.tradeAtMarket(d).ok,true);assert(u.xp.trading>0);
});
