// Local inventories and persistent carrier jobs; reservations are derived from jobs.
(() => {
  'use strict';
  const CAPACITY={sawmill:120,base:800,warehouse:400,farm:240,mill:80,bakery:80,kiln:80,foundry:80,loom:80,press:80,pen:120,market:240,house:40,tower:20,palisade:10};
  const REPAIR_COST_PER_HP=.04;
  const CRAFT_SKILL={mill:'milling',sawmill:'carpentry',bakery:'baking',kiln:'pottery',foundry:'metallurgy',loom:'weaving',press:'pressing'};
  const craftFactor=(workers,key)=>TERRA_SKILLS.productionFactor(workers.reduce((sum,u)=>sum+(u.skills[key]??1),0)/workers.length);
  const GOODS={
    planks:{label:'tavole',volume:1},food:{label:'cibo',volume:1},wood:{label:'legno',volume:1},stone:{label:'pietra',volume:1},iron:{label:'ferro',volume:1},copper:{label:'rame',volume:1},tin:{label:'stagno',volume:1},clay:{label:'argilla',volume:1},pottery:{label:'ceramica',volume:1},bronze:{label:'bronzo',volume:1},
    grain:{label:'grano',volume:1},barley:{label:'orzo',volume:1},grapes:{label:'uva',volume:1},olives:{label:'olive',volume:1},wine:{label:'vino',volume:1},oil:{label:'olio',volume:1},
    flour:{label:'farina',volume:1},barleyFlour:{label:'farina d’orzo',volume:1},bread:{label:'pane',volume:1},barleyBread:{label:'pane d’orzo',volume:1},
    forage:{label:'foraggio',volume:1},milk:{label:'latte',volume:1},wool:{label:'lana',volume:1},cloth:{label:'tessuto',volume:1}
  };
  const RECIPES={
    sawmill:[{id:'wood-planks',inputs:{wood:10},outputs:{planks:8},seconds:10}],
    mill:[{id:'grain-flour',inputs:{grain:2},outputs:{flour:2},seconds:6},{id:'barley-flour',inputs:{barley:2},outputs:{barleyFlour:3},seconds:6}],
    bakery:[{id:'wheat-bread',inputs:{flour:2},outputs:{bread:2},seconds:8},{id:'barley-bread',inputs:{barleyFlour:2},outputs:{barleyBread:3},seconds:8}],
    kiln:[{id:'clay-pottery',inputs:{clay:4,wood:2},outputs:{pottery:2},seconds:12}],
    foundry:[{id:'copper-tin-bronze',inputs:{copper:4,tin:1,wood:2},outputs:{bronze:4},seconds:16}],
    loom:[{id:'wool-cloth',inputs:{wool:4},outputs:{cloth:2},seconds:10}],
    press:[{id:'grapes-wine',inputs:{grapes:4},outputs:{wine:2},seconds:12},{id:'olives-oil',inputs:{olives:4},outputs:{oil:2},seconds:12}]
  };
  const CROPS={
    grain:{label:'Grano',side:2,maxWorkers:2,days:10,yield:20,seasons:{Inverno:.35,Primavera:1.15,Estate:.85,Autunno:1}},
    barley:{label:'Orzo',side:1,maxWorkers:2,days:10,yield:20,seasons:{Inverno:.45,Primavera:1.1,Estate:.95,Autunno:1}},
    grapes:{label:'Vite',side:2,maxWorkers:8,days:30,yield:80,seasons:{Inverno:.15,Primavera:.85,Estate:1.2,Autunno:1.05}},
    olives:{label:'Olivo',side:3,maxWorkers:8,days:40,yield:100,seasons:{Inverno:.4,Primavera:.8,Estate:1.05,Autunno:1.2}}
  };
  window.TERRA_CAPACITY=CAPACITY;window.TERRA_GOODS=GOODS;window.TERRA_RECIPES=RECIPES;window.TERRA_CROPS=CROPS;
  const total=items=>Object.entries(items).reduce((sum,[good,n])=>sum+n*(GOODS[good]?.volume||1),0);
  const storage=b=>b&&b.alive&&b.built&&b.type==='warehouse';
  Game.prototype.ensureInventories=function(){
    for(const b of this.buildings){if(!b.inventory)b.inventory={items:b.type==='base'?{...this.stock}:{},capacity:CAPACITY[b.type]||80};if(b.type==='farm'){b.crop=Object.hasOwn(CROPS,b.crop)?b.crop:'grain';if(b.inventory.capacity===80)b.inventory.capacity=CAPACITY.farm;}if(b.requiredMaterials===undefined)b.requiredMaterials=b.built?null:{...(BUILD_COSTS[b.type]||{})};if(!b.built&&b.requiredMaterials)b.inventory.capacity=Math.max(b.inventory.capacity,Object.values(b.requiredMaterials).reduce((n,v)=>n+v,0));if(b.batch===undefined)b.batch=null;if(b.batch&&!b.batch.outputs){b.batch.inputs={[b.batch.input]:b.batch.amount};b.batch.outputs={[b.batch.output]:b.batch.amount};b.batch.outputVolume=total(b.batch.outputs);b.batch.recipeId=`legacy-${b.type}`;}if(!Array.isArray(b.workers))b.workers=[];}
    const base=this.buildings.find(b=>b.type==='base');if(base)this.stock=base.inventory.items;
    for(const k of Object.keys(GOODS))if(this.stock[k]===undefined)this.stock[k]=0;
  };
  Game.prototype.factoryWorkers=function(b){
    if(!b)return[];b.workers=(b.workers||[]).filter(id=>this.units.some(u=>u.id===id&&u.health>0&&u.task?.type==='production'&&u.task.target===b.id));
    return b.workers.map(id=>this.findById(this.units,id)).filter(Boolean);
  };
  Game.prototype.assignProduction=function(u,b){
    this.ensureInventories();const recipes=RECIPES[b?.type];
    if(!u||u.health<=0||u.location?.kind!=='world'||!b?.alive||!b.built||!recipes)return 'Scegli un abitante libero e una fabbrica operativa.';
    if(u.inventory.amount)return 'Deposita prima il carico dell’abitante.';
    const path=this.pathToBuilding(u,b);if(path===null)return 'Fabbrica non raggiungibile.';
    this.cancelTask(u);u.task={type:'production',target:b.id,profession:b.type==='mill'?'mugnaio':b.type==='sawmill'?'falegname':b.type==='kiln'?'ceramista':b.type==='foundry'?'fonditore':b.type==='loom'?'tessitore':b.type==='press'?'torchiatore':'fornaio'};u.state='producing';u.path=path;
    if(!b.workers.includes(u.id))b.workers.push(u.id);this.message(`${u.name} ora lavora come ${u.task.profession}.`);return null;
  };
  Game.prototype.updateProduction=function(u,dt){
    const b=this.findById(this.buildings,u.task?.target);if(!b?.alive||!b.built||!RECIPES[b.type]){this.cancelTask(u);return;}
    if(this.buildingDistance(u,b)>1.15){if(!u.path.length){const path=this.pathToBuilding(u,b);if(path===null){this.cancelTask(u);return;}u.path=path;}this.followPath(u,dt,1.55);}
  };
  const newGame=Game.prototype.newGame;
  Game.prototype.newGame=function(seed){newGame.call(this,seed);this.ensureInventories();};
  Game.prototype.reserved=function(buildingId,good,kind,except=null){
    return this.units.reduce((sum,u)=>{const t=u.task;if(u===except||u.health<=0||t?.type!=='haul'||!t.amount)return sum;
      if(kind==='out')return sum+(t.phase==='source'&&t.source===buildingId&&t.good===good?t.amount:0);
      return sum+(t.destination===buildingId&&['source','destination'].includes(t.phase)?t.amount:0);
    },0);
  };
  Game.prototype.freeSpace=function(b,except=null){return Math.max(0,b.inventory.capacity-total(b.inventory.items)-(b.batch?.outputVolume??b.batch?.amount??0)-this.reserved(b.id,null,'in',except));};
  Game.prototype.available=function(b,good,except=null){return Math.max(0,(b.inventory.items[good]||0)-this.reserved(b.id,good,'out',except));};
  Game.prototype.canPay=function(cost){this.ensureInventories();const base=this.buildings.find(b=>b.type==='base'&&b.alive);return !!base&&Object.entries(cost).every(([k,v])=>this.available(base,k)>=v);};
  Game.prototype.pay=function(cost){if(!this.canPay(cost))return false;for(const [k,v]of Object.entries(cost))this.stock[k]-=v;return true;};
  Game.prototype.pathToBuilding=function(u,b){
    if(!b?.alive)return null;
    if(this.buildingDistance(u,b)<=1.15)return [];
    const x=Math.floor(b.x),y=Math.floor(b.y);
    const targets=[[x+1,y],[x-1,y],[x,y+1],[x,y-1]].filter(([x,y])=>this.world.walkable(x,y,1,null,this.buildings)).sort((a,c)=>Math.hypot(u.x-a[0],u.y-a[1])-Math.hypot(u.x-c[0],u.y-c[1]));
    for(const [tx,ty]of targets){const path=this.findPath(u.x,u.y,tx,ty,1);if(path.length)return path;}
    return null;
  };
  Game.prototype.assignHaul=function(u,source,destination,good,repeat=true,autoKeep=null,autoMax=null,autoVia=null,autoDue=false){
    this.ensureInventories();
    if(!u||u.health<=0||!source?.alive||!source.built||!destination?.alive||source.id===destination.id)return 'Scegli un abitante, un’origine operativa e una destinazione valida.';
    if(!Object.hasOwn(GOODS,good))return 'Merce non valida.';
    if(u.inventory.amount)return 'L’abitante ha già un carico: usa Consegna prima di assegnare una rotta.';
    if(this.pathToBuilding(u,source)===null||this.pathToBuilding(source,destination)===null)return 'Percorso non raggiungibile fra abitante, origine e destinazione.';
    this.cancelTask(u);u.task={type:'haul',source:source.id,destination:destination.id,good,repeat,phase:'waiting',amount:0,retry:0};if(autoKeep!==null){u.task.autoLink=true;u.task.autoKeep=autoKeep;if(autoMax!==null)u.task.autoMax=autoMax;if(autoVia!==null)u.task.autoVia=autoVia;if(autoDue)u.task.autoDue=true;}u.state='hauling';this.prepareHaul(u);return null;
  };
  Game.prototype.prepareHaul=function(u){
    const t=u.task,source=this.findById(this.buildings,t.source),destination=this.findById(this.buildings,t.destination);
    if(!source?.alive||!destination?.alive){this.cancelTask(u);return;}
    const amount=Math.min(u.inventory.cap,t.autoMax??Infinity,Math.max(0,this.available(source,t.good,u)-(t.autoKeep||0)),this.freeSpace(destination,u));
    if(!amount){t.phase='waiting';t.amount=0;t.retry=1;return;}
    const path=this.pathToBuilding(u,source);
    if(path===null){t.phase='waiting';t.amount=0;t.retry=2;return;}
    t.amount=amount;t.phase='source';u.path=path;
  };
  Game.prototype.updateHaul=function(u,dt){
    const t=u.task;if(t?.type!=='haul'){this.cancelTask(u);return;}
    const source=this.findById(this.buildings,t.source),destination=this.findById(this.buildings,t.destination);
    if(!source?.alive||!destination?.alive){this.cancelTask(u);return;}
    if(t.autoLink){const via=t.autoVia?this.findById(this.buildings,t.autoVia):null;const open=via?this.linkOpen(source,via)&&this.linkOpen(via,destination):this.linkOpen(source,destination);if(source.owner!==destination.owner||t.phase!=='destination'&&!open){this.cancelTask(u);return;}}
    if(t.retry>0){t.retry=Math.max(0,t.retry-dt);return;}
    if(t.phase==='waiting'){this.prepareHaul(u);return;}
    const target=t.phase==='source'?source:destination;
    if(this.buildingDistance(u,target)>1.15){
      if(!u.path.length){const path=this.pathToBuilding(u,target);if(path===null){t.retry=2;return;}u.path=path;}
      this.followPath(u,dt,1.6*(t.phase==='destination'&&u.inventory.amount>0?TERRA_SKILLS.transportFactor(u.skills.transport):1));return;
    }
    if(t.phase==='source'){
      const amount=Math.min(t.amount,t.autoMax??Infinity,Math.max(0,this.available(source,t.good,u)-(t.autoKeep||0)),this.freeSpace(destination,u));
      if(!amount){t.amount=0;t.phase='waiting';t.retry=1;return;}
      const path=this.pathToBuilding(u,destination);if(path===null){t.amount=0;t.phase='waiting';t.retry=2;return;}
      source.inventory.items[t.good]-=amount;u.inventory.type=t.good;u.inventory.amount=amount;
      t.amount=amount;t.phase='destination';u.path=path;
    }else{
      const amount=Math.min(u.inventory.amount,this.freeSpace(destination,u));
      destination.inventory.items[t.good]=(destination.inventory.items[t.good]||0)+amount;u.inventory.amount-=amount;if(amount>0&&t.autoDue)source.returnDue[t.good]=Math.max(0,(source.returnDue?.[t.good]||0)-amount);if(amount>0)u.gain('transport',Math.max(1,amount/5));t.amount=u.inventory.amount;
      if(u.inventory.amount){t.retry=1;return;}
      u.inventory.type=null;
      if(t.repeat){t.phase='waiting';t.amount=0;t.retry=0;this.prepareHaul(u);}else this.cancelTask(u);
    }
  };
  Game.prototype.siteReady=function(b){return !!b?.requiredMaterials&&Object.entries(b.requiredMaterials).every(([k,n])=>(b.inventory?.items[k]||0)>=n);};
  Game.prototype.consumeSiteMaterials=function(b){if(b.materialsConsumed||!this.siteReady(b))return false;for(const[k,n]of Object.entries(b.requiredMaterials)){b.inventory.items[k]-=n;}b.materialsConsumed=true;return true;};
  Game.prototype.repairNeed=function(b){return Math.max(0,Math.ceil((b.maxHealth-b.health)*REPAIR_COST_PER_HP));};
  Game.prototype.assignRepair=function(u,b){
    this.ensureInventories();if(!u||u.health<=0||u.location?.kind!=='world'||!b?.alive||!b.built||b.owner!==0||b.health>=b.maxHealth)return 'Scegli un abitante e un edificio proprio danneggiato.';
    if(u.inventory.amount)return 'Deposita prima il carico dell’abitante.';const path=this.pathToBuilding(u,b);if(path===null)return 'Edificio non raggiungibile.';
    this.cancelTask(u);u.task={type:'repair',target:b.id};u.state='repairing';u.path=path;return null;
  };
  Game.prototype.updateRepair=function(u,dt){const b=this.findById(this.buildings,u.task?.target);if(!b?.alive||!b.built||b.health>=b.maxHealth){this.cancelTask(u);return;}if(this.buildingDistance(u,b)>1.15){if(!u.path.length){const p=this.pathToBuilding(u,b);if(p===null){this.cancelTask(u);return;}u.path=p;}this.followPath(u,dt,1.55);return;}const stone=b.inventory.items.stone||0;if(stone<=0)return;const hp=Math.min(b.maxHealth-b.health,dt*(5+u.skills.construction),stone/REPAIR_COST_PER_HP);if(hp<=0)return;b.health+=hp;b.repairMaterialDebt=(b.repairMaterialDebt||0)+hp*REPAIR_COST_PER_HP;const spend=Math.floor(b.repairMaterialDebt+1e-9);if(spend){b.inventory.items.stone-=spend;b.repairMaterialDebt-=spend;}u.gain('construction',dt*.2);if(b.health>=b.maxHealth-.001){b.health=b.maxHealth;const finalSpend=Math.min(b.inventory.items.stone||0,Math.ceil(b.repairMaterialDebt-1e-9));b.inventory.items.stone=(b.inventory.items.stone||0)-finalSpend;b.repairMaterialDebt=0;this.cancelTask(u);this.message(`${BUILD_LABEL[b.type]} riparato.`);}};
  const updateUnit=Game.prototype.updateUnit;
  Game.prototype.updateUnit=function(u,dt){if(u.health<=0)return;if(u.state==='hauling'){this.updateHaul(u,dt);return;}if(u.state==='producing'){this.updateProduction(u,dt);return;}if(u.state==='repairing'){this.updateRepair(u,dt);return;}updateUnit.call(this,u,dt);};
  const storageRoute=(g,u,b)=>{const route=u.owner>0?g.neutralMarketRoute?.(u,b):undefined;return route===undefined?g.pathToBuilding(u,b):route;};
  Game.prototype.nearestStorage=function(u){this.ensureInventories();return this.buildings.filter(b=>storage(b)&&this.freeSpace(b)>0&&(u.owner===0||b.owner===u.owner)).sort((a,b)=>dist(u,a)-dist(u,b)).find(b=>storageRoute(this,u,b)!==null)||null;};
  Game.prototype.returnToStorage=function(u,after,destination=null){
    this.ensureInventories();const b=destination||this.nearestStorage(u);
    if(!storage(b)||this.freeSpace(b)<=0){this.cancelTask(u);this.message('Nessun deposito raggiungibile con spazio: il carico resta all’abitante.');return false;}
    const path=storageRoute(this,u,b);if(path===null){this.message('Deposito non raggiungibile. Il carico resta all’abitante.');return false;}
    // Detach from farm during the journey; only physically present workers grow crops.
    if(u.task?.type==='farm'){const farm=this.findById(this.buildings,u.task.target);if(farm)farm.assigned=farm.assigned.filter(id=>id!==u.id);}
    u.task={type:'return',target:b.id,after};u.path=path;u.state='moving';return true;
  };
  Game.prototype.deposit=function(u,after){
    const b=this.findById(this.buildings,u.task?.target);
    if(!storage(b)){this.cancelTask(u);this.message('Deposito non disponibile. Carico conservato.');return;}
    if(this.buildingDistance(u,b)>1.15){const path=storageRoute(this,u,b);if(path===null){this.cancelTask(u);this.message('Percorso bloccato. Carico conservato.');return;}u.path=path;return;}
    const amount=Math.min(u.inventory.amount,this.freeSpace(b));
    if(amount){b.inventory.items[u.inventory.type]=(b.inventory.items[u.inventory.type]||0)+amount;u.inventory.amount-=amount;}
    if(u.inventory.amount){this.cancelTask(u);this.message('Deposito pieno: il residuo resta nel carico.');return;}
    u.inventory.type=null;
    if(after?.type==='gather'){const r=this.findById(this.world.resources,after.target);if(r?.amount>0)return this.assignGather(u,r);return this.continueGather(u,r);}
    if(after?.type==='farm'){const f=this.findById(this.buildings,after.target);if(f?.alive)return this.assignFarm(u,f);}
    this.cancelTask(u);
  };
  // Search around the depleted spot, never around the deposit.
  Game.prototype.continueGather=function(u,origin){
    const candidates=origin?this.world.resourcesInBounds(origin.x-10,origin.y-10,origin.x+10,origin.y+10).filter(r=>r.id!==origin.id&&r.type===origin.type&&r.amount>0&&dist(origin,r)<=10).sort((a,b)=>dist(origin,a)-dist(origin,b)):[];
    for(const r of candidates){
      const path=dist(u,r)<=1?[]:this.findPath(u.x,u.y,Math.floor(r.x),Math.floor(r.y),1);
      if(dist(u,r)>1&&!path.length)continue;
      if(u.inventory.amount&&(u.inventory.type!==r.type||u.inventory.amount>=u.inventory.cap))return this.returnToStorage(u,{type:'gather',target:origin.id});
      this.cancelTask(u);u.task={type:'gather',target:r.id,phase:'toResource'};u.path=path;u.state=path.length?'moving':'gathering';return;
    }
    if(u.inventory.amount)this.returnToStorage(u,null);else this.cancelTask(u);
  };
  const assignGather=Game.prototype.assignGather;
  Game.prototype.assignGather=function(u,r){if(u.inventory.amount&&(u.inventory.type!==r.type||u.inventory.amount>=u.inventory.cap)){this.cancelTask(u);return this.returnToStorage(u,{type:'gather',target:r.id});}assignGather.call(this,u,r);};
  Game.prototype.gatherTick=function(u,dt){
    const r=this.findById(this.world.resources,u.task?.target);
    if(!r||r.amount<=0){this.continueGather(u,r);return;}
    if(u.inventory.amount&&(u.inventory.type!==r.type||u.inventory.amount>=u.inventory.cap)){this.returnToStorage(u,{type:'gather',target:r.id});return;}
    if(dist(u,r)>1){u.path=this.findPath(u.x,u.y,Math.floor(r.x),Math.floor(r.y),1);if(!u.path.length){this.cancelTask(u);return;}u.state='moving';return;}
    u.workTimer-=dt;if(u.workTimer<=0){const skill=['clay','copper','tin'].includes(r.type)?'stone':Object.hasOwn(u.skills,r.type)?r.type:'food';u.workTimer=Math.max(.45,1.15-u.skills[skill]*.06)*this.personGatherTimeFactor(u,r)/this.nutritionWorkFactor(u);r.amount--;u.inventory.type=r.type;u.inventory.amount++;const peers=this.units.filter(m=>m.health>0&&m.state==='gathering'&&m.task?.type==='gather'&&m.task.target===r.id&&dist(m,r)<=1.55);this.grantMentoredWorkXp(u,skill,1,peers);if(r.amount<=0)this.continueGather(u,r);else if(u.inventory.amount>=u.inventory.cap)this.returnToStorage(u,{type:'gather',target:r.id});}
  };
  Game.prototype.buildingDay=function(b){
    if(!b.built||!b.alive)return;this.ensureInventories();
    if(b.type==='farm'){
      const workers=this.units.filter(u=>u.health>0&&u.state==='farming'&&u.task?.target===b.id&&this.buildingDistance(u,b)<=1.15).slice(0,(CROPS[b.crop]||CROPS.grain).maxWorkers);
      if(!workers.length)return;
      const crop=CROPS[b.crop]||CROPS.grain,tile=this.world.tile(Math.floor(b.x),Math.floor(b.y)),season=this.season(),seasonMod=crop.seasons[season],water=tile.nearWater?1.3:1;
      const skill=workers.reduce((s,u)=>s+u.skills.farming,0)/workers.length,workFactor=workers.reduce((s,u)=>s+this.nutritionWorkFactor(u),0)/workers.length;
      b.growth=Math.min(1,b.growth+1/crop.days*BIOME[tile.biome].fertility*seasonMod*water*(1+(skill-1)*.08)*workFactor);
      const amount=Math.max(1,Math.round(crop.yield*BIOME[tile.biome].fertility*water*seasonMod));
      if(b.growth>=1&&this.freeSpace(b)>=amount){b.inventory.items[b.crop]=(b.inventory.items[b.crop]||0)+amount;b.growth=0;for(const u of workers)this.grantMentoredWorkXp(u,'farming',5,workers);const linked=this.linkedBuildings?.(b,'warehouse')?.some(w=>this.linkOpen?.(b,w));this.message(linked?`Raccolto: ${amount} ${this.resourceName(b.crop)} nel campo. Trasferimento automatico verso il magazzino collegato.`:`Raccolto: ${amount} ${this.resourceName(b.crop)} nel campo. Collega un magazzino entro 12 tile oppure assegna un trasporto.`);}
    }

  };
  const updateBuilding=Game.prototype.updateBuilding;
  Game.prototype.updateBuilding=function(b,dt){
    updateBuilding.call(this,b,dt);const recipes=RECIPES[b.type];if(!recipes||!b.built||!b.alive)return;
    const workers=this.factoryWorkers(b).filter(u=>this.buildingDistance(u,b)<=1.15).slice(0,(CROPS[b.crop]||CROPS.grain).maxWorkers);if(!workers.length)return;
    if(b.batch){b.batch.remaining=Math.max(0,b.batch.remaining-dt*craftFactor(workers,CRAFT_SKILL[b.type]));if(b.batch.remaining===0){for(const[good,amount]of Object.entries(b.batch.outputs))b.inventory.items[good]=(b.inventory.items[good]||0)+amount;const skill={mill:'milling',sawmill:'carpentry',bakery:'baking',kiln:'pottery',foundry:'metallurgy',loom:'weaving',press:'pressing'}[b.type];if(skill){const xp=Math.max(1,total(b.batch.outputs)/2);for(const u of workers)this.grantMentoredWorkXp(u,skill,xp,workers);}b.batch=null;}return;}
    const incoming=this.reserved(b.id,null,'in');
    const preferred=b.type==='press'&&recipes.find(r=>r.id===b.preferredRecipeId);
    const ordered=preferred?[preferred,...recipes.filter(r=>r!==preferred)]:recipes;
    const recipe=ordered.find(r=>Object.entries(r.inputs).every(([good,amount])=>this.available(b,good)>=amount)&&total(b.inventory.items)-total(r.inputs)+total(r.outputs)+incoming<=b.inventory.capacity);
    if(!recipe)return;
    for(const[good,amount]of Object.entries(recipe.inputs))b.inventory.items[good]-=amount;
    const output=Object.keys(recipe.outputs)[0],amount=recipe.outputs[output];
    b.batch={recipeId:recipe.id,inputs:{...recipe.inputs},outputs:{...recipe.outputs},input:Object.keys(recipe.inputs)[0],output,amount,outputVolume:total(recipe.outputs),remaining:recipe.seconds};
  };
  Game.prototype.recoverDeadCargo=function(){
    for(const u of this.units)if(u.health<=0&&u.inventory.amount){this.world.resources.push(new ResourceNode(u.inventory.type,u.x,u.y,u.inventory.amount));u.inventory.amount=0;u.inventory.type=null;u.task=null;}
  };
  Game.prototype.recoverDeadBuildingCargo=function(){for(const b of this.buildings)if(b.health<=0&&!b.cargoRecovered&&b.inventory){for(const[type,amount]of Object.entries(b.inventory.items))if(amount>0)this.world.resources.push(new ResourceNode(type,b.x,b.y,amount));b.inventory.items={};b.batch=null;b.cargoRecovered=true;}};
  const update=Game.prototype.update;
  Game.prototype.update=function(dt){if(this.paused||this.suspended||this.gameEnded)return;this.ensureInventories();update.call(this,dt);};
  const resourceName=Game.prototype.resourceName;
  Game.prototype.resourceName=function(type){return GOODS[type]?.label||resourceName.call(this,type);};
  const unitStatus=Game.prototype.unitStatus;
  Game.prototype.unitStatus=function(u){if(u.task?.type==='haul'){const t=u.task;return t.phase==='waiting'?'attende merci o spazio':t.phase==='source'?'va al prelievo':`trasporta ${this.resourceName(t.good)}`;}if(u.task?.type==='production'){const b=this.findById(this.buildings,u.task.target);return `${u.task.profession} · ${b&&this.buildingDistance(u,b)<=1.15?'al lavoro':'in cammino'}`;}if(u.task?.type==='repair')return 'ripara edificio';return unitStatus.call(this,u);};
  const applyOrder=Game.prototype.applyOrder;
  Game.prototype.applyOrder=function(o,pos,tx,ty,u=this.selected){if(o==='deliver'){const b=this.nearestAt(this.buildings,pos,1,storage);if(!b||!u.inventory.amount){this.message('Serve un carico e un deposito completato.');return;}this.cancelTask(u);if(this.returnToStorage(u,null,b)){this.orderMode=null;this.syncModeButtons();}return;}return applyOrder.call(this,o,pos,tx,ty,u);};
  const orderHelp=Game.prototype.orderHelp;
  Game.prototype.orderHelp=function(o){return o==='deliver'?'Tocca la Casa comune o un magazzino.':orderHelp.call(this,o);};
  const contextTap=Game.prototype.rtsContextTap;
  Game.prototype.rtsContextTap=function(sx,sy){const w=this.screenToWorld(sx,sy),pos={x:w.x/TILE,y:w.y/TILE},entity=this.pickEntity(pos),group=this.rtsSelectedUnits();if(entity instanceof Building&&entity.owner===0&&entity.built&&entity.health<entity.maxHealth&&group.length){for(const u of group)this.assignRepair(u,entity);return;}if(storage(entity)&&group.some(u=>u.inventory.amount)){for(const u of group)if(u.inventory.amount){this.cancelTask(u);this.returnToStorage(u,null,entity);}return;}contextTap.call(this,sx,sy);};

  const selectionHTML=Game.prototype.selectionHTML;
  Game.prototype.selectionHTML=function(e){let html=selectionHTML.call(this,e);if(e instanceof Building&&e.inventory){const items=Object.entries(e.inventory.items).filter(([,n])=>n>0).map(([k,n])=>`${this.resourceName(k)} ${n}`).join(' · ')||'vuoto';html+=`<p>Scorte locali ${total(e.inventory.items)}/${e.inventory.capacity}: ${items}</p>`;if(e.type==='farm'){const crop=CROPS[e.crop]||CROPS.grain;html+=`<p>Coltura: <b>${crop.label}</b> · ciclo base ${crop.days} giorni · resa base ${crop.yield}. Terreno, acqua e stagione modificano crescita e resa.</p><div>${Object.entries(CROPS).map(([id,c])=>`<button type="button" data-crop="${id}" ${id===e.crop?'disabled':''}>${c.label}</button>`).join('')}</div>`;}if(!e.built&&e.requiredMaterials)html+=e.materialsConsumed?'<p>Materiali consumati; lavori di costruzione in corso.</p>':`<p>Materiali richiesti: ${Object.entries(e.requiredMaterials).map(([k,n])=>`${this.resourceName(k)} ${Math.min(n,e.inventory.items[k]||0)}/${n}`).join(' · ')}. La costruzione attende la consegna fisica.</p>`;if(e.built&&e.health<e.maxHealth)html+=`<p>Riparazione: consegna almeno ${this.repairNeed(e)} pietra locale, poi tocca l’edificio con un abitante selezionato.</p>`;if(RECIPES[e.type]&&e.built){const names=this.factoryWorkers(e).map(u=>u.name).join(', ')||'nessuno';html+=`<p>Lavoratori: ${names}. ${e.batch?'In lavorazione':'In attesa di una ricetta con input e spazio locali'} · usa Mondo → Filiera</p>`;}}return html;};
  const updateUI=Game.prototype.updateUI;
  Game.prototype.setCrop=function(b,crop){if(b?.type!=='farm'||!CROPS[crop])return false;if(b.growth>0){this.message('Termina il ciclo in corso prima di cambiare coltura.');return false;}b.crop=crop;this.message(`Campo destinato a ${CROPS[crop].label}.`);this.updateUI();return true;};
  Game.prototype.updateUI=function(){this.ensureInventories();updateUI.call(this);$('#foodVal').textContent=Math.floor((this.stock.food||0)+(this.stock.bread||0));const card=$('#selectionCard');card?.querySelectorAll?.('[data-crop]').forEach(button=>button.onclick=()=>this.setCrop(this.selected,button.dataset.crop));};
  const drawBuilding=Game.prototype.drawBuilding;
  Game.prototype.drawBuilding=function(b){if(!RECIPES[b.type]||b.built&&window.TERRA_P16_SPRITES?.[b.type]?.complete&&window.TERRA_P16_SPRITES[b.type].naturalWidth>0)return drawBuilding.call(this,b);const p=this.worldToScreen(b.x*TILE,b.y*TILE),z=this.camera.zoom,c=this.ctx;c.save();c.fillStyle=b.type==='mill'?'#918b72':'#a47854';c.fillRect(p.x-15*z,p.y-13*z,30*z,26*z);c.fillStyle='#3d382f';if(b.type==='mill'){c.fillRect(p.x-2*z,p.y-12*z,4*z,24*z);c.fillRect(p.x-12*z,p.y-2*z,24*z,4*z);}else c.fillRect(p.x-8*z,p.y-3*z,16*z,12*z);if(!b.built){c.fillStyle='#d0b36a';c.fillRect(p.x-15*z,p.y+16*z,30*z*b.progress,3*z);}c.restore();if(this.selected?.id===b.id)this.selectionRing(p.x,p.y,20*z);};

  Game.prototype.renderLogistics=function(){
    this.ensureInventories();const buildings=this.buildings.filter(b=>b.alive&&b.owner===0),sources=buildings.filter(b=>b.built);
    const label=b=>`${BUILD_LABEL[b.type]} (${Math.floor(b.x)}, ${Math.floor(b.y)})`;
    $('#inventoryList').innerHTML=buildings.filter(b=>this.selected instanceof Building?b===this.selected:this.selected instanceof Unit&&Math.hypot(b.x-this.selected.x,b.y-this.selected.y)<=2).map(b=>`<article><b>${label(b)}</b><span>${total(b.inventory.items)}/${b.inventory.capacity} · ${Object.entries(b.inventory.items).filter(([,n])=>n).map(([k,n])=>`${this.resourceName(k)}: ${n}`).join(' · ')||'vuoto'}</span>${b.batch?`<span>In lavorazione: ${Object.entries(b.batch.outputs).map(([k,n])=>`${n} ${this.resourceName(k)}`).join(' · ')}</span>`:''}</article>`).join('');
    const populate=(id,entries)=>{const el=$(id),old=el.value;el.innerHTML=entries.map(([id,label])=>`<option value="${id}">${label}</option>`).join('');if(entries.some(([id])=>id===old))el.value=old;};
    populate('#carrierSelect',this.units.filter(u=>u.owner===0&&u.health>0&&u.location.kind==='world').map(u=>[u.id,`${u.name} · ${this.unitStatus(u)} · carico ${u.inventory.amount}/${u.inventory.cap}`]));
    populate('#workerSelect',this.units.filter(u=>u.owner===0&&u.health>0&&u.location.kind==='world'&&!u.inventory.amount).map(u=>[u.id,`${u.name} · ${this.unitStatus(u)}`]));
    populate('#factorySelect',buildings.filter(b=>RECIPES[b.type]).map(b=>[b.id,label(b)]));
    populate('#sourceSelect',sources.map(b=>[b.id,label(b)]));populate('#destinationSelect',buildings.map(b=>[b.id,label(b)]));
    $('#routeList').innerHTML=this.units.filter(u=>u.owner===0&&u.task?.type==='haul'&&(this.selected instanceof Unit?u===this.selected:u.task.source===this.selected?.id||u.task.destination===this.selected?.id)).map(u=>{const t=u.task,source=this.findById(buildings,t.source),dest=this.findById(buildings,t.destination);return `<p><b>${u.name}</b>: ${source?label(source):'origine perduta'} → ${dest?label(dest):'destinazione perduta'} · ${this.resourceName(t.good)} · ${this.unitStatus(u)} · prenotati ${t.amount}</p>`;}).join('')||'<p>Nessun trasporto assegnato.</p>';
  };
  const initUI=Game.prototype.initUI;
  Game.prototype.initUI=function(){initUI.call(this);const dialog=$('#logisticsDialog');
    $('#logisticsBtn').onclick=()=>{this.pauseBeforeLogistics=this.paused;this.pointerCancel();this.renderLogistics();$('#transportStatus').textContent='';this.showManagement('logisticsDialog');};
    $('#closeLogistics').onclick=()=>this.closeManagement();dialog.addEventListener('close',()=>{if(!this.suspended&&!this.backgroundDuringLogistics)this.setPaused(this.pauseBeforeLogistics);this.backgroundDuringLogistics=false;});
    $('#transportForm').onsubmit=e=>{e.preventDefault();const u=this.findById(this.units,$('#carrierSelect').value),source=this.findById(this.buildings,$('#sourceSelect').value),dest=this.findById(this.buildings,$('#destinationSelect').value);const error=this.assignHaul(u,source,dest,$('#goodsSelect').value,$('#repeatRoute').checked);$('#transportStatus').textContent=error||'Trasporto assegnato.';if(!error){this.save(true);this.renderLogistics();}};
    $('#productionForm').onsubmit=e=>{e.preventDefault();const u=this.findById(this.units,$('#workerSelect').value),b=this.findById(this.buildings,$('#factorySelect').value),error=this.assignProduction(u,b);$('#productionStatus').textContent=error||'Mestiere assegnato. Il ciclo parte solo con input locale.';if(!error){this.save(true);this.renderLogistics();}};
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open)this.backgroundDuringLogistics=true;});
  };
})();

