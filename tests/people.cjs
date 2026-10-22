const assert=require('node:assert/strict');
const make=require('./harness.cjs');
const SLOT='terra-italica-save-v5', OLD='terra-italica-save-v4';
let count=0;
function test(name,fn){fn();console.log('PASS',name);count++;}
function legacy(g){const d=JSON.parse(JSON.stringify(g.snapshot()));d.version=4;for(const b of d.buildings)delete b.residents;return JSON.stringify(d);}
test('one authoritative person owns identity, skills and cargo',()=>{
  const {g}=make(),u=g.units[0];u.inventory={type:'grain',amount:4,cap:15};u.skills.wood=7;u.xp.wood=12;u.health=67;
  g.groupSelection=[u];u.selected=true;
  const before=JSON.stringify(g.snapshot().units),ids=g.units.map(u=>u.id);
  assert(g.save());assert(g.load());assert.equal(JSON.stringify(g.units),before);
  assert.deepEqual(g.units.map(u=>u.id),ids);assert.equal(new Set(ids).size,ids.length);
  assert.equal(g.units[0].location.kind,'world');assert.equal(g.units[0].inventory.amount,4);
});
test('occupation follows orders and cancellation without a second job record',()=>{
  const {g}=make(),u=g.units[0];u.task={type:'move',x:u.x,y:u.y};assert.equal(u.occupation,'move');
  assert(g.save());assert(g.load());assert.equal(g.units[0].occupation,'move');
  g.cancelTask(g.units[0]);assert.equal(g.units[0].occupation,'idle');
});
test('v4 migration retains original bytes, identities, cargo, skills and order',()=>{
  const {g,storage}=make(),u=g.units[0];u.inventory={type:'wood',amount:5,cap:15};u.skills.construction=9;u.task={type:'move',x:u.x,y:u.y};
  const old=legacy(g),ids=g.units.map(u=>u.id);storage.set(OLD,old);
  assert(g.load());assert(g.paused);assert.deepEqual(g.units.map(u=>u.id),ids);assert.equal(g.units[0].inventory.amount,5);
  assert.equal(g.units[0].skills.construction,9);assert.equal(g.units[0].occupation,'move');assert(g.save());
  assert.equal(storage.get(OLD),old);assert.equal(JSON.parse(storage.get(SLOT)).version,5);
  assert(g.load());assert.deepEqual(g.units.map(u=>u.id),ids);
});
test('startup migrates v4 and prefers v5 on following startup',()=>{
  const first=make(),old=legacy(first.g),second=make([[OLD,old]]);
  assert.equal(second.g.units[0].id,first.g.units[0].id);assert(second.g.paused);
  second.g.units[0].health=51;assert(second.g.save());const third=make([...second.storage]);
  assert.equal(third.g.units[0].health,51);assert.equal(third.storage.get(OLD),old);
});
test('invalid person records are rejected before live state changes',()=>{
  for(const corrupt of [d=>d.units.push({...d.units[0]}),d=>d.units[0].location.kind='resident',d=>d.units[0].occupation='farm',d=>d.units[0].owner=1]){
    const {g,storage}=make();const d=JSON.parse(JSON.stringify(g.snapshot()));corrupt(d);storage.set(SLOT,JSON.stringify(d));const world=g.world,person=g.units[0];
    assert.equal(g.load(),false);assert.equal(g.world,world);assert.equal(g.units[0],person);
  }
});
test('corrupt v4 uses valid v4 backup without overwriting either original',()=>{
  const {g,storage}=make(),old=legacy(g);storage.set(OLD,'broken');storage.set(OLD+'-backup',old);assert(g.load());assert(g.save());
  assert.equal(storage.get(OLD),'broken');assert.equal(storage.get(OLD+'-backup'),old);
});
console.log(`${count} persistent-person regressions passed.`);
