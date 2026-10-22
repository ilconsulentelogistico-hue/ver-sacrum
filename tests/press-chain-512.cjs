const {test}=require('node:test');const assert=require('node:assert/strict');const make=require('./harness.cjs');
for(const [input,output,recipe] of [['grapes','wine','grapes-wine'],['olives','oil','olives-oil']])test(`512-map ${input} become ${output} through carriers, staffed press and both destinations`,()=>{
 const {g,run}=make();g.experimentalWorldSize=512;g.newGame(123456);g.raiders=[];g.raidsEnabled=false;g.animals=[];
 const f=run("new Building('farm',254,257,0,true)"),m=run("new Building('market',256,256,0,true)"),p=run("new Building('press',258,256,0,true)"),w=g.buildings.find(b=>b.type==='warehouse'&&b.owner===0),carrier=g.units[0],worker=g.units[1];g.buildings.push(f,m,p);g.ensureInventories();g.ensureMarkets();f.crop=input;f.inventory.items[input]=4;p.returnPercent=50;p.preferredRecipeId=recipe;
 for(const other of g.units.slice(2))other.mobilized=true;for(const person of g.units)person.fedUntil=100000;g.cancelTask(carrier);carrier.x=f.x;carrier.y=f.y+1;carrier.state='idle';worker.x=p.x+1;worker.y=p.y;worker.task={type:'production',target:p.id,profession:'torchiatore'};worker.state='producing';worker.path=[];p.workers=[worker.id];
 assert(g.linkOpen(f,w));assert(g.linkOpen(w,m));assert(g.linkOpen(m,p));assert(g.communalStores(0).includes(w));
 const ids={f:f.id,w:w.id,m:m.id,p:p.id,carrier:carrier.id},steps={};let reloaded=false,final=null;g.setPaused(false);
 for(let i=0;i<1600;i++){
  g.update(.05);const farm=g.buildings.find(b=>b.id===ids.f),store=g.buildings.find(b=>b.id===ids.w),market=g.buildings.find(b=>b.id===ids.m),press=g.buildings.find(b=>b.id===ids.p),person=g.units.find(u=>u.id===ids.carrier);
  if(steps.warehouse===undefined&&store.inventory.items[input]>0)steps.warehouse=i;
  if(steps.market===undefined&&market.inventory.items[input]>0)steps.market=i;
  if(steps.press===undefined&&press.batch?.recipeId===recipe){steps.press=i;assert(g.save(),g.lastSaveError);assert(g.load(),g.lastSaveError);reloaded=true;g.setPaused(false);}
  if(steps.communal===undefined&&store.inventory.items[output]>0)steps.communal=i;
  if(steps.commercial===undefined&&market.inventory.items[output]>0)steps.commercial=i;
  if(steps.communal!==undefined&&steps.commercial!==undefined){final={farm,store,market,press,person};break}
 }
 assert(reloaded,JSON.stringify(steps));assert(final,JSON.stringify(steps));assert.equal(final.farm.inventory.items[input]||0,0);assert.equal(final.store.inventory.items[input]||0,0);assert.equal(final.market.inventory.items[input]||0,0);assert.equal(final.press.inventory.items[input]||0,0);assert.equal(final.store.inventory.items[output],1);assert.equal(final.market.inventory.items[output],1);assert.equal(final.press.inventory.items[output]||0,0);assert.equal(final.press.returnDue[output],0);assert.equal(final.person.inventory.amount,0);console.log(`filiera512 ${input} ${JSON.stringify(steps)}`);
});
