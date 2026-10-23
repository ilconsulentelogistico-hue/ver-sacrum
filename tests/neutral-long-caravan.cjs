const {test}=require('node:test'),assert=require('node:assert/strict'),make=require('./harness.cjs');
for(const size of [256,512])test(`neutral caravan crosses ${size} tiles, trades, reloads and returns`,()=>{
 const {g}=make([],{neutrals:true});g.experimentalWorldSize=size;g.newGame(123456);
 g.nextRaidDay=100000;g.raiders=[];g.animals=[];g.autosave=-1e9;
 for(const u of g.units.filter(u=>u.owner===0))u.fedUntil=100000;
 let trader,source,days=0;
 for(;days<900&&!trader;days++){g.update(.85);const settlement=g.neutralSettlement(1);
  source=settlement.market;trader=settlement.people.find(u=>u.task?.type==='caravan');}
 assert(trader,'grown merchant departs');
 let destination=g.findById(g.buildings,trader.task.market);
 const traderId=trader.id,sourceId=source.id,destinationId=destination.id;
 const total=good=>(source.inventory.items[good]||0)+(destination.inventory.items[good]||0)
   +(trader.inventory.type===good?trader.inventory.amount:0);
 const before=Object.fromEntries(['grain','barley','food'].map(good=>[good,total(good)]));
 let loaded=false,traded=false,steps=0;
 while(trader.task?.type==='caravan'&&steps<6000){
  if(!loaded&&trader.task.phase==='market'&&trader.path.length<Math.floor(size/2)){
   assert(g.save(),g.lastSaveError);assert(g.load());loaded=true;
   trader=g.findById(g.units,traderId);source=g.findById(g.buildings,sourceId);
   destination=g.findById(g.buildings,destinationId);
   assert.equal(trader.task.phase,'market');
  }
  g.updateUnit(trader,.5);steps++;
  if(trader.task?.phase==='return')traded=true;
 }
 assert(loaded&&traded,'reload and actual barter happened');
 assert(steps<6000,'the person reaches home');
 assert.equal(trader.inventory.amount,0);
 assert((trader.xp.trading||0)>0);
 for(const good of Object.keys(before))assert.equal(total(good),before[good],`${good} remains physical`);
});
