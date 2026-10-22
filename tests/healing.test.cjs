const {test}=require('node:test');
const assert=require('node:assert/strict');
const make=require('/home/claude-gh/lavori/Rtsmobile/tests/harness.cjs');

function setup(){
  const e=make(),g=e.g;
  g.newGame(321);
  g.nextRaidDay=1e9;
  const healer=g.units[0],patient=g.units[1],base=g.buildings.find(b=>b.owner===0&&b.type==='base');
  g.ensureInventories();
  base.inventory.items.cloth=2;
  patient.health=70;
  return {e,g,healer,patient,base};
}
function finish(g,healer){
  for(let i=0;i<160&&healer.task;i++)g.updateTreatment(healer,.25);
  assert.equal(healer.task,null,'treatment should finish');
}
test('a healer carries local cloth to a real person and gains permanent skill XP',()=>{
  const {g,healer,patient,base}=setup();
  assert.equal(g.assignTreatment(healer,patient),null);
  finish(g,healer);
  assert.equal(patient.health,76.5);
  assert.equal(base.inventory.items.cloth,1);
  assert.equal(healer.xp.healing,6);
  assert.equal(patient.lastTreatmentDay,g.totalDays);
  assert.match(g.assignTreatment(healer,patient),/già stata curata/);
  g.advanceDay();
  assert.equal(g.assignTreatment(healer,patient),null);
  finish(g,healer);
  assert.equal(patient.health,83);
});
test('treatment leaves starvation damage unchanged and never creates cloth',()=>{
  const {g,healer,patient,base}=setup();
  patient.nutritionDamage=20;
  assert.equal(g.assignTreatment(healer,patient),null);
  finish(g,healer);
  assert.equal(patient.health,76.5);
  assert.equal(patient.nutritionDamage,20);
  patient.health=80;
  g.advanceDay();
  assert.match(g.assignTreatment(healer,patient),/fame richiede razioni/);
  assert.equal(base.inventory.items.cloth,1);
});
test('save and load midway keep person, cloth, route and treatment',()=>{
  const {g,healer,patient,base}=setup();
  assert.equal(g.assignTreatment(healer,patient),null);
  for(let i=0;i<80&&healer.task?.phase==='source';i++)g.updateTreatment(healer,.25);
  assert.equal(healer.task.phase,'patient');
  assert.equal(healer.inventory.type,'cloth');
  const id=healer.id,target=patient.id,source=base.id;
  assert(g.save());
  assert(g.load());
  const medic=g.units.find(u=>u.id===id),sick=g.units.find(u=>u.id===target),store=g.buildings.find(b=>b.id===source);
  assert.equal(medic.task.phase,'patient');
  assert.equal(medic.inventory.amount,1);
  finish(g,medic);
  assert.equal(sick.health,76.5);
  assert.equal(g.buildings.filter(b=>b.owner===0).reduce((sum,b)=>sum+(b.inventory.items.cloth||0),0),1);
  assert(g.save());
  assert(g.load());
  assert.equal(g.units.find(u=>u.id===target).lastTreatmentDay,g.totalDays);
});
test('an order saved before pickup finds cloth again after storage relocation',()=>{
  const {g,healer,patient}=setup();
  const id=healer.id,target=patient.id;
  assert.equal(g.assignTreatment(healer,patient),null);
  assert.equal(healer.task.phase,'source');
  assert(g.save());
  assert(g.load());
  const medic=g.units.find(u=>u.id===id);
  finish(g,medic);
  assert.equal(g.units.find(u=>u.id===target).health,76.5);
  assert.equal(g.buildings.filter(b=>b.owner===0).reduce((sum,b)=>sum+(b.inventory.items.cloth||0),0),1);
});
test('orders reject missing cloth, cargo, self treatment and healthy people',()=>{
  const {g,healer,patient,base}=setup();
  base.inventory.items.cloth=0;
  assert.match(g.assignTreatment(healer,patient),/tessuto/);
  healer.inventory.type='wood';healer.inventory.amount=1;
  assert.match(g.assignTreatment(healer,patient),/carico/);
  healer.inventory.type=null;healer.inventory.amount=0;
  assert.match(g.assignTreatment(healer,healer),/altra persona/);
  patient.health=100;
  assert.match(g.assignTreatment(healer,patient),/ferite/);
});
