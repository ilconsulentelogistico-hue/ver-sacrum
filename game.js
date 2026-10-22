const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const key=(x,y)=>`${x},${y}`;
const TILE=30;
const WORLD_SIZE=88;
const SAVE_KEY='terra-italica-save-v2';
const NAMES=['Aulo','Neria','Tito','Velia','Maro','Tana','Silio','Ovia','Vibio','Larth','Atria','Festo','Tita','Numa','Ruma','Caio'];
const BUILD_COSTS={
  sawmill:{wood:18,stone:8},mill:{wood:20,stone:12}, bakery:{wood:16,stone:16}, kiln:{wood:20,stone:12}, foundry:{wood:24,stone:18}, loom:{wood:18,stone:6}, press:{wood:18,stone:8}, warehouse:{wood:18,stone:8}, house:{wood:24,stone:10}, farm:{wood:10},
  pen:{wood:12,stone:4}, market:{wood:22,stone:10}, palisade:{wood:4}, tower:{wood:14,stone:8}
};
const BUILD_LABEL={sawmill:'Falegnameria',mill:'Mulino',bakery:'Forno',kiln:'Fornace ceramica',foundry:'Fonderia',loom:'Telaio',press:'Torchio',base:'Casa comune',warehouse:'Magazzino',house:'Distretto',farm:'Campo',pen:'Recinto',market:'Mercato',palisade:'Palizzata',tower:'Torre'};
const BIOME={
  sea:{name:'Mare',color:'#344b4b',walk:false,fertility:0}, river:{name:'Fiume',color:'#4a6460',walk:false,fertility:.2},
  beach:{name:'Spiaggia',color:'#a18d65',walk:true,fertility:.35}, grass:{name:'Prateria',color:'#696f50',walk:true,fertility:1},
  forest:{name:'Bosco',color:'#44563a',walk:true,fertility:.55}, scrub:{name:'Macchia',color:'#767052',walk:true,fertility:.68},
  plain:{name:'Terra battuta',color:'#79654a',walk:true,fertility:.72}, mountain:{name:'Appennino',color:'#706d61',walk:true,fertility:.22},
  marsh:{name:'Palude',color:'#53604b',walk:true,fertility:.4}
};

function hash(x,y,seed){let h=(x*374761393+y*668265263+seed*1442695041)|0;h=(h^(h>>>13))*1274126177;return ((h^(h>>>16))>>>0)/4294967295}
function smoothstep(t){return t*t*(3-2*t)}
function valueNoise(x,y,seed){const x0=Math.floor(x),y0=Math.floor(y),tx=smoothstep(x-x0),ty=smoothstep(y-y0);const a=hash(x0,y0,seed),b=hash(x0+1,y0,seed),c=hash(x0,y0+1,seed),d=hash(x0+1,y0+1,seed);return lerp(lerp(a,b,tx),lerp(c,d,tx),ty)}
function octave(x,y,seed){return valueNoise(x,y,seed)*.58+valueNoise(x*2,y*2,seed+31)*.28+valueNoise(x*4,y*4,seed+73)*.14}
class RNG{constructor(seed){this.s=seed>>>0}next(){this.s=(this.s*1664525+1013904223)>>>0;return this.s/4294967296}int(a,b){return Math.floor(this.next()*(b-a+1))+a}pick(a){return a[Math.floor(this.next()*a.length)]}}
// Stable min-heap: equal priorities leave in their original insertion order.
class PathQueue{
  constructor(){this.items=[]}
  get length(){return this.items.length}
  earlier(a,b){return a.f<b.f||a.f===b.f&&a.order<b.order}
  push(value){
    const heap=this.items;let i=heap.length;heap.push(value);
    while(i>0){const parent=(i-1)>>1;if(!this.earlier(value,heap[parent]))break;heap[i]=heap[parent];i=parent}
    heap[i]=value;
  }
  pop(){
    const heap=this.items,first=heap[0],last=heap.pop();if(!heap.length)return first;
    let i=0;while(true){let child=i*2+1;if(child>=heap.length)break;
      if(child+1<heap.length&&this.earlier(heap[child+1],heap[child]))child++;
      if(!this.earlier(heap[child],last))break;heap[i]=heap[child];i=child;
    }
    heap[i]=last;return first;
  }
}

