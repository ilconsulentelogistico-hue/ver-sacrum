const {test}=require("node:test"),assert=require("node:assert/strict"),make=require("./harness.cjs");
const setup=()=>{const fixture=make([],{neutrals:true});fixture.g.newGame(321);return fixture;};

test("morale belongs to real people, affects their attack and survives save/load",()=>{
  const {g,storage}=setup(),person=g.units.find(u=>u.owner===0);
  assert.equal(person.morale,70);
  const usual=g.personAttackDamage(person,10);
  person.morale=40;assert(g.personAttackDamage(person,10)<usual);
  person.morale=90;assert(g.personAttackDamage(person,10)>usual);
  const id=person.id;assert(g.save());assert(g.load());
  assert.equal(g.units.find(u=>u.id===id).morale,90);
  const old=JSON.parse(storage.get("terra-italica-save-v5"));for(const u of old.units)delete u.morale;storage.set("terra-italica-save-v5",JSON.stringify(old));assert(g.load());assert.equal(g.units.find(u=>u.id===id).morale,70);
});

test("demoralized defenders stand down and the village may surrender without new troops",()=>{
  const {g}=setup(),base=g.neutralSettlement(1).base,people=g.neutralSettlement(1).people,ids=people.map(u=>u.id),attacker=g.units.find(u=>u.owner===0&&u.location.kind==="world");
  people.forEach(u=>u.morale=20);
  attacker.mobilized=true;attacker.x=base.x+1.5;attacker.y=base.y;
  assert(g.beginVillageAssault(attacker,base));g.combatTick(attacker,.85);
  assert.equal(base.siegeDefenderIds.length,0);
  assert.equal(base.siegeReadyDay,g.totalDays);
  assert.equal(g.demandVillageSurrender(base,"morale-surrender").ok,true);
  assert(ids.every(id=>g.units.some(u=>u.id===id&&u.owner===0)));
});

test("hungry wounded people lose morale while fed people recover",()=>{
  const {g}=setup(),u=g.units.find(p=>p.owner===0);
  u.morale=70;u.hungry=true;u.health=40;u.fedUntil=0;for(const b of g.buildings.filter(b=>b.owner===0&&b.inventory))for(const good of ["food","bread","barleyBread","milk"])b.inventory.items[good]=0;
  g.advanceDay();assert(u.morale<=60);
  u.hungry=false;u.unfedDays=0;u.health=100;u.fedUntil=g.totalDays+60;
  const before=u.morale;g.advanceDay();assert(u.morale>before);
});
