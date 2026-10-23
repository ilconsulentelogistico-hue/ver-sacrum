// Render the mostly static resource layer once per chunk. Amount changes are
// detected from the live nodes so depletion and regrowth remain visible.
(() => {
  'use strict';
  const MAX_PICTURES=64,LARGE_MAP_PICTURES=24,PAD=20;
  function makeCanvas(width,height){
    if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(width,height);
    if(typeof document.createElement==='function'){
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;return canvas;
    }
    return null;
  }
  const ready=()=>{
    const images=window.TERRA_RESOURCE_TILES;
    return images&&Object.values(images).every(img=>img.complete&&img.naturalWidth>0);
  };
  Game.prototype.drawResourcesCached=function(x0,y0,x1,y1){
    // The 256-tile world benefits from fewer draws. On 512+ the larger
    // canvases can cost more to composite, so keep the original 8-tile size.
    const grouped=this.world.size>=256&&this.world.size<512;
    const side=grouped?16:(this.world.chunkSize||8);
    const limit=grouped?LARGE_MAP_PICTURES:MAX_PICTURES;
    const live=()=>{
      for(const r of this.world.resourcesInBounds(x0,y0,x1,y1))
        if(r.amount>0||r.type==='wood'||r.type==='food')this.drawResource(r);
    };
    const cx0=Math.floor(x0/side),cx1=Math.floor(x1/side),cy0=Math.floor(y0/side),cy1=Math.floor(y1/side);
    if(this._resourcePicturesDisabled||(cx1-cx0+1)*(cy1-cy0+1)>limit||!ready()||
      typeof OffscreenCanvas==='undefined'&&typeof document.createElement!=='function')return live();
    try{
    if(this._resourcePictureWorld!==this.world){
      this._resourcePictureWorld=this.world;this._resourcePictures=new Map();
      this._resourcePictureStats={builds:0,hits:0};
    }
    const pictures=this._resourcePictures,zoom=this.camera.zoom;
    for(let cy=cy0;cy<=cy1;cy++)for(let cx=cx0;cx<=cx1;cx++){
      const startX=cx*side,startY=cy*side;
      if(startX<0||startY<0||startX>=this.world.size||startY>=this.world.size)continue;
      const width=Math.min(side,this.world.size-startX),height=Math.min(side,this.world.size-startY);
      const nodes=this.world.resourcesInBounds(startX,startY,startX+width,startY+height)
        .filter(r=>r.x<startX+width&&r.y<startY+height);
      if(!nodes.length)continue;
      const signature=nodes.map(r=>`${r.id}:${r.type}:${r.x}:${r.y}:${r.amount}:${r.max}:${r.cleared?1:0}:${r.orientation||''}`).join('|');
      const k=`${cx},${cy}`;let entry=pictures.get(k);
      if(!entry||entry.signature!==signature){
        const canvas=makeCanvas(width*TILE+PAD*2,height*TILE+PAD*2),ctx=canvas?.getContext('2d');
        if(!ctx)return live();
        ctx.imageSmoothingEnabled=true;
        const painter={ctx,camera:{zoom:1},worldToScreen(wx,wy){return{x:wx-startX*TILE+PAD,y:wy-startY*TILE+PAD}}};
        for(const r of nodes)if(r.amount>0||r.type==='wood'||r.type==='food')this.drawResource.call(painter,r);
        entry={canvas,signature};pictures.set(k,entry);this._resourcePictureStats.builds++;
      }else{this._resourcePictureStats.hits++;pictures.delete(k);pictures.set(k,entry)}
      const p=this.worldToScreen(startX*TILE-PAD,startY*TILE-PAD);
      this.ctx.imageSmoothingEnabled=true;
      this.ctx.drawImage(entry.canvas,p.x,p.y,entry.canvas.width*zoom,entry.canvas.height*zoom);
    }
    while(pictures.size>limit)pictures.delete(pictures.keys().next().value);
    }catch(error){
      this._resourcePicturesDisabled=true;this._resourcePictures?.clear();
      console.warn('Resource cache disabled:',error?.message||error);return live();
    }
  };
  Game.prototype.resourcePictureStats=function(){return{...this._resourcePictureStats,cached:this._resourcePictures?.size||0}};
  window.TERRA_RESOURCE_RENDER_CACHE={maxPictures:MAX_PICTURES,largeMapPictures:LARGE_MAP_PICTURES};
})();
