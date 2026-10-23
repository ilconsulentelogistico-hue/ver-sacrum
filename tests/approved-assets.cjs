const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const make=require('./harness.cjs');
const root=path.join(__dirname,'..');

test('approved native assets are mapped without terrain replacement',()=>{
  const renderer=readFileSync(path.join(root,'asset-render.js'),'utf8'),p16=readFileSync(path.join(root,'p16-render.js'),'utf8');
  assert.match(renderer,/building_mill_p16\.png/);assert.match(renderer,/ui_selection_marker_p16\.png/);assert.doesNotMatch(renderer,/tile_(grass|sea|forest)_p16/);assert.match(p16,/Game\.prototype\.drawTile/);
});

test('mill uses approved image only when loaded and keeps procedural fallback',()=>{
  const {g,sandbox}=make(),mill=g.buildings.find(b=>b.type==='mill')||g.placeTestBuilding?.('mill');
  assert(sandbox.TERRA_P16_SPRITES.mill);assert.equal(sandbox.TERRA_P16_SPRITES.mill.complete,true);
  assert.match(readFileSync(path.join(root,'logistics.js'),'utf8'),/drawBuilding\.call\(this,b\)/);
});

test('PWA cache includes both approved masters and has a fresh version',()=>{
  const sw=readFileSync(path.join(root,'sw.js'),'utf8'),boot=readFileSync(path.join(root,'boot.js'),'utf8');const cache=sw.match(/terra-italica-v(\d+)/),worker=boot.match(/sw\.js\?v=(\d+)/);assert(cache&&worker);assert.equal(cache[1],worker[1]);assert.match(sw,/building_mill_p16\.png/);assert.match(sw,/ui_selection_marker_p16\.png/);
});

test('inventory records Drive IDs, dimensions and rejected overview-scale files',()=>{
  const doc=readFileSync(path.join(root,'docs/ASSET_INVENTORY.md'),'utf8');assert.match(doc,/1e2JOCQV4zu3Rz7CWZxI34eT5sgYBKW7K/);assert.match(doc,/32×38 RGBA/);assert.match(doc,/142mP8IUG7WhDKbROAP-_fNgX9jWOy5su/);assert.match(doc,/495×495/);assert.match(doc,/terreno procedurale/);
});

