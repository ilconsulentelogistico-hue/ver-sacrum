const {test}=require('node:test'),assert=require('node:assert/strict'),make=require('./harness.cjs');
test('all three communities have separate warehouses, markets and identities',()=>{const {g}=make([],{neutrals:true});for(const owner of [1,2,3]){const s=g.neutralSettlement(owner);assert(s);assert.equal(s.people.length,3);assert.equal(g.communalStores(owner).length,1);assert.equal(Object.values(s.base.inventory.items).reduce((a,b)=>a+b,0),0);}assert.equal(new Set(g.units.map(u=>u.id)).size,g.units.length);});
test('neutral day adds no grain to a full warehouse',()=>{const {g}=make([],{neutrals:true}),w=g.communalStores(1)[0];w.inventory.items={stone:w.inventory.capacity};g.totalDays=10;g.neutralEconomyDay();assert.equal(g.freeSpace(w),0);assert.equal(w.inventory.items.grain||0,0);});
test('foreign warehouse cannot receive own worker haul assignment',()=>{const {g}=make([],{neutrals:true});assert.match(g.assignHaul(g.units[0],g.communalStores()[0],g.communalStores(1)[0],'food'),/Accesso negato/);});
test('all faction inventories survive reload without resupplying or duplicating people',()=>{const {g}=make([],{neutrals:true});g.settlementTick();const before=JSON.stringify(g.buildings.map(b=>[b.id,b.inventory.items]));const ids=g.units.map(u=>u.id).join();assert(g.save(),g.lastSaveError);assert(g.load());assert.equal(JSON.stringify(g.buildings.map(b=>[b.id,b.inventory.items])),before);assert.equal(g.units.map(u=>u.id).join(),ids);});


test('spawn normalization keeps every neutral warehouse linked on a difficult seed',()=>{
 const {g}=make([],{neutrals:true});g.newGame(18);
 for(const owner of [1,2,3]){const s=g.neutralSettlement(owner),stores=g.communalStores(owner);assert.equal(stores.length,1);assert(g.linkedBuildings(stores[0],'base').some(b=>b.id===s.base.id));assert(g.linkOpen(stores[0],s.market));assert(Object.values(stores[0].inventory.items).some(n=>n>0));}
 assert(g.save(),g.lastSaveError);assert(g.load());for(const owner of [1,2,3])assert.equal(g.communalStores(owner).length,1);
});


test('neutral demand counts only reachable local stock, without moving goods',()=>{
 const {g}=make([],{neutrals:true});g.newGame(123456);const s=g.neutralSettlement(1),w=g.communalStores(1)[0],m=s.market;assert(g.linkOpen(w,m));
 g.totalDays=1;w.inventory.items.grain=60;m.inventory.items.grain=0;
 g.neutralEconomyDay();assert.equal(m.demand.grain,.5);assert.equal(w.inventory.items.grain,60);assert.equal(m.inventory.items.grain,0);
 g.linkPolicy(w,m).enabled=false;g.neutralEconomyDay();assert.equal(m.demand.grain,1.5);assert.equal(w.inventory.items.grain,60);
});


test('neutral food comes from a person and a finite node, then reaches that settlement',()=>{
 const {g,run}=make([],{neutrals:true}),s=g.neutralSettlement(1),w=g.communalStores(1)[0],u=s.people.find(p=>p.location.kind==='world'&&p.state==='idle');
 g.world.resources=[];g.world.invalidateResourceIndex();const r=run(`new ResourceNode('food',${u.x},${u.y},3)`);g.world.resources.push(r);
 w.inventory.items.food=0;u.inventory.cap=1;g.totalDays=10;g.neutralEconomyDay();
 assert.equal(w.inventory.items.food||0,0);assert.equal(u.task?.type,'gather');
 u.state='gathering';u.task.workSpot={x:u.x,y:u.y};u.workTimer=0;g.gatherTick(u,1);
 assert.equal(r.amount,2);assert.equal(u.inventory.amount,1);assert.equal(u.task?.type,'return');
 const door=g.buildingDoors(w)[0];assert(door);u.x=door.x;u.y=door.y;g.deposit(u,u.task.after);
 assert.equal(w.inventory.items.food,1);assert.equal(u.inventory.amount,0);
 assert.equal(g.communalStock().food>=0,true);
});


