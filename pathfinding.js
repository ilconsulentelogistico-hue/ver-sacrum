// Paths (Claude, 23/10/2026). The A* of game.js is unchanged in costs, queue order and budget,
// so every path it found before stays identical; walkability now comes from a grid rebuilt only
// when buildings or terrain change. When the budget runs out on a reachable goal (a detour around
// the river or a cliff), a search grown from the goal finds the way. As in Mindustry's flow fields
// (idea only, no code taken), it is shared by everyone heading there and resumes where it stopped.
(() => {
  'use strict';
  const LONG_SETTLE_LIMIT = 300000; // nodes a long search may settle in one call
  const MAX_LONG_SIZE = 1024;       // long searches and regions only up to this map side
  const FIELD_CELLS = 1 << 21;      // memory budget shared by the cached goal fields
  const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const KNOWN = 1, WALK = 2, ROAD = 4;
  const NOT_EXACT = Symbol('path terrain not exact');
  const bounds = b => VER_SACRUM_VILLAGE.bounds(b);
  const inside = (r, x, y) => x >= r.left && x < r.right && y >= r.top && y < r.bottom;

  // Terrain read once per tile: walk and road flags, height. Edits arrive through TerrainTile.change.
  const terrainOf = w => {
    const n = w.size * w.size;
    if (!w._pathTerrain || w._pathTerrain.flags.length !== n) w._pathTerrain = {flags:new Uint8Array(n), z:new Int8Array(n), rev:0, filled:0};
    return w._pathTerrain;
  };
  const info = (w, T, i) => {
    let f = T.flags[i];
    if (!f) {
      const t = w.makeTile(i % w.size, Math.floor(i / w.size));
      if (!Number.isInteger(t.z) || t.z < -128 || t.z > 127) throw NOT_EXACT;
      f = KNOWN | (BIOME[t.biome].walk ? WALK : 0) | (t.road ? ROAD : 0);
      T.flags[i] = f; T.z[i] = t.z; T.filled++;
    }
    return f;
  };
  const change = TerrainTile.prototype.change;
  TerrainTile.prototype.change = function(field, value) {
    change.call(this, field, value);
    const T = this._world._pathTerrain;
    if (T && field !== 'nearWater' && T.flags[this._index]) { T.flags[this._index] = 0; T.filled--; T.rev++; }
  };

  // Footprints, alive palisades and war camps exactly as World.walkable (game.js + collisions.js) reads them.
  const signature = g => {
    let s = '';
    for (const b of g.buildings) s += `${b.type},${Math.floor(b.x)},${Math.floor(b.y)},${b.crop},${b.alive ? 1 : 0}${b.health > 0 ? 1 : 0}${b.built ? 1 : 0};`;
    s += '|';
    for (const c of g.world.collisionCamps || []) s += `${c.type},${Math.floor(c.x)},${Math.floor(c.y)},${c.crop},${c.health > 0 ? 1 : 0}${c.built ? 1 : 0};`;
    return s;
  };
  const blockedOf = g => {
    const w = g.world, N = w.size, sig = signature(g);
    let B = w._pathBlocked;
    if (B && B.sig === sig && B.cells.length === N * N) return B;
    if (!B || B.cells.length !== N * N) B = {cells:new Uint8Array(N * N), list:[], sig:'', rev:0};
    for (const i of B.list) B.cells[i] = 0;
    B.list = [];
    const mark = (x, y) => {
      if (x < 0 || y < 0 || x >= N || y >= N) return;
      const i = y * N + x;
      if (!B.cells[i]) { B.cells[i] = 1; B.list.push(i); }
    };
    for (const b of g.buildings) if (b.alive && b.type === 'palisade') mark(Math.floor(b.x), Math.floor(b.y));
    for (const b of [...g.buildings, ...(w.collisionCamps || [])]) {
      if (!(b.health > 0) || b.type === 'farm' || b.type === 'palisade' && !b.built) continue;
      const r = bounds(b);
      for (let y = Math.floor(r.top - .5); y <= Math.ceil(r.bottom); y++)
        for (let x = Math.floor(r.left - .5); x <= Math.ceil(r.right); x++) if (inside(r, x + .5, y + .5)) mark(x, y);
    }
    B.sig = sig; B.rev++; w._pathBlocked = B;
    return B;
  };
  const passable = (w, T, B, i) => (info(w, T, i) & WALK) && !B.cells[i];
  const cost = (T, i) => (T.flags[i] & ROAD ? .65 : 1) + T.z[i] * .03;

  const slowFindPath = Game.prototype.findPath;
  Game.prototype.findPath = function(sx, sy, gx, gy, climb = 1, extraBlock = null) {
    try { return fastFindPath.call(this, sx, sy, gx, gy, climb, extraBlock); }
    catch (error) { if (error !== NOT_EXACT) throw error; return slowFindPath.call(this, sx, sy, gx, gy, climb, extraBlock); }
  };
  // Same steps as game.js findPath, read from the grid.
  function fastFindPath(sx, sy, gx, gy, climb, extraBlock) {
    const w = this.world, N = w.size;
    sx = Math.floor(sx); sy = Math.floor(sy); gx = clamp(gx, 0, N - 1); gy = clamp(gy, 0, N - 1);
    if (sx === gx && sy === gy) return [];
    if (!Number.isInteger(gx) || !Number.isInteger(gy) || sx < 0 || sy < 0 || sx >= N || sy >= N) return slowFindPath.call(this, sx, sy, gx, gy, climb, extraBlock);
    const T = terrainOf(w), B = blockedOf(this), si = sy * N + sx, gi = gy * N + gx;
    // An impassable destination can never be popped from the search queue.
    if (!passable(w, T, B, gi) || extraBlock?.(gx, gy)) {
      if (this.pathBudget) this.pathBudget.lastExpansions = 0;
      return [];
    }
    info(w, T, si);
    const open = new PathQueue(), best = new Map([[si, 0]]), parent = new Map([[si, -1]]);
    const limit = this.pathBudget?.maxExpansions || 5000;
    let iter = 0, order = 0;
    open.push({x:sx, y:sy, g:0, f:0, order:order++});
    while (open.length && iter < limit) {
      iter++;
      const cur = open.pop(), ci = cur.y * N + cur.x;
      if (ci === gi) {
        if (this.pathBudget) this.pathBudget.lastExpansions = iter;
        const out = [];
        for (let i = gi; parent.get(i) !== -1; i = parent.get(i)) out.push({x:i % N + .5, y:Math.floor(i / N) + .5});
        return out.reverse();
      }
      for (const [dX, dY] of D4) {
        const nx = cur.x + dX, ny = cur.y + dY;
        if (extraBlock?.(nx, ny)) continue;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
        const ni = ny * N + nx;
        if (!passable(w, T, B, ni) || Math.abs(T.z[ni] - T.z[ci]) > climb) continue;
        const ng = cur.g + (T.flags[ni] & ROAD ? .65 : 1) + T.z[ni] * .03, old = best.get(ni);
        if (old === undefined || ng < old) {
          best.set(ni, ng); parent.set(ni, ci);
          open.push({x:nx, y:ny, g:ng, f:ng + Math.abs(gx - nx) + Math.abs(gy - ny), order:order++});
        }
      }
    }
    if (this.pathBudget) this.pathBudget.lastExpansions = iter;
    const longLimit = this.pathBudget?.maxLongSettled ?? LONG_SETTLE_LIMIT;
    // Exhausted queue: truly unreachable. Budget spent: try the long search.
    if (!open.length || extraBlock || climb !== 1 || N > MAX_LONG_SIZE || longLimit <= 0) return [];
    return longPath(this, si, gi, longLimit);
  }

  // Where a walk from tile i can begin: the tile itself, or its legal neighbours when i is blocked.
  const entries = (w, T, B, i) => {
    if (passable(w, T, B, i)) return [i];
    const N = w.size, x = i % N, y = Math.floor(i / N), out = [];
    for (const [dX, dY] of D4) {
      const nx = x + dX, ny = y + dY;
      if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      const ni = ny * N + nx;
      if (passable(w, T, B, ni) && Math.abs(T.z[ni] - T.z[i]) <= 1) out.push(ni);
    }
    return out;
  };
  // Connected areas for one step of climb, recomputed lazily after buildings or terrain change.
  const regionsOf = g => {
    const w = g.world, N = w.size, T = terrainOf(w), B = blockedOf(g), key = `${B.rev}|${T.rev}`;
    const old = w._pathRegions;
    if (old?.key === key) return old;
    const label = old?.label.length === N * N ? old.label.fill(0) : new Int32Array(N * N);
    const queue = old?.queue.length === N * N ? old.queue : new Int32Array(N * N);
    let next = 0;
    for (let s = 0; s < N * N; s++) {
      if (label[s] || !passable(w, T, B, s)) continue;
      label[s] = ++next;
      let head = 0, tail = 0;
      queue[tail++] = s;
      while (head < tail) {
        const i = queue[head++], x = i % N, y = Math.floor(i / N);
        for (const [dX, dY] of D4) {
          const nx = x + dX, ny = y + dY;
          if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
          const ni = ny * N + nx;
          if (label[ni] || !passable(w, T, B, ni) || Math.abs(T.z[ni] - T.z[i]) > 1) continue;
          label[ni] = next; queue[tail++] = ni;
        }
      }
    }
    return (w._pathRegions = {key, label, queue});
  };

  // A field grown from the goal: dist is the walking cost to the goal, next the step towards it.
  const fieldOf = (g, gi) => {
    const w = g.world, N = w.size, T = terrainOf(w), B = blockedOf(g), key = `${B.rev}|${T.rev}`;
    const cache = w._pathFields || (w._pathFields = new Map());
    let F = cache.get(gi);
    if (F?.key === key) { cache.delete(gi); cache.set(gi, F); return F; }
    F = {key, dist:new Float32Array(N * N).fill(Infinity), next:new Int8Array(N * N).fill(-1), done:new Uint8Array(N * N), heapK:[], heapI:[]};
    F.dist[gi] = 0; heapPush(F, 0, gi);
    cache.delete(gi); cache.set(gi, F);
    const max = Math.max(1, Math.min(8, Math.floor(FIELD_CELLS / (N * N))));
    while (cache.size > max) cache.delete(cache.keys().next().value);
    return F;
  };
  const heapPush = (F, k, i) => {
    const K = F.heapK, I = F.heapI;
    let n = K.length;
    K.push(k); I.push(i);
    while (n > 0) {
      const p = (n - 1) >> 1;
      if (K[p] <= k) break;
      K[n] = K[p]; I[n] = I[p]; n = p;
    }
    K[n] = k; I[n] = i;
  };
  const heapPop = F => {
    const K = F.heapK, I = F.heapI, k = K[0], i = I[0], lk = K.pop(), li = I.pop();
    if (K.length) {
      let n = 0;
      for (;;) {
        let c = n * 2 + 1;
        if (c >= K.length) break;
        if (c + 1 < K.length && K[c + 1] < K[c]) c++;
        if (K[c] >= lk) break;
        K[n] = K[c]; I[n] = I[c]; n = c;
      }
      K[n] = lk; I[n] = li;
    }
    return [k, i];
  };
  // Settle nodes until every target is reached, the area is exhausted or the budget is spent.
  const grow = (g, F, targets, limit) => {
    const w = g.world, N = w.size, T = terrainOf(w), B = blockedOf(g);
    let missing = targets.filter(i => !F.done[i]).length;
    while (missing > 0 && F.heapK.length && limit-- > 0) {
      const [k, b] = heapPop(F);
      if (F.done[b]) continue;
      F.done[b] = 1;
      if (targets.includes(b)) missing--;
      const step = cost(T, b), x = b % N, y = Math.floor(b / N);
      for (let d = 0; d < 4; d++) {
        const nx = x - D4[d][0], ny = y - D4[d][1];
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
        const a = ny * N + nx;
        if (F.done[a] || !passable(w, T, B, a) || Math.abs(T.z[a] - T.z[b]) > 1) continue;
        const nd = k + step;
        if (nd < F.dist[a]) { F.dist[a] = nd; F.next[a] = d; heapPush(F, nd, a); }
      }
    }
  };
  function longPath(g, si, gi, limit) {
    const w = g.world, N = w.size, T = terrainOf(w), B = blockedOf(g), R = regionsOf(g);
    const starts = entries(w, T, B, si);
    if (!starts.some(i => R.label[i] === R.label[gi])) return [];
    const F = fieldOf(g, gi);
    grow(g, F, starts, limit);
    let first = -1, firstCost = Infinity;
    for (const i of starts) {
      if (!F.done[i]) continue;
      const c = i === si ? 0 : cost(T, i);
      if (c + F.dist[i] < firstCost) { first = i; firstCost = c + F.dist[i]; }
    }
    if (first < 0) return [];
    const out = first === si ? [] : [{x:first % N + .5, y:Math.floor(first / N) + .5}];
    for (let i = first, guard = N * N; i !== gi && guard-- > 0;) {
      const d = F.next[i];
      if (d < 0) return [];
      i += D4[d][1] * N + D4[d][0];
      out.push({x:i % N + .5, y:Math.floor(i / N) + .5});
    }
    return out;
  }

  // Nearest tile to (tx, ty) a person can walk to from where they stand.
  Game.prototype.nearestReachableTile = function(u, tx, ty) {
    const w = this.world, N = w.size;
    if (N > MAX_LONG_SIZE) return null;
    try {
      const T = terrainOf(w), B = blockedOf(this), R = regionsOf(this), sx = Math.floor(u.x), sy = Math.floor(u.y);
      if (sx < 0 || sy < 0 || sx >= N || sy >= N) return null;
      const labels = new Set(entries(w, T, B, sy * N + sx).map(i => R.label[i]));
      let best = null;
      const look = (x, y) => {
        if (x < 0 || y < 0 || x >= N || y >= N || !labels.has(R.label[y * N + x])) return;
        const d = Math.hypot(x - tx, y - ty);
        if (!best || d < best.d) best = {x, y, d};
      };
      // Square rings around the target; a ring at distance r cannot beat a tile already within r.
      for (let r = 0; r < N && !(best && best.d <= r); r++) {
        if (!r) { look(tx, ty); continue; }
        for (let x = tx - r; x <= tx + r; x++) { look(x, ty - r); look(x, ty + r); }
        for (let y = ty - r + 1; y < ty + r; y++) { look(tx - r, y); look(tx + r, y); }
      }
      return best && {x:best.x, y:best.y};
    } catch (error) { if (error === NOT_EXACT) return null; throw error; }
  };

  // Player move orders: say when the way is a long detour, and when there is no way go as near as possible.
  const NOTES = {
    long:['%s fa il giro: per arrivarci bisogna aggirare il fiume o un dislivello.', 'Il gruppo fa il giro: per arrivarci bisogna aggirare il fiume o un dislivello.'],
    near:['Lì non si arriva a piedi: %s va al punto raggiungibile più vicino.', 'Lì non si arriva a piedi: il gruppo va al punto raggiungibile più vicino.'],
    none:['%s non può arrivarci: da qui non c’è un passaggio.', 'Lì non si arriva: da qui non c’è un passaggio.']
  };
  const RANK = {long:1, near:2, none:3};
  // One message per order, shown after the order's own "si sposta" text.
  const note = (g, kind, u) => {
    const pending = g._pathNote;
    if (pending) { pending.people.add(u.name); if (RANK[kind] > RANK[pending.kind]) pending.kind = kind; return; }
    g._pathNote = {kind, people:new Set([u.name])};
    Promise.resolve().then(() => {
      const n = g._pathNote; g._pathNote = null;
      if (!n) return;
      const [one, many] = NOTES[n.kind];
      g._exploreSay = true;
      try { g.message(n.people.size > 1 ? many : one.replace('%s', [...n.people][0])); } finally { g._exploreSay = false; }
    });
  };
  const assignMove = Game.prototype.assignMove;
  Game.prototype.assignMove = function(u, tx, ty) {
    const result = assignMove.call(this, u, tx, ty), sx = Math.floor(u.x), sy = Math.floor(u.y);
    if (u.path.length) {
      if (u.path.length > 2.5 * Math.hypot(tx - sx, ty - sy) + 20) note(this, 'long', u);
      return result;
    }
    if (sx === tx && sy === ty) return result;
    const near = this.nearestReachableTile(u, tx, ty);
    if (near && (near.x !== sx || near.y !== sy)) {
      const path = this.findPath(u.x, u.y, near.x, near.y, 1);
      if (path.length) {
        u.task = {type:'move', x:near.x, y:near.y}; u.path = path; u.state = 'moving';
        note(this, 'near', u);
        return result;
      }
    }
    note(this, 'none', u);
    return result;
  };

  // Read the terrain in slices of at most 2 ms per frame, also while paused on the start screens,
  // so the first long search does not stall (a 256 map takes a few seconds on a phone).
  const update = Game.prototype.update;
  Game.prototype.update = function(...args) {
    const result = update.apply(this, args), w = this.world;
    if (w && w.size <= MAX_LONG_SIZE) {
      const T = terrainOf(w), n = w.size * w.size;
      if (T.filled < n) {
        const start = performance.now();
        let i = T.cursor || 0;
        try {
          for (let k = 0; k < 4096 && T.filled < n; k++) {
            info(w, T, i); i = (i + 1) % n;
            if ((k & 63) === 63 && performance.now() - start > 2) break;
          }
        } catch (error) { if (error !== NOT_EXACT) throw error; }
        T.cursor = i;
      }
    }
    return result;
  };
})();
