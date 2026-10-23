const test=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');

class FakeCanvas{
  constructor(width,height){this.width=width;this.height=height;this.context=new Proxy({}, {get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});}
  getContext(){return this.context}
}

test('terrain pictures are reused, changed roads invalidate one chunk, a new world invalidates all',()=>{
  const {g,sandbox}=make();g.newGame(123456);
  sandbox.OffscreenCanvas=FakeCanvas;
  let tileCalls=0,images=0;
  const original=g.drawTile;g.drawTile=function(...args){tileCalls++;return original.apply(this,args)};
  g.ctx.drawImage=()=>{images++};
  g.drawTerrainCached(0,0,15,15,30);
  assert.equal(tileCalls,256);assert.equal(images,4);
  assert.equal(g.terrainPictureStats().cached,4);
  g.drawTerrainCached(0,0,15,15,30);
  assert.equal(tileCalls,256);assert.equal(images,8);
  assert.equal(g.terrainPictureStats().hits,4);
  const t=g.world.tile(3,3);t.road=!t.road;
  g.drawTerrainCached(0,0,15,15,30);
  assert.equal(tileCalls,320);assert.equal(images,12);
  g.newGame(789);
  g.drawTerrainCached(0,0,15,15,30);
  assert.equal(tileCalls,576);
  assert.equal(g.terrainPictureStats().cached,4);
});

test('close zoom keeps individual tile grid drawing',()=>{
  const {g,sandbox}=make();g.newGame(123456);sandbox.OffscreenCanvas=FakeCanvas;
  let calls=0;const original=g.drawTile;g.drawTile=function(...args){calls++;return original.apply(this,args)};
  g.camera.zoom=1.6;g.drawTerrainCached(0,0,7,7,48);
  assert.equal(calls,64);
  assert.equal(g.terrainPictureStats().cached,0);
});

test('mobile auxiliary canvas failure falls back to live terrain',()=>{
  const {g,sandbox}=make();sandbox.OffscreenCanvas=class{constructor(){throw Error('GPU unavailable')}};
  let calls=0;g.drawTile=()=>calls++;
  g.drawTerrainCached(0,0,7,7,30);assert.equal(calls,64);
  assert.equal(g._terrainPicturesDisabled,true);
  g.drawTerrainCached(0,0,7,7,30);assert.equal(calls,128);
});
