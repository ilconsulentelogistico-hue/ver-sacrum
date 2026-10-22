const {test}=require('node:test'),assert=require('node:assert/strict'),make=require('./harness.cjs');

test('a hungry farmer advances the same field at 70 percent speed, without changing harvest quantity',()=>{
  const {g,run}=make(),u=g.units[0],farm=run("new Building('farm',40,40,0,true)");
  g.buildings.push(farm);g.ensureInventories();u.x=farm.x+1;u.y=farm.y;g.assignFarm(u,farm);u.state='farming';
  const tile=g.world.tile(Math.floor(farm.x),Math.floor(farm.y));tile.biome='grass';tile.nearWater=false;
  u.hungry=false;g.buildingDay(farm);const fedGrowth=farm.growth;
  farm.growth=0;u.hungry=true;g.buildingDay(farm);const hungryGrowth=farm.growth;
  assert(Math.abs(hungryGrowth/fedGrowth-0.7)<1e-9);
  farm.growth=1;g.buildingDay(farm);const hungryHarvest=farm.inventory.items.grain;
  farm.inventory.items.grain=0;u.hungry=false;farm.growth=1;g.buildingDay(farm);
  assert.equal(farm.inventory.items.grain,hungryHarvest);
});

test('a hungry gatherer still collects, more slowly, and recovers normal speed after a ration',()=>{
  const {g,run}=make(),u=g.units[0],node=run("new ResourceNode('wood',40.5,40.5,4)");
  g.world.resources=[node];u.x=40.5;u.y=40.5;
  u.task={type:'gather',target:node.id,workSpot:{x:u.x,y:u.y}};u.state='gathering';u.workTimer=0;
  u.hungry=false;g.gatherTick(u,1);const fedTimer=u.workTimer;
  u.hungry=true;u.workTimer=0;g.gatherTick(u,1);const hungryTimer=u.workTimer;
  assert.equal(u.inventory.amount,2);assert.equal(node.amount,2);
  assert(Math.abs(hungryTimer/fedTimer-1/0.7)<1e-9);
  const store=g.communalStores(0)[0];store.inventory.items.food=1;for(const other of g.units)if(other!==u)other.fedUntil=g.totalDays+100;u.fedUntil=0;g.feedPeople();
  assert.equal(u.hungry,false);u.workTimer=0;g.gatherTick(u,1);
  assert.equal(u.workTimer,fedTimer);assert.equal(u.inventory.amount,3);
});
