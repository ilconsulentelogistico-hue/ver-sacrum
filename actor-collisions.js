// Units may pass through one another while moving; stationary actors keep distinct resting positions.
(() => {
'use strict';
const living=g=>[...g.units.filter(u=>u.health>0&&u.location?.kind==='world'),...g.animals.filter(a=>a.health>0),...g.raiders.filter(r=>r.health>0)];
const clear=(g,p,ignore=null)=>living(g).every(e=>e===ignore||Math.hypot(e.x-p.x,e.y-p.y)>=.78);
Game.prototype.actorPositionClear=function(p,ignore=null){return clear(this,p,ignore)};
Game.prototype.gatherWorkSpot=function(u,r){
 const tx=Math.floor(r.x),ty=Math.floor(r.y);
 const slots=[
  {x:tx+.5,y:ty-.5},{x:tx+1.5,y:ty+.5},{x:tx+.5,y:ty+1.5},{x:tx-.5,y:ty+.5},
  {x:tx+1.5,y:ty-.5},{x:tx+1.5,y:ty+1.5},{x:tx-.5,y:ty+1.5},{x:tx-.5,y:ty-.5}
 ];
 const used=new Set(this.units.filter(o=>o!==u&&o.health>0&&o.location?.kind==='world'&&o.task?.type==='gather'&&o.task.target===r.id&&o.task.workSpot)
   .map(o=>`${o.task.workSpot.x.toFixed(2)},${o.task.workSpot.y.toFixed(2)}`));
 const neighbors=[[tx,ty-1],[tx+1,ty],[tx,ty+1],[tx-1,ty]]
   .filter(([x,y])=>this.world.walkable(x,y,1,{x:tx,y:ty},this.buildings));
 const nearby=slots.filter(p=>{
   if(dist(p,r)>1.55)return false;
   const x=Math.floor(p.x),y=Math.floor(p.y);
   return neighbors.some(([nx,ny])=>x===nx&&y===ny
     ||Math.abs(x-nx)+Math.abs(y-ny)===1&&this.world.walkable(x,y,1,{x:nx,y:ny},this.buildings));
 });
 const candidates=nearby.filter(p=>{
  if(used.has(`${p.x.toFixed(2)},${p.y.toFixed(2)}`))return false;
  if(this.units.some(other=>other!==u&&other.health>0&&other.location?.kind==='world'&&dist(other,p)<.78))return false;
  const x=Math.floor(p.x),y=Math.floor(p.y);
  if(!this.world.walkable(x,y,1,null,this.buildings))return false;
  if(this.world.resourcesInBounds(p.x-.7,p.y-.7,p.x+.7,p.y+.7).some(n=>n!==r&&!n.cleared&&(n.amount>0||n.renewable)&&Math.hypot(n.x-p.x,n.y-p.y)<.7))return false;
  return true;
 });
 return candidates.sort((a,b)=>dist(u,a)-dist(u,b))[0]||{x:u.x,y:u.y};
};
const gather=Game.prototype.assignGather;
Game.prototype.assignGather=function(u,r){
 if(!u||!r)return gather.call(this,u,r);
 const result=gather.call(this,u,r);
 if(u.task?.type==='gather'&&u.task.target===r.id){
  const p=this.gatherWorkSpot(u,r);u.task.workSpot=p;
  const path=this.findPath(u.x,u.y,Math.floor(p.x),Math.floor(p.y),1);
  if(!path.length&&Math.hypot(u.x-p.x,u.y-p.y)>.18){this.cancelTask(u);return result;}
  u.path=path;u.state=path.length?'moving':'gathering';
 }
 return result;
};
Game.prototype.gatherTick=function(u,dt){
 const r=this.findById(this.world.resources,u.task?.target);
 if(!r||r.amount<=0){this.continueGather(u,r);return}
 const p=u.task?.workSpot||this.gatherWorkSpot(u,r);u.task.workSpot=p;
 if(Math.hypot(u.x-p.x,u.y-p.y)>.18){
  const path=this.findPath(u.x,u.y,Math.floor(p.x),Math.floor(p.y),1);
  if(path.length){u.path=path;u.state='moving';return}
  this.cancelTask(u);return;
 }
 if(Math.hypot(u.x-r.x,u.y-r.y)>1.55){u.task.workSpot=this.gatherWorkSpot(u,r);u.path=this.findPath(u.x,u.y,Math.floor(u.task.workSpot.x),Math.floor(u.task.workSpot.y),1);if(!u.path.length){this.cancelTask(u);return}u.state='moving';return}
 u.workTimer-=dt;
 if(u.workTimer<=0){
  const skill=['clay','copper','tin'].includes(r.type)?'stone':r.type;u.workTimer=Math.max(.45,1.15-u.skills[skill]*.06)*this.personGatherTimeFactor(u,r)/this.nutritionWorkFactor(u);r.amount--;
  if(!u.inventory.type)u.inventory.type=r.type;
  u.inventory.amount++;const peers=this.units.filter(m=>m.health>0&&m.state==='gathering'&&m.task?.type==='gather'&&m.task.target===r.id&&Math.hypot(m.x-r.x,m.y-r.y)<=1.55);this.grantMentoredWorkXp(u,skill,1,peers);
  if(r.amount<=0)this.continueGather(u,r);else if(u.inventory.amount>=u.inventory.cap)this.returnToStorage(u,{type:'gather',target:r.id});
 }
};
const follow=Game.prototype.followPath;
Game.prototype.followPath=function(e,dt,speed){
 // Villagers can cross other actors while travelling. Animals/raiders still keep live separation.
 if(e instanceof Unit)return follow.call(this,e,dt,speed);
 if(!e.path?.length)return follow.call(this,e,dt,speed);
 const next=e.path[0],dx=next.x-e.x,dy=next.y-e.y,d=Math.hypot(dx,dy)||1,step=Math.min(d,speed*dt),p={x:e.x+dx/d*step,y:e.y+dy/d*step};
 if(!clear(this,p,e))return;
 return follow.call(this,e,dt,speed);
};
Game.prototype.settleUnitPosition=function(u){
 if(!(u instanceof Unit)||u.health<=0||u.location?.kind!=='world'||clear(this,u,u))return true;
 const origin={x:u.x,y:u.y};
 // No teleporting: only a short local bounce, kept close enough to shared work targets.
 for(const radius of [.35,.6,.85]){
  for(let i=0;i<16;i++){
   const a=i/16*Math.PI*2,p={x:origin.x+Math.cos(a)*radius,y:origin.y+Math.sin(a)*radius};
   if(!this.movementClear?.(origin,p))continue;
   if(!clear(this,p,u))continue;
   u.x=p.x;u.y=p.y;u.tx=p.x;u.ty=p.y;
   return true;
  }
 }
 return false;
};
const animalClear=Game.prototype.animalTerrainClear;
// Dynamic actor-to-actor blocking made wandering animals ricochet continuously.
// Keep terrain/resource collision authoritative; actor overlap is corrected only at spawn/rest, not every frame.
Game.prototype.animalTerrainClear=function(p){return animalClear.call(this,p);};
Game.prototype.farmWander=function(u,b){
 const c=TERRA_CROPS[b.crop]||TERRA_CROPS.grain,r=VER_SACRUM_VILLAGE.bounds({...b,crop:u.task?.crop||b.crop});
 // A farm is small: search its immediate surroundings once, instead of asking
 // the world-wide pathfinder to explore 5,000 tiles for an isolated crop tile.
 const sx=Math.floor(u.x),sy=Math.floor(u.y),margin=8;
 const left=Math.max(0,r.left-margin),right=Math.min(this.world.size,r.right+margin);
 const top=Math.max(0,r.top-margin),bottom=Math.min(this.world.size,r.bottom+margin);
 const id=(x,y)=>`${x},${y}`,start=id(sx,sy),seen=new Map([[start,null]]),queue=[[sx,sy]];
 for(let i=0;i<queue.length;i++){
  const [x,y]=queue[i];
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const nx=x+dx,ny=y+dy,k=id(nx,ny);
   if(nx<left||nx>=right||ny<top||ny>=bottom||seen.has(k))continue;
   if(!this.world.walkable(nx,ny,1,{x,y},this.buildings))continue;
   seen.set(k,id(x,y));queue.push([nx,ny]);
  }
 }
 const candidates=[];
 for(let y=r.top;y<r.bottom;y++)for(let x=r.left;x<r.right;x++){
  const p={x:x+.5,y:y+.5};
  if(seen.has(id(x,y))&&this.world.walkable(x,y,1,null,this.buildings)&&clear(this,p,u))candidates.push(p);
 }
 // Also back off when no destination is available; otherwise a failed choice
 // retries on every simulation frame.
 if(!candidates.length){u.farmWanderTimer=3;return false;}
 const p=candidates[Math.floor((this.rng?.next?.()??Math.random())*candidates.length)];
 if(Math.hypot(u.x-p.x,u.y-p.y)<.15){u.farmWanderTimer=2+((this.rng?.next?.()??Math.random())*4);return true;}
 u.farmWanderTimer=3;
 const path=[];let k=id(Math.floor(p.x),Math.floor(p.y));
 while(k!==start){const [x,y]=k.split(',').map(Number);path.push({x:x+.5,y:y+.5});k=seen.get(k)}
 path.reverse();
 if(!path.length)return false;
 u.path=path;u.state='moving';u.task.phase='onFarm';u.task.wanderTarget={x:p.x,y:p.y};return true;
};
const update=Game.prototype.updateUnit;
Game.prototype.updateUnit=function(u,dt){
 if(u.state==='farming'){
  const b=this.findById(this.buildings,u.task?.target);
  if(b?.alive){u.farmWanderTimer=(u.farmWanderTimer??2)-dt;if(u.farmWanderTimer<=0)this.farmWander(u,b);}
 }
 update.call(this,u,dt);
 if(u.state==='farming'&&u.farmWanderTimer===undefined)u.farmWanderTimer=2;
};
const arrive=Game.prototype.onUnitArrive;
Game.prototype.onUnitArrive=function(u){
 if(u.task?.type==='farm'&&u.task.phase==='onFarm'){
  u.state='farming';u.farmWanderTimer=2+((this.rng?.next?.()||Math.random())*4);this.settleUnitPosition(u);return;
 }
 const result=arrive.call(this,u);
 if(u.state!=='moving'&&!u.path?.length)this.settleUnitPosition(u);
 return result;
};
})();
