const {test}=require('node:test');const assert=require('node:assert/strict');const make=require('./harness.cjs');
function scene(){const e=make(),g=e.g;g.newGame(123456);g.raiders=[];for(const t of g.world.tiles){t.biome='grass';t.z=0}const p=e.run("new Building('press',50,50,0,true)"),m=e.run("new Building('market',51,50,0,true)"),w=g.buildings.find(b=>b.type==='warehouse'&&b.owner===0),u=g.units[0];g.buildings.push(p,m);g.ensureInventories();g.ensureMarkets();for(const other of g.units.filter(person=>person!==u)){other.task={type:'move',x:75,y:75};other.state='moving'}u.x=p.x;u.y=p.y+1;g.cancelTask(u);u.state='idle';u.inventory.amount=0;u.inventory.type=null;u.fedUntil=100000;assert(g.linkOpen(p,m));assert(g.linkOpen(m,w));assert(g.communalStores(0).includes(w));return{...e,g,p,m,w,u}}
function stepUntil(g,predicate,max=600){g.setPaused(false);for(let i=0;i<max;i++){g.update(.05);if(predicate())return i+1}assert.fail('transport did not progress')}

test('communal wine is due until physical delivery, including mid-route reload',()=>{
 const {g,p,m,w,u}=scene();const before=w.inventory.items.wine||0;p.inventory.items.wine=3;p.returnDue={wine:3};g.settlementTick();assert.equal(p.inventory.items.wine,3);assert.equal(w.inventory.items.wine||0,before);assert.equal(p.returnDue.wine,3);assert.equal(u.task.autoDue,true);assert.equal(u.task.autoVia,m.id);assert.equal(u.task.amount,3);
 stepUntil(g,()=>u.inventory.amount===3);assert.equal(p.inventory.items.wine,0);assert.equal(p.returnDue.wine,3);assert.equal(w.inventory.items.wine||0,before);
 assert(g.save(),g.lastSaveError);assert(g.load(),g.lastSaveError);const person=g.units.find(x=>x.id===u.id),press=g.buildings.find(x=>x.id===p.id),store=g.buildings.find(x=>x.id===w.id);assert.equal(person.inventory.amount,3);assert.equal(press.returnDue.wine,3);
 stepUntil(g,()=>store.inventory.items.wine===before+3);assert.equal(press.returnDue.wine,0);assert.equal(person.inventory.amount,0);assert.equal(press.inventory.items.wine,0);
});

test('closed intermediate link cancels reservation before pickup, quota remains',()=>{
 const {g,p,m,w,u}=scene();p.inventory.items.oil=2;p.returnDue={oil:2};g.settlementTick();assert.equal(u.task?.autoDue,true);g.linkPolicy(m,w).enabled=false;g.updateHaul(u,.05);assert.equal(u.task,null);assert.equal(p.returnDue.oil,2);assert.equal(p.inventory.items.oil,2);assert.equal(g.available(p,'oil'),2);
});
