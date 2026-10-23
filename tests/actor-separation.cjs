const assert=require('node:assert/strict'),make=require('./harness.cjs');
function setup(){const e=make(),g=e.g;g.newGame(223);g.world.resources=[];g.animals=[];g.raiders=[];g.warCamps=[];g.world.collisionCamps=[];for(const t of g.world.tiles){t.biome='grass';t.z=0;}return e;}
let n=0;function test(s,f){f();n++;console.log('PASS',s)}
test('travelling villagers can cross; resting villagers separate and animals avoid people',()=>{const e=setup(),{g}=e;g.units=[];const a=e.run("new Unit('A',30.5,30.5,game.rng)"),b=e.run("new Unit('B',31.5,30.5,game.rng)"),sheep=e.run("new Animal('sheep',32.5,30.5,0)");g.units.push(a,b);g.animals.push(sheep);a.path=[{x:31.5,y:30.5}];g.followPath(a,.5,1.6);assert(Math.hypot(a.x-b.x,a.y-b.y)<.78);assert(g.settleUnitPosition(a));assert(Math.hypot(a.x-b.x,a.y-b.y)>=.78);sheep.path=[{x:31.5,y:30.5}];g.followPath(sheep,.5,1.6);assert.equal(sheep.x,32.5);});
test('spawn normalization separates every living actor',()=>{const e=setup(),{g}=e;g.units=[];const a=e.run("new Unit('A',30.5,30.5,game.rng)"),b=e.run("new Unit('B',30.5,30.5,game.rng)"),s=e.run("new Animal('sheep',30.5,30.5,0)");g.units.push(a,b);g.animals.push(s);g.normalizeActorSpawns();assert(Math.hypot(a.x-b.x,a.y-b.y)>=.78);assert(Math.hypot(a.x-s.x,a.y-s.y)>=.78);assert(Math.hypot(b.x-s.x,b.y-s.y)>=.78);});
test('farm worker repositions inside field and remains assigned',()=>{const e=setup(),{g}=e;g.units=[];const farm=e.run("new Building('farm',40,40,0,true)");g.buildings.push(farm);g.ensureInventories();const u=e.run("new Unit('A',40.5,40.5,game.rng)");g.units.push(u);g.assignFarm(u,farm);u.state='farming';u.task.phase='onFarm';u.farmWanderTimer=0;const before={x:u.x,y:u.y};g.updateUnit(u,.1);for(let i=0;i<100&&u.state==='moving';i++)g.updateUnit(u,.1);const r=e.sandbox.VER_SACRUM_VILLAGE.bounds(farm);assert(u.x>=r.left&&u.x<r.right&&u.y>=r.top&&u.y<r.bottom);assert.equal(u.task.target,farm.id);assert(Math.hypot(u.x-before.x,u.y-before.y)>0||u.farmWanderTimer>0);});
test("an offset berry keeps its worker spot inside the actual harvest radius",()=>{const e=setup(),{g}=e;g.units=[];const u=e.run("new Unit('A',20.5,20.5,game.rng)"),r=e.run("new ResourceNode('food',21.72,21.5,5)");g.units.push(u);g.world.resources.push(r);g.world.invalidateResourceIndex();const spot=g.gatherWorkSpot(u,r);assert(Math.hypot(spot.x-r.x,spot.y-r.y)<=1.55);g.assignGather(u,r);for(let i=0;i<100&&r.amount===5;i++)g.updateUnit(u,.1);assert(r.amount<5);});
console.log(`${n} actor separation checks passed.`);

test('farm wander skips isolated crop tiles and backs off after a failed choice',()=>{
 const e=setup(),{g}=e;g.units=[];
 const farm=e.run("new Building('farm',40,40,0,true)");g.buildings.push(farm);
 const u=e.run("new Unit('A',40.5,40.5,game.rng)");g.units.push(u);
 g.assignFarm(u,farm);u.state='farming';u.task.phase='onFarm';
 const r=e.sandbox.VER_SACRUM_VILLAGE.bounds(farm);
 for(let y=r.top;y<r.bottom;y++)for(let x=r.left;x<r.right;x++){
  if((x===40&&y===40)||(x===r.right-1&&y===r.bottom-1))continue;
  g.world.tile(x,y).biome='sea';
 }
 g.world.tile(r.right,r.bottom-1).biome='sea';g.world.tile(r.right-1,r.bottom).biome='sea';
 const original=g.findPath,next=g.rng.next;g.findPath=()=>{throw Error('world pathfinder should not run for a field stroll')};g.rng.next=()=>.99;
 for(let i=0;i<20;i++){
  u.farmWanderTimer=0;assert.equal(g.farmWander(u,farm),true);
  assert(u.farmWanderTimer>=2);
  assert.notDeepEqual(u.task.wanderTarget,{x:r.right-.5,y:r.bottom-.5});
 }
 g.world.tile(40,40).biome='sea';g.world.tile(r.right-1,r.bottom-1).biome='sea';u.farmWanderTimer=0;
 assert.equal(g.farmWander(u,farm),false);assert(u.farmWanderTimer>=2);
 g.findPath=original;g.rng.next=next;
});
test("a gatherer chooses a free work spot beside an occupied resource",()=>{const e=setup(),{g}=e;g.units=[];const u=e.run("new Unit('A',13.5,17.5,game.rng)"),other=e.run("new Unit('B',12.5,16.5,game.rng)"),r=e.run("new ResourceNode('food',11.72,17.5,5)");g.units.push(u,other);g.world.resources.push(r);g.world.invalidateResourceIndex();const spot=g.gatherWorkSpot(u,r);assert(Math.hypot(spot.x-other.x,spot.y-other.y)>=.78);assert(Math.hypot(spot.x-r.x,spot.y-r.y)<=1.55);});
