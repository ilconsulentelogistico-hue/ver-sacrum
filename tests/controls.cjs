const assert=require('node:assert/strict');
const {g,sandbox,storage,byId,tabs,orders,builds}=require('./harness.cjs')();
g.paused=true;
tabs.find(t=>t.dataset.panel==='orders').onclick();assert(byId.orders.classList.contains('active'));assert(!byId.world.classList.contains('active'));
const [a,b]=g.units;g.groupSelection=[a,b];g.selected=a;
let rings=0;g.selectionRing=()=>rings++;g.drawHuman(a,false);g.drawHuman(b,false);assert.equal(rings,2,'both PNG units must display selection rings');
const ev=(id,x,y)=>({pointerId:id,clientX:x,clientY:y,preventDefault(){}});
g.screenToWorld=(x,y)=>({x:x*30,y:y*30});
orders.find(o=>o.dataset.order==='move').onclick();g.rtsLeftTap(42,42);assert.equal(a.task.type,'move');assert.equal(b.task.type,'move');assert.equal(g.selected,a);assert.equal(g.orderMode,null);
orders.find(o=>o.dataset.order==='cancel').onclick();assert.equal(a.task,null);assert.equal(b.task,null);
g.pointerDown(ev(1,50,50));g.pointerCancel();g.pointerUp(ev(1,50,50));assert.equal(a.task,null);assert.equal(g.rtsGesture,null);
g.worldToScreen=(x,y)=>({x,y});g.rtsFinishBoxSelection({startX:0,startY:0,x:10000,y:10000});assert.equal(g.rtsSelectedUnits().length,5);
g.save();const old=g.units[0];assert(g.load());assert(!g.rtsSelectedUnits().includes(old));assert.equal(g.rtsSelectedUnits().length,5);
g.groupSelection=[...g.units];g.newGame(123);assert.equal(g.groupSelection.length,0);assert.equal(g.rtsSelectedUnits().length,1);
console.log('PASS: unique IDs, contextual Orders tab, PNG group rings, group orders/cancel, pointer cancellation, box selection, load/new-game selection reset.');

