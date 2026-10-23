const test=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');

test('local resource query agrees with full scan and keeps draw order',()=>{
  const {g}=make();g.newGame(123456);
  const w=g.world;
  for(const [x0,y0,x1,y1] of [[0,0,8,8],[15,10,31,30],[45,40,60,58],[0,0,87,87]]){
    const expected=w.resources.filter(r=>r.x>=x0&&r.x<=x1&&r.y>=y0&&r.y<=y1).map(r=>r.id);
    const actual=w.resourcesInBounds(x0,y0,x1,y1).map(r=>r.id);
    assert.deepEqual(actual,expected,`bounds ${x0},${y0},${x1},${y1}; missing ${expected.filter(id=>!actual.includes(id)).map(id=>{const r=w.resourceById(id);return `${r.x},${r.y}`}).join(";")}`);
  }
  assert.equal(w.resourceById(w.resources[0].id),w.resources[0]);
});

test('index refreshes after resource append and after save load',()=>{
  const {g,run}=make();g.newGame(987);const w=g.world;
  const extra=run('new ResourceNode("stone",10.5,11.5,4)');
  w.resources.push(extra);
  assert(w.resourcesInBounds(10,11,11,12).includes(extra));
  assert.equal(w.resourceById(extra.id),extra);
  assert(g.save(),g.lastSaveError);
  const old=w;assert(g.load());assert.notEqual(g.world,old);
  assert(g.world.resourcesInBounds(10,11,11,12).some(r=>r.id===extra.id));
  assert.equal(g.world.resourceById(extra.id)?.amount,4);
});

test('draw visits only visible resources',()=>{
  const {g}=make();g.newGame(654321);
  let count=0;g.drawResource=()=>{count++};
  g.draw();
  assert(count>0);
  assert(count<g.world.resources.length);
});
