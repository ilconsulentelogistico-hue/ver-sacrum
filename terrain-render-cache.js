// Keep P16 terrain pictures per chunk, while entity and resource sprites stay live.
(() => {
  'use strict';
  const MAX_PICTURES=128;
  function makeCanvas(width,height){
    if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(width,height);
    if(typeof document.createElement==='function'){
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;return canvas;
    }
    return null;
  }
  Game.prototype.drawTerrainCached=function(x0,y0,x1,y1,ts){
    const side=this.world.chunkSize||8,zoom=this.camera.zoom;
    const fallback=()=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)this.drawTile(x,y,ts)};
    // At close zoom the diagnostic tile grid must retain its exact line width.
    if(this._terrainPicturesDisabled||zoom>1.55||typeof OffscreenCanvas==='undefined'&&typeof document.createElement!=='function')return fallback();
    try{
    if(this._terrainPictureWorld!==this.world){
      this._terrainPictureWorld=this.world;this._terrainPictures=new Map();
      this._terrainPictureStats={builds:0,hits:0};
    }
    const pictures=this._terrainPictures,versions=this.world.visualChunkVersions;
    for(let cy=Math.floor(y0/side);cy<=Math.floor(y1/side);cy++)for(let cx=Math.floor(x0/side);cx<=Math.floor(x1/side);cx++){
      const startX=cx*side,startY=cy*side;
      if(startX<0||startY<0||startX>=this.world.size||startY>=this.world.size)continue;
      const k=`${cx},${cy}`,version=versions.get(k)||0;
      let entry=pictures.get(k);
      if(!entry||entry.version!==version){
        const width=Math.min(side,this.world.size-startX),height=Math.min(side,this.world.size-startY);
        const canvas=makeCanvas(width*TILE,height*TILE),ctx=canvas?.getContext('2d',{alpha:false});
        if(!ctx)return fallback();
        ctx.imageSmoothingEnabled=false;
        const painter={world:this.world,seed:this.seed,camera:{zoom:1},ctx,
          worldToScreen(wx,wy){return{x:wx-startX*TILE,y:wy-startY*TILE}}};
        for(let y=startY;y<startY+height;y++)for(let x=startX;x<startX+width;x++)this.drawTile.call(painter,x,y,TILE);
        entry={canvas,version};pictures.set(k,entry);this._terrainPictureStats.builds++;
      }else{this._terrainPictureStats.hits++;pictures.delete(k);pictures.set(k,entry)}
      const p=this.worldToScreen(startX*TILE,startY*TILE);
      this.ctx.imageSmoothingEnabled=false;
      this.ctx.drawImage(entry.canvas,p.x,p.y,entry.canvas.width*zoom+.4,entry.canvas.height*zoom+.4);
    }
    while(pictures.size>MAX_PICTURES)pictures.delete(pictures.keys().next().value);
    }catch(error){
      // Some mobile GPUs reject an OffscreenCanvas or its drawImage source.
      // The tile renderer is slower but always produces a visible map.
      this._terrainPicturesDisabled=true;this._terrainPictures?.clear();
      console.warn('Terrain cache disabled:',error?.message||error);return fallback();
    }
  };
  Game.prototype.terrainPictureStats=function(){return{...this._terrainPictureStats,cached:this._terrainPictures?.size||0}};
  window.TERRA_RENDER_CACHE={maxPictures:MAX_PICTURES};
})();
