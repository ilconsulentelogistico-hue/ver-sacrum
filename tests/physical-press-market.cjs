const {test}=require('node:test');const assert=require('node:assert/strict');const make=require('./harness.cjs');
function scene(){const e=make(),g=e.g;g.newGame(123456);g.raiders=[];for(const t of g.world.tiles){t.biome='grass';t.z=0}const p=e.run("new Building('press',50,50,0,true)"),m=e.run("new Building('market',53,50,0,true)"),u=g.units[0];g.buildings.push(p,m);g.ensureInventories();g.ensureMarkets();for(const w of g.buildings.filter(b=>b.type==='warehouse'&&g.linkCompatible(m,b)))g.linkPolicy(m,w).enabled=false;for(const other of g.units.filter(person=>person!==u)){other.task={type:'move',x:75,y:75};other.state='moving'}u.x=p.x;u.y=p.y+1;g.cancelTask(u);u.state='idle';u.inventory.amount=0;u.inventory.type=null;u.fedUntil=100000;return{...e,g,p,m,u}}
function stepUntil(g,predicate,max=400){g.setPaused(false);for(let i=0;i<max;i++){g.update(.05);if(predicate())return i+1}assert.fail('transport did not progress')}

test('surplus wine travels physically while communal quota stays reserved, through reload',()=>{
 const {g,p,m,u}=scene();p.inventory.items.wine=5;p.returnDue={wine:3};g.settlementTick();assert.equal(p.inventory.items.wine,5);assert.equal(p.returnDue.wine,3);assert.equal(m.inventory.items.wine||0,0);assert.equal(u.task.autoKeep,3);assert.equal(u.task.amount,2);
 stepUntil(g,()=>u.inventory.amount===2);assert.equal(p.inventory.items.wine,3);assert.equal(m.inventory.items.wine||0,0);assert(g.save(),g.lastSaveError);assert(g.load(),g.lastSaveError);const person=g.units.find(x=>x.id===u.id),press=g.buildings.find(x=>x.id===p.id),market=g.buildings.find(x=>x.id===m.id);assert.equal(person.inventory.amount,2);stepUntil(g,()=>market.inventory.items.wine===2);assert.equal(g.buildings.reduce((n,b)=>n+(b.inventory?.items.wine||0),0)+g.units.reduce((n,u)=>n+(u.inventory.type==='wine'?u.inventory.amount:0),0),5);assert.equal(market.inventory.items.wine,2);
});

test('oil waits without a free carrier and link closure releases reservation',()=>{
 const {g,p,m,u}=scene();p.inventory.items.oil=4;u.task={type:'move',x:48,y:48};u.state='moving';g.settlementTick();assert.equal(p.inventory.items.oil,4);assert.equal(m.inventory.items.oil||0,0);
 g.cancelTask(u);g.settlementTick();assert.equal(u.task?.good,'oil');g.linkPolicy(p,m).enabled=false;g.updateHaul(u,.05);assert.equal(u.task,null);assert.equal(g.available(p,'oil'),4);
});
