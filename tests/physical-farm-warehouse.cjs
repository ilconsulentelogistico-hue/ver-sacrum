const {test}=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');
function scene(){const e=make(),g=e.g;g.newGame(123456);g.raiders=[];for(const t of g.world.tiles){t.biome='grass';t.z=0}const f=e.run("new Building('farm',50,50,0,true)"),w=e.run("new Building('warehouse',53,50,0,true)"),u=g.units[0];g.buildings.push(f,w);g.ensureInventories();f.crop='grapes';for(const other of g.buildings.filter(b=>b.type==='warehouse'&&b!==w&&g.linkCompatible(f,b)))g.linkPolicy(f,other).enabled=false;for(const other of g.units.filter(person=>person!==u)){other.task={type:'move',x:75,y:75};other.state='moving'}u.x=f.x;u.y=f.y+1;g.cancelTask(u);u.state='idle';u.inventory.amount=0;u.inventory.type=null;u.fedUntil=100000;return{...e,g,f,w,u}}
function stepUntil(g,predicate,max=400){g.setPaused(false);for(let i=0;i<max;i++){g.update(.05);if(predicate())return i+1}assert.fail('transport did not progress')}

test('field output rides on an existing person and survives reload in transit',()=>{
 const {g,f,w,u,storage}=scene();f.inventory.items.grapes=4;g.settlementTick();
 assert.equal(f.inventory.items.grapes,4);assert.equal(w.inventory.items.grapes||0,0);assert.equal(u.task?.type,'haul');assert.equal(u.task.autoLink,true);
 stepUntil(g,()=>u.inventory.amount===4);assert.equal(f.inventory.items.grapes,0);assert.equal(w.inventory.items.grapes||0,0);
 assert(g.save(),g.lastSaveError);assert(g.load(),g.lastSaveError);const person=g.units.find(x=>x.id===u.id),farm=g.buildings.find(x=>x.id===f.id),store=g.buildings.find(x=>x.id===w.id);
 assert.equal(person.inventory.amount,4);assert.equal(person.task.autoLink,true);assert.equal(farm.inventory.items.grapes,0);
 stepUntil(g,()=>store.inventory.items.grapes===4);assert.equal(person.inventory.amount,0);assert.equal(farm.inventory.items.grapes,0);assert(storage.get('terra-italica-save-v5'));
});

test('without a free person the crop waits; keep threshold is respected',()=>{
 const {g,f,w,u}=scene();f.inventory.items.grapes=6;g.linkGoodPolicy(f,w,'grapes').keep=2;u.task={type:'move',x:48,y:48};u.state='moving';
 g.settlementTick();assert.equal(f.inventory.items.grapes,6);assert.equal(w.inventory.items.grapes||0,0);
 g.cancelTask(u);g.settlementTick();assert.equal(u.task.autoKeep,2);assert.equal(u.task.amount,4);
 stepUntil(g,()=>w.inventory.items.grapes===4);assert.equal(f.inventory.items.grapes,2);
 g.settlementTick();assert.equal(u.task,null);assert.equal(f.inventory.items.grapes,2);
});

test('closing link before pickup releases reservation without transfer',()=>{
 const {g,f,w,u}=scene();f.inventory.items.grapes=4;g.settlementTick();assert.equal(u.task?.type,'haul');assert.equal(g.available(f,'grapes'),0);
 g.linkPolicy(f,w).enabled=false;g.updateHaul(u,.05);assert.equal(u.task,null);assert.equal(g.available(f,'grapes'),4);assert.equal(w.inventory.items.grapes||0,0);
});
