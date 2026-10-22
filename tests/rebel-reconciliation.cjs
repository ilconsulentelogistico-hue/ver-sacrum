const test=require("node:test"),assert=require("node:assert/strict"),make=require("./harness.cjs");
test("gifts rebuild each rebel\x27s trust once and allow a consent based peaceful return",()=>{
 const{g,byId}=make([],{neutrals:true});g.newGame(123456);g.ensurePolitics();const original=g.neutralSettlement(1),base=original.base,ids=original.people.map(u=>u.id);
 assert(g.transferNeutralSettlement(1,"military-surrender","reconcile-first").ok);base.occupationSinceDay=0;
 for(const u of g.units.filter(u=>u.neutralSettlementId===base.settlementId)){u.communityTrust=0;u.fedUntil=0;u.hungry=false;}
 g.totalDays=90;g.occupationDay();g.totalDays=180;g.occupationDay();assert.equal(base.owner,1);
 base.loyalty=75;base.resistance=20;base.playerInfluence=90;base.relationship="allied";base.foodShortage=0;
 assert.equal(g.integrationEligible(1),false,"political scores cannot bypass personal consent");
 base.loyalty=10;base.resistance=100;base.playerInfluence=0;base.relationship="hostile";
 const store=g.communalStores(0)[0];assert(store);store.inventory.capacity=500;store.inventory.items.food=200;
 const trustBefore=original.people.map(u=>u.communityTrust);const first=g.diplomacyAction(1,"gift","reconcile-gift-0");assert(first.ok);assert(original.people.every((u,i)=>u.communityTrust===trustBefore[i]+4));
 const foodAfterFirst=store.inventory.items.food;assert.equal(g.diplomacyAction(1,"gift","reconcile-gift-0").replayed,true);assert.equal(store.inventory.items.food,foodAfterFirst);assert(original.people.every((u,i)=>u.communityTrust===trustBefore[i]+4));
 for(let n=1;n<27;n++)assert(g.diplomacyAction(1,"gift",`reconcile-gift-${n}`).ok);
 assert(original.people.every(u=>u.communityTrust===100));assert(g.diplomacyAction(1,"alliance","reconcile-pact").ok);assert(g.integrationEligible(1));g.renderPolitics();assert.match(byId.politicsList.innerHTML,/Ribellata/);assert.match(byId.politicsList.innerHTML,/Fiducia abitanti 100\/100/);
 g.neutralEconomyDay();assert.equal(base.integrationSinceDay,180);g.totalDays=240;g.neutralEconomyDay();
 const result=g.diplomacyAction(1,"integrate","reconcile-return");assert(result.ok,result.error);assert.equal(base.owner,0);assert.equal(base.integrationMode,"peaceful");assert.equal(base.rebelledDay,undefined);assert.equal(base.occupationStability,100);assert(ids.every(id=>g.units.find(u=>u.id===id)?.owner===0));
 assert(g.save(),g.lastSaveError);assert(g.load());assert.equal(g.buildings.find(b=>b.id===base.id).integrationMode,"peaceful");assert(ids.every(id=>g.units.find(u=>u.id===id)?.communityTrust===100));
});
