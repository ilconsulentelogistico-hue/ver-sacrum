const {test}=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');
function setup(){
  const e=make(),g=e.g;g.newGame(321);g.nextRaidDay=1e9;g.raidsEnabled=true;
  const guard=g.units[0],base=g.buildings.find(b=>b.owner===0&&b.type==='base');
  assert(g.mobilizePerson(guard.id));
  let site=null;
  for(let r=3;r<=8&&!site;r++)for(let dx=-r;dx<=r&&!site;dx++)for(const dy of [-r,r]){
    const x=Math.floor(base.x)+dx,y=Math.floor(base.y)+dy;
    if(g.world.walkable(x,y,1,null,g.buildings)&&g.findPath(guard.x,guard.y,x,y,1).length){site={x,y};break;}
  }
  assert(site);
  const tower=e.run(`new Building('tower',${site.x},${site.y},0,true)`);g.buildings.push(tower);g.ensureInventories();
  tower.inventory.items.stone=10;
  assert.equal(g.towerDefends(tower),false,'unmanned tower is no threat');
  assert.equal(g.assignTowerGuard(guard,tower),null);
  for(let i=0;i<250&&g.buildingDistance(guard,tower)>1.6;i++)g.updateUnit(guard,.25);
  assert(g.buildingDistance(guard,tower)<=1.6);
  assert.equal(g.towerDefends(tower),true);
  const raider=e.run(`new Raider(${tower.x+3},${tower.y},1)`);g.raiders.push(raider);
  return {g,run:e.run,guard,tower,raider};
}
test('raiders attack a defended tower and damage remains after save/load',()=>{
  const {g,guard,tower,raider}=setup();const before=tower.health;
  for(let i=0;i<240&&tower.health===before;i++)g.updateRaider(raider,.25);
  assert(tower.health<before,'raider reaches and hits tower');
  assert.equal(guard.health,guard.maxHealth,'the tower absorbs this attack');
  const health=tower.health,id=tower.id;
  assert(g.save());assert(g.load());
  const restored=g.buildings.find(b=>b.id===id);
  assert.equal(restored.health,health);
  assert.equal(restored.inventory.items.stone,10);
  assert.equal(g.units.find(u=>u.id===guard.id).guardPostId,id);
});
test('a destroyed tower stops guarding and drops its remaining stones exactly once',()=>{
  const {g,tower,raider,guard}=setup();
  tower.health=1;
  for(let i=0;i<240&&tower.health>0;i++)g.updateRaider(raider,.25);
  assert(tower.health<=0,'raider can destroy the tower');
  g.updateUnit(guard,.25);assert.equal(guard.guardDuty,false);
  const before=g.world.resources.length;g.recoverDeadBuildingCargo();
  assert.equal(g.world.resources.length,before+1);
  const dropped=g.world.resources.at(-1);assert.equal(dropped.type,'stone');assert.equal(dropped.amount,10);
  g.recoverDeadBuildingCargo();assert.equal(g.world.resources.length,before+1,'no duplicated drop');
});
test('out of stone or without a sentry, a new tower does not attract an assault',()=>{
  const {g,tower,guard}=setup();
  tower.inventory.items.stone=0;assert.equal(g.towerDefends(tower),false);
  tower.inventory.items.stone=2;g.cancelTask(guard);assert.equal(g.towerDefends(tower),false);
});
