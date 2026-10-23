// Terra Italica visual standard P16; palette rivista sul campione approvato.
// One terrain tile is conceptually a 16x16 art-pixel grid.
// The gameplay engine keeps its current logical tile size while the renderer
// already follows the future pixel-art grammar.
(() => {
  'use strict';

  if (typeof Game === 'undefined' || typeof BIOME === 'undefined' || typeof hash === 'undefined') return;

  const P16 = 16;
  const PALETTE = {
    sea:      {light:'#3d5355', dark:'#2d4042', accent:'#587074', mode:'water'},
    river:    {light:'#56716e', dark:'#3e5553', accent:'#6b8580', mode:'water'},
    beach:    {light:'#aa9d77', dark:'#887d5e', accent:'#b9aa83', mode:'grain'},
    grass:    {light:'#7b8660', dark:'#5b6846', accent:'#909770', mode:'grain'},
    forest:   {light:'#526b45', dark:'#374b33', accent:'#637651', mode:'grain'},
    scrub:    {light:'#837c59', dark:'#686347', accent:'#9a9069', mode:'grain'},
    plain:    {light:'#907255', dark:'#6d5840', accent:'#a0805b', mode:'grain'},
    mountain: {light:'#77766d', dark:'#595a54', accent:'#8c8a80', mode:'rock'},
    marsh:    {light:'#5e6c53', dark:'#465240', accent:'#738066', mode:'grain'}
  };

  const originalResize = Game.prototype.resize;
  Game.prototype.resize = function(...args) {
    const result = originalResize.apply(this, args);
    this.ctx.imageSmoothingEnabled = false;
    return result;
  };

  const canvas = document.getElementById('world');
  if (canvas) canvas.getContext('2d').imageSmoothingEnabled = false;

  Game.prototype.drawTile = function(x, y, ts) {
    const t = this.world.tile(x, y);
    const p = this.worldToScreen(x * TILE, y * TILE);
    const ctx = this.ctx;
    const style = PALETTE[t.biome];
    const base = BIOME[t.biome].color;
    const ap = ts / P16;

    // Base coat. Slight overscan prevents hairline seams while panning.
    ctx.globalAlpha = 1;
    ctx.fillStyle = base;
    ctx.fillRect(p.x, p.y, ts + 0.65, ts + 0.65);

    // Macro-noise: sixteen deterministic 4x4 art-pixel regions.
    // Low contrast keeps terrain subordinate to units and buildings.
    if (style) {
      const macro = ap * 4;
      for (let my = 0; my < 4; my++) {
        for (let mx = 0; mx < 4; mx++) {
          const n = hash(x * 11 + mx, y * 11 + my, this.seed + 1401);
          if (n > .72) {
            ctx.globalAlpha = .16;
            ctx.fillStyle = style.light;
            ctx.fillRect(p.x + mx * macro, p.y + my * macro, macro + .15, macro + .15);
          } else if (n < .27) {
            ctx.globalAlpha = .14;
            ctx.fillStyle = style.dark;
            ctx.fillRect(p.x + mx * macro, p.y + my * macro, macro + .15, macro + .15);
          }
        }
      }

      // Biome-specific P16 accents. Every mark lands on the 16x16 art grid.
      ctx.globalAlpha = .22;
      ctx.fillStyle = style.accent;
      if (style.mode === 'water') {
        for (let i = 0; i < 3; i++) {
          const yy = 3 + Math.floor(hash(x * 23 + i, y * 29, this.seed + 1510) * 10);
          const xx = 1 + Math.floor(hash(x * 31, y * 17 + i, this.seed + 1511) * 8);
          const len = 3 + Math.floor(hash(x * 13 + i, y * 37, this.seed + 1512) * 5);
          ctx.fillRect(p.x + xx * ap, p.y + yy * ap, len * ap, ap);
        }
      } else if (style.mode === 'rock') {
        for (let i = 0; i < 4; i++) {
          const xx = 1 + Math.floor(hash(x * 41 + i, y * 19, this.seed + 1520) * 13);
          const yy = 1 + Math.floor(hash(x * 17, y * 43 + i, this.seed + 1521) * 13);
          ctx.fillRect(p.x + xx * ap, p.y + yy * ap, 2 * ap, ap);
        }
      } else {
        for (let i = 0; i < 5; i++) {
          const xx = Math.floor(hash(x * 47 + i, y * 31, this.seed + 1530) * P16);
          const yy = Math.floor(hash(x * 29, y * 53 + i, this.seed + 1531) * P16);
          ctx.fillRect(p.x + xx * ap, p.y + yy * ap, ap, ap);
        }
      }
    }

    // Height cue kept on-grid and deliberately subtle.
    if (t.z > 1 && t.biome !== 'mountain') {
      ctx.globalAlpha = .12;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.x, p.y, ts, Math.max(ap, Math.min(ap * 2, t.z * ap * .55)));
    }

    // Roads are already rendered as chunky P16 marks instead of antialiased strokes.
    if (t.road) {
      const jitter = hash(x, y, this.seed + 1600) > .5 ? 0 : 1;
      ctx.globalAlpha = .88;
      ctx.fillStyle = '#9e895f';
      ctx.fillRect(p.x + ap, p.y + (7 + jitter) * ap, 14 * ap, 3 * ap);
      ctx.globalAlpha = .28;
      ctx.fillStyle = '#574a35';
      ctx.fillRect(p.x + ap, p.y + (9 + jitter) * ap, 14 * ap, ap);
    }

    // Grid is only a diagnostic at close zoom and follows the tile boundary.
    if (this.camera.zoom > 1.55) {
      ctx.globalAlpha = .12;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x, p.y, ts, ts);
    }
    ctx.globalAlpha = 1;
  };
})();
