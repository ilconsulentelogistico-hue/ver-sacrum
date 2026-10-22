const {test} = require('node:test');
const assert = require('node:assert/strict');
const make = require('./harness.cjs');

test('Shift and right mouse button share MOD; touch remains unchanged', () => {
  const {g, byId, fireWindow, fireDocument, run, sandbox} = make();
  g.setPaused(true);
  const mod = byId.touchModifier;
  const event = (id, x, y, button = 0, pointerType = 'mouse') => ({
    pointerId: id, clientX: x, clientY: y, button, pointerType,
    preventDefault() {}, stopPropagation() {}
  });
  const tile = run('TILE');
  const owned = g.units.filter(u => u.owner === 0 && u.health > 0 && u.location.kind === 'world');
  assert.equal(owned.length, 5);
  g.camera.x = owned.reduce((sum, u) => sum + u.x * tile, 0) / owned.length;
  g.camera.y = owned.reduce((sum, u) => sum + u.y * tile, 0) / owned.length;
  const point = u => g.worldToScreen(u.x * tile, u.y * tile);

  fireWindow('keydown', {key: 'Shift'});
  assert(mod.classList.contains('active'));
  assert.equal(mod.getAttribute('aria-pressed'), 'true');
  let p = point(owned[1]);
  g.pointerDown(event(1, p.x, p.y));
  assert.equal(g.rtsGesture.type, 'leftCandidate');
  g.pointerUp(event(1, p.x, p.y));
  assert(g.rtsSelectedUnits().includes(owned[1]));
  assert(mod.classList.contains('active'));
  fireWindow('keyup', {key: 'Shift'});
  assert(!mod.classList.contains('active'));

  p = point(owned[2]);
  g.pointerDown(event(2, p.x, p.y, 2));
  assert.equal(g.rtsGesture.type, 'leftCandidate');
  assert(mod.classList.contains('active'));
  g.pointerUp(event(2, p.x, p.y, 2));
  assert(g.rtsSelectedUnits().includes(owned[2]));
  assert(!mod.classList.contains('active'));

  const points = owned.map(point);
  const left = Math.min(...points.map(v => v.x)) - 12;
  const top = Math.min(...points.map(v => v.y)) - 12;
  const right = Math.max(...points.map(v => v.x)) + 12;
  const bottom = Math.max(...points.map(v => v.y)) + 12;
  g.pointerDown(event(3, left, top, 2));
  g.pointerMove(event(3, right, bottom, 2));
  assert.equal(g.rtsGesture.type, 'leftBox');
  g.pointerUp(event(3, right, bottom, 2));
  assert.equal(g.rtsSelectedUnits().length, 5);
  assert(!mod.classList.contains('active'));

  fireWindow('keydown', {key: 'Shift'});
  g.pointerDown(event(4, left, top));
  g.pointerMove(event(4, right, bottom));
  assert.equal(g.rtsGesture.type, 'leftBox');
  g.pointerUp(event(4, right, bottom));
  assert.equal(g.rtsSelectedUnits().length, 5);
  fireWindow('keyup', {key: 'Shift'});

  g.buildMode = 'house';
  g.pointerDown(event(5, p.x, p.y, 2));
  assert.equal(g.buildMode, null);
  g.pointerUp(event(5, p.x, p.y, 2));
  assert.equal(byId.message.textContent, 'Costruzione annullata.');
  assert(!mod.classList.contains('active'));

  for (const id of ['world', 'minimap']) {
    let blocked = false;
    byId[id].listeners.contextmenu[0]({preventDefault() { blocked = true; }});
    assert(blocked, `${id} must block the browser menu`);
  }
  assert.equal(sandbox.document.listeners, undefined, 'no document-wide context-menu block');

  g.pointerDown(event(6, p.x, p.y, 0, 'touch'));
  assert.equal(g.rtsGesture.type, 'modCandidate');
  g.pointerCancel();
  mod.listeners.pointerdown[0](event(7, 0, 0, 0, 'touch'));
  assert(mod.classList.contains('active'));
  g.pointerDown(event(8, p.x, p.y, 0, 'touch'));
  assert.equal(g.rtsGesture.type, 'leftCandidate');
  g.pointerCancel();
  mod.listeners.pointerup[0](event(7, 0, 0, 0, 'touch'));
  assert(!mod.classList.contains('active'));

  fireWindow('keydown', {key: 'Shift'});
  fireWindow('blur');
  assert(!mod.classList.contains('active'));
  fireWindow('keydown', {key: 'Shift'});
  sandbox.document.hidden = true;
  fireDocument('visibilitychange');
  assert(!mod.classList.contains('active'));
});
