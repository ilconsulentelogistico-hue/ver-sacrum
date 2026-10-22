// Repeatable CPU probe. Times from Node on SP-SERVER are not phone FPS.
const {performance}=require('node:perf_hooks');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const make=require('../tests/harness.cjs');
const seed=123456,dt=.016;
const percentile=(values,p)=>values[Math.min(values.length-1,Math.ceil(values.length*p)-1)];
const results=[];
for(const size of [512,1024])for(const count of [100,300])for(const work of [false,true]){
 const {g,run}=make();g.experimentalWorldSize=size;g.newGame(seed);g.raiders=[];g.animals=[];g.raidsEnabled=false;g.nextRaidDay=1e9;
 const centers=[[.125,.125],[.25,.75],[.75,.25],[.875,.875]].map(([x,y])=>[Math.floor(size*x),Math.floor(size*y)]);
 const groups=centers.map(([cx,cy])=>{const open=[];for(let y=cy-7;y<=cy+7;y++)for(let x=cx-7;x<=cx+7;x++)if(g.world.walkable(x,y,1,null,g.buildings))open.push([x,y]);return open});
 const spots=[];for(let j=0;spots.length<count&&j<225;j++)for(const group of groups)if(group[j])spots.push(group[j]);
 assert(spots.length>=count);
 const originals=g.units.length;
 for(let i=originals;i<count;i++){
  const [x,y]=spots[i-originals],u=run(`new Unit('Lavoratore ${i}',${x+.5},${y+.5},game.rng)`);
  u.owner=0;u.fedUntil=1e9;u.mobilized=false;u.stance='passive';
  if(work){const r=run(`new ResourceNode('wood',${x+.5},${y+.5},100)`);g.world.resources.push(r);u.task={type:'gather',target:r.id,workSpot:{x:u.x,y:u.y}};u.state='gathering';u.workTimer=0;}
  else{u.task=null;u.state='idle';}
  g.units.push(u);
 }
 if(work)g.world.invalidateResourceIndex();
 assert.equal(g.units.length,count);assert.equal(new Set(g.units.map(u=>u.id)).size,count);
 const managed=g.units.slice(originals),resourceIds=managed.map(u=>u.task?.target).filter(Boolean);
 for(let i=0;i<60;i++)g.updateLiving(dt);
 const samples=[];for(let i=0;i<360;i++){const start=performance.now();g.updateLiving(dt);samples.push(performance.now()-start);}
 const gathered=managed.reduce((n,u)=>n+u.inventory.amount,0),remaining=resourceIds.reduce((n,id)=>n+(g.world.resourceById(id)?.amount??0),0);
 if(work){assert(gathered>0,'workers must gather');assert.equal(gathered+remaining,resourceIds.length*100,'wood must be conserved');}
 const identity=new Set(g.units.map(u=>u.id)),chunksBefore=g.world.resourceChunksLoaded.size;
 assert(g.save(),g.lastSaveError);assert(g.load(),g.lastSaveError);assert.deepEqual(new Set(g.units.map(u=>u.id)),identity);assert(g.world.resourceChunksLoaded.size>=chunksBefore);
 if(work){assert.equal(g.units.filter(u=>resourceIds.includes(u.task?.target)).length,resourceIds.length);assert.equal(resourceIds.reduce((n,id)=>n+(g.world.resourceById(id)?.amount??0),0),remaining);}
 samples.sort((a,b)=>a-b);
 results.push({size,count,work,workerCount:managed.length,resourceCount:resourceIds.length,medianMs:+percentile(samples,.5).toFixed(3),p95Ms:+percentile(samples,.95).toFixed(3),maxMs:+samples.at(-1).toFixed(3),gathered,remaining,loadedChunks:chunksBefore,saveLoad:'ok'});
}
const report={seed,worldSizes:[512,1024],dt,warmupFrames:60,measuredFrames:360,host:'SP-SERVER Node CPU, not Xiaomi Redmi Note 10',results};
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
