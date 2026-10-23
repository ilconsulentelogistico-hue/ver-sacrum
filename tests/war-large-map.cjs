const {test}=require("node:test"),assert=require("node:assert/strict"),make=require("./harness.cjs");

function broadGame(seed,place){
  const {g}=make([],{neutrals:true});
  g.beginStartSelection(seed);
  assert(g.chooseStartWorldSize(256));
  assert(g.chooseStartMode("confederation"));
  assert(g.chooseStartLocation(place));
  g.finishStartExperience();
  return g;
}

test("all three camps on a broad map are within marching range and reachable",()=>{
  for(const [seed,place] of [[654321,1],[24680,0]]){
    const g=broadGame(seed,place),base=g.buildings.find(b=>b.owner===0&&b.type==="base");
    assert.equal(g.warCamps.length,3);
    for(const camp of g.warCamps){
      const distance=Math.hypot(camp.x-base.x,camp.y-base.y);
      assert(distance>=18&&distance<=50,`seed ${seed}: camp ${distance.toFixed(1)} tiles away`);
      assert((g.pathToBuilding({x:camp.x,y:camp.y},base)||[]).length>0,`seed ${seed}: camp can march to village`);
    }
  }
});

test("a raider follows its long route without searching again every frame",()=>{
  const g=broadGame(654321,1);g.spawnRaid();const raider=g.raiders[0];
  let searches=0;const findPath=g.findPath;
  g.findPath=function(...args){searches++;return findPath.apply(this,args)};
  g.updateRaider(raider,.1);
  assert(raider.path.length>10,"the first route crosses real terrain");
  const before=searches,start={x:raider.x,y:raider.y};
  for(let i=0;i<3;i++)g.updateRaider(raider,2);
  assert.equal(searches,before,"distant target keeps the existing route");
  const travelled=Math.hypot(raider.x-start.x,raider.y-start.y);
  assert(travelled>0&&travelled<=raider.speed*6+.01,"raider moves physically at its own speed");
});
