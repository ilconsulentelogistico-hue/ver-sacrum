const {test}=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');
function scene(){const e=make(),g=e.g;g.newGame(123456);g.raiders=[];for(const t of g.world.tiles){t.biome='grass';t.z=0}const m=e.run("new Building('market',50,50,0,true)"),p=e.run("new Building('press',53,50,0,true)"),u=g.units[0];g.buildings.push(m,p);g.ensureInventories();g.ensureMarkets();for(const other of g.units.filter(person=>person!==u)){other.task={type:'move',x:75,y:75};other.state='moving'}u.x=m.x;u.y=m.y+1;g.cancelTask(u);u.state='idle';u.inventory.amount=0;u.inventory.type=null;u.fedUntil=100000;return{...e,g,m,p,u}}
function stepUntil(g,predicate,max=400){g.setPaused(false);for(let i=0;i<max;i++){g.update(.05);if(predicate())return i+1}assert.fail('transport did not progress')}

test('market grapes travel in one bounded physical cargo to the press and survive reload',()=>{
 const {g,m,p,u,storage}=scene();m.inventory.items.grapes=30;g.settlementTick();assert.equal(m.inventory.items.grapes,30);assert.equal(p.inventory.items.grapes||0,0);assert.equal(u.task?.type,'haul');assert.equal(u.task.autoMax,8);
 stepUntil(g,()=>u.inventory.amount===8);assert.equal(m.inventory.items.grapes,22);assert.equal(p.inventory.items.grapes||0,0);
 assert(g.save(),g.lastSaveError);assert(g.load(),g.lastSaveError);const person=g.units.find(x=>x.id===u.id),market=g.buildings.find(x=>x.id===m.id),press=g.buildings.find(x=>x.id===p.id);assert.equal(person.inventory.amount,8);assert.equal(person.task.autoMax,8);
 stepUntil(g,()=>press.inventory.items.grapes===8);assert.equal(market.inventory.items.grapes,22);assert.equal(person.inventory.amount,0);assert(storage.get('terra-italica-save-v5'));
});

test('no idle person or closed link leaves input at market',()=>{
 const {g,m,p,u}=scene();m.inventory.items.olives=12;u.task={type:'move',x:48,y:48};u.state='moving';g.settlementTick();assert.equal(m.inventory.items.olives,12);assert.equal(p.inventory.items.olives||0,0);
 g.cancelTask(u);g.settlementTick();assert.equal(u.task?.autoMax,8);g.linkPolicy(m,p).enabled=false;g.updateHaul(u,.05);assert.equal(u.task,null);assert.equal(m.inventory.items.olives,12);assert.equal(g.available(m,'olives'),12);
});
