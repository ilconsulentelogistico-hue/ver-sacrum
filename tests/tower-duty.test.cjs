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
  const enemy=e.run(`new Raider(${tower.x+2},${tower.y},1)`);g.raiders.push(enemy);
  return {...e,g,guard,tower,enemy};
}
test('a new tower needs a real sentry at the post; combat skill gains from actual defense',()=>{
  const {g,guard,tower,enemy}=setup(),initial=enemy.health;
  assert.equal(tower.towerNeedsGuard,true);tower.inventory.items.stone=2;
  g.updateBuilding(tower,1);assert.equal(enemy.health,initial,'unmanned tower is silent');
  assert.equal(g.assignTowerGuard(guard,tower),null);
  assert.equal(g.assignTowerGuard(g.units[1],tower), 'Mobilita prima questa persona dalla Comunità.');
  g.updateBuilding(tower,1);assert.equal(enemy.health,initial,'distant guard cannot fire');
  for(let i=0;i<250&&g.buildingDistance(guard,tower)>1.6;i++)g.updateUnit(guard,.25);
  assert(g.buildingDistance(guard,tower)<=1.6,'guard arrives at tower');
  g.updateBuilding(tower,1);
  assert(enemy.health<initial);
  assert((guard.xp.combat||0)>0);
  const damaged=enemy.health;guard.morale=20;g.updateBuilding(tower,1);assert.equal(enemy.health,damaged,'low morale stops fire');
  guard.morale=70;assert(g.save());assert(g.load());
  const loaded=g.buildings.find(b=>b.id===tower.id),person=g.units.find(u=>u.id===guard.id);
  assert.equal(loaded.towerNeedsGuard,true);assert.equal(person.guardPostId,tower.id);assert.equal(person.guardDuty,true);
  const loadedEnemy=g.raiders.find(r=>r.id===enemy.id),before=loadedEnemy.health;
  for(let i=0;i<250&&g.buildingDistance(person,loaded)>1.6;i++)g.updateUnit(person,.25);
  g.updateBuilding(loaded,1);assert(loadedEnemy.health<before,'defense resumes after reload');
  g.cancelTask(person);assert.equal(person.guardDuty,false);loaded.inventory.items.stone=1;
  const final=loadedEnemy.health;g.updateBuilding(loaded,1);assert.equal(loadedEnemy.health,final,'other order ends tower defense');
});
test('towers from older saves keep their established automatic defense',()=>{
  const {g,storage,tower,enemy}=setup();
  assert(g.save());
  const key=[...storage.keys()].find(k=>k.startsWith('terra-italica-save-v5')&&!k.includes('pending')&&!k.includes('backup'));
  const data=JSON.parse(storage.get(key));delete data.buildings.find(b=>b.id===tower.id).towerNeedsGuard;storage.set(key,JSON.stringify(data));
  assert(g.load());const oldTower=g.buildings.find(b=>b.id===tower.id),target=g.raiders.find(r=>r.id===enemy.id);
  assert.equal(oldTower.towerNeedsGuard,false);oldTower.inventory.items.stone=0;
  const before=target.health;g.updateBuilding(oldTower,1);assert(target.health<before);
});

test('a real free carrier brings local stone, reloads mid-route, and ammunition is spent by actual shots',()=>{
  const {g,run,storage,guard,tower,enemy}=setup();
  const base=g.buildings.find(b=>b.owner===0&&b.type==='base');base.inventory.items.stone=10;
  const beforeSource=base.inventory.items.stone;
  assert.equal(g.supplyTower(tower),null);
  const carrier=g.units.find(u=>u.task?.type==='haul'&&u.task.destination===tower.id);
  assert(carrier&&carrier!==guard&&!carrier.mobilized);
  assert.equal(g.supplyTower(tower),'Una persona sta già rifornendo questa torre.');
  assert(g.save());assert(g.load());
  const loaded=g.buildings.find(b=>b.id===tower.id),worker=g.units.find(u=>u.id===carrier.id),sentry=g.units.find(u=>u.id===guard.id);
  for(let i=0;i<400&&!(loaded.inventory.items.stone>0);i++)g.updateUnit(worker,.25);
  assert(loaded.inventory.items.stone>0,'carrier delivers stone after reload');
  const loadedBase=g.buildings.find(b=>b.id===base.id);
  assert(loadedBase.inventory.items.stone<beforeSource,'stone leaves the physical source');
  assert.equal(g.assignTowerGuard(sentry,loaded),null);
  for(let i=0;i<250&&g.buildingDistance(sentry,loaded)>1.6;i++)g.updateUnit(sentry,.25);
  const target=g.raiders.find(r=>r.id===enemy.id),before=target.health,ammo=loaded.inventory.items.stone;
  g.updateBuilding(loaded,1);assert(target.health<before);assert.equal(loaded.inventory.items.stone,ammo-1);
  loaded.inventory.items.stone=0;const after=target.health;g.updateBuilding(loaded,1);assert.equal(target.health,after,'no free shots');
  assert.match(g.selectionHTML(loaded),/Rifornisci con un abitante/);
});
