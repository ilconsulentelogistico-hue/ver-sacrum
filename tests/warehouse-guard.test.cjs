const {test}=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');

function setup(){
  const {g,run,byId}=make();g.newGame(321);g.nextRaidDay=1e9;g.raidsEnabled=true;
  const base=g.buildings.find(b=>b.owner===0&&b.type==='base');
  const post=run(`new Building("warehouse",${Math.floor(base.x)+8},${Math.floor(base.y)-8},0,true)`);
  g.buildings.push(post);g.ensureInventories();post.inventory.items.food=8;
  const guard=g.units.find(u=>u.owner===0);
  assert(g.mobilizePerson(guard.id));
  return {g,run,byId,base,post,guard};
}

test('a real mobilized person guards a warehouse, fights and returns after reload',()=>{
  const {g,run,post,guard}=setup();
  assert.equal(g.assignWarehouseGuard(guard,post),null);
  assert.equal(guard.guardPostId,post.id);
  assert.match(g.selectionHTML(post),/Presidio: /);
  const enemy=run(`new Raider(${post.x+2},${post.y+1},1)`);g.raiders.push(enemy);
  const before=enemy.health;
  for(let i=0;i<260&&enemy.health===before;i++)g.updateUnit(guard,.25);
  assert(enemy.health<before,'guard attacks a nearby real raider');
  assert(guard.xp.combat>0);
  assert(g.save());assert(g.load());
  const restored=g.units.find(u=>u.id===guard.id),store=g.buildings.find(b=>b.id===post.id);
  assert.equal(restored.guardDuty,true);assert.equal(restored.guardPostId,store.id);
  g.raiders.find(r=>r.id===enemy.id).health=0;
  for(let i=0;i<260&&(restored.task||g.buildingDistance(restored,store)>1.6);i++)g.updateUnit(restored,.25);
  assert.equal(restored.guardDuty,true);assert.equal(restored.task,null);
  assert(g.buildingDistance(restored,store)<=1.6);
});

test('warehouse sentry order rejects foreign, unfinished, unreachable and double occupied posts',()=>{
  const {g,run,post,guard}=setup();
  const other=g.units.find(u=>u.owner===0&&u.id!==guard.id);assert(g.mobilizePerson(other.id));
  post.owner=1;assert.match(g.assignWarehouseGuard(guard,post),/tuo magazzino/);
  post.owner=0;post.progress=.5;assert.match(g.assignWarehouseGuard(guard,post),/completato/);
  post.progress=1;
  assert.equal(g.assignWarehouseGuard(guard,post),null);
  assert.match(g.assignWarehouseGuard(other,post),/già una sentinella/);
  g.cancelTask(guard);assert.equal(guard.guardDuty,false);
  const old=g.pathToBuilding;g.pathToBuilding=(person,target)=>target.id===post.id?null:old.call(g,person,target);
  assert.match(g.assignWarehouseGuard(other,post),/raggiungibile/);
  assert.equal(other.guardDuty,undefined);
});

test('touch order targets the warehouse and a destroyed post ends duty',()=>{
  const {g,post,guard}=setup();
  assert.match(g.orderHelp('warehouse-duty'),/magazzino/);
  g.selected=guard;g.orderMode='warehouse-duty';
  g.applyOrder('warehouse-duty',{x:post.x,y:post.y},0,0,guard);
  assert.equal(guard.guardDuty,true);
  assert.equal(guard.guardPostId,post.id);
  assert.equal(g.orderMode,null);
  post.health=0;g.updateUnit(guard,.25);
  assert.equal(guard.guardDuty,false);
});

test('warehouse guard prioritizes the raider targeting its post, then resumes other threats',()=>{
  const {g,run,post,guard}=setup();
  assert.equal(g.assignWarehouseGuard(guard,post),null);
  const bystander=run(`new Raider(${post.x+2},${post.y+1},1)`);
  const intruder=run(`new Raider(${post.x+5},${post.y+1},1)`);
  intruder.raidStoreId=post.id;
  g.raiders.push(bystander,intruder);
  g.updateUnit(guard,.8);
  assert.equal(guard.task?.target,intruder.id,'the warehouse intruder takes priority');
  intruder.health=0;
  g.updateUnit(guard,.8);
  g.updateUnit(guard,.8);
  assert.equal(guard.task?.target,bystander.id,'ordinary nearby threat remains actionable');
});


test('warehouse guard interrupts another fight when its own store is targeted',()=>{
  const {g,run,post,guard}=setup();
  assert.equal(g.assignWarehouseGuard(guard,post),null);
  const bystander=run(`new Raider(${post.x+2},${post.y+1},1)`);
  g.raiders.push(bystander);
  g.updateUnit(guard,.8);
  assert.equal(guard.task?.target,bystander.id);
  const intruder=run(`new Raider(${post.x+5},${post.y+1},1)`);
  intruder.raidStoreId=post.id;g.raiders.push(intruder);
  g.updateUnit(guard,.8);
  assert.equal(guard.task?.target,intruder.id);
  assert.equal(guard.guardDuty,true);
  assert.equal(guard.guardPostId,post.id);
  intruder.health=0;g.updateUnit(guard,.8);g.updateUnit(guard,.8);
  assert.equal(guard.task?.target,bystander.id);
});


test('warehouse sentry pursues the thief carrying food from its own post',()=>{
  const {g,run,post,guard}=setup();
  assert.equal(g.assignWarehouseGuard(guard,post),null);
  const bystander=run(`new Raider(${post.x+2},${post.y+1},1)`);
  g.raiders.push(bystander);g.updateUnit(guard,.8);
  assert.equal(guard.task?.target,bystander.id);
  const thief=run(`new Raider(${post.x+0.8},${post.y},1)`);
  thief.raidStoreId=post.id;thief.campId=g.warCamps[0]?.id;g.raiders.push(thief);
  g.updateRaider(thief,.1);
  assert.equal(thief.lootFood,5);assert.equal(thief.raidStoreId,null);
  assert.equal(thief.lootStoreId,post.id);
  thief.x=post.x+5;thief.y=post.y+1; // already fleeing farther away than the first enemy
  g.updateUnit(guard,.8);
  assert.equal(guard.task?.target,thief.id);
  assert(g.save());assert(g.load());
  const restored=g.raiders.find(r=>r.id===thief.id);
  assert.equal(restored.lootStoreId,post.id);
  assert.equal(g.units.find(u=>u.id===guard.id).task?.target,thief.id);
});
