const {test}=require('node:test');
const assert=require('node:assert/strict');
const setup=require('./economy-fixture.cjs');

test('a successful caravan observes real pre-trade price and stock, then persists only visited goods',()=>{
 const {g,d,b,u,storage,byId}=setup();g.ensureMarkets();
 assert.match(g.marketObservationsText(b,['wood','food']),/mai osservato/);
 u.x=b.x;u.y=b.y;u.inventory.type='wood';u.inventory.amount=10;
 const deal={...d,quantity:1};
 const before={wood:g.marketPrice(b,'wood'),food:g.marketPrice(b,'food'),woodStock:g.available(b,'wood'),foodStock:g.available(b,'food')};
 const result=g.tradeAtMarket(deal);assert.equal(result.ok,true);
 assert.deepEqual(Object.keys(b.observedPrices).sort(),['food','wood']);
 assert.equal(b.observedPrices.wood.price,Math.round(before.wood*100)/100);
 assert.equal(b.observedPrices.food.price,Math.round(before.food*100)/100);
 assert.equal(b.observedPrices.wood.stock,before.woodStock);
 assert.equal(b.observedPrices.food.stock,before.foodStock);
 assert.equal(b.observedPrices.wood.day,g.totalDays);
 assert.match(g.marketObservationsText(b,['wood','food']),/giorno/);
 assert.match(g.marketObservationsText(b,['iron']),/mai osservato/);
 assert.equal(g.save(),true,g.lastSaveError);
 const saved=JSON.parse(storage.get('terra-italica-save-v5'));
 assert.deepEqual(Object.keys(saved.buildings.find(x=>x.id===b.id).observedPrices).sort(),['food','wood']);
 assert.equal(g.load(),true,g.lastSaveError);
 const loaded=g.buildings.find(x=>x.id===b.id);
 assert.equal(loaded.observedPrices.food.stock,before.foodStock);
 g.openTrade();byId.tradeMarket.value=loaded.id;byId.tradeOffer.value='wood';byId.tradeGood.value='food';g.updateTradePreview();
 assert.match(byId.tradeObservations.textContent,/scorta/);
});

test('invalid or distant trades do not reveal market observations',()=>{
 const {g,d,b,u}=setup();g.ensureMarkets();
 u.inventory.type='wood';u.inventory.amount=10;u.x=b.x+10;
 assert.equal(g.tradeAtMarket({...d,quantity:1}).ok,false);
 assert.deepEqual(Object.keys(b.observedPrices),[]);
 u.x=b.x;u.y=b.y;
 assert.equal(g.tradeAtMarket({...d,quantity:0}).ok,false);
 assert.deepEqual(Object.keys(b.observedPrices),[]);
});
