const {test}=require('node:test'),assert=require('node:assert/strict'),make=require('./harness.cjs');
function setup(){
  const {g,run,storage}=make(),worker=g.units[0],pen=run("new Building('pen',45,45,0,true)"),sheep=run("new Animal('sheep',46,45,0)");
  g.animals=[];g.buildings.push(pen);g.animals.push(sheep);g.ensureLivestock();
  assert.equal(g.assignAnimalToPen(sheep,pen),null);
  worker.x=pen.x+1;worker.y=pen.y;assert.equal(g.assignLivestockWorker(worker,pen),null);
  return {g,run,storage,worker,pen,sheep};
}
test('one sheep gives one unit of physical wool on its thirtieth worked day',()=>{
  const {g,pen}=setup();pen.inventory.items.forage=30;
  for(let day=1;day<30;day++){g.buildingDay(pen);assert.equal(pen.inventory.items.wool||0,0);}
  assert.equal(pen.livestockDays,29);assert.equal(pen.inventory.items.forage,1);
  g.buildingDay(pen);
  assert.equal(pen.livestockDays,30);assert.equal(pen.inventory.items.forage,0);
  assert.equal(pen.inventory.items.milk,60);assert.equal(pen.inventory.items.wool,1);
});
test('wool day waits for enough local space and does not consume forage on failure',()=>{
  const {g,pen}=setup();pen.livestockDays=29;pen.inventory.items.forage=1;pen.inventory.capacity=2;
  g.buildingDay(pen);assert.equal(pen.livestockDays,29);assert.equal(pen.inventory.items.forage,1);
  assert.equal(pen.inventory.items.milk||0,0);assert.equal(pen.inventory.items.wool||0,0);
  pen.inventory.capacity=3;g.buildingDay(pen);
  assert.equal(pen.livestockDays,30);assert.equal(pen.inventory.items.milk,2);assert.equal(pen.inventory.items.wool,1);
});
test('wool, sheep identity and work day survive reload; old market demand is neutral',()=>{
  const {g,run,storage,pen,sheep}=setup(),market=run("new Building('market',40,40,0,true)");
  g.buildings.push(market);g.ensureMarkets();pen.livestockDays=29;pen.inventory.items.forage=1;g.buildingDay(pen);
  assert(g.save(),g.lastSaveError);const key='terra-italica-save-v5',record=JSON.parse(storage.get(key));
  for(const b of record.buildings)if(b.type==='market')delete b.demand.wool;
  storage.set(key,JSON.stringify(record));assert(g.load());
  assert.equal(g.buildings.find(b=>b.id===pen.id).inventory.items.wool,1);
  assert.equal(g.buildings.find(b=>b.id===pen.id).livestockDays,30);
  assert.equal(g.animals.find(a=>a.id===sheep.id).penId,pen.id);
  assert.equal(g.buildings.find(b=>b.id===market.id).demand.wool,1);
  assert.equal(g.resourceName('wool'),'lana');
});
