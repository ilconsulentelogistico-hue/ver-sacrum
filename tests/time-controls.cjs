const {test}=require('node:test'),assert=require('node:assert/strict'),make=require('./harness.cjs');

test('touch control cycles through 1×, 2×, 4× and back; invalid speed is rejected',()=>{
  const {g,byId}=make();
  assert.equal(g.timeScale,1);
  byId.speedBtn.onclick();assert.equal(g.timeScale,2);assert.equal(byId.speedBtn.textContent,'Velocità: 2×');
  byId.speedBtn.onclick();assert.equal(g.timeScale,4);
  byId.speedBtn.onclick();assert.equal(g.timeScale,1);
  assert.equal(g.setTimeScale(10),false);assert.equal(g.timeScale,1);
});

test('frame speed scales the whole simulation; paused frames do not advance',()=>{
  const {g}=make();
  const seen=[];g.update=dt=>seen.push(dt);g.draw=()=>{};g.updateUI=()=>{};
  const frame=()=>{g.lastFrame=performance.now()-25;g.loop(performance.now())};
  frame();const normal=seen.at(-1);assert(normal>.015&&normal<.05);
  g.setTimeScale(2);frame();assert(seen.at(-1)>normal*1.5&&seen.at(-1)<normal*2.5);
  g.setTimeScale(4);frame();assert(seen.at(-1)>normal*3&&seen.at(-1)<normal*5);
  // The game update itself still obeys pause even when the loop supplies scaled time.
  const before=g.totalDays;g.setPaused(true);g.update=Object.getPrototypeOf(g).update;frame();assert.equal(g.totalDays,before);
});

test('speed survives a save and load; earlier saves resume at 1×',()=>{
  const {g,storage,byId}=make();g.setTimeScale(4);
  assert(g.save(),g.lastSaveError);g.setTimeScale(2);assert(g.load());
  assert.equal(g.timeScale,4);assert.equal(byId.speedBtn.textContent,'Velocità: 4×');
  const slot='terra-italica-save-v5',old=JSON.parse(storage.get(slot));delete old.timeScale;storage.set(slot,JSON.stringify(old));
  assert(g.load());assert.equal(g.timeScale,1);
  assert.equal(byId.speedBtn.textContent,'Velocità: 1×');
});
