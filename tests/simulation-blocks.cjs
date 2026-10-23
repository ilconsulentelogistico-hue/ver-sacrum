const test=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');

test('distant passive actors update in chunks of elapsed time, active work stays continuous',()=>{
  const {g,run}=make();g.newGame(123456);
  const idle=g.units[0],worker=g.units[1],sheep=run("new Animal('sheep',80.5,80.5)");
  idle.x=80.5;idle.y=80.5;idle.task=null;idle.state='idle';
  worker.x=80.5;worker.y=79.5;worker.task={type:'move',x:79,y:79};worker.state='moving';
  g.animals=[sheep];g.raiders=[];
  const calls={idle:[],worker:[],sheep:[]};
  g.updateUnit=(u,dt)=>{if(u===idle)calls.idle.push(dt);if(u===worker)calls.worker.push(dt)};
  g.updateAnimal=(a,dt)=>{if(a===sheep)calls.sheep.push(dt)};
  for(let i=0;i<4;i++)g.updateLiving(.05);
  assert.equal(calls.idle.length,0);assert.equal(calls.sheep.length,0);
  assert.equal(calls.worker.length,4);
  g.updateLiving(.05);
  assert.equal(calls.idle.length,1);assert.equal(calls.sheep.length,1);
  assert(Math.abs(calls.idle[0]-.25)<1e-9);
  assert(Math.abs(calls.sheep[0]-.25)<1e-9);
  g.camera.x=80.5*30;g.camera.y=80.5*30;
  g.updateLiving(.05);
  assert.equal(calls.idle.length,2);assert.equal(calls.sheep.length,2);
  assert(Math.abs(calls.idle[1]-.05)<1e-9);
});

test('a new job does not receive time accumulated while idle',()=>{
  const {g}=make();g.newGame(123456);
  const u=g.units[0];u.x=80.5;u.y=80.5;u.task=null;u.state='idle';
  for(let i=0;i<4;i++)g.updateLiving(.05);
  assert(Math.abs(u._lodPending-.2)<1e-9);
  u.task={type:'move',x:79,y:79};u.state='moving';u.attackCooldown=.5;
  let elapsed=0;g.updateUnit=(person,dt)=>{if(person===u)elapsed=dt};
  g.updateLiving(.05);
  assert(Math.abs(elapsed-.05)<1e-9);
  assert(Math.abs(u.attackCooldown-.3)<1e-9);
  assert.equal(u._lodPending,0);
});

test('danger, targeted animals and production remain at frame frequency',()=>{
  const {g,run}=make();g.newGame(123456);
  const idle=g.units[0],sheep=run("new Animal('sheep',80.5,80.5)"),raider=run('new Raider(81.5,80.5)');
  idle.x=80.5;idle.y=80.5;idle.task=null;idle.state='idle';
  g.animals=[sheep];g.raiders=[raider];g.raidsEnabled=true;g.units[1].task={type:'tame',target:sheep.id};
  const calls={idle:0,sheep:0,raider:0,buildings:0};
  g.updateUnit=(u)=>{if(u===idle)calls.idle++};g.updateAnimal=()=>calls.sheep++;g.updateRaider=()=>calls.raider++;
  g.updateBuilding=()=>calls.buildings++;
  g.setPaused(false);g.update(.05);
  assert.equal(calls.idle,1);assert.equal(calls.sheep,1);assert.equal(calls.raider,1);
  assert.equal(calls.buildings,g.buildings.length);
});

test('pending offscreen time survives save load and does not run during pause',()=>{
  const {g}=make();g.newGame(123456);
  const u=g.units[0];u.x=80.5;u.y=80.5;u.task=null;u.state='idle';
  g.updateLiving(.05);g.updateLiving(.05);
  assert(Math.abs(u._lodPending-.1)<1e-9);
  g.setPaused(true);g.update(.05);assert(Math.abs(u._lodPending-.1)<1e-9);
  assert(g.save(),g.lastSaveError);const id=u.id;
  assert(g.load());const restored=g.units.find(x=>x.id===id);
  assert(Math.abs(restored._lodPending-.1)<1e-9);
  g.setPaused(false);
  let observed=0;const original=g.updateUnit;g.updateUnit=function(person,dt){if(person===restored)observed+=dt;return original.call(this,person,dt)};
  for(let i=0;i<3;i++)g.updateLiving(.05);
  assert(Math.abs(observed-.25)<1e-9);
  assert.equal(restored._lodPending,0);
});


test('large settlements stagger distant passive work while retaining elapsed time',()=>{
  const {g}=make();g.newGame(123456);g.world.size=1024;
  const source=g.units[0];
  g.units=Array.from({length:104},(_,i)=>Object.assign(Object.create(Object.getPrototypeOf(source)),source,{id:`far-${i}`,x:800.5,y:800.5,task:null,state:'idle',_lodPending:0}));
  const perFrame=[];let calls=0,elapsed=0;
  g.updateUnit=(u,dt)=>{calls++;elapsed+=dt};
  for(let i=0;i<8;i++){const before=calls;g.updateLiving(.25/8);perFrame.push(calls-before)}
  assert.equal(calls,13);
  for(let i=0;i<8;i++){const before=calls;g.updateLiving(.016);perFrame.push(calls-before)}
  assert.equal(calls,104);
  assert(perFrame.every(n=>n<104));
  assert(elapsed>=104*.25);
  assert(elapsed<=104*(.25+8*.016));
});


test('actor resource coverage is checked on zone change, not on every frame',()=>{
  const {g}=make();g.newGame(123456);g.world.size=1024;g.raiders=[];g.animals=[];
  let calls=0;g.world.ensureResourceChunksForBounds=()=>{calls++};
  g.updateLiving(.01);const first=calls;assert.equal(first,g.units.length);
  g.updateLiving(.01);assert.equal(calls,first);
  g.units[0].x+=8;g.updateLiving(.01);assert.equal(calls,first+1);
  g._actorResourceCoverageWorld={};g.updateLiving(.01);assert.equal(calls,first+1+g.units.length);
});