test('normalized neutral stores remain linked to their market on known difficult seeds',()=>{
 const {g}=make([],{neutrals:true});for(const seed of [34,49,55]){g.newGame(seed);for(const owner of [1,2,3]){const s=g.neutralSettlement(owner),w=g.communalStores(owner)[0],h=g.buildings.find(b=>b.owner===owner&&b.type==='house');assert(w);assert(g.linkOpen(w,s.market),`seed ${seed}, owner ${owner}`);assert(g.linkOpen(h,s.market),`casa seed ${seed}, owner ${owner}`);}}
});


test('neutral grain and barley require a linked field and a present worker',()=>{
 const {g}=make([],{neutrals:true});g.newGame(123456);
 for(const [owner,crop] of [[1,'grain'],[2,'barley']]){
   const farm=g.buildings.find(b=>b.owner===owner&&b.type==='farm'&&b.crop===crop),store=g.communalStores(owner)[0],worker=g.units.find(u=>u.owner===owner&&u.task?.type==='farm'&&u.task.target===farm?.id);
   assert(farm);assert(g.linkOpen(farm,store));assert(worker);
   const total=()=>g.buildings.filter(b=>b.owner===owner).reduce((sum,b)=>sum+(b.inventory?.items[crop]||0),0),beforeTotal=total(),start=store.inventory.items[crop]||0;g.totalDays=10;g.neutralEconomyDay();assert.equal(store.inventory.items[crop]||0,start);
   farm.growth=1;g.buildingDay(farm);assert.equal(farm.inventory.items[crop]||0,0);
   worker.x=farm.x;worker.y=farm.y;worker.state='farming';g.buildingDay(farm);assert((farm.inventory.items[crop]||0)>0);
   const harvest=farm.inventory.items[crop];assert.equal(total(),beforeTotal+harvest);g.settlementTick();assert.equal(total(),beforeTotal+harvest);g.settlementTick();assert.equal(total(),beforeTotal+harvest);
 }
});


test('neutral farms and their workers keep identity through reload',()=>{
 const {g}=make([],{neutrals:true});g.newGame(123456);const before=[1,2].map(owner=>{const f=g.buildings.find(b=>b.owner===owner&&b.type==='farm'),u=g.units.find(u=>u.owner===owner&&u.task?.target===f.id);assert(f&&u);return[f.id,u.id,f.crop]});
 assert(g.save(),g.lastSaveError);assert(g.load());
 for(const [i,owner] of [1,2].entries()){const farms=g.buildings.filter(b=>b.owner===owner&&b.type==='farm');assert.equal(farms.length,1);assert.equal(farms[0].id,before[i][0]);assert.equal(farms[0].crop,before[i][2]);assert(g.units.some(u=>u.id===before[i][1]&&u.task?.target===farms[0].id));}
});


test('a destroyed neutral field is not recreated for free',()=>{
 const {g}=make([],{neutrals:true});g.newGame(123456);const s=g.neutralSettlement(1),farm=g.buildings.find(b=>b.owner===1&&b.type==='farm');assert(s.base.neutralFarmEstablished);farm.health=0;g.buildings=g.buildings.filter(b=>b!==farm);g.totalDays=10;g.neutralEconomyDay();assert.equal(g.buildings.filter(b=>b.owner===1&&b.type==='farm').length,0);
});


test('neutral mills consume local cereal only with a fed worker at the building',()=>{
 const {g}=make([],{neutrals:true});g.newGame(123456);g.totalDays=1;g.settlementTick();
 for(const [owner,crop,flour,output] of [[1,'grain','flour',2],[2,'barley','barleyFlour',3]]){
  const s=g.neutralSettlement(owner),mill=g.buildings.find(b=>b.owner===owner&&b.type==='mill'),worker=g.units.find(u=>u.owner===owner&&u.task?.target===mill?.id);
  assert(mill&&worker&&g.linkOpen(mill,s.market));const total=good=>g.buildings.filter(b=>b.owner===owner).reduce((n,b)=>n+(b.inventory?.items[good]||0),0);
  const beforeCrop=total(crop),beforeFlour=total(flour);assert(beforeCrop>=2);
  worker.fedUntil=30;g.updateBuilding(mill,1);assert.equal(mill.batch,null);
  const door=g.buildingDoors(mill)[0];assert(door);worker.x=door.x;worker.y=door.y;g.settlementTick();g.updateBuilding(mill,1);assert(mill.batch);g.updateBuilding(mill,20);
  assert.equal(total(crop),beforeCrop-2);assert.equal(total(flour),beforeFlour+output);g.settlementTick();assert.equal(total(flour),beforeFlour+output);
 }
});


