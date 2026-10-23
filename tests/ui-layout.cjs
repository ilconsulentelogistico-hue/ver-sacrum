const test=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');

test('a District shows one house per resident',()=>{
  const {g,run}=make();g.newGame(123456);const Building=run('Building');
  const house=new Building('house',30.5,30.5,0,true);g.buildings.push(house);
  const people=[];g.villagePeople=()=>people;
  assert.equal(g.villageHouseSlots(house).length,0);
  people.push({});assert.equal(g.villageHouseSlots(house).length,1);
  people.push({},{},{},{});assert.equal(g.villageHouseSlots(house).length,5);
  const slots=g.villageHouseSlots(house);
  assert.equal(new Set(slots.map(s=>`${s.x},${s.y}`)).size,5,'every house has its own tile');
});

test('recentring puts the target in the middle of the map left visible by the panels',()=>{
  const {g,run}=make();g.newGame(123456);const TILE=run('TILE');
  const base=g.buildings.find(b=>b.type==='base');
  g.measurePanels=()=>({top:80,bottom:300,right:0,left:0});
  g.centerOnBase();
  assert.equal(g.camera.x,base.x*TILE);
  assert.equal(g.camera.y,base.y*TILE+(300-80)/2/g.camera.zoom);
  g.measurePanels=()=>({top:50,bottom:0,right:380,left:0});
  g.centerOnBase();
  assert.equal(g.camera.x,base.x*TILE+380/2/g.camera.zoom);
  // Without panels nothing moves: the map stays where the game put it.
  g.measurePanels=()=>({top:0,bottom:0,right:0,left:0});
  g.centerOnBase();assert.equal(g.camera.x,base.x*TILE);assert.equal(g.camera.y,base.y*TILE);
});

test('PC: the wheel zooms around the cursor and the keys pan, pause and cancel',()=>{
  const {g}=make();g.newGame(123456);
  const before=g.screenToWorld(120,90),zoom=g.camera.zoom;
  g.wheelZoom(120,90,-240);
  assert(g.camera.zoom>zoom);
  const after=g.screenToWorld(120,90);
  assert(Math.abs(after.x-before.x)<1e-6&&Math.abs(after.y-before.y)<1e-6,'the point under the cursor stays still');
  g.wheelZoom(120,90,1e6);assert.equal(g.camera.zoom,.48);
  const x=g.camera.x;assert.equal(g.handleShortcut({key:'ArrowRight',target:{tagName:'CANVAS'}}),true);assert(g.camera.x>x);
  assert.equal(g.handleShortcut({key:'d',target:{tagName:'INPUT'}}),false,'typing in a field is not a shortcut');
  g.actionWheel={target:null,actions:[]};assert.equal(g.handleShortcut({key:'Escape',target:{}}),true);assert.equal(g.actionWheel,null);
});

test('the panel shrinks to its title and opens again',()=>{
  const {g,byId}=make();g.newGame(123456);
  g.setDockCollapsed(true);
  assert.equal(byId.commandDock.classList.contains('collapsed'),true);assert.equal(byId.dockCollapse.textContent,'▴');
  g.setDockCollapsed(false);
  assert.equal(byId.commandDock.classList.contains('collapsed'),false);assert.equal(byId.dockCollapse.textContent,'▾');
});
