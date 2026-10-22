const {test}=require('node:test'),assert=require('node:assert/strict'),make=require('./harness.cjs');
function setup(){const e=make(),g=e.g;g.world.resources=[];g.animals=[];g.raiders=[];for(const t of g.world.tiles){t.biome='grass';t.z=0;}g.buildings=[];g.units.forEach((u,i)=>{u.x=20.5+i;u.y=20.5;u.task=null;u.path=[];u.state='idle';});e.add=(type,x,y,built=true)=>{const b=e.run(`new Building('${type}',${x},${y},0,${built})`);g.buildings.push(b);g.ensureInventories();return b;};return e;}
const inside=(b,p,bounds)=>{const r=bounds(b);return p.x>=r.left&&p.x<r.right&&p.y>=r.top&&p.y<r.bottom;};
test('new worlds and additional animal spawns never overlap resources, buildings or other visible actors',()=>{
 for(const seed of [123,321,1234]){const {g}=make([],{neutrals:true});g.newGame(seed);
  for(const b of g.buildings)assert.equal(g.villagePlacementError(b.type,Math.floor(b.x),Math.floor(b.y),b),null);
  g.spawnAnimals(12);const all=[...g.units.filter(u=>u.location.kind==='world'),...g.animals,...g.raiders];for(const a of all)assert(g.spawnPositionFree(a,a,all),`${seed}: occupied spawn ${a.id}`);
 }
});
test('all 16 village cells and unfinished sites block paths; routes go around them',()=>{
 const e=setup(),{g}=e,b=e.add('house',30,30,false),r=e.sandbox.VER_SACRUM_VILLAGE.bounds(b);
 for(let y=r.top;y<r.bottom;y++)for(let x=r.left;x<r.right;x++){assert.equal(g.world.walkable(x,y,1,null,g.buildings),false);assert.equal(g.findPath(25.5,30.5,x,y).length,0);}
 const path=g.findPath(25.5,30.5,35,30);assert(path.length);assert(path.every(p=>!inside(b,p,e.sandbox.VER_SACRUM_VILLAGE.bounds)));
});
test('builders use separate exterior positions and complete a village without entering its footprint',()=>{
 const e=setup(),{g}=e,b=e.add('house',30,30,false);b.inventory.items={wood:24,stone:10};b.requiredMaterials={wood:24,stone:10};const builders=g.units.slice(0,3);
 for(const u of builders)assert(g.assignBuild(u,b));assert.equal(new Set(builders.map(u=>`${u.task.workSpot.x},${u.task.workSpot.y}`)).size,3);
 for(let i=0;i<600&&!b.built;i++)for(const u of builders){g.updateUnit(u,.1);assert(!inside(b,u,e.sandbox.VER_SACRUM_VILLAGE.bounds));}
 assert(b.built);assert.equal(b.inventory.items.wood,0);
});
test('blocked work sites do not progress remotely and broken entrance paths cannot teleport residents',()=>{
 const e=setup(),{g}=e,b=e.add('warehouse',30,30,false);b.inventory.items={wood:18,stone:8};b.requiredMaterials={wood:18,stone:8};
 for(const [x,y]of [[29,30],[31,30],[30,29],[30,31]])e.add('palisade',x,y);const u=g.units[0];assert.equal(g.assignBuild(u,b),false);u.task={type:'build',target:b.id};u.state='building';const progress=b.progress;g.buildTick(u,10);assert.equal(b.progress,progress);
 const h=e.add('house',50,50);u.task={type:'enter',target:h.id};u.path=[];g.findPath=()=>[];g.onUnitArrive(u);assert.equal(u.location.kind,'world');assert.equal(h.residents.length,0);
});
test('placement rejects resources and visible units/animals without charging materials',()=>{
 const e=setup(),{g}=e;const u=g.units[0];assert.match(g.villagePlacementError('house',21,21),/occupata/i);
 const r=e.run("new ResourceNode('wood',50.5,50.5,100)");g.world.resources.push(r);assert.match(g.villagePlacementError('warehouse',50,50),/risorse/);
 const a=e.run("new Animal('sheep',60.5,60.5)");g.animals.push(a);assert.match(g.villagePlacementError('warehouse',60,60),/animali/);
 const count=g.buildings.length;g.placeBuild('warehouse',Math.floor(u.x),Math.floor(u.y));assert.equal(g.buildings.length,count);
});
test('stale long waypoints cannot tunnel through buildings',()=>{
 const e=setup(),{g}=e;e.add('warehouse',30,30);const u=g.units[0];u.x=28.5;u.y=30.5;u.path=[{x:32.5,y:30.5}];g.followPath(u,4,2);assert.equal(u.x,28.5);assert.equal(u.path.length,0);
});
test('village delivery and resident exit work from perimeter, never through center',()=>{
 const e=setup(),{g}=e,h=e.add('house',30,30),u=g.units[0];const source=e.add('warehouse',25,30);source.inventory.items.food=3;u.x=24.5;u.y=30.5;assert.equal(g.assignHaul(u,source,h,'food',false),null);for(let i=0;i<200&&u.task;i++)g.updateHaul(u,.1);assert.equal(u.inventory.amount,0);assert.equal(h.inventory.items.food,3);
 g.assignEnter(u,h);g.updateUnit(u,.1);assert.equal(u.location.kind,'resident');assert(g.releaseResident(u.id,h));assert(g.spawnPositionFree(u,u));
});
test('legacy overlapping saves relocate entities without losing IDs, cargo or residents',()=>{
 const {g}=make();const [u,v]=g.units,b=g.buildings.find(b=>b.type==='base');u.x=v.x=b.x;u.y=v.y=b.y;u.inventory={type:'wood',amount:3,cap:15};const ids=g.units.map(u=>u.id);assert(g.save());assert(g.load());assert.equal(JSON.stringify(g.units.map(u=>u.id)),JSON.stringify(ids));assert.equal(g.units[0].inventory.amount,3);for(const p of g.units)assert(g.spawnPositionFree(p,p));const positions=g.units.map(u=>[u.x,u.y]);assert(g.save());assert(g.load());assert.equal(JSON.stringify(g.units.map(u=>[u.x,u.y])),JSON.stringify(positions));
});

test('overlapping resource families are separated without deleting or refilling nodes',()=>{
 const e=setup(),{g}=e;const r=e.run("new ResourceNode('wood',30.5,30.5,17)"),ore=e.run("new ResourceNode('iron',30.5,30.5,23)");r.resourceShape='hex';r.renewable=true;ore.resourceShape='triangle';g.world.resources.push(r,ore);g.normalizeResourceSpawns();assert(Math.hypot(r.x-ore.x,r.y-ore.y)>1);assert.equal(g.world.resources.length,2);assert.equal(r.amount,17);assert.equal(ore.amount,23);
});
test('a unit entering a held construction preview invalidates placement on release',()=>{
 const e=make(),{g}=e;g.world.resources=[];g.animals=[];for(const t of g.world.tiles){t.biome='grass';t.z=0;}g.screenToWorld=(x,y)=>({x:x*30,y:y*30});g.buildMode='warehouse';const event={pointerId:1,clientX:60,clientY:60,preventDefault(){}};g.pointerDown(event);assert(g.buildPreview.valid);const stock=JSON.stringify(g.communalStock()),count=g.buildings.length;g.units[1].x=60.5;g.units[1].y=60.5;g.pointerUp(event);assert.equal(g.buildings.length,count);assert.equal(JSON.stringify(g.communalStock()),stock);
});