test('neutral mills persist and destroyed mills do not reappear for free',()=>{
 const {g}=make([],{neutrals:true});g.newGame(123456);const ids=[1,2].map(owner=>g.buildings.find(b=>b.owner===owner&&b.type==='mill')?.id);assert(ids.every(Boolean));assert(g.save(),g.lastSaveError);assert(g.load());
 for(const [i,owner] of [1,2].entries())assert.equal(g.buildings.filter(b=>b.owner===owner&&b.type==='mill')[0]?.id,ids[i]);
 const mill=g.buildings.find(b=>b.id===ids[0]);mill.health=0;g.buildings=g.buildings.filter(b=>b!==mill);g.totalDays=10;g.neutralEconomyDay();assert.equal(g.buildings.filter(b=>b.owner===1&&b.type==='mill').length,0);
});


test('neutral market receives real food while its warehouse keeps a reserve',()=>{
 const {g}=make([],{neutrals:true});g.newGame(123456);
 for(const [owner,initial,marketFood] of [[1,24,18],[2,18,12],[3,28,22]]){const s=g.neutralSettlement(owner),w=g.communalStores(owner)[0];assert.equal(s.market.inventory.items.food,marketFood);assert.equal(w.inventory.items.food+s.market.inventory.items.food,initial);}
 const s=g.neutralSettlement(1),w=g.communalStores(1)[0],m=s.market;m.inventory.items.food=0;w.inventory.items.food=5;assert.equal(g.provisionNeutralMarketFood(s,w),0);assert.equal(m.inventory.items.food,0);
 w.inventory.items.food=30;assert.equal(g.provisionNeutralMarketFood(s,w),22);assert.equal(w.inventory.items.food,8);assert.equal(m.inventory.items.food,22);assert.equal(g.provisionNeutralMarketFood(s,w),0);
 const mill=g.buildings.find(b=>b.owner===1&&b.type==='mill'),miller=g.units.find(u=>u.task?.target===mill.id);assert(miller);g.feedPeople();assert.equal(miller.hungry,false);
});


test('new neutral villages keep houses linked to markets and retain residents on reload',()=>{
 const {g}=make([],{neutrals:true});g.newGame(123456);const before=[];
 for(const owner of [1,2,3]){const s=g.neutralSettlement(owner),h=g.buildings.find(b=>b.owner===owner&&b.type==='house');assert(g.linkOpen(h,s.market),`owner ${owner}`);before.push({owner,id:h.id,x:h.x,y:h.y,people:s.people.map(u=>u.id)});}
 g.feedPeople();for(const owner of [1,2,3])assert(g.neutralSettlement(owner).people.every(u=>u.hungry===false));
 assert(g.save(),g.lastSaveError);assert(g.load());
 for(const record of before){const s=g.neutralSettlement(record.owner),h=g.buildings.find(b=>b.id===record.id);assert(h);assert.equal(h.x,record.x);assert.equal(h.y,record.y);assert(g.linkOpen(h,s.market));assert.deepEqual(s.people.map(u=>u.id),record.people);}
});


test('real food reserve permits one new neutral resident only after 150 favorable days',()=>{
 const {g}=make([],{neutrals:true});g.newGame(123456);const s=g.neutralSettlement(1),h=g.buildings.find(b=>b.owner===1&&b.type==='house'),w=g.communalStores(1)[0],m=s.market;
 g.feedPeople();w.inventory.items.food+=10;const totalBefore=w.inventory.items.food+m.inventory.items.food;const moved=g.provisionNeutralMarketFood(s,w);assert(moved>0);assert.equal(w.inventory.items.food+m.inventory.items.food,totalBefore);assert.equal(g.admissionBlocker(h),null);
 const ids=new Set(s.people.map(u=>u.id)),foodBefore=g.populationFood(h);for(let day=0;day<149;day++)g.buildingDay(h);assert.equal(g.neutralSettlement(1).people.length,3);assert.equal(g.populationFood(h),foodBefore);
 g.buildingDay(h);const people=g.neutralSettlement(1).people;assert.equal(people.length,4);const newcomer=people.find(u=>!ids.has(u.id));assert(newcomer);assert.equal(newcomer.owner,1);assert.equal(newcomer.location.kind,'resident');assert.equal(g.populationFood(h),foodBefore-18);
 assert(g.save(),g.lastSaveError);assert(g.load());assert(g.units.some(u=>u.id===newcomer.id&&u.owner===1));assert.equal(g.neutralSettlement(1).people.length,4);
});


