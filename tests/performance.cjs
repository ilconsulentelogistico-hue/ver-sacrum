const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=readFileSync(path.join(__dirname,'..','performance.js'),'utf8');

function load(search){
  class Game{update(){return 'updated'}draw(){return 'drawn'}updateUI(){return 'ui'}}
  const originalUpdate=Game.prototype.update,originalDraw=Game.prototype.draw;
  let now=0,appended=null;const nodes=[];
  const sandbox={Game,location:{search},URLSearchParams,performance:{now:()=>now+=4,memory:{usedJSHeapSize:10485760}},
    navigator:{userAgent:'test-browser'},innerWidth:393,innerHeight:873,devicePixelRatio:2.75,
    document:{createElement:tag=>({tagName:tag,style:{},setAttribute(){},addEventListener(){},textContent:''}),body:{appendChild:node=>{appended??=node;nodes.push(node)}}},
    setInterval(){},setTimeout(){},window:{}};
  vm.runInNewContext(source,sandbox,{filename:'performance.js'});
  return{sandbox,Game,originalUpdate,originalDraw,appended,nodes};
}

test('meter leaves the game loop untouched when disabled',()=>{
  const e=load('');
  assert.equal(e.Game.prototype.update,e.originalUpdate);
  assert.equal(e.Game.prototype.draw,e.originalDraw);
  assert.equal(e.sandbox.window.__terraPerf,undefined);
  assert.equal(e.appended,null);
});

test('enabled meter records frame, update and draw and can reset',()=>{
  const e=load('?perf=1'),g=new e.Game();
  g.world={size:88,resources:[{}]};g.units=[{}];
  for(let i=0;i<5;i++){assert.equal(g.update(.1),'updated');assert.equal(g.draw(),'drawn');assert.equal(g.updateUI(),'ui');}
  const r=e.sandbox.window.__terraPerf.report();
  assert.equal(r.sampleCount,4);
  assert.equal(r.mapTiles,88);
  assert.equal(r.people,1);
  assert(r.frameP95Ms>0&&r.updateP95Ms>0&&r.drawP95Ms>0&&r.uiP95Ms>0);
  assert(r.schedulingGapP95Ms>=0);
  assert.equal(r.jsHeapMiB,10);
  assert.equal(e.sandbox.window.__terraPerf.samples().length,4);
  assert(e.appended.textContent.includes('FPS med'));
  assert.equal(e.nodes[1].textContent,'Copia report FPS');
  const exported=JSON.parse(e.sandbox.window.__terraPerf.exportReport());
  assert.equal(exported.mapTiles,88);
  assert.equal(exported.viewport.width,393);
  assert.equal(exported.browser,'test-browser');
  assert(exported.sampleDurationMs>0);
  e.sandbox.window.__terraPerf.reset();
  assert.equal(e.sandbox.window.__terraPerf.report().sampleCount,0);
});


test('report distinguishes visible people from workers elsewhere',()=>{
  const e=load('?perf=1'),g=new e.Game();e.sandbox.TILE=10;
  g.world={size:100,resources:[]};g.viewW=100;g.viewH=100;g.screenToWorld=(x,y)=>({x,y});
  g.units=[
    {x:5,y:5,health:100,location:{kind:'world'},task:{type:'gather'}},
    {x:50,y:50,health:100,location:{kind:'world'},task:{type:'haul'}},
    {x:5,y:5,health:100,location:{kind:'resident'},task:null},
    {x:15,y:5,health:100,location:{kind:'world'},task:null}
  ];
  g.draw();const report=e.sandbox.window.__terraPerf.report();
  assert.equal(report.people,4);assert.equal(report.peopleVisible,1);assert.equal(report.peopleWorking,2);
  const exported=JSON.parse(e.sandbox.window.__terraPerf.exportReport());
  assert.equal(exported.peopleVisible,1);assert.equal(exported.peopleWorking,2);
});
