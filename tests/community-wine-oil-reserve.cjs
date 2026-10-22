const {test}=require('node:test');const assert=require('node:assert/strict');const make=require('./harness.cjs');
function scene(){const e=make(),g=e.g;g.newGame(123456);const w=g.buildings.find(b=>b.type==='warehouse'&&b.owner===0),m=e.run("new Building('market',49,47,0,true)");g.buildings.push(m);g.ensureInventories();g.ensureMarkets();assert(g.linkOpen(w,m));return{...e,g,w,m}}

test('old export=true policies retain community wine and oil until explicit opt-in',()=>{
 const {g,w,m,storage}=scene();const wine=g.linkGoodPolicy(w,m,'wine'),oil=g.linkGoodPolicy(w,m,'oil');assert.equal(wine.export,true);assert.equal(wine.sellCommunal,undefined);w.inventory.items.wine=3;w.inventory.items.oil=2;
 g.settlementTick();assert.equal(w.inventory.items.wine,3);assert.equal(w.inventory.items.oil,2);assert.equal(m.inventory.items.wine||0,0);assert(g.save(),g.lastSaveError);assert(g.load(),g.lastSaveError);const store=g.buildings.find(b=>b.id===w.id),market=g.buildings.find(b=>b.id===m.id);g.settlementTick();assert.equal(store.inventory.items.wine,3);assert.equal(store.inventory.items.oil,2);
 const policy=g.linkGoodPolicy(store,market,'wine');policy.sellCommunal=true;g.settlementTick();assert.equal(store.inventory.items.wine,0);assert.equal(market.inventory.items.wine,3);assert.equal(store.inventory.items.oil,2);assert(storage.get('terra-italica-save-v5'));
});

test('sale control appears only for player warehouse-market wine/oil and malformed save is rejected',()=>{
 const {g,w,m,byId,storage}=scene();g.openLinks(w);byId.linkPair.value=m.id;byId.linkGood.value='wine';g.renderLinkPolicy();assert.equal(byId.linkCommunitySaleLabel.hidden,false);assert.equal(byId.linkCommunitySale.checked,false);byId.linkCommunitySale.checked=true;byId.linkForm.onsubmit({preventDefault(){}});assert.equal(g.linkGoodPolicy(w,m,'wine').sellCommunal,true);
 byId.linkGood.value='wood';g.renderLinkPolicy();assert.equal(byId.linkCommunitySaleLabel.hidden,true);
 const data=JSON.parse(storage.get('terra-italica-save-v5'));const holder=data.buildings.find(b=>b.id===(w.id<m.id?w.id:m.id));const p=holder.linkSettings[[w.id,m.id].sort().join(':')];p.goods.wine.sellCommunal='yes';storage.set('terra-italica-save-v5',JSON.stringify(data));assert.equal(g.load(),false);
});
