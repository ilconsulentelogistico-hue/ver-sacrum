const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const make=require('./harness.cjs');

// Captured before replacing the sorted-array open list: these routes cross
// ordinary ground, a long mountain detour and a distant settlement approach.
test('priority queue preserves established routes and expansion budget',()=>{
  const {g}=make();g.newGame(123456);const u=g.units[0];
  for(const [x,y,length,hash,expansions] of [
    [30,30,32,'64a84f06706393b1043bb2d2431e8dd36c85f665a60079c8c169f732e74d5181',244],
    [60,60,80,'617acbb0a7baf0649ae1f8cf400947c0cd941c58c334d4b0015f0ae24a727c0d',1484],
    [75,75,80,'630b8a7d220ce81c2923f0c4ed36861b0d879954c8ab590158f2f34c0d372f6a',798]
  ]){
    const path=g.findPath(u.x,u.y,x,y);
    assert.equal(path.length,length);
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(path)).digest('hex'),hash);
    assert.equal(g.pathBudget.lastExpansions,expansions);
  }
  // With the long search off, the budget still caps the A*; pathfinding.cjs covers the long search.
  g.pathBudget.maxExpansions=1;g.pathBudget.maxLongSettled=0;
  assert.equal(g.findPath(u.x,u.y,60,60).length,0);
  assert.equal(g.pathBudget.lastExpansions,1);
});


test('impassable destination stops before a 5000-cell search',()=>{
  const {g}=make();g.newGame(123456);const u=g.units[0];
  let blocked=null;for(let y=0;y<g.world.size&&!blocked;y++)for(let x=0;x<g.world.size&&!blocked;x++)if(!g.world.walkable(x,y,1,null,g.buildings))blocked={x,y};
  assert(blocked);assert.equal(g.findPath(u.x,u.y,blocked.x,blocked.y).length,0);assert.equal(g.pathBudget.lastExpansions,0);
  const goal={x:30,y:30};assert.equal(g.findPath(u.x,u.y,goal.x,goal.y,1,(x,y)=>x===goal.x&&y===goal.y).length,0);assert.equal(g.pathBudget.lastExpansions,0);
});
