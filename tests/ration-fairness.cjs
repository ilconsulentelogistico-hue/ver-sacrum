const {test}=require('node:test'),assert=require('node:assert/strict'),make=require('./harness.cjs');

test('scarce real rations go to people waiting longest, once per person',()=>{
  const {g}=make(),store=g.communalStores(0)[0],people=g.units.slice(0,3);
  store.inventory.items.food=2;
  for(const u of g.units){u.fedUntil=100;u.hungry=false;}
  for(const [u,days] of people.map((u,i)=>[u,[2,8,5][i]])){
    u.fedUntil=0;u.unfedDays=days;u.hungry=true;
  }
  g.feedPeople();
  assert.equal(store.inventory.items.food,0);
  assert.equal(people[0].hungry,true);
  assert.equal(people[1].hungry,false);
  assert.equal(people[2].hungry,false);
  assert.equal(people[1].fedUntil,g.totalDays+30);
  store.inventory.items.food=1;g.feedPeople();
  assert.equal(store.inventory.items.food,0);
  assert.equal(people[0].hungry,false);
  store.inventory.items.food=1;g.feedPeople();
  assert.equal(store.inventory.items.food,1);
});

test('an already covered person does not displace an unfed newcomer',()=>{
  const {g}=make(),store=g.communalStores(0)[0],covered=g.units[0],waiting=g.units[1];
  store.inventory.items.food=1;
  for(const u of g.units){u.fedUntil=100;u.hungry=false;}
  covered.unfedDays=20;waiting.fedUntil=0;waiting.unfedDays=1;waiting.hungry=true;
  g.feedPeople();
  assert.equal(waiting.hungry,false);assert.equal(covered.fedUntil,100);assert.equal(store.inventory.items.food,0);
});
