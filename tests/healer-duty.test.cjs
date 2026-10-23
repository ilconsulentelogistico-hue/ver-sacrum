const {test}=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');
function setup(){
  const {g}=make();g.newGame(321);g.nextRaidDay=1e9;g.ensureInventories();
  const medic=g.units[0],patient=g.units[1],second=g.units[2],base=g.buildings.find(b=>b.owner===0&&b.type==='base');
  patient.health=70;second.health=80;base.inventory.items.cloth=2;
  return {g,medic,patient,second,base};
}
function run(g,medic,n=220){for(let i=0;i<n;i++)g.updateUnit(medic,.25);}
test('stable healer walks for cloth, treats the most wounded person and keeps duty',()=>{
  const {g,medic,patient,second,base}=setup();
  assert.equal(g.toggleHealerDuty(medic),null);
  assert.equal(medic.healerPostId,base.id);
  run(g,medic);
  assert.equal(patient.health,76.5);
  assert.equal(second.health,80);
  assert.equal(base.inventory.items.cloth,1);
  assert.equal(medic.healerDuty,true);
  assert.equal(medic.xp.healing,6);
  g.totalDays++;
  run(g,medic);
  assert.equal(patient.health,83);
  assert.equal(base.inventory.items.cloth,0);
});
test('service waits for real cloth and resumes after a delivery',()=>{
  const {g,medic,patient,base}=setup();
  base.inventory.items.cloth=0;
  assert.equal(g.toggleHealerDuty(medic),null);
  run(g,medic,10);
  assert.equal(medic.task,null);
  assert.equal(patient.health,70);
  base.inventory.items.cloth=1;g.totalDays++;
  run(g,medic);
  assert.equal(patient.health,76.5);
  assert.equal(base.inventory.items.cloth,0);
});
test('other order and release stop service without changing other people',()=>{
  const {g,medic,second}=setup();
  assert.equal(g.toggleHealerDuty(medic),null);
  g.assignMove(medic,Math.floor(medic.x)+1,Math.floor(medic.y)+1);
  assert.equal(medic.healerDuty,false);
  assert.equal(second.task,null);
  assert.equal(g.toggleHealerDuty(medic),null);
  assert.equal(g.toggleHealerDuty(medic),null);
  assert.equal(medic.healerDuty,false);
  assert.equal(medic.task,null);
});
test('mid-treatment save and load retain duty, person and resources',()=>{
  const {g,medic,patient,base}=setup();
  const medicId=medic.id,patientId=patient.id;
  assert.equal(g.toggleHealerDuty(medic),null);
  for(let i=0;i<80&&medic.task?.phase!=='patient';i++)g.updateUnit(medic,.25);
  assert.equal(medic.task.phase,'patient');
  assert(g.save());assert(g.load());
  const loaded=g.units.find(u=>u.id===medicId);
  assert.equal(loaded.healerDuty,true);
  assert.equal(loaded.healerPostId,base.id);
  run(g,loaded);
  assert.equal(g.units.find(u=>u.id===patientId).health,76.5);
  assert.equal(loaded.healerDuty,true);
});
test('after a distant visit the same healer walks back to the assigned base and survives reload',()=>{
  const {g,medic,patient,base}=setup();
  const bx=Math.floor(base.x),by=Math.floor(base.y);
  let destination=null;
  for(let radius=6;radius<=9&&!destination;radius++)for(let dx=-radius;dx<=radius&&!destination;dx++)for(const dy of [-radius,radius]){
    const x=bx+dx,y=by+dy;
    if(g.world.walkable(x,y,1,null,g.buildings)&&g.findPath(medic.x,medic.y,x,y,1).length)destination={x:x+.5,y:y+.5};
  }
  assert(destination,'a reachable patient position near the village');
  patient.x=destination.x;patient.y=destination.y;
  g.units[2].health=g.units[2].maxHealth;
  assert.equal(g.toggleHealerDuty(medic),null);
  for(let i=0;i<300&&patient.health===70;i++)g.updateUnit(medic,.25);
  assert.equal(patient.health,76.5);
  assert(g.buildingDistance(medic,base)>1.15);
  base.inventory.items.cloth=0;g.totalDays++;
  g.updateUnit(medic,.25);
  assert.equal(medic.task?.type,'move');
  assert.equal(medic.healerDuty,true);
  const id=medic.id;
  assert(g.save());assert(g.load());
  const loaded=g.units.find(u=>u.id===id),post=g.buildings.find(b=>b.id===base.id);
  assert.equal(loaded.task?.type,'move');
  run(g,loaded,180);
  assert.equal(loaded.task,null);
  assert.equal(loaded.healerDuty,true);
  assert(g.buildingDistance(loaded,post)<=1.15);
});
test('a fresh wound interrupts the walk home on the next game day',()=>{
  const {g,medic,patient,second,base}=setup();
  patient.health=patient.maxHealth;second.health=second.maxHealth;
  const bx=Math.floor(base.x),by=Math.floor(base.y);
  let spot=null;
  for(let radius=6;radius<=9&&!spot;radius++)for(let dx=-radius;dx<=radius&&!spot;dx++)for(const dy of [-radius,radius]){
    const x=bx+dx,y=by+dy;
    if(g.world.walkable(x,y,1,null,g.buildings)&&g.findPath(medic.x,medic.y,x,y,1).length)spot={x:x+.5,y:y+.5};
  }
  assert(spot);
  medic.x=spot.x;medic.y=spot.y;
  assert.equal(g.toggleHealerDuty(medic),null);
  g.updateUnit(medic,.25);
  assert.equal(medic.task?.type,'move');
  patient.health=70;g.totalDays++;
  g.updateUnit(medic,.25);
  assert.equal(medic.task?.type,'heal');
  assert.equal(medic.task.target,patient.id);
  assert.equal(medic.healerDuty,true);
});
