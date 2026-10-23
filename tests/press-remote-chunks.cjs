const {test}=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');

test('remote press keeps its physical batch across 512-map chunks and reload',()=>{
 const {g,run,storage}=make();g.experimentalWorldSize=512;g.newGame(123456);
 const b=run("new Building('press',399,400,0,true)"),u=g.units[0];g.buildings.push(b);g.ensureInventories();
 u.x=400.3;u.y=400;u.location={kind:'world',settlementId:null};u.task={type:'production',target:b.id,profession:'torchiatore'};u.state='producing';u.path=[];u.fedUntil=100000;b.workers=[u.id];b.inventory.items.grapes=4;b.preferredRecipeId='grapes-wine';
 assert(!g.activeSimulationChunks().has('50,50'));assert.equal(Math.floor(b.x/8),49);assert.equal(Math.floor(u.x/8),50);
 g.setPaused(false);g.update(.1);assert.equal(b.batch?.recipeId,'grapes-wine');assert.equal(b.inventory.items.grapes,0);assert.equal(b.inventory.items.wine||0,0);
 assert(g.save(),g.lastSaveError);assert(g.load(),g.lastSaveError);const restored=g.buildings.find(x=>x.id===b.id),worker=g.units.find(x=>x.id===u.id);
 assert.equal(restored.batch?.recipeId,'grapes-wine');assert.equal(restored.preferredRecipeId,'grapes-wine');assert.equal(worker.task?.type,'production');
 worker.x=400.3;worker.y=400;worker.fedUntil=100000;g.setPaused(false);for(let i=0;i<300;i++)g.update(.05);
 assert.equal(restored.batch,null);assert.equal(restored.inventory.items.wine,2);assert.equal(restored.inventory.items.grapes,0);
 assert(storage.get('terra-italica-save-v5-512'));
});
