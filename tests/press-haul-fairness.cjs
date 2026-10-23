const {test}=require('node:test');const assert=require('node:assert/strict');const make=require('./harness.cjs');
function scene(){const e=make(),g=e.g;g.experimentalWorldSize=512;g.newGame(123456);g.raiders=[];g.raidsEnabled=false;g.animals=[];const f=e.run("new Building('farm',254,257,0,true)"),m=e.run("new Building('market',256,256,0,true)"),p=e.run("new Building('press',258,256,0,true)"),w=g.buildings.find(b=>b.type==='warehouse'&&b.owner===0),carrier=g.units[0],worker=g.units[1];g.buildings.push(f,m,p);g.ensureInventories();g.ensureMarkets();f.crop='grapes';for(const other of g.units.slice(2))other.mobilized=true;for(const u of g.units)u.fedUntil=1e6;g.cancelTask(carrier);carrier.x=f.x;carrier.y=f.y+1;carrier.state='idle';worker.x=p.x+1;worker.y=p.y;worker.task={type:'production',target:p.id,profession:'torchiatore'};worker.state='producing';worker.path=[];p.workers=[worker.id];return{...e,g,f,w,m,p,carrier}}

test('one carrier feeds the press before exhausting a forty-grape field',()=>{
 const {g,f,w,m,p}=scene();f.inventory.items.grapes=40;const jobs=[],original=g.assignHaul;g.assignHaul=function(u,source,destination,...rest){const result=original.call(this,u,source,destination,...rest);if(result===null)jobs.push(source.type+'>'+destination.type);return result};g.setPaused(false);
 for(let i=0;i<800&&!p.batch;i++)g.update(.05);
 assert.equal(p.batch?.recipeId,'grapes-wine');assert.deepEqual(jobs.slice(0,3),['farm>warehouse','warehouse>market','market>press']);assert((f.inventory.items.grapes||0)>0,'field should still hold grapes when first batch begins');assert.equal((f.inventory.items.grapes||0)+(w.inventory.items.grapes||0)+(m.inventory.items.grapes||0)+(p.inventory.items.grapes||0)+(p.batch?.inputs.grapes||0),40);
});

test('preferred oil takes the first market-to-press carrier when both fruits are ready',()=>{
 const {g,m,p,carrier}=scene();m.inventory.items.grapes=4;m.inventory.items.olives=4;p.preferredRecipeId='olives-oil';g.settlementTick();assert.equal(carrier.task?.type,'haul');assert.equal(carrier.task.source,m.id);assert.equal(carrier.task.destination,p.id);assert.equal(carrier.task.good,'olives');
});
