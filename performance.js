// Optional development meter. Enabled only by ?perf=1; never changes simulation state.
(() => {
  'use strict';
  if (typeof location === 'undefined' || new URLSearchParams(location.search).get('perf') !== '1') return;

  const MAX_SAMPLES = 900;
  const WORKING_TYPES = new Set(['gather','haul','production','farm','build','repair','livestock','caravan','tame']);
  const samples = new Array(MAX_SAMPLES);
  let count = 0, cursor = 0, lastDrawAt = 0, lastUpdateMs = 0, pendingUiMs = 0, activeGame = null, startedAt = performance.now();
  const clock = () => performance.now();
  const record = sample => { samples[cursor] = sample; cursor = (cursor + 1) % MAX_SAMPLES; count = Math.min(count + 1, MAX_SAMPLES); };
  const values = field => Array.from({length: count}, (_, i) => samples[i][field]).sort((a, b) => a - b);
  const at = (sorted, fraction) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)] : null;
  const round = n => n == null ? null : Math.round(n * 10) / 10;

  const oldUpdate = Game.prototype.update;
  Game.prototype.update = function (...args) {
    const start = clock();
    try { return oldUpdate.apply(this, args); }
    finally { lastUpdateMs = clock() - start; }
  };
  const oldUI = Game.prototype.updateUI;
  if (oldUI) Game.prototype.updateUI = function (...args) {
    const start = clock();
    try { return oldUI.apply(this, args); }
    finally { pendingUiMs += clock() - start; }
  };
  const oldDraw = Game.prototype.draw;
  Game.prototype.draw = function (...args) {
    const start = clock();
    activeGame = this;
    try { return oldDraw.apply(this, args); }
    finally {
      const end = clock(), interval = lastDrawAt ? end - lastDrawAt : 0;
      if (interval > 0 && interval < 1000) record({frame: interval, update: lastUpdateMs, draw: end - start, ui: pendingUiMs, gap: Math.max(0, interval - lastUpdateMs - (end - start) - pendingUiMs)});
      pendingUiMs = 0;lastDrawAt = end;
    }
  };

  const report = () => {
    const frame = values('frame'), update = values('update'), draw = values('draw'), ui = values('ui'), gap = values('gap');
    const median = at(frame, .5);
    const people=activeGame?.units??null;
    let peopleVisible=null,peopleWorking=null;
    if(people){
      peopleWorking=people.filter(u=>u.health>0&&u.location?.kind==='world'&&WORKING_TYPES.has(u.task?.type)).length;
      if(typeof TILE!=='undefined'&&activeGame?.world&&typeof activeGame.screenToWorld==='function'){
        const min=activeGame.screenToWorld(0,0),max=activeGame.screenToWorld(activeGame.viewW,activeGame.viewH),size=activeGame.world.size;
        const x0=Math.max(0,Math.floor(min.x/TILE)-1),x1=Math.min(size-1,Math.ceil(max.x/TILE)+1);
        const y0=Math.max(0,Math.floor(min.y/TILE)-1),y1=Math.min(size-1,Math.ceil(max.y/TILE)+1);
        peopleVisible=people.filter(u=>u.health>0&&u.location?.kind==='world'&&u.x>=x0-2&&u.x<=x1+2&&u.y>=y0-2&&u.y<=y1+2).length;
      }
    }
    return {
      sampleCount: count, sampleDurationMs: round(clock() - startedAt),
      mapTiles: activeGame?.world?.size ?? null,
      people: people?.length ?? null,peopleVisible,peopleWorking,
      resources: activeGame?.world?.resources?.length ?? null,
      frameMedianMs: round(median), frameP95Ms: round(at(frame, .95)), frameP99Ms: round(at(frame, .99)),
      fpsMedian: median ? round(1000 / median) : null,
      updateP95Ms: round(at(update, .95)), drawP95Ms: round(at(draw, .95)), uiP95Ms: round(at(ui, .95)), schedulingGapP95Ms: round(at(gap, .95)),
      framesOver50Ms: frame.filter(ms => ms > 50).length,
      jsHeapMiB: performance.memory?.usedJSHeapSize ? round(performance.memory.usedJSHeapSize / 1048576) : null
    };
  };
  const exportReport = () => JSON.stringify({
    capturedAt: new Date().toISOString(),
    browser: navigator.userAgent,
    viewport: {width: innerWidth, height: innerHeight, dpr: devicePixelRatio},
    worldSeed: activeGame?.seed ?? null,
    gameDays: activeGame?.totalDays ?? null,
    stressFixture: window.__terraStress ?? null,
    ...report()
  }, null, 2);
  window.__terraPerf = {
    report, exportReport,
    reset() { count = 0; cursor = 0; lastDrawAt = 0; pendingUiMs = 0; startedAt = clock(); },
    samples() { return Array.from({length: count}, (_, i) => samples[(cursor - count + i + MAX_SAMPLES) % MAX_SAMPLES]); }
  };

  const meter = document.createElement('pre');
  meter.setAttribute('aria-hidden', 'true');
  meter.style.cssText = 'position:fixed;top:env(safe-area-inset-top,0px);left:0;z-index:9999;margin:0;padding:5px 7px;background:#111d;color:#fff;font:11px/1.35 monospace;pointer-events:none;max-width:60vw;white-space:pre-wrap';
  document.body.appendChild(meter);
  const copyButton = document.createElement('button');
  copyButton.type = 'button';
  copyButton.textContent = 'Copia report FPS';
  copyButton.setAttribute('aria-label', 'Copia il report delle prestazioni');
  copyButton.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top,0px) + 72px);left:4px;z-index:10000;padding:7px 9px;background:#172521;color:#fff;border:1px solid #a7c4aa;border-radius:5px;font:12px sans-serif;touch-action:manipulation';
  copyButton.addEventListener('click', async () => {
    const payload = exportReport();
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(payload);
      copyButton.textContent = 'Report copiato';
    } catch (_) {
      window.prompt('Copia il report FPS', payload);
      copyButton.textContent = 'Report pronto';
    }
    setTimeout(() => { copyButton.textContent = 'Copia report FPS'; }, 3000);
  });
  document.body.appendChild(copyButton);
  const refresh = () => {
    const r = report();
    meter.textContent = `PERF ${r.mapTiles ?? '?'}² · ${r.people ?? '?'} persone\nFPS med ${r.fpsMedian ?? '?'} · frame p95 ${r.frameP95Ms ?? '?'} ms\nupdate p95 ${r.updateP95Ms ?? '?'} · draw p95 ${r.drawP95Ms ?? '?'} ms\nUI p95 ${r.uiP95Ms ?? '?'} · attesa p95 ${r.schedulingGapP95Ms ?? '?'} ms`;
  };
  refresh();
  setInterval(refresh, 1000);
})();
