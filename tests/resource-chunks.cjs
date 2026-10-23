const test=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');
const layout=w=>w.resources.map(r=>[r.id,r.type,r.x,r.y,r.amount,r.resourceShape,r.orientation||'']).sort((a,b)=>a[0].localeCompare(b[0]));
const hasChunk=(snapshot,size,key)=>{if(snapshot.resourceChunksLoaded)return snapshot.resourceChunksLoaded.includes(key);const [x,y]=key.split(',').map(Number),n=y*(size/8)+x,b=parseInt(snapshot.resourceChunkBits.slice((n>>3)*2,(n>>3)*2+2),16);return !!(b&(1<<(n&7)));};

test('128x128 resource chunks are deterministic and independent of visit order',()=>{
  const e=make(),a=e.run('new World(123456,128)'),b=e.run('new World(123456,128)');
  assert.equal(a.resources.length,0);
  a.ensureResourceChunksForBounds(8,8,23,23);a.ensureResourceChunksForBounds(80,80,95,95);
  b.ensureResourceChunksForBounds(80,80,95,95);b.ensureResourceChunksForBounds(8,8,23,23);
  assert.deepEqual(layout(a),layout(b));
  assert.equal(a.resourceChunksLoaded.size,8);
  const count=a.resources.length;a.ensureResourceChunksForBounds(8,8,23,23);
  assert.equal(a.resources.length,count);
  assert(new Set(a.resources.map(r=>r.id)).size===count);
});

test('experimental 128x128 game saves visited chunks and generates new ones after reload',()=>{
  const {g,storage}=make();g.experimentalWorldSize=128;g.newGame(123456);
  assert.equal(g.world.size,128);
  const before=g.world.resources.length,visited=g.world.resourceChunksLoaded.size;
  assert(visited>0&&visited<256);assert(before>0);
  const sample=g.world.resources[0];sample.amount=Math.max(0,sample.amount-7);
  assert(g.save(),g.lastSaveError);
  const snapshot=JSON.parse(storage.get('terra-italica-save-v5-128'));
  assert.equal(snapshot.worldSize,128);
  assert.equal(snapshot.resourceChunksLoaded.length,visited);
  const id=sample.id,amount=sample.amount;
  assert(g.load());assert.equal(g.world.size,128);
  assert.equal(g.world.resourceById(id)?.amount,amount);
  const oldCount=g.world.resources.length;
  const missing=[...Array(16)].flatMap((_,cy)=>[...Array(16)].map((_,cx)=>`${cx},${cy}`)).find(k=>!g.world.resourceChunksLoaded.has(k));
  assert(missing);const [cx,cy]=missing.split(',').map(Number);
  g.world.ensureResourceChunksForBounds(cx*8,cy*8,cx*8+7,cy*8+7);
  assert(g.world.resourceChunksLoaded.has(missing));
  assert(g.world.resources.length>=oldCount);
  assert.equal(g.world.resourceById(id)?.amount,amount);
});

test('experimental save cannot overwrite the normal 88x88 slot',()=>{
  const {g,storage}=make();g.newGame(123456);assert(g.save());
  const normal=storage.get('terra-italica-save-v5');
  g.experimentalWorldSize=128;g.newGame(123456);assert(g.save());
  assert.equal(storage.get('terra-italica-save-v5'),normal);
  assert(storage.get('terra-italica-save-v5-128'));
  assert(g.load());assert.equal(g.world.size,128);
  g.experimentalWorldSize=88;assert(g.load());assert.equal(g.world.size,88);
});

test('default world remains 88x88 with the original eager resource layout',()=>{
  const {g}=make();g.newGame(123456);
  assert.equal(g.world.size,88);
  assert.equal(g.world.resources.filter(r=>r.type!=='clay'&&r.type!=='copper'&&r.type!=='tin').length,2611);
  assert.equal(g.world.resources.filter(r=>r.type==='clay').length,8);
  assert.equal(g.world.resourceChunksLoaded,undefined);
  assert(g.save());
  assert(g.load());assert.equal(g.world.size,88);
});

test('256x256 experiment keeps a third save slot and restores distant chunks',()=>{
  const {g,storage}=make();g.newGame(123456);assert(g.save());const normal=storage.get('terra-italica-save-v5');
  g.experimentalWorldSize=128;g.newGame(123456);assert(g.save());const medium=storage.get('terra-italica-save-v5-128');
  g.experimentalWorldSize=256;g.newGame(123456);assert.equal(g.world.size,256);
  g.world.ensureResourceChunksForBounds(232,232,247,247);
  const changed=g.world.resources[0];changed.amount-=3;changed.depletedAt=7;
  const before=layout(g.world),visited=[...g.world.resourceChunksLoaded];
  assert(visited.includes('29,29')&&visited.includes('30,30'));
  assert(g.save(),g.lastSaveError);assert(storage.get('terra-italica-save-v5-256'));
  assert.equal(storage.get('terra-italica-save-v5'),normal);assert.equal(storage.get('terra-italica-save-v5-128'),medium);
  assert(g.load());assert.equal(g.world.size,256);assert.deepEqual(layout(g.world),before);
  assert.deepEqual([...g.world.resourceChunksLoaded].sort(),visited.sort());
  g.experimentalWorldSize=128;assert(g.load());assert.equal(g.world.size,128);
  g.experimentalWorldSize=88;assert(g.load());assert.equal(g.world.size,88);
});