test('neutral bakers emerge only after real population growth and use milled flour',()=>{
 const {g}=make([],{neutrals:true});g.newGame(123456);g.nextRaidDay=100000;g.raiders=[];g.animals=[];
 const carriers=new Map(),firstSites=new Set();
 for(let day=0;day<320;day++){
  g.update(.85);
  for(const owner of [1,2]){
   const bakery=g.buildings.find(b=>b.owner===owner&&b.type==='bakery');if(!bakery)continue;
   if(!firstSites.has(owner)){assert(g.neutralSettlement(owner).people.length>=4);firstSites.add(owner);}
   const carrier=g.units.find(u=>u.owner===owner&&u.task?.type==='haul'&&u.task.destination===bakery.id);
   if(carrier)carriers.set(owner,carrier.id);
  }
 }
 assert.equal(firstSites.size,2);assert.equal(carriers.size,2);
 const ids=[];for(const [owner,flour,bread] of [[1,'flour','bread'],[2,'barleyFlour','barleyBread']]){
  const s=g.neutralSettlement(owner),h=g.buildings.find(b=>b.owner===owner&&b.type==='house'),bakery=g.buildings.find(b=>b.owner===owner&&b.type==='bakery');
  assert(s.people.length>=4);assert(bakery&&g.linkOpen(bakery,s.market)&&g.linkOpen(bakery,h));
  const worker=g.factoryWorkers(bakery)[0];assert(worker&&worker.owner===owner&&worker.homeVillageId===h.id&&worker.location.kind==='world');
  assert.equal(worker.id,carriers.get(owner));assert(s.people.some(u=>u.id===worker.id));assert(bakery.materialsConsumed);assert((worker.xp.transport||0)>0);assert((worker.xp.construction||0)>0);assert(g.buildings.filter(b=>b.owner===owner).reduce((n,b)=>n+(b.inventory.items[bread]||0),0)>0);
  assert(g.buildings.filter(b=>b.owner===owner).reduce((n,b)=>n+(b.inventory.items[flour]||0),0)>0);ids.push(bakery.id);
 }
 assert.equal(g.buildings.filter(b=>b.owner===3&&b.type==='bakery').length,0);
 assert(g.save(),g.lastSaveError);assert(g.load());for(const id of ids)assert(g.buildings.some(b=>b.id===id&&b.type==='bakery'));
 const bakery=g.buildings.find(b=>b.id===ids[0]);bakery.health=0;g.buildings=g.buildings.filter(b=>b!==bakery);g.neutralEconomyDay();assert.equal(g.buildings.filter(b=>b.owner===1&&b.type==='bakery').length,0);
});


test('neutral building materials come from finite nodes and enter real bakery sites',()=>{
 const {g}=make([],{neutrals:true});g.newGame(123456);g.nextRaidDay=100000;g.raiders=[];g.animals=[];
 const total=good=>g.world.resources.filter(r=>r.type===good).reduce((n,r)=>n+r.amount,0)+g.buildings.reduce((n,b)=>n+(b.inventory?.items[good]||0),0)+g.units.reduce((n,u)=>n+(u.inventory.type===good?u.inventory.amount:0),0);
 const before={wood:total('wood'),stone:total('stone')};
 for(let day=0;day<320;day++)g.update(.85);
 for(const owner of [1,2]){const s=g.neutralSettlement(owner),bakery=g.buildings.find(b=>b.owner===owner&&b.type==='bakery');assert.equal(s.people.length,4);assert(bakery?.built&&bakery.materialsConsumed);assert(s.people.every(u=>u.health===100));}
 const consumed=g.buildings.filter(b=>b.owner>0&&b.type==='bakery'&&b.materialsConsumed).length;assert.equal(consumed,2);assert.equal(total('wood')+16*consumed,before.wood);assert.equal(total('stone')+16*consumed,before.stone);
 assert(g.save(),g.lastSaveError);assert(g.load());for(const owner of [1,2])assert(g.buildings.some(b=>b.owner===owner&&b.type==='bakery'));
});


