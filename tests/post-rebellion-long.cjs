const test=require("node:test"),assert=require("node:assert/strict"),make=require("./harness.cjs");
test("rebellion sustains 180 days of real local work, reload and a second conquest cycle",()=>{
 const{g}=make([],{neutrals:true});g.newGame(123456);g.ensurePolitics();const original=g.neutralSettlement(1),ids=original.people.map(u=>u.id),baseId=original.base.id;
 assert(g.transferNeutralSettlement(1,"military-surrender","long-first").ok);const base=g.buildings.find(b=>b.id===baseId);base.occupationSinceDay=0;
 for(const u of g.units.filter(u=>u.neutralSettlementId===base.settlementId)){u.communityTrust=0;u.hungry=false;u.fedUntil=0;}
 g.totalDays=90;g.occupationDay();g.totalDays=180;g.occupationDay();assert.equal(base.owner,1);
 const stock=()=>{const goods={};for(const b of g.buildings.filter(b=>b.owner===1))for(const[k,v]of Object.entries(b.inventory.items))goods[k]=(goods[k]||0)+v;return goods;};
 const start=stock();for(const u of g.units.filter(u=>u.owner===0))u.fedUntil=9999;g.nextRaidDay=9999;
 for(let day=1;day<=180;day++){
  g.advanceDay();for(let tick=0;tick<4;tick++){g.updateLiving(1);for(const b of g.buildings)g.updateBuilding(b,1);}g.settlementTick();
  if(day===90){const before=stock();assert(g.save(),g.lastSaveError);assert(g.load());assert.deepEqual(stock(),before);assert.equal(g.neutralSettlement(1).base.id,baseId);}
 }
 assert.equal(g.totalDays,360);const s=g.neutralSettlement(1);assert(s);assert(ids.every(id=>s.people.some(u=>u.id===id&&u.health>0&&!u.hungry)));
 const farm=g.buildings.find(b=>b.owner===1&&b.type==="farm"),mill=g.buildings.find(b=>b.owner===1&&b.type==="mill");assert(farm.assigned.length>0);assert(mill.workers.length>0);
 assert((stock().grain||0)+(stock().flour||0)>start.grain);assert((stock().flour||0)>0);
 const beforeSecond=stock(),allIds=g.units.map(u=>u.id);assert(g.transferNeutralSettlement(1,"military-surrender","long-second").ok);
 const adopted=g.buildings.find(b=>b.id===baseId);assert.equal(adopted.owner,0);assert.equal(adopted.rebelledDay,undefined);assert.equal(adopted.occupationSinceDay,360);assert.equal(g.neutralSettlement(1),null);
 for(const u of g.units.filter(u=>u.neutralSettlementId===adopted.settlementId)){u.communityTrust=0;u.hungry=false;u.fedUntil=0;}
 g.totalDays=450;g.occupationDay();assert.equal(adopted.unrestSinceDay,450);g.totalDays=540;g.occupationDay();assert.equal(adopted.owner,1);
 assert.deepEqual(stock(),beforeSecond);assert.equal(new Set(g.units.map(u=>u.id)).size,g.units.length);assert(allIds.every(id=>g.units.some(u=>u.id===id)));
 assert(g.save(),g.lastSaveError);assert(g.load());assert.equal(g.neutralSettlement(1).base.id,baseId);
});
