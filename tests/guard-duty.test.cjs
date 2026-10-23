const {test}=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');

function setup(){
  const {g,run}=make();g.newGame(321);g.nextRaidDay=1e9;
  const guard=g.units[0],other=g.units[1],base=g.buildings.find(b=>b.owner===0&&b.type==='base');
  assert(g.mobilizePerson(guard.id));
  return {g,run,guard,other,base};
}
function spot(g,base,guard){
  for(let r=3;r<=7;r++)for(let dx=-r;dx<=r;dx++)for(const dy of [-r,r]){
    const x=Math.floor(base.x)+dx,y=Math.floor(base.y)+dy;
    if(g.world.walkable(x,y,1,null,g.buildings)&&g.findPath(guard.x,guard.y,x,y,1).length)return {x:x+.5,y:y+.5};
  }
  throw Error('no reachable guard threat location');
}
test('a mobilized real guard defends the post and returns after the threat',()=>{
  const {g,run,guard,other,base}=setup();
  const place=spot(g,base,guard);
  assert.equal(g.toggleGuardDuty(guard),null);
  const enemy=run(`new Raider(${place.x},${place.y},1)`);
  g.raiders.push(enemy);const first=enemy.health;
  for(let i=0;i<220&&enemy.health===first;i++)g.updateUnit(guard,.25);
  assert(enemy.health<first,'guard attacks the approaching raider');
  assert(guard.xp.combat>0);
  assert.equal(guard.guardDuty,true);
  assert.equal(other.task,null,'civilian work remains untouched');
  enemy.health=0;
  for(let i=0;i<220&&(guard.task||g.buildingDistance(guard,base)>1.6);i++)g.updateUnit(guard,.25);
  assert.equal(guard.guardDuty,true);
  assert.equal(guard.task,null);
  assert(g.buildingDistance(guard,base)<=1.6);
  assert(g.save());assert(g.load());
  const loaded=g.units.find(u=>u.id===guard.id);
  assert.equal(loaded.guardDuty,true);
  assert.equal(loaded.guardPostId,base.id);
  assert.equal(loaded.mobilized,true);
});
test('a guard is an explicit mobilized duty; other orders and demobilization stop it',()=>{
  const {g,guard,other}=setup();
  assert.match(g.toggleGuardDuty(other),/Mobilita/);
  assert.equal(g.toggleGuardDuty(guard),null);
  g.assignMove(guard,Math.floor(guard.x)+1,Math.floor(guard.y)+1);
  assert.equal(guard.guardDuty,false);
  assert.equal(g.toggleGuardDuty(guard),null);
  assert(g.demobilizePerson(guard.id));
  assert.equal(guard.guardDuty,false);
  assert.equal(guard.mobilized,false);
});
test('a guard with low health or morale refuses combat without losing identity',()=>{
  const {g,run,guard,base}=setup();
  const place=spot(g,base,guard);
  assert.equal(g.toggleGuardDuty(guard),null);
  const enemy=run(`new Raider(${place.x},${place.y},1)`);
  g.raiders.push(enemy);
  guard.health=35;
  g.updateUnit(guard,.8);
  assert.notEqual(guard.task?.type,'attack');
  assert.equal(guard.guardDuty,true);
  assert.equal(enemy.health,enemy.maxHealth);
  guard.health=60;guard.morale=20;
  g.updateUnit(guard,.8);
  assert.notEqual(guard.task?.type,'attack');
  assert.equal(enemy.health,enemy.maxHealth);
  assert.equal(guard.id,g.units[0].id);
});

test('save and load during guard combat keep the same defender and target',()=>{
  const {g,run,guard,base}=setup();
  g.raidsEnabled=true;
  const place=spot(g,base,guard);
  assert.equal(g.toggleGuardDuty(guard),null);
  const enemy=run(`new Raider(${place.x},${place.y},1)`);
  g.raiders.push(enemy);
  g.updateUnit(guard,.8);
  assert.equal(guard.task?.type,'attack');
  const guardId=guard.id,enemyId=enemy.id;
  assert(g.save());assert(g.load());
  const restored=g.units.find(u=>u.id===guardId),target=g.raiders.find(r=>r.id===enemyId);
  assert.equal(restored.guardDuty,true);
  assert.equal(restored.task.target,enemyId);
  const before=target.health;
  for(let i=0;i<180&&target.health===before;i++)g.updateUnit(restored,.25);
  assert(target.health<before);
  assert.equal(restored.guardDuty,true);
});

test('an unreachable nearby raider does not trigger pathfinding every frame',()=>{
  const {g,run,guard,base}=setup();
  const place=spot(g,base,guard);
  assert.equal(g.toggleGuardDuty(guard),null);
  const enemy=run(`new Raider(${place.x},${place.y},1)`);
  g.raiders.push(enemy);
  let attempts=0;
  g.findPath=()=>{attempts++;return [];};
  for(let i=0;i<48;i++)g.updateUnit(guard,.25);
  assert.equal(guard.guardDuty,true);
  assert.equal(guard.task?.type,'attack');
  assert(attempts<=7,`too many path attempts: ${attempts}`);
  assert.equal(enemy.health,enemy.maxHealth);
});