// Tile values are plain instance fields; setters record only differences from the seed.
class TerrainTile{
  constructor(world,x,y,base){
    this.x=x;this.y=y;this._world=world;this._index=world.idx(x,y);this._base=base;
    const patch=world.tileChanges.get(this._index)||{};
    this._biome=Object.hasOwn(patch,'biome')?patch.biome:base.biome;
    this._z=Object.hasOwn(patch,'z')?patch.z:base.z;
    this._nearWater=Object.hasOwn(patch,'nearWater')?patch.nearWater:base.nearWater;
    this._road=Object.hasOwn(patch,'road')?patch.road:base.road;
  }
  change(field,value){
    const previous=this['_'+field];
    this['_'+field]=value;
    const world=this._world,patch=world.tileChanges.get(this._index)||{};
    if(value===this._base[field])delete patch[field];else patch[field]=value;
    if(Object.keys(patch).length)world.tileChanges.set(this._index,patch);else world.tileChanges.delete(this._index);
    if(previous!==value&&field==='biome')world.minimapRevision=(world.minimapRevision||0)+1;
    if(previous!==value&&field!=='nearWater'){
      const side=world.chunkSize||8,k=`${Math.floor(this.x/side)},${Math.floor(this.y/side)}`;
      world.visualChunkVersions.set(k,(world.visualChunkVersions.get(k)||0)+1);
    }
  }
  get biome(){return this._biome}set biome(value){this.change('biome',value)}
  get z(){return this._z}set z(value){this.change('z',value)}
  get nearWater(){return this._nearWater}set nearWater(value){this.change('nearWater',value)}
  get road(){return this._road}set road(value){this.change('road',value)}
  toJSON(){return{x:this.x,y:this.y,biome:this.biome,z:this.z,nearWater:this.nearWater,road:this.road}}
}
class World{
  constructor(seed,size=WORLD_SIZE){this.seed=seed;this.size=size;this.resources=[];this.generate()}
  idx(x,y){return y*this.size+x}
  // Resource positions are static in ordinary play; amounts may change in place.
  // Reassignment on load and direct append in legacy code invalidate the index.
  invalidateResourceIndex(){this._resourceIndexSource=null}
  ensureResourceIndex(){
    if(this._resourceIndexSource===this.resources&&this._resourceIndexCount===this.resources.length)return;
    const buckets=new Map(),byId=new Map(),side=this.chunkSize||8;
    this.resources.forEach((r,order)=>{
      const k=`${Math.floor(r.x/side)},${Math.floor(r.y/side)}`;
      if(!buckets.has(k))buckets.set(k,[]);
      buckets.get(k).push({r,order});
      byId.set(r.id,r);
    });
    this._resourceBuckets=buckets;this._resourceById=byId;
    this._resourceIndexSource=this.resources;this._resourceIndexCount=this.resources.length;
  }
  resourcesInBounds(x0,y0,x1,y1){
    this.ensureResourceChunksForBounds?.(x0,y0,x1,y1);
    this.ensureResourceIndex();
    const side=this.chunkSize||8,found=[];
    for(let cy=Math.floor(y0/side);cy<=Math.floor(y1/side);cy++)for(let cx=Math.floor(x0/side);cx<=Math.floor(x1/side);cx++){
      for(const item of this._resourceBuckets.get(`${cx},${cy}`)||[]){
        const r=item.r;if(r.x>=x0&&r.x<=x1&&r.y>=y0&&r.y<=y1)found.push(item);
      }
    }
    found.sort((a,b)=>a.order-b.order);
    return found.map(item=>item.r);
  }
  resourceById(id){
    this.ensureResourceIndex();let r=this._resourceById.get(id)||null;
    if(!r&&this.size>=1024&&typeof id==='string'&&id.startsWith(`rp-${this.seed}-`)){
      const parts=id.split('-'),x=Number(parts.at(-2))/100,y=Number(parts.at(-1))/100;
      if(Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&y>=0&&x<this.size&&y<this.size){
        const key=`${Math.floor(x/(this.chunkSize||8))},${Math.floor(y/(this.chunkSize||8))}`;
        if(this.resourceChunksLoaded?.has(key)){this.ensureResourceChunksForBounds(x,y,x,y);this.ensureResourceIndex();r=this._resourceById.get(id)||null;}
      }
    }
    return r;
  }
  tile(x,y){
    if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=this.size||y>=this.size)return null;
    const side=this.chunkSize||8,cx=Math.floor(x/side),cy=Math.floor(y/side);
    const chunk=this.loadChunk?.(cx,cy);
    return chunk ? chunk.tiles[(y-cy*side)*chunk.width+x-cx*side] : this.makeTile(x,y);
  }
  generate(){
    // The seed defines the terrain. Only edited fields and a bounded set of chunks live in memory.
    this.tileChanges=new Map();this.visualChunkVersions=new Map();this.minimapRevision=0;this.chunkCache=new Map();this.chunkClock=0;this.resources=[];
    const world=this;
    this.tiles={
      length:this.size*this.size,
      *[Symbol.iterator](){for(let y=0;y<world.size;y++)for(let x=0;x<world.size;x++)yield world.tile(x,y)},
      filter(fn){const out=[];for(const t of this)if(fn(t))out.push(t);return out},
      map(fn){const out=[];for(const t of this)out.push(fn(t));return out}
    };
  }
  makeTile(x,y){
    const s=this.size,seed=this.seed,elevation=octave(x/20,y/20,seed),moist=octave(x/18,y/18,seed+701);
    let biome='grass';
    const coast=4+Math.sin(y*.20+seed*.001)*2+Math.sin(y*.075)*2;
    const river=s*.56+Math.sin(y*.16+seed*.003)*3+Math.sin(y*.051)*5;
    if(x<coast)biome='sea';else if(x<coast+2)biome='beach';
    else if(Math.abs(x-river)<.58&&y>5&&y<s-4)biome='river';
    else if(elevation>.76)biome='mountain';else if(moist>.72&&elevation<.5)biome='marsh';
    else if(moist>.61)biome='forest';else if(elevation>.6)biome='scrub';else if(moist<.35)biome='plain';
    const base={biome,z:biome==='mountain'?Math.round(3+elevation*3):biome==='scrub'?Math.round(elevation*2):Math.round(elevation*1.4),nearWater:Math.abs(x-river)<4||x<coast+5,road:false};
    return new TerrainTile(this,x,y,base);
  }
  changedRoads(){
    return [...this.tileChanges].filter(([,patch])=>patch.road===true).sort((a,b)=>a[0]-b[0]).map(([index])=>[index%this.size,Math.floor(index/this.size)]);
  }
  terrainChanges(){
    return [...this.tileChanges].sort((a,b)=>a[0]-b[0]).flatMap(([index,patch])=>{
      const {road,...fields}=patch;
      return Object.keys(fields).length?[{x:index%this.size,y:Math.floor(index/this.size),...fields}]:[];
    });
  }
  walkable(x,y,climb=1,from=null,buildings=[]){
    const t=this.tile(x,y);if(!t||!BIOME[t.biome].walk)return false;
    if(from){const f=this.tile(from.x,from.y);if(f&&Math.abs(t.z-f.z)>climb)return false}
    for(const b of buildings){if(!b.alive)continue;if(b.type==='palisade'&&Math.floor(b.x)===x&&Math.floor(b.y)===y)return false}
    return true;
  }
}
class ResourceNode{constructor(type,x,y,amount){this.id=crypto.randomUUID?.()||Math.random().toString(36).slice(2);this.type=type;this.x=x;this.y=y;this.amount=amount;this.max=amount}}
class Building{
  constructor(type,x,y,owner=0,complete=false){this.id=crypto.randomUUID?.()||Math.random().toString(36).slice(2);this.type=type;this.x=x+.5;this.y=y+.5;this.owner=owner;this.progress=complete?1:.08;this.maxHealth=type==='palisade'?180:type==='tower'?260:type==='base'?700:420;this.health=this.maxHealth;this.cooldown=0;if(type==='tower'&&owner===0)this.towerNeedsGuard=true;this.assigned=[];this.residents=[];this.growth=0;this.crop='grain';this.birthDays=0}
  get alive(){return this.health>0}
  get built(){return this.progress>=1}
}
class Unit{
  owner=0;
  mobilized=false;
  location={kind:'world',settlementId:null};
  // The unit is the person record, never a second copy of inventory or skills.
  get occupation(){return this.task?.type||'idle'}
  toJSON(){return {...this,occupation:this.occupation}}
  constructor(name,x,y,rng){this.id=crypto.randomUUID?.()||Math.random().toString(36).slice(2);this.name=name;this.x=x;this.y=y;this.tx=x;this.ty=y;this.path=[];this.speed=1.55;this.health=100;this.maxHealth=100;this.strength=rng.int(7,15);this.intelligence=rng.int(6,18);this.stamina=100;this.morale=70;this.inventory={type:null,amount:0,cap:10+Math.floor(this.strength/2)};this.skills={wood:1,food:1,stone:1,iron:1,farming:1,construction:1,taming:1,combat:1,transport:1,milling:1,carpentry:1,baking:1,herding:1,trading:1,pottery:1,weaving:1,metallurgy:1,pressing:1,healing:1};this.xp={};this.origin='ordinary';this.mentorId=null;this.unfedDays=0;this.nutritionDamage=0;this.personalKnowledge=[];this.task=null;this.state='idle';this.attackCooldown=0;this.workTimer=0;this.selected=false;this.stance='defensive'}
  gain(skill,n=1){if(!Object.hasOwn(this.skills,skill)||!Number.isFinite(n)||n<=0)return false;this.xp[skill]=(this.xp[skill]||0)+n;let leveled=false;while(this.skills[skill]<TERRA_SKILLS.maxLevel&&this.xp[skill]>=this.skills[skill]*TERRA_SKILLS.xpPerLevel){this.xp[skill]-=this.skills[skill]*TERRA_SKILLS.xpPerLevel;this.skills[skill]++;leveled=true}if(this.skills[skill]>=TERRA_SKILLS.maxLevel)this.xp[skill]=Math.min(this.xp[skill],this.skills[skill]*TERRA_SKILLS.xpPerLevel);return leveled}
}
const TERRA_SKILLS={xpPerLevel:20,maxLevel:20,labels:{wood:'Taglio',food:'Raccolta',stone:'Estrazione pietra',iron:'Estrazione ferro',farming:'Agricoltura',construction:'Costruzione',taming:'Domesticazione',combat:'Combattimento',transport:'Trasporto',milling:'Molitoria',carpentry:'Falegnameria',baking:'Panificazione',herding:'Allevamento',trading:'Scambio',pottery:'Ceramica',weaving:'Tessitura',metallurgy:'Metallurgia',pressing:'Spremitura',healing:'Cura'},productionFactor(level){return Math.min(1.3,1+Math.max(0,(level??1)-1)*.025)},transportFactor(level){return Math.min(1.2,1+Math.max(0,(level??1)-1)*(.2/19))},herdingFactor(level){return Math.min(1.25,1+Math.max(0,(level??1)-1)*(.25/19))},tradeFactor(level){return Math.min(1.05,1+Math.max(0,(level??1)-1)*(.05/19))}};
window.TERRA_SKILLS=TERRA_SKILLS;
class Animal{constructor(type,x,y,owner=-1){this.id=crypto.randomUUID?.()||Math.random().toString(36).slice(2);this.type=type;this.x=x;this.y=y;this.owner=owner;this.health=type==='wolf'?70:45;this.maxHealth=this.health;this.vx=0;this.vy=0;this.wander=0;this.attackCooldown=0}}
class Raider{constructor(x,y,level=1){this.id=crypto.randomUUID?.()||Math.random().toString(36).slice(2);this.x=x;this.y=y;this.health=70+level*12;this.maxHealth=this.health;this.speed=1.22+Math.min(.35,level*.03);this.path=[];this.repath=0;this.attackCooldown=0}}

