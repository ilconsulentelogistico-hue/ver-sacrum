const {test}=require("node:test"),assert=require("node:assert/strict"),make=require("./harness.cjs");
for(const size of [256,512])test(`neutral market route on ${size} tiles is incremental and traversable`,()=>{
 const {g}=make([],{neutrals:true});g.experimentalWorldSize=size;g.newGame(123456);
 const source=g.neutralSettlement(1).market,destination=g.neutralSettlement(2).market;
 let route,steps=0,maxBatch=0;
 do{route=g.neutralLargeMarketRoute(source,destination);steps++;
   maxBatch=Math.max(maxBatch,g._neutralRouteJobs.get(`${source.id}:${destination.id}`).lastBatch);
 }while(route===undefined&&steps<200);
 assert(route&&route.path.length>size,"the route reaches the other settlement");
 assert(maxBatch<=48,"one update has a fixed search budget");
 assert(steps>1,"the search is spread over days");
 const points=[route.start,...route.path];
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i];
  assert.equal(Math.abs(a.x-b.x)+Math.abs(a.y-b.y),1);
  assert(g.world.walkable(Math.floor(b.x),Math.floor(b.y),1,{x:Math.floor(a.x),y:Math.floor(a.y)},g.buildings));
 }
 assert.equal(g.neutralLargeMarketRoute(source,destination),route,"completed route is reused");
});
test("large-map neutral trader departs without a world-wide path search",()=>{
 const {g}=make([],{neutrals:true});g.experimentalWorldSize=256;g.newGame(123456);
 g.nextRaidDay=100000;g.raiders=[];g.animals=[];g.autosave=-1e9;
 for(const u of g.units.filter(u=>u.owner===0))u.fedUntil=100000;
 let maxBatch=0;
 for(let day=0;day<600;day++){
  g.update(.85);
  for(const job of g._neutralRouteJobs.values())maxBatch=Math.max(maxBatch,job.lastBatch);
 }
 const source=g.neutralSettlement(1).market;
 assert((source.neutralTradeTrips||0)>=1,"a grown trader physically starts a caravan");
 assert(maxBatch<=48);
 assert(g.save(),g.lastSaveError);assert(g.load());
 assert.equal(g._neutralRouteJobs.size,0,"pending planner state is discarded on reload");
 assert((g.neutralSettlement(1).market.neutralTradeTrips||0)>=1);
});
