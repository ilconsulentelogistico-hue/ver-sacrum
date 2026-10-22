const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const make=require('./harness.cjs');
function scene(){const e=make(),g=e.g;g.newGame(123456);g.feedPeople();const b=e.run("new Building('press',40,40,0,true)"),u=g.units[0];g.buildings.push(b);g.ensureInventories();u.x=b.x+1;u.y=b.y;assert.equal(g.assignProduction(u,b),null);return{...e,g,b,u}}

test('one staffed press converts actual grapes and olives in separate batches',()=>{
 const {g,b,u,sandbox}=scene();
 assert.equal(sandbox.TERRA_GOODS.wine.label,'vino');assert.equal(sandbox.TERRA_GOODS.oil.label,'olio');
 assert.equal(g.resourceName('grapes'),'uva');assert.equal(g.resourceName('olives'),'olive');
 assert.equal(u.task.profession,'torchiatore');assert.equal(u.skills.pressing,1);
 Object.assign(b.inventory.items,{grapes:4,olives:4});
 g.updateBuilding(b,.1);assert.equal(b.batch.recipeId,'grapes-wine');
 assert.equal(b.inventory.items.grapes,0);assert.equal(b.inventory.items.wine||0,0);assert.equal(u.xp.pressing||0,0);
 g.updateBuilding(b,20);assert.equal(b.batch,null);assert.equal(b.inventory.items.wine,2);assert.equal(u.xp.pressing,1);
 g.updateBuilding(b,.1);assert.equal(b.batch.recipeId,'olives-oil');assert.equal(b.inventory.items.olives,0);
 g.updateBuilding(b,20);assert.equal(b.inventory.items.oil,2);assert.equal(u.xp.pressing,2);
 assert.equal(g.marketPrice({owner:0,inventory:{items:{}},demand:{wine:1,oil:1}},'oil')>g.marketPrice({owner:0,inventory:{items:{}},demand:{wine:1,oil:1}},'wine'),true);
});

test('missing fruit and absent worker cannot create output',()=>{
 const {g,b,u}=scene();g.updateBuilding(b,20);assert.equal(b.batch,null);
 b.inventory.items.grapes=4;g.updateBuilding(b,.1);assert(b.batch);g.cancelTask(u);const remaining=b.batch.remaining;
 g.updateBuilding(b,30);assert.equal(b.batch.remaining,remaining);assert.equal(b.inventory.items.wine||0,0);assert.equal(u.xp.pressing||0,0);
});

test('batch and personal pressing skill survive reload and job changes',()=>{
 const {g,b,u,storage}=scene();const id=u.id;u.gain('pressing',23);b.inventory.items.olives=4;
 g.updateBuilding(b,.1);assert.equal(b.batch.recipeId,'olives-oil');assert(g.save(),g.lastSaveError);
 assert(g.load(),g.lastSaveError);const press=g.buildings.find(x=>x.id===b.id),worker=g.units.find(x=>x.id===id);
 assert.equal(worker.skills.pressing,2);assert.equal(worker.xp.pressing,3);assert.equal(press.batch.recipeId,'olives-oil');
 worker.x=press.x+1;worker.y=press.y;g.updateBuilding(press,20);assert.equal(press.inventory.items.oil,2);
 g.cancelTask(worker);assert.equal(worker.skills.pressing,2);
 assert(storage.get('terra-italica-save-v5'));
});

test('old saves gain novice pressing and neutral market demand without inventing products',()=>{
 const {g,run,storage,u}=scene(),m=run("new Building('market',44,40,1,true)");g.buildings.push(m);g.ensureMarkets();assert(g.save(),g.lastSaveError);
 const data=JSON.parse(storage.get('terra-italica-save-v5'));for(const person of data.units)delete person.skills.pressing;for(const market of data.buildings.filter(x=>x.type==='market')){delete market.demand.wine;delete market.demand.oil}
 storage.set('terra-italica-save-v5',JSON.stringify(data));assert(g.load(),g.lastSaveError);
 assert.equal(g.units.find(x=>x.id===u.id).skills.pressing,1);
 const market=g.buildings.find(x=>x.id===m.id);assert.equal(market.demand.wine,1);assert.equal(market.demand.oil,1);
 assert.equal(market.inventory.items.wine||0,0);assert.equal(market.inventory.items.oil||0,0);
 assert.equal(g.constructionCheck('press',g.units.find(x=>x.id===u.id)).ok,true);
});

test('press asset is a small transparent RGBA pixel image',()=>{
 const file=path.join(__dirname,'../assets/p16/buildings/building_press_p16.png'),png=fs.readFileSync(file);
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),64);assert.equal(png.readUInt32BE(20),64);assert.equal(png[25],6);assert(png.length<10000);
});