class Game{
  constructor(){
    this.canvas=$('#world');this.ctx=this.canvas.getContext('2d',{alpha:false});this.wrap=$('#worldWrap');this.dpr=1;
    this.experimentalWorldSize=typeof location!=='undefined'&&[88,128,256,512,1024,2048].includes(Number(new URLSearchParams(location.search).get('worldSize')))?Number(new URLSearchParams(location.search).get('worldSize')):WORLD_SIZE;
    this.seed=(Date.now()&0x7fffffff);this.rng=new RNG(this.seed);this.world=null;this.units=[];this.buildings=[];this.animals=[];this.raiders=[];
    this.stock={food:70,wood:55,stone:24,iron:0};this.day=1;this.month=2;this.year=800;this.totalDays=0;this.dayAccumulator=0;this.secondsPerDay=.85;this.timeScale=1;this.paused=false;this.gameEnded=false;
    this.camera={x:0,y:0,zoom:1.05};this.selected=null;this.orderMode=null;this.buildMode=null;this.pointer=new Map();this.dragging=false;this.lastFrame=performance.now();this.uiTick=0;this.autosave=0;this.raidLevel=0;this.nextRaidDay=65;
    this.initUI();this.newGame(this.seed);this.loop=this.loop.bind(this);requestAnimationFrame(this.loop);

  }
  newGame(seed){
    this.seed=seed;this.rng=new RNG(seed);this.world=new World(seed,this.experimentalWorldSize||WORLD_SIZE);this.groupSelection=[];this.orderMode=null;this.buildMode=null;this.pointerCancel();this.syncModeButtons();this.units=[];this.buildings=[];this.animals=[];this.raiders=[];this.stock={food:70,wood:55,stone:24,iron:0};this.day=1;this.month=2;this.year=800;this.totalDays=0;this.dayAccumulator=0;this.raidLevel=0;this.nextRaidDay=65;this.gameEnded=false;$('#gameOver').classList.add('hidden');
    const chosen=this.startLocationChoice;const spawn=Number.isInteger(chosen)?this.findSpawnOptions()[chosen]||this.findSpawn():this.findSpawn();this.buildings.push(new Building('base',spawn.x,spawn.y,0,true));
    for(let i=0;i<5;i++){const u=new Unit(NAMES[i],spawn.x+.2+(i%3)*.48,spawn.y+1.2+Math.floor(i/3)*.5,this.rng);u.origin='ver-sacrum-youth';this.units.push(u);}
    this.spawnAnimals(24);this.camera.x=(spawn.x+.5)*TILE;this.camera.y=(spawn.y+.5)*TILE;this.selected=this.units[0];this.lastSelectedUnit=this.units[0];this.resize();this.updateUI();this.message('La comunità è pronta. Seleziona un abitante e assegna un lavoro.');
  }
  findSpawn(){const s=this.world.size,c=s/2;for(let r=0;r<s/2;r++)for(let a=0;a<24;a++){const x=Math.floor(c+Math.cos(a/24*Math.PI*2)*r),y=Math.floor(c+Math.sin(a/24*Math.PI*2)*r),t=this.world.tile(x,y);if(t&&['grass','scrub','plain'].includes(t.biome)&&!t.nearWater){const hasWood=this.world.resourcesInBounds(x-9,y-9,x+9,y+9).some(n=>n.type==='wood'&&Math.hypot(n.x-x,n.y-y)<9);if(hasWood)return{x,y}}}return{x:Math.floor(c),y:Math.floor(c)}}
  findSpawnOptions(){
    const size=this.world.size,mid=Math.floor(size/2),span=Math.max(14,Math.min(32,Math.floor(size*.18)));
    const targets=[[mid-span,mid-span],[mid+span,mid-span],[mid,mid+span]];
    const choices=[];
    for(const [cx,cy] of targets){
      let picked=null;
      for(let radius=0;radius<=Math.max(18,Math.floor(size*.12))&&!picked;radius+=2){
        for(let angle=0;angle<24;angle++){
          const x=Math.floor(cx+Math.cos(angle*Math.PI/12)*radius),y=Math.floor(cy+Math.sin(angle*Math.PI/12)*radius);
          if(x<8||y<8||x>=size-8||y>=size-8||choices.some(p=>Math.hypot(p.x-x,p.y-y)<12))continue;
          const tile=this.world.tile(x,y);
          if(!tile||!['grass','scrub','plain'].includes(tile.biome)||tile.nearWater)continue;
          const nodes=this.world.resourcesInBounds(x-9,y-9,x+9,y+9).filter(n=>n.amount>0&&Math.hypot(n.x-x,n.y-y)<9);
          if(!nodes.some(n=>n.type==='wood'))continue;
          picked={x,y,biome:BIOME[tile.biome].name,wood:nodes.filter(n=>n.type==='wood').length,food:nodes.filter(n=>n.type==='food').length,stone:nodes.filter(n=>n.type==='stone').length};
          break;
        }
      }
      if(!picked){const fallback=this.findSpawn();picked={...fallback,biome:'Terreno praticabile',wood:1,food:0,stone:0};}
      // Stone can sit beyond the immediate 9-tile camp view on broad maps.
      picked.stone=this.world.resourcesInBounds(picked.x-20,picked.y-20,picked.x+20,picked.y+20)
        .filter(n=>n.type==='stone'&&n.amount>0&&Math.hypot(n.x-picked.x,n.y-picked.y)<20).length;
      choices.push(picked);
    }
    return choices;
  }
  spawnAnimals(count){for(let i=0;i<count;i++){for(let n=0;n<60;n++){const x=this.rng.int(6,this.world.size-4)+.5,y=this.rng.int(3,this.world.size-4)+.5,t=this.world.tile(Math.floor(x),Math.floor(y));if(!t||!BIOME[t.biome].walk)continue;const type=t.biome==='forest'||t.biome==='mountain'?(this.rng.next()<.35?'wolf':'sheep'):'sheep';this.animals.push(new Animal(type,x,y));break}}}
  initUI(){
    addEventListener('resize',()=>this.resize());this.resize();
    $$('.dock-tab').forEach(b=>b.onclick=()=>{this.orderMode=null;this.buildMode=null;$$('.dock-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.dock-panel').forEach(p=>p.classList.remove('active'));$('#'+b.dataset.panel).classList.add('active');this.syncModeButtons()});
    $$('[data-order]').forEach(b=>b.onclick=()=>{const o=b.dataset.order;if(o==='cancel'){const units=this.rtsSelectedUnits?this.rtsSelectedUnits():(this.selected instanceof Unit?[this.selected]:[]);for(const u of units)this.cancelTask(u);this.message(`${units.length} abitanti liberati.`);this.orderMode=null}else{this.orderMode=o;this.buildMode=null;this.message(this.orderHelp(o))}this.syncModeButtons()});
    $$('[data-build]').forEach(b=>b.onclick=()=>{this.buildMode=b.dataset.build;this.orderMode=null;this.message(this.buildMode==='road'?'Tocca il terreno per tracciare un sentiero.':'Tocca il terreno per aprire il cantiere.');this.syncModeButtons()});
    $('#zoomIn').onclick=()=>this.camera.zoom=clamp(this.camera.zoom*1.18,.48,2.3);$('#zoomOut').onclick=()=>this.camera.zoom=clamp(this.camera.zoom/1.18,.48,2.3);$('#pauseBtn').onclick=()=>{this.setPaused(!this.paused)};$('#speedBtn').onclick=()=>this.setTimeScale(this.timeScale===1?2:this.timeScale===2?4:1);
    $('#saveBtn').onclick=()=>{if(this.save(true))this.message('Partita salvata sul dispositivo.')};$('#loadBtn').onclick=()=>this.load();
    $('#newWorldBtn').onclick=()=>{if(confirm('Generare un nuovo territorio? Il salvataggio attuale resta disponibile.'))this.newGame((Math.random()*2147483647)|0)};
    $('#centerBtn').onclick=()=>this.centerOnBase();
    $('#forceBuildBtn').onclick=async()=>{
      try{this.save(false)}catch(_){ }
      this.message('Forzo il caricamento dell’ultima BUILD…');
      try{
        if('caches'in window){
          const keys=await caches.keys();
          await Promise.all(keys.filter(k=>k.startsWith('terra-italica-')).map(k=>caches.delete(k)));
        }
        if('serviceWorker'in navigator){
          const regs=await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r=>r.unregister()));
        }
      }catch(_){ }
      const url=new URL(location.href);
      url.searchParams.set('force',Date.now().toString());
      location.replace(url.toString());
    };
    $('#restartSame').onclick=()=>this.newGame(this.seed);$('#restartNew').onclick=()=>this.newGame((Math.random()*2147483647)|0);
    this.canvas.addEventListener('pointerdown',e=>this.pointerDown(e));this.canvas.addEventListener('pointermove',e=>this.pointerMove(e));this.canvas.addEventListener('pointerup',e=>this.pointerUp(e));this.canvas.addEventListener('pointercancel',()=>this.pointerCancel());this.canvas.addEventListener('lostpointercapture',()=>this.pointerCancel());
    this.installLifecycle();
  }
  resize(){const r=this.wrap.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.floor(r.width*dpr)),h=Math.max(1,Math.floor(r.height*dpr)),changed=this.canvas.width!==w||this.canvas.height!==h||this.dpr!==dpr;this.dpr=dpr;this.viewW=r.width;this.viewH=r.height;this.canvas.style.width=r.width+'px';this.canvas.style.height=r.height+'px';if(changed){this.canvas.width=w;this.canvas.height=h;this.ctx.setTransform(dpr,0,0,dpr,0,0)}}
  pointerCancel(){this.pointer.clear();this.rtsPointers?.clear();this.rtsGesture=null;this.rtsSelectionBox=null;this.dragging=false}
  pointerDown(e){this.canvas.setPointerCapture(e.pointerId);this.pointer.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,lastX:e.clientX,lastY:e.clientY});this.dragging=false}
  pointerMove(e){const p=this.pointer.get(e.pointerId);if(!p)return;p.x=e.clientX;p.y=e.clientY;if(this.pointer.size===2){const pts=[...this.pointer.values()];const a=pts[0],b=pts[1];if(a.prevDist==null){const d=Math.hypot(a.x-b.x,a.y-b.y);a.prevDist=d;b.prevDist=d;return}const d=Math.hypot(a.x-b.x,a.y-b.y),prev=a.prevDist||d;if(Math.abs(d-prev)>2){this.camera.zoom=clamp(this.camera.zoom*(d/prev),.48,2.3);a.prevDist=d;b.prevDist=d}this.dragging=true;return}
    const dx=e.clientX-p.lastX,dy=e.clientY-p.lastY;if(Math.hypot(e.clientX-p.startX,e.clientY-p.startY)>8)this.dragging=true;if(this.dragging){this.camera.x-=dx/this.camera.zoom;this.camera.y-=dy/this.camera.zoom}p.lastX=e.clientX;p.lastY=e.clientY}
  pointerUp(e){const p=this.pointer.get(e.pointerId);if(!p)return;const wasDrag=this.dragging||Math.hypot(e.clientX-p.startX,e.clientY-p.startY)>8;this.pointer.delete(e.pointerId);if(!wasDrag&&this.pointer.size===0){const r=this.canvas.getBoundingClientRect();this.handleTap(e.clientX-r.left,e.clientY-r.top)}this.dragging=false}
  screenToWorld(sx,sy){return{x:(sx-this.viewW/2)/this.camera.zoom+this.camera.x,y:(sy-this.viewH/2)/this.camera.zoom+this.camera.y}}
  worldToScreen(x,y){return{x:(x-this.camera.x)*this.camera.zoom+this.viewW/2,y:(y-this.camera.y)*this.camera.zoom+this.viewH/2}}
  handleTap(sx,sy){const w=this.screenToWorld(sx,sy),tx=Math.floor(w.x/TILE),ty=Math.floor(w.y/TILE),pos={x:w.x/TILE,y:w.y/TILE};if(tx<0||ty<0||tx>=this.world.size||ty>=this.world.size)return;
    if(this.buildMode){this.placeBuild(this.buildMode,tx,ty,this.buildMode==='farm'?this.pendingBuildCrop:null);return}
    if(this.orderMode&&this.selected instanceof Unit){this.applyOrder(this.orderMode,pos,tx,ty);return}
    const entity=this.pickEntity(pos);
    if(entity){this.selected=entity;if(entity instanceof ResourceNode&&this.lastSelectedUnit){this.selected=this.lastSelectedUnit;this.assignGather(this.selected,entity)}else if(entity instanceof Unit)this.lastSelectedUnit=entity;this.updateUI();return}
    if(this.selected instanceof Unit){this.assignMove(this.selected,tx,ty);this.message(`${this.selected.name} si sposta.`)}else{this.selected=null;this.updateUI()}
  }
  pickEntity(p){let best=null,bd=.58;const groups=[this.units.filter(u=>u.location.kind==='world'),this.raiders,this.animals,this.buildings,this.world.resourcesInBounds(p.x-.58,p.y-.58,p.x+.58,p.y+.58)];for(const arr of groups)for(const e of arr){if(e.health!==undefined&&e.health<=0)continue;if(e.cleared||e.amount!==undefined&&e.amount<=0&&!e.renewable)continue;const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<bd){best=e;bd=d}}return best}
  orderHelp(o){return({move:'Tocca il punto di destinazione.',gather:'Tocca un albero, una roccia, bacche o ferro.',farm:'Tocca un campo costruito.',enter:'Tocca un Distretto operativo.',tame:'Tocca una pecora selvatica.',attack:'Tocca un lupo o un razziatore.'})[o]||''}
  applyOrder(o,pos,tx,ty,u=this.selected){if(o==='move')this.assignMove(u,tx,ty);else if(o==='gather'){const r=this.nearestAt(this.world.resourcesInBounds(pos.x-.8,pos.y-.8,pos.x+.8,pos.y+.8),pos,.8);if(r)this.assignGather(u,r);else return this.message('Qui non c’è una risorsa raccoglibile.')}else if(o==='farm'){const b=this.nearestAt(this.buildings,pos,.9,x=>x.type==='farm'&&x.built);if(b)this.assignFarm(u,b);else return this.message('Tocca un campo completato.')}else if(o==='enter'){const b=this.nearestAt(this.buildings,pos,.9,x=>x.type==='house'&&x.built&&x.alive);if(b)this.assignEnter(u,b);else return this.message('Tocca un Distretto operativo.')}else if(o==='tame'){const a=this.nearestAt(this.animals,pos,.9,x=>x.type==='sheep'&&x.owner===-1);if(a)this.assignTame(u,a);else return this.message('Serve una pecora selvatica.')}else if(o==='attack'){const target=this.nearestAt([...this.raiders,...this.animals.filter(a=>a.type==='wolf')],pos,.9);if(target)this.assignAttack(u,target);else return this.message('Nessuna minaccia selezionata.')}this.orderMode=null;this.syncModeButtons();this.updateUI()}
  nearestAt(arr,p,r,filter=()=>true){let best=null,bd=r;for(const e of arr)if(filter(e)){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<bd){best=e;bd=d}}return best}
  syncModeButtons(){$$('[data-order],[data-build]').forEach(b=>b.classList.toggle('active',b.dataset.order===this.orderMode||b.dataset.build===this.buildMode))}
  canPay(cost){return Object.entries(cost).every(([k,v])=>(this.stock[k]||0)>=v)}
  pay(cost){for(const[k,v]of Object.entries(cost))this.stock[k]-=v}
  placeBuild(type,tx,ty,crop=null){const t=this.world.tile(tx,ty);if(!t||!BIOME[t.biome].walk)return this.message('Terreno non edificabile.');if(type==='road'){if(t.road)return; if(!this.pay({wood:1},this.fundingBaseAt(tx,ty)))return this.message('Legno disponibile insufficiente: una parte può essere prenotata.');t.road=true;this.updateUI();return}
    if(this.buildings.some(b=>b.alive&&Math.floor(b.x)===tx&&Math.floor(b.y)===ty))return this.message('Spazio occupato.');const cost=BUILD_COSTS[type];if(!this.canPay(cost,this.fundingBaseAt(tx,ty)))return this.message('Risorse insufficienti da prenotare per il cantiere.');const b=new Building(type,tx,ty);if(type==='farm'&&window.TERRA_CROPS?.[crop])b.crop=crop;b.requiredMaterials={...cost};this.buildings.push(b);this.ensureInventories?.();let builder=this.selected instanceof Unit&&this.selected.location.kind==='world'?this.selected:this.units.find(u=>u.health>0&&u.location.kind==='world'&&!u.mobilized&&u.state==='idle');if(builder)this.assignBuild(builder,b);this.groupSelection=[];for(const u of this.units)u.selected=false;this.selected=b;this.updateUI();this.message(builder?`${builder.name} attende i materiali consegnati al cantiere.`:'Cantiere aperto: consegna i materiali e assegna un abitante.');}
  cancelTask(u){if(u.task?.type==='farm'){const f=this.findById(this.buildings,u.task.target);if(f)f.assigned=f.assigned.filter(id=>id!==u.id)}if(u.task?.type==='production'){const b=this.findById(this.buildings,u.task.target);if(b)b.workers=(b.workers||[]).filter(id=>id!==u.id)}u.task=null;u.state='idle';u.path=[];u.inventory.type=u.inventory.amount?u.inventory.type:null}
  assignMove(u,tx,ty){this.cancelTask(u);u.task={type:'move',x:tx,y:ty};u.path=this.findPath(u.x,u.y,tx,ty,1);u.state='moving'}
  assignGather(u,r){this.cancelTask(u);u.task={type:'gather',target:r.id,phase:'toResource'};u.path=this.findPath(u.x,u.y,Math.floor(r.x),Math.floor(r.y),1);u.state='moving';this.message(`${u.name}: raccolta ${this.resourceName(r.type)}.`)}
  assignFarm(u,b){this.cancelTask(u);u.task={type:'farm',target:b.id,phase:'toFarm'};if(!b.assigned.includes(u.id))b.assigned.push(u.id);u.path=this.pathToBuilding(u,b)||[];u.state='moving';this.message(`${u.name} assegnato al campo.`)}
  assignBuild(u,b){this.cancelTask(u);u.task={type:'build',target:b.id};u.path=this.pathToBuilding(u,b)||[];u.state='moving'}
  assignEnter(u,b){if(!b.alive||!b.built||b.type!=='house')return this.message('Il Distretto non è disponibile.');if(b.residents.length>=5)return this.message('Distretto pieno: nessun posto disponibile.');const door=this.findResidentExit(b);if(!door)return this.message('Il Distretto non ha un ingresso raggiungibile.');this.cancelTask(u);u.task={type:'enter',target:b.id};u.path=this.findPath(u.x,u.y,Math.floor(door.x),Math.floor(door.y),1);if(!u.path.length&&Math.hypot(u.x-door.x,u.y-door.y)>.8)return this.cancelTask(u),this.message('Il Distretto non è raggiungibile.');u.state='moving';if(!u.path.length)this.onUnitArrive(u);else this.message(`${u.name} raggiunge il Distretto.`)}
  enterResident(u,b){if(!b||!b.alive||!b.built||b.type!=='house')return this.cancelTask(u),this.message('Ingresso annullato: Distretto non disponibile.');if(b.residents.length>=5)return this.cancelTask(u),this.message('Ingresso annullato: Distretto pieno.');this.cancelTask(u);u.location={kind:'resident',settlementId:b.id};u.x=b.x;u.y=b.y;b.residents.push(u.id);u.selected=false;this.groupSelection=this.groupSelection.filter(x=>x!==u);if(this.selected===u)this.selected=b;this.message(`${u.name} ora risiede nel Distretto.`)}
  findResidentExit(b){for(let r=1;r<=4;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=Math.floor(b.x)+dx,y=Math.floor(b.y)+dy;if(this.world.walkable(x,y,1,null,this.buildings)&&!this.units.some(u=>u.location.kind==='world'&&u.health>0&&Math.floor(u.x)===x&&Math.floor(u.y)===y))return{x:x+.5,y:y+.5}}return null}
  releaseResident(id,b=this.buildings.find(x=>x.residents?.includes(id)),preferredExit=null){const u=this.findById(this.units,id);if(!u||!b||u.location.kind!=='resident'||u.location.settlementId!==b.id)return false;const spot=preferredExit?(this.spawnPositionFree(preferredExit)?preferredExit:null):this.findResidentExit(b);if(!spot){this.message(`Nessuna uscita libera per ${u.name}.`);return false}b.residents=b.residents.filter(x=>x!==id);u.location={kind:'world',settlementId:null};u.x=spot.x;u.y=spot.y;u.tx=u.x;u.ty=u.y;u.task=null;u.path=[];u.state='idle';this.message(`${u.name} è uscito dal Distretto.`);return true}
  assignTame(u,a){this.cancelTask(u);u.task={type:'tame',target:a.id};u.path=this.findPath(u.x,u.y,Math.floor(a.x),Math.floor(a.y),1);u.state='moving';this.message(`${u.name} prova ad avvicinare la pecora.`)}
  assignAttack(u,t){this.cancelTask(u);u.task={type:'attack',target:t.id};u.state='combat';u.path=[]}
  findById(arr,id){return arr===this.world.resources?this.world.resourceById(id)||undefined:arr.find(x=>x.id===id)}
  nearestStorage(u){let best=null,bd=Infinity;for(const b of this.buildings)if(b.alive&&b.built&&(b.type==='base'||b.type==='warehouse')){const d=(b.x-u.x)**2+(b.y-u.y)**2;if(d<bd){best=b;bd=d}}return best}
  returnToStorage(u,after){const b=this.nearestStorage(u);if(!b){u.state='idle';return}u.task={type:'return',target:b.id,after};u.path=this.pathToBuilding(u,b)||[];u.state='moving'}
  findPath(sx,sy,gx,gy,climb=1,extraBlock=null){
    sx=Math.floor(sx);sy=Math.floor(sy);gx=clamp(gx,0,this.world.size-1);gy=clamp(gy,0,this.world.size-1);
    if(sx===gx&&sy===gy)return [];
    // An impassable destination can never be popped from the search queue.
    if(!this.world.walkable(gx,gy,climb,null,this.buildings)||extraBlock?.(gx,gy)){
      if(this.pathBudget)this.pathBudget.lastExpansions=0;
      return [];
    }
    const open=new PathQueue(),seen=new Map([[key(sx,sy),{g:0,p:null}]]);
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]],limit=this.pathBudget?.maxExpansions||5000;
    let iter=0,order=0;open.push({x:sx,y:sy,g:0,f:0,order:order++});
    while(open.length&&iter<limit){
      iter++;const cur=open.pop();
      if(cur.x===gx&&cur.y===gy){
        if(this.pathBudget)this.pathBudget.lastExpansions=iter;
        const out=[];let k=key(gx,gy),rec=seen.get(k);
        while(rec?.p){const [x,y]=k.split(',').map(Number);out.push({x:x+.5,y:y+.5});k=rec.p;rec=seen.get(k)}
        return out.reverse();
      }
      for(const [dX,dY] of dirs){
        const nx=cur.x+dX,ny=cur.y+dY;if(extraBlock?.(nx,ny))continue;
        if(!this.world.walkable(nx,ny,climb,{x:cur.x,y:cur.y},this.buildings))continue;
        const tile=this.world.tile(nx,ny),step=tile.road?.65:1,ng=cur.g+step+tile.z*.03,nk=key(nx,ny),old=seen.get(nk);
        if(!old||ng<old.g){
          seen.set(nk,{g:ng,p:key(cur.x,cur.y)});
          open.push({x:nx,y:ny,g:ng,f:ng+Math.abs(gx-nx)+Math.abs(gy-ny),order:order++});
        }
      }
    }
    if(this.pathBudget)this.pathBudget.lastExpansions=iter;
    return [];
  }
  update(dt){if(this.paused||this.suspended||this.gameEnded)return;this.dayAccumulator+=dt;while(this.dayAccumulator>=this.secondsPerDay){this.dayAccumulator-=this.secondsPerDay;this.advanceDay()}this.updateLiving(dt);for(const b of this.buildings)this.updateBuilding(b,dt);for(const b of this.buildings.filter(x=>x.type==='house'&&x.health<=0&&x.residents.length)){for(const id of [...b.residents])this.releaseResident(id,b);if(b.residents.length)this.message('Distretto distrutto: alcuni residenti attendono un’uscita libera.')}this.recoverDeadCargo();this.recoverDeadBuildingCargo?.();this.units=this.units.filter(u=>u.health>0);this.animals=this.animals.filter(a=>a.health>0);this.raiders=this.raiders.filter(r=>r.health>0);this.buildings=this.buildings.filter(b=>b.health>0||b.type==='base'||b.residents?.length);this.autosave+=dt/this.timeScale;if(this.autosave>20){this.autosave=0;this.save(false)}if(!this.buildings.some(b=>b.type==='base'&&b.health>0)||this.units.length===0)this.endGame()}
  advanceDay(){this.day++;this.totalDays++;if(this.day>30){this.day=1;this.month++;if(this.month>11){this.month=0;this.year--}}for(const b of this.buildings)this.buildingDay(b);if(this.totalDays>=this.nextRaidDay){this.spawnRaid();this.nextRaidDay=this.totalDays+75+this.rng.int(0,25)}}
  season(){return this.month<=1||this.month===11?'Inverno':this.month<=4?'Primavera':this.month<=7?'Estate':'Autunno'}
  buildingDay(b){if(!b.built||!b.alive)return;if(b.type==='farm'&&b.assigned.length){const tile=this.world.tile(Math.floor(b.x),Math.floor(b.y)),season=this.season(),seasonMod=season==='Primavera'||season==='Autunno'?1.15:season==='Estate'?1:.58,water=tile.nearWater?1.3:1;const workers=b.assigned.map(id=>this.findById(this.units,id)).filter(Boolean);const skill=workers.reduce((s,u)=>s+u.skills.farming,0)/Math.max(1,workers.length);b.growth+=1/42*BIOME[tile.biome].fertility*seasonMod*water*(1+(skill-1)*.08);if(b.growth>=1){b.growth=0;const yieldAmt=Math.max(5,Math.round(15*BIOME[tile.biome].fertility*water*seasonMod));const carrier=workers[0];if(carrier&&carrier.inventory.amount===0){carrier.inventory={type:'food',amount:yieldAmt,cap:carrier.inventory.cap};carrier.gain('farming',5);this.returnToStorage(carrier,{type:'farm',target:b.id});this.message(`Raccolto: ${yieldAmt} cibo. ${carrier.name} lo porta al deposito.`)}}}
    if(b.type==='house'){b.birthDays++;if(b.birthDays>150&&this.units.length<this.populationCap()&&this.stock.food>=28){b.birthDays=0;this.stock.food-=18;const u=new Unit(NAMES[(this.units.length+this.rng.int(0,NAMES.length-1))%NAMES.length],b.x+.3,b.y+.3,this.rng);this.units.push(u);this.message(`${u.name} entra nella comunità.`)}}}
  populationCap(){return 5+this.buildings.filter(b=>b.built&&b.type==='house').length*5}
  updateUnit(u,dt){u.attackCooldown=Math.max(0,u.attackCooldown-dt);u.workTimer=Math.max(0,u.workTimer-dt);if(u.state==='moving'){this.followPath(u,dt,1.6);if(!u.path.length)this.onUnitArrive(u)}else if(u.state==='gathering')this.gatherTick(u,dt);else if(u.state==='building')this.buildTick(u,dt);else if(u.state==='taming')this.tameTick(u,dt);else if(u.state==='combat')this.combatTick(u,dt);else if(u.state==='farming'){const b=this.findById(this.buildings,u.task?.target);if(!b||!b.alive){this.cancelTask(u);return}if(this.buildingDistance(u,b)>1.15){u.path=this.pathToBuilding(u,b)||[];u.state='moving'}}
    if((u.state==='idle'||u.state==='farming')&&u.stance==='defensive'){const threat=this.closestThreat(u,3.2);if(threat){u.task={type:'attack',target:threat.id,returnTask:u.state==='farming'?{...u.task}:null};u.state='combat'}}}
  followPath(e,dt,baseSpeed){if(!e.path.length)return;const next=e.path[0];if(!this.world.walkable(Math.floor(next.x),Math.floor(next.y),1,{x:Math.floor(e.x),y:Math.floor(e.y)},this.buildings)){e.path=[];return;}const target=e.path[0],dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy),tile=this.world.tile(Math.floor(e.x),Math.floor(e.y)),speed=baseSpeed*(tile?.road?1.35:1);if(d<speed*dt+.04){e.x=target.x;e.y=target.y;e.path.shift()}else{e.x+=dx/d*speed*dt;e.y+=dy/d*speed*dt}}
  onUnitArrive(u){const t=u.task;if(!t){u.state='idle';return}if(t.type==='move'){u.state='idle';u.task=null}else if(t.type==='gather'){const r=this.findById(this.world.resources,t.target);if(r&&r.amount>0)u.state='gathering';else this.continueGather(u,r)}else if(t.type==='return'){this.deposit(u,t.after)}else if(t.type==='build'){const b=this.findById(this.buildings,t.target);if(b&&!b.built)u.state='building';else this.cancelTask(u)}else if(t.type==='farm'){u.state='farming'}else if(t.type==='enter'){this.enterResident(u,this.findById(this.buildings,t.target))}else if(t.type==='tame'){u.state='taming';u.workTimer=4.5}}
  gatherTick(u,dt){const r=this.findById(this.world.resources,u.task?.target);if(!r||r.amount<=0){if(u.inventory.amount)this.returnToStorage(u,null);else this.cancelTask(u);return}if(Math.hypot(u.x-r.x,u.y-r.y)>1){u.path=this.findPath(u.x,u.y,Math.floor(r.x),Math.floor(r.y),1);u.state='moving';return}u.workTimer-=dt;if(u.workTimer<=0){u.workTimer=Math.max(.45,1.15-u.skills[r.type]*.06);r.amount--;if(!u.inventory.type)u.inventory.type=r.type;u.inventory.amount++;u.gain(r.type,1);if(u.inventory.amount>=u.inventory.cap||r.amount<=0)this.returnToStorage(u,r.amount>0?{type:'gather',target:r.id}:null)}}
  deposit(u,after){if(u.inventory.amount){this.stock[u.inventory.type]=(this.stock[u.inventory.type]||0)+u.inventory.amount;u.inventory.amount=0;u.inventory.type=null}if(after?.type==='gather'){const r=this.findById(this.world.resources,after.target);if(r&&r.amount>0)return this.assignGather(u,r)}if(after?.type==='farm'){const b=this.findById(this.buildings,after.target);if(b&&b.alive)return this.assignFarm(u,b)}this.cancelTask(u)}
  buildTick(u,dt){const b=this.findById(this.buildings,u.task?.target);if(!b||!b.alive){this.cancelTask(u);return}if(this.buildingDistance(u,b)>1.15){const path=this.pathToBuilding(u,b,true);if(path===null){this.cancelTask(u);return;}u.path=path;u.state='moving';return}if(!b.materialsConsumed&&!this.consumeSiteMaterials?.(b))return;b.progress+=dt*(.06+u.skills.construction*.012);u.gain('construction',dt*.4);if(b.progress>=1){b.progress=1;b.requiredMaterials=null;b.materialsConsumed=true;this.message(`${BUILD_LABEL[b.type]} completato.`);this.cancelTask(u)}}
  tameTick(u,dt){const a=this.findById(this.animals,u.task?.target);if(!a||a.owner!==-1||a.type!=='sheep'){this.cancelTask(u);return}if(Math.hypot(u.x-a.x,u.y-a.y)>1.1){u.path=this.findPath(u.x,u.y,Math.floor(a.x),Math.floor(a.y),1);u.state='moving';return}u.workTimer-=dt;if(u.workTimer<=0){a.owner=0;u.gain('taming',8);this.message(`${u.name} ha domesticato una pecora.`);this.cancelTask(u)}}
  combatTick(u,dt){const target=this.findById([...this.raiders,...this.animals],u.task?.target);if(!target||target.health<=0){const rt=u.task?.returnTask;this.cancelTask(u);if(rt?.type==='farm'){const f=this.findById(this.buildings,rt.target);if(f)this.assignFarm(u,f)}return}const d=dist(u,target);if(d>1.15){if(!u.path.length||d>2){u.path=this.findPath(u.x,u.y,Math.floor(target.x),Math.floor(target.y),1)}this.followPath(u,dt,1.7)}else if(u.attackCooldown<=0){u.attackCooldown=.85;target.health-=this.personAttackDamage(u,7+u.skills.combat*2+u.strength*.15);u.gain('combat',1)}}
  closestThreat(p,r){let best=null,bd=r;for(const e of [...this.raiders,...this.animals.filter(a=>a.type==='wolf'&&a.owner<0)])if(e.health>0){const d=dist(p,e);if(d<bd){best=e;bd=d}}return best}
  updateAnimal(a,dt){a.attackCooldown=Math.max(0,a.attackCooldown-dt);a.wander-=dt;if(a.type==='wolf'&&a.owner<0){const prey=this.units.filter(u=>u.health>0&&u.location.kind==='world').sort((x,y)=>dist(a,x)-dist(a,y))[0];if(prey&&dist(a,prey)<4){const d=dist(a,prey);if(d>1){const dx=prey.x-a.x,dy=prey.y-a.y;a.x+=dx/d*dt*1.05;a.y+=dy/d*dt*1.05}else if(a.attackCooldown<=0){a.attackCooldown=1.15;prey.health-=this.personCombatDamage(prey,8)}return}}
    if(a.wander<=0){a.wander=2+this.rng.next()*4;const ang=this.rng.next()*Math.PI*2;a.vx=Math.cos(ang)*.28;a.vy=Math.sin(ang)*.28}const nx=a.x+a.vx*dt,ny=a.y+a.vy*dt;if(this.world.walkable(Math.floor(nx),Math.floor(ny),a.type==='wolf'?2:1,null,this.buildings)){a.x=nx;a.y=ny}else{a.vx*=-1;a.vy*=-1}}
  towerSentry(b){return this.units.find(u=>u.guardDuty&&u.guardPostId===b.id&&u.mobilized&&u.health>35&&(u.morale??70)>=25&&u.location?.kind==='world'&&dist(u,b)<=2);}
  towerDefends(b){return b.type==='tower'&&b.owner===0&&b.alive&&b.built&&(b.towerNeedsGuard===true&&b.inventory?.items.stone>0&&!!this.towerSentry(b));}
  updateBuilding(b,dt){if(!b.built||!b.alive)return;b.cooldown=Math.max(0,b.cooldown-dt);if(b.type==='tower'&&b.cooldown<=0){const sentry=this.towerSentry(b);if(b.towerNeedsGuard&&(!sentry||!(b.inventory?.items.stone>0)))return;let target=null,bd=6.3;for(const e of this.raiders){const d=dist(b,e);if(e.health>0&&d<bd){target=e;bd=d}}if(target){b.cooldown=.75;if(b.towerNeedsGuard)b.inventory.items.stone--;target.health-=sentry?8+Math.min(12,(sentry.skills.combat||1)*1.5):13;sentry?.gain('combat',1)}}}
  spawnRaid(){this.raidLevel++;const count=2+Math.floor(this.raidLevel*1.5);for(let i=0;i<count;i++){let x=this.world.size-2,y=this.rng.int(5,this.world.size-5);if(!this.world.tile(x,y)||!BIOME[this.world.tile(x,y).biome].walk){x=this.world.size-8}this.raiders.push(new Raider(x+.5,y+.5,this.raidLevel))}this.message(`Incursione: ${count} razziatori entrano nel territorio.`)}
  updateRaider(r,dt){r.attackCooldown=Math.max(0,r.attackCooldown-dt);r.repath-=dt;let target=null,nearest=Infinity;for(const u of this.units){if(u.health<=0||u.location.kind!=='world')continue;const d=dist(r,u);if(d<nearest){nearest=d;target=u}}const base=this.buildings.find(b=>b.type==='base'&&b.alive);if(!target||(base&&dist(r,base)<dist(r,target)*.85))target=base;const tower=this.buildings.filter(b=>b.type==='tower'&&dist(r,b)<5&&this.towerDefends(b)).sort((a,b)=>dist(r,a)-dist(r,b))[0];if(tower&&(!target||dist(r,tower)<dist(r,target)+1))target=tower;if(!target)return;const d=target.type==='tower'?this.buildingDistance(r,target):dist(r,target);if(d<(target.type==='tower'?1.15:1.05)){if(r.attackCooldown<=0){r.attackCooldown=.9;target.health-=target instanceof Unit?this.personCombatDamage(target,11):17}return}if(r.repath<=0&&(!r.path.length||d<=8)){r.path=target instanceof Building?(this.pathToBuilding(r,target)||[]):this.findPath(r.x,r.y,Math.floor(target.x),Math.floor(target.y),1);r.repath=r.path.length?(d>8?8:1.8):12;if(!r.path.length){const wall=this.buildings.filter(b=>b.type==='palisade'&&b.alive).sort((a,b)=>dist(r,a)-dist(r,b))[0];if(wall&&dist(r,wall)<5){if(dist(r,wall)<1.15&&r.attackCooldown<=0){r.attackCooldown=.9;wall.health-=18}else{const dx=wall.x-r.x,dy=wall.y-r.y,dd=Math.hypot(dx,dy)||1;r.x+=dx/dd*r.speed*dt;r.y+=dy/dd*r.speed*dt}}return}}this.followPath(r,dt,r.speed)}
  resourceName(t){return({wood:'legna',food:'cibo',stone:'pietra',iron:'ferro',copper:'rame',tin:'stagno',bronze:'bronzo',clay:'argilla',pottery:'ceramica',wool:'lana',cloth:'tessuto'})[t]||t}
  endGame(){if(this.gameEnded)return;this.gameEnded=true;$('#gameOver').classList.remove('hidden');this.save(false)}
  centerOnBase(){const b=this.buildings.find(x=>x.type==='base');if(b){this.camera.x=b.x*TILE;this.camera.y=b.y*TILE;this.camera.zoom=1.05}}
  save(show=false){try{const data={seed:this.seed,stock:this.stock,clock:{day:this.day,month:this.month,year:this.year,totalDays:this.totalDays,nextRaidDay:this.nextRaidDay,raidLevel:this.raidLevel},roads:this.world.changedRoads(),resources:this.world.resources.map(r=>({id:r.id,type:r.type,x:r.x,y:r.y,amount:r.amount,max:r.max})),buildings:this.buildings,units:this.units,animals:this.animals,camera:this.camera};localStorage.setItem(SAVE_KEY,JSON.stringify(data));return true}catch(e){if(show)this.message('Impossibile salvare.');return false}}
  load(){try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return this.message('Nessun salvataggio presente.'),false;const d=JSON.parse(raw);this.seed=d.seed;this.rng=new RNG(this.seed);this.world=new World(this.seed);for(const[x,y]of d.roads||[]){const t=this.world.tile(x,y);if(t)t.road=true}this.world.resources=(d.resources||[]).map(o=>Object.assign(new ResourceNode(o.type,o.x,o.y,o.amount),o));this.buildings=(d.buildings||[]).map(o=>Object.assign(new Building(o.type,Math.floor(o.x),Math.floor(o.y),o.owner,o.progress>=1),o));this.units=(d.units||[]).map(o=>Object.assign(new Unit(o.name,o.x,o.y,this.rng),o));this.animals=(d.animals||[]).map(o=>Object.assign(new Animal(o.type,o.x,o.y,o.owner),o));this.raiders=[];this.stock=d.stock||this.stock;Object.assign(this,d.clock||{});this.camera=d.camera||this.camera;this.groupSelection=[];this.orderMode=null;this.buildMode=null;this.pointerCancel();this.syncModeButtons();for(const u of this.units)u.selected=false;this.selected=this.units[0]||null;this.lastSelectedUnit=this.selected;this.gameEnded=false;$('#gameOver').classList.add('hidden');this.updateUI();return true}catch(e){console.error(e);this.message('Salvataggio non compatibile.');return false}}
  message(text){const el=$('#message');el.textContent=text;el.classList.add('show');clearTimeout(this.msgTimer);this.msgTimer=setTimeout(()=>el.classList.remove('show'),2600)}
  updateUI(){
    $('#foodVal').textContent=Math.floor(this.stock.food);$('#woodVal').textContent=Math.floor(this.stock.wood);$('#stoneVal').textContent=Math.floor(this.stock.stone);$('#ironVal').textContent=Math.floor(this.stock.iron);
    const months=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];$('#dateLabel').textContent=`${this.day} ${months[this.month]} · ${this.year} a.C. · ${this.season()}`;
    const people=$('#people'),peopleHTML=this.units.filter(u=>u.owner===0).map(u=>`<button class="person-card ${this.selected?.id===u.id?'active':''}" data-person="${u.id}" type="button"><div class="mini"><i class="mark"></i><b>${u.name}</b></div><span>${u.location.kind==='resident'?'residente':this.unitStatus(u)} · HP ${Math.ceil(u.health)} · inv ${u.inventory.amount}/${u.inventory.cap}</span></button>`).join('');
    if(peopleHTML!==this._peopleHTML){
      this._peopleHTML=peopleHTML;people.innerHTML=peopleHTML;
      people.querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>{const u=this.findById(this.units,b.dataset.person);if(u?.owner===0){this.groupSelection=u.location.kind==='world'?[u]:[];for(const person of this.units)person.selected=person===u&&u.location.kind==='world';this.selected=u;this.lastSelectedUnit=u.location.kind==='world'?u:this.lastSelectedUnit;this.orderMode=null;this.syncModeButtons();this.updateUI()}});
    }
    const card=$('#selectionCard');if(!this.selected){card.classList.add('hidden')}else{card.classList.remove('hidden');const html=this.selectionHTML(this.selected);if(card.innerHTML!==html){card.innerHTML=html;card.querySelectorAll?.('[data-release]').forEach(button=>button.onclick=()=>{this.releaseResident(button.dataset.release,this.selected);this.updateUI()})}}
  }
  personOriginLabel(u){return u.origin==='ver-sacrum-youth'?'Partito giovane nel Ver Sacrum':'Abitante'}
  unitStatus(u){return({idle:'libero',moving:'in cammino',gathering:'raccolta',building:'costruzione',farming:'campo',taming:'domesticazione',combat:'combattimento'})[u.state]||u.state}
  selectionHTML(e){if(e instanceof Unit)return`<h3>${e.name}</h3><p>${e.location.kind==='resident'?'residente':this.unitStatus(e)} · forza ${e.strength} · intelligenza ${e.intelligence}<br>abilità: agricoltura ${e.skills.farming}, costruzione ${e.skills.construction}, combattimento ${e.skills.combat}</p><div class="bar"><i style="width:${e.health/e.maxHealth*100}%"></i></div>`;if(e instanceof ResourceNode)return`<h3>${this.resourceName(e.type)}</h3><p>Risorsa naturale · ${Math.max(0,e.amount)} unità residue.</p>`;if(e instanceof Building)return`<h3>${BUILD_LABEL[e.type]}</h3><p>${e.built?'operativo':`cantiere ${Math.round(e.progress*100)}%`}${e.type==='farm'?` · crescita ${Math.round(e.growth*100)}% · lavoratori ${e.assigned.length}`:e.type==='house'?` · residenti ${e.residents.length}/5`:''}</p>${e.type==='house'&&e.owner===0?e.residents.map(id=>{const u=this.findById(this.units,id);return u?`<button type="button" data-release="${u.id}">Fai uscire ${u.name}</button>`:''}).join(''):''}<div class="bar"><i style="width:${Math.max(0,e.health/e.maxHealth*100)}%"></i></div>`;if(e instanceof Animal)return`<h3>${e.type==='wolf'?'Lupo':'Pecora'}${e.owner===0?' domestica':''}</h3><p>${e.owner===0?'appartiene alla comunità':'fauna selvatica'} · salute ${Math.ceil(e.health)}</p>`;if(e instanceof Raider)return`<h3>Razziatore</h3><p>Minaccia ostile · salute ${Math.ceil(e.health)}</p><div class="bar"><i style="width:${e.health/e.maxHealth*100}%;background:#a94c43"></i></div>`;return''}
  draw(){const ctx=this.ctx,w=this.viewW,h=this.viewH,zoom=this.camera.zoom,ts=TILE*zoom;ctx.save();ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.fillStyle='#30392b';ctx.fillRect(0,0,w,h);const min=this.screenToWorld(0,0),max=this.screenToWorld(w,h),x0=clamp(Math.floor(min.x/TILE)-1,0,this.world.size-1),x1=clamp(Math.ceil(max.x/TILE)+1,0,this.world.size-1),y0=clamp(Math.floor(min.y/TILE)-1,0,this.world.size-1),y1=clamp(Math.ceil(max.y/TILE)+1,0,this.world.size-1);
    // The authoritative tile grid remains resident. The bounded chunk cache can
    // evict visible chunks at low zoom, so it must never determine draw coverage.
    if(this.drawTerrainCached)this.drawTerrainCached(x0,y0,x1,y1,ts);else for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)this.drawTile(x,y,ts);
    if(this.drawResourcesCached)this.drawResourcesCached(x0-1,y0-1,x1+1,y1+1);
    else for(const r of this.world.resourcesInBounds(x0-1,y0-1,x1+1,y1+1))if(r.amount>0||r.type==='wood'||r.type==='food')this.drawResource(r);
    const visible=e=>e.x>=x0-2&&e.x<=x1+2&&e.y>=y0-2&&e.y<=y1+2;
    for(const b of this.buildings)if(b.alive&&(visible(b)||b.type==='house'&&b.x+2>=x0&&b.x-2<=x1&&b.y+2>=y0&&b.y-2<=y1))this.drawBuilding(b);
    for(const a of this.animals)if(a.health>0&&visible(a))this.drawAnimal(a);
    for(const u of this.units)if(u.health>0&&u.location.kind==='world'&&visible(u))this.drawHuman(u,false);
    for(const r of this.raiders)if(r.health>0&&visible(r))this.drawHuman(r,true);
    ctx.restore()}
  drawTile(x,y,ts){const t=this.world.tile(x,y),p=this.worldToScreen(x*TILE,y*TILE),ctx=this.ctx,base=BIOME[t.biome].color;ctx.fillStyle=base;ctx.fillRect(p.x,p.y,ts+.5,ts+.5);const n=hash(x,y,this.seed+555);ctx.fillStyle=n>.5?'#ffffff08':'#00000008';ctx.fillRect(p.x,p.y,ts,ts);if(t.z>1&&t.biome!=='mountain'){ctx.fillStyle='#ffffff0b';ctx.fillRect(p.x,p.y,ts,Math.max(1,t.z*this.camera.zoom))}if(t.road){ctx.strokeStyle='#aa9368aa';ctx.lineWidth=Math.max(2,5*this.camera.zoom);ctx.beginPath();ctx.moveTo(p.x+ts*.08,p.y+ts*.52);ctx.lineTo(p.x+ts*.92,p.y+ts*.48);ctx.stroke()}if(this.camera.zoom>1.4){ctx.strokeStyle='#00000012';ctx.lineWidth=1;ctx.strokeRect(p.x,p.y,ts,ts)}}
  drawResource(r){const p=this.worldToScreen(r.x*TILE,r.y*TILE),z=this.camera.zoom,ctx=this.ctx;if(r.type==='clay'){ctx.fillStyle='#6c4639';ctx.fillRect(p.x-8*z,p.y-3*z,16*z,9*z);ctx.fillStyle='#ae7854';ctx.fillRect(p.x-6*z,p.y-6*z,12*z,6*z);ctx.fillStyle='#d39a6c';ctx.fillRect(p.x-4*z,p.y-5*z,4*z,2*z);return}if(r.type==='wood'){ctx.fillStyle='#5b4129';ctx.fillRect(p.x-2*z,p.y+3*z,4*z,8*z);ctx.fillStyle='#314831';ctx.beginPath();ctx.arc(p.x,p.y,9*z,0,Math.PI*2);ctx.fill();ctx.fillStyle='#52654a';ctx.beginPath();ctx.arc(p.x-3*z,p.y-4*z,5*z,0,Math.PI*2);ctx.fill()}else if(r.type==='stone'||r.type==='iron'||r.type==='copper'||r.type==='tin'){ctx.fillStyle=r.type==='tin'?'#a2a9a7':r.type==='copper'?'#a67952':r.type==='iron'?'#5e5552':'#77766e';ctx.beginPath();ctx.moveTo(p.x-8*z,p.y+6*z);ctx.lineTo(p.x-5*z,p.y-6*z);ctx.lineTo(p.x+4*z,p.y-8*z);ctx.lineTo(p.x+9*z,p.y+5*z);ctx.closePath();ctx.fill();if(r.type==='iron'||r.type==='copper'||r.type==='tin'){ctx.strokeStyle=r.type==='tin'?'#d1d6ca':r.type==='copper'?'#6c9d78':'#a0826f';ctx.stroke()}}else{ctx.fillStyle='#5d6a42';ctx.beginPath();ctx.arc(p.x,p.y,7*z,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8f6e4c';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(p.x+(i-1)*4*z,p.y-2*z,1.7*z,0,Math.PI*2);ctx.fill()}}}
  drawBuilding(b){const p=this.worldToScreen(b.x*TILE,b.y*TILE),z=this.camera.zoom,ctx=this.ctx,alpha=b.built?1:.45+.45*b.progress;ctx.save();ctx.globalAlpha*=alpha;if(b.type==='base'||b.type==='house'){ctx.fillStyle=b.type==='base'?'#685943':'#76634b';ctx.fillRect(p.x-11*z,p.y-7*z,22*z,15*z);ctx.fillStyle='#352f28';ctx.beginPath();ctx.moveTo(p.x-14*z,p.y-7*z);ctx.lineTo(p.x,p.y-18*z);ctx.lineTo(p.x+14*z,p.y-7*z);ctx.closePath();ctx.fill()}else if(b.type==='warehouse'){ctx.fillStyle='#655641';ctx.fillRect(p.x-12*z,p.y-8*z,24*z,17*z);ctx.strokeStyle='#a58b5c';ctx.strokeRect(p.x-12*z,p.y-8*z,24*z,17*z);ctx.beginPath();ctx.moveTo(p.x,p.y-8*z);ctx.lineTo(p.x,p.y+9*z);ctx.stroke()}else if(b.type==='farm'){ctx.fillStyle='#7d6941';ctx.fillRect(p.x-13*z,p.y-13*z,26*z,26*z);ctx.strokeStyle='#ad9360';ctx.lineWidth=Math.max(1,z);for(let i=-9;i<=9;i+=6){ctx.beginPath();ctx.moveTo(p.x-12*z,p.y+i*z);ctx.lineTo(p.x+12*z,p.y+i*z);ctx.stroke()}ctx.fillStyle='#7f8b51';ctx.fillRect(p.x-12*z,p.y+10*z,24*z*b.growth,2*z)}else if(b.type==='palisade'){ctx.strokeStyle='#72583a';ctx.lineWidth=6*z;ctx.beginPath();ctx.moveTo(p.x-11*z,p.y+8*z);ctx.lineTo(p.x+11*z,p.y-8*z);ctx.stroke()}else if(b.type==='tower'){ctx.fillStyle='#5d5548';ctx.fillRect(p.x-7*z,p.y-14*z,14*z,22*z);ctx.fillStyle='#34312b';ctx.fillRect(p.x-10*z,p.y-17*z,20*z,5*z)}if(!b.built){ctx.fillStyle='#d0b36a';ctx.fillRect(p.x-12*z,p.y+15*z,24*z*b.progress,2*z)}ctx.restore();if(this.selected?.id===b.id)this.selectionRing(p.x,p.y,16*z)}
  drawHuman(u,hostile){const p=this.worldToScreen(u.x*TILE,u.y*TILE),z=this.camera.zoom*.8,ctx=this.ctx;ctx.fillStyle='#00000055';ctx.beginPath();ctx.ellipse(p.x,p.y+7*z,6*z,2.5*z,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=hostile?'#7d4038':'#8b7651';ctx.fillRect(p.x-4*z,p.y-5*z,8*z,12*z);ctx.fillStyle=hostile?'#8a6c5c':'#b78d6a';ctx.beginPath();ctx.arc(p.x,p.y-8*z,4*z,0,Math.PI*2);ctx.fill();if(!hostile&&(u.selected||this.selected?.id===u.id))this.selectionRing(p.x,p.y,11*z);if((u.health/u.maxHealth)<.65){ctx.fillStyle='#171717';ctx.fillRect(p.x-8*z,p.y-16*z,16*z,2*z);ctx.fillStyle=hostile?'#a94c43':'#70835d';ctx.fillRect(p.x-8*z,p.y-16*z,16*z*(u.health/u.maxHealth),2*z)}}
  drawAnimal(a){const p=this.worldToScreen(a.x*TILE,a.y*TILE),z=this.camera.zoom*.8,ctx=this.ctx;ctx.fillStyle=a.type==='wolf'?'#4c4c49':a.owner===0?'#d8cfb0':'#c2bfae';ctx.beginPath();ctx.ellipse(p.x,p.y,8*z,5*z,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(p.x+7*z,p.y-3*z,3.5*z,0,Math.PI*2);ctx.fill();if(this.selected?.id===a.id)this.selectionRing(p.x,p.y,11*z)}
  selectionRing(x,y,r){const ctx=this.ctx;ctx.strokeStyle='#d1b66d';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke()}
  setTimeScale(scale){if(![1,2,4].includes(scale))return false;this.timeScale=scale;const button=$('#speedBtn');button.textContent=`Velocità: ${scale}×`;button.setAttribute('aria-label',`Velocità della partita: ${scale} volte. Tocca per cambiare`);return true}
  loop(now){const dt=Math.min(.05,(now-this.lastFrame)/1000||0);this.lastFrame=now;this.update(dt*this.timeScale);this.draw();if(typeof window!=='undefined')window.__verSacrumFramePainted=performance.now();if(typeof document!=='undefined')document.getElementById('bootLoading')?.remove?.();this.uiTick+=dt;if(this.uiTick>.22){this.uiTick=0;this.updateUI()}requestAnimationFrame(this.loop)}
}

// Boot runs after simulation extensions are installed.