test('neutral starters take reachable house exits to both initial jobs',()=>{
 const {g}=make([],{neutrals:true});
 for(const [seed,owner] of [[8,2],[15,2],[22,1]]){
  g.newGame(seed);g.nextRaidDay=100000;g.raiders=[];g.animals=[];const farm=g.buildings.find(b=>b.owner===owner&&b.type==='farm'),mill=g.buildings.find(b=>b.owner===owner&&b.type==='mill');
  const assigned=()=>{const people=g.neutralSettlement(owner).people;return[people.find(u=>u.task?.type==='farm'&&u.task.target===farm.id),people.find(u=>u.task?.type==='production'&&u.task.target===mill.id)];};
  const [farmer,miller]=assigned();assert(farmer&&miller,`seed ${seed}: incarichi iniziali`);const ids=[farmer.id,miller.id];
  for(let day=0;day<40;day++)g.update(.85);const later=assigned();assert.deepEqual(later.map(u=>u?.id),ids);assert(later.every(u=>u.health===100));
 }
});

test('a neutral may enter only its own house without becoming a player person',()=>{
 const {g}=make([],{neutrals:true});g.newGame(8);const u=g.neutralSettlement(2).people.find(u=>u.location.kind==='world'&&!u.task),home=g.buildings.find(b=>b.owner===2&&b.type==='house'),foreign=g.buildings.find(b=>b.owner===1&&b.type==='house');
 assert(u);assert.equal(g.enterResident(u,foreign),false);assert.equal(u.location.kind,'world');assert.equal(g.enterResident(u,home),true);assert.equal(u.location.settlementId,home.id);assert.equal(u.owner,2);
});

test("a naturally grown neutral resident completes one physical first caravan and reloads in transit",()=>{
 const {g}=make([],{neutrals:true});g.newGame(123456);g.nextRaidDay=100000;g.raiders=[];g.animals=[];
 for(let day=0;day<320;day++)g.update(.85);
 assert.equal(g.neutralSettlement(1).people.length,4);
 assert.equal(g.neutralSettlement(1).market.neutralTradeSent,undefined);
 for(let day=320;day<500;day++)g.update(.85);
 const guado=g.neutralSettlement(1),colline=g.neutralSettlement(2),trader=guado.people.find(u=>u.task?.type==="caravan");
 assert.equal(guado.market.neutralTradeSent,true);assert(trader&&trader.owner===1&&trader.homeVillageId);
 assert.equal(guado.people.filter(u=>u.task?.type==="farm").length,1);
 assert.equal(guado.people.filter(u=>u.task?.type==="production").length,2);
 const ids=g.units.map(u=>u.id),marketIds=[guado.market.id,colline.market.id],traderId=trader.id;
 assert(g.save(),g.lastSaveError);assert(g.load());assert.deepEqual(g.units.map(u=>u.id),ids);
 const source=g.findById(g.buildings,marketIds[0]),destination=g.findById(g.buildings,marketIds[1]),u=g.findById(g.units,traderId);
 assert.equal(source.neutralTradeSent,true);assert.equal(u.task?.type,"caravan");
 const sum=good=>(source.inventory.items[good]||0)+(destination.inventory.items[good]||0)+(u.inventory.type===good?u.inventory.amount:0);
 const grain=sum("grain"),barley=sum("barley");let steps=0;
 while(u.task?.type==="caravan"&&steps<3000){g.updateUnit(u,.5);steps++;}
 assert(steps<3000,"la carovana deve rientrare");assert.equal(u.inventory.amount,0);
 assert.equal(sum("grain"),grain);assert.equal(sum("barley"),barley);
 assert((u.xp.trading||0)>0);assert.equal(source.neutralTradeSent,true);
});

