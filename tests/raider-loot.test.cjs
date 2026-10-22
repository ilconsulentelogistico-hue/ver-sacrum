const {test}=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');
function setup(){
  const e=make(),g=e.g;g.newGame(321);g.raidsEnabled=true;g.ensureInventories();
  const base=g.buildings.find(b=>b.type==='base'&&b.owner===0),camp=g.warCamps[0],store=g.communalStores(0,base)[0];
  assert(camp);assert(store);for(const u of g.units){u.x=10.5;u.y=10.5;}
  store.inventory.items.food=12;
  const r=e.run(`new Raider(${base.x+0.5},${base.y},1)`);r.campId=camp.id;g.raiders.push(r);
  return {g,base,camp,store,r,run:e.run};
}
function reachStore(g,r){for(let i=0;i<160&&!(r.lootFood>0);i++)g.updateRaider(r,.25);assert.equal(r.lootFood,5,'the raider can physically reach the warehouse');}
test('raider must walk from village center to warehouse before taking existing food',()=>{
  const {g,base,store,r}=setup(),before=base.health;
  g.updateRaider(r,.1);
  assert(base.health<before);assert.equal(store.inventory.items.food,12);
  assert.equal(r.raidStoreId,store.id);assert.match(g.selectionHTML(r),/Punta al magazzino/);
  reachStore(g,r);assert.equal(store.inventory.items.food,7);assert.equal(r.lootStoreId,store.id);
  assert.match(g.selectionHTML(r),/5 cibo rubato/);
  g.updateRaider(r,.25);assert.equal(store.inventory.items.food,7,'cannot steal repeatedly');
});
test('save/load during approach preserves target, and save/load with loot preserves stores',()=>{
  const {g,base,store,r}=setup();g.updateRaider(r,.1);
  assert(g.save());assert(g.load());
  const approaching=g.raiders.find(x=>x.id===r.id);
  assert.equal(approaching.raidStoreId,store.id);
  const restoredStore=g.buildings.find(b=>b.id===store.id);
  assert.equal(restoredStore.inventory.items.food,12);
  reachStore(g,approaching);
  assert(g.save());assert(g.load());
  assert.equal(g.raiders.find(x=>x.id===r.id).lootFood,5);
  assert.equal(g.raiders.find(x=>x.id===r.id).lootStoreId,store.id);
  assert.equal(g.buildings.find(b=>b.id===store.id).inventory.items.food,7);
});
test('stopping the raider before the store protects food; stopping after drops loot once',()=>{
  const a=setup();a.g.updateRaider(a.r,.1);a.r.health=0;a.g.recoverDeadCargo();assert.equal(a.store.inventory.items.food,12);
  const {g,r}=setup();g.updateRaider(r,.1);reachStore(g,r);
  const before=g.world.resources.length,point={x:r.x,y:r.y};r.health=0;
  g.updateRaider(r,.25);assert.equal(r.x,point.x);assert.equal(r.y,point.y);
  g.recoverDeadCargo();assert.equal(g.world.resources.length,before+1);
  assert.equal(g.world.resources.at(-1).type,'food');assert.equal(g.world.resources.at(-1).amount,5);assert.equal(g.world.resources.at(-1).recoveredLoot,true);assert.equal(r.lootStoreId,null);
  g.recoverDeadCargo();assert.equal(g.world.resources.length,before+1);
});
test('a raider with loot walks back to camp and escapes without a duplicate drop',()=>{
  const {g,camp,r}=setup();g.updateRaider(r,.1);reachStore(g,r);
  const start=Math.hypot(r.x-camp.x,r.y-camp.y);
  for(let i=0;i<20;i++)g.updateRaider(r,.25);
  assert(Math.hypot(r.x-camp.x,r.y-camp.y)<start,'raider physically returns toward camp');
  r.x=camp.x;r.y=camp.y;const before=g.world.resources.length;
  g.updateRaider(r,.1);assert.equal(r.health,0);assert.equal(r.escapedWithLoot,true);assert.equal(r.lootStoreId,null);
  g.recoverDeadCargo();assert.equal(g.world.resources.length,before);
});
test('no stock or camp origin cannot create loot',()=>{
  const {g,store,r}=setup();store.inventory.items.food=0;
  g.updateRaider(r,.1);assert.equal(r.raidStoreId,undefined);
  r.campId=undefined;r.attackCooldown=0;store.inventory.items.food=5;
  g.updateRaider(r,.1);assert.equal(store.inventory.items.food,5);
});

