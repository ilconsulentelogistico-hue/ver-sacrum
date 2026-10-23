const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const {test} = require("node:test");
const make = require("./harness.cjs");
const html = readFileSync(require("node:path").join(__dirname, "..", "index.html"), "utf8");

test("Partita and Gioco contain distinct commands and canonical building names", () => {
  const game = html.split("<details id=\"gameMenu\"")[1].split("</details>")[0];
  const partita = html.split("<details id=\"partitaMenu\"")[1].split("<details id=\"gameSettings\"")[0];
  assert.match(game, /id="idleNextBtn"/);
  assert.doesNotMatch(game, /id="saveBtn"|id="loadBtn"/);
  assert.match(partita, /id="saveBtn"/);
  assert.match(partita, /id="loadBtn"/);
  assert.match(partita, /id="newWorldBtn"/);
  assert.match(html, /Distretto · 4 × 4/);
  const e = make();
  assert.equal(e.run("BUILD_LABEL.base"), "Casa comune");
  assert.equal(e.run("BUILD_LABEL.house"), "Distretto");
});

test("save time appears and loading asks before replacing current progress", () => {
  const e = make(), g = e.g;
  assert.equal(e.byId.loadBtn.disabled, true);
  assert.equal(g.save(true), true);
  assert.match(e.byId.saveStatus.textContent, /^Salvato alle \d{2}:\d{2}$/);
  assert.equal(e.byId.loadBtn.disabled, false);
  const original = g.day;
  g.day = original + 12;
  let asked = 0;
  e.sandbox.confirm = () => { asked++; return false; };
  e.byId.loadBtn.onclick();
  assert.equal(asked, 1);
  assert.equal(g.day, original + 12);
  e.sandbox.confirm = () => { asked++; return true; };
  e.byId.loadBtn.onclick();
  assert.equal(asked, 2);
  assert.equal(g.day, original);
});

test("a rejected assault keeps mobilized people at their current task", () => {
  const e = make(), g = e.g;
  const u = g.units[0];
  u.mobilized = true;
  const base = e.run("new Building(\"base\", 40, 40, 1, true)");
  g.buildings.push(base);
  let asked = 0, sent = 0;
  e.sandbox.confirm = () => { asked++; return false; };
  g.beginVillageAssault = () => { sent++; return true; };
  g.applyOrder("attack", {x:base.x,y:base.y}, base.x, base.y, u);
  assert.equal(asked, 1);
  assert.equal(sent, 0);
  g.selected = u; g.groupSelection = [u]; u.selected = true;
  const tile = e.run("TILE"), screen = g.worldToScreen(base.x*tile, base.y*tile);
  g.rtsContextTap(screen.x, screen.y);
  assert.equal(asked, 2);
  assert.equal(sent, 0);
});

test("Nuovo mondo asks before replacing the current world", () => {
  const e = make(), g = e.g;
  let asked = 0, started = 0;
  g.beginStartSelection = () => { started++; };
  e.sandbox.confirm = () => { asked++; return false; };
  e.byId.newWorldBtn.onclick();
  assert.equal(asked, 1);
  assert.equal(started, 0);
  e.sandbox.confirm = () => { asked++; return true; };
  e.byId.newWorldBtn.onclick();
  assert.equal(asked, 2);
  assert.equal(started, 1);
});