test('fully explored 256x256 world has a compact restorable save',()=>{
  const {g,storage}=make();g.experimentalWorldSize=256;g.newGame(123456);
  g.world.ensureResourceChunksForBounds(0,0,255,255);
  assert.equal(g.world.resourceChunksLoaded.size,1024);
  const originalCount=g.world.resources.length;assert(originalCount>10000);
  const sample=g.world.resources.find(r=>r.renewable);sample.amount-=5;sample.depletedAt=4;
  assert(g.save(),g.lastSaveError);
  const raw=storage.get('terra-italica-save-v5-256');
  assert(raw.length*2<500000,'compact snapshot should fit alongside a backup and pending write in a 5 MB localStorage quota');
  const snapshot=JSON.parse(raw);assert.equal(snapshot.resourceMode,'changes');
  assert(snapshot.resources.length<20);
  assert(g.load());assert.equal(g.world.resources.length,originalCount);
  assert.equal(g.world.resourceById(sample.id)?.amount,sample.amount);
  assert.equal(g.world.resourceChunksLoaded.size,1024);
});

test('512x512 experiment saves distant blocks separately and restores their contents',()=>{
  const {g,storage}=make();g.experimentalWorldSize=512;g.newGame(123456);
  g.world.ensureResourceChunksForBounds(488,488,503,503);
  assert(g.world.resourceChunksLoaded.has('61,61'));
  const sample=g.world.resources.find(r=>r.x>488&&r.y>488);assert(sample);sample.amount-=4;
  const count=g.world.resources.length,chunks=g.world.resourceChunksLoaded.size;
  assert(g.save(),g.lastSaveError);
  const saved=JSON.parse(storage.get('terra-italica-save-v5-512'));
  assert.equal(saved.worldSize,512);assert.equal(saved.resourceMode,'changes');
  assert(saved.resources.some(r=>r.id===sample.id));
  assert(g.load());assert.equal(g.world.size,512);assert.equal(g.world.resources.length,count);
  assert.equal(g.world.resourceChunksLoaded.size,chunks);assert.equal(g.world.resourceById(sample.id)?.amount,sample.amount);
});

test('1024x1024 experiment restores distant changed resources without changing smaller saves',()=>{
  const {g,storage}=make();g.experimentalWorldSize=512;g.newGame(123456);assert(g.save());
  const smaller=storage.get('terra-italica-save-v5-512');
  g.experimentalWorldSize=1024;g.newGame(123456);g.world.ensureResourceChunksForBounds(992,992,1007,1007);
  const sample=g.world.resources.find(r=>r.x>992&&r.y>992);assert(sample);sample.amount-=2;
  const count=g.world.resources.length,farCount=g.world.resources.filter(r=>r.x>=992&&r.x<1008&&r.y>=992&&r.y<1008).length;assert(g.save(),g.lastSaveError);
  assert.equal(storage.get('terra-italica-save-v5-512'),smaller);
  assert(hasChunk(JSON.parse(storage.get('terra-italica-save-v5-1024')),1024,'124,124'));
  assert(g.load());assert.equal(g.world.size,1024);assert(g.world.resources.length<count);
  assert(g.save(),g.lastSaveError);
  const resaved=JSON.parse(storage.get('terra-italica-save-v5-1024'));
  assert(hasChunk(resaved,1024,'124,124'));
  assert(resaved.resources.some(r=>r.id===sample.id&&r.amount===sample.amount));
  assert.equal(g.world.resourceById(sample.id)?.amount,sample.amount);
  g.world.ensureResourceChunksForBounds(992,992,1007,1007);
  assert.equal(g.world.resources.filter(r=>r.x>=992&&r.x<1008&&r.y>=992&&r.y<1008).length,farCount);
});

