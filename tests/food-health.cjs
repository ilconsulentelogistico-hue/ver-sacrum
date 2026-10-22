const {test}=require('node:test'),assert=require('node:assert/strict'),make=require('./harness.cjs');
const SLOT='terra-italica-save-v5';
function setup(){
  const {g,storage}=make(),store=g.communalStores(0)[0],person=g.units[0];
  store.inventory.items.food=0;store.inventory.items.bread=0;store.inventory.items.barleyBread=0;store.inventory.items.milk=0;
  for(const u of g.units){u.fedUntil=0;u.hungry=true;}
  g.nextRaidDay=1e9;
  return {g,storage,store,person};
}
test('missing food has five days grace, then a gradual daily health cost',()=>{
  const {g,person}=setup();
  for(let i=0;i<5;i++)g.advanceDay();
  assert.equal(person.unfedDays,5);assert.equal(person.health,100);
  g.advanceDay();assert.equal(person.unfedDays,6);assert.equal(person.health,99);assert.equal(person.nutritionDamage,1);
});
test('food restores hunger damage but does not erase combat wounds',()=>{
  const {g,store,person}=setup();for(let i=0;i<7;i++)g.advanceDay();
  assert.equal(person.health,98);person.health-=10;
  store.inventory.items.food=20;g.advanceDay();
  assert.equal(person.unfedDays,0);assert.equal(person.health,89);assert.equal(person.nutritionDamage,1);
  g.advanceDay();assert.equal(person.health,90);assert.equal(person.nutritionDamage,0);
  g.advanceDay();assert.equal(person.health,90);
});
test('nutrition state persists and malformed nutrition data is rejected',()=>{
  const {g,storage,person}=setup();for(let i=0;i<6;i++)g.advanceDay();
  assert(g.save(),g.lastSaveError);assert(g.load());
  const restored=g.units.find(u=>u.id===person.id);assert.equal(restored.unfedDays,6);assert.equal(restored.nutritionDamage,1);
  const snapshot=JSON.parse(storage.get(SLOT));snapshot.units[0].unfedDays=-1;
  storage.set(SLOT,JSON.stringify(snapshot));assert.equal(g.load(),false);
  assert.equal(g.units.find(u=>u.id===person.id).unfedDays,6);
});
