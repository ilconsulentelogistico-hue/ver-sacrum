const {test}=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');

function workplace(g,run,type){
  const base=g.buildings.find(b=>b.owner===0&&b.type==='base');
  const building=run(`new Building(${JSON.stringify(type)},${base.x+4},${base.y+3},0,true)`);
  g.buildings.push(building);
  g.ensureInventories();
  return building;
}

test('selected farm proposes the strongest idle farmer and assigns that real person',()=>{
  const {g,run,byId}=make();const farm=workplace(g,run,'farm');
  for(const u of g.units){u.state='idle';u.task=null;u.mobilized=false;u.inventory.amount=0;u.skills.farming=1;}
  const skilled=g.units[1];skilled.skills.farming=9;
  g.selected=farm;g.updateUI();
  assert.match(byId.selectionCard.innerHTML,/Aggiungi lavoratore/);
  assert.equal(g.workplaceCandidates(farm)[0].id,skilled.id);
  assert.equal(g.addWorkerToWorkplace(farm,skilled.id),true);
  assert.equal(skilled.task.type,'farm');assert.equal(skilled.task.target,farm.id);
  assert.equal(g.workplaceCandidates(farm).some(u=>u.id===skilled.id),false);
});

test('workshop allows a different free person and keeps her identity and skill after reload',()=>{
  const {g,run,byId}=make();const loom=workplace(g,run,'loom');
  for(const u of g.units){u.state='idle';u.task=null;u.mobilized=false;u.inventory.amount=0;u.skills.weaving=1;}
  g.units[0].skills.weaving=8;const chosen=g.units[1];const id=chosen.id;
  g.selected=loom;g.updateUI();
  assert.equal(g.workplaceCandidates(loom)[0].id,g.units[0].id);
  assert.match(byId.selectionCard.innerHTML,/Aggiungi lavoratore/);
  assert.equal(g.addWorkerToWorkplace(loom,id),true);
  assert.equal(chosen.task.type,'production');assert.equal(chosen.task.target,loom.id);
  assert(g.save());assert(g.load());
  const restored=g.units.find(u=>u.id===id);
  assert.equal(restored.task.type,'production');assert.equal(restored.skills.weaving,1);
});

test('unfinished workplace and lack of idle people give a written reason',()=>{
  const {g,run,byId}=make();const farm=workplace(g,run,'farm');
  farm.progress=.5;g.selected=farm;g.updateUI();
  assert.match(byId.selectionCard.innerHTML,/Completa prima l.edificio/);
  assert.equal(g.addWorkerToWorkplace(farm),false);
  farm.progress=1;for(const u of g.units)u.state='moving';g.updateUI();
  assert.match(byId.selectionCard.innerHTML,/Nessun abitante libero/);
  assert.equal(g.addWorkerToWorkplace(farm),false);
});
