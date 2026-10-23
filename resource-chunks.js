// Experimental worlds larger than the preserved 88x88 version-zero geography.
// Every resource is derived from seed and tile/chunk coordinates, so exploration
// order does not change the map and only visited chunks need to be saved.
(() => {
  'use strict';
  const intHash=(x,y,seed,min,max)=>min+Math.min(max-min,Math.floor(hash(x,y,seed)*(max-min+1)));
  World.prototype.ensureResourceChunksForBounds=function(x0,y0,x1,y1){
    if(this.size<=WORLD_SIZE)return;
    const side=this.chunkSize||8,max=Math.ceil(this.size/side)-1;
    const left=Math.max(0,Math.floor(x0/side)),right=Math.min(max,Math.floor(x1/side));
    const top=Math.max(0,Math.floor(y0/side)),bottom=Math.min(max,Math.floor(y1/side));
    for(let cy=top;cy<=bottom;cy++)for(let cx=left;cx<=right;cx++)this.generateResourceChunk(cx,cy);
  };
  World.prototype.generateResourceChunk=function(cx,cy){
    if(this.size<=WORLD_SIZE)return;
    const side=this.chunkSize||8,k=`${cx},${cy}`;
    this.resourceChunksLoaded??=new Set();
    const resident=this.size>=1024?(this.resourceChunksResident??=new Set()):this.resourceChunksLoaded;
    if(resident.has(k))return;
    const seed=this.seed,s=this.size,created=[];
    const add=(type,x,y,amount,extra={})=>{
      if(x<1||y<1||x>=s-1||y>=s-1)return;
      const r=new ResourceNode(type,x,y,amount);
      r.id=`rp-${seed}-${type}-${Math.round(x*100)}-${Math.round(y*100)}`;
      r.naturalScale=10;r.resourceShape=extra.resourceShape||'hex';
      r.renewable=type==='wood'||type==='food';r.regrowDelay=type==='wood'?900:type==='food'?600:0;
      r.depletedAt=null;r.regrowing=false;Object.assign(r,extra);
      if(!this.resourceOverrides?.has(r.id))created.push(r);
    };
    const centerFor=(bx,by)=>{
      if(bx<0||by<0||bx*side>=s||by*side>=s||hash(bx,by,seed+2401)>.27)return null;
      const x=bx*side+intHash(bx,by,seed+2402,2,side-3);
      const y=by*side+intHash(bx,by,seed+2403,2,side-3);
      const tile=this.tile(x,y);
      return tile&&['mountain','scrub'].includes(tile.biome)?{x,y,bx,by}:null;
    };
    for(let y=cy*side;y<Math.min(s,(cy+1)*side);y++)for(let x=cx*side;x<Math.min(s,(cx+1)*side);x++){
      if(x<2||y<2||x>=s-2||y>=s-2)continue;
      const tile=this.tile(x,y);if(!tile||!BIOME[tile.biome].walk)continue;
      const px=x+.5+((y&1)?0.22:0);
      if(['mountain','scrub'].includes(tile.biome)&&hash(x,y,seed+5801)>.9997){
        add('tin',px,y+.5,intHash(x,y,seed+5802,24,38),{resourceShape:'hex',renewable:false});
      }
      if(['mountain','scrub'].includes(tile.biome)&&hash(x,y,seed+5701)>.9995){
        add('copper',px,y+.5,intHash(x,y,seed+5702,32,50),{resourceShape:'hex',renewable:false});
      }
      if(tile.nearWater&&['marsh','plain','beach'].includes(tile.biome)&&hash(x,y,seed+5601)>.975){
        add('clay',px,y+.5,intHash(x,y,seed+5602,40,70),{resourceShape:'hex',renewable:false});
      }
      if(tile.biome==='forest'&&hash(x,y,seed+1401)>.34){
        add('wood',px,y+.5,intHash(x,y,seed+1403,34,72)*10,{resourceShape:'hex'});
      }
      const foodCandidate=['grass','scrub'].includes(tile.biome)&&hash(x,y,seed+1402)>.958;
      if(!['mountain','scrub'].includes(tile.biome)){if(foodCandidate)add('food',px,y+.5,intHash(x,y,seed+1404,18,38)*10,{resourceShape:'hex'});continue;}
      let vein=null,best=Infinity;
      for(let by=cy-1;by<=cy+1;by++)for(let bx=cx-1;bx<=cx+1;bx++){
        const c=centerFor(bx,by);if(!c)continue;
        const dx=x-c.x,dy=y-c.y,d=dx*dx+dy*dy;
        if(d<=14&&d<best){vein=c;best=d}
      }
      if(!vein){if(foodCandidate)add('food',px,y+.5,intHash(x,y,seed+1404,18,38)*10,{resourceShape:'hex'});continue;}
      const clusterId=`vein-${vein.bx}-${vein.by}`;
      const iron=hash(x,y,seed+3401)>.78,type=iron?'iron':'stone';
      const amount=intHash(x,y,seed+3402,iron?75:95,iron?115:150)*10;
      add(type,x+.5,y+.5,amount,{resourceShape:'triangle',orientation:'up',clusterId,tileX:x,tileY:y,renewable:false});
      if(hash(x,y,seed+3403)>.45){
        const downIron=hash(x,y,seed+3404)>.78,downType=downIron?'iron':'stone';
        const downAmount=intHash(x,y,seed+3405,downIron?75:95,downIron?115:150)*10;
        add(downType,x+.98,y+.5,downAmount,{resourceShape:'triangle',orientation:'down',clusterId,tileX:x,tileY:y,renewable:false});
      }
    }
    this.resources.push(...created);this.resourceChunksLoaded.add(k);resident.add(k);
  };
  World.prototype.pruneResourceChunks=function(keep){
    if(this.size<1024||!this.resourceChunksResident)return 0;
    const evicted=new Set([...this.resourceChunksResident].filter(k=>!keep.has(k)));
    if(!evicted.size&&!this.resourceOverrides?.size)return 0;
    const side=this.chunkSize||8,still=[];
    this.resourceOverrides??=new Map();
    for(const r of this.resources){
      const k=`${Math.floor(r.x/side)},${Math.floor(r.y/side)}`;
      const changed=r.amount!==r.max||r.depletedAt!==null||r.regrowing||r.cleared;
      if(!evicted.has(k)||!r.id.startsWith(`rp-${this.seed}-`)){
        if(!changed&&!this.resourceChunksResident.has(k)&&this.resourceOverrides.get(r.id)===r)this.resourceOverrides.delete(r.id);
        else still.push(r);
        continue;
      }
      if(changed){
        this.resourceOverrides.set(r.id,r);still.push(r);
      }else this.resourceOverrides.delete(r.id);
    }
    this.resources=still;
    for(const k of evicted)this.resourceChunksResident.delete(k);
    this.invalidateResourceIndex();
    return evicted.size;
  };
})();
