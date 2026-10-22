const test=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');
class FakeCanvas{
  constructor(){this.width=0;this.height=0;this.context=new Proxy({}, {get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});}
  getContext(){return this.context}
}

test('minimap terrain is painted once and refreshed after a biome change',()=>{
  const {g,sandbox}=make();g.experimentalWorldSize=128;g.newGame(123456);
  sandbox.document.createElement=()=>new FakeCanvas();
  let reads=0;const tile=g.world.tile;g.world.tile=function(...args){reads++;return tile.apply(this,args)};
  g.drawMinimap();const first=reads;
  assert(first>=128*128/4);
  g.drawMinimap();assert.equal(reads,first);
  const t=g.world.tile(4,4);const biome=t.biome;
  t.biome=biome==='grass'?'plain':'grass';const before=reads;
  g.drawMinimap();assert(reads-before>=128*128/4);
  assert.equal(g._minimapTerrain.revision,g.world.minimapRevision);
  g.newGame(789);g.drawMinimap();
  assert.equal(g._minimapTerrain.world,g.world);
});

test('large minimap samples output pixels instead of millions of hidden tiles',()=>{
  const {g,sandbox}=make();g.experimentalWorldSize=2048;g.newGame(123456);
  const minimap=sandbox.document.querySelector('#minimap');minimap.width=160;minimap.height=112;
  sandbox.document.createElement=()=>new FakeCanvas();
  let reads=0;const makeTile=g.world.makeTile;g.world.makeTile=function(...args){reads++;return makeTile.apply(this,args)};
  g.drawMinimap();const first=reads;
  assert(first>10000&&first<=160*112+10);
  g.drawMinimap();assert.equal(reads,first);
  g.world.tile(1000,1000).biome='grass';const before=reads;g.drawMinimap();
  assert(reads-before>10000&&reads-before<=160*112+10);
});
