// UI restyle layout (Claude, 23/10/2026) · PROVVISORIO, da approvare da Simone.
// The map fills the screen and never resizes when panels open: this module measures the top bar
// and the panel, publishes them as CSS variables for the floating controls, recentres the camera
// into the part of the map that stays visible, lets the panel shrink to its title, and adds the
// PC controls: mouse wheel zoom, Space pause, Esc cancel, arrow keys or WASD to pan.
(() => {
  'use strict';
  const node = id => (typeof document !== 'undefined' ? document.getElementById(id) : null);
  const ZOOM_MIN = .48, ZOOM_MAX = 2.3; // the same limits as the pinch gesture in touch-modifier.js

  // Top bar height and the part of the map covered by the panel (bottom sheet or side panel).
  Game.prototype.measurePanels = function() {
    const wrap = node('worldWrap'), hud = typeof document !== 'undefined' ? document.querySelector('.hud-top') : null, dock = node('commandDock');
    if (!wrap?.getBoundingClientRect || !hud?.getBoundingClientRect) return this.uiInsets || {top:0, bottom:0, right:0, left:0};
    const W = wrap.getBoundingClientRect(), H = hud.getBoundingClientRect(), D = dock && !dock.hidden ? dock.getBoundingClientRect() : null;
    const insets = {top:Math.max(0, Math.round(H.bottom - W.top)), bottom:0, right:0, left:0};
    if (D && D.width > 0 && D.height > 0) {
      if (D.left <= W.left + 2 && D.right >= W.right - 2) insets.bottom = Math.max(0, Math.round(W.bottom - D.top));
      else insets.right = Math.max(0, Math.round(W.right - D.left));
    }
    // The exploration bar also sits at the bottom: zoom, MOD and messages stay above it.
    const explore = node('exploreBar'), E = explore && !explore.classList?.contains?.('hidden') && !explore.hidden ? explore.getBoundingClientRect() : null;
    if (E && E.height > 0) insets.bottom = Math.max(insets.bottom, Math.round(W.bottom - E.top));
    this.uiInsets = insets;
    const root = document.body?.style;
    root?.setProperty?.('--hud-h', `${insets.top}px`);
    root?.setProperty?.('--dock-h', `${insets.bottom}px`);
    root?.setProperty?.('--dock-w', `${insets.right}px`);
    return insets;
  };
  // Put the point the camera was just moved to in the middle of the visible map, not under a panel.
  Game.prototype.offsetForPanels = function() {
    const i = this.measurePanels(), z = this.camera?.zoom || 1;
    if (!this.camera || !(i.top || i.bottom || i.right || i.left)) return;
    this.camera.x += (i.right - i.left) / 2 / z;
    this.camera.y += (i.bottom - i.top) / 2 / z;
  };
  for (const name of ['centerOnBase', 'selectCommunityPerson', 'selectOwnedIds', 'centerFromMinimap', 'chooseScenarioDefense', 'focusSettlement',
    'focusScenarioThreat', 'focusScenarioThief', 'focusRecoveredScenarioFood', 'focusScenarioStore', 'focusScenarioNext']) {
    const fn = Game.prototype[name];
    if (!fn) continue;
    Game.prototype[name] = function(...args) {
      const camera = this.camera, x = camera?.x, y = camera?.y;
      const result = fn.apply(this, args);
      if (camera && this.camera === camera && (camera.x !== x || camera.y !== y)) this.offsetForPanels();
      return result;
    };
  }

  // The panel can shrink to its title to free the map; the choice lasts until the page reloads.
  Game.prototype.setDockCollapsed = function(collapsed) {
    this.dockCollapsed = !!collapsed;
    const dock = node('commandDock'), button = node('dockCollapse');
    dock?.classList?.toggle?.('collapsed', this.dockCollapsed);
    if (button) {
      button.textContent = this.dockCollapsed ? '▴' : '▾';
      button.setAttribute?.('aria-expanded', String(!this.dockCollapsed));
      button.setAttribute?.('aria-label', this.dockCollapsed ? 'Apri il pannello' : 'Riduci il pannello');
    }
    this.measurePanels();
  };

  // Mouse wheel zoom keeps the point under the cursor still.
  Game.prototype.wheelZoom = function(sx, sy, deltaY) {
    const before = this.screenToWorld(sx, sy);
    this.camera.zoom = clamp(this.camera.zoom * Math.exp(-deltaY * .0015), ZOOM_MIN, ZOOM_MAX);
    const after = this.screenToWorld(sx, sy);
    this.camera.x += before.x - after.x;
    this.camera.y += before.y - after.y;
  };
  const typing = target => /^(INPUT|SELECT|TEXTAREA)$/.test(target?.tagName || '') || target?.isContentEditable;
  Game.prototype.handleShortcut = function(e) {
    if (typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return false;
    const pan = 3 * TILE / (this.camera?.zoom || 1), key = e.key;
    if (key === 'Escape') {
      if (this.actionWheel) this.hideActionWheel?.();
      else if (this.buildMode || this.pendingBuildPlan) this.cancelBuildPlacement?.();
      else if (this.orderMode) { this.orderMode = null; this.syncModeButtons?.(); }
      else if (this.selected) node('clearSelection')?.click?.();
      return true;
    }
    if (key === ' ' && !e.repeat) { node('pauseBtn')?.click?.(); return true; }
    if (key === '+' || key === '=') { node('zoomIn')?.click?.(); return true; }
    if (key === '-' || key === '_') { node('zoomOut')?.click?.(); return true; }
    const move = {ArrowLeft:[-1, 0], ArrowRight:[1, 0], ArrowUp:[0, -1], ArrowDown:[0, 1], a:[-1, 0], d:[1, 0], w:[0, -1], s:[0, 1]}[key.length === 1 ? key.toLowerCase() : key];
    if (move && this.camera) { this.camera.x += move[0] * pan; this.camera.y += move[1] * pan; return true; }
    return false;
  };

  const initUI = Game.prototype.initUI;
  Game.prototype.initUI = function() {
    initUI.call(this);
    if (typeof document === 'undefined' || window.__TEST_HARNESS__) return;
    const collapse = node('dockCollapse');
    if (collapse) collapse.onclick = () => this.setDockCollapsed(!this.dockCollapsed);
    const remeasure = () => { if (!this._measureQueued) { this._measureQueued = true; requestAnimationFrame(() => { this._measureQueued = false; this.measurePanels(); }); } };
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(remeasure);
      for (const el of [node('worldWrap'), document.querySelector('.hud-top'), node('commandDock'), node('exploreBar')]) if (el) observer.observe(el);
    }
    if (typeof MutationObserver !== 'undefined') for (const id of ['commandDock', 'exploreBar']) if (node(id)) new MutationObserver(remeasure).observe(node(id), {attributes:true, attributeFilter:['hidden', 'class']});
    addEventListener('resize', remeasure);
    addEventListener('orientationchange', remeasure);
    this.canvas?.addEventListener('wheel', e => {
      e.preventDefault();
      const r = this.canvas.getBoundingClientRect();
      this.wheelZoom(e.clientX - r.left, e.clientY - r.top, e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY);
    }, {passive:false});
    addEventListener('keydown', e => { if (this.handleShortcut(e)) e.preventDefault(); });
    // A mouse can hover: the fixed labels of the bar get their full text as a tooltip.
    for (const el of document.querySelectorAll('.hud-top .resource-counter, #relationsBarBtn, .hud-top .game-menu>summary')) if (!el.title) el.title = el.getAttribute('aria-label') || '';
    remeasure();
  };
})();
