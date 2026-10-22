const {test}=require('node:test'),assert=require('node:assert/strict'),make=require('./economy-fixture.cjs');
function setup(){
  const e=make(),{g}=e;g.newGame(321);const home=e.add('house',3,2),person=g.units[0];
  g.enterResident(person,home);home.inventory.items.food=5;g.feedPeople();
  g.nextRaidDay=1e9;
  return {...e,home,person};
}
test('a fed resident heals slowly at an operating home without using an extra ration',()=>{
  const {g,home,person}=setup();assert.equal(person.location.kind,'resident');
  person.health=80;const food=home.inventory.items.food;
  g.advanceDay();assert.equal(person.health,80.5);assert.equal(home.inventory.items.food,food);
  g.advanceDay();assert.equal(person.health,81);assert.equal(home.inventory.items.food,food);
});
test('being outside, unfed, or in a destroyed home does not heal a wound',()=>{
  const {g,home,person}=setup();person.health=80;
  assert(g.releaseResident(person.id,home));g.advanceDay();assert.equal(person.health,80);
  g.enterResident(person,home);home.health=0;g.advanceDay();assert.equal(person.health,80);
  home.health=home.maxHealth;person.fedUntil=0;home.inventory.items.food=0;
  for(const store of g.communalStores(0))for(const good of ['food','bread','barleyBread','milk'])store.inventory.items[good]=0;
  g.advanceDay();assert.equal(person.health,80);
});
