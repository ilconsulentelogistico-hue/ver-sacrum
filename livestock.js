// Persistent livestock: pens reference animal and worker IDs; forage and products stay local.
(() => {
  'use strict';
  const RULES={penCapacity:6,foragePerAnimal:1,milkPerSheep:2,woolEveryWorkDays:30,woolPerSheep:1};
  window.TERRA_LIVESTOCK=RULES;

  Game.prototype.ensureLivestock=function(){
    this.ensureInventories();
    for(const b of this.buildings)if(b.type==='pen'){
      if(!Array.isArray(b.animalIds))b.animalIds=[];
      if(!Array.isArray(b.workers))b.workers=[];
      b.animalIds=[...new Set(b.animalIds)].filter(id=>this.animals.some(a=>a.id===id&&a.health>0&&a.owner===0));
      b.workers=[...new Set(b.workers)].filter(id=>this.units.some(u=>u.id===id&&u.health>0&&u.task?.type==='livestock'&&u.task.target===b.id));
      if(!Number.isSafeInteger(b.livestockDays)||b.livestockDays<0)b.livestockDays=0;
      b.herdingRemainder??=0;
    }
    for(const a of this.animals){if(a.penId!==null&&a.penId!==undefined&&!this.buildings.some(b=>b.id===a.penId&&b.type==='pen'&&b.animalIds?.includes(a.id)))a.penId=null;}
  };
  Game.prototype.assignAnimalToPen=function(animal,pen){
    this.ensureLivestock();
    if(!animal||animal.type!=='sheep'||animal.owner!==0||animal.health<=0)return 'Serve una pecora domestica viva.';
    if(!pen?.alive||!pen.built||pen.type!=='pen'||pen.owner!==0)return 'Serve un recinto operativo.';
    if(!pen.animalIds.includes(animal.id)&&pen.animalIds.length>=RULES.penCapacity)return 'Il recinto è pieno.';
    for(const b of this.buildings.filter(b=>b.type==='pen'))b.animalIds=b.animalIds.filter(id=>id!==animal.id);
    pen.animalIds.push(animal.id);animal.penId=pen.id;animal.x=pen.x+.25;animal.y=pen.y+.25;return null;
  };
  Game.prototype.assignLivestockWorker=function(u,pen){
    this.ensureLivestock();
    if(!u||u.health<=0||u.location?.kind!=='world'||!pen?.alive||!pen.built||pen.type!=='pen')return 'Scegli un abitante libero e un recinto operativo.';
    if(u.inventory.amount)return 'Deposita prima il carico dell’abitante.';
    const path=this.pathToBuilding(u,pen);if(path===null)return 'Recinto non raggiungibile.';
    this.cancelTask(u);u.task={type:'livestock',target:pen.id,profession:'allevatore'};u.state='livestock';u.path=path;
    if(!pen.workers.includes(u.id))pen.workers.push(u.id);return null;
  };
  const assignProduction=Game.prototype.assignProduction;
  Game.prototype.assignProduction=function(u,b){return b?.type==='pen'?this.assignLivestockWorker(u,b):assignProduction.call(this,u,b);};
  const updateUnit=Game.prototype.updateUnit;
  Game.prototype.updateUnit=function(u,dt){
    if(u.state!=='livestock')return updateUnit.call(this,u,dt);
    const pen=this.findById(this.buildings,u.task?.target);if(!pen?.alive||!pen.built||pen.type!=='pen'){this.cancelTask(u);return;}
    if(this.buildingDistance(u,pen)>1.15){if(!u.path.length){const path=this.pathToBuilding(u,pen);if(path===null){this.cancelTask(u);return;}u.path=path;}this.followPath(u,dt,1.55);}
  };
  const cancelTask=Game.prototype.cancelTask;
  Game.prototype.cancelTask=function(u){if(u?.task?.type==='livestock'){const b=this.findById(this.buildings,u.task.target);if(b)b.workers=(b.workers||[]).filter(id=>id!==u.id);}return cancelTask.call(this,u);};
  const buildingDay=Game.prototype.buildingDay;
  Game.prototype.buildingDay=function(b){
    buildingDay.call(this,b);if(b.type!=='pen'||!b.built||!b.alive)return;this.ensureLivestock();
    const animals=b.animalIds.map(id=>this.findById(this.animals,id)).filter(a=>a?.health>0&&a.owner===0&&a.type==='sheep');
    const workers=b.workers.map(id=>this.findById(this.units,id)).filter(u=>u?.health>0&&u.task?.type==='livestock'&&u.task.target===b.id&&this.buildingDistance(u,b)<=1.15);
    if(!animals.length||!workers.length)return;
    const forage=animals.length*RULES.foragePerAnimal;if(this.available(b,'forage')<forage)return;
    const baseMilk=animals.length*RULES.milkPerSheep,level=workers.reduce((n,u)=>n+(u.skills.herding??1),0)/workers.length;
    const produced=baseMilk*TERRA_SKILLS.herdingFactor(level)+b.herdingRemainder,milk=Math.floor(produced+1e-9);
    const wool=(b.livestockDays+1)%RULES.woolEveryWorkDays===0?animals.length*RULES.woolPerSheep:0;
    if(this.freeSpace(b)+forage<milk+wool)return;
    b.inventory.items.forage-=forage;b.inventory.items.milk=(b.inventory.items.milk||0)+milk;
    if(wool)b.inventory.items.wool=(b.inventory.items.wool||0)+wool;
    b.herdingRemainder=produced-milk;b.livestockDays++;
    for(const u of workers)u.gain('herding',2);
  };
  const tameTick=Game.prototype.tameTick;
  Game.prototype.tameTick=function(u,dt){const target=this.findById(this.animals,u.task?.target);const wasWild=target?.owner===-1;tameTick.call(this,u,dt);if(wasWild&&target?.owner===0){this.ensureLivestock();const pen=this.buildings.filter(b=>b.type==='pen'&&b.built&&b.alive&&b.animalIds.length<RULES.penCapacity).sort((a,b)=>dist(target,a)-dist(target,b))[0];if(pen)this.assignAnimalToPen(target,pen);}};
  const update=Game.prototype.update;
  Game.prototype.update=function(dt){this.ensureLivestock();return update.call(this,dt);};
  const renderLogistics=Game.prototype.renderLogistics;
  Game.prototype.renderLogistics=function(){renderLogistics.call(this);const select=$('#factorySelect'),pens=this.buildings.filter(b=>b.owner===0&&b.type==='pen'&&b.alive&&b.built);for(const b of pens){const o=document.createElement?.('option');if(o){o.value=b.id;o.textContent=`Recinto (${Math.floor(b.x)}, ${Math.floor(b.y)})`;select.appendChild(o);}}};
  const selectionHTML=Game.prototype.selectionHTML;
  Game.prototype.selectionHTML=function(e){let html=selectionHTML.call(this,e);if(e instanceof Building&&e.type==='pen'){this.ensureLivestock();const names=e.animalIds.map(id=>this.findById(this.animals,id)?.id.slice(0,8)).filter(Boolean).join(', ')||'nessuno';const workers=e.workers.map(id=>this.findById(this.units,id)?.name).filter(Boolean).join(', ')||'nessuno';html+=`<p>Animali ${e.animalIds.length}/${RULES.penCapacity}: ${names}</p><p>Allevatori: ${workers}. Foraggio ${(e.inventory.items.forage||0)} · latte ${(e.inventory.items.milk||0)} · lana ${(e.inventory.items.wool||0)}.</p>`;}return html;};
  const unitStatus=Game.prototype.unitStatus;
  Game.prototype.unitStatus=function(u){return u.task?.type==='livestock'?'allevatore':unitStatus.call(this,u);};
})();

