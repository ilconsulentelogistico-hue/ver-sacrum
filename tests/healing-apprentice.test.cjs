const {test}=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');

function setup(){
  const {g}=make();g.newGame(321);g.nextRaidDay=1e9;
  const [healer,patient,apprentice]=g.units;
  g.ensureInventories();
  healer.skills.healing=4;
  healer.inventory.type='cloth';healer.inventory.amount=1;
  patient.health=70;
  patient.x=healer.x+.4;patient.y=healer.y;
  apprentice.x=healer.x+.8;apprentice.y=healer.y;
  apprentice.state='idle';apprentice.task=null;
  assert.equal(g.setWorkshopMentor(apprentice.id,healer.id),null);
  return {g,healer,patient,apprentice};
}

test('one present apprentice learns from a completed real treatment and the cloth is consumed once',()=>{
  const {g,healer,patient,apprentice}=setup();
  assert.equal(g.assignTreatment(healer,patient),null);
  g.updateTreatment(healer,1.9);
  assert.equal(apprentice.xp.healing||0,0);
  g.updateTreatment(healer,.2);
  assert.equal(healer.xp.healing,6);
  assert.equal(apprentice.xp.healing,2);
  assert.equal(healer.inventory.amount,0);
  assert.equal(patient.health,78);
  assert.equal(patient.lastTreatmentDay,g.totalDays);
  assert.equal(g.assignTreatment(healer,patient)?.includes('già stata curata'),true);
  assert(g.save());assert(g.load());
  assert.equal(g.units.find(u=>u.id===apprentice.id).xp.healing,2);
  assert.equal(g.units.find(u=>u.id===apprentice.id).mentorId,healer.id);
});

test('only the closest free assigned apprentice learns; distance, work and skill gap matter',()=>{
  const {g,healer,patient,apprentice}=setup();
  const remote=g.units[3],busy=g.units[4];
  for(const other of [remote,busy])assert.equal(g.setWorkshopMentor(other.id,healer.id),null);
  remote.x=healer.x+4;remote.y=healer.y;
  busy.x=healer.x+.3;busy.y=healer.y;busy.state='working';busy.task={type:'gather'};
  assert.equal(g.assignTreatment(healer,patient),null);
  g.updateTreatment(healer,2.1);
  assert.equal(apprentice.xp.healing,2);
  assert.equal(remote.xp.healing||0,0);
  assert.equal(busy.xp.healing||0,0);
  g.advanceDay();patient.health=70;
  apprentice.skills.healing=3;
  healer.inventory.type='cloth';healer.inventory.amount=1;
  assert.equal(g.assignTreatment(healer,patient),null);
  g.updateTreatment(healer,2.1);
  assert.equal(apprentice.xp.healing,2,'one-level gap is not sufficient');
});

test('an interrupted treatment gives neither healer nor apprentice XP',()=>{
  const {g,healer,patient,apprentice}=setup();
  assert.equal(g.assignTreatment(healer,patient),null);
  g.updateTreatment(healer,1);
  g.cancelTask(healer);
  assert.equal(healer.xp.healing||0,0);
  assert.equal(apprentice.xp.healing||0,0);
  assert.equal(patient.health,70);
  assert.equal(healer.inventory.amount,1);
});
