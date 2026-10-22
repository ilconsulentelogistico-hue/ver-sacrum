// Long-route logistics probe. Node timings are not phone FPS.
const {performance}=require('node:perf_hooks');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const make=require('../tests/harness.cjs');
const seed=123456,dt=.05,results=[];
const percentile=(v,p)=>v[Math.min(v.length-1,Math.ceil(v.length*p)-1)];
for(const size of [512,1024])for(const count of [20,60]){


 const {g,run}=make();g.experimentalWorldSize=size;g.newGame(seed);g.raiders=[];g.animals=[];g.raidsEnabled=false;g.nextRaidDay=1e9;
 const centers=(size===512?[[64,64],[96,384],[384,128],[448,448]]:[[128,128],[192,768],[768,256],[896,896]]);
 const routes=[];
 for(const [cx,cy] of centers){
  g.world.ensureResourceChunksForBounds(cx-10,cy-10,cx+42,cy+10);
  let pair=null;
  for(let radius=0;radius<=8&&!pair;radius++)for(let dy=-radius;dy<=radius&&!pair;dy++)for(let dx=-radius;dx<=radius&&!pair;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;
   const sx=cx+dx,sy=cy+dy;
   if(g.villagePlacementError('warehouse',sx,sy))continue;
   for(const offset of [24,20,28]){
    const tx=sx+offset,ty=sy;
    if(g.villagePlacementError('warehouse',tx,ty))continue;
    const source=run(`new Building('warehouse',${sx},${sy},0,true)`),dest=run(`new Building('warehouse',${tx},${ty},0,true)`);
    g.buildings.push(source,dest);
    if(g.pathToBuilding({x:source.x+1,y:source.y},dest)!==null){pair=[source,dest];break;}
    g.buildings.pop();g.buildings.pop();
   }
  }
  assert(pair,`no legal route near ${cx},${cy}`);routes.push(pair);
 }
 g.ensureInventories();for(const [source,dest] of routes){source.inventory.items.wood=300;dest.inventory.items.wood=0;}
 const carriers=[];
 for(let i=0;i<count;i++){
  const [source,dest]=routes[i%routes.length],u=run(`new Unit('Corriere ${i}',${source.x+1},${source.y},game.rng)`);
  u.owner=0;u.fedUntil=1e9;u.stance='passive';g.units.push(u);
  const err=g.assignHaul(u,source,dest,'wood',false);assert.equal(err,null,`route ${i}: ${err}`);carriers.push(u);
 }
 const carrierIds=carriers.map(u=>u.id),routeIds=routes.map(([s,d])=>[s.id,d.id]);
 const goods=()=>routeIds.reduce((n,[sid,did])=>n+(g.buildings.find(b=>b.id===sid)?.inventory.items.wood||0)+(g.buildings.find(b=>b.id===did)?.inventory.items.wood||0),0)+carrierIds.reduce((n,id)=>n+(g.units.find(u=>u.id===id)?.inventory.amount||0),0);
 const initial=goods();assert.equal(initial,1200);
 for(let i=0;i<60;i++)g.updateLiving(dt);
 const samples=[];for(let i=0;i<120;i++){const start=performance.now();g.updateLiving(dt);samples.push(performance.now()-start);}
 const inTransit=carrierIds.filter(id=>{const u=g.units.find(u=>u.id===id);return u.task?.phase==='destination'&&u.inventory.amount>0}).length;
 assert(inTransit>0,'at least one carrier must be moving with cargo');assert.equal(goods(),initial);
 assert(g.save(),g.lastSaveError);assert(g.load(),g.lastSaveError);assert.equal(goods(),initial);
 assert.equal(carrierIds.filter(id=>{const u=g.units.find(u=>u.id===id);return u.task?.phase==='destination'&&u.inventory.amount>0}).length,inTransit);
 let finishedAt=null;for(let i=0;i<1000;i++){
  g.updateLiving(dt);if(i%10===0)assert.equal(goods(),initial,'cargo conservation');
  if(carrierIds.every(id=>!g.units.find(u=>u.id===id).task)){finishedAt=i;break;}
 }
assert.notEqual(finishedAt,null,'all carriers should complete their trip');assert.equal(goods(),initial);
 const delivered=routeIds.reduce((n,[,did])=>n+(g.buildings.find(b=>b.id===did)?.inventory.items.wood||0),0);
 assert.equal(delivered,carrierIds.reduce((n,id)=>n+g.units.find(u=>u.id===id).inventory.cap,0));
 samples.sort((a,b)=>a-b);
 results.push({size,carriers:count,routes:routes.map(([s,d])=>({from:[s.x,s.y],to:[d.x,d.y]})),inTransitAtSave:inTransit,medianMs:+percentile(samples,.5).toFixed(3),p95Ms:+percentile(samples,.95).toFixed(3),maxMs:+samples.at(-1).toFixed(3),finishedAfterReloadFrames:finishedAt,delivered,goodsConserved:true,saveLoad:'ok'});
}
const report={seed,dt,warmupFrames:60,measuredFrames:120,host:'SP-SERVER Node CPU; not Xiaomi Redmi Note 10',results};
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
