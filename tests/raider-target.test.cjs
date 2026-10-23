const {test}=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');

test('a raider pursues the nearest person in the world and ignores residents inside',()=>{
  const e=make(),g=e.g;
  g.newGame(321);
  const base=g.buildings.find(b=>b.type==='base'&&b.owner===0);
  const raider=e.run(`new Raider(${base.x+12},${base.y},1)`);
  for(let i=0;i<g.units.length;i++){
    g.units[i].x=raider.x+20+i;
    g.units[i].y=raider.y+20;
  }
  const first=g.units[0],second=g.units[1];
  first.x=raider.x+5;first.y=raider.y;
  second.x=raider.x+3;second.y=raider.y;
  const pursued=[];
  g.findPath=(fromX,fromY,toX,toY)=>{pursued.push([toX,toY]);return []};
  g.updateRaider(raider,.1);
  assert.deepEqual(pursued.at(-1),[Math.floor(second.x),Math.floor(second.y)],'closer person is pursued');
  second.location={kind:'house'};
  raider.repath=0;
  g.updateRaider(raider,.1);
  assert.deepEqual(pursued.at(-1),[Math.floor(first.x),Math.floor(first.y)],'resident inside a house is ignored');
  second.location={kind:'world'};
  second.health=0;
  raider.repath=0;
  g.updateRaider(raider,.1);
  assert.deepEqual(pursued.at(-1),[Math.floor(first.x),Math.floor(first.y)],'dead person is ignored');
});
