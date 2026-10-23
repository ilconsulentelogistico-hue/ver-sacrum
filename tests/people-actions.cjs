const {test}=require("node:test"),assert=require("node:assert/strict"),make=require("./harness.cjs");
const setup=()=>{const e=make([],{neutrals:true});e.g.gameMode="confederation";e.g.newGame(123456);return e;};
test("Impara da… proposes the master of the current job, then the largest gap",()=>{
  const {g,byId}=setup();const [u,a,b]=g.units.filter(p=>p.owner===0);
  a.skills.construction=6;b.skills.wood=4;
  let best=g.bestMentorFor(u);assert.equal(best.mentor,a);assert.equal(best.skill,"construction");
  const tree=g.world.resources.find(r=>r.type==="wood"&&r.amount>0);u.task={type:"gather",target:tree.id};
  best=g.bestMentorFor(u);assert.equal(best.mentor,b,"the job comes first");assert.equal(best.job,true);
  assert(g.openSkills(u.id));
  assert.match(byId.skillsSuggestion.textContent,/Nel lavoro che sta facendo: .*taglio 4/);
  assert.equal(byId.learnFromBest.hidden,false);assert.equal(byId.learnFromBest.textContent,`Impara da ${b.name}`);
  assert.equal(g.learnFromBest(u.id),null);assert.equal(u.mentorId,b.id);
  g.renderSkills();assert.equal(byId.learnFromBest.hidden,true);assert.match(byId.skillsSuggestion.textContent,/già il suo maestro/);
});
test("nobody two levels ahead means no proposal",()=>{
  const {g,byId}=setup();const u=g.units.find(p=>p.owner===0);
  assert.equal(g.bestMentorFor(u),null);g.openSkills(u.id);assert.equal(byId.learnFromBest.hidden,true);
  assert.match(g.learnFromBest(u.id),/due livelli/);
});
test("a tower assigns its own sentinel among nearby enlisted people",()=>{
  const {g,run}=setup();const base=g.buildings.find(b=>b.owner===0&&b.type==="base");
  const tower=run(`new Building("tower",${Math.floor(base.x)+4},${Math.floor(base.y)+3},0,true)`);g.buildings.push(tower);g.ensureInventories();
  assert.match(g.selectionHTML(tower),/Serve una persona arruolata/);
  const u=g.units.find(p=>p.owner===0);u.mobilized=true;
  assert.match(g.selectionHTML(tower),/data-assign-sentinel/);
  const r=g.assignSentinelTo(tower.id);assert(r.ok,r.error);
  assert.equal(r.person.guardDuty,true);assert.equal(r.person.guardPostId,tower.id);
  assert.match(g.selectionHTML(tower),new RegExp(`Sentinella: ${r.person.name}`));
  assert.equal(g.assignSentinelTo(tower.id).ok,false);
});
