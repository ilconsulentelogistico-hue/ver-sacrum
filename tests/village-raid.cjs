const {test}=require("node:test"),assert=require("node:assert/strict"),make=require("./harness.cjs");
function setup(){const e=make([],{neutrals:true}),g=e.g;g.newGame(123456);const base=g.neutralSettlement(1).base,u=g.units.find(x=>x.owner===0&&x.location.kind==="world");u.mobilized=true;u.x=base.x+1.5;u.y=base.y;return{...e,g,base,u};}
const food=(g,owner)=>g.buildings.filter(b=>b.owner===owner&&b.inventory).reduce((n,b)=>n+["food","bread","barleyBread"].reduce((a,k)=>a+(b.inventory.items[k]||0),0),0);

test("raid needs a real mobilized person and only takes existing food at arrival",()=>{
  const {g,base,u}=setup(),before=food(g,1),id=u.id,people=g.neutralSettlement(1).people.map(p=>p.id);
  u.mobilized=false;assert.equal(g.beginVillageRaid(u,base).ok,false);u.mobilized=true;
  assert(g.beginVillageRaid(u,base).ok);assert.equal(base.relationship,"hostile");assert.equal(food(g,1),before);assert.equal(base.owner,1);
  assert(g.save(),g.lastSaveError);assert(g.load());const person=g.units.find(x=>x.id===id),village=g.neutralSettlement(1).base;
  assert.equal(person.task.type,"raid");g.updateUnit(person,.1);assert.equal(person.state,"raiding");assert(g.units.some(x=>x.task?.defendSettlementId===village.id));g.updateUnit(person,2.1);
  const stolen=before-food(g,1);assert(stolen>0&&stolen<=person.inventory.cap);
  assert.equal(food(g,1)+person.inventory.amount,before);assert.equal(village.owner,1);assert(people.every(id=>g.units.some(x=>x.id===id&&x.owner===1)));
  assert.equal(g.beginVillageRaid(person,village).ok,false);assert(g.save(),g.lastSaveError);assert(g.load());
});

test("empty stores do not create loot and a neutral sacred group cannot be raided",()=>{
  const {g,base,u}=setup();for(const b of g.buildings.filter(b=>b.owner===1&&b.inventory))for(const k of ["food","bread","barleyBread"])b.inventory.items[k]=0;
  assert(g.beginVillageRaid(u,base).ok);g.updateUnit(u,.1);g.updateUnit(u,2.1);assert.equal(u.inventory.amount,0);assert.equal(base.owner,1);
  const sacred=g.neutralSettlement(3).base;assert.equal(g.beginVillageRaid(u,sacred).ok,false);
});
