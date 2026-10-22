const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const make=require('./harness.cjs');
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');

test('seed 123456 reproduces the version-zero terrain and resource layout without a resident tile array',()=>{
  const {g}=make();g.newGame(123456);
  const terrain=[...g.world.tiles].map(t=>[t.biome,t.z,t.nearWater].join(':')).join('|');
  const resources=g.world.resources.filter(r=>r.type!=='clay'&&r.type!=='copper'&&r.type!=='tin').map(r=>[r.type,r.x,r.y,r.amount,r.resourceShape||'',r.orientation||''].join(':')).join('|');
  assert.equal(digest(terrain),'ea699744c3d3ff0fea036c2cd93c191be1cd6080b42e7cd0c04a1734cb9e4661');
  assert.equal(digest(resources),'1eeb28c57da492f960b65cfeefd49ffb82bdb35934b61d523308e5b87ccb2363');
  assert.equal(Array.isArray(g.world.tiles),false);
  assert.equal(g.world.tiles.length,88*88);
  assert(g.world.chunkCache.size<=128);
  assert([...g.world.chunkCache.values()].reduce((n,c)=>n+c.tiles.length,0)<=128*8*8);
});

test('edited road and terrain survive eviction, reload and an old v5 save without terrain patches',()=>{
  const {g,storage}=make();g.newGame(321);
  const t=g.world.tile(3,3),original={biome:t.biome,z:t.z,nearWater:t.nearWater};
  t.road=true;t.biome='grass';t.z=9;t.nearWater=!t.nearWater;
  g.world.chunkCache.clear(); // Force regeneration of the edited tile.
  const again=g.world.tile(3,3);
  assert.deepEqual([again.road,again.biome,again.z,again.nearWater],[true,'grass',9,!original.nearWater]);
  assert(g.save(),g.lastSaveError);
  const saved=JSON.parse(storage.get('terra-italica-save-v5'));
  assert(saved.roads.some(([x,y])=>x===3&&y===3));
  assert(saved.terrainChanges.some(p=>p.x===3&&p.y===3&&p.biome==='grass'&&p.z===9));
  const restored=make([...storage]);assert(restored.g.load());
  const r=restored.g.world.tile(3,3);
  assert.deepEqual([r.road,r.biome,r.z,r.nearWater],[true,'grass',9,!original.nearWater]);
  delete saved.terrainChanges;saved.streaming.maxCached=20;
  const legacy=make([['terra-italica-save-v5',JSON.stringify(saved)]]);assert(legacy.g.load());
  assert.equal(legacy.g.world.tile(3,3).road,true);
  assert.equal(legacy.g.world.tile(3,3).biome,original.biome);
});

test('invalid terrain patch is rejected without replacing the live world',()=>{
  const {g,storage}=make();assert(g.save());
  const saved=JSON.parse(storage.get('terra-italica-save-v5'));
  saved.terrainChanges=[{x:1,y:1,biome:'inventato'}];
  storage.set('terra-italica-save-v5',JSON.stringify(saved));
  const before=g.world;
  assert.equal(g.load(),false);
  assert.equal(g.world,before);
});
