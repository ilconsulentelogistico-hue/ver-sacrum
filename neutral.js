// Persistent non-player settlements with separate people, stores and local economies.
(() => {
  'use strict';
  const RULES=Object.freeze({version:2,mealEveryDays:30,foodPerPerson:1,productionEveryDays:10});
  const style=owner=>window.terraFactionStyle?window.terraFactionStyle(owner):{color:'#77746E'};
  const FACTIONS=[
    {owner:1,id:'clan-guado',name:'Clan del Guado',color:style(1).color,productionGood:'grain',goods:{food:24,grain:18,forage:12},money:220},
    {owner:2,id:'lega-colline',name:'Lega delle Colline',color:style(2).color,productionGood:'barley',goods:{food:18,barley:20,stone:12},money:260},
    {owner:3,id:'genti-neutrali',name:'Genti Neutrali',color:style(3).color,productionGood:'food',fixedNeutral:true,goods:{food:28,grain:12,wood:10},money:180}
  ];
  window.TERRA_NEUTRALS={rules:RULES,factions:FACTIONS};
  const alivePeople=(game,owner)=>game.units.filter(u=>u.owner===owner&&u.health>0),owned=(entity,owner)=>entity&&entity.owner===owner&&entity.alive;
  Game.prototype.neutralSettlement=function(owner){const base=this.buildings.find(b=>b.owner===owner&&b.type==='base'&&b.alive);if(!base)return null;return{owner,id:base.settlementId,name:base.factionName,base,market:this.buildings.find(b=>b.owner===owner&&b.type==='market'&&b.alive),people:alivePeople(this,owner)};};
  Game.prototype.findNeutralSite=function(px,py){for(let r=0;r<18;r++)for(let i=0;i<32;i++){const x=Math.max(3,Math.min(this.world.size-4,Math.floor(px+Math.cos(i/32*Math.PI*2)*r))),y=Math.max(3,Math.min(this.world.size-4,Math.floor(py+Math.sin(i/32*Math.PI*2)*r))),tile=this.world.tile(x,y);if(tile&&BIOME[tile.biome].walk&&!this.buildings.some(b=>dist(b,{x:x+.5,y:y+.5})<5))return{x,y};}return{x:this.world.size-8,y:8};};
  Game.prototype.createNeutralSettlements=function(){const anchors=[[14,16],[this.world.size-14,this.world.size-18],[this.world.size-16,16]];for(const[index,f]of FACTIONS.entries()){if(this.buildings.some(b=>b.type==='base'&&b.settlementId===f.id&&(b.owner===f.owner||b.owner===0&&b.integratedFromOwner===f.owner)))continue;const a=anchors[index%anchors.length],site=this.findNeutralSite(a[0],a[1]),base=new Building('base',site.x,site.y,f.owner,true),house=new Building('house',site.x+2,site.y,f.owner,true),market=new Building('market',site.x,site.y+2,f.owner,true);for(const b of[base,house,market]){b.settlementId=f.id;b.factionName=f.name;this.buildings.push(b);}this.ensureInventories();base.inventory.items={...f.goods};market.inventory.items={};market.money=f.money;for(let n=0;n<3;n++){const u=new Unit(NAMES[(f.owner*4+n)%NAMES.length],house.x,house.y,this.rng);u.owner=f.owner;u.neutralSettlementId=f.id;if(n<2){u.location={kind:'resident',settlementId:house.id};house.residents.push(u.id);}else{u.x=site.x+1.5;u.y=site.y+1.5;}this.units.push(u);}}this.ensureMarkets();};
  Game.prototype.relinkNeutralHousesAfterSpawn=function(){
    const bounds=window.VER_SACRUM_VILLAGE?.bounds;
    if(!bounds)return;
    const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    for(const f of FACTIONS){
      const settlement=this.neutralSettlement(f.owner),market=settlement?.market;
      const home=this.buildings.find(b=>b.owner===f.owner&&b.type==='house'&&b.alive);
      if(!market||!home||this.linkOpen(home,market))continue;
      let best=null;
      const cx=Math.floor(market.x),cy=Math.floor(market.y);
      for(let radius=1;radius<=12;radius++)for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
        if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;
        const x=cx+dx,y=cy+dy,center={x:x+.5,y:y+.5};
        if(dist(center,market)>12)continue;
        const area=bounds({type:'house',...center});
        if(area.left<0||area.top<0||area.right>this.world.size||area.bottom>this.world.size)continue;
        let passable=true;for(let ty=area.top;ty<area.bottom&&passable;ty++)for(let tx=area.left;tx<area.right;tx++){const tile=this.world.tile(tx,ty);if(!tile||!BIOME[tile.biome].walk){passable=false;break}}
        if(!passable||this.buildings.some(b=>b!==home&&b.alive&&overlaps(area,bounds(b))))continue;
        if((this.warCamps||[]).some(b=>b.health>0&&overlaps(area,bounds(b))))continue;
        const actors=[...this.units.filter(u=>u.health>0&&u.location?.kind==='world'),...this.animals.filter(a=>a.health>0),...this.raiders.filter(r=>r.health>0)];
        if(actors.some(a=>overlaps(area,{left:a.x-.45,right:a.x+.45,top:a.y-.45,bottom:a.y+.45})))continue;
        const resources=this.world.resourcesInBounds(area.left-.515,area.top-.515,area.right+.515,area.bottom+.515)
          .filter(r=>!r.cleared&&(r.amount>0||r.renewable)&&overlaps(area,{left:r.x-.515,right:r.x+.515,top:r.y-.515,bottom:r.y+.515}));
        const score=resources.length*1000+dist(center,home)+radius*.01;
        if(!best||score<best.score)best={center,resources,score};
      }
      if(!best)continue;
      for(const r of best.resources){r.amount=0;r.cleared=true;r.regrowing=false;}
      home.x=best.center.x;home.y=best.center.y;home.villageFootprintVersion=1;
      for(const u of this.units)if(u.location?.kind==='resident'&&u.location.settlementId===home.id){u.x=home.x;u.y=home.y;}
    }
  };
  // Spawn normalization can move any base beyond its store's link radius.
  // Repair that first-frame layout without changing IDs or inventories.
  Game.prototype.relinkStartingStoresAfterSpawn=function(){
    for(const f of [{owner:0},...FACTIONS]){
      const base=this.buildings.find(b=>b.owner===f.owner&&b.type==='base'&&b.alive);
      const store=this.buildings.find(b=>b.owner===f.owner&&b.type==='warehouse'&&b.alive);
      const market=this.buildings.find(b=>b.owner===f.owner&&b.type==='market'&&b.alive);
      if(!base||!store||this.linkOpen(store,base)&&(!market||this.linkOpen(store,market)))continue;
      let spot=null;
      for(let r=1;r<=12&&!spot;r++)for(let dy=-r;dy<=r&&!spot;dy++)for(let dx=-r;dx<=r;dx++){
        if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
        const x=Math.floor(base.x)+dx,y=Math.floor(base.y)+dy;
        if(Math.hypot(x+.5-base.x,y+.5-base.y)>12||market&&Math.hypot(x+.5-market.x,y+.5-market.y)>12||!this.world.walkable(x,y,1,null,this.buildings))continue;
        if(this.world.resourcesInBounds(x-.1,y-.1,x+1.1,y+1.1).some(n=>!n.cleared&&(n.amount>0||n.renewable)))continue;
        spot={x:x+.5,y:y+.5};break;
      }
      if(spot){store.x=spot.x;store.y=spot.y;}
    }
    for(const f of FACTIONS)this.ensureNeutralFarm(f.owner);
    this.relinkNeutralHousesAfterSpawn();
    for(const f of FACTIONS){this.ensureNeutralMill(f.owner);const settlement=this.neutralSettlement(f.owner);this.provisionNeutralMarketFood(settlement,this.communalStores?.(f.owner)?.[0]);}
    // The original third villager can spawn in a separate terrain pocket after normalization.
    // Fix only that first-frame position, keeping the same person and cargo.
    for(const f of FACTIONS){
      const settlement=this.neutralSettlement(f.owner),store=this.communalStores?.(f.owner)?.[0];
      const worker=settlement?.people.find(u=>u.location?.kind==='world'&&!u.task&&!u.homeVillageId);
      if(!worker||!store||this.pathToBuilding(worker,store)!==null)continue;
      const spot=this.buildingDoors(store).find(p=>this.spawnPositionFree(p,worker));
      if(spot){worker.x=spot.x;worker.y=spot.y;worker.tx=spot.x;worker.ty=spot.y;worker.path=[];worker.state='idle';}
    }
  };
  Game.prototype.neutralStarterJobsReady=function(settlement){
    if(![1,2].includes(settlement.owner))return true;
    const farm=this.buildings.find(b=>b.owner===settlement.owner&&b.type==='farm'&&b.alive),mill=this.buildings.find(b=>b.owner===settlement.owner&&b.type==='mill'&&b.alive);
    return !!farm&&!!mill&&settlement.people.some(u=>u.task?.type==='farm'&&u.task.target===farm.id)
      &&settlement.people.some(u=>u.task?.type==='production'&&u.task.target===mill.id);
  };
  Game.prototype.assignNeutralFoodGatherer=function(settlement,store){
    if(this.freeSpace(store)<=0||this.available(store,'food')>=Math.max(12,settlement.people.length*10))return false;
    const starterReady=this.neutralStarterJobsReady(settlement);
    const worker=settlement.people.find(u=>u.location?.kind==='world'&&u.state==='idle'&&!u.task&&u.inventory.amount===0&&!u.neutralTradeRole&&(!u.homeVillageId||starterReady));
    if(!worker)return false;
    const candidates=this.world.resourcesInBounds(worker.x-16,worker.y-16,worker.x+16,worker.y+16)
      .filter(r=>r.type==='food'&&r.amount>0&&!r.cleared).sort((a,b)=>dist(worker,a)-dist(worker,b));
    for(const r of candidates.slice(0,8)){
      if(dist(worker,r)>1&&!this.findPath(worker.x,worker.y,Math.floor(r.x),Math.floor(r.y),1).length)continue;
      this.assignGather(worker,r);return true;
    }
    return false;
  };
  Game.prototype.assignNeutralBuildGatherer=function(settlement,store){
    if(![1,2].includes(settlement?.owner)||!store)return false;
    if(settlement.base.neutralBakeryEstablished){
      for(const u of settlement.people.filter(u=>u.neutralBuildGather&&u.health>0)){
        u.neutralBuildGather=null;
        if(u.inventory.amount)this.returnToStorage(u,null,store);else this.cancelTask(u);
      }
      return false;
    }
    if(this.freeSpace(store)<=0)return false;
    const target=BUILD_COSTS.bakery,food=settlement.people.length;
    const foodStock=this.buildings.filter(b=>b.owner===settlement.owner&&b.alive).reduce((n,b)=>n+['food','bread','barleyBread','milk'].reduce((sum,k)=>sum+(b.inventory?.items[k]||0),0),0);
    const hungry=foodStock<food*10+18;
    if(!hungry&&this.available(store,'wood')<target.wood||!hungry&&this.available(store,'stone')<target.stone){
      for(const u of settlement.people.filter(u=>u.owner===settlement.owner&&u.location?.kind==='world')){
        const task=u.task,resource=task?.type==='gather'?this.findById(this.world.resources,task.target):task?.type==='return'&&task.after?.type==='gather'?this.findById(this.world.resources,task.after.target):null;
        if(resource?.type!=='food')continue;
        if(task.type==='return')task.after=null;
        else if(u.inventory.amount)this.returnToStorage(u,null,store);
        else this.cancelTask(u);
      }
    }
    for(const u of settlement.people.filter(u=>u.neutralBuildGather&&u.health>0)){
      const good=u.neutralBuildGather;
      if(!hungry&&this.available(store,good)<target[good])continue;
      u.neutralBuildGather=null;
      if(u.inventory.amount)this.returnToStorage(u,null,store);else this.cancelTask(u);
    }
    if(hungry||this.totalDays<(settlement.base.neutralBuildSearchNextDay||0))return false;
    const starterReady=this.neutralStarterJobsReady(settlement);
    const worker=settlement.people.find(u=>u.location?.kind==='world'&&u.state==='idle'&&!u.task&&u.inventory.amount===0&&!u.neutralTradeRole&&(!u.homeVillageId||starterReady));
    if(!worker)return false;
    const needed=['wood','stone'].filter(good=>this.available(store,good)<target[good]);
    if(!needed.length)return false;
    // Search local reachable tiles once, and stop when the first needed deposit is found.
    const minX=Math.floor(Math.min(worker.x,store.x))-24,maxX=Math.ceil(Math.max(worker.x,store.x))+24;
    const minY=Math.floor(Math.min(worker.y,store.y))-24,maxY=Math.ceil(Math.max(worker.y,store.y))+24;
    const startX=Math.floor(worker.x),startY=Math.floor(worker.y),key=(x,y)=>`${x},${y}`;
    const candidates=new Map(needed.map(good=>[good,this.world.resourcesInBounds(store.x-16,store.y-16,store.x+16,store.y+16)
      .filter(r=>r.type===good&&r.amount>0&&!r.cleared).sort((a,b)=>dist(worker,a)-dist(worker,b))]));
    const firstTiles=new Set(candidates.get(needed[0]).map(r=>key(Math.floor(r.x),Math.floor(r.y))));
    const reached=new Set([key(startX,startY)]),queue=[{x:startX,y:startY}];
    search:for(let i=0;i<queue.length&&i<5000;i++){
      const p=queue[i];
      if(firstTiles.has(key(p.x,p.y)))break;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const x=p.x+dx,y=p.y+dy,k=key(x,y);
        if(x<minX||x>maxX||y<minY||y>maxY||reached.has(k))continue;
        if(!this.world.walkable(x,y,1,p,this.buildings))continue;
        reached.add(k);queue.push({x,y});
        if(firstTiles.has(k))break search;
      }
    }
    for(const good of needed){
      const resource=candidates.get(good).find(r=>reached.has(key(Math.floor(r.x),Math.floor(r.y))));
      if(resource){this.assignGather(worker,resource);worker.neutralBuildGather=good;return true;}
    }
    settlement.base.neutralBuildSearchNextDay=this.totalDays+30;
    return false;
  };
  Game.prototype.neutralWorkExit=function(home,target){
    const starts=this.buildingDoors(home).sort((a,b)=>dist(a,target)-dist(b,target))
      .filter(point=>this.spawnPositionFree(point));
    const goals=new Set(this.buildingDoors(target).map(p=>`${Math.floor(p.x)},${Math.floor(p.y)}`));
    if(!starts.length||!goals.size)return null;
    const minX=Math.floor(Math.min(home.x,target.x))-24,maxX=Math.ceil(Math.max(home.x,target.x))+24;
    const minY=Math.floor(Math.min(home.y,target.y))-24,maxY=Math.ceil(Math.max(home.y,target.y))+24;
    const key=(x,y)=>`${x},${y}`,seen=new Set(),queue=[];
    for(const start of starts){const x=Math.floor(start.x),y=Math.floor(start.y),k=key(x,y);if(!seen.has(k)){seen.add(k);queue.push({x,y,start});}}
    for(let i=0;i<queue.length&&i<5000;i++){
      const p=queue[i];if(goals.has(key(p.x,p.y)))return p.start;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const x=p.x+dx,y=p.y+dy,k=key(x,y);
        if(x<minX||x>maxX||y<minY||y>maxY||seen.has(k))continue;
        if(!this.world.walkable(x,y,1,p,this.buildings))continue;
        seen.add(k);queue.push({x,y,start:p.start});
      }
    }
    return null;
  };
  Game.prototype.ensureNeutralFarm=function(owner){
    const faction=FACTIONS.find(f=>f.owner===owner),crop=faction?.productionGood;
    if(!crop||!TERRA_CROPS?.[crop])return null;
    const settlement=this.neutralSettlement(owner),store=this.communalStores?.(owner)?.[0];
    if(!settlement||!store)return null;
    let farm=this.buildings.find(b=>b.owner===owner&&b.type==='farm'&&b.alive&&b.crop===crop);
    if(!farm&&settlement.base.neutralFarmEstablished)return null;
    if(!farm){
      const cx=Math.floor(store.x),cy=Math.floor(store.y);
      for(let radius=2;radius<=12&&!farm;radius++)for(let dy=-radius;dy<=radius&&!farm;dy++)for(let dx=-radius;dx<=radius;dx++){
        if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;
        const x=cx+dx,y=cy+dy;
        if(Math.hypot(x+.5-store.x,y+.5-store.y)>12||this.villagePlacementError('farm',x,y,null,crop))continue;
        farm=new Building('farm',x,y,owner,true);farm.crop=crop;farm.settlementId=settlement.id;farm.factionName=settlement.name;
        this.buildings.push(farm);this.ensureInventories();break;
      }
    }
    if(farm)settlement.base.neutralFarmEstablished=true;
    if(!farm||!this.linkOpen(farm,store))return farm;
    if(this.units.some(u=>u.owner===owner&&u.health>0&&u.task?.type==='farm'&&u.task.target===farm.id))return farm;
    const home=this.buildings.find(b=>b.owner===owner&&b.type==='house'&&b.alive);
    const worker=home&&settlement.people.find(u=>u.location?.kind==='resident'&&u.location.settlementId===home.id&&!u.mobilized);
    if(worker){const exit=this.neutralWorkExit(home,farm);if(exit&&this.releaseResident(worker.id,home,exit)){
      worker.homeVillageId=home.id;this.assignFarm(worker,farm);
    }}
    return farm;
  };
  Game.prototype.ensureNeutralMill=function(owner){
    if(![1,2].includes(owner))return null;
    const settlement=this.neutralSettlement(owner),market=settlement?.market,home=this.buildings.find(b=>b.owner===owner&&b.type==='house'&&b.alive);
    if(!market||!home)return null;
    let mill=this.buildings.find(b=>b.owner===owner&&b.type==='mill'&&b.alive);
    if(!mill&&!settlement.base.neutralMillEstablished){
      const cx=Math.floor(market.x),cy=Math.floor(market.y);
      for(let radius=2;radius<=12&&!mill;radius++)for(let dy=-radius;dy<=radius&&!mill;dy++)for(let dx=-radius;dx<=radius;dx++){
        if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;
        const x=cx+dx,y=cy+dy;
        if(Math.hypot(x+.5-market.x,y+.5-market.y)>12||this.villagePlacementError('mill',x,y))continue;
        mill=new Building('mill',x,y,owner,true);mill.settlementId=settlement.id;mill.factionName=settlement.name;
        this.buildings.push(mill);this.ensureInventories();break;
      }
    }
    if(mill)settlement.base.neutralMillEstablished=true;
    if(!mill||!this.linkOpen(mill,market))return mill;
    if(this.units.some(u=>u.owner===owner&&u.health>0&&u.task?.type==='production'&&u.task.target===mill.id))return mill;
    const worker=settlement.people.find(u=>u.location?.kind==='resident'&&u.location.settlementId===home.id&&!u.mobilized);
    if(worker){const exit=this.neutralWorkExit(home,mill);if(exit&&this.releaseResident(worker.id,home,exit)){
      worker.homeVillageId=home.id;
      const error=this.assignProduction(worker,mill);
      if(error)this.assignEnter(worker,home);
      else worker.autoArtisan=true;
    }}
    return mill;
  };
  Game.prototype.ensureNeutralBakery=function(owner){
    if(![1,2].includes(owner))return null;
    const settlement=this.neutralSettlement(owner),market=settlement?.market,home=this.buildings.find(b=>b.owner===owner&&b.type==='house'&&b.alive);
    if(!market||!home||settlement.people.length<4)return null;
    const store=this.communalStores(owner)[0];if(!store)return null;
    settlement.base.neutralKnowledge??=['insediamento','molitoria','fornace'];
    let bakery=this.buildings.find(b=>b.owner===owner&&b.type==='bakery'&&b.alive);
    if(!bakery&&settlement.base.neutralBakeryEstablished)return null;
    const worker=settlement.people.find(u=>u.location?.kind==='resident'&&u.location.settlementId===home.id&&!u.mobilized)
      ||settlement.people.find(u=>u.location?.kind==='world'&&u.homeVillageId===home.id&&u.state==='idle'&&!u.task&&u.inventory.amount===0&&!u.mobilized);
    if(!worker)return bakery;
    if(!bakery){
      const cost=BUILD_COSTS.bakery;
      if(Object.entries(cost).some(([good,n])=>this.available(store,good)<n))return null;
      const exit=worker.location.kind==='resident'?this.findResidentExit(home):worker;
      if(!exit)return null;
      const cx=Math.floor(store.x),cy=Math.floor(store.y);
      for(let radius=2;radius<=12&&!bakery;radius++)for(let dy=-radius;dy<=radius&&!bakery;dy++)for(let dx=-radius;dx<=radius;dx++){
        if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;
        const x=cx+dx,y=cy+dy,candidate=new Building('bakery',x,y,owner,false);
        if(Math.hypot(candidate.x-market.x,candidate.y-market.y)>12||Math.hypot(candidate.x-home.x,candidate.y-home.y)>12||this.villagePlacementError('bakery',x,y)||this.pathToBuilding(exit,candidate,true)===null||this.pathToBuilding(store,candidate)===null)continue;
        bakery=candidate;bakery.settlementId=settlement.id;bakery.factionName=settlement.name;
        this.buildings.push(bakery);this.ensureInventories();
        store.neutralBuildMaterialsComplete=true;
        break;
      }
    }
    if(bakery)settlement.base.neutralBakeryEstablished=true;
    if(!bakery)return null;
    if(!bakery.built){
      if(this.units.some(u=>u.owner===owner&&u.health>0&&(u.task?.type==='build'&&u.task.target===bakery.id||u.task?.type==='haul'&&u.task.destination===bakery.id)))return bakery;
      if(worker.location.kind==='resident'&&!this.releaseResident(worker.id,home))return bakery;
      worker.homeVillageId=home.id;
      for(const[good,needed]of Object.entries(bakery.requiredMaterials||BUILD_COSTS.bakery)){
        const missing=Math.max(0,needed-(bakery.inventory.items[good]||0));
        if(!missing)continue;
        const error=this.assignHaul(worker,store,bakery,good,false);
        if(error){this.assignEnter(worker,home);return bakery;}
        worker.task.amount=Math.min(worker.task.amount,missing);
        return bakery;
      }
      if(!this.assignBuild(worker,bakery))this.assignEnter(worker,home);
      return bakery;
    }
    if(!this.linkOpen(bakery,market)||!this.linkOpen(bakery,home))return bakery;
    if(this.units.some(u=>u.owner===owner&&u.health>0&&u.task?.type==='production'&&u.task.target===bakery.id))return bakery;
    if(worker.location.kind==='resident'&&!this.releaseResident(worker.id,home))return bakery;
    const error=this.assignProduction(worker,bakery);
    if(error)this.assignEnter(worker,home);
    else{worker.homeVillageId=home.id;worker.autoArtisan=true;}
    return bakery;
  };
  Game.prototype.provisionNeutralMarketFood=function(settlement,store){
    const market=settlement?.market,population=settlement?.people.length||0;
    if(!market||!store||!population||!this.linkOpen(store,market))return 0;
    const target=Math.max(population*3,(window.TERRA_POPULATION?.arrivalFood||18)+population+1),reserve=population*2;
    const wanted=Math.min(Math.max(0,target-this.available(market,'food')),Math.max(0,this.available(store,'food')-reserve));
    return this.moveLinkedGoods(store,market,'food',wanted);
  };
  // One bounded route search also supplies the actual path when door-by-door A* hits its budget.
  Game.prototype.neutralMarketRoute=function(source,destination){
    if(this.world.size>128)return undefined;
    const starts=source.type?this.buildingDoors(source):[source],goals=new Set(this.buildingDoors(destination).map(p=>`${Math.floor(p.x)},${Math.floor(p.y)}`));
    if(!starts.length||!goals.size)return null;
    const key=(x,y)=>`${x},${y}`,seen=new Set(),queue=[];
    for(const point of starts){const x=Math.floor(point.x),y=Math.floor(point.y),k=key(x,y);if(!seen.has(k)){seen.add(k);queue.push({x,y,previous:-1});}}
    for(let i=0;i<queue.length;i++){
      const p=queue[i];if(goals.has(key(p.x,p.y))){
        const path=[];for(let cursor=i;queue[cursor].previous>=0;cursor=queue[cursor].previous)
          path.push({x:queue[cursor].x+.5,y:queue[cursor].y+.5});
        return path.reverse();
      }
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const x=p.x+dx,y=p.y+dy,k=key(x,y);
        if(x<0||y<0||x>=this.world.size||y>=this.world.size||seen.has(k))continue;
        if(!this.world.walkable(x,y,1,p,this.buildings))continue;
        seen.add(k);queue.push({x,y,previous:i});
      }
    }
    return null;
  };
  // Large maps plan at most 48 tiles per simulated day. Jobs stay in memory;
  // after a reload they restart from the markets, never from stale saved tiles.
  Game.prototype.neutralLargeMarketRoute=function(source,destination){
    this._neutralRouteJobs??=new Map();
    const id=`${source.id}:${destination.id}`,key=(x,y)=>`${x},${y}`;
    let job=this._neutralRouteJobs.get(id);
    if(!job){
      const starts=source.type?this.buildingDoors(source):[source],goalPoints=this.buildingDoors(destination);
      if(!starts.length||!goalPoints.length)return null;
      const goals=new Set(goalPoints.map(p=>key(Math.floor(p.x),Math.floor(p.y))));
      const open=new PathQueue(),seen=new Map();let order=0;
      const heuristic=(x,y)=>Math.min(...goalPoints.map(p=>Math.abs(x-Math.floor(p.x))+Math.abs(y-Math.floor(p.y))));
      for(const p of starts){const x=Math.floor(p.x),y=Math.floor(p.y),k=key(x,y);
        if(seen.has(k))continue;seen.set(k,{cost:0,from:null,start:{x:x+.5,y:y+.5}});
        open.push({x,y,cost:0,f:heuristic(x,y)*1.5,order:order++});
      }
      job={open,seen,goals,goalPoints,order,done:false,result:undefined,expanded:0,lastBatch:0};
      this._neutralRouteJobs.set(id,job);
    }
    if(job.done)return job.result;
    const heuristic=(x,y)=>Math.min(...job.goalPoints.map(p=>Math.abs(x-Math.floor(p.x))+Math.abs(y-Math.floor(p.y))));
    let batch=0;
    while(job.open.length&&batch<48){
      const p=job.open.pop(),k=key(p.x,p.y),record=job.seen.get(k);
      if(!record||p.cost!==record.cost)continue;
      batch++;job.expanded++;
      if(job.goals.has(k)){
        const path=[];let cursor=k;
        while(job.seen.get(cursor)?.from){const [x,y]=cursor.split(',').map(Number);path.push({x:x+.5,y:y+.5});cursor=job.seen.get(cursor).from;}
        job.result={start:job.seen.get(cursor).start,path:path.reverse()};job.done=true;break;
      }
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const x=p.x+dx,y=p.y+dy,nk=key(x,y),cost=p.cost+1;
        if(x<0||y<0||x>=this.world.size||y>=this.world.size||!this.world.walkable(x,y,1,p,this.buildings))continue;
        if((job.seen.get(nk)?.cost??Infinity)<=cost)continue;
        job.seen.set(nk,{cost,from:k,start:record.start});
        job.open.push({x,y,cost,f:cost+heuristic(x,y)*1.5,order:job.order++});
      }
    }
    job.lastBatch=batch;
    if(!job.done&&!job.open.length){job.done=true;job.result=null;}
    return job.result;
  };
  Game.prototype.neutralRouteWalkable=function(route){
    const points=[route.start,...route.path];
    return points.every((p,i)=>i===0||this.world.walkable(Math.floor(p.x),Math.floor(p.y),1,
      {x:Math.floor(points[i-1].x),y:Math.floor(points[i-1].y)},this.buildings));
  };
  // Reuse a grown resident as a merchant; agricultural and bakery workers remain assigned.
  Game.prototype.assignNeutralTradeCaravans=function(){
    if(this.world.size<=128&&this.totalDays%30!==0)return 0;
    let started=0;
    for(const owner of [1,2]){
      const settlement=this.neutralSettlement(owner),source=settlement?.market;
      if(!source||settlement.people.length<5||this.totalDays<(source.neutralTradeNextDay||0))continue;
      if(settlement.people.some(u=>u.task?.type==='caravan'))continue;
      const home=this.buildings.find(b=>b.owner===owner&&b.type==='house'&&b.alive);
      if(!home)continue;
      const role=settlement.people.find(u=>u.neutralTradeRole&&u.health>0);
      if(role&&(role.task||role.inventory.amount||role.location?.kind!=='world'&&role.location?.kind!=='resident'))continue;
      const trader=role||settlement.people.find(u=>u.location?.kind==='resident'&&u.location.settlementId===home.id&&!u.task&&!u.mobilized&&u.inventory.amount===0);
      if(!trader)continue;
      const offerGood=owner===1?'grain':'barley';
      if(this.available(source,offerGood)<30)continue;
      const wanted=owner===1?'barley':'grain',foodStock=this.available(source,'food')+(this.communalStores(owner)||[]).reduce((n,b)=>n+this.available(b,'food'),0);
      const options=[{owner:owner===1?2:1,good:wanted},{owner:3,good:'food'}]
        .map(o=>({...o,settlement:this.neutralSettlement(o.owner)}))
        .filter(o=>o.settlement?.market&&this.available(o.settlement.market,o.good)>=12&&(o.good!=='food'||foodStock<settlement.people.length*8))
        .sort((a,b)=>(b.settlement.market.demand[offerGood]||1)-(a.settlement.market.demand[offerGood]||1));
      let attemptedRoute=false,departed=false;
      for(const option of options){
        const destination=option.settlement.market;
        const longRoute=this.world.size>128?this.neutralLargeMarketRoute(source,destination):null;
        if(this.world.size>128&&longRoute===undefined)continue;
        attemptedRoute=true;
        if(this.world.size>128&&longRoute===null){this._neutralRouteJobs.delete(`${source.id}:${destination.id}`);continue;}
        if(this.world.size>128&&!this.neutralRouteWalkable(longRoute)){
          this._neutralRouteJobs.delete(`${source.id}:${destination.id}`);continue;
        }
        if(trader.location.kind==='resident'){
          const exit=this.neutralWorkExit(home,source);
          if(!exit||!this.releaseResident(trader.id,home,exit))break;
          trader.homeVillageId=home.id;
        }
        let draft=null;
        for(let offer=2;offer<=Math.min(8,trader.inventory.cap)&&!draft;offer++){
          const candidate={source,market:destination,trader,offerGood,offerQuantity:offer,good:option.good,quantity:2};
          if(!this.barterQuote(candidate))draft=candidate;
        }
        if(draft){
          if(this.world.size>128){
            const start=longRoute.start;
            const sourcePath=this.findPath(trader.x,trader.y,Math.floor(start.x),Math.floor(start.y),1);
            if(!sourcePath.length&&Math.hypot(trader.x-start.x,trader.y-start.y)>.18)continue;
            draft.precomputedSourcePath=sourcePath;draft.precomputedOutboundPath=longRoute.path;
          }else{
            const sourcePath=this.pathToBuilding(trader,source);
            const endpoint=sourcePath?.length?sourcePath[sourcePath.length-1]:trader;
            if(sourcePath===null)continue;
            const route=this.neutralMarketRoute(endpoint,destination);
            if(route===null)continue;
            if(route!==undefined)draft.precomputedOutboundPath=route;
          }
        }
        if(draft&&!this.assignCaravan(draft)){
          trader.neutralTradeRole=true;source.neutralTraderId=trader.id;source.neutralTradeSent=true;
          source.neutralTradeNextDay=this.totalDays+300;source.neutralTradeTrips=(source.neutralTradeTrips||0)+1;
          this.message(`${trader.name} parte da ${source.factionName} per barattare ${offerGood}.`);
          started++;departed=true;break;
        }
      }
      if(!departed&&attemptedRoute)source.neutralTradeNextDay=this.totalDays+300;
      if(trader.location.kind==='world'&&!trader.neutralTradeRole&&!trader.task)this.assignEnter(trader,home);
    }
    return started;
  };
  Game.prototype.neutralEconomyDay=function(){this.ensureMarkets();for(const f of FACTIONS){const s=this.neutralSettlement(f.owner);if(!s)continue;const store=this.communalStores?.(f.owner)?.[0];if(!store)continue;const population=s.people.length;this.ensureNeutralFarm(f.owner);this.ensureNeutralMill(f.owner);this.ensureNeutralBakery(f.owner);this.provisionNeutralMarketFood(s,store);if(this.totalDays%RULES.productionEveryDays===0&&population)this.assignNeutralFoodGatherer(s,store);this.assignNeutralBuildGatherer(s,store);s.base.foodShortage=s.people.filter(u=>u.hungry).length;if(s.market){const linkedStores=this.linkedBuildings(s.market,'warehouse').filter(w=>this.communalStores(f.owner).includes(w));for(const good of Object.keys(TERRA_GOODS)){const localStock=this.available(s.market,good)+linkedStores.reduce((sum,w)=>sum+this.available(w,good),0);s.market.demand[good]=Math.max(.5,Math.min(3,1.5-localStock/60));}}}this.assignNeutralTradeCaravans();};
  const newGame=Game.prototype.newGame;Game.prototype.newGame=function(seed){this._neutralRouteJobs=new Map();newGame.call(this,seed);if(window.__ENABLE_NEUTRALS__!==false)this.createNeutralSettlements();};
  const loadGame=Game.prototype.load;Game.prototype.load=function(){this._neutralRouteJobs=new Map();const ok=loadGame.call(this);if(ok&&window.__ENABLE_NEUTRALS__!==false)this.createNeutralSettlements();return ok;};
  const advanceDay=Game.prototype.advanceDay;Game.prototype.advanceDay=function(){advanceDay.call(this);this.neutralEconomyDay();};
  const assignHaul=Game.prototype.assignHaul;Game.prototype.assignHaul=function(u,source,destination,good,repeat=true,autoKeep=null,autoMax=null,autoVia=null,autoDue=false){if(!u||!owned(source,u.owner)||!owned(destination,u.owner))return'Accesso negato: persone e depositi devono appartenere allo stesso insediamento.';return assignHaul.call(this,u,source,destination,good,repeat,autoKeep,autoMax,autoVia,autoDue);};
  const assignProduction=Game.prototype.assignProduction;Game.prototype.assignProduction=function(u,b){if(!u||!owned(b,u.owner))return'Accesso negato: la fabbrica appartiene a un altro insediamento.';return assignProduction.call(this,u,b);};

  const selectionHTML=Game.prototype.selectionHTML;Game.prototype.selectionHTML=function(e){let html=selectionHTML.call(this,e);if(e instanceof Building&&e.owner>0&&e.settlementId){const s=this.neutralSettlement(e.owner);html+=`<p><b>${e.factionName}</b> · popolazione ${s?.people.length||0} · scorte e proprietà separate.</p>`;}return html;};
})();
