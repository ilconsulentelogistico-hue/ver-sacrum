const assert = require('node:assert/strict');
const {test} = require('node:test');
const make = require('./harness.cjs');

test('Casa comune opens Build and chooses the most skilled free builder', () => {
  const e = make(), g = e.g, base = g.buildings.find(b => b.owner === 0 && b.type === 'base');
  const [first, second] = g.units;
  first.skills.construction = 2;
  second.skills.construction = 8;
  for (const u of [first,second]) { u.state = 'idle'; u.mobilized = false; u.inventory.amount = 0; }
  g.selected = base;
  g.updateUI();
  assert(g.contextTabs().includes('build'));
  assert.equal(g.chooseCommunityBuilder().id, second.id);
  assert.equal(e.byId.builderChoiceWrap.hidden, false);
  assert(e.builds.some(b => b.dataset.build === 'road' && b.hidden === false));
  e.byId.builderChoice.onchange({target:{value:first.id}});
  assert.equal(g.chooseCommunityBuilder().id, first.id);
  g.selected = null;
  g.updateUI();
  e.byId.communityBuildBtn.onclick();
  assert.equal(g.selected.id, base.id);
  assert.equal(g.contextPanel, 'build');
  let spot;
  for (let y=4; y<g.world.size-4 && !spot; y++) for (let x=4; x<g.world.size-4; x++) {
    const plan={kind:'single',items:[{type:'road',x,y,crop:null}],builderId:first.id};
    if (!g.validatePendingBuildPlan(plan)) { spot={x,y}; break; }
  }
  assert(spot);
  g.buildMode='road';
  assert.equal(g.stagePendingBuild('road',spot.x,spot.y), true);
  assert.equal(g.pendingBuildPlan.builderId, first.id);
});

test('Relazioni opens from the bar with no manual selection', () => {
  const e = make(), g = e.g, base = g.buildings.find(b => b.owner === 0 && b.type === 'base');
  g.selected = null; g.updateUI();
  assert.equal(e.byId.relationsBarBtn.disabled, false);
  e.byId.relationsBarBtn.onclick();
  assert.equal(g.selected.id, base.id);
  assert.equal(g.contextPanel, 'politicsDialog');
});

test('resource counter opens all goods and counts stored plus carried stock', () => {
  const e = make(), g = e.g;
  g.ensureInventories();
  for (const b of g.buildings) if (b.inventory?.items) b.inventory.items.wood = 0;
  const base = g.buildings.find(b => b.owner === 0 && b.type === 'base');
  base.inventory.items.wood = 7;
  g.units[0].inventory.type = 'wood'; g.units[0].inventory.amount = 3;
  g.updateUI();
  const wood = e.stockCounters.find(b => b.dataset.stockFocus === 'wood');
  assert(wood);
  wood.onclick();
  assert.equal(e.byId.stockPopover.hidden, false);
  assert.equal(e.byId.stockPopover.dataset.focus, 'wood');
  assert.match(e.byId.stockOverview.innerHTML, /legno[\s\S]*?<strong>10<\/strong>/);
  assert.match(e.byId.stockOverview.innerHTML, /ferro/);
  e.byId.stockCloseBtn.onclick();
  assert.equal(e.byId.stockPopover.hidden, true);
});

test('community controls unlock immediately when the founding tutorial ends', () => {
  const e = make(), g = e.g;
  g.startExperienceStage = 'tutorial';
  g.updateUI();
  assert.equal(e.byId.relationsBarBtn.disabled, true);
  g.finishStartExperience();
  assert.equal(e.byId.relationsBarBtn.disabled, false);
  assert.equal(e.stockCounters.find(b => b.dataset.stockFocus === 'wood').disabled, false);
});
