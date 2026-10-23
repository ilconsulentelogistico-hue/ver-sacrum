const assert=require('node:assert/strict');
const make=require('./harness.cjs');
const SLOT='terra-italica-save-v5';
let count=0;
function test(name,fn){fn();console.log('PASS',name);count++;}
function setup(){const e=make(),g=e.g;g.newGame(321);g.raiders=[];g.animals=[];g.paused=false;for(const t of g.world.tiles){t.biome='grass';t.z=0;}return e;}
function house(e,x=45,y=45){return e.run(`(()=>{const b=new Building('house',${x},${y},0,true);game.buildings.push(b);game.ensureInventories();return b})()`)}
test('enter and leave keep the same person, health, skills and cargo',()=>{
  const e=setup(),g=e.g,b=house(e),u=g.units[0],id=u.id,skills=JSON.stringify(u.skills);u.health=63;u.inventory={type:'grain',amount:5,cap:15};
  g.enterResident(u,b);assert.equal(g.units.length,5);assert.equal(JSON.stringify(b.residents),JSON.stringify([id]));assert.equal(u.location.kind,'resident');assert.equal(u.inventory.amount,5);
  assert(g.releaseResident(id,b));assert.equal(g.units.length,5);assert.equal(g.units[0].id,id);assert.equal(u.health,63);assert.equal(JSON.stringify(u.skills),skills);assert.equal(u.inventory.amount,5);assert.equal(u.location.kind,'world');
});
test('resident round trip keeps one identity and hides it from world selection',()=>{
  const e=setup(),g=e.g,b=house(e),u=g.units[0],id=u.id;g.enterResident(u,b);assert(g.save());assert(g.load());
  const loaded=g.units.find(x=>x.id===id),home=g.buildings.find(x=>x.id===b.id);assert(loaded);assert.equal(g.units.filter(x=>x.id===id).length,1);assert.equal(JSON.stringify(home.residents),JSON.stringify([id]));assert.equal(loaded.location.settlementId,home.id);assert(!g.rtsSelectedUnits().includes(loaded));
  assert(g.releaseResident(id,home));assert(g.save());assert(g.load());assert.equal(g.units.filter(x=>x.id===id).length,1);assert.equal(g.units.find(x=>x.id===id).location.kind,'world');
});
test('full district refuses a sixth person without changing them',()=>{
  const e=setup(),g=e.g,b=house(e);for(const u of g.units)g.enterResident(u,b);const extra=e.run("new Unit('Sesto',40,40,game.rng)");g.units.push(extra);g.assignEnter(extra,b);assert.equal(extra.location.kind,'world');assert.equal(extra.task,null);assert.equal(b.residents.length,5);assert.match(e.byId.message.textContent,/pieno/i);
});
test('destroyed district evacuates residents when ground is free',()=>{
  const e=setup(),g=e.g,b=house(e),u=g.units[0];g.enterResident(u,b);b.health=0;g.update(.05);assert.equal(u.location.kind,'world');assert.equal(b.residents.length,0);assert(!g.buildings.includes(b));
});
test('destroyed district remains as a safe record when no exit exists',()=>{
  const e=setup(),g=e.g,b=house(e),u=g.units[0];g.enterResident(u,b);g.findResidentExit=()=>null;b.health=0;g.update(.05);assert.equal(u.location.kind,'resident');assert.equal(JSON.stringify(b.residents),JSON.stringify([u.id]));assert(g.buildings.includes(b));assert.match(e.byId.message.textContent,/distrutto/i);assert(g.save());
});
test('manual exit with no free ground is visible and changes nothing',()=>{
  const e=setup(),g=e.g,b=house(e),u=g.units[0];g.enterResident(u,b);g.findResidentExit=()=>null;assert.equal(g.releaseResident(u.id,b),false);assert.equal(u.location.kind,'resident');assert.equal(JSON.stringify(b.residents),JSON.stringify([u.id]));assert.match(e.byId.message.textContent,/uscita libera/i);
});
test('invalid duplicate or broken resident links never replace live world',()=>{
  for(const corrupt of [d=>d.buildings.find(b=>b.type==='house').residents.push(d.units[0].id,d.units[0].id),d=>{d.units[0].location={kind:'resident',settlementId:'missing'};}]){
    const e=setup(),g=e.g;house(e);const d=JSON.parse(JSON.stringify(g.snapshot()));corrupt(d);e.storage.set(SLOT,JSON.stringify(d));const world=g.world,person=g.units[0];assert.equal(g.load(),false);assert.equal(g.world,world);assert.equal(g.units[0],person);
  }
});
console.log(`${count} resident regressions passed.`);
