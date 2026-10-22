const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),zlib=require("node:zlib"),path=require("node:path"),make=require("./harness.cjs");
// Captured by the game code at commit e5a9063 (BUILD 54), day 47.
const raw=zlib.gunzipSync(fs.readFileSync(path.join(__dirname,"fixtures/build54-v5.json.gz"))).toString(),historic=JSON.parse(raw);
const quantities=(buildings,owners)=>{const out={};for(const b of buildings)if(owners.has(b.owner))for(const [good,amount] of Object.entries(b.inventory?.items||{}))if(amount)out[`${b.owner}:${good}`]=(out[`${b.owner}:${good}`]||0)+amount;return out};
test("real BUILD 54 save loads and can be saved again without losing people, skills or goods",()=>{
  assert.equal(historic.version,5);const {g,storage}=make([["terra-italica-save-v5",raw]],{neutrals:true});
  assert(g.load(),"BUILD 54 fixture must load");assert.equal(g.gameMode,"legacy");assert.equal(g.seed,historic.seed);assert.equal(g.totalDays,historic.clock.totalDays);
  for(const old of historic.units){const person=g.units.find(u=>u.id===old.id);assert(person,`person ${old.id}`);assert.equal(person.name,old.name);for(const [skill,value] of Object.entries(old.skills||{}))assert.equal(person.skills[skill],value,`${old.name}: ${skill}`);if(old.task)assert.equal(person.task?.type,old.task.type,`${old.name}: active task`);}
  for(const old of historic.resources.filter(r=>r.amount<r.max))assert.equal(g.world.resourceById(old.id)?.amount,old.amount,`resource ${old.id}`);
  for(const old of historic.buildings)assert(g.buildings.some(b=>b.id===old.id),`building ${old.id}`);
  const owners=new Set(historic.buildings.map(b=>b.owner));assert.deepEqual(quantities(g.buildings,owners),quantities(historic.buildings,owners));
  assert(g.save(),g.lastSaveError);const current=JSON.parse(storage.get("terra-italica-save-v5"));assert.equal(current.version,5);assert.equal(current.gameMode,"legacy");
  assert(g.load());assert.deepEqual(quantities(g.buildings,owners),quantities(historic.buildings,owners));
  assert.equal(g.units.filter(u=>historic.units.some(old=>old.id===u.id)).length,historic.units.length);
});
