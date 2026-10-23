const {test}=require('node:test');const assert=require('node:assert/strict');const make=require('./harness.cjs');
function scene(){const e=make(),g=e.g;g.newGame(123456);g.raiders=[];for(const t of g.world.tiles){t.biome='grass';t.z=0}const w=e.run("new Building('warehouse',50,50,0,true)"),m=e.run("new Building('market',53,50,0,true)"),u=g.units[0];g.buildings.push(w,m);g.ensureInventories();g.ensureMarkets();for(const other of g.units.filter(person=>person!==u)){other.task={type:'move',x:75,y:75};other.state='moving'}u.x=w.x;u.y=w.y+1;g.cancelTask(u);u.state='idle';u.inventory.amount=0;u.inventory.type=null;u.fedUntil=100000;return{...e,g,w,m,u}}
function stepUntil(g,predicate,max=400){g.setPaused(false);for(let i=0;i<max;i++){g.update(.05);if(predicate())return i+1}assert.fail('transport did not progress')}

test('grapes travel from warehouse to market with capped cargo and mid-route reload',()=>{
 const {g,w,m,u,storage}=scene();w.inventory.items.grapes=30;g.linkGoodPolicy(w,m,'grapes').keep=4;g.settlementTick();const load=Math.min(12,u.inventory.cap);assert.equal(w.inventory.items.grapes,30);assert.equal(m.inventory.items.grapes||0,0);assert.equal(u.task.autoLink,true);assert.equal(u.task.autoKeep,4);assert.equal(u.task.amount,load);
 stepUntil(g,()=>u.inventory.amount===load);assert.equal(w.inventory.items.grapes,30-load);assert.equal(m.inventory.items.grapes||0,0);assert(g.save(),g.lastSaveError);assert(g.load(),g.lastSaveError);const person=g.units.find(x=>x.id===u.id),source=g.buildings.find(x=>x.id===w.id),market=g.buildings.find(x=>x.id===m.id);assert.equal(person.inventory.amount,load);stepUntil(g,()=>market.inventory.items.grapes===load);assert.equal(source.inventory.items.grapes,30-load);assert.equal(person.inventory.amount,0);assert(storage.get('terra-italica-save-v5'));
});

test('olives wait without carrier and link closure cancels before pickup',()=>{
 const {g,w,m,u}=scene();w.inventory.items.olives=6;g.linkGoodPolicy(w,m,'olives').keep=2;u.task={type:'move',x:48,y:48};u.state='moving';g.settlementTick();assert.equal(w.inventory.items.olives,6);assert.equal(m.inventory.items.olives||0,0);
 g.cancelTask(u);g.settlementTick();assert.equal(u.task.autoKeep,2);assert.equal(u.task.amount,4);g.linkPolicy(w,m).enabled=false;g.updateHaul(u,.05);assert.equal(u.task,null);assert.equal(g.available(w,'olives'),6);
});
