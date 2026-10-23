// RTS mobile input grammar
// Free tap selects owned people/buildings or gives the selected group an order. MOD adds to selection or draws a box.
(() => {
  'use strict';

  const modifier = document.getElementById('touchModifier');
  if (!modifier || typeof Game === 'undefined') return;

  const showDesktopHelp = () => document.documentElement?.classList.add('desktop-input');
  if (navigator.maxTouchPoints === 0) showDesktopHelp();

  let modifierPointerId = null;
  let shiftHeld = false;
  const rightPointers = new Set();
  let modifierHeld = false;

  const syncModifier = () => {
    modifierHeld = modifierPointerId !== null || shiftHeld || rightPointers.size > 0;
    modifier.classList.toggle('active', modifierHeld);
    modifier.setAttribute('aria-pressed', modifierHeld ? 'true' : 'false');
  };
  const clearModifiers = () => {
    modifierPointerId = null;
    shiftHeld = false;
    rightPointers.clear();
    syncModifier();
  };
  addEventListener('keydown', e => { showDesktopHelp(); if (e.key === 'Shift') { shiftHeld = true; syncModifier(); } });
  addEventListener('keyup', e => { if (e.key === 'Shift') { shiftHeld = false; syncModifier(); } });
  for (const id of ['world', 'minimap']) document.getElementById(id)?.addEventListener('contextmenu', e => e.preventDefault());

  modifier.addEventListener('pointerdown', e => {
    if (modifierPointerId !== null) return;
    modifierPointerId = e.pointerId;
    modifier.setPointerCapture?.(e.pointerId);
    syncModifier();
    e.preventDefault();
    e.stopPropagation();
  });

  const releaseModifier = e => {
    if (modifierPointerId !== null && e.pointerId !== modifierPointerId) return;
    modifierPointerId = null;
    syncModifier();
    e.preventDefault();
    e.stopPropagation();
  };

  modifier.addEventListener('pointerup', releaseModifier);
  modifier.addEventListener('pointercancel', releaseModifier);
  modifier.addEventListener('lostpointercapture', () => {
    modifierPointerId = null;
    syncModifier();
  });
  addEventListener('blur', clearModifiers);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearModifiers(); });

  const originalDraw = Game.prototype.draw;
  const originalDrawHuman = Game.prototype.drawHuman;

  const clearUnitSelection = game => {
    game.groupSelection = [];
    for (const u of game.units) u.selected = false;
  };

  const selectUnits = (game, units) => {
    const alive = units.filter(u => u.health > 0 && u.owner === 0);
    clearUnitSelection(game);
    game.groupSelection = alive;
    for (const u of alive) u.selected = true;
    game.selected = alive[0] || null;
    if (alive[0]) game.lastSelectedUnit = alive[0];
    game.updateUI();
  };

  const selectedUnits = game => {
    const group = game.selected instanceof Unit ? (game.groupSelection || []).filter(u => u.owner === 0 && u.health > 0 && u.location.kind === 'world' && game.units.includes(u)) : [];
    if (group.length) return group;
    return game.selected instanceof Unit && game.selected.owner === 0 && game.selected.health > 0 ? [game.selected] : [];
  };

  Game.prototype.rtsSelectedUnits = function() { return selectedUnits(this); };

  const localPoint = (game, e) => {
    const r = game.canvas.getBoundingClientRect();
    return {x:e.clientX-r.left, y:e.clientY-r.top};
  };

  Game.prototype.rtsLeftTap = function(sx, sy, additive = false) {
    const w = this.screenToWorld(sx, sy);
    const tx = Math.floor(w.x / TILE), ty = Math.floor(w.y / TILE);
    if (tx < 0 || ty < 0 || tx >= this.world.size || ty >= this.world.size) return;

    // Building placement remains a deliberate tool action.
    if (this.buildMode && !additive) {
      this.placeBuild(this.buildMode, tx, ty);
      return;
    }

    const pos = {x:w.x/TILE, y:w.y/TILE};
    if (this.orderMode && !additive) {
      const group = selectedUnits(this);
      if (!group.length) { this.message('Seleziona prima uno o più abitanti.'); return; }
      const order = this.orderMode;
      for (const u of group) this.applyOrder(order, pos, tx, ty, u);
      return;
    }
    const entity = this.pickEntity(pos);
    if (additive) {
      if (!(entity instanceof Unit) || entity.owner !== 0 || entity.health <= 0 || entity.location.kind !== 'world') return;
      const group = selectedUnits(this);
      selectUnits(this, group.includes(entity) ? group.filter(u => u !== entity) : [...group, entity]);
      return;
    }
    clearUnitSelection(this);
    this.selected = entity || null;
    if (entity instanceof Unit && entity.owner === 0) {
      entity.selected = true;
      this.groupSelection = [entity];
      this.lastSelectedUnit = entity;
    }
    this.orderMode = null;
    this.syncModeButtons();
    this.updateUI();
  };

  Game.prototype.rtsContextTap = function(sx, sy) {
    if (this.buildMode || this.orderMode) { this.rtsLeftTap(sx, sy); return; }
    const w = this.screenToWorld(sx, sy);
    const tx = Math.floor(w.x / TILE), ty = Math.floor(w.y / TILE);
    if (tx < 0 || ty < 0 || tx >= this.world.size || ty >= this.world.size) return;
    const pos = {x:w.x/TILE, y:w.y/TILE};
    const entity = this.pickEntity(pos);
    if (entity?.owner === 0 && (entity instanceof Unit || entity instanceof Building)) {
      this.rtsLeftTap(sx, sy);
      return;
    }
    const group = selectedUnits(this);
    if (!group.length) {
      this.rtsLeftTap(sx, sy);
      return;
    }

    if (entity instanceof ResourceNode) {
      for (const u of group) this.assignGather(u, entity);
      this.message(`${group.length} abitanti: raccolta ${this.resourceName(entity.type)}.`);
    } else if (entity instanceof Raider || (entity instanceof Animal && entity.type === 'wolf')) {
      for (const u of group) this.assignAttack(u, entity);
      this.message(`${group.length} abitanti attaccano la minaccia.`);
    } else if (entity instanceof Animal && entity.type === 'sheep' && entity.owner === -1) {
      for (const u of group) this.assignTame(u, entity);
      this.message(`${group.length} abitanti tentano la domesticazione.`);
    } else if (entity instanceof Building && entity.type === 'farm' && entity.built) {
      for (const u of group) this.assignFarm(u, entity);
      this.message(`${group.length} abitanti assegnati al campo.`);
    } else if (entity instanceof Building && !entity.built) {
      for (const u of group) this.assignBuild(u, entity);
      this.message(`${group.length} abitanti assegnati al cantiere.`);
    } else {
      for (const u of group) this.assignMove(u, tx, ty);
      this.message(`${group.length} abitanti si spostano.`);
    }

    this.orderMode = null;
    this.syncModeButtons();
    this.updateUI();
  };

  Game.prototype.rtsFinishBoxSelection = function(box) {
    const left = Math.min(box.startX, box.x);
    const right = Math.max(box.startX, box.x);
    const top = Math.min(box.startY, box.y);
    const bottom = Math.max(box.startY, box.y);
    const units = this.units.filter(u => {
      if (u.health <= 0 || u.location.kind !== 'world') return false;
      const p = this.worldToScreen(u.x*TILE, u.y*TILE);
      return p.x >= left && p.x <= right && p.y >= top && p.y <= bottom;
    });
    const combined = [...new Set([...selectedUnits(this), ...units])];
    selectUnits(this, combined);
    this.message(units.length ? `${combined.length} abitanti selezionati.` : 'Nessun abitante nel riquadro.');
  };

  // Full replacement of the canvas pointer grammar:
  // free tap = select owned entity or context command; free drag = camera pan; MOD tap = add/remove;
  // MOD drag = box-select; two free fingers = pinch zoom.
  Game.prototype.pointerDown = function(e) {
    if (e.pointerType === 'mouse') showDesktopHelp();
    if (e.pointerType === 'mouse' && e.button === 2) {
      rightPointers.add(e.pointerId);
      syncModifier();
    }
    this.canvas.setPointerCapture(e.pointerId);
    this.rtsPointers ||= new Map();
    const p = localPoint(this, e);
    this.rtsPointers.set(e.pointerId, {
      id:e.pointerId,
      x:e.clientX, y:e.clientY,
      localX:p.x, localY:p.y,
      startX:e.clientX, startY:e.clientY,
      startLocalX:p.x, startLocalY:p.y,
      startWorld:this.screenToWorld(p.x,p.y),
      lastX:e.clientX, lastY:e.clientY
    });

    if (!modifierHeld && this.rtsPointers.size === 2) {
      const pts = [...this.rtsPointers.values()];
      this.rtsGesture = {
        type:'pinch',
        prevDist:Math.hypot(pts[0].x-pts[1].x, pts[0].y-pts[1].y)
      };
      this.rtsSelectionBox = null;
      this.buildPreview = null;
      e.preventDefault();
      return;
    }

    if (this.rtsPointers.size > 1) {
      e.preventDefault();
      return;
    }

    this.rtsGesture = {
      type: this.buildMode ? (e.pointerType === 'mouse' && e.button === 2 ? 'buildCancel' : modifierHeld ? 'leftCandidate' : 'buildDrag') : (modifierHeld ? 'leftCandidate' : 'modCandidate'),
      buildType:this.buildMode,
      pointerId:e.pointerId
    };
    this.rtsSelectionBox = null;
    if(this.rtsGesture.type==='buildCancel')this.cancelBuildPlacement();
    else if(this.rtsGesture.type==='buildDrag')this.updateBuildPreview(p.x,p.y);
    e.preventDefault();
  };

  Game.prototype.pointerMove = function(e) {
    if (!this.rtsPointers?.has(e.pointerId)) return;
    const p = this.rtsPointers.get(e.pointerId);
    const lp = localPoint(this, e);
    p.x=e.clientX; p.y=e.clientY; p.localX=lp.x; p.localY=lp.y;

    if (!modifierHeld && this.rtsPointers.size === 2) {
      const pts=[...this.rtsPointers.values()];
      const d=Math.hypot(pts[0].x-pts[1].x, pts[0].y-pts[1].y);
      if (this.rtsGesture?.type !== 'pinch') this.rtsGesture={type:'pinch',prevDist:d};
      this.buildPreview=null;
      const prev=this.rtsGesture.prevDist || d;
      if (Math.abs(d-prev)>1) this.camera.zoom=clamp(this.camera.zoom*(d/prev),.48,2.3);
      this.rtsGesture.prevDist=d;
      p.lastX=e.clientX; p.lastY=e.clientY;
      e.preventDefault();
      return;
    }

    const g=this.rtsGesture;
    if (!g || g.pointerId !== e.pointerId) return;
    if(g.type==='buildDrag'||g.type==='buildCancel'){
      if(e.pointerType==='mouse'&&e.button===2){g.type='buildCancel';this.cancelBuildPlacement();}
      else if(!modifierHeld&&g.type==='buildDrag'&&this.buildMode===g.buildType)this.updateBuildPreview(lp.x,lp.y);
      e.preventDefault();return;
    }
    const moved=Math.hypot(e.clientX-p.startX, e.clientY-p.startY);

    if (g.type === 'leftCandidate' && moved > 7) {
      g.type='leftBox';
      this.rtsSelectionBox={
        startX:p.startLocalX,startY:p.startLocalY,
        startWorld:p.startWorld,
        x:lp.x,y:lp.y,active:true
      };
    } else if (g.type === 'leftBox') {
      this.rtsSelectionBox.x=lp.x;
      this.rtsSelectionBox.y=lp.y;
    } else if (g.type === 'modCandidate' && moved > 7) {
      g.type='modPan';
    }

    if (g.type === 'modPan') {
      const dx=e.clientX-p.lastX, dy=e.clientY-p.lastY;
      this.camera.x-=dx/this.camera.zoom;
      this.camera.y-=dy/this.camera.zoom;
    }

    p.lastX=e.clientX; p.lastY=e.clientY;
    e.preventDefault();
  };

  Game.prototype.pointerUp = function(e) {
    const p=this.rtsPointers?.get(e.pointerId);
    if (!p) return;
    const lp=localPoint(this,e);
    p.x=e.clientX;p.y=e.clientY;p.localX=lp.x;p.localY=lp.y;
    const g=this.rtsGesture;

    this.rtsPointers.delete(e.pointerId);

    if (g?.type === 'pinch') {
      if (this.rtsPointers.size < 2) this.rtsGesture=null;
      e.preventDefault();
      return;
    }

    if (g?.pointerId === e.pointerId) {
      if(g.type==='buildDrag'||g.type==='buildCancel'){
        if(g.type==='buildCancel')this.cancelBuildPlacement();
        else if(modifierHeld)this.buildPreview=null;
        else if(this.buildMode===g.buildType){const preview=this.updateBuildPreview(lp.x,lp.y);if(preview?.valid)this.placeBuild(preview.type,preview.x,preview.y);else if(preview?.error)this.message(preview.error);}
        this.buildPreview=null;
      } else if (g.type === 'leftBox' && this.rtsSelectionBox) {
        this.rtsSelectionBox.x=lp.x;
        this.rtsSelectionBox.y=lp.y;
        this.rtsSyncSelectionBox();
        this.rtsFinishBoxSelection(this.rtsSelectionBox);
      } else if (g.type === 'leftCandidate') {
        this.rtsLeftTap(lp.x,lp.y,true);
      } else if (g.type === 'modCandidate') {
        this.rtsContextTap(lp.x,lp.y);
      }
    }

    this.rtsSelectionBox=null;
    this.rtsGesture=null;
    e.preventDefault();
  };
  const finishPointer = Game.prototype.pointerUp;
  Game.prototype.pointerUp = function(e) {
    try { return finishPointer.call(this, e); }
    finally {
      if (e.pointerType === 'mouse' && e.button === 2) {
        rightPointers.delete(e.pointerId);
        syncModifier();
      }
    }
  };

  Game.prototype.cancelBuildPlacement=function(){this.buildMode=null;this.buildPreview=null;this.syncModeButtons();};
  Game.prototype.updateBuildPreview=function(sx,sy){
    if(!this.buildMode){this.buildPreview=null;return null;}
    const type=this.buildMode,w=this.screenToWorld(sx,sy),x=Math.floor(w.x/TILE),y=Math.floor(w.y/TILE);
    let error=sx<0||sy<0||sx>this.viewW||sy>this.viewH?'Rilascia dentro la mappa.':null;
    if(!error)error=this.villagePlacementError(type,x,y);
    const cost=type==='road'?{wood:1}:BUILD_COSTS[type];
    if(!error&&(!cost||!this.canPay(cost,this.fundingBaseAt(x,y))))error='Risorse disponibili insufficienti.';
    if(!error&&type==='road'&&this.world.tile(x,y)?.road)error='Qui c’è già un sentiero.';
    const builder=this.selected instanceof Unit&&this.selected.location.kind==='world'?this.selected:this.units.find(u=>u.health>0&&u.location.kind==='world'&&!u.mobilized&&u.state==='idle');
    if(!error&&!this.constructionCheck(type,builder).ok)error=builder?this.constructionRequirementText(type,builder):'Serve un costruttore disponibile.';
    const ghost=this.buildPreview?.type===type?this.buildPreview.ghost:new Building(type,x,y,0,true);ghost.x=x+.5;ghost.y=y+.5;ghost.preview=true;
    this.buildPreview={type,x,y,valid:!error,error,ghost};return this.buildPreview;
  };
  const cancelPointer=Game.prototype.pointerCancel;
  Game.prototype.pointerCancel=function(){
    this.buildPreview=null;
    rightPointers.clear();
    syncModifier();
    return cancelPointer.call(this);
  };
  Game.prototype.drawBuildPreview=function(){
    const b=this.buildPreview;if(!b||this.buildMode!==b.type)return;
    const c=this.ctx,z=this.camera.zoom,r=window.VER_SACRUM_VILLAGE.bounds(b.ghost),p=this.worldToScreen(r.left*TILE,r.top*TILE),width=(r.right-r.left)*TILE*z,height=(r.bottom-r.top)*TILE*z;
    c.save();c.setTransform(this.dpr,0,0,this.dpr,0,0);c.globalAlpha=.45;
    if(b.type!=='road')this.drawBuilding(b.ghost);
    c.globalAlpha=1;c.fillStyle=b.valid?'#6bbb633d':'#db514c55';c.strokeStyle=b.valid?'#a0ed83':'#ff766d';c.lineWidth=2;c.fillRect(p.x,p.y,width,height);c.strokeRect(p.x,p.y,width,height);
    c.fillStyle=b.valid?'#ddffd1':'#ffe0dd';c.font='bold 12px sans-serif';c.fillText(BUILD_LABEL[b.type]||'Sentiero',p.x,p.y-7);c.restore();
  };

  // Keep the selection anchored to the terrain while the camera moves.
  Game.prototype.rtsSyncSelectionBox = function() {
    const box=this.rtsSelectionBox;
    if (!box?.startWorld) return;
    const start=this.worldToScreen(box.startWorld.x,box.startWorld.y);
    box.startX=start.x; box.startY=start.y;
    box.x=clamp(box.x,0,this.viewW); box.y=clamp(box.y,0,this.viewH);
  };

  Game.prototype.rtsScrollSelection = function(dt) {
    const box=this.rtsSelectionBox,gesture=this.rtsGesture;
    if (!box?.active || gesture?.type!=='leftBox' || this.rtsPointers?.size!==1 || !modifierHeld || this.suspended || this.gameEnded) return;
    const pointer=this.rtsPointers.get(gesture.pointerId);
    if (!pointer) return;
    // A small edge zone also works on phones where a finger cannot leave the screen.
    const edge=Math.min(24,this.viewW/4,this.viewH/4);
    const x=pointer.localX,y=pointer.localY;
    const vx=x<edge?-clamp((edge-x)/edge,0,1):x>this.viewW-edge?clamp((x-this.viewW+edge)/edge,0,1):0;
    const vy=y<edge?-clamp((edge-y)/edge,0,1):0;
    const step=300*clamp(dt,0,.05)/this.camera.zoom;
    const extent=this.world.size*TILE;
    const halfW=Math.min(extent/2,this.viewW/(2*this.camera.zoom));
    const halfH=Math.min(extent/2,this.viewH/(2*this.camera.zoom));
    if(vx)this.camera.x=clamp(this.camera.x+vx*step,halfW,extent-halfW);
    if(vy)this.camera.y=clamp(this.camera.y+vy*step,halfH,extent-halfH);
    box.x=x;box.y=y;
    this.rtsSyncSelectionBox();
  };

  const originalLoop=Game.prototype.loop;
  Game.prototype.loop=function(now) {
    this.rtsScrollSelection((now-this.lastFrame)/1000||0);
    originalLoop.call(this,now);
  };

  Game.prototype.drawHuman = function(u, hostile) {
    originalDrawHuman.call(this, u, hostile);
    if (hostile || !this.groupSelection?.length) return;
    if (this.selected?.id === u.id) return;
    if (!this.groupSelection.some(x => x.id === u.id)) return;
    const p=this.worldToScreen(u.x*TILE,u.y*TILE);
    this.selectionRing(p.x,p.y,11*.64*this.camera.zoom);
  };

  Game.prototype.draw = function() {
    originalDraw.call(this);
    this.drawBuildPreview();
    const box=this.rtsSelectionBox;
    if (!box?.active) return;
    const ctx=this.ctx;
    const x=Math.min(box.startX,box.x), y=Math.min(box.startY,box.y);
    const w=Math.abs(box.x-box.startX), h=Math.abs(box.y-box.startY);
    ctx.save();
    ctx.fillStyle='rgba(209,182,109,.12)';
    ctx.strokeStyle='#d1b66d';
    ctx.lineWidth=1.5;
    ctx.setLineDash([6,4]);
    ctx.fillRect(x,y,w,h);
    ctx.strokeRect(x,y,w,h);
    ctx.restore();
  };
})();

