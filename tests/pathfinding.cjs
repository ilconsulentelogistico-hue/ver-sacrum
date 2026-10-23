const test=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');

// game.js findPath before pathfinding.js, verbatim, as the reference; it also says when the budget ran out.
function reference(g,PathQueue,sx,sy,gx,gy,climb=1,extraBlock=null){
  const key=(x,y)=>`${x},${y}`,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  sx=Math.floor(sx);sy=Math.floor(sy);gx=clamp(gx,0,g.world.size-1);gy=clamp(gy,0,g.world.size-1);
  if(sx===gx&&sy===gy)return {path:[],iter:null,capped:false};
  if(!g.world.walkable(gx,gy,climb,null,g.buildings)||extraBlock?.(gx,gy))return {path:[],iter:0,capped:false};
  const open=new PathQueue(),seen=new Map([[key(sx,sy),{g:0,p:null}]]);
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]],limit=g.pathBudget?.maxExpansions||5000;
  let iter=0,order=0;open.push({x:sx,y:sy,g:0,f:0,order:order++});
  while(open.length&&iter<limit){
    iter++;const cur=open.pop();
    if(cur.x===gx&&cur.y===gy){
      const out=[];let k=key(gx,gy),rec=seen.get(k);
      while(rec?.p){const [x,y]=k.split(',').map(Number);out.push({x:x+.5,y:y+.5});k=rec.p;rec=seen.get(k)}
      return {path:out.reverse(),iter,capped:false};
    }
    for(const [dX,dY] of dirs){
      const nx=cur.x+dX,ny=cur.y+dY;if(extraBlock?.(nx,ny))continue;
      if(!g.world.walkable(nx,ny,climb,{x:cur.x,y:cur.y},g.buildings))continue;
      const tile=g.world.tile(nx,ny),step=tile.road?.65:1,ng=cur.g+step+tile.z*.03,nk=key(nx,ny),old=seen.get(nk);
      if(!old||ng<old.g){seen.set(nk,{g:ng,p:key(cur.x,cur.y)});open.push({x:nx,y:ny,g:ng,f:ng+Math.abs(gx-nx)+Math.abs(gy-ny),order:order++});}
    }
  }
  return {path:[],iter,capped:open.length>0};
}
// Every step is a legal four-way move under World.walkable and the walk ends on the goal.
function walkable(g,sx,sy,gx,gy,path){
  let x=Math.floor(sx),y=Math.floor(sy);
  for(const p of path){
    const nx=Math.floor(p.x),ny=Math.floor(p.y);
    if(Math.abs(nx-x)+Math.abs(ny-y)!==1||!g.world.walkable(nx,ny,1,{x,y},g.buildings))return false;
    x=nx;y=ny;
  }
  return x===gx&&y===gy;
}
// Paths come from the game's VM realm: compare plain values, not prototypes.
const plain=v=>JSON.parse(JSON.stringify(v));
const lcg=seed=>()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
function compare(g,PathQueue,pairs){
  let capped=0;
  for(const [sx,sy,gx,gy] of pairs){
    const ref=reference(g,PathQueue,sx,sy,gx,gy),path=g.findPath(sx,sy,gx,gy,1);
    if(ref.capped){capped++;assert(path.length===0||walkable(g,sx,sy,gx,gy,path),`long path ${sx},${sy}→${gx},${gy}`);continue;}
    assert.deepEqual(plain(path),ref.path,`${sx},${sy}→${gx},${gy}`);
    if(ref.iter!==null)assert.equal(g.pathBudget.lastExpansions,ref.iter,`${sx},${sy}→${gx},${gy}`);
  }
  return capped;
}
const pairsAround=(g,rand,n,radius)=>Array.from({length:n},()=>{
  const u=g.units[Math.floor(rand()*g.units.length)];
  return [u.x,u.y,Math.floor(u.x+(rand()*2-1)*radius),Math.floor(u.y+(rand()*2-1)*radius)];
});

test('paths found by the old search stay identical on the 88 map',()=>{
  const {g,run}=make();const PathQueue=run('PathQueue');
  for(const seed of [123456,654321]){
    g.newGame(seed);const rand=lcg(seed);
    compare(g,PathQueue,pairsAround(g,rand,220,40));
  }
});

