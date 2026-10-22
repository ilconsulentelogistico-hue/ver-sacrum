const {test}=require('node:test'),assert=require('node:assert/strict'),make=require('./harness.cjs');

function mill(level){
  const {g,run}=make(),u=g.units[0],b=run("new Building('mill',40,40,0,true)");
  g.buildings.push(b);g.ensureInventories();g.feedPeople();u.x=b.x+1;u.y=b.y;
  assert.equal(g.assignProduction(u,b),null);u.skills.milling=level;b.inventory.items.grain=2;
  g.updateBuilding(b,.1);assert(b.batch);g.updateBuilding(b,1);return {remaining:b.batch.remaining,inputs:b.inventory.items.grain,outputs:b.inventory.items.flour||0};
}

test('mill skill reduces batch time without altering input or output',()=>{
  const novice=mill(1),trained=mill(11),expert=mill(20);
  assert.equal(novice.remaining,5);assert(Math.abs(trained.remaining-4.75)<1e-9);assert(Math.abs(expert.remaining-4.7)<1e-9);
  for(const x of [novice,trained,expert]){assert.equal(x.inputs,0);assert.equal(x.outputs,0)}
});

test('transport skill speeds only the loaded leg, capped at twenty percent',()=>{
  const {g,run}=make();g.newGame(123456);const u=g.units[0],source=g.buildings.find(b=>b.type==='base'),dest=run("new Building('warehouse',60,60,0,true)");
  g.buildings.push(dest);g.ensureInventories();u.x=source.x+4;u.y=source.y+4;u.skills.transport=20;
  u.task={type:'haul',source:source.id,destination:dest.id,good:'wood',repeat:false,phase:'source',amount:5,retry:0};u.state='hauling';u.path=[{x:u.x+1,y:u.y}];
  const speeds=[];g.followPath=(actor,dt,speed)=>{speeds.push(speed)};
  g.updateHaul(u,.1);assert.equal(speeds.at(-1),1.6);
  u.task.phase='destination';u.inventory={type:'wood',amount:5,cap:u.inventory.cap};g.updateHaul(u,.1);
  assert(Math.abs(speeds.at(-1)-1.92)<1e-9);
});


test('carpentry and baking use their own skill and the panel explains the bonus',()=>{
  for(const [type,input,amount,key] of [['sawmill','wood',10,'carpentry'],['bakery','flour',2,'baking']]){
    const {g,run,byId}=make(),u=g.units[0],b=run(`new Building('${type}',40,40,0,true)`);
    g.buildings.push(b);g.ensureInventories();g.feedPeople();u.x=b.x+1;u.y=b.y;
    assert.equal(g.assignProduction(u,b),null);b.inventory.items[input]=amount;u.skills[key]=11;
    g.updateBuilding(b,.1);assert(b.batch);const before=b.batch.remaining;g.updateBuilding(b,1);
    assert(Math.abs(b.batch.remaining-(before-1.25))<1e-9);
    g.openSkills(u.id);assert.match(byId.skillsList.innerHTML,/Lotti: \+25% velocità/);
  }
});
