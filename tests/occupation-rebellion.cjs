const test=require("node:test"),assert=require("node:assert/strict"),make=require("./harness.cjs");
function conquered(seed=123456){const e=make([],{neutrals:true}),g=e.g;if(seed)g.newGame(seed);g.ensurePolitics();const original=g.neutralSettlement(1);const buildings=g.buildings.filter(b=>b.owner===1),people=[...original.people];assert(g.transferNeutralSettlement(1,"military-surrender","revolt-test").ok);return{...e,g,base:original.base,buildings,people};}
test("after warning, real revolt restores only proven community people and property without duplication",()=>{
 const{g,base,buildings,people,byId,run}=conquered(),ids=people.map(u=>u.id),stores=buildings.map(b=>[b.id,JSON.stringify(b.inventory.items)]);
 const playerStore=g.buildings.find(b=>b.owner===0&&b.type==="warehouse"&&!b.integrationOriginOwner);playerStore.x=base.x+3;playerStore.y=base.y+3;playerStore.inventory.items.wood=3;
 const house=buildings.find(b=>b.type==="house"),playerHouse=run("new Building(\"house\",10,10,0,true)"),player=g.units.find(u=>u.owner===0&&!u.neutralSettlementId&&u.location.kind==="world");assert(player&&playerHouse);g.buildings.push(playerHouse);g.ensureInventories();g.enterResident(player,house);assert.equal(player.location.kind,"resident");
 if(people[1].location.kind!=="resident")g.enterResident(people[1],house);assert(g.releaseResident(people[1].id,house));g.enterResident(people[1],playerHouse);assert.equal(people[1].location.kind,"resident");
 const animal=g.animals.find(a=>a.owner===-1);animal.owner=0;animal.integrationOriginOwner=1;
 people[0].skills.farming=8;people[0].inventory.type="wood";people[0].inventory.amount=2;
 base.occupationSinceDay=0;for(const u of people){u.communityTrust=0;u.hungry=false;u.fedUntil=0;}g.totalDays=90;g.occupationDay();assert.equal(base.unrestSinceDay,90);
 g.totalDays=179;assert.equal(g.triggerVillageRebellion(base),false);g.totalDays=180;g.occupationDay();
 assert.equal(base.owner,1);assert.equal(base.integratedFromOwner,undefined);assert.equal(base.rebelledDay,180);assert.equal(base.relationship,"hostile");assert.equal(g.neutralSettlement(1).base.id,base.id);
 assert(buildings.every(b=>b.owner===1));assert.deepEqual(buildings.map(b=>[b.id,JSON.stringify(b.inventory.items)]),stores);
 assert.equal(playerStore.owner,0);assert.equal(playerStore.inventory.items.wood,3);assert.equal(player.owner,0);assert.equal(player.location.kind,"world");
 assert(people.every(u=>u.owner===1));assert.equal(people[1].location.kind,"world");assert.equal(people[0].skills.farming,8);assert.equal(people[0].inventory.amount,2);assert.equal(animal.owner,1);
 assert.equal(new Set(g.units.map(u=>u.id)).size,g.units.length);assert.equal(new Set(g.buildings.map(b=>b.id)).size,g.buildings.length);
 g.renderPolitics();assert.match(byId.politicsList.innerHTML,/Ribellata/);assert(g.save(),g.lastSaveError);assert(g.load());assert.equal(g.buildings.find(b=>b.id===base.id).owner,1);assert(ids.every(id=>g.units.find(u=>u.id===id)?.owner===1));
});
test("peaceful adhesion or recovered trust cannot trigger revolt",()=>{const{g,base,people}=conquered();base.occupationSinceDay=0;people.forEach(u=>{u.communityTrust=0;u.fedUntil=0;u.hungry=false;});g.totalDays=90;g.occupationDay();people.slice(0,2).forEach(u=>u.communityTrust=80);g.totalDays=180;g.occupationDay();assert.equal(base.owner,0);assert.equal(base.unrestSinceDay,null);assert.equal(g.triggerVillageRebellion(base),false);
 g.ensurePolitics();assert(g.transferNeutralSettlement(2,"integrate","peace-revolt-test").ok);const peaceful=g.buildings.find(b=>b.integratedFromOwner===2);peaceful.unrestSinceDay=0;g.totalDays=210;assert.equal(g.triggerVillageRebellion(peaceful),false);assert.equal(peaceful.owner,0);
});
test("farm and mill workers keep their jobs, skills and identity after revolt",()=>{
 const{g,base,people}=conquered(123456);const jobs=people.filter(u=>["farm","production"].includes(u.task?.type)).map(u=>[u.id,u.task.type,u.task.target]);assert.equal(jobs.length,2);
 base.occupationSinceDay=0;for(const u of people){u.communityTrust=0;u.hungry=false;u.fedUntil=0;}g.totalDays=90;g.occupationDay();g.totalDays=180;g.occupationDay();
 for(const[id,type,target]of jobs){const u=g.units.find(x=>x.id===id),building=g.buildings.find(x=>x.id===target);assert.equal(u.owner,1);assert.equal(u.task?.type,type);assert.equal(building.owner,1);assert((type==="farm"?building.assigned:building.workers).includes(id));}
 g.neutralEconomyDay();assert(g.save(),g.lastSaveError);assert(g.load());for(const[id,type]of jobs)assert.equal(g.units.find(u=>u.id===id).task?.type,type);
});
test("a blocked exit postpones the entire revolt without releasing earlier residents",()=>{
 const{g,base,buildings,people,run}=conquered(123456),rebelHouse=buildings.find(b=>b.type==="house");
 const playerHouse=run('new Building("house",10,10,0,true)');g.buildings.push(playerHouse);g.ensureInventories();
 const player=g.units.find(u=>u.owner===0&&!u.neutralSettlementId&&u.location.kind==="world");assert(player);
 g.enterResident(player,rebelHouse);if(people[1].location.kind==="resident")assert(g.releaseResident(people[1].id,rebelHouse));g.enterResident(people[1],playerHouse);
 assert.equal(player.location.kind,"resident");assert.equal(people[1].location.kind,"resident");
 base.occupationSinceDay=0;for(const u of people){u.communityTrust=0;u.fedUntil=0;u.hungry=false;}g.totalDays=90;g.occupationDay();g.totalDays=180;
 const blocked=new Set(g.buildingDoors(playerHouse).map(p=>`${Math.floor(p.x)},${Math.floor(p.y)}`)),spawn=g.spawnPositionFree;
 g.spawnPositionFree=function(p,...args){return !blocked.has(`${Math.floor(p.x)},${Math.floor(p.y)}`)&&spawn.call(this,p,...args);};
 assert.equal(g.triggerVillageRebellion(base),false);assert.equal(base.owner,0);assert.equal(player.location.kind,"resident");assert.equal(people[1].location.kind,"resident");assert(rebelHouse.residents.includes(player.id));assert(playerHouse.residents.includes(people[1].id));assert(g.save(),g.lastSaveError);
 g.spawnPositionFree=spawn;assert.equal(g.triggerVillageRebellion(base),true);assert.equal(player.location.kind,"world");assert.equal(people[1].location.kind,"world");assert.equal(base.owner,1);assert(g.save(),g.lastSaveError);
});
