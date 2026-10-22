const {test}=require('node:test'),assert=require('node:assert/strict'),make=require('./harness.cjs');

function setup(){
  const {g,run,byId,storage}=make(),mentor=g.units[0],pupil=g.units[1],mill=run("new Building('mill',40,40,0,true)");
  g.buildings.push(mill);g.ensureInventories();g.feedPeople();
  for(const u of [mentor,pupil]){u.x=mill.x+1;u.y=mill.y;assert.equal(g.assignProduction(u,mill),null)}
  mentor.skills.milling=5;return {g,run,byId,storage,mentor,pupil,mill};
}

test('chosen mentor grants extra XP only after a shared real production batch',()=>{
  const {g,mentor,pupil,mill}=setup();assert.equal(g.setWorkshopMentor(pupil.id,mentor.id),null);
  mill.inventory.items.grain=2;g.updateBuilding(mill,.1);assert.equal(pupil.xp.milling||0,0);
  g.updateBuilding(mill,8);assert.equal(mill.inventory.items.flour,2);
  assert.equal(mentor.xp.milling,1);assert.equal(pupil.xp.milling,1.5);
  g.cancelTask(mentor);mill.inventory.items.grain=2;g.updateBuilding(mill,.1);g.updateBuilding(mill,8);
  assert.equal(pupil.xp.milling,2.5);
});

test('mentor choice rejects self and outsiders, persists, and can be removed',()=>{
  const {g,storage,mentor,pupil}=setup();
  assert.match(g.setWorkshopMentor(pupil.id,pupil.id),/non disponibile/);
  assert.match(g.setWorkshopMentor(pupil.id,'missing'),/non disponibile/);
  assert.equal(g.setWorkshopMentor(pupil.id,mentor.id),null);assert(g.save(),g.lastSaveError);
  assert(g.load());const restored=g.units.find(u=>u.id===pupil.id);assert.equal(restored.mentorId,mentor.id);
  assert.equal(g.setWorkshopMentor(restored.id,''),null);assert.equal(restored.mentorId,null);
  assert(storage.size>0);
});
