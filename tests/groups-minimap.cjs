const test=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');

test('control groups store unique owned living world identities',()=>{
  const {g}=make([],{neutrals:true}),a=g.units.find(u=>u.owner===0),foreign=g.units.find(u=>u.owner>0);
  g.groupSelection=[a,foreign,a];a.selected=foreign.selected=true;
  assert.deepEqual(Array.from(g.saveControlGroup(1)),[a.id]);assert.deepEqual(Array.from(g.savedGroups['1']),[a.id]);
});

test('recall prunes dead foreign and resident IDs; second recall centers camera',()=>{
  const {g}=make([],{neutrals:true}),a=g.units.find(u=>u.owner===0&&u.location.kind==='world'),foreign=g.units.find(u=>u.owner>0);
  g.savedGroups={1:[a.id,foreign.id,'missing']};g.camera.x=0;g.camera.y=0;
  assert.deepEqual(Array.from(g.recallControlGroup(1,100),u=>u.id),[a.id]);assert.notEqual(g.camera.x,a.x*30);
  g.recallControlGroup(1,500);assert.equal(g.camera.x,a.x*30);assert.equal(g.camera.y,a.y*30);
  a.location={kind:'resident',settlementId:'house'};assert.equal(g.recallControlGroup(1,1200).length,0);
});

test('next and all idle select only living owned people on the map',()=>{
  const {g}=make([],{neutrals:true}),owned=g.units.filter(u=>u.owner===0&&u.location.kind==='world');
  owned[1].task={type:'move'};owned[1].state='moving';owned[2].health=0;
  const idle=g.idlePeople();assert(idle.length>0);assert(idle.every(u=>u.owner===0&&u.health>0&&!u.task&&u.location.kind==='world'));g.selectOwnedIds([]);
  assert.equal(g.selectNextIdle().id,idle[0].id);assert.deepEqual(Array.from(g.selectAllIdle(),u=>u.id),Array.from(idle,u=>u.id));
});

test('groups survive snapshot and reload without copying people',()=>{
  const {g,storage}=make(),ids=Array.from(g.units.slice(0,2),u=>u.id);g.selectOwnedIds(ids);g.saveControlGroup(2);assert(g.save());
  const {g:loaded}=make([...storage]);assert(loaded.load());assert.deepEqual(Array.from(loaded.savedGroups['2']),ids);assert.equal(new Set(loaded.units.map(u=>u.id)).size,loaded.units.length);
});

test('minimap navigation clamps camera to world bounds',()=>{
  const {g}=make();g.centerFromMinimap(-100,-100);assert.equal(g.camera.x,0);assert.equal(g.camera.y,0);
  g.centerFromMinimap(10000,10000);assert.equal(g.camera.x,88*30);assert.equal(g.camera.y,88*30);
  g.centerFromMinimap(195,300);assert.equal(g.camera.x,44*30);assert.equal(g.camera.y,44*30);
});

test('minimap pointer handling stops propagation and issues no orders',()=>{
  const {g,byId}=make(),m=byId.minimap;let stopped=0,prevented=0,orders=0;g.issueOrder=()=>orders++;
  const e={pointerId:7,clientX:100,clientY:120,stopPropagation(){stopped++},preventDefault(){prevented++}};
  for(const fn of m.listeners.pointerdown)fn(e);for(const fn of m.listeners.pointermove)fn({...e,clientX:110});for(const fn of m.listeners.pointerup)fn(e);
  assert.equal(orders,0);assert.equal(stopped,3);assert.equal(prevented,3);
});

test('group controls recall without issuing contextual orders',()=>{
  const {g,byId}=make();let orders=0;g.issueOrder=()=>orders++;g.selectOwnedIds([g.units[0].id]);g.saveControlGroup(3);byId.group3Btn.onclick();assert.equal(orders,0);assert.equal(g.selected.id,g.units[0].id);
});

test('invalid saved group schema is rejected before live state changes',()=>{
  const first=make(),before=first.g.units.map(u=>u.id);const d=first.g.snapshot();d.savedGroups={4:[before[0]]};first.storage.set('terra-italica-save-v5',JSON.stringify(d));
  assert.equal(first.g.load(),false);assert.deepEqual(first.g.units.map(u=>u.id),before);
});