test('1024 resource eviction recreates natural nodes and preserves a changed node',()=>{
  const {g}=make();g.experimentalWorldSize=1024;g.newGame(123456);
  g.world.ensureResourceChunksForBounds(700,700,707,707);
  const far=g.world.resources.filter(r=>r.x>=700&&r.x<708&&r.y>=700&&r.y<708);assert(far.length>1);
  const changed=far[0];changed.amount-=6;changed.depletedAt=12;
  const original=layout({resources:far}),key='87,87',before=g.world.resources.length;
  assert(g.world.resourceChunksResident.has(key));assert(g.world.resourceChunksLoaded.has(key));
  assert(g.world.pruneResourceChunks(new Set())>0);
  assert(!g.world.resourceChunksResident.has(key));assert(g.world.resourceChunksLoaded.has(key));
  assert(g.world.resources.length<before);assert.equal(g.world.resourceById(changed.id)?.amount,changed.amount);
  g.world.ensureResourceChunksForBounds(700,700,707,707);
  assert(g.world.resourceChunksResident.has(key));
  const restored=g.world.resources.filter(r=>r.x>=700&&r.x<708&&r.y>=700&&r.y<708);
  assert.deepEqual(layout({resources:restored}),original);
  assert(new Set(g.world.resources.map(r=>r.id)).size===g.world.resources.length);
  assert(g.save(),g.lastSaveError);assert(g.load());
  assert.equal(g.world.resourceById(changed.id)?.amount,changed.amount);
  const regrown=g.world.resourceById(changed.id);regrown.amount=regrown.max;regrown.depletedAt=null;regrown.regrowing=false;
  g.world.pruneResourceChunks(new Set());
  assert(!g.world.resourceOverrides.has(changed.id));
  g.world.ensureResourceChunksForBounds(700,700,707,707);
  assert.equal(g.world.resourceById(changed.id)?.amount,regrown.max);
});

test('periodic eviction keeps a selected distant resource resident',()=>{
  const {g}=make();g.experimentalWorldSize=1024;g.newGame(123456);
  g.world.ensureResourceChunksForBounds(700,700,707,707);
  const selected=g.world.resources.find(r=>r.x>=700&&r.x<708&&r.y>=700&&r.y<708);assert(selected);
  g.selected=selected;g._resourcePruneClock=4.99;g.updateLiving(.02);
  assert(g.world.resourceChunksResident.has('87,87'));
  g.selected=null;g._resourcePruneClock=4.99;g.updateLiving(.02);
  assert(!g.world.resourceChunksResident.has('87,87'));
});

test('lazy restore keeps selected natural resource and a distant gather target',()=>{
  const {g}=make();g.experimentalWorldSize=1024;g.newGame(123456);
  g.world.ensureResourceChunksForBounds(700,700,707,707);
  g.world.ensureResourceChunksForBounds(820,820,827,827);
  const selected=g.world.resources.find(r=>r.x>=700&&r.x<708&&r.y>=700&&r.y<708);
  const target=g.world.resources.find(r=>r.x>=820&&r.x<828&&r.y>=820&&r.y<828);
  assert(selected&&target);g.selected=selected;
  const person=g.units[0];person.task={type:'gather',target:target.id};person.state='gathering';
  assert(g.save(),g.lastSaveError);assert(g.load());
  assert.equal(g.selected?.id,selected.id);
  assert.equal(g.units[0].task?.target,target.id);
  assert.equal(g.world.resourceById(target.id)?.id,target.id);
  assert(g.world.resourceChunksResident.has('87,87'));
  assert(g.world.resourceChunksResident.has('102,102'));
});

test('2048 visited chunk bitset stays small and survives repeated saves',()=>{
  const {g,storage}=make();g.experimentalWorldSize=2048;g.newGame(123456);
  g.world.ensureResourceChunksForBounds(2000,2000,2007,2007);
  const visited=new Set(g.world.resourceChunksLoaded);
  assert(g.save(),g.lastSaveError);let saved=JSON.parse(storage.get('terra-italica-save-v5-2048'));
  assert.equal(saved.resourceChunkBits.length,16384);assert.equal(saved.resourceChunksLoaded,undefined);
  assert(hasChunk(saved,2048,'250,250'));
  assert(g.load());assert.deepEqual(new Set(g.world.resourceChunksLoaded),visited);
  assert(g.save(),g.lastSaveError);saved=JSON.parse(storage.get('terra-italica-save-v5-2048'));
  assert(hasChunk(saved,2048,'250,250'));assert(saved.resourceChunkBits.length===16384);
});

test('old 1024 chunk lists load and migrate to the compact bitset',()=>{
  const {g,storage}=make();g.experimentalWorldSize=1024;g.newGame(123456);
  g.world.ensureResourceChunksForBounds(700,700,707,707);
  const old=JSON.parse(JSON.stringify(g.snapshot()));
  old.resourceChunksLoaded=[...g.world.resourceChunksLoaded];delete old.resourceChunkBits;
  storage.set('terra-italica-save-v5-1024',JSON.stringify(old));
  assert(g.load());assert(g.world.resourceChunksLoaded.has('87,87'));
  assert(g.save(),g.lastSaveError);
  const migrated=JSON.parse(storage.get('terra-italica-save-v5-1024'));
  assert.equal(migrated.resourceChunksLoaded,undefined);assert(hasChunk(migrated,1024,'87,87'));
});
