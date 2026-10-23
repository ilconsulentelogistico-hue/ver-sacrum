// Browser smoke benchmark for the current world. Emulation is not physical-phone certification.
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const root=path.resolve(__dirname,'..');
const out=process.env.PERF_OUT||null;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const puppeteer=require(process.env.PUPPETEER_MODULE||'puppeteer');
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);});
});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function scenario(browser,base,profile){
  const page=await browser.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400&&!response.url().endsWith('/favicon.ico'))errors.push(`${response.status()} ${response.url()}`);});
  await page.setViewport(profile.viewport);
  await page.setBypassServiceWorker(true);
  const worldSize=['128','256','512','1024','2048'].includes(process.env.PERF_WORLD_SIZE)?`&worldSize=${process.env.PERF_WORLD_SIZE}`:'';
  const launchStart=Date.now();
  await page.goto(base+'/index.html?perf=1'+worldSize,{waitUntil:'load',timeout:30000});
  await page.waitForFunction('window.__terraPerf && typeof game !== "undefined"',{timeout:30000});
  const startupMs=Date.now()-launchStart;
  const setup=await page.evaluate((seedNormal,peopleTarget,allPlayer,moveEvery)=>{
    if(seedNormal){const size=game.experimentalWorldSize;game.experimentalWorldSize=WORLD_SIZE;game.newGame(123456);if(!game.save())throw new Error('normal slot setup failed');game.experimentalWorldSize=size;}
    game.newGame(123456);game.setPaused(false);
    const start=performance.now(),bases=game.buildings.filter(b=>b.type==='base'),initialPeople=game.units.length;
    const home=bases.find(b=>b.owner===0),cameraStartX=Math.max(10,Math.min(game.world.size-50,Math.floor(home.x-20))),cameraY=Math.floor(home.y);
    game.camera.x=cameraStartX*TILE;game.camera.y=cameraY*TILE;
    for(let i=initialPeople,tries=0;i<peopleTarget&&tries<peopleTarget*100;tries++){
      const base=bases[allPlayer?0:i%bases.length],dx=((tries*37)%83)-41,dy=((tries*53)%79)-39,x=Math.floor(base.x+dx)+.5,y=Math.floor(base.y+dy)+.5;
      const tile=game.world.tile(Math.floor(x),Math.floor(y));
      if(!tile||!BIOME[tile.biome].walk||!game.spawnPositionFree({x,y}))continue;
      const u=new Unit(`Prova ${i+1}`,x,y,game.rng);u.owner=base.owner;
      if(base.owner>0)u.neutralSettlementId=base.settlementId;
      game.units.push(u);i++;
    }
    let moving=0;
    for(let i=initialPeople;moveEvery>0&&i<game.units.length;i+=moveEvery){const u=game.units[i],tx=Math.floor(u.x+(i%2?12:-12)),ty=Math.floor(u.y+(i%3?8:-8));if(game.world.tile(tx,ty)&&BIOME[game.world.tile(tx,ty).biome].walk){game.assignMove(u,tx,ty);if(u.path.length)moving++;}}
    const originalUI=game.updateUI;window.__stressUI=[];game.updateUI=function(...args){const start=performance.now();try{return originalUI.apply(this,args)}finally{window.__stressUI.push(performance.now()-start)}};
    const originalUnit=game.updateUnit,originalLiving=game.updateLiving;let unitCalls=0;window.__stressLiving=[];
    game.updateUnit=function(...args){unitCalls++;return originalUnit.apply(this,args)};
    game.updateLiving=function(...args){unitCalls=0;const start=performance.now();try{return originalLiving.apply(this,args)}finally{window.__stressLiving.push({ms:performance.now()-start,units:unitCalls})}};
    window.__terraPerf.reset();return {people:game.units.length,moving,cameraStartX,cameraY,setupMs:performance.now()-start};
  },process.env.PERF_NORMAL_SLOT==='1',Number(process.env.PERF_PEOPLE||0),process.env.PERF_ALL_PLAYER==='1',process.env.PERF_MOVE_EVERY===undefined?5:Number(process.env.PERF_MOVE_EVERY));
  await sleep(6000);
  const idle=await page.evaluate(()=>window.__terraPerf.report());
  await page.evaluate(()=>{
    window.__terraPerf.reset();
    return new Promise(resolve=>{
      const start=performance.now(),startX=game.camera.x,duration=8000;
      function step(now){
        const t=Math.min(1,(now-start)/duration);
        game.camera.x=startX+40*t*TILE;
        if(t<1)requestAnimationFrame(step);else resolve();
      }
      requestAnimationFrame(step);
    });
  });
  const pan=await page.evaluate(()=>window.__terraPerf.report());
  const uiStats=await page.evaluate(()=>{const a=window.__stressUI||[],sorted=[...a].sort((x,y)=>x-y);return {calls:a.length,p95Ms:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]||0,maxMs:sorted.at(-1)||0};});
  const livingStats=await page.evaluate(()=>{const a=window.__stressLiving||[],pct=(values,q)=>{const sorted=values.sort((x,y)=>x-y);return sorted[Math.min(sorted.length-1,Math.floor(sorted.length*q))]||0};return {frames:a.length,p95Ms:pct(a.map(x=>x.ms),.95),maxMs:Math.max(0,...a.map(x=>x.ms)),p95Units:pct(a.map(x=>x.units),.95),maxUnits:Math.max(0,...a.map(x=>x.units))};});
  const exploreMs=process.env.PERF_EXPLORE_STRIPS==='1'?await page.evaluate(async()=>{
    game.setPaused(true);const start=performance.now(),world=game.world,side=world.chunkSize||8,cols=Math.ceil(world.size/side);
    for(let cy=0;cy<cols;cy++){
      world.ensureResourceChunksForBounds(0,cy*side,world.size-1,Math.min(world.size-1,(cy+1)*side-1));
      const keep=new Set();for(let cx=0;cx<cols;cx++)keep.add(`${cx},${cy}`);
      for(const e of [...game.units,...game.animals,...game.raiders,...game.buildings])if(Number.isFinite(e.x)&&Number.isFinite(e.y))keep.add(`${Math.floor(e.x/side)},${Math.floor(e.y/side)}`);
      world.pruneResourceChunks(keep);
      if(cy%4===3)await new Promise(resolve=>requestAnimationFrame(resolve));
    }
    game.setPaused(false);return performance.now()-start;
  }):process.env.PERF_EXPLORE_ALL==='1'?await page.evaluate(()=>{const start=performance.now();game.world.ensureResourceChunksForBounds(0,0,game.world.size-1,game.world.size-1);return performance.now()-start;}):null;
  const afterExplore=exploreMs===null?null:await (async()=>{await page.evaluate(()=>window.__terraPerf.reset());await sleep(6000);return page.evaluate(()=>window.__terraPerf.report());})();
  const retainedHeapMiB=exploreMs===null?null:await (async()=>{const session=await page.target().createCDPSession();await session.send('HeapProfiler.collectGarbage');await session.detach();return page.evaluate(()=>Math.round((performance.memory?.usedJSHeapSize||0)/1048576*10)/10);})();
  const saveLoad=await page.evaluate((debugChunks,secondSave)=>{
    game.setPaused(true);
    const beforeChunks=new Set(game.world.resourceChunksLoaded||[]),beforeIds=new Set(game.world.resources.map(r=>r.id));
    const before={seed:game.seed,people:game.units.length,resources:game.world.resources.length,chunks:game.world.resourceChunksLoaded?.size??null,residentChunks:game.world.resourceChunksResident?.size??null,firstId:game.units[0]?.id};
    const beforeChanges=game.world.size>=256?game.snapshot().resources.map(r=>`${r.id}:${r.amount}`).sort().join('|'):null;
    const saveStart=performance.now(),saved=game.save(),saveMs=performance.now()-saveStart;
    const saveBytes=(localStorage.getItem(game.world.size>WORLD_SIZE?`terra-italica-save-v5-${game.world.size}`:'terra-italica-save-v5')||'').length*2;
    game.newGame(987654);
    const chunkCalls=[];
    const originalChunks=World.prototype.ensureResourceChunksForBounds;
    if(debugChunks)World.prototype.ensureResourceChunksForBounds=function(...args){
      const old=new Set(this.resourceChunksLoaded||[]),result=originalChunks.apply(this,args);
      for(const k of this.resourceChunksLoaded||[])if(!old.has(k))chunkCalls.push({k,args,where:new Error().stack.split('\n').slice(2,5).join(' | ')});
      return result;
    };
    const loadStart=performance.now(),loaded=game.load(),loadMs=performance.now()-loadStart;
    if(debugChunks)World.prototype.ensureResourceChunksForBounds=originalChunks;
    const after={seed:game.seed,people:game.units.length,resources:game.world.resources.length,chunks:game.world.resourceChunksLoaded?.size??null,residentChunks:game.world.resourceChunksResident?.size??null,firstId:game.units[0]?.id};
    const afterChanges=game.world.size>=256?game.snapshot().resources.map(r=>`${r.id}:${r.amount}`).sort().join('|'):null;
    const resaved=secondSave?game.save():null;
    const sameState=before.seed===after.seed&&before.people===after.people&&before.chunks===after.chunks&&before.firstId===after.firstId&&beforeChanges===afterChanges&&(game.world.size>=1024||before.resources===after.resources);
    return {saved,loaded,resaved,saveMs,loadMs,saveBytes,sameState,before,after,newChunks:[...(game.world.resourceChunksLoaded||[])].filter(k=>!beforeChunks.has(k)),newResources:game.world.resources.filter(r=>!beforeIds.has(r.id)).map(r=>({type:r.type,x:r.x,y:r.y})),chunkCalls};
  },process.env.DEBUG_CHUNKS==='1',process.env.PERF_SECOND_SAVE==='1');
  if(!saveLoad.saved||!saveLoad.loaded||!saveLoad.sameState||process.env.PERF_SECOND_SAVE==='1'&&!saveLoad.resaved)errors.push('save/load round trip failed');
  if(out){fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,profile.name+'.png')});}
  await page.close();
  return{name:profile.name,startupMs,setup,uiStats,livingStats,idle,pan,exploreMs,afterExplore,retainedHeapMiB,saveLoad,errors};
}

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address(),base=`http://127.0.0.1:${address.port}`;
  let browser;
  try{
    browser=await puppeteer.launch({headless:true,executablePath:process.env.CHROME_BIN||puppeteer.executablePath(),args:['--no-sandbox','--disable-dev-shm-usage']});
    const profiles=[
      {name:'desktop-1280x720',viewport:{width:1280,height:720,deviceScaleFactor:1,isMobile:false,hasTouch:false}},
      {name:'mobile-emulated-390x844',viewport:{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}}
    ];
    const results=[];
    for(const profile of profiles.filter(p=>!process.env.PERF_PROFILE||p.name.startsWith(process.env.PERF_PROFILE)))results.push(await scenario(browser,base,profile));
    const git=args=>require('node:child_process').execFileSync('git',['-c',`safe.directory=${root}`,...args],{cwd:root,encoding:'utf8'}).trim();
    const report={requestedWorldSize:process.env.PERF_WORLD_SIZE||'88',sourceCommit:git(['rev-parse','--short','HEAD']),sourceBranch:git(['branch','--show-current']),workingTreeDirty:!!git(['status','--porcelain']),seed:123456,profiles:results,warning:'Mobile emulation runs on the server CPU; it is not a physical-device result.'};
    if(out)fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report,null,2));
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
