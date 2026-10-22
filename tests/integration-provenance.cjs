const test=require("node:test"),assert=require("node:assert/strict"),make=require("./harness.cjs");
test("integration marks exact transferred buildings and animals, never nearby player property",()=>{
  const {g}=make([],{neutrals:true});g.ensurePolitics();const base=g.neutralSettlement(1).base;
  const original=g.buildings.filter(b=>b.owner===1),warehouse=original.find(b=>b.type==="warehouse");
  assert(warehouse);
  const playerStore=g.buildings.find(b=>b.owner===0&&b.type==="warehouse");
  playerStore.x=base.x+3;playerStore.y=base.y+3;
  const animal=g.animals.find(a=>a.owner===-1);assert(animal);animal.owner=1;
  assert(g.transferNeutralSettlement(1,"military-surrender","provenance-1").ok);
  assert(original.every(b=>b.owner===0&&b.integrationOriginOwner===1));
  assert.equal(playerStore.integrationOriginOwner,undefined);
  assert.equal(animal.integrationOriginOwner,1);
  const ids=original.map(b=>b.id),aid=animal.id;
  assert(g.save());assert(g.load());
  assert(ids.every(id=>g.buildings.find(b=>b.id===id)?.integrationOriginOwner===1));
  assert.equal(g.buildings.find(b=>b.id===playerStore.id).integrationOriginOwner,undefined);
  assert.equal(g.animals.find(a=>a.id===aid).integrationOriginOwner,1);
});
test("legacy integrated saves recover marked village structures but leave anonymous warehouses alone",()=>{
  const {g,storage}=make([],{neutrals:true});g.ensurePolitics();const base=g.neutralSettlement(1).base;
  const oldWarehouse=g.buildings.find(b=>b.owner===1&&b.type==="warehouse");assert(oldWarehouse);
  assert(g.transferNeutralSettlement(1,"integrate","legacy-provenance").ok);assert(g.save());
  const raw=JSON.parse(storage.get("terra-italica-save-v5"));
  for(const b of raw.buildings)delete b.integrationOriginOwner;
  storage.set("terra-italica-save-v5",JSON.stringify(raw));
  assert(g.load());
  assert.equal(g.buildings.find(b=>b.id===base.id).integrationOriginOwner,1);
  assert.equal(g.buildings.find(b=>b.id===oldWarehouse.id).integrationOriginOwner,undefined);
});
