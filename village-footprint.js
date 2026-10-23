// A village occupies a 4×4 footprint; collision rules keep movement outside.
(() => {
'use strict';
const SIZE=4;
const HOUSE_SLOTS=[[1,1],[2,2],[2,1],[1,2],[0,3]];
const houseArt=new Image();houseArt.src='./assets/p16/buildings/building_house_p16.png?v=1';
Game.prototype.villageHouseSlots=function(b){
 // One house per resident, spread over the 4×4 plot (Simone, 23/10/2026: one person is one house).
 const r=bounds(b),n=Math.min(HOUSE_SLOTS.length,this.villagePeople(b).length);
 return HOUSE_SLOTS.slice(0,n).map(([x,y])=>({x:r.left+x+.5,y:r.top+y+.5}));
};
function bounds(b){const x=Math.floor(b.x),y=Math.floor(b.y);return b.type==='house'?{left:x-SIZE/2,top:y-SIZE/2,right:x+SIZE/2,bottom:y+SIZE/2}:{left:x,top:y,right:x+(b.type==='farm'?(TERRA_CROPS[b.crop]?.side||TERRA_CROPS.grain.side):1),bottom:y+(b.type==='farm'?(TERRA_CROPS[b.crop]?.side||TERRA_CROPS.grain.side):1)};}
const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const contains=(r,p)=>p.x>=r.left&&p.x<r.right&&p.y>=r.top&&p.y<r.bottom;
const distance=(a,b)=>Math.hypot(Math.max(0,a.left-b.right,b.left-a.right),Math.max(0,a.top-b.bottom,b.top-a.bottom));
window.VER_SACRUM_VILLAGE={size:SIZE,bounds};
Game.prototype.villagePlacementError=function(type,x,y,ignore=null,crop=null){
 const r=bounds({type,x:x+.5,y:y+.5,crop:type==='farm'?(crop||this.pendingBuildCrop||'grain'):undefined});
 if(r.left<0||r.top<0||r.right>this.world.size||r.bottom>this.world.size)return 'Il villaggio deve rientrare interamente nella mappa (4 × 4 tile).';
 for(let ty=r.top;ty<r.bottom;ty++)for(let tx=r.left;tx<r.right;tx++){const t=this.world.tile(tx,ty);if(!t||!BIOME[t.biome].walk)return 'Servono 4 × 4 tile di terreno edificabile.';}
 if(this.buildings.some(b=>b!==ignore&&b.alive&&overlap(r,bounds(b))))return 'Area occupata: il villaggio riserva 4 × 4 tile.';
 return null;
};
const place=Game.prototype.placeBuild;Game.prototype.placeBuild=function(type,x,y,crop=null){const error=this.villagePlacementError(type,x,y,null,crop);if(error)return this.message(error);const result=place.call(this,type,x,y,crop);for(const b of this.buildings)if(b.type==='house'&&Math.floor(b.x)===x&&Math.floor(b.y)===y)b.villageFootprintVersion=1;return result;};
Game.prototype.initializeVillageFootprints=function(){
 for(const b of this.buildings.filter(b=>b.type==='house'&&b.alive)){
  if(b.villageFootprintVersion===1)continue;
  const ox=Math.floor(b.x),oy=Math.floor(b.y);let target=null;
  for(let r=0;r<this.world.size&&!target;r++)for(let dy=-r;dy<=r&&!target;dy++)for(let dx=-r;dx<=r;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
   const x=ox+dx,y=oy+dy;if(!this.villagePlacementError('house',x,y,b)){target={x,y};break;}
  }
  if(!target){this.message('Non c’è spazio per espandere un villaggio a 4 × 4 tile.');continue;}
  b.x=target.x+.5;b.y=target.y+.5;b.villageFootprintVersion=1;
  for(const u of this.units){if(u.location.kind==='resident'&&u.location.settlementId===b.id){u.x=b.x;u.y=b.y;}else if(u.task?.target===b.id){if(u.task.type==='enter'){this.cancelTask(u);this.assignEnter(u,b);}else if(u.task.type==='build')this.assignBuild(u,b);else u.path=[];}}
 }
};
const newGame=Game.prototype.newGame;Game.prototype.newGame=function(seed){newGame.call(this,seed);this.initializeVillageFootprints();};
const load=Game.prototype.load;Game.prototype.load=function(){const ok=load.call(this);if(ok)this.initializeVillageFootprints();return ok;};
const pick=Game.prototype.pickEntity;Game.prototype.pickEntity=function(p){const e=pick.call(this,p);if(e instanceof Unit||e instanceof Animal||e instanceof Raider)return e;const village=this.buildings.find(b=>['house','farm'].includes(b.type)&&b.alive&&contains(bounds(b),p));return village||e;};
const nearest=Game.prototype.nearestAt;Game.prototype.nearestAt=function(list,p,radius,filter=()=>true){const village=list.find(b=>b instanceof Building&&['house','farm'].includes(b.type)&&b.alive&&filter(b)&&contains(bounds(b),p));return village||nearest.call(this,list,p,radius,filter);};
Game.prototype.villageDoors=function(b){const r=bounds(b),out=[];for(let i=0;i<SIZE;i++)out.push({x:r.left+i+.5,y:r.top-.5},{x:r.left+i+.5,y:r.bottom+.5},{x:r.left-.5,y:r.top+i+.5},{x:r.right+.5,y:r.top+i+.5});return out.filter(p=>this.world.walkable(Math.floor(p.x),Math.floor(p.y),1,null,this.buildings)&&!this.buildings.some(other=>other!==b&&other.alive&&contains(bounds(other),p)));};
const exit=Game.prototype.findResidentExit;Game.prototype.findResidentExit=function(b){if(b.type!=='house')return exit.call(this,b);return this.villageDoors(b).find(p=>!this.units.some(u=>u.health>0&&u.location.kind==='world'&&Math.floor(u.x)===Math.floor(p.x)&&Math.floor(u.y)===Math.floor(p.y)))||null;};
const enter=Game.prototype.assignEnter;Game.prototype.assignEnter=function(u,b){if(b?.type!=='house')return enter.call(this,u,b);if(!b.alive||!b.built||b.owner!==u.owner||this.villagePeople(b).filter(p=>p!==u).length>=5)return this.message('Villaggio non disponibile o pieno.');const doors=this.villageDoors(b).sort((a,c)=>dist(u,a)-dist(u,c));for(const door of doors){const path=dist(u,door)<=.8?[]:this.findPath(u.x,u.y,Math.floor(door.x),Math.floor(door.y),1);if(!path.length&&dist(u,door)>.8)continue;this.cancelTask(u);u.task={type:'enter',target:b.id};u.path=path;u.state='moving';if(!path.length)this.onUnitArrive(u);return;}this.message('Nessun ingresso del villaggio raggiungibile.');};
// Link distance is measured from the village edge, keeping the same 12-tile rule.
const compatible=Game.prototype.linkCompatible;Game.prototype.linkCompatible=function(a,b){if(a.type!=='house'&&b.type!=='house')return compatible.call(this,a,b);if(a===b||a.owner!==b.owner||!a.alive||!a.built||!b.alive||!b.built||distance(bounds(a),bounds(b))>VER_SACRUM.linkRange)return false;const other=a.type==='house'?b:a;return other.type==='market'||!!TERRA_RECIPES[other.type];};
const selection=Game.prototype.selectionHTML;Game.prototype.selectionHTML=function(e){return selection.call(this,e)+(e instanceof Building&&e.type==='house'?'<p>Superficie del villaggio: <b>4 × 4 tile · 16 tile</b> · una casa per abitante, fino a 5.</p>':'');};
const draw=Game.prototype.drawBuilding;Game.prototype.drawBuilding=function(b){if(b.type!=='house')return draw.call(this,b);const r=bounds(b),p=this.worldToScreen(r.left*TILE,r.top*TILE),s=TILE*this.camera.zoom,c=this.ctx;c.save();c.globalAlpha*=b.built?1:.55;c.fillStyle='#d8c69c';c.fillRect(p.x,p.y,SIZE*s,SIZE*s);c.strokeStyle=window.terraFactionStyle?.(b.owner)?.color||'#934c36';c.lineWidth=3*this.camera.zoom;c.strokeRect(p.x,p.y,SIZE*s,SIZE*s);
 c.strokeStyle='#b5a17b';c.lineWidth=1;for(let i=1;i<SIZE;i++){c.beginPath();c.moveTo(p.x+i*s,p.y);c.lineTo(p.x+i*s,p.y+SIZE*s);c.moveTo(p.x,p.y+i*s);c.lineTo(p.x+SIZE*s,p.y+i*s);c.stroke();}
 // One house per tile: no central cross and no fractional lot coordinates.
 for(const slot of this.villageHouseSlots(b)){
  const center=this.worldToScreen(slot.x*TILE,slot.y*TILE),size=s*.92;
  if(houseArt.complete&&houseArt.naturalWidth>0){c.imageSmoothingEnabled=false;c.drawImage(houseArt,center.x-size/2,center.y-size/2,size,size);}
  else{c.fillStyle='#d8bd87';c.fillRect(center.x-s*.34,center.y-s*.34,s*.68,s*.68);c.fillStyle='#a55a39';c.fillRect(center.x-s*.38,center.y-s*.38,s*.76,s*.62);c.fillStyle='#663c2b';c.fillRect(center.x-s*.035,center.y-s*.38,s*.07,s*.62);}
 }
 if(!b.built){c.fillStyle='#382f23';c.fillRect(p.x,p.y+SIZE*s-6,SIZE*s,6);c.fillStyle='#d4af62';c.fillRect(p.x,p.y+SIZE*s-6,SIZE*s*b.progress,6);}
 if(this.selected?.id===b.id){c.strokeStyle='#fff0ad';c.lineWidth=3;c.strokeRect(p.x-3,p.y-3,SIZE*s+6,SIZE*s+6);const center=this.worldToScreen((r.left+SIZE/2)*TILE,(r.top+SIZE/2)*TILE);for(const other of this.buildings.filter(other=>this.linkCompatible(other,b))){const q=this.worldToScreen(other.x*TILE,other.y*TILE);c.strokeStyle=this.linkOpen(other,b)?'#e0c27a':'#8c4940';c.beginPath();c.moveTo(center.x,center.y);c.lineTo(q.x,q.y);c.stroke();}}
 c.restore();};
})();
