const {test}=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');

test('reload preserves overlapping haulers and their valid route',()=>{
 const {g,run}=make();g.experimentalWorldSize=512;g.newGame(123456);
 g.world.ensureResourceChunksForBounds(92,380,128,388);
 assert.equal(g.villagePlacementError('warehouse',96,384),null);
 assert.equal(g.villagePlacementError('warehouse',124,384),null);
 const source=run("new Building('warehouse',96,384,0,true)"),destination=run("new Building('warehouse',124,384,0,true)");
 g.buildings.push(source,destination);g.ensureInventories();source.inventory.items.wood=20;
 const ids=[];
 for(let i=0;i<2;i++){
  const u=run(`new Unit('Corriere ${i}',100.5,384.5,game.rng)`);
  u.inventory.type='wood';u.inventory.amount=5;
  u.task={type:'haul',source:source.id,destination:destination.id,good:'wood',repeat:false,phase:'destination',amount:5,retry:0};
  u.state='hauling';u.path=g.pathToBuilding(u,destination);
  assert(u.path?.length>0);g.units.push(u);ids.push(u.id);
 }
 const before=ids.map(id=>{const u=g.units.find(x=>x.id===id);return{x:u.x,y:u.y,path:u.path.length,cargo:u.inventory.amount}});
 assert(g.save(),g.lastSaveError);assert(g.load(),g.lastSaveError);
 const after=ids.map(id=>{const u=g.units.find(x=>x.id===id);return{x:u.x,y:u.y,path:u.path.length,cargo:u.inventory.amount}});
 assert.deepEqual(after,before);
});
