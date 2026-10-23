// Shared footprints for placement, movement and exterior interaction points.
(() => {
'use strict';
const bounds=b=>VER_SACRUM_VILLAGE.bounds(b);
const inside=(r,p)=>p.x>=r.left&&p.x<r.right&&p.y>=r.top&&p.y<r.bottom;
const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const resourceAlive=r=>!r.cleared&&(r.amount>0||r.renewable);
const resourceBounds=r=>{const d=r.resourceShape==='triangle'?.43:.515;return{left:r.x-d,right:r.x+d,top:r.y-d,bottom:r.y+d};};
const actors=g=>[...g.units.filter(u=>u.health>0&&u.location?.kind==='world'),...g.animals.filter(a=>a.health>0),...g.raiders.filter(r=>r.health>0)];
const walk=World.prototype.walkable;
World.prototype.walkable=function(x,y,climb=1,from=null,buildings=[]){
 if(!walk.call(this,x,y,climb,from,buildings))return false;
 return ![...buildings,...(this.collisionCamps||[])].some(b=>b.health>0&&b.type!=='farm'&&!(b.type==='palisade'&&!b.built)&&inside(bounds(b),{x:x+.5,y:y+.5}));
};
Game.prototype.buildingDistance=function(p,b){
 const r=bounds(b);if(inside(r,p))return b.type==='farm'?0:Infinity;
 return .5+Math.hypot(Math.max(r.left-p.x,0,p.x-r.right),Math.max(r.top-p.y,0,p.y-r.bottom));
};
Game.prototype.buildingDoors=function(b){
 const r=bounds(b),out=[];
 for(let x=r.left;x<r.right;x++)out.push({x:x+.5,y:r.top-.5},{x:x+.5,y:r.bottom+.5});
 for(let y=r.top;y<r.bottom;y++)out.push({x:r.left-.5,y:y+.5},{x:r.right+.5,y:y+.5});
 return out.filter(p=>this.world.walkable(Math.floor(p.x),Math.floor(p.y),1,null,this.buildings));
};
Game.prototype.villageDoors=function(b){return this.buildingDoors(b);};
Game.prototype.pathToBuilding=function(u,b,reserve=false){
 if(!b?.alive)return null;
 const claimed=p=>reserve&&this.units.some(other=>other!==u&&other.health>0&&other.location.kind==='world'&&
   (Math.hypot(other.x-p.x,other.y-p.y)<.8||other.task?.type==='build'&&other.task.target===b.id&&other.task.workSpot&&dist(other.task.workSpot,p)<.8));
 const targets=this.buildingDoors(b).filter(p=>!claimed(p)).sort((a,c)=>dist(u,a)-dist(u,c));
 if(!(u instanceof Building)&&this.world.walkable(Math.floor(u.x),Math.floor(u.y),1,null,this.buildings)&&this.buildingDistance(u,b)<=1.15&&!claimed(u))return [];
 // Route validation between buildings starts outside the origin footprint.
 const origins=u instanceof Building?this.buildingDoors(u).sort((a,c)=>dist(a,b)-dist(c,b)):[u];
 for(const origin of origins)for(const goal of targets){
  if(dist(origin,goal)<.1)return [];
  const path=this.findPath(origin.x,origin.y,Math.floor(goal.x),Math.floor(goal.y),1);
  if(path.length)return path;
 }
 return null;
};
const placement=Game.prototype.villagePlacementError;
Game.prototype.villagePlacementError=function(type,x,y,ignore=null){
 const error=placement.call(this,type,x,y,ignore);if(error)return error;
 const r=bounds({type,x:x+.5,y:y+.5});
 if((this.warCamps||[]).some(c=>c.health>0&&overlaps(r,bounds(c))))return 'Area occupata da un campo ostile.';
 if(this.world.resourcesInBounds(r.left-.515,r.top-.515,r.right+.515,r.bottom+.515).some(n=>resourceAlive(n)&&overlaps(r,resourceBounds(n))))return 'Area occupata da risorse: libera prima il terreno.';
 if(actors(this).some(e=>overlaps(r,{left:e.x-.45,right:e.x+.45,top:e.y-.45,bottom:e.y+.45})))return 'Area occupata da abitanti o animali.';
 return null;
};
Game.prototype.spawnPositionFree=function(p,ignore=null,occupied=actors(this),allowFields=false){
 if(!this.world.walkable(Math.floor(p.x),Math.floor(p.y),1,null,this.buildings))return false;
 const r={left:p.x-.45,right:p.x+.45,top:p.y-.45,bottom:p.y+.45};
 if(this.buildings.some(b=>b.alive&&(!allowFields||b.type!=='farm')&&overlaps(r,bounds(b))))return false;
 if((this.warCamps||[]).some(b=>b.health>0&&overlaps(r,bounds(b))))return false;
 if(this.world.resourcesInBounds(r.left-.515,r.top-.515,r.right+.515,r.bottom+.515).some(n=>resourceAlive(n)&&overlaps(r,resourceBounds(n))))return false;
 if(ignore instanceof Animal&&!this.animalHasExit(p))return false;
 return !occupied.some(e=>e!==ignore&&dist(e,p)<.95);
};
Game.prototype.nearestSpawnPosition=function(p,ignore=null,occupied=actors(this),allowFields=false){
 const x=Math.floor(p.x),y=Math.floor(p.y);
 for(let radius=0;radius<this.world.size;radius++)for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
  if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;
  const pos={x:x+dx+.5,y:y+dy+.5};if(this.spawnPositionFree(pos,ignore,occupied))return pos;
 }
 return null;
};
Game.prototype.normalizeActorSpawns=function(){
 const placed=[];
 for(const e of actors(this)){
  // Haulers may overlap while travelling. A reload must not scatter them off
  // their valid path merely to enforce resting-position separation.
  const travellingHauler=e instanceof Unit&&e.task?.type==='haul'&&['source','destination'].includes(e.task.phase)&&e.path?.length>0&&this.world.walkable(Math.floor(e.x),Math.floor(e.y),1,null,this.buildings);
  if(travellingHauler){placed.push(e);continue;}
  if(!this.spawnPositionFree(e,e,placed)){
   const p=this.nearestSpawnPosition(e,e,placed);if(!p)throw new Error('Nessuno spazio libero per le unità.');
   e.x=p.x;e.y=p.y;if(e.path)e.path=[];
   if(e instanceof Unit){e.tx=e.x;e.ty=e.y;}
  }
  placed.push(e);
 }
};
Game.prototype.normalizeResourceSpawns=function(){
 const triangles=this.world.resources.filter(r=>resourceAlive(r)&&r.resourceShape==='triangle');
 const hexes=this.world.resources.filter(r=>resourceAlive(r)&&r.resourceShape==='hex');
 for(const r of hexes){
  if(!triangles.some(t=>overlaps(resourceBounds(r),resourceBounds(t))))continue;
  const ox=Math.floor(r.x),oy=Math.floor(r.y);let found=false;
  for(let radius=1;!found&&radius<this.world.size;radius++)for(let dy=-radius;!found&&dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;
   const p={x:ox+dx+.5,y:oy+dy+.5,resourceShape:'hex'},tile=this.world.tile(ox+dx,oy+dy);
   if(!tile||!BIOME[tile.biome].walk||hexes.some(h=>h!==r&&dist(h,p)<1)||triangles.some(t=>overlaps(resourceBounds(p),resourceBounds(t))))continue;
   r.x=p.x;r.y=p.y;this.world.invalidateResourceIndex();found=true;break;
  }
 }
};
Game.prototype.normalizeWorldSpawns=function(){
 for(const b of this.buildings)this.world.ensureResourceChunksForBounds?.(b.x-3,b.y-3,b.x+3,b.y+3);
 for(const e of actors(this))this.world.ensureResourceChunksForBounds?.(e.x-2,e.y-2,e.x+2,e.y+2);
 if(this.world.size<=WORLD_SIZE)this.normalizeResourceSpawns();
 // Preserve inventories, IDs and resource clusters; move conflicting structures.
 const placed=[];
 for(const b of [...this.buildings.filter(b=>b.alive),...(this.warCamps||[]).filter(c=>c.health>0)]){
  const free=(x,y)=>{
   const r=bounds({...b,x:x+.5,y:y+.5});
   if(r.left<0||r.top<0||r.right>this.world.size||r.bottom>this.world.size)return false;
   for(let yy=r.top;yy<r.bottom;yy++)for(let xx=r.left;xx<r.right;xx++){const t=this.world.tile(xx,yy);if(!t||!BIOME[t.biome].walk)return false;}
   return !placed.some(a=>overlaps(r,bounds(a)))&&!this.world.resourcesInBounds(r.left-.515,r.top-.515,r.right+.515,r.bottom+.515).some(n=>resourceAlive(n)&&overlaps(r,resourceBounds(n)));
  };
  const ox=Math.floor(b.x),oy=Math.floor(b.y);let found=free(ox,oy);
  for(let radius=1;!found&&radius<this.world.size;radius++)for(let dy=-radius;!found&&dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==radius||!free(ox+dx,oy+dy))continue;
   b.x=ox+dx+.5;b.y=oy+dy+.5;found=true;break;
  }
  if(!found)throw new Error('Nessuna area libera per una struttura.');
  placed.push(b);
 }
 for(const u of this.units)if(u.location.kind==='resident'){
  const b=this.buildings.find(b=>b.id===u.location.settlementId);if(b){u.x=b.x;u.y=b.y;}
 }
 this.world.collisionCamps=this.warCamps||[];
 this.normalizeActorSpawns();
 // Paths saved before solid footprints existed may run through an entire village.
 for(const e of actors(this))if(e.path?.some(p=>!this.world.walkable(Math.floor(p.x),Math.floor(p.y),1,null,this.buildings)))e.path=[];
};
const newGame=Game.prototype.newGame;Game.prototype.newGame=function(seed){newGame.call(this,seed);this.normalizeWorldSpawns();this.relinkStartingStoresAfterSpawn?.();this.updateUI();};
const load=Game.prototype.load;Game.prototype.load=function(){const ok=load.call(this);if(ok){this.normalizeWorldSpawns();this.updateUI();}return ok;};
for(const method of ['spawnAnimals','spawnRaid']){const spawn=Game.prototype[method];Game.prototype[method]=function(...args){const result=spawn.apply(this,args);this.normalizeActorSpawns();return result;};}
Game.prototype.findResidentExit=function(b){return this.buildingDoors(b).find(p=>this.spawnPositionFree(p))||null;};
Game.prototype.assignBuild=function(u,b){
 if(!u||u.health<=0||u.location?.kind!=='world'||!b?.alive||b.built||b.owner!==u.owner)return false;
 if(!this.constructionCheck(b.type,u).ok){this.message(this.constructionRequirementText(b.type,u));return false;}
 const path=this.pathToBuilding(u,b,true);if(path===null){this.message('Nessun margine libero e raggiungibile per costruire.');return false;}
 this.cancelTask(u);u.task={type:'build',target:b.id,workSpot:path.at(-1)||{x:u.x,y:u.y}};u.path=path;u.state=path.length?'moving':'building';return true;
};
const arrival=Game.prototype.onUnitArrive;
Game.prototype.onUnitArrive=function(u){
 if(['build','enter','farm'].includes(u.task?.type)){
  const b=this.buildings.find(b=>b.id===u.task.target);
  if(!b?.alive)return this.cancelTask(u);
  if(this.buildingDistance(u,b)>1.15){
   const path=this.pathToBuilding(u,b,u.task.type==='build');
   if(path===null){this.cancelTask(u);this.message('Accesso alla struttura bloccato.');return;}
   u.path=path;u.state='moving';return;
  }
 }
 return arrival.call(this,u);
};
// Validate each segment, including old saved paths with distant waypoints.
Game.prototype.movementClear=function(from,to){
 const steps=Math.max(1,Math.ceil(dist(from,to)*5));
 for(let i=1;i<=steps;i++){
  const x=from.x+(to.x-from.x)*i/steps,y=from.y+(to.y-from.y)*i/steps;
  if(!this.world.walkable(Math.floor(x),Math.floor(y),1,null,this.buildings))return false;
 }
 return true;
};
const follow=Game.prototype.followPath;
Game.prototype.followPath=function(e,dt,speed){
 if(e.path?.length&&!this.movementClear(e,e.path[0])){e.path=[];return;}
 return follow.call(this,e,dt,speed);
};
for(const method of ['updateRaider']){
 const update=Game.prototype[method];Game.prototype[method]=function(e,dt){const before={x:e.x,y:e.y};update.call(this,e,dt);if(!this.movementClear(before,e)){e.x=before.x;e.y=before.y;if(e.path)e.path=[];}};
}
// Animals avoid the full resource footprint throughout movement, not just spawn.
Game.prototype.animalTerrainClear=function(p){return this.spawnPositionFree(p,null,[],true);};
Game.prototype.animalSegmentClear=function(from,to){
 const steps=Math.max(1,Math.ceil(dist(from,to)/.15));
 for(let i=0;i<=steps;i++)if(!this.animalTerrainClear({x:from.x+(to.x-from.x)*i/steps,y:from.y+(to.y-from.y)*i/steps}))return false;
 return true;
};
Game.prototype.animalHasExit=function(p){
 return [[.5,0],[-.5,0],[0,.5],[0,-.5]].some(([x,y])=>this.animalSegmentClear(p,{x:p.x+x,y:p.y+y}));
};
const animalUpdate=Game.prototype.updateAnimal;
Game.prototype.updateAnimal=function(a,dt){
 if(a.health<=0)return;
 // Also repair old or newly obstructed positions without replacing the animal.
 if(!this.animalTerrainClear(a)){
  const free=this.nearestSpawnPosition(a,a);if(!free)return;
  a.x=free.x;a.y=free.y;a.vx=0;a.vy=0;a.wander=0;
 }
 const before={x:a.x,y:a.y};animalUpdate.call(this,a,dt);
 if(this.animalSegmentClear(before,a))return;
 const angle=Math.atan2(a.y-before.y,a.x-before.x),step=Math.max(dist(before,a),.28*dt);
 a.x=before.x;a.y=before.y;
 // Turn along the obstacle rather than retrying the same blocked direction.
 for(const turn of [Math.PI/2,-Math.PI/2,Math.PI/4,-Math.PI/4,Math.PI]){
  const heading=angle+turn,next={x:before.x+Math.cos(heading)*step,y:before.y+Math.sin(heading)*step};
  if(!this.animalSegmentClear(before,next))continue;
  a.x=next.x;a.y=next.y;a.vx=Math.cos(heading)*.28;a.vy=Math.sin(heading)*.28;a.wander=1;return;
 }
 a.vx=0;a.vy=0;a.wander=0;
};
const pen=Game.prototype.assignAnimalToPen;
Game.prototype.assignAnimalToPen=function(a,b){
 if(!a||!b)return pen.call(this,a,b);
 const spot=this.nearestSpawnPosition(b,a);if(!spot)return 'Nessuno spazio libero presso il recinto.';
 const error=pen.call(this,a,b);if(!error){a.x=spot.x;a.y=spot.y;}return error;
};
})();
