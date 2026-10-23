const {test}=require('node:test'),assert=require('node:assert/strict'),make=require('./harness.cjs');
for(const size of [256,512])test(`neutral caravan reroutes around a new palisade on ${size}`,()=>{
 const {g,run}=make([],{neutrals:true});g.experimentalWorldSize=size;g.newGame(123456);
 g.nextRaidDay=100000;g.raiders=[];g.animals=[];g.autosave=-1e9;
 for(const u of g.units.filter(u=>u.owner===0))u.fedUntil=100000;
 let trader=null,block=null,maxBatch=0,completed=false;
 for(let day=1;day<=1800&&!g.gameEnded;day++){
  if(!trader)trader=g.neutralSettlement(1)?.people.find(u=>u.task?.type==='caravan')||null;
  if(trader&&!block&&trader.task?.phase==='market'&&trader.path.length>size/2){
   const p=trader.path[Math.floor(trader.path.length/3)];
   block=run(`new Building('palisade',${Math.floor(p.x)},${Math.floor(p.y)},0,true)`);
   g.buildings.push(block);
  }
  g.update(.85);
  for(const job of g._neutralRouteJobs.values())maxBatch=Math.max(maxBatch,job.lastBatch);
  if(block&&trader.task?.type!=='caravan'){completed=true;break;}
 }
 assert(block,'the road is interrupted after departure');
 assert(completed,'the same trader gets home');
 assert((trader.xp.trading||0)>0,'the exchange succeeds after the detour');
 assert.equal(trader.inventory.amount,0);
 assert(maxBatch<=48,'rerouting stays within the incremental search budget');
});
