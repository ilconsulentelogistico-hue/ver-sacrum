const assert=require('node:assert/strict');
const make=require('./harness.cjs');
let count=0;
function test(name,fn){fn();console.log('PASS',name);count++;}
function setup(){const e=make(),g=e.g;g.newGame(321);g.raiders=[];g.animals=[];for(const t of g.world.tiles){t.biome='grass';t.z=0;}e.b=e.run("(()=>{const b=new Building('house',45,45,0,true);game.buildings.push(b);game.ensureInventories();return b})()");return e;}
test('counts partition living people by duty, residency is separate',()=>{
 const e=setup(),g=e.g;g.enterResident(g.units[0],e.b);g.mobilizePerson(g.units[1].id);g.assignMove(g.units[2],50,50);g.units[4].health=0;
 assert.deepEqual(JSON.parse(JSON.stringify(g.communityCounts())),{total:4,residents:1,occupied:1,available:2,mobilized:1});
});
test('mobilization transfers the exact person, cargo and skills, double tap is inert',()=>{
 const e=setup(),g=e.g,u=g.units[0];u.inventory={type:'grain',amount:4,cap:15};u.health=61;g.enterResident(u,e.b);const before=JSON.stringify([u.id,u.skills,u.inventory,u.health]);
 assert(g.mobilizePerson(u.id));assert(!g.mobilizePerson(u.id));assert.equal(g.units.length,5);assert.equal(g.units[0],u);assert.equal(e.b.residents.length,0);assert.equal(JSON.stringify([u.id,u.skills,u.inventory,u.health]),before);
 assert(g.save());assert(g.load());assert.equal(g.units[0].mobilized,true);assert.equal(g.units[0].id,u.id);
});
test('blocked exit does not mobilize or remove the resident',()=>{
 const e=setup(),g=e.g,u=g.units[0];g.enterResident(u,e.b);g.findResidentExit=()=>null;assert(!g.mobilizePerson(u.id));assert.equal(u.mobilized,false);assert.equal(u.location.kind,'resident');assert.equal(e.b.residents.length,1);
});
test('busy and dead people cannot be mobilized; returning home demobilizes',()=>{
 const e=setup(),g=e.g,u=g.units[0];g.assignMove(u,50,50);assert(!g.mobilizePerson(u.id));g.cancelTask(u);assert(g.mobilizePerson(u.id));g.enterResident(u,e.b);assert(!u.mobilized);assert(!g.enterResident(u,e.b));assert.equal(e.b.residents.length,1);u.health=0;assert(!g.mobilizePerson(u.id));
});
test('demobilization cancels work, preserves physical cargo and cannot duplicate people',()=>{
 const e=setup(),g=e.g,u=g.units[0];g.mobilizePerson(u.id);g.assignMove(u,50,50);u.inventory={type:'wood',amount:6,cap:15};assert(g.demobilizePerson(u.id));assert(!g.demobilizePerson(u.id));assert.equal(u.task,null);assert.equal(u.inventory.amount,6);assert.equal(u.location.kind,'world');assert.equal(g.communityCounts().available,5);
});
test('old v5 saves without duty fields load conservatively',()=>{
 const e=setup(),d=JSON.parse(JSON.stringify(e.g.snapshot()));for(const u of d.units)delete u.mobilized;e.storage.set('terra-italica-save-v5',JSON.stringify(d));assert(e.g.load());assert(e.g.units.every(u=>u.mobilized===false));
});
test('invalid mobilization cannot replace live state',()=>{
 const e=setup(),u=e.g.units[0];e.g.enterResident(u,e.b);const d=JSON.parse(JSON.stringify(e.g.snapshot()));d.units[0].mobilized=true;e.storage.set('terra-italica-save-v5',JSON.stringify(d));assert(!e.g.load());assert.equal(e.g.units[0],u);
});
test('inline event flow mobilizes by ID and preserves background pause',()=>{
 const e=setup(),g=e.g,u=g.units[0];g.enterResident(u,e.b);g.setPaused(false);assert.match(e.byId.people.innerHTML,/data-open-community/);
 e.byId.people.listeners.click[0]({target:{closest:()=>({})}});assert(e.byId.communityDialog.open);assert.equal(g.paused,false);assert.match(e.byId.communityRoster.innerHTML,new RegExp(u.id));
 e.byId.communityRoster.listeners.click[0]({target:{closest:()=>({dataset:{community:'mobilize',id:u.id}})}});assert(u.mobilized);assert.match(e.byId.communitySummary.textContent,/1 mobilitati/);
 g.suspend();g.resumeFromBackground();g.closeManagement();assert(g.paused);
});
test('selecting a resident clears world selection and building never assigns hidden workers',()=>{
 const e=setup(),g=e.g,u=g.units[0];g.enterResident(u,e.b);assert(g.selectCommunityPerson(u.id));assert.equal(g.selected,u);assert.equal(g.groupSelection.length,0);assert.equal(g.lastSelectedUnit,null);g.placeBuild('farm',52,52);assert.equal(u.task,null);assert(g.save());
});
console.log(`${count} community regressions passed.`);

