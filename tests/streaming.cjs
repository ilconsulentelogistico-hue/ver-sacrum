const test=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');

test('chunks expose deterministic authoritative tile references',()=>{
  const {g}=make(),a=g.world.loadChunk(2,3),tile=g.world.tile(16,24);assert.equal(a.tiles[0],tile);
  const before={biome:tile.biome,z:tile.z};g.world.chunkCache.clear();const b=g.world.loadChunk(2,3);assert.deepEqual({biome:b.tiles[0].biome,z:b.tiles[0].z},before);
});

test('camera traversal retains a strict bounded LRU cache',()=>{
  const {g}=make();g.world.size=256;g.world.chunkCache.clear();for(let y=0;y<17;y++)for(let x=0;x<17;x++)g.world.loadChunk(x,y);g.world.trimChunkCache();
  assert(g.world.chunkCache.size<=128);assert.equal(g.world.chunkCache.has('0,0'),false);assert.equal(g.world.chunkCache.has('16,16'),true);
});

test('renderer draws visible cached tiles once without an offscreen fallback storm',()=>{
  const {g}=make();
  for(let y=0;y<4;y++)for(let x=0;x<5;x++)g.world.loadChunk(x+6,y+6);
  g.world.loadChunk(Math.floor(g.camera.x/30/8),Math.floor(g.camera.y/30/8));
  let draws=0;g.drawTile=()=>{draws++};g.drawResource=()=>{};g.drawBuilding=()=>{};g.drawAnimal=()=>{};g.drawHuman=()=>{};
  g.draw();
  const min=g.screenToWorld(0,0),max=g.screenToWorld(g.viewW,g.viewH);
  const visibleArea=(Math.ceil(max.x/30)-Math.floor(min.x/30)+3)*(Math.ceil(max.y/30)-Math.floor(min.y/30)+3);
  assert(draws>0,'at least one visible cached tile should render');
  assert(draws<=visibleArea,`visible render budget exceeded: ${draws} > ${visibleArea}`);
});

test('active work target chunk is retained while ordinary old chunks leave',()=>{
  const {g}=make(),u=g.units[0],r=g.world.resources.at(-1);u.task={type:'gather',target:r.id};g.world.chunkCache.clear();g.refreshStreaming();
  assert(g.world.chunkCache.has(`${Math.floor(r.x/8)},${Math.floor(r.y/8)}`));assert(g.world.chunkCache.size<=128);
});

test('pathfinding records and respects its expansion budget',()=>{
  const {g}=make();g.pathBudget.maxExpansions=1;g.pathBudget.maxLongSettled=0;assert.equal(g.findPath(g.units[0].x,g.units[0].y,80,80).length,0);assert.equal(g.pathBudget.lastExpansions,1);
  g.pathBudget.maxExpansions=5000;let path=[];for(let y=0;y<g.world.size&&!path.length;y++)for(let x=0;x<g.world.size&&!path.length;x++)path=g.findPath(g.units[0].x,g.units[0].y,x,y);assert(path.length>0);assert(g.pathBudget.lastExpansions<=5000);
});

test('offscreen person simulation advances independently of rendering',()=>{
  const {g}=make(),u=g.units[0];u.x=70;u.y=70;u.task={type:'move',x:72,y:70};u.path=[{x:72.5,y:70.5}];u.state='moving';g.camera.x=5*30;g.camera.y=5*30;const before=u.x;g.updateUnit(u,.5);assert(u.x>before);
});

test('consumed offscreen resource amount survives save and reload',()=>{
  const {g,storage}=make(),r=g.world.resources.at(-1);r.amount=3;g.camera.x=0;g.camera.y=0;assert(g.save());const {g:loaded}=make([...storage]);assert(loaded.load());assert.equal(loaded.world.resources.find(x=>x.id===r.id).amount,3);
});

test('streaming configuration and task state survive snapshot round trip',()=>{
  const {g,storage}=make(),u=g.units[0];let path=[];for(let y=0;y<g.world.size&&!path.length;y++)for(let x=0;x<g.world.size&&!path.length;x++)path=g.findPath(u.x,u.y,x,y);assert(path.length>0);u.task={type:'move',x:path.at(-1).x,y:path.at(-1).y};u.path=path;u.state='moving';assert(g.save());const snap=JSON.parse(storage.get('terra-italica-save-v5'));assert.deepEqual(snap.streaming,{chunkSize:8,maxCached:128});
  const {g:loaded}=make([...storage]);assert(loaded.load());const restored=loaded.units.find(x=>x.id===u.id);assert.equal(restored.task.type,'move');assert(restored.path.length>0);assert(loaded.world.chunkCache.size<=128);
});

test('zoomed-out terrain covers every visible tile exactly once, even beyond cache capacity',()=>{
  const {g}=make();
  g.drawResource=()=>{};g.drawBuilding=()=>{};g.drawAnimal=()=>{};g.drawHuman=()=>{};
  for(const [width,height] of [[390,600],[1100,700],[800,390]])for(const zoom of [.48,.64,1.05])for(const center of [0,45,89]){
    g.viewW=width;g.viewH=height;g.camera={x:center*30,y:center*30,zoom};
    const drawn=new Set();let count=0;g.drawTile=(x,y)=>{drawn.add(`${x},${y}`);count++;};g.draw();
    const min=g.screenToWorld(0,0),max=g.screenToWorld(width,height),clip=v=>Math.max(0,Math.min(g.world.size-1,v));
    const x0=clip(Math.floor(min.x/30)-1),x1=clip(Math.ceil(max.x/30)+1),y0=clip(Math.floor(min.y/30)-1),y1=clip(Math.ceil(max.y/30)+1);
    assert.equal(count,drawn.size,'no duplicate terrain draws');
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)assert(drawn.has(`${x},${y}`),`missing ${x},${y} at ${width}x${height}, zoom ${zoom}, center ${center}`);
    assert.equal(count,(x1-x0+1)*(y1-y0+1),'only visible bounds are drawn');
    assert(g.world.chunkCache.size<=128,'cache stays bounded');
  }
});
