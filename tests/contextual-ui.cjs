const {test}=require('node:test'),assert=require('node:assert/strict');
const make=require('./harness.cjs'),fixture=require('./economy-fixture.cjs');
test('empty selection collapses dock; owned unit offers orders and construction, foreign unit does not',()=>{
 const {g,byId}=make();g.selected=g.units[0];g.updateUI();assert(!byId.commandDock.hidden);assert(!byId['tab-build'].hidden);assert(byId['tab-linksDialog'].hidden);
 byId.clearSelection.onclick();assert(byId.commandDock.hidden);assert.equal(g.selected,null);
 g.selected=g.units[0];g.selected.owner=1;g.updateUI();assert(byId['tab-orders'].hidden);assert(byId['tab-build'].hidden);
});
test('one panel at a time; map selection closes stale editor without moving items',()=>{
 const {g,byId}=make();g.selected=g.units[0];g.updateUI();byId['tab-characterDialog'].onclick();assert.equal(g.contextPanel,'characterDialog');assert(!byId.characterDialog.hidden);assert(byId.overview.hidden);assert.equal(g.paused,false);
 const gear=JSON.stringify(g.gear);g.selected=g.units[1];g.updateUI();assert(byId.characterDialog.hidden);assert.equal(g.contextPanel,'overview');assert.equal(g.characterPersonId,null);assert.equal(JSON.stringify(g.gear),gear);
});
test('group has collective orders and no single-person editor',()=>{
 const {g,byId}=make();g.selected=g.units[0];g.groupSelection=g.units.slice(0,2);g.updateUI();assert(!byId['tab-orders'].hidden);assert(byId['tab-characterDialog'].hidden);assert.match(byId.selectionCard.innerHTML,/2 abitanti/);
});
test('warehouse editor stays scoped and edits survive periodic UI refresh',()=>{
 const {g,w,a,byId}=fixture();g.selected=w;g.updateUI();byId['tab-linksDialog'].onclick();assert.equal(g.linkFocus,w.id);assert.equal(byId.linkBuilding.disabled,true);byId.linkKeep.value='123';g.updateUI();assert.equal(byId.linkKeep.value,'123');assert.equal(g.contextPanel,'linksDialog');assert.equal(g.paused,false);
 byId['tab-logisticsDialog'].onclick();assert.equal(byId.sourceSelect.value,w.id);assert.equal(byId.sourceSelect.disabled,true);assert(byId.productionForm.hidden);assert(!byId.inventoryList.innerHTML.includes(`Mercato (${Math.floor(a.x)}`));
});
test('village lists its domiciled people and food, not other village residents',()=>{
 const e=fixture(),{g,byId}=e;const village=e.add('house',8,8),other=e.add('house',14,8);g.enterResident(g.units[0],village);g.enterResident(g.units[1],other);g.selected=village;g.updateUI();byId['tab-communityDialog'].onclick();assert.match(byId.communityRoster.innerHTML,new RegExp(g.units[0].id));assert(!byId.communityRoster.innerHTML.includes(g.units[1].id));assert.match(byId.populationSummary.textContent,/Popolazione 1/);
});
test('market caravan starts from selected market; factory offers its own production settings',()=>{
 const e=fixture(),{g,a,byId}=e;g.selected=a;g.updateUI();byId['tab-tradeDialog'].onclick();assert.equal(byId.tradeSource.value,a.id);assert.equal(byId.tradeSource.disabled,true);assert.equal(g.paused,false);
 const f=e.add('sawmill',8,2);g.selected=f;g.updateUI();byId['tab-logisticsDialog'].onclick();assert.equal(byId.factorySelect.value,f.id);assert(!byId.productionForm.hidden);byId['tab-linksDialog'].onclick();assert.equal(g.linkFocus,f.id);assert(!byId.factoryPolicy.hidden);
});
test('build tool cancel clears ghost and mode without deselecting builder',()=>{
 const {g,byId,builds}=make();const u=g.selected;byId['tab-build'].onclick();builds[1].onclick();g.updateUI();assert(!byId.placementStatus.hidden);byId.cancelPlacement.onclick();assert.equal(g.buildMode,null);assert.equal(g.buildPreview,null);assert.equal(g.selected,u);
});
