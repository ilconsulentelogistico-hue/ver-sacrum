// Reproducible server-side probe. CPU timings are not phone FPS.
const {performance}=require('node:perf_hooks');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const make=require('../tests/harness.cjs');
const seed=123456;
const percentile=(sorted,p)=>sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*p)-1)];
const results=[];
for(const size of [256,512,1024])for(const population of [100,300]){
 const {g,run}=make();g.experimentalWorldSize=size;g.newGame(seed);
 g.raiders=[];g.animals=[];g.nextRaidDay=1e9;
 for(let i=g.units.length;i<population;i++){
  const u=run(`new Unit('Prova ${i}',${size-50+(i%10)/10},${size-50+Math.floor(i/10)%10/10},game.rng)`);
  u.owner=0;u.task=null;u.state='idle';g.units.push(u);
 }
 assert.equal(new Set(g.units.map(u=>u.id)).size,population);
 const original=g.updateUnit,metrics={calls:0,elapsed:0};
 g.updateUnit=function(u,dt){metrics.calls++;metrics.elapsed+=dt;return original.call(this,u,dt)};
 const dt=.016;for(let i=0;i<120;i++)g.updateLiving(dt);
 metrics.calls=0;metrics.elapsed=0;
 const samples=[];
 for(let i=0;i<360;i++){const t=performance.now();g.updateLiving(dt);samples.push(performance.now()-t)}
 assert(metrics.calls>0&&metrics.calls<population*360);
 assert(g.save(),g.lastSaveError);
 const before=g.units.length,chunkKeys=[...g.world.resourceChunksLoaded],loadedChunks=chunkKeys.length;
 assert(g.load(),g.lastSaveError);assert.equal(g.units.length,before);
 assert.equal(new Set(g.units.map(u=>u.id)).size,before);
 assert(chunkKeys.every(key=>g.world.resourceChunksLoaded.has(key)));
 const chunksAfterLoad=g.world.resourceChunksLoaded.size;
 if(global.gc)global.gc();
 samples.sort((a,b)=>a-b);
 results.push({size,population,frames:samples.length,medianMs:+percentile(samples,.5).toFixed(3),p95Ms:+percentile(samples,.95).toFixed(3),maxMs:+samples.at(-1).toFixed(3),unitUpdates:metrics.calls,simulatedUnitSeconds:+metrics.elapsed.toFixed(2),loadedResourceChunks:loadedChunks,chunksAfterLoad,heapMB:+(process.memoryUsage().heapUsed/1048576).toFixed(1),saveLoad:'ok'});
}
const report={seed,dt:.016,warmupFrames:120,measuredFrames:360,host:'SP-SERVER EC2 t3.xlarge; not Xiaomi Redmi Note 10',results};
const output=process.argv[2];if(output)fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
