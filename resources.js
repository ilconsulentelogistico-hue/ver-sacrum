// Resource ecology: one visual marker is one persistent resource point.
(() => {
  'use strict';

  const oldGenerate=World.prototype.generate;

  function setupResource(r){
    if((r.type==='wood'||r.type==='food')&&(r.naturalScale===10||r.resourceShape==='hex'||r.renewable===true)){
      r.renewable=true;
      if(!Number.isSafeInteger(r.regrowDelay))r.regrowDelay=r.type==='wood'?900:600;
      if(r.depletedAt===undefined)r.depletedAt=null;
      if(r.regrowing===undefined)r.regrowing=false;
    }else{
      r.renewable=false;
      r.regrowing=false;
      r.depletedAt=null;
    }
    return r;
  }

  World.prototype.generate=function(){
    oldGenerate.call(this);
    // Existing 88x88 worlds keep their exact resource layout. Larger experimental
    // worlds build deterministic resource chunks only when those areas are used.
    if(this.size>WORLD_SIZE){this.resourceChunksLoaded=new Set();if(this.size>=1024)this.resourceChunksResident=new Set();return;}
    // Resource ecology still scans the 88x88 map; keep each generated tile until this pass ends.
    this._buildingResources=true;
    const s=this.size,seed=this.seed,rng=new RNG(seed^0x51f15e5d),next=[];

    const add=(type,x,y,amount,extra={})=>{
      if(x<1||y<1||x>=s-1||y>=s-1)return null;
      const r=setupResource(new ResourceNode(type,x,y,amount));
      Object.assign(r,extra);
      r.naturalScale=10;setupResource(r);
      next.push(r);
      return r;
    };

    // Renewable resources: every hex is its own node and owns its own quantity.
    for(let y=2;y<s-2;y++)for(let x=2;x<s-2;x++){
      const t=this.tile(x,y);
      if(!t||!BIOME[t.biome].walk)continue;

      if(t.biome==='forest'&&hash(x,y,seed+1401)>.34){
        const px=x+.5+((y&1)?0.22:0);
        const r=add('wood',px,y+.5,rng.int(34,72)*10);
        if(r){r.regrowDelay=900;r.resourceShape='hex';}
      }else if((t.biome==='grass'||t.biome==='scrub')&&hash(x,y,seed+1402)>.958){
        const px=x+.5+((y&1)?0.22:0);
        const r=add('food',px,y+.5,rng.int(18,38)*10);
        if(r){r.regrowDelay=600;r.resourceShape='hex';}
      }
    }

    // Non-renewable terrain resources: a cluster is many individual triangle nodes.
    const centers=[];
    const farEnough=(x,y)=>centers.every(c=>Math.hypot(c.x-x,c.y-y)>=7);

    for(let y=5;y<s-5;y++)for(let x=5;x<s-5;x++){
      const t=this.tile(x,y);
      if(!t||!['mountain','scrub'].includes(t.biome))continue;
      if(hash(x,y,seed+2401)>.991&&farEnough(x,y))centers.push({x:x+.5,y:y+.5});
    }

    for(let tries=0;centers.length<8&&tries<1200;tries++){
      const x=rng.int(5,s-6),y=rng.int(5,s-6),t=this.tile(x,y);
      if(t&&['mountain','scrub'].includes(t.biome)&&farEnough(x,y))centers.push({x:x+.5,y:y+.5});
    }

    centers.forEach((c,ci)=>{
      const metalRich=hash(Math.floor(c.x),Math.floor(c.y),seed+3401)>.68;
      const clusterId='terrain-'+ci;
      const cx=Math.floor(c.x),cy=Math.floor(c.y);

      // Mineral lattice anchored to the tile grid.
      // Every occupied tile contributes an ▲ at its centre and, when the vein continues,
      // a ▼ on its right edge. This yields a continuous chain:
      // x+.5 (▲) -> x+1 (▼) -> x+1.5 (▲) -> x+2 (▼) ...
      for(let row=-4;row<=4;row++){
        const rowWidth=Math.max(1,Math.floor(5*Math.sqrt(Math.max(0,1-(row/4)*(row/4)))));
        const leftJitter=Math.floor(hash(ci*31,row*17,seed+4401)*2);
        const rightJitter=Math.floor(hash(ci*37,row*19,seed+4402)*2);
        const minCol=-rowWidth+leftJitter;
        const maxCol=rowWidth-rightJitter;

        for(let col=minCol;col<=maxCol;col++){
          const tileX=cx+col,tileY=cy+row;
          const t=this.tile(tileX,tileY);
          if(!t||!BIOME[t.biome].walk||['sea','river','marsh'].includes(t.biome))continue;

          const ironChance=metalRich?.28:.07;
          const type=rng.next()<ironChance?'iron':'stone';
          const amount=(type==='iron'?rng.int(75,115):rng.int(95,150))*10;

          // ▲ fully inside the tile.
          const up=add(type,tileX+.5,tileY+.5,amount,{
            orientation:'up',clusterId,resourceShape:'triangle',tileX,tileY
          });
          if(up)up.renewable=false;

          // ▼ bridges this tile and the next one only when the chain can continue.
          if(col<maxCol){
            const right=this.tile(tileX+1,tileY);
            if(right&&BIOME[right.biome].walk&&!['sea','river','marsh'].includes(right.biome)){
              const downType=rng.next()<ironChance?'iron':'stone';
              const downAmount=(downType==='iron'?rng.int(75,115):rng.int(95,150))*10;
              const down=add(downType,tileX+1,tileY+.5,downAmount,{
                orientation:'down',clusterId,resourceShape:'triangle',tileX,tileY
              });
              if(down)down.renewable=false;
            }
          }
        }
      }
    });

    // Clay is scarce and finite near wet soil; append after legacy nodes so their
    // deterministic positions and quantities stay unchanged.
    const claySites=[];
    for(let y=2;y<s-2;y++)for(let x=2;x<s-2;x++){
      const t=this.tile(x,y);
      if(t?.nearWater&&['marsh','plain','beach'].includes(t.biome))claySites.push({x,y,score:hash(x,y,seed+5601)});
    }
    claySites.sort((a,b)=>b.score-a.score);
    const chosen=[];
    for(const c of claySites){
      if(chosen.length>=8)break;
      if(chosen.some(o=>Math.hypot(o.x-c.x,o.y-c.y)<6))continue;
      const r=add('clay',c.x+.5,c.y+.5,40+Math.floor(c.score*30),{resourceShape:'hex'});
      if(r){r.id=`clay-${seed}-${c.x}-${c.y}`;chosen.push(c);}
    }

    // Rare copper outcrops are appended after old resources to preserve their layout.
    const copperSites=[];
    for(let y=3;y<s-3;y++)for(let x=3;x<s-3;x++){
      const t=this.tile(x,y);
      if(t&&['mountain','scrub'].includes(t.biome))copperSites.push({x,y,score:hash(x,y,seed+5701)});
    }
    copperSites.sort((a,b)=>b.score-a.score);
    const copperChosen=[];
    for(const c of copperSites){
      if(copperChosen.length>=4)break;
      if(copperChosen.some(o=>Math.hypot(o.x-c.x,o.y-c.y)<7))continue;
      if(next.some(o=>Math.hypot(o.x-c.x-.5,o.y-c.y-.5)<1))continue;
      const r=add('copper',c.x+.5,c.y+.5,32+Math.floor(c.score*18),{resourceShape:'hex'});
      if(r){r.id=`copper-${seed}-${c.x}-${c.y}`;copperChosen.push(c);}
    }

    // Tin is rarer than copper and uses distinct finite outcrops.
    const tinSites=[];
    for(let y=3;y<s-3;y++)for(let x=3;x<s-3;x++){
      const t=this.tile(x,y);
      if(t&&['mountain','scrub'].includes(t.biome))tinSites.push({x,y,score:hash(x,y,seed+5801)});
    }
    tinSites.sort((a,b)=>b.score-a.score);
    const tinChosen=[];
    for(const c of tinSites){
      if(tinChosen.length>=3)break;
      if(tinChosen.some(o=>Math.hypot(o.x-c.x,o.y-c.y)<8))continue;
      if(next.some(o=>Math.hypot(o.x-c.x-.5,o.y-c.y-.5)<1))continue;
      const r=add('tin',c.x+.5,c.y+.5,24+Math.floor(c.score*14),{resourceShape:'hex'});
      if(r){r.id=`tin-${seed}-${c.x}-${c.y}`;tinChosen.push(c);}
    }

    this.resources=next;
    this._buildingResources=false;
    this.trimChunkCache?.();
  };

  Game.prototype.ensureResourceRules=function(){
    for(const r of this.world.resources)setupResource(r);
  };

  Game.prototype.resourceRegenerationDay=function(){
    this.ensureResourceRules();
    for(const r of this.world.resources){
      if(!r.renewable||r.cleared)continue;

      if(r.amount<=0){
        if(r.regrowing){
          r.regrowing=false;
          r.depletedAt=this.totalDays;
        }else if(r.depletedAt===null){
          r.depletedAt=this.totalDays;
        }else if(this.totalDays-r.depletedAt>=r.regrowDelay){
          r.amount=Math.max(1,Math.ceil(r.max*.08));
          r.regrowing=true;
          r.depletedAt=null;
        }
        continue;
      }

      if(r.regrowing&&r.amount<r.max){
        r.amount=Math.min(r.max,r.amount+Math.max(1,Math.ceil(r.max/240)));
        if(r.amount>=r.max)r.regrowing=false;
      }
    }
  };

  const oldAdvanceDay=Game.prototype.advanceDay;
  Game.prototype.advanceDay=function(){
    oldAdvanceDay.call(this);
    this.resourceRegenerationDay();
  };
  Game.prototype.clearResource=function(r){if(!r||!r.renewable||r.cleared)return false;const u=this.rtsSelectedUnits().find(u=>u.owner===0&&u.health>0&&dist(u,r)<=2)||this.units.find(u=>u.owner===0&&u.health>0&&u.location.kind==='world'&&dist(u,r)<=2);if(!u){this.message('Porta un abitante entro 2 tile dallo spot da radere.');return false;}r.amount=0;r.cleared=true;r.regrowing=false;for(const person of this.units)if(person.task?.type==='gather'&&person.task.target===r.id)this.continueGather(person,r);this.save(true);this.updateUI();return true;};
  const selectionHTML=Game.prototype.selectionHTML;Game.prototype.selectionHTML=function(e){let html=selectionHTML.call(this,e);if(e instanceof ResourceNode&&e.renewable&&!e.cleared)html+='<button id="clearResource" type="button">Radi al suolo (nessuna ricrescita)</button>';return html;};
  const updateUI=Game.prototype.updateUI;Game.prototype.updateUI=function(){updateUI.call(this);const button=$('#clearResource');if(button)button.onclick=()=>this.clearResource(this.selected);};
})();
