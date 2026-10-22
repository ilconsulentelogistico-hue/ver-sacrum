const {test}=require('node:test'),assert=require('node:assert/strict'),setup=require('./economy-fixture.cjs');
test('assignment reserves no invented money; cancel before pickup preserves source goods',()=>{const {g,d,u,a}=setup();g.marketPrice=()=>1;assert.equal(g.assignCaravan(d),null);g.cancelTask(u);assert.equal(a.inventory.items.wood,10);assert.equal(u.inventory.amount,0);});
test('cargo and each leg survive reload and return exactly once',()=>{const e=setup(),{g,d,u,a,b}=e;g.marketPrice=()=>1;assert.equal(g.assignCaravan(d),null);u.x=a.x+1;u.y=a.y;g.updateCaravan(u,0);assert(g.save(),g.lastSaveError);assert(g.load());const p=g.units.find(p=>p.id===u.id),source=g.buildings.find(x=>x.id===a.id),dest=g.buildings.find(x=>x.id===b.id);p.x=dest.x+1;p.y=dest.y;g.updateCaravan(p,0);assert.equal(p.inventory.type,'food');assert(g.save(),g.lastSaveError);assert(g.load());const q=g.units.find(q=>q.id===u.id);q.x=source.x+1;q.y=source.y;g.updateCaravan(q,0);assert.equal(g.buildings.find(x=>x.id===a.id).inventory.items.food,5);assert.equal(q.task,null);});
test('destroyed origin retains goods on the person',()=>{const {g,d,u,a}=setup();g.marketPrice=()=>1;g.assignCaravan(d);u.x=a.x+1;u.y=a.y;g.updateCaravan(u,0);a.health=0;g.updateCaravan(u,0);assert.equal(u.inventory.amount,10);assert.equal(u.task,null);});
test('blocked journey waits without teleporting or discarding cargo',()=>{const {g,d,u,a}=setup();g.marketPrice=()=>1;g.assignCaravan(d);u.x=a.x+1;u.y=a.y;g.updateCaravan(u,0);g.pathToBuilding=()=>null;g.updateCaravan(u,1);assert(u.task.blocked);assert.equal(u.inventory.amount,10);assert.equal(u.x,a.x+1);});

test("assignment rejects a route reachable only from the wrong source door",()=>{const {g,d,u,a,b}=setup();g.marketPrice=()=>1;const path=g.pathToBuilding;g.pathToBuilding=(from,to)=>{if(from===u&&to===a)return[{x:a.x+1,y:a.y}];if(from===a&&to===b)return[];if(to===b)return null;return path.call(g,from,to);};const before=a.inventory.items.wood;assert.match(g.assignCaravan(d),/non raggiungibile/);assert.equal(u.task,null);assert.equal(a.inventory.items.wood,before);});
test("a blocked outbound caravan retries by day and then returns its real cargo",()=>{const {g,d,u,a}=setup();g.marketPrice=()=>1;assert.equal(g.assignCaravan(d),null);u.x=a.x+1;u.y=a.y;g.updateCaravan(u,0);let calls=0;g.pathToBuilding=()=>{calls++;return null;};g.updateCaravan(u,1);assert.equal(calls,1);for(let i=0;i<10;i++)g.updateCaravan(u,1);assert.equal(calls,1);assert.equal(u.inventory.amount,10);g.totalDays+=5;g.updateCaravan(u,1);g.totalDays+=5;g.updateCaravan(u,1);assert.equal(u.task.phase,"return");assert.equal(u.inventory.amount,10);});


test("a precomputed neutral route survives pickup and reload when A* cannot reach the market",()=>{
 const {g,d,u,a,b}=setup(false,{seed:123456,flatten:false});g.marketPrice=()=>1;g.normalizeWorldSpawns();
 const path=g.pathToBuilding;const route=Array.from(path.call(g,a,b)||[],p=>({x:p.x,y:p.y}));assert(route.length>0);
 g.pathToBuilding=(from,to)=>to===b?null:path.call(g,from,to);
 const sourceDoor=g.buildingDoors(a)[0];assert(sourceDoor);u.x=sourceDoor.x;u.y=sourceDoor.y;
 assert.equal(g.assignCaravan({...d,precomputedSourcePath:[],precomputedOutboundPath:route}),null);
 const expectedReturn=Array.from(u.task.returnPath,p=>({x:p.x,y:p.y}));
 g.updateCaravan(u,0);
 assert.equal(u.task.phase,'market');assert.deepEqual(u.path,route);
 assert(g.save(),g.lastSaveError);assert(g.load());
 const same=g.units.find(x=>x.id===u.id);assert.deepEqual(Array.from(same.path,p=>({x:p.x,y:p.y})),route);
 assert.equal(same.inventory.amount,10);
 const destination=g.buildings.find(x=>x.id===b.id);same.x=destination.x+1;same.y=destination.y;g.updateCaravan(same,0);
 assert.equal(same.task.phase,'return');assert(same.path.length>0);
 assert.deepEqual(Array.from(same.path,p=>({x:p.x,y:p.y})),expectedReturn);
});