test("neutral merchants keep their identity and make a second trip only after cooldown",()=>{
 const {g}=make([],{neutrals:true});g.newGame(123456);g.nextRaidDay=100000;g.raiders=[];g.animals=[];
 for(let day=0;day<500;day++)g.update(.85);
 const source=g.neutralSettlement(1).market,initial=g.neutralSettlement(1).people.find(u=>u.task?.type==="caravan");
 assert(initial&&initial.neutralTradeRole);assert.equal(source.neutralTradeTrips,1);
 assert(g.neutralSettlement(2).people.some(u=>u.task?.type==="caravan"||u.neutralTradeRole));
 let steps=0;while(initial.task?.type==="caravan"&&steps<3000){g.updateUnit(initial,.5);steps++;}
 assert(steps<3000);assert.equal(initial.inventory.amount,0);assert.equal(initial.owner,1);assert((initial.xp.trading||0)>0);
 const id=initial.id,next=source.neutralTradeNextDay;
 g.totalDays=next-30;g.assignNeutralTradeCaravans();assert.equal(source.neutralTradeTrips,1);
 g.totalDays=next;assert(g.assignNeutralTradeCaravans()>=1);
 assert.equal(source.neutralTradeTrips,2);assert.equal(source.neutralTraderId,id);
 assert.equal(initial.task?.type,"caravan");assert.equal(initial.homeVillageId,g.buildings.find(b=>b.owner===1&&b.type==="house").id);
 assert(g.save(),g.lastSaveError);assert(g.load());
 assert.equal(g.findById(g.buildings,source.id).neutralTradeTrips,2);
 assert.equal(g.findById(g.units,id).task?.type,"caravan");
});


test("neutral residents can eat stored bread through an open local market link",()=>{
 const {g}=make([],{neutrals:true});g.newGame(123456);
 const s=g.neutralSettlement(2),market=s.market,store=g.communalStores(2)[0];
 const u=s.people.find(u=>u.task?.type==="farm");assert(u&&u.homeVillageId);
 const ownStores=g.foodStoresFor(u);assert(ownStores.some(b=>b.id===store.id));
 assert(ownStores.every(b=>b.owner===2));
 for(const b of ownStores)for(const good of ["food","milk","bread","barleyBread"])b.inventory.items[good]=0;
 store.inventory.items.barleyBread=3;
 assert.equal(g.takeFood(g.foodStoresFor(u),1),true);assert.equal(store.inventory.items.barleyBread,2);
 g.linkPolicy(store,market).enabled=false;
 assert(!g.foodStoresFor(u).some(b=>b.id===store.id));
 assert.equal(g.takeFood(g.foodStoresFor(u),1),false);assert.equal(store.inventory.items.barleyBread,2);
});


test("neutral bakery receives existing flour through linked stores when market shelves are full",()=>{
 const {g}=make([],{neutrals:true});g.newGame(123456);g.nextRaidDay=100000;g.raiders=[];g.animals=[];
 for(let day=0;day<320;day++)g.update(.85);
 const market=g.neutralSettlement(2).market,store=g.communalStores(2)[0],bakery=g.buildings.find(b=>b.owner===2&&b.type==="bakery");
 assert(bakery?.built&&g.linkOpen(bakery,market)&&g.linkOpen(store,market));
 market.inventory.items={wood:market.inventory.capacity};store.inventory.items.barleyFlour=10;bakery.inventory.items.barleyFlour=0;
 const total=()=>g.buildings.filter(b=>b.owner===2).reduce((n,b)=>n+(b.inventory.items.barleyFlour||0),0);
 const before=total();g.settlementTick();
 assert((bakery.inventory.items.barleyFlour||0)>0);assert.equal(g.freeSpace(market),0);assert.equal(total(),before);
 bakery.inventory.items.barleyFlour=0;store.inventory.items.barleyFlour=10;g.linkPolicy(store,market).enabled=false;
 g.settlementTick();assert.equal(bakery.inventory.items.barleyFlour||0,0);
});


test("neutral village growth counts and spends real food in its linked warehouse",()=>{
 const {g}=make([],{neutrals:true});g.newGame(1);const s=g.neutralSettlement(1),home=g.buildings.find(b=>b.owner===1&&b.type==="house"),store=g.communalStores(1)[0];
 assert(g.linkOpen(home,s.market)&&g.linkOpen(store,s.market));
 for(const b of [home,s.market,store])for(const good of ["food","milk","bread","barleyBread"])b.inventory.items[good]=0;
 store.inventory.items.bread=20;assert.equal(g.populationFood(home),20);
 assert.equal(g.spendPopulationFood(18,home),true);assert.equal(store.inventory.items.bread,2);
 g.linkPolicy(store,s.market).enabled=false;assert.equal(g.populationFood(home),0);assert.equal(g.spendPopulationFood(1,home),false);assert.equal(store.inventory.items.bread,2);
});


