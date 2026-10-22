const {test}=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');

function setup(){
  const {g}=make();g.newGame(321);g.nextRaidDay=1e9;
  const [mentor,apprentice,patient]=g.units;
  assert.equal(g.setWorkshopMentor(apprentice.id,mentor.id),null);
  return {g,mentor,apprentice,patient};
}

test('the chosen apprentice follows a moving mentor, remains a separate person, and survives reload',()=>{
  const {g,mentor,apprentice}=setup();
  assert.equal(g.toggleFollowMentor(apprentice),null);
  assert.equal(apprentice.task.target,mentor.id);
  let spot=null;
  for(let r=4;r<=8&&!spot;r++)for(let dx=-r;dx<=r&&!spot;dx++)for(const dy of [-r,r]){
    const x=Math.floor(mentor.x)+dx,y=Math.floor(mentor.y)+dy;
    if(g.world.walkable(x,y,1,null,g.buildings)&&g.findPath(apprentice.x,apprentice.y,x,y,1).length)spot={x:x+.5,y:y+.5};
  }
  assert(spot,'reachable ground for teacher');
  mentor.x=spot.x;mentor.y=spot.y;
  for(let i=0;i<200&&Math.hypot(apprentice.x-mentor.x,apprentice.y-mentor.y)>1.55;i++)g.updateUnit(apprentice,.25);
  assert(Math.hypot(apprentice.x-mentor.x,apprentice.y-mentor.y)<=1.55,'apprentice approaches teacher');
  assert.notEqual(apprentice.id,mentor.id);
  assert.equal(apprentice.task.type,'follow-mentor');
  assert(g.save());assert(g.load());
  const restored=g.units.find(u=>u.id===apprentice.id);
  assert.equal(restored.task.target,mentor.id);
  assert.equal(restored.state,'following');
  assert.equal(g.toggleFollowMentor(restored),null);
  assert.equal(restored.task,null);
});

test('a following apprentice can learn from a real completed treatment',()=>{
  const {g,mentor,apprentice,patient}=setup();
  g.ensureInventories();
  mentor.skills.healing=4;
  mentor.inventory.type='cloth';mentor.inventory.amount=1;
  patient.health=70;patient.x=mentor.x+.4;patient.y=mentor.y;
  apprentice.x=mentor.x+.8;apprentice.y=mentor.y;
  assert.equal(g.toggleFollowMentor(apprentice),null);
  assert.equal(g.assignTreatment(mentor,patient),null);
  g.updateTreatment(mentor,2.1);
  assert.equal(patient.health,78);
  assert.equal(apprentice.xp.healing,2);
  assert.equal(apprentice.task.type,'follow-mentor');
  assert.equal(mentor.inventory.amount,0);
});

test('following stops if the teacher is absent or the apprentice changes teacher',()=>{
  const {g,mentor,apprentice}=setup();
  assert.equal(g.toggleFollowMentor(apprentice),null);
  assert.equal(g.setWorkshopMentor(apprentice.id,g.units[3].id),null);
  assert(g.save(),'mentor change must leave a valid save');
  assert.equal(apprentice.task,null);
  assert.equal(g.toggleFollowMentor(apprentice),null);
  const teacher=g.units[3];teacher.health=0;
  g.updateUnit(apprentice,.1);
  assert.equal(apprentice.task,null);
  assert.equal(g.toggleFollowMentor(apprentice)?.includes('presente sulla mappa'),true);
});