test('escaped food stays at the real camp and is preserved by save/load',()=>{
  const {g,camp,r}=setup();g.updateRaider(r,.1);reachStore(g,r);
  r.x=camp.x;r.y=camp.y;g.updateRaider(r,.1);
  assert.equal(camp.stolenFood,5);assert.match(g.selectionHTML(camp),/Scorta rubata: 5 cibo/);
  assert(g.save());assert(g.load());
  assert.equal(g.warCamps.find(c=>c.id===camp.id).stolenFood,5);
});
test('conquering a camp drops its stolen food once, including after reload',()=>{
  const {g,camp,r}=setup();g.updateRaider(r,.1);reachStore(g,r);
  r.x=camp.x;r.y=camp.y;g.updateRaider(r,.1);
  const before=g.world.resources.length;camp.health=0;g.recoverDeadCargo();
  assert.equal(g.world.resources.length,before+1);
  const drop=g.world.resources.at(-1);assert.equal(drop.type,'food');assert.equal(drop.amount,5);assert.equal(drop.recoveredLoot,true);
  assert.equal(drop.x,camp.x);assert.equal(drop.y,camp.y);
  g.recoverDeadCargo();assert.equal(g.world.resources.length,before+1);
  assert(g.save());assert(g.load());
  const after=g.world.resources.length;g.recoverDeadCargo();assert.equal(g.world.resources.length,after);
});

test('a razed camp cannot swallow food carried by a returning raider',()=>{
  const {g,camp,r}=setup();g.updateRaider(r,.1);reachStore(g,r);
  const before=g.world.resources.length;camp.health=0;
  g.updateRaider(r,.1);
  assert.equal(r.lootFood,0);assert.equal(g.world.resources.length,before+1);
  assert.equal(g.world.resources.at(-1).amount,5);assert.equal(g.world.resources.at(-1).recoveredLoot,true);
  g.recoverDeadCargo();assert.equal(g.world.resources.length,before+1);
});

test('a remote exposed warehouse attracts a raider before the village center is hit',()=>{
  const {g,base,camp,store,run}=setup();
  const warehouse=run(`new Building('warehouse',50,41,0,true)`);g.buildings.push(warehouse);g.ensureInventories();
  warehouse.inventory.items.food=8;
  const raider=run(`new Raider(${warehouse.x+1.5},${warehouse.y},1)`);raider.campId=camp.id;g.raiders.push(raider);
  const baseHealth=base.health;g.updateRaider(raider,.1);
  assert.equal(raider.raidStoreId,warehouse.id);assert.equal(base.health,baseHealth);
  assert.equal(warehouse.inventory.items.food,8,'assignment does not steal');
  assert(g.save());assert(g.load());
  const restored=g.raiders.find(r=>r.id===raider.id),target=g.buildings.find(b=>b.id===warehouse.id);
  for(let i=0;i<100&&!(restored.lootFood>0);i++)g.updateRaider(restored,.25);
  assert.equal(restored.lootFood,5);assert.equal(target.inventory.items.food,3);
  assert.equal(g.buildings.find(b=>b.id===store.id).inventory.items.food,12);
  assert.equal(g.buildings.find(b=>b.id===base.id).health,baseHealth);
});
test('empty or foreign exposed stores do not attract camp raiders',()=>{
  const {g,camp,run}=setup();const warehouse=run(`new Building('warehouse',50,41,0,true)`);
  g.buildings.push(warehouse);g.ensureInventories();warehouse.inventory.items.food=0;
  const first=run(`new Raider(${warehouse.x+1.5},${warehouse.y},1)`);first.campId=camp.id;g.raiders.push(first);
  g.updateRaider(first,.1);assert.equal(first.raidStoreId,undefined);
  warehouse.owner=1;warehouse.inventory.items.food=8;
  const second=run(`new Raider(${warehouse.x+1.5},${warehouse.y},1)`);second.campId=camp.id;g.raiders.push(second);
  g.updateRaider(second,.1);assert.equal(second.raidStoreId,undefined);assert.equal(warehouse.inventory.items.food,8);
});

test('the starter warehouse near the village center keeps the original assault route',()=>{
  const {g,base,store,r}=setup();
  assert(Math.hypot(store.x-base.x,store.y-base.y)<4);
  r.x=store.x+2;r.y=store.y;
  g.updateRaider(r,.1);
  assert.equal(r.raidStoreId,undefined,'nearby starter store is not an exposed outpost');
  assert.equal(store.inventory.items.food,12);
});

test('the distant starter store in seed 654321 is still part of the village core',()=>{
  const e=make([],{neutrals:true}),g=e.g;g.beginStartSelection(654321);g.chooseStartWorldSize(256);g.chooseStartMode('confederation');g.chooseStartLocation(1);g.finishStartExperience();g.raidsEnabled=true;g.ensureInventories();
  const base=g.buildings.find(b=>b.type==='base'&&b.owner===0),store=g.communalStores(0,base)[0],camp=g.warCamps[0];
  assert(Math.hypot(store.x-base.x,store.y-base.y)<6);
  store.inventory.items.food=30;
  const r=e.run(`new Raider(${store.x+1.5},${store.y},1)`);r.campId=camp.id;g.raiders.push(r);
  g.updateRaider(r,.1);
  assert.equal(r.raidStoreId,undefined);assert.equal(store.inventory.items.food,30);
});
