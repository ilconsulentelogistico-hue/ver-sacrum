const {test}=require('node:test'),assert=require('node:assert/strict'),make=require('./harness.cjs');
function setup(){const e=make(),g=e.g;g.rng=e.run('new RNG(771)');g.world.resources=[];g.animals=[];g.buildings=[];g.warCamps=[];g.world.collisionCamps=[];g.units=[];for(const t of g.world.tiles){t.biome='grass';t.z=0;}e.sheep=(x,y)=>{const a=e.run(`new Animal('sheep',${x},${y})`);g.animals.push(a);return a;};e.resource=(type,x,y)=>{const r=e.run(`new ResourceNode('${type}',${x},${y},100)`);r.resourceShape=type==='stone'?'triangle':'hex';r.renewable=type!=='stone';g.world.resources.push(r);return r;};return e;}
test('sheep turn before entering trees, depleted renewable spots and minerals',()=>{
 for(const type of ['wood','food','stone']){const e=setup(),{g}=e,r=e.resource(type,30.5,30.5),a=e.sheep(29.5,30.5);if(type==='food')r.amount=0;a.vx=.28;a.vy=0;a.wander=10;
 let travelled=0;for(let i=0;i<150;i++){const before={x:a.x,y:a.y};g.updateAnimal(a,.1);travelled+=Math.hypot(a.x-before.x,a.y-before.y);assert(g.animalTerrainClear(a));}assert(travelled>.3,'animal keeps moving along obstacle');}
});
test('an already overlapping sheep is recovered with identity, health and ownership intact',()=>{
 const e=setup(),{g}=e;e.resource('wood',30.5,30.5);const a=e.sheep(30.5,30.5);a.owner=0;a.health=22;const id=a.id;g.updateAnimal(a,.1);assert(g.spawnPositionFree(a,a));assert(g.animalHasExit(a));assert.equal(a.id,id);assert.equal(a.owner,0);assert.equal(a.health,22);assert.equal(g.animals.length,1);
});
test('spawn rejects isolated pockets and chooses a free position with an exit',()=>{
 const e=setup(),{g}=e,a=e.sheep(30.5,30.5);for(const [x,y]of [[29.5,30.5],[31.5,30.5],[30.5,29.5],[30.5,31.5]])e.resource('wood',x,y);
 assert(g.animalTerrainClear(a));assert.equal(g.animalHasExit(a),false);g.normalizeActorSpawns();assert(g.spawnPositionFree(a,a));assert(g.animalHasExit(a));assert(Math.hypot(a.x-30.5,a.y-30.5)>1);
});
test('a long animal movement step cannot tunnel through a resource',()=>{
 const e=setup(),{g}=e;e.resource('stone',30.5,30.5);assert.equal(g.animalSegmentClear({x:28.5,y:30.5},{x:32.5,y:30.5}),false);
});
