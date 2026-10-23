const {test}=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');
function scene(){const e=make(),g=e.g;g.newGame(123456);g.feedPeople();const b=e.run("new Building('press',40,40,0,true)"),u=g.units[0];g.buildings.push(b);g.ensureInventories();u.x=b.x+1;u.y=b.y;assert.equal(g.assignProduction(u,b),null);return {...e,g,b,u}}

test('chosen olive recipe goes first and does not interrupt an existing batch',()=>{
 const {g,b}=scene();Object.assign(b.inventory.items,{grapes:8,olives:8});
 g.updateBuilding(b,.1);assert.equal(b.batch.recipeId,'grapes-wine');
 b.preferredRecipeId='olives-oil';const remaining=b.batch.remaining;g.updateBuilding(b,1);assert.equal(b.batch.recipeId,'grapes-wine');assert(b.batch.remaining<remaining);
 g.updateBuilding(b,20);assert.equal(b.inventory.items.wine,2);g.updateBuilding(b,.1);assert.equal(b.batch.recipeId,'olives-oil');
 assert.equal(b.inventory.items.olives,4);assert.equal(b.inventory.items.grapes,4);
});

test('preferred recipe falls back to available fruit, then resumes preference',()=>{
 const {g,b}=scene();b.preferredRecipeId='olives-oil';b.inventory.items.grapes=4;
 g.updateBuilding(b,.1);assert.equal(b.batch.recipeId,'grapes-wine');
 b.inventory.items.olives=4;g.updateBuilding(b,20);g.updateBuilding(b,.1);assert.equal(b.batch.recipeId,'olives-oil');
});

test('preference survives save and old saves stay automatic',()=>{
 const {g,b,storage}=scene();b.preferredRecipeId='olives-oil';assert(g.save(),g.lastSaveError);assert(g.load(),g.lastSaveError);const loaded=g.buildings.find(x=>x.id===b.id);assert.equal(loaded.preferredRecipeId,'olives-oil');
 const d=JSON.parse(storage.get('terra-italica-save-v5'));delete d.buildings.find(x=>x.id===b.id).preferredRecipeId;storage.set('terra-italica-save-v5',JSON.stringify(d));assert(g.load(),g.lastSaveError);assert.equal(g.buildings.find(x=>x.id===b.id).preferredRecipeId,undefined);
});

test('invalid recipe preference is rejected by save validation',()=>{
 const {g,b,storage}=scene();assert(g.save(),g.lastSaveError);const d=JSON.parse(storage.get('terra-italica-save-v5'));d.buildings.find(x=>x.id===b.id).preferredRecipeId='free-gold';storage.set('terra-italica-save-v5',JSON.stringify(d));assert.equal(g.load(),false);
});
