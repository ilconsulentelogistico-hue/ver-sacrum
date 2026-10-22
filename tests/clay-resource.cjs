const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),make=require('./harness.cjs');

test('the default map gains eight finite clay patches while legacy resource positions stay intact',()=>{
  const {g}=make();g.newGame(123456);const clay=g.world.resources.filter(r=>r.type==='clay');
  assert.equal(g.world.resources.filter(r=>r.type!=='clay'&&r.type!=='copper'&&r.type!=='tin').length,2611);
  assert.equal(clay.length,8);assert(clay.every(r=>r.amount>0&&r.renewable===false&&r.resourceShape==='hex'));
  assert.equal(new Set(clay.map(r=>r.id)).size,8);
  for(const name of ['clay_full_hex.svg','clay_low_hex.svg'])assert(fs.statSync(path.join(__dirname,'../assets/terrain/resources',name)).size>100);
});

test('a collected clay unit is physical cargo and teaches stone extraction',()=>{
  const {g}=make(),node=g.world.resources.find(r=>r.type==='clay'),u=g.units[0],before=node.amount;
  u.x=node.x;u.y=node.y;u.task={type:'gather',target:node.id,workSpot:{x:u.x,y:u.y}};u.state='gathering';u.workTimer=0;
  g.gatherTick(u,1);
  assert.equal(node.amount,before-1);assert.equal(u.inventory.type,'clay');assert.equal(u.inventory.amount,1);
  assert.equal(u.xp.stone,1);assert.equal(u.workTimer>0,true);
  assert(g.save(),g.lastSaveError);assert(g.load());
  assert.equal(g.units.find(p=>p.id===u.id).inventory.type,'clay');
  assert.equal(g.world.resources.find(r=>r.id===node.id).amount,before-1);
});

test('old market demand loads with neutral clay value and barter accepts clay',()=>{
  const {g,storage,run}=make(),source=run("new Building('market',40,40,0,true)"),foreign=run("new Building('market',45,40,1,true)"),trader=g.units[0];
  g.buildings.push(source,foreign);g.ensureMarkets();
  source.inventory.items.clay=4;foreign.inventory.items.stone=2;
  const trade={source,market:foreign,trader,offerGood:'clay',offerQuantity:4,good:'stone',quantity:2};
  assert.equal(g.barterQuote(trade),null);
  assert(g.save(),g.lastSaveError);
  const key='terra-italica-save-v5',data=JSON.parse(storage.get(key));
  for(const b of data.buildings)if(b.type==='market')delete b.demand.clay;
  storage.set(key,JSON.stringify(data));assert(g.load());
  assert.equal(g.buildings.find(b=>b.id===source.id).demand.clay,1);
});

test('clay is generated lazily and reproducibly in experimental maps',()=>{
  const {g}=make();g.experimentalWorldSize=256;g.newGame(123456);g.world.ensureResourceChunksForBounds(0,0,255,255);
  const first=g.world.resources.filter(r=>r.type==='clay').map(r=>[r.id,r.x,r.y,r.amount]);
  assert(first.length>0);assert(first.every(([id])=>id.startsWith('rp-123456-clay-')));
  g.newGame(123456);g.world.ensureResourceChunksForBounds(0,0,255,255);
  assert.deepEqual(g.world.resources.filter(r=>r.type==='clay').map(r=>[r.id,r.x,r.y,r.amount]),first);
});
