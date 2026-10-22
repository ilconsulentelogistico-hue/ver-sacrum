const {test}=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');

test('a free tap selects owned people/buildings and orders the selected group elsewhere',()=>{
  const {g}=make();g.setPaused(true);
  const [first,second]=g.units,base=g.buildings.find(b=>b.type==='base'&&b.owner===0);
  const resource=g.world.resources.find(r=>r.amount>0);
  assert(resource);
  g.pickEntity=()=>second;
  g.rtsContextTap(100,100);
  assert.equal(g.selected,second);
  g.pickEntity=()=>first;
  g.rtsLeftTap(100,100,true);
  assert.deepEqual(Array.from(g.rtsSelectedUnits(),u=>u.id),[second.id,first.id]);
  g.rtsLeftTap(100,100,true);
  assert.deepEqual(Array.from(g.rtsSelectedUnits(),u=>u.id),[second.id]);
  const gathered=[];g.assignGather=(u,r)=>gathered.push([u,r]);
  g.pickEntity=()=>resource;
  g.rtsContextTap(100,100);
  assert.deepEqual(gathered,[[second,resource]]);
  g.pickEntity=()=>base;
  g.rtsContextTap(100,100);
  assert.equal(g.selected,base);
  assert.equal(g.rtsSelectedUnits().length,0);
});

test('the HUD shows free people and orders/builds explain unavailable actions',()=>{
  const {g,byId,orders,builds}=make();g.setPaused(true);
  const order=name=>orders.find(b=>b.dataset.order===name);
  const build=name=>builds.find(b=>b.dataset.build===name);
  assert.equal(byId.idleCountBtn.textContent,'5 liberi');
  assert.equal(byId.pauseNotice.classList.contains('hidden'),true,'paused state belongs in the HUD, not over the map');
  assert.equal(order('move').hidden,true);
  assert.equal(order('gather').hidden,true);
  assert.equal(order('farm').disabled,true);
  assert.match(order('farm').dataset.uiReason,/campo/);
  assert.equal(build('warehouse').disabled,false);
  for(const store of g.communalStores())store.inventory.items.wood=0;
  g.updateUI();
  assert.equal(build('warehouse').disabled,true);
  assert.match(build('warehouse').dataset.uiReason,/legno/);
  g.units[0].task={type:'move'};g.units[0].state='moving';g.updateUI();
  assert.equal(byId.idleCountBtn.textContent,'4 liberi');
});

test('a standing guard order applies to every selected mobilized person',()=>{
  const {g}=make();const [first,second]=g.units;
  first.mobilized=true;second.mobilized=true;
  g.selectOwnedIds([first.id,second.id]);
  assert.equal(g.toggleGroupGuardDuty(),true);
  assert.equal(first.guardDuty,true);
  assert.equal(second.guardDuty,true);
  assert.equal(g.toggleGroupGuardDuty(),true);
  assert.equal(first.guardDuty,false);
  assert.equal(second.guardDuty,false);
});
