const {test}=require('node:test'),assert=require('node:assert/strict'),make=require('./harness.cjs');

test('the starting five are novice youths whose identity survives work and reload',()=>{
  const {g,byId}=make();g.newGame(321);assert.equal(g.units.length,5);
  const founder=g.units[0],id=founder.id;
  for(const u of g.units){assert.equal(u.origin,'ver-sacrum-youth');assert(Object.values(u.skills).every(level=>level===1));}
  founder.gain('wood',21);g.cancelTask(founder);
  assert(g.openCharacter(id));assert.match(byId.characterIdentity.textContent,/Partito giovane nel Ver Sacrum/);
  assert(g.openSkills(id));assert.match(byId.skillsIdentity.textContent,/Partito giovane nel Ver Sacrum/);
  assert(g.save(),g.lastSaveError);assert(g.load());const loaded=g.units.find(u=>u.id===id);
  assert.equal(loaded.origin,'ver-sacrum-youth');assert.equal(loaded.skills.wood,2);assert.equal(loaded.xp.wood,1);
});

test('later people and older saves do not gain an invented founder history',()=>{
  const {g,run,storage}=make(),newcomer=run("new Unit('Nuovo',40.5,40.5,game.rng)");
  assert.equal(newcomer.origin,'ordinary');
  assert(g.save());const key='terra-italica-save-v5',record=JSON.parse(storage.get(key));
  for(const u of record.units)delete u.origin;storage.set(key,JSON.stringify(record));
  assert(g.load());assert(g.units.every(u=>u.origin==='ordinary'));
});
