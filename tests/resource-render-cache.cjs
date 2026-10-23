const test=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');
class FakeCanvas{
  constructor(width,height){this.width=width;this.height=height;this.context=new Proxy({}, {get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});}
  getContext(){return this.context}
}

test('resource pictures are reused and refresh when amount or membership changes',()=>{
  const {g,sandbox,run}=make();g.newGame(123456);sandbox.OffscreenCanvas=FakeCanvas;
  const r=run("new ResourceNode('wood',10.5,10.5,20)");g.world.resources=[r];
  let calls=0,images=0;const draw=g.drawResource;
  g.drawResource=function(...args){calls++;return draw.apply(this,args)};
  g.ctx.drawImage=()=>images++;
  g.drawResourcesCached(8,8,23,23);
  assert.equal(calls,1);assert.equal(images,1);
  g.drawResourcesCached(8,8,23,23);
  assert.equal(calls,1);assert.equal(images,2);
  r.amount=10;g.drawResourcesCached(8,8,23,23);
  assert.equal(calls,2);assert.equal(images,3);
  g.world.resources.push(run("new ResourceNode('food',18.5,10.5,10)"));
  g.drawResourcesCached(8,8,23,23);
  assert.equal(calls,3);assert.equal(images,5);
  assert.equal(g.resourcePictureStats().cached,2);
  g.newGame(789);g.world.resources=[run("new ResourceNode('wood',10.5,10.5,20)")];
  g.drawResourcesCached(8,8,23,23);
  assert.equal(g.resourcePictureStats().cached,1);
});

test('without auxiliary canvas, resource drawing falls back to live sprites',()=>{
  const {g,run}=make();g.newGame(123456);
  g.world.resources=[run("new ResourceNode('stone',10.5,10.5,20)")];
  let calls=0;g.drawResource=()=>calls++;
  g.drawResourcesCached(8,8,23,23);
  g.drawResourcesCached(8,8,23,23);
  assert.equal(calls,2);
});

test('large maps group adjacent resource chunks and cap cached pictures',()=>{
  const {g,sandbox,run}=make();g.experimentalWorldSize=256;g.newGame(123456);
  sandbox.OffscreenCanvas=FakeCanvas;
  g.world.ensureResourceChunksForBounds=()=>{};
  g.world.resources=[run("new ResourceNode('wood',7.5,7.5,20)"),run("new ResourceNode('food',8.5,7.5,20)")];
  let images=0;g.ctx.drawImage=()=>images++;
  g.drawResourcesCached(7,7,8,8);
  assert.equal(images,1,'two neighboring 8-tile chunks share one larger picture');
  for(let i=0;i<25;i++){
    const x=(i%12)*16+1,y=Math.floor(i/12)*16+1;
    g.world.resources.push(run(`new ResourceNode('wood',${x+.5},${y+.5},20)`));
    g.drawResourcesCached(x,y,x,y);
  }
  assert(g.resourcePictureStats().cached<=24,'picture memory stays bounded');
});

test('512-tile worlds keep smaller pictures for predictable compositing',()=>{
  const {g,sandbox,run}=make();g.experimentalWorldSize=512;g.newGame(123456);
  sandbox.OffscreenCanvas=FakeCanvas;g.world.ensureResourceChunksForBounds=()=>{};
  g.world.resources=[run("new ResourceNode('wood',7.5,7.5,20)"),run("new ResourceNode('food',8.5,7.5,20)")];
  let images=0;g.ctx.drawImage=()=>images++;
  g.drawResourcesCached(7,7,8,8);
  assert.equal(images,2,'the 512 world retains separate 8-tile pictures');
});

test('mobile auxiliary canvas failure falls back to live resources',()=>{
  const {g,sandbox,run}=make();sandbox.OffscreenCanvas=class{constructor(){throw Error('GPU unavailable')}};
  g.world.resources=[run("new ResourceNode('stone',10.5,10.5,20)")];
  let calls=0;g.drawResource=()=>calls++;
  g.drawResourcesCached(8,8,23,23);assert.equal(calls,1);
  assert.equal(g._resourcePicturesDisabled,true);
  g.drawResourcesCached(8,8,23,23);assert.equal(calls,2);
});
