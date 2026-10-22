const assert=require('node:assert/strict');
const make=require('./harness.cjs');
const ev=(id,x,y)=>({pointerId:id,clientX:x,clientY:y,preventDefault(){}});
function setup(){const e=make();e.g.camera={x:1200,y:1200,zoom:1};e.g.paused=true;e.byId.touchModifier.listeners.pointerdown[0]({...ev(99,0,0),stopPropagation(){}});return e;}
{
 const {g}=setup();g.pointerDown(ev(1,190,300));const anchor=g.screenToWorld(190,300);g.pointerMove(ev(1,400,450));
 const u=g.units[0];u.x=(1200+195+150)/30;u.y=(1200+100)/30;assert(g.worldToScreen(u.x*30,u.y*30).x>g.viewW);
 for(let i=0;i<20;i++)g.rtsScrollSelection(.05);
 assert.equal(g.camera.x,1500);assert.equal(g.camera.y,1200);
 const start=g.screenToWorld(g.rtsSelectionBox.startX,g.rtsSelectionBox.startY);assert.equal(start.x,anchor.x);assert.equal(start.y,anchor.y);
 g.pointerUp(ev(1,400,450));assert(g.rtsSelectedUnits().includes(u),'selection includes initially off-screen unit');
 const x=g.camera.x;g.rtsScrollSelection(.05);assert.equal(g.camera.x,x);
}
{
 const {g,byId}=setup();g.pointerDown(ev(1,200,300));g.pointerMove(ev(1,-5,-5));g.rtsScrollSelection(.05);assert.equal(g.camera.x,1185);assert.equal(g.camera.y,1185);
 byId.touchModifier.listeners.pointerup[0]({...ev(99,0,0),stopPropagation(){}});g.pointerDown(ev(2,100,100));const x=g.camera.x;g.rtsScrollSelection(.05);assert.equal(g.camera.x,x);assert.equal(g.rtsSelectionBox,null);
 g.pointerCancel();byId.touchModifier.listeners.pointerdown[0]({...ev(99,0,0),stopPropagation(){}});g.pointerDown(ev(3,200,300));g.pointerMove(ev(3,200,610));const y=g.camera.y;g.rtsScrollSelection(.05);assert.equal(g.camera.y,y,'bottom edge does not scroll');
 g.pointerCancel();g.pointerDown(ev(4,200,300));g.pointerMove(ev(4,-10,-10));g.camera.x=195;g.camera.y=300;g.rtsScrollSelection(.05);assert.equal(g.camera.x,195);assert.equal(g.camera.y,300);
}
console.log('PASS selection auto-scroll: world anchor, offscreen units, left/right/top, pause, release, pinch, bottom exclusion and map bounds.');
