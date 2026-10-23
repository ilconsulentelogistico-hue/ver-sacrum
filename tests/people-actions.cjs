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
test("the community list separates «Fai uscire» from «Arruola»",()=>{
  // Same flat world and district as tests/community.cjs.
  const e=make(),g=e.g;g.newGame(321);g.raiders=[];g.animals=[];for(const t of g.world.tiles){t.biome='grass';t.z=0;}
  const house=e.run("(()=>{const b=new Building('house',45,45,0,true);game.buildings.push(b);game.ensureInventories();return b})()");
  const u=g.units.find(p=>p.owner===0);g.enterResident(u,house);
  assert.equal(u.location.kind,"resident");
  assert.match(g.communityActionsHTML(u),/data-community="exit"[^>]*>Fai uscire/);
  assert.match(g.communityActionsHTML(u),/data-community="mobilize"[^>]*>Arruola/);
  assert.match(g.selectionHTML(u),/data-person-action="exit"/);
  assert(g.personAction("exit",u.id));
  assert.equal(u.location.kind,"world");assert.equal(u.mobilized,false);
  assert.match(g.communityActionsHTML(u),/>Arruola</);assert.doesNotMatch(g.communityActionsHTML(u),/Fai uscire/);
  assert(g.personAction("mobilize",u.id));assert.equal(u.mobilized,true);
  assert.match(g.communityActionsHTML(u),/>Congeda</);
});
test("a transport picks its start and end by touching buildings on the map",()=>{
  const {g,byId}=setup();
  const base=g.buildings.find(b=>b.owner===0&&b.type==="base"),store=g.buildings.find(b=>b.owner===0&&b.type==="warehouse");
  assert(g.startRoutePick("source"));
  assert.equal(g.pickRouteAt({x:store.x,y:store.y}),true);
  assert.equal(byId.sourceSelect.value,store.id);
  g.startRoutePick("destination");g.pickRouteAt({x:base.x,y:base.y});
  assert.equal(byId.destinationSelect.value,base.id);assert.equal(g.routePick,null);
  g.startRoutePick("destination");g.pickRouteAt({x:2.5,y:2.5});
  assert.equal(byId.destinationSelect.value,base.id,"an empty spot keeps the previous choice");
});
