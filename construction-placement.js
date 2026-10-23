// Confirm-before-build placement flow and drag-built palisades.
(() => {
  'use strict';

  const oldPlaceBuild=Game.prototype.placeBuild;
  const oldPointerDown=Game.prototype.pointerDown;
  const oldPointerMove=Game.prototype.pointerMove;
  const oldPointerUp=Game.prototype.pointerUp;
  const oldPointerCancel=Game.prototype.pointerCancel;
  const oldCancelBuildPlacement=Game.prototype.cancelBuildPlacement;
  const oldDraw=Game.prototype.draw;
  const oldDrawBuilding=Game.prototype.drawBuilding;
  const oldBuildTick=Game.prototype.buildTick;
  const oldOnUnitArrive=Game.prototype.onUnitArrive;
  const oldRefreshContextDock=Game.prototype.refreshContextDock;
  const oldInitUI=Game.prototype.initUI;
  const oldNewGame=Game.prototype.newGame;

  const localPoint=(g,e)=>{const r=g.canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
  const tileAt=(g,sx,sy)=>{const w=g.screenToWorld(sx,sy);return{x:Math.floor(w.x/TILE),y:Math.floor(w.y/TILE)};};
  const addCost=(a,b,m=1)=>{for(const[k,v]of Object.entries(b||{}))a[k]=(a[k]||0)+v*m;return a;};
  const planCost=items=>items.filter(item=>!item.reuseId).reduce((sum,item)=>addCost(sum,item.type==='road'?{wood:1}:BUILD_COSTS[item.type]),{});
  const availableBuilder=g=>g.selected instanceof Unit&&g.selected.location?.kind==='world'&&g.selected.health>0?g.selected:g.chooseCommunityBuilder?.()||g.units.find(u=>u.health>0&&u.location?.kind==='world'&&!u.mobilized&&u.state==='idle');

  Game.prototype.palisadeAt=function(x,y){
    return this.buildings.find(b=>b.alive&&b.type==='palisade'&&Math.floor(b.x)===x&&Math.floor(b.y)===y)||null;
  };

  Game.prototype.pendingPlacementError=function(item){
    if(item.x<0||item.y<0||item.x>=this.world.size||item.y>=this.world.size)return 'La costruzione deve rientrare nella mappa.';
    if(item._forcedError)return item._forcedError;
    if(item.type==='palisade'&&item.reuseId){
      const joint=this.palisadeAt(item.x,item.y);
      return joint?.id===item.reuseId?null:'Il raccordo della palizzata non è più disponibile.';
    }
    if(item.type==='road'){
      const t=this.world.tile(item.x,item.y);
      if(!t||!BIOME[t.biome].walk)return 'Terreno non percorribile.';
      if(t.road)return 'Qui c’è già un sentiero.';
      return null;
    }
    return this.villagePlacementError(item.type,item.x,item.y,null,item.crop||null);
  };

  Game.prototype.validatePendingBuildPlan=function(plan){
    if(!plan?.items?.length)return 'Nessun fantasma da confermare.';
    for(const item of plan.items){const e=this.pendingPlacementError(item);if(e)return e;}
    const builder=this.units.find(u=>u.id===plan.builderId&&u.health>0&&u.location?.kind==='world')||availableBuilder(this);
    const type=plan.items[0].type;
    const check=this.constructionCheck(type,builder);
    if(!check.ok)return builder?this.constructionRequirementText(type,builder):'Serve un costruttore disponibile.';
    const cost=planCost(plan.items);
    const funding=this.fundingBaseForItems(plan.items);if(!funding)return 'Il cantiere attraversa due villaggi: costruisci separatamente.';
    if(!this.canPay(cost,funding))return 'Risorse disponibili insufficienti nel villaggio locale.';
    return null;
  };

  Game.prototype.stagePendingBuild=function(type,x,y,crop=null){
    if(this.pendingBuildPlan){this.message('Conferma ✓ o annulla ✕ il fantasma già piazzato.');return false;}
    const item={type,x,y,crop:type==='farm'?(crop||this.pendingBuildCrop||'grain'):null};
    const builder=availableBuilder(this);
    const plan={kind:type==='palisade'?'palisade':'single',items:[item],builderId:builder?.id||null};
    const error=this.validatePendingBuildPlan(plan);
    if(error){this.message(error);return false;}
    this.pendingBuildPlan=plan;
    this.buildMode=null;this.buildPreview=null;this.pendingBuildCrop=null;
    this.syncModeButtons();this.updateUI();
    this.message(`${BUILD_LABEL[type]||'Costruzione'} piazzato come fantasma. ✓ conferma · ✕ annulla.`);
    return true;
  };

  Game.prototype.placeBuild=function(type,x,y,crop=null){
    if(this._committingPendingBuild||this.buildMode!==type)return oldPlaceBuild.call(this,type,x,y,crop);
    return this.stagePendingBuild(type,x,y,crop);
  };

  Game.prototype.makePalisadePlan=function(start,end){
    const dx=end.x-start.x,dy=end.y-start.y;
    const orientation=Math.abs(dy)>Math.abs(dx)?'vertical':'horizontal';
    const delta=orientation==='vertical'?dy:dx;
    const step=delta<0?-1:1,count=Math.abs(delta)+1,items=[];
    for(let i=0;i<count;i++){
      const x=orientation==='horizontal'?start.x+i*step:start.x;
      const y=orientation==='vertical'?start.y+i*step:start.y;
      const cap=count===1?'both':orientation==='horizontal'?(i===0?(step>0?'left':'right'):i===count-1?(step>0?'right':'left'):'middle'):(i===0?(step>0?'top':'bottom'):i===count-1?(step>0?'bottom':'top'):'middle');
      const item={type:'palisade',x,y,orientation,cap,single:count===1};
      const existing=this.palisadeAt(x,y);
      if(existing){
        if(count>1&&(i===0||i===count-1))item.reuseId=existing.id;
        else item._forcedError='Puoi raccordarti a una palizzata esistente solo con il primo o l’ultimo tile.';
      }
      items.push(item);
    }
    const builder=availableBuilder(this);
    const plan={kind:'palisade',items,builderId:builder?.id||null,orientation};
    const tileError=items.map(item=>this.pendingPlacementError(item)).find(Boolean);
    const check=this.constructionCheck('palisade',builder);
    plan.error=tileError||(!check.ok?(builder?this.constructionRequirementText('palisade',builder):'Serve un costruttore disponibile.'):null)||(!this.fundingBaseForItems(items)?'La palizzata attraversa due villaggi: dividila in due.':!this.canPay(planCost(items),this.fundingBaseForItems(items))?'Legno insufficiente nel villaggio locale.':null);
    if(!plan.error&&!items.some(item=>!item.reuseId))plan.error='Trascina almeno un nuovo segmento di palizzata.';
    plan.valid=!plan.error;
    return plan;
  };

  Game.prototype.pointerDown=function(e){
    if(this.buildMode!=='palisade')return oldPointerDown.call(this,e);
    if(this.pendingBuildPlan){this.message('Conferma ✓ o annulla ✕ il fantasma già piazzato.');e.preventDefault();return;}
    if(this._palisadeDrag){e.preventDefault();return;}
    this.canvas.setPointerCapture(e.pointerId);
    const p=localPoint(this,e),start=tileAt(this,p.x,p.y);
    this._palisadeDrag={pointerId:e.pointerId,start};
    this.palisadeDraft=this.makePalisadePlan(start,start);
    e.preventDefault();
  };

  Game.prototype.pointerMove=function(e){
    const d=this._palisadeDrag;
    if(!d||d.pointerId!==e.pointerId)return oldPointerMove.call(this,e);
    const p=localPoint(this,e),end=tileAt(this,p.x,p.y);
    this.palisadeDraft=this.makePalisadePlan(d.start,end);
    e.preventDefault();
  };

  Game.prototype.pointerUp=function(e){
    const d=this._palisadeDrag;
    if(!d||d.pointerId!==e.pointerId)return oldPointerUp.call(this,e);
    const p=localPoint(this,e),end=tileAt(this,p.x,p.y),plan=this.makePalisadePlan(d.start,end);
    this._palisadeDrag=null;this.palisadeDraft=null;
    if(plan.valid){
      this.pendingBuildPlan=plan;this.buildMode=null;this.buildPreview=null;
      this.syncModeButtons();this.updateUI();
      this.message(`Palizzata fantasma: ${plan.items.length} ${plan.items.length===1?'sezione':'sezioni'} · ✓ conferma · ✕ annulla.`);
    }else if(plan.error)this.message(plan.error);
    e.preventDefault();
  };

  Game.prototype.pointerCancel=function(){
    this._palisadeDrag=null;this.palisadeDraft=null;
    return oldPointerCancel.call(this);
  };

  Game.prototype.cancelBuildPlacement=function(){
    const hadPending=!!this.pendingBuildPlan,hadMode=!!this.buildMode;
    this.pendingBuildPlan=null;this._palisadeDrag=null;this.palisadeDraft=null;this.pendingBuildCrop=null;
    oldCancelBuildPlacement.call(this);
    if(hadPending)this.message('Costruzione fantasma annullata.');
    else if(hadMode)this.message('Costruzione annullata.');
    this.updateUI();
  };

  Game.prototype.commitPalisadePlan=function(plan,builder){
    const cost=planCost(plan.items);
    if(!this.pay(cost,this.fundingBaseForItems(plan.items))){this.message('Legno insufficiente nel villaggio locale.');return false;}
    const lineId=crypto.randomUUID?.()||Math.random().toString(36).slice(2),created=[],reused=[];
    for(const [index,item] of plan.items.entries()){
      if(item.reuseId){
        const joint=this.palisadeAt(item.x,item.y);
        if(joint){joint.palisadeJunction=true;reused.push(joint);}
        continue;
      }
      const b=new Building('palisade',item.x,item.y,0,false);
      b.progress=.08;
      b.requiredMaterials=null;
      b.materialsConsumed=true;
      b.palisadeOrientation=item.orientation;
      b.palisadeCap=item.cap;
      b.palisadeSingle=!!item.single;
      b.palisadeLineId=lineId;
      b.palisadeLineIndex=index;
      this.buildings.push(b);created.push(b);
    }
    this.ensureInventories?.();
    for(const b of created){if(b.inventory)b.inventory.items={};b.palisadeLineLength=created.length;}
    if(created.length){
      const master=created[0];
      master.palisadeLineMaster=true;
      master.palisadeLineIds=created.map(b=>b.id);
      master.palisadeLineWork=.08;
      if(builder&&this.assignBuild(builder,master)&&builder.task){
        builder.task.palisadeLine=true;
        builder.task.palisadeWorkIndex=-1;
        builder.task.palisadeWorkPartId=null;
        builder.task.palisadeWorkSpot=null;
      }
    }
    // Keep the player's current selection; the outer confirmation refreshes UI once.
    const join=reused.length?' · raccordo creato':'';
    this.message(created.length+' '+(created.length===1?'sezione':'sezioni')+' di palizzata confermate'+join+(builder&&created.length?'. '+builder.name+' lavora sull’intera linea.':'.'));
    return true;
  };

  Game.prototype.palisadeWorkRoute=function(u,part){
    const doors=this.buildingDoors(part).slice();
    const horizontal=(part.palisadeOrientation||'horizontal')==='horizontal';
    const penalty=p=>horizontal?(Math.abs(p.y-part.y)>.6?0:1):(Math.abs(p.x-part.x)>.6?0:1);
    doors.sort((a,b)=>penalty(a)-penalty(b)||Math.hypot(u.x-a.x,u.y-a.y)-Math.hypot(u.x-b.x,u.y-b.y));
    for(const spot of doors){
      const d=Math.hypot(u.x-spot.x,u.y-spot.y);
      if(d<.12)return{spot,path:[]};
      let path=this.findPath(u.x,u.y,Math.floor(spot.x),Math.floor(spot.y),1);
      if(!path.length&&Math.floor(u.x)===Math.floor(spot.x)&&Math.floor(u.y)===Math.floor(spot.y))path=[{x:spot.x,y:spot.y}];
      if(path.length)return{spot,path};
    }
    return null;
  };

  Game.prototype.onUnitArrive=function(u){
    if(u.task?.type==='build'&&u.task.palisadeLine){u.state='building';return;}
    return oldOnUnitArrive.call(this,u);
  };

  Game.prototype.buildTick=function(u,dt){
    const master=u.task?.type==='build'?this.buildings.find(b=>b.id===u.task.target):null;
    if(!master||master.type!=='palisade'||!master.palisadeLineMaster||!u.task?.palisadeLine)return oldBuildTick.call(this,u,dt);
    if(!master.alive){this.cancelTask(u);return;}
    const ids=master.palisadeLineIds||[master.id];
    const parts=ids.map(id=>this.buildings.find(b=>b.id===id)).filter(b=>b?.alive);
    if(!parts.length){this.cancelTask(u);return;}
    const work=Math.min(parts.length,master.palisadeLineWork||.08);
    if(work>=parts.length){for(const p of parts)p.progress=1;this.cancelTask(u);return;}
    const index=Math.min(parts.length-1,Math.floor(work));
    const part=parts[index];

    // Every section has its own physical work spot. The job target remains the line master.
    if(u.task.palisadeWorkIndex!==index||u.task.palisadeWorkPartId!==part.id){
      const route=this.palisadeWorkRoute(u,part);
      if(!route){this.cancelTask(u);this.message('Non c’è spazio raggiungibile accanto alla sezione '+(index+1)+' della palizzata.');return;}
      u.task.palisadeWorkIndex=index;
      u.task.palisadeWorkPartId=part.id;
      u.task.palisadeWorkSpot=route.spot;
      u.path=route.path;
      u.state=route.path.length?'moving':'building';
      if(route.path.length)return;
    }
    const spot=u.task.palisadeWorkSpot;
    if(spot&&Math.hypot(u.x-spot.x,u.y-spot.y)>.28){
      const route=this.palisadeWorkRoute(u,part);
      if(!route){this.cancelTask(u);return;}
      u.task.palisadeWorkSpot=route.spot;u.path=route.path;u.state=route.path.length?'moving':'building';
      if(route.path.length)return;
    }

    const speed=.06+u.skills.construction*.012;
    master.palisadeLineWork=Math.min(parts.length,work+dt*speed);
    const nextWork=master.palisadeLineWork;
    for(let i=0;i<parts.length;i++){
      const p=parts[i];
      p.progress=Math.max(p.progress||.08,Math.min(1,Math.max(.08,nextWork-i)));
      p.materialsConsumed=true;p.requiredMaterials=null;
    }
    u.gain('construction',dt*.4);
    if(nextWork>=parts.length){
      for(const p of parts)p.progress=1;
      this.cancelTask(u);
      this.message(u.name+' ha terminato tutta la palizzata ('+parts.length+' sezioni).');
    }
  };

  Game.prototype.confirmPendingBuildPlan=function(){
    const plan=this.pendingBuildPlan;if(!plan)return false;
    const error=this.validatePendingBuildPlan(plan);if(error){this.message(error);return false;}
    const builder=this.units.find(u=>u.id===plan.builderId&&u.health>0&&u.location?.kind==='world')||availableBuilder(this);
    if(plan.kind==='palisade'){
      if(!this.commitPalisadePlan(plan,builder))return false;
    }else{
      const item=plan.items[0],before=new Set(this.buildings.map(b=>b.id));
      this._committingPendingBuild=true;
      const prior=this.selected;if(builder)this.selected=builder;
      try{oldPlaceBuild.call(this,item.type,item.x,item.y,item.crop||null);}finally{this._committingPendingBuild=false;}
      const created=this.buildings.find(b=>!before.has(b.id));
      if(!created&&item.type!=='road'){this.selected=prior;return false;}
    }
    this.pendingBuildPlan=null;this.buildMode=null;this.buildPreview=null;this.pendingBuildCrop=null;
    this.syncModeButtons();this.updateUI();return true;
  };

  Game.prototype.palisadeNeighbor=function(x,y,networkItems=[]){
    const planned=(networkItems||[]).find(p=>p.x===x&&p.y===y);
    if(planned)return planned;
    return this.palisadeAt(x,y);
  };

  Game.prototype.palisadeOrientationOf=function(p){
    return p?.orientation||p?.palisadeOrientation||null;
  };

  Game.prototype.drawPalisadePlaceholder=function(item,alpha=1,ghost=false,networkItems=[]){
    const tx=item.x??Math.floor(item.x),ty=item.y??Math.floor(item.y);
    const orientation=this.palisadeOrientationOf(item)||'horizontal';
    const p=this.worldToScreen(tx*TILE,ty*TILE),s=TILE*this.camera.zoom,q=s/5,c=this.ctx;
    const fill=ghost?'#dbc58f':'#8a6036',stroke=ghost?'#fff0bd':'#35251a';
    const left=this.palisadeNeighbor(tx-1,ty,networkItems),right=this.palisadeNeighbor(tx+1,ty,networkItems);
    const up=this.palisadeNeighbor(tx,ty-1,networkItems),down=this.palisadeNeighbor(tx,ty+1,networkItems);
    const lo=this.palisadeOrientationOf(left),ro=this.palisadeOrientationOf(right),uo=this.palisadeOrientationOf(up),do_=this.palisadeOrientationOf(down);
    const sameLeft=!!left&&lo===orientation,sameRight=!!right&&ro===orientation;
    const sameUp=!!up&&uo===orientation,sameDown=!!down&&do_===orientation;
    const perpLeft=!!left&&lo&&lo!==orientation,perpRight=!!right&&ro&&ro!==orientation;
    const perpUp=!!up&&uo&&uo!==orientation,perpDown=!!down&&do_&&do_!==orientation;
    const hasPerp=perpLeft||perpRight||perpUp||perpDown;
    const logs=new Map();
    const add=(gx,gy)=>logs.set(gx.toFixed(2)+','+gy.toFixed(2),[gx,gy]);
    const block3=(cx,cy)=>{for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)add(cx+xx,cy+yy);};
    const halfCorner=(edge)=>{
      // Shared 4x4 node: exactly 2x4 logs are drawn by each of the two adjacent tiles.
      if(edge==='left'||edge==='right'){
        const xs=edge==='left'?[.5,1.5]:[3.5,4.5];
        for(const x of xs)for(const y of [1,2,3,4])add(x,y);
      }else{
        const ys=edge==='up'?[.5,1.5]:[3.5,4.5];
        for(const y of ys)for(const x of [1,2,3,4])add(x,y);
      }
    };

    // The straight strip stops at the centre when it bends into a perpendicular neighbour.
    if(orientation==='horizontal'){
      let from=0,to=4;
      if(perpLeft)from=2;
      if(perpRight)to=2;
      if(perpUp||perpDown){
        if(sameLeft&&!sameRight)to=2;
        else if(sameRight&&!sameLeft)from=2;
        else if(!sameLeft&&!sameRight)from=to=2;
      }
      for(let x=from;x<=to;x++)add(x+.5,2.5);
    }else{
      let from=0,to=4;
      if(perpUp)from=2;
      if(perpDown)to=2;
      if(perpLeft||perpRight){
        if(sameUp&&!sameDown)to=2;
        else if(sameDown&&!sameUp)from=2;
        else if(!sameUp&&!sameDown)from=to=2;
      }
      for(let y=from;y<=to;y++)add(2.5,y+.5);
    }

    // 3x3 terminal posts exist only on genuinely free ends.
    // At a corner they disappear completely: the shared 4x4 node replaces both terminals.
    if(!hasPerp){
      if(orientation==='horizontal'){
        if(!sameLeft)block3(1.5,2.5);
        if(!sameRight)block3(3.5,2.5);
      }else{
        if(!sameUp)block3(2.5,1.5);
        if(!sameDown)block3(2.5,3.5);
      }
    }

    if(perpLeft)halfCorner('left');
    if(perpRight)halfCorner('right');
    if(perpUp)halfCorner('up');
    if(perpDown)halfCorner('down');

    c.save();c.globalAlpha*=alpha;c.fillStyle=fill;c.strokeStyle=stroke;c.lineWidth=Math.max(.65,.65*this.camera.zoom);
    const radius=q*.43;
    for(const [gx,gy] of logs.values()){
      const cx=p.x+gx*q,cy=p.y+gy*q;
      c.beginPath();c.arc(cx,cy,radius,0,Math.PI*2);c.fill();c.stroke();
    }
    c.restore();
  };

  Game.prototype.drawBuilding=function(b){
    if(b.type!=='palisade')return oldDrawBuilding.call(this,b);
    const item={x:Math.floor(b.x),y:Math.floor(b.y),orientation:b.palisadeOrientation||'horizontal',cap:b.palisadeCap||'middle',single:!!b.palisadeSingle};
    this.drawPalisadePlaceholder(item,b.built?1:.58,false);
    const p=this.worldToScreen(b.x*TILE,b.y*TILE),z=this.camera.zoom,c=this.ctx;
    if(!b.built){c.fillStyle='#382f23';c.fillRect(p.x-12*z,p.y+15*z,24*z,2*z);c.fillStyle='#d4af62';c.fillRect(p.x-12*z,p.y+15*z,24*z*b.progress,2*z);}
    if(this.selected?.id===b.id)this.selectionRing(p.x,p.y,16*z);
  };

  Game.prototype.drawPendingPlan=function(plan,alpha=.48){
    if(!plan?.items?.length)return;
    const c=this.ctx,z=this.camera.zoom;
    for(const item of plan.items){
      const error=this.pendingPlacementError(item),valid=!error;
      if(item.type==='palisade')this.drawPalisadePlaceholder(item,alpha,true,plan.items);
      else if(item.type==='road'){
        const p=this.worldToScreen(item.x*TILE,item.y*TILE),s=TILE*z;c.save();c.globalAlpha*=alpha;c.fillStyle='#c9b27d';c.fillRect(p.x,p.y+s*.36,s,s*.28);c.restore();
      }else{
        const ghost=new Building(item.type,item.x,item.y,0,true);if(item.crop)ghost.crop=item.crop;ghost.preview=true;
        c.save();c.globalAlpha*=alpha;this.drawBuilding(ghost);c.restore();
      }
      const ghost={type:item.type,x:item.x+.5,y:item.y+.5,crop:item.crop};
      const r=window.VER_SACRUM_VILLAGE.bounds(ghost),p=this.worldToScreen(r.left*TILE,r.top*TILE),w=(r.right-r.left)*TILE*z,h=(r.bottom-r.top)*TILE*z;
      c.save();c.fillStyle=valid?'#6bbb6329':'#db514c44';c.strokeStyle=valid?'#a0ed83':'#ff766d';c.lineWidth=2;c.fillRect(p.x,p.y,w,h);c.strokeRect(p.x,p.y,w,h);c.restore();
    }
  };

  Game.prototype.draw=function(){
    oldDraw.call(this);
    if(this.palisadeDraft)this.drawPendingPlan(this.palisadeDraft,.42);
    if(this.pendingBuildPlan)this.drawPendingPlan(this.pendingBuildPlan,.52);
  };

  Game.prototype.refreshContextDock=function(){
    oldRefreshContextDock.call(this);
    const status=$('#placementStatus'),label=$('#placementLabel'),confirm=$('#confirmPlacement'),cancel=$('#cancelPlacement');
    const pending=this.pendingBuildPlan,active=!!pending||!!this.buildMode;
    status.hidden=!active;
    if(confirm)confirm.hidden=!pending;
    if(cancel)cancel.hidden=!active;
    if(pending){
      const type=pending.items[0]?.type,n=pending.items.length;
      label.textContent=type==='palisade'?`Palizzata · ${n} ${n===1?'sezione':'sezioni'} · fantasma`:`${BUILD_LABEL[type]||'Costruzione'} · fantasma`;
    }else if(this.buildMode==='palisade')label.textContent='Palizzata · trascina in verticale o orizzontale';
    else if(this.buildMode)label.textContent=`${BUILD_LABEL[this.buildMode]||'Sentiero'} · piazza il fantasma`;
  };

  Game.prototype.initUI=function(){
    oldInitUI.call(this);
    const confirm=$('#confirmPlacement'),cancel=$('#cancelPlacement'),clear=$('#clearSelection');
    if(confirm)confirm.onclick=()=>this.confirmPendingBuildPlan();
    if(cancel)cancel.onclick=()=>this.cancelBuildPlacement();
    if(clear){const old=clear.onclick;clear.onclick=()=>{if(this.pendingBuildPlan)this.cancelBuildPlacement();else old?.();};}
  };

  Game.prototype.newGame=function(seed){
    this.pendingBuildPlan=null;this.palisadeDraft=null;this._palisadeDrag=null;
    return oldNewGame.call(this,seed);
  };
})();