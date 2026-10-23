const test=require('node:test'),assert=require('node:assert/strict'),make=require('./harness.cjs');
function battle(){const {g}=make([],{neutrals:true});g.newGame(123456);const s=g.neutralSettlement(1),base=s.base,attacker=g.units.find(u=>u.owner===0&&u.location.kind==='world');attacker.mobilized=true;attacker.x=base.x+1.5;attacker.y=base.y;assert(g.beginVillageAssault(attacker,base));g.combatTick(attacker,.85);const defenders=g.units.filter(u=>u.task?.defendSettlementId===base.id);assert.equal(defenders.length,2);return{g,s,base,attacker,defenders};}
test('military surrender requires beaten real defenders and a nearby mobilized attacker; people and stores persist',()=>{const{g,s,base,attacker,defenders}=battle(),ids=s.people.map(u=>u.id),buildings=g.buildings.filter(b=>b.owner===1),stocks=buildings.map(b=>[b.id,JSON.stringify(b.inventory.items)]);assert.equal(g.demandVillageSurrender(base,'too-early').ok,false);defenders[0].skills.farming=6;for(const u of defenders){u.health=25;g.combatTick(u,.85);}g.combatTick(attacker,.85);g.combatTick(attacker,.85);assert.equal(base.siegeReadyDay,g.totalDays);assert.match(g.selectionHTML(base),/demandVillageSurrender/);attacker.x=base.x+10;assert.equal(g.demandVillageSurrender(base,'too-far').ok,false);attacker.x=base.x+1.5;const result=g.demandVillageSurrender(base,'military-1');assert(result.ok);assert.equal(g.demandVillageSurrender(base,'military-1').replayed,true);assert.equal(base.integrationMode,'military');assert.equal(base.owner,0);assert.equal(g.neutralSettlement(1),null);assert(g.units.filter(u=>ids.includes(u.id)).every(u=>u.owner===0));assert.equal(g.units.find(u=>u.id===defenders[0].id).skills.farming,6);assert.deepEqual(buildings.map(b=>[b.id,JSON.stringify(b.inventory.items)]),stocks);assert(g.save());assert(g.load());assert.equal(g.buildings.find(b=>b.id===base.id).integrationMode,'military');assert.equal(g.buildings.filter(b=>b.owner===1).length,0);assert.equal(g.units.filter(u=>ids.includes(u.id)).length,ids.length);});
test('permanent neutral villages cannot surrender militarily',()=>{const{g}=make([],{neutrals:true}),base=g.neutralSettlement(3).base;assert.equal(g.demandVillageSurrender(base,'fixed').ok,false);assert.equal(base.owner,3);});

test('assault in transit saves before defenders are called',()=>{const {g}=make([],{neutrals:true});g.newGame(123456);const base=g.neutralSettlement(1).base,u=g.units.find(x=>x.owner===0&&x.location.kind==='world');u.mobilized=true;u.x=base.x+1.5;u.y=base.y;assert(g.beginVillageAssault(u,base));assert.equal(base.siegeDefenderIds,null);assert(g.save());assert(g.load());assert.equal(g.units.find(x=>x.id===u.id).task?.siege,true);assert.equal(g.neutralSettlement(1).base.siegeDefenderIds,null);});

test('four original youths march from their camp and win a real military surrender after reload',()=>{
  const {g}=make([],{neutrals:true});g.beginStartSelection(123456);assert(g.chooseStartLocation(0));g.finishStartExperience();
  const target=g.neutralSettlement(1).base,baseId=target.id,peopleIds=g.neutralSettlement(1).people.map(u=>u.id);
  assert(g.focusSettlement(1));
  const fighters=g.playerPeopleAlive().slice(0,4),fighterIds=fighters.map(u=>u.id);
  assert(fighters.every(u=>g.mobilizePerson(u.id)));
  assert(fighters.every(u=>g.beginVillageAssault(u,target)));
  for(let i=0;i<12;i++)g.update(.85);
  assert(g.save());assert(g.load());g.setPaused(false);
  assert(fighterIds.every(id=>g.units.find(u=>u.id===id)?.task?.type==='attack'));
  let ready=null;for(let i=0;i<110&&!Number.isFinite(ready);i++){g.update(.85);ready=g.buildings.find(b=>b.id===baseId)?.siegeReadyDay;}
  assert(Number.isFinite(ready),'real defenders yield after combat');
  const liveBase=g.buildings.find(b=>b.id===baseId),before=g.units.filter(u=>peopleIds.includes(u.id)).map(u=>[u.id,u.name,{...u.skills}]);
  const result=g.demandVillageSurrender(liveBase,'natural-surrender');assert(result.ok,result.error);
  assert.equal(liveBase.integrationMode,'military');assert.equal(liveBase.owner,0);
  assert(g.units.filter(u=>peopleIds.includes(u.id)).every(u=>u.owner===0));
  assert.equal(g.units.filter(u=>peopleIds.includes(u.id)).map(u=>u.id).join(','),before.map(p=>p[0]).join(','));
  assert(g.save());assert(g.load());assert.equal(g.buildings.find(b=>b.id===baseId).integrationMode,'military');
});