test('the grid follows new, finished and destroyed buildings and new roads',()=>{
  const {g,run}=make();const PathQueue=run('PathQueue'),Building=run('Building');g.newGame(123456);
  const u=g.units[0],pairs=pairsAround(g,lcg(7),40,14);
  compare(g,PathQueue,pairs);
  const house=new Building('house',Math.floor(u.x)+5,Math.floor(u.y)+1,0,true),wall=new Building('palisade',Math.floor(u.x)+2,Math.floor(u.y),0,false);
  g.buildings.push(house,wall);compare(g,PathQueue,pairs);
  wall.built=true;compare(g,PathQueue,pairs);
  house.health=0;compare(g,PathQueue,pairs);
  for(let x=Math.floor(u.x)-6;x<Math.floor(u.x)+6;x++){const t=g.world.tile(x,Math.floor(u.y)+3);if(t&&run('BIOME')[t.biome].walk)t.road=true;}
  compare(g,PathQueue,pairs);
});

test('on the 256 map a goal beyond the river is reached instead of leaving people still',async()=>{
  const {g,run,byId}=make();const PathQueue=run('PathQueue');
  g.experimentalWorldSize=256;g.newGame(123456);
  const group=g.units.filter(u=>u.owner===0&&u.health>0&&u.location.kind==='world').slice(0,5);
  const sx=Math.floor(group[0].x),sy=Math.floor(group[0].y);
  // Measured on 23/10/2026: 25 tiles away in a straight line, 248 steps around the river.
  const goal={x:146,y:151};
  assert.equal(reference(g,PathQueue,sx,sy,goal.x,goal.y).capped,true);
  const path=g.findPath(sx,sy,goal.x,goal.y,1);
  assert(path.length>200&&walkable(g,sx,sy,goal.x,goal.y,path));
  for(const u of group)g.assignMove(u,goal.x,goal.y);
  assert.equal(g.world._pathFields.size,1,'one field serves the whole group');
  assert(group.every(u=>u.path.length>200));
  await Promise.resolve();
  assert.match(byId.message.textContent,/Il gruppo fa il giro/);
  const pairs=pairsAround(g,lcg(11),60,30);
  assert(compare(g,PathQueue,pairs)>0,'the sample includes budget-limited searches');
});

test('an order into the sea walks to the nearest reachable shore and says so',async()=>{
  const {g,byId,run}=make();const BIOME=run('BIOME');g.newGame(123456);
  const u=g.units.find(p=>p.location.kind==='world');
  let sea=null;for(let x=0;x<g.world.size&&!sea;x++){const t=g.world.tile(x,Math.floor(u.y));if(t.biome==='sea')sea={x,y:Math.floor(u.y)};}
  assert(sea);
  g.assignMove(u,sea.x,sea.y);
  assert(u.path.length>0);
  const end=u.path.at(-1),tile=g.world.tile(Math.floor(end.x),Math.floor(end.y));
  assert(BIOME[tile.biome].walk);
  assert.deepEqual(plain({x:u.task.x,y:u.task.y}),{x:Math.floor(end.x),y:Math.floor(end.y)});
  await Promise.resolve();
  assert.match(byId.message.textContent,new RegExp(`${u.name} va al punto raggiungibile più vicino`));
  for(let i=0;i<600&&u.path.length;i++)g.update(.1);
  assert.equal(u.path.length,0);assert.equal(u.state,'idle');
});

test('a closed area answers at once and the budget knob still works',()=>{
  const {g,run}=make();const PathQueue=run('PathQueue'),Building=run('Building');g.newGame(123456);
  const u=g.units[0],x=Math.floor(u.x)+4,y=Math.floor(u.y)+4;
  for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)if(Math.max(Math.abs(dx),Math.abs(dy))===2)g.buildings.push(new Building('palisade',x+dx,y+dy,0,true));
  g.pathBudget.maxExpansions=3;
  assert.equal(reference(g,PathQueue,u.x,u.y,x,y).capped,true);
  assert.deepEqual(plain(g.findPath(u.x,u.y,x,y,1)),[],'inside a closed ring');
  g.pathBudget.maxLongSettled=0;
  assert.deepEqual(plain(g.findPath(u.x,u.y,x+6,y,1)),[]);assert.equal(g.pathBudget.lastExpansions,3);
});
