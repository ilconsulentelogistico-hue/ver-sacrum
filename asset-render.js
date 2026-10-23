// Terra Italica P16: ritagli RGBA per professioni, risorse, animali e strutture.
(() => {
  'use strict';
  if(typeof Game==='undefined')return;
  const load=src=>{const img=new Image();img.src=src;return img;};
  const SPRITES={
    raider:load('./assets/p16/units/unit_raider_p16.png?v=1'),
    sheep:load('./assets/p16/animals/animal_sheep_p16.png?v=24'),wolf:load('./assets/p16/animals/animal_wolf_p16.png?v=24'),
    base:load('./assets/p16/buildings/building_base_p16.png?v=1'),sawmill:load('./assets/p16/buildings/building_sawmill_p16.png?v=1'),bakery:load('./assets/p16/buildings/building_bakery_p16.png?v=1'),market:load('./assets/p16/buildings/building_market_p16.png?v=1'),pen:load('./assets/p16/buildings/building_pen_p16.png?v=1'),house:load('./assets/p16/buildings/building_house_p16.png?v=1'),warehouse:load('./assets/p16/buildings/building_warehouse_p16.png?v=1'),tower:load('./assets/p16/buildings/building_tower_p16.png?v=1'),mill:load('./assets/p16/buildings/building_mill_p16.png?v=1'),kiln:load('./assets/p16/buildings/building_kiln_p16.png?v=1'),loom:load('./assets/p16/buildings/building_loom_p16.png?v=1'),foundry:load('./assets/p16/buildings/building_foundry_p16.png?v=1'),press:load('./assets/p16/buildings/building_press_p16.png?v=1'),
    selection:load('./assets/p16/ui/ui_selection_marker_p16.png?v=1')
  };
  window.TERRA_P16_SPRITES=SPRITES;
  const TOKEN_NAMES=['libero','taglialegna','minatore','contadino','costruttore','trasportatore','mugnaio','fornaio','allevatore','mobilitato','ceramista','tessitore','fonditore','torchiatore'];
  const tokenImages=Object.fromEntries(TOKEN_NAMES.map(name=>[name,load('./assets/p16/professions/'+name+'.png?v=1')]));
  const freeVariants=[tokenImages.libero,...[1,2,3].map(n=>load('./assets/p16/professions/libero-var'+n+'.png?v=1'))];
  const appearance=new WeakMap();
  function tokenImage(name,owner,unit){
    if(name!=='libero')return tokenImages[name]||tokenImages.libero;
    let n=appearance.get(unit);
    if(n===undefined){n=[...String(unit.id||unit.name||'')].reduce((a,c)=>a+c.charCodeAt(0),0)%freeVariants.length;appearance.set(unit,n);}
    return freeVariants[n];
  }
  const ANIMAL_TOKEN_NAMES=['sheep_alive','sheep_dead','sheep_skeleton','goat_alive','goat_dead','goat_skeleton','cow_alive','cow_dead','cow_skeleton','wolf_alive','wolf_dead','wolf_skeleton'];
  const ANIMAL_TOKENS=Object.fromEntries(ANIMAL_TOKEN_NAMES.map(name=>[name,load('./assets/p16/animals-nuovi/'+name+'.png?v=1')]));
  window.TERRA_ANIMAL_TOKENS=ANIMAL_TOKENS;
  const RESOURCE_TILE_NAMES=['forest_full_hex','forest_medium_hex','forest_low_hex','forest_empty_hex','berries_full_hex','berries_medium_hex','berries_low_hex','berries_empty_hex','stone_up_full_tri','stone_up_low_tri','stone_down_full_tri','stone_down_low_tri','ore_up_full_tri','ore_up_low_tri','ore_down_full_tri','ore_down_low_tri','clay_full_hex','clay_low_hex','copper_full_hex','copper_low_hex','tin_full_hex','tin_low_hex','forest_full_hex_v1','forest_full_hex_v2','forest_medium_hex_v1','forest_medium_hex_v2','berries_full_hex_v1','berries_full_hex_v2','berries_medium_hex_v1','berries_medium_hex_v2'];
  const RESOURCE_TILES=Object.fromEntries(RESOURCE_TILE_NAMES.map(name=>[name,load('./assets/p16/resources-nuovi/'+name+'.png?v=1')]));
  window.TERRA_RESOURCE_TILES=RESOURCE_TILES;
  const factionStyle=owner=>window.terraFactionStyle?window.terraFactionStyle(owner):{color:'#B4442B'};
  function gatherProfession(game,u,task){let type=u.inventory?.type||null;if(task?.target){const node=game.findById(game.world.resources,task.target);if(node?.type)type=node.type;}if(type==='wood')return'taglialegna';if(type==='stone'||type==='iron'||type==='clay'||type==='copper'||type==='tin')return'minatore';if(['food','grain','barley','grapes','olives'].includes(type))return'contadino';return'libero';}
  function professionForUnit(game,u){if(u.mobilized||u.task?.type==='attack'||u.state==='combat')return'mobilitato';const t=u.task;if(!t)return'libero';switch(t.type){case'gather':return gatherProfession(game,u,t);case'return':return t.after?.type==='gather'?gatherProfession(game,u,t.after):(u.inventory?.amount?'trasportatore':'libero');case'farm':return'contadino';case'build':case'repair':return'costruttore';case'haul':case'caravan':return'trasportatore';case'production':{if(t.profession==='mugnaio'||t.profession==='fornaio')return t.profession;if(['ceramista','tessitore','fonditore','torchiatore'].includes(t.profession))return t.profession;const b=game.findById(game.buildings,t.target);return b?.type==='mill'?'mugnaio':b?.type==='bakery'?'fornaio':'libero';}case'livestock':case'tame':return'allevatore';default:return'libero';}}
  window.TERRA_UNIT_TOKENS=Object.freeze({names:TOKEN_NAMES,professionForUnit});
  const previousPose=new WeakMap(),horizontalPose=new WeakMap(),OCTANT=Math.PI/4;
  const ready=img=>!!(img&&(img.complete&&img.naturalWidth>0||typeof img.getContext==='function'&&img.width>0&&img.height>0));
  function horizontalFacing(entity){const prev=horizontalPose.get(entity);let dx=0;if(prev)dx=entity.x-prev.x;if(Math.abs(dx)<.001&&Number.isFinite(entity.vx))dx=entity.vx;if(Math.abs(dx)<.001&&entity.path?.length){const n=entity.path[0];dx=(n.x??entity.x)-entity.x;}if(Math.abs(dx)<.001&&Number.isFinite(entity.tx))dx=entity.tx-entity.x;let facing=prev?.facing??1;if(dx>.001)facing=-1;else if(dx<-.001)facing=1;horizontalPose.set(entity,{x:entity.x,y:entity.y,facing});return facing;}
  function directionAngle(entity){const prev=previousPose.get(entity);let dx=0,dy=0;if(prev){dx=entity.x-prev.x;dy=entity.y-prev.y;}if(Math.hypot(dx,dy)<.001&&Number.isFinite(entity.vx)&&Number.isFinite(entity.vy)){dx=entity.vx;dy=entity.vy;}if(Math.hypot(dx,dy)<.001&&entity.path?.length){const n=entity.path[0];dx=(n.x??entity.x)-entity.x;dy=(n.y??entity.y)-entity.y;}if(Math.hypot(dx,dy)<.001&&Number.isFinite(entity.tx)&&Number.isFinite(entity.ty)){dx=entity.tx-entity.x;dy=entity.ty-entity.y;}let angle=prev?.angle??0;if(Math.hypot(dx,dy)>=.001){const raw=Math.atan2(dy,dx)-Math.PI/2;angle=Math.round(raw/OCTANT)*OCTANT;}previousPose.set(entity,{x:entity.x,y:entity.y,angle});return angle;}
  function drawCentered(ctx,img,x,y,w,h,angle=0,smooth=false,flipX=1){if(!ready(img))return false;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(flipX,1);ctx.imageSmoothingEnabled=smooth;ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore();return true;}
  const oldDrawResource=Game.prototype.drawResource,oldDrawHuman=Game.prototype.drawHuman,oldDrawAnimal=Game.prototype.drawAnimal,oldDrawBuilding=Game.prototype.drawBuilding,oldSelectionRing=Game.prototype.selectionRing;
  Game.prototype.selectionRing=function(x,y,r){const img=SPRITES.selection;if(!drawCentered(this.ctx,img,x,y,r*2,r*2))oldSelectionRing.call(this,x,y,r);};
  Game.prototype.drawResource=function(r){
    if(r.cleared)return;
    const z=this.camera.zoom,ratio=r.max>0?r.amount/r.max:0,ctx=this.ctx;

    // Keep forests and berry bushes on separate render paths.
    // Ogni famiglia mantiene i propri stati di esaurimento.
    if(r.type==='wood'){
      const state=ratio<=0?'empty':ratio>.66?'full':ratio>.33?'medium':'low';
      const variant=(state==='full'||state==='medium')?Math.floor(hash(r.x,r.y,this.seed+1917)*3):0;
      const key='forest_'+state+'_hex'+(variant?'_v'+variant:'');
      const img=RESOURCE_TILES[key],p=this.worldToScreen(r.x*TILE,r.y*TILE);
      const size=TILE*1.03*z;
      if(!drawCentered(ctx,img,p.x,p.y,size,size,0,false))return oldDrawResource.call(this,r);
      return;
    }
    if(r.type==='food'){
      const state=ratio<=0?'empty':ratio>.66?'full':ratio>.33?'medium':'low';
      const variant=(state==='full'||state==='medium')?Math.floor(hash(r.x,r.y,this.seed+1923)*3):0;
      const key='berries_'+state+'_hex'+(variant?'_v'+variant:'');
      const img=RESOURCE_TILES[key],p=this.worldToScreen(r.x*TILE,r.y*TILE);
      const size=TILE*1.03*z;
      if(!drawCentered(ctx,img,p.x,p.y,size,size,0,false))return oldDrawResource.call(this,r);
      return;
    }

    if(r.type==='clay'||r.type==='copper'||r.type==='tin'){
      if(r.amount<=0)return;
      const img=RESOURCE_TILES[(r.type==='tin'?'tin_':r.type==='copper'?'copper_':'clay_')+(ratio>.42?'full_hex':'low_hex')],p=this.worldToScreen(r.x*TILE,r.y*TILE);
      if(!drawCentered(ctx,img,p.x,p.y,TILE*.72*z,TILE*.72*z,0,false))return oldDrawResource.call(this,r);
      return;
    }

    // Stone and ore are not multi-piece icons: every triangle is a real resource node.
    if(r.type==='stone'||r.type==='iron'){
      if(r.amount<=0)return;
      const state=ratio>.42?'full':'low';
      const orientation=r.orientation||(((Math.round(r.x*100)+Math.round(r.y*100))&1)?'down':'up');
      const key=(r.type==='iron'?'ore_':'stone_')+orientation+'_'+state+'_tri';
      const img=RESOURCE_TILES[key],p=this.worldToScreen(r.x*TILE,r.y*TILE);
      const width=TILE*.72*z,height=TILE*.72*z;
      if(!drawCentered(ctx,img,p.x,p.y,width,height,0,false))return oldDrawResource.call(this,r);
      return;
    }

    oldDrawResource.call(this,r);
  };
  Game.prototype.drawHuman=function(u,hostile){const p=this.worldToScreen(u.x*TILE,u.y*TILE),z=this.camera.zoom*(hostile?1:.64),ctx=this.ctx,profession=hostile?null:professionForUnit(this,u),img=hostile?SPRITES.raider:tokenImage(profession,u.owner,u),dims=hostile?[28,32]:[42,42];if(!ready(img))return oldDrawHuman.call(this,u,hostile);ctx.save();ctx.fillStyle='#00000045';ctx.beginPath();ctx.ellipse(p.x,p.y+(hostile?7:16)*z,(hostile?6:9)*z,(hostile?2.4:3)*z,0,0,Math.PI*2);ctx.fill();ctx.restore();drawCentered(ctx,img,p.x,p.y,dims[0]*z,dims[1]*z,hostile?directionAngle(u):0,false,hostile?1:horizontalFacing(u));if(!hostile){ctx.fillStyle=factionStyle(u.owner).color;ctx.fillRect(p.x+8*z,p.y+9*z,4*z,4*z);}if(!hostile&&(u.selected||this.selected?.id===u.id))this.selectionRing(p.x,p.y,23*z);if((u.health/u.maxHealth)<.65){ctx.fillStyle='#171717';ctx.fillRect(p.x-12*z,p.y-27*z,24*z,2*z);ctx.fillStyle=hostile?'#a94c43':factionStyle(u.owner).color;ctx.fillRect(p.x-12*z,p.y-27*z,24*z*(u.health/u.maxHealth),2*z);}};
  Game.prototype.drawAnimal=function(a){
    const p=this.worldToScreen(a.x*TILE,a.y*TILE),z=this.camera.zoom,state=a.visualState||a.carcassState||(a.health<=0?'dead':'alive'),key=a.type+'_'+state,img=ANIMAL_TOKENS[key]||(a.type==='wolf'?SPRITES.wolf:SPRITES.sheep),token=!!ANIMAL_TOKENS[key];
    const size=token?(a.type==='cow'?26:23):(a.type==='wolf'?27:25);
    if(!drawCentered(this.ctx,img,p.x,p.y,size*z,(token?size:(a.type==='wolf'?20:19))*z,0,false,horizontalFacing(a)))return oldDrawAnimal.call(this,a);
    if(this.selected?.id===a.id)this.selectionRing(p.x,p.y,(token?15*.64:11)*z);
  };
  Game.prototype.drawBuilding=function(b){const img=SPRITES[b.type];if(!b.built||!ready(img))return oldDrawBuilding.call(this,b);const p=this.worldToScreen(b.x*TILE,b.y*TILE),z=this.camera.zoom,dims={base:[32,32],sawmill:[58,56],bakery:[58,56],market:[62,56],pen:[58,56],house:[64,64],farm:[64,68],warehouse:[62,58],tower:[48,56],palisade:[54,20],mill:[58,56],kiln:[54,54],foundry:[58,56],loom:[54,54],press:[56,56]}[b.type];if(!dims)return oldDrawBuilding.call(this,b);const ctx=this.ctx;ctx.save();ctx.fillStyle='#0000003f';ctx.beginPath();ctx.ellipse(p.x,p.y+(b.type==='tower'?14:10)*z,Math.max(8,dims[0]*.28)*z,Math.max(3,dims[1]*.07)*z,0,0,Math.PI*2);ctx.fill();ctx.restore();drawCentered(ctx,img,p.x,p.y,dims[0]*z,dims[1]*z);if(this.selected?.id===b.id)this.selectionRing(p.x,p.y,Math.max(15,dims[0]*.28)*z);if(b.health<b.maxHealth){const ratio=Math.max(0,b.health/b.maxHealth),barW=Math.min(32,dims[0]*.55)*z,barY=p.y-(dims[1]*.5+5)*z;ctx.fillStyle='#171717';ctx.fillRect(p.x-barW/2,barY,barW,3*z);ctx.fillStyle='#70835d';ctx.fillRect(p.x-barW/2,barY,barW*ratio,3*z);}};
})();
