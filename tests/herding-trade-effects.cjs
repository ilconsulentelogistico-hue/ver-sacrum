const {test}=require('node:test'),assert=require('node:assert/strict'),make=require('./harness.cjs'),economy=require('./economy-fixture.cjs');

test('herding bonus carries fractional milk across days and save load without extra forage',()=>{
  const {g,run}=make(),u=g.units[0],pen=run("new Building('pen',45,45,0,true)"),a=run("new Animal('sheep',46,45,0)");
  for(const t of g.world.tiles){t.biome='grass';t.z=0;}g.animals=[];g.buildings.push(pen);g.animals.push(a);g.ensureLivestock();assert.equal(g.assignAnimalToPen(a,pen),null);
  u.x=pen.x+1;u.y=pen.y;u.skills.herding=20;assert.equal(g.assignLivestockWorker(u,pen),null);
  pen.inventory.items.forage=2;g.buildingDay(pen);assert.equal(pen.inventory.items.milk,2);assert.equal(pen.herdingRemainder,.5);
  assert(g.save(),g.lastSaveError);assert(g.load());const restored=g.buildings.find(b=>b.id===pen.id),worker=g.units.find(x=>x.id===u.id);worker.x=restored.x+1;worker.y=restored.y;
  assert.equal(restored.herdingRemainder,.5);restored.inventory.capacity=4;g.buildingDay(restored);
  assert.equal(restored.inventory.items.milk,2);assert.equal(restored.inventory.items.forage,1);assert.equal(restored.herdingRemainder,.5);
  restored.inventory.capacity=120;g.buildingDay(restored);
  assert.equal(restored.inventory.items.milk,5);assert.equal(restored.inventory.items.forage,0);assert.equal(restored.herdingRemainder,0);
});

test('barter skill grants a small concession but never creates goods',()=>{
  const {g,d,u,a,b}=economy();g.marketPrice=()=>1;u.inventory.cap=25;
  a.inventory.items.wood=20;b.inventory.items.food=21;d.offerQuantity=20;d.quantity=21;
  assert.match(g.barterQuote(d),/Offerta insufficiente/);u.skills.trading=20;assert.equal(g.barterQuote(d),null);
  u.x=b.x;u.y=b.y;u.inventory.type='wood';u.inventory.amount=20;
  assert.equal(g.tradeAtMarket(d).ok,true);assert.equal(b.inventory.items.food,0);assert.equal(b.inventory.items.wood,20);assert.equal(u.inventory.amount,21);assert.equal(u.money??0,0);
});
