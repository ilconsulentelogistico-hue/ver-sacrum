const {test}=require('node:test');
const assert=require('node:assert/strict');
const make=require('/home/claude-gh/lavori/Rtsmobile/tests/economy-fixture.cjs');

function setup(){
  const e=make(false,{seed:321}),g=e.g;
  g.nextRaidDay=1e9;g.ensureInventories();
  const healer=g.units[0],patient=g.units[1],house=e.add('house',8,6);
  const base=g.buildings.find(b=>b.owner===0&&b.type==='base');
  base.inventory.items.cloth=2;
  g.enterResident(patient,house);
  assert.equal(patient.location.kind,'resident');
  patient.health=70;
  return {e,g,healer,patient,house,base};
}
function finish(g,healer){
  for(let i=0;i<200&&healer.task;i++)g.updateUnit(healer,.25);
  if(healer.task){
    const home=g.buildings.find(b=>b.id===g.units.find(p=>p.id===healer.task.target)?.location?.settlementId);
    assert.fail(JSON.stringify({x:healer.x,y:healer.y,path:healer.path.length,last:healer.path.at(-1),home:{x:home?.x,y:home?.y},distance:home&&g.buildingDistance(healer,home)}));
  }
}
test('a healer visits the house and treats the resident without creating a world copy',()=>{
  const {g,healer,patient,house}=setup(),id=patient.id;
  assert.equal(g.assignTreatment(healer,patient),null);
  finish(g,healer);
  assert.equal(patient.health,76.5);
  assert.equal(patient.location.kind,'resident');
  assert(house.residents.includes(id));
  assert.equal(g.units.filter(p=>p.id===id).length,1);
  assert.equal(healer.xp.healing,6);
});
test('touch order on a house chooses its most wounded eligible resident',()=>{
  const {g,healer,patient,house}=setup();
  const second=g.units[2];
  g.enterResident(second,house);
  assert.equal(second.location.kind,'resident');
  second.health=50;
  g.selected=healer;
  g.orderMode='heal';
  const corner={x:house.x+1.4,y:house.y+1.4};
  g.applyOrder('heal',corner,Math.floor(corner.x),Math.floor(corner.y));
  assert.equal(healer.task?.type,'heal');
  assert.equal(healer.task.target,second.id);
  assert.equal(g.orderMode,null);
  finish(g,healer);
  assert.equal(second.health,56.5);
  assert.equal(patient.health,70);
});
test('a resident remains in the same home after reload during the visit',()=>{
  const {g,healer,patient,house}=setup(),healerId=healer.id,patientId=patient.id,houseId=house.id;
  assert.equal(g.assignTreatment(healer,patient),null);
  for(let i=0;i<80&&healer.task?.phase==='source';i++)g.updateTreatment(healer,.25);
  assert.equal(healer.task.phase,'patient');
  assert(g.save());
  assert(g.load());
  const medic=g.units.find(p=>p.id===healerId),resident=g.units.find(p=>p.id===patientId),home=g.buildings.find(b=>b.id===houseId);
  assert.equal(resident.location.settlementId,home.id);
  finish(g,medic);
  assert.equal(resident.health,76.5);
  assert(home.residents.includes(resident.id));
  assert(g.save());
  assert(g.load());
  assert.equal(g.units.find(p=>p.id===patientId).location.kind,'resident');
});