test("an isolated third neutral starter begins within reach of its own warehouse",()=>{
 const {g}=make([],{neutrals:true});g.newGame(8);g.nextRaidDay=100000;g.raiders=[];g.animals=[];
 for(const u of g.units.filter(u=>u.owner===0))u.fedUntil=100000;
 const s=g.neutralSettlement(2),store=g.communalStores(2)[0],worker=s.people.find(u=>u.location.kind==="world"&&!u.task);
 assert(worker);const id=worker.id;assert.notEqual(g.pathToBuilding(worker,store),null);
 for(let day=0;day<300;day++)g.update(.85);
 assert(g.neutralSettlement(2).people.length>=4);assert(g.units.some(u=>u.id===id&&u.health===100));
});


test("neutral rations consume reserved bakery bread and reduce its return debt",()=>{
 const {g}=make([],{neutrals:true});g.newGame(123456);g.nextRaidDay=100000;g.raiders=[];g.animals=[];
 for(let day=0;day<320;day++)g.update(.85);
 const s=g.neutralSettlement(1),home=g.buildings.find(b=>b.owner===1&&b.type==="house"),bakery=g.buildings.find(b=>b.owner===1&&b.type==="bakery"),worker=s.people.find(u=>u.task?.type==="farm");
 assert(bakery?.built&&worker);assert(g.foodStoresFor(worker).some(b=>b.id===bakery.id));
 for(const b of g.villageFoodStores(home))for(const good of ["food","milk","bread","barleyBread"])b.inventory.items[good]=0;
 bakery.inventory.items.bread=3;bakery.returnDue.bread=3;
 assert.equal(g.takeFood(g.foodStoresFor(worker),1,false),false);
 assert.equal(g.takeFood(g.foodStoresFor(worker),1,true),true);
 assert.equal(bakery.inventory.items.bread,2);assert.equal(bakery.returnDue.bread,2);
 const market=s.market;g.linkPolicy(bakery,market).enabled=false;
 assert(!g.foodStoresFor(worker).some(b=>b.id===bakery.id));
 assert.equal(g.takeFood(g.foodStoresFor(worker),1,true),false);assert.equal(bakery.inventory.items.bread,2);
});


test("unreachable neutral building materials pause path search for thirty days",()=>{
 const {g}=make([],{neutrals:true});g.newGame(15);const s=g.neutralSettlement(2),store=g.communalStores(2)[0];
 const worker=s.people.find(u=>u.location.kind==="world"&&!u.task);assert(worker);
 store.inventory.items.food=80;store.inventory.items.wood=0;store.inventory.items.stone=0;
 g.neutralStarterJobsReady=()=>true;g.world.resourcesInBounds=()=>[{x:worker.x+3,y:worker.y,type:"wood",amount:5,cleared:false},{x:worker.x+4,y:worker.y,type:"stone",amount:5,cleared:false}];let calls=0;const walkable=g.world.walkable;g.world.walkable=function(x,y,...args){calls++;if(x===Math.floor(worker.x)+3||x===Math.floor(worker.x)+4)return false;return walkable.call(this,x,y,...args);};
 assert.equal(g.assignNeutralBuildGatherer(s,store),false);assert(calls>0);
 const first=calls;assert.equal(g.assignNeutralBuildGatherer(s,store),false);assert.equal(calls,first);
 g.totalDays+=30;assert.equal(g.assignNeutralBuildGatherer(s,store),false);assert(calls>first);
});


test("a neutral gatherer returns finite cargo to her own warehouse along a reachable route",()=>{
 const {g}=make([],{neutrals:true});g.newGame(15);g.nextRaidDay=100000;g.raiders=[];g.animals=[];
 for(let day=0;day<33;day++)g.update(.85);
 const worker=g.neutralSettlement(2).people.find(u=>u.name==="Atria"&&u.location.kind==="world"),store=g.communalStores(2)[0];
 assert(worker&&store&&worker.inventory.amount>0);assert.equal(g.nearestStorage(worker)?.id,store.id);
 const carried=worker.inventory.amount,before=store.inventory.items.food||0;
 assert.equal(g.returnToStorage(worker,null),true);assert.equal(worker.task.target,store.id);assert(worker.path.length>0);
 for(let i=0;i<40&&worker.inventory.amount>0;i++)g.updateUnit(worker,.85);
 assert.equal(worker.inventory.amount,0);assert.equal(store.inventory.items.food,before+carried);
});
