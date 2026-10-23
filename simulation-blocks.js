// Nearby actors use the normal frame step. Passive actors in distant chunks
// accumulate elapsed game time and update at a lower frequency.
(() => {
  'use strict';
  const SIDE=8,FAR_INTERVAL=.25;
  const chunkKey=(e,side)=>`${Math.floor(e.x/side)},${Math.floor(e.y/side)}`;
  Game.prototype.activeSimulationChunks=function(){
    const z=this.camera.zoom||1,w=this.viewW||390,h=this.viewH||600,side=this.world.chunkSize||SIDE;
    const left=Math.floor((this.camera.x-w/(2*z))/TILE/side)-1;
    const right=Math.floor((this.camera.x+w/(2*z))/TILE/side)+1;
    const top=Math.floor((this.camera.y-h/(2*z))/TILE/side)-1;
    const bottom=Math.floor((this.camera.y+h/(2*z))/TILE/side)+1;
    const active=new Set();
    for(let cy=top;cy<=bottom;cy++)for(let cx=left;cx<=right;cx++)active.add(`${cx},${cy}`);
    return active;
  };
  Game.prototype.updateLiving=function(dt){
    const active=this.activeSimulationChunks(),side=this.world.chunkSize||SIDE;
    const threats=[...this.raiders.filter(r=>r.health>0),...this.animals.filter(a=>a.type==='wolf'&&a.owner<0&&a.health>0)];
    const targeted=new Set(this.units.map(u=>u.task?.target).filter(Boolean));
    // Spread distant passive updates across frames in large settlements.
    const stagger=this.world.size>=1024&&this.units.length>=100;
    const bucket=stagger?(this._farBucket=((this._farBucket??-1)+1)&7):0;
    for(let i=0;i<this.units.length;i++){
      const u=this.units[i];
      if(u.location.kind!=='world')continue;
      const passive=u.health>0&&u.state==='idle'&&!u.task;
      const danger=passive&&threats.some(e=>Math.hypot(e.x-u.x,e.y-u.y)<5);
      if(passive&&!active.has(chunkKey(u,side))&&!danger){
        u._lodPending=(u._lodPending||0)+dt;
        if(u._lodPending<FAR_INTERVAL||(stagger&&(i&7)!==bucket))continue;
        const elapsed=u._lodPending;u._lodPending=0;this.updateUnit(u,elapsed);
      }else{
        const pending=u._lodPending||0;
        // The pending time belonged to idleness. A new task must not inherit it.
        if(!passive&&pending){
          u.attackCooldown=Math.max(0,u.attackCooldown-pending);
        }
        const elapsed=dt+(passive?pending:0);u._lodPending=0;this.updateUnit(u,elapsed);
      }
    }
    for(const a of this.animals){
      const passive=a.health>0&&a.type==='sheep'&&!targeted.has(a.id);
      if(passive&&!active.has(chunkKey(a,side))){
        a._lodPending=(a._lodPending||0)+dt;
        if(a._lodPending<FAR_INTERVAL)continue;
        const elapsed=a._lodPending;a._lodPending=0;this.updateAnimal(a,elapsed);
      }else{
        const elapsed=dt+(a._lodPending||0);a._lodPending=0;this.updateAnimal(a,elapsed);
      }
    }
    for(const r of this.raiders)this.updateRaider(r,dt);
    // A moving actor must never reveal new resources only during reload.
    if(this.world.size>WORLD_SIZE){
      if(this._actorResourceCoverageWorld!==this.world){this._actorResourceCoverageWorld=this.world;this._actorResourceCoverage=new WeakMap();}
      for(const e of [...this.units,...this.animals,...this.raiders]){
        if(e.health<=0||e.location?.kind!==undefined&&e.location.kind!=='world')continue;
        const key=`${Math.floor((e.x-2)/side)},${Math.floor((e.y-2)/side)},${Math.floor((e.x+2)/side)},${Math.floor((e.y+2)/side)}`;
        if(this._actorResourceCoverage.get(e)===key)continue;
        this.world.ensureResourceChunksForBounds(e.x-2,e.y-2,e.x+2,e.y+2);
        this._actorResourceCoverage.set(e,key);
      }
    }
    if(this.world.size>=1024){
      this._resourcePruneClock=(this._resourcePruneClock||0)+dt;
      if(this._resourcePruneClock>=5){
        this._resourcePruneClock=0;
        const keep=this.activeSimulationChunks();
        const protect=e=>{if(!e||!Number.isFinite(e.x)||!Number.isFinite(e.y))return;const cx=Math.floor(e.x/side),cy=Math.floor(e.y/side);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)keep.add(`${cx+dx},${cy+dy}`);};
        for(const e of [...this.units,...this.animals,...this.raiders,...this.buildings])protect(e);
        for(const u of this.units)if(u.task?.target?.startsWith?.('rp-'))protect(this.world.resourceById(u.task.target));
        protect(this.selected);
        this.world.pruneResourceChunks(keep);
      }
    }
  };
  window.TERRA_SIMULATION_BLOCKS={side:SIDE,farInterval:FAR_INTERVAL};
})();
