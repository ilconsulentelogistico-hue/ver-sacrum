// A warned conquered village can reclaim only people and goods with proven origin.
(() => {
  "use strict";
  const WARNING_DAYS=90;
  Game.prototype.villageRebellionEligible=function(base){
    if(!base||base.type!=="base"||base.owner!==0||base.integrationMode!=="military"||![1,2].includes(base.integratedFromOwner)||!Number.isFinite(base.unrestSinceDay)||this.totalDays-base.unrestSinceDay<WARNING_DAYS)return false;
    const people=this.units.filter(u=>u.owner===0&&u.health>0&&u.neutralSettlementId===base.settlementId);
    return people.length>0&&people.filter(u=>u.communityTrust<=25).length>=Math.ceil(people.length*2/3);
  };
  Game.prototype.triggerVillageRebellion=function(base){
    if(!this.villageRebellionEligible(base))return false;
    const owner=base.integratedFromOwner;
    const structures=this.buildings.filter(b=>b.owner===0&&b.integrationOriginOwner===owner);
    if(!structures.includes(base))return false;
    const structureIds=new Set(structures.map(b=>b.id));
    const people=this.units.filter(u=>u.owner===0&&u.neutralSettlementId===base.settlementId);
    const personIds=new Set(people.map(u=>u.id));
    // Reserve every exit before moving anyone, so a blocked house postpones the whole revolt.
    const exits=[],reserved=new Set();
    for(const u of this.units.filter(u=>u.location?.kind==="resident")){
      const house=this.findById(this.buildings,u.location.settlementId);
      if(!house)continue;
      const nextOwner=personIds.has(u.id)?owner:u.owner;
      const houseOwner=structureIds.has(house.id)?owner:house.owner;
      if(nextOwner===houseOwner)continue;
      const spot=this.buildingDoors(house).find(p=>{
        const key=`${Math.floor(p.x)},${Math.floor(p.y)}`;
        return !reserved.has(key)&&this.spawnPositionFree(p);
      });
      if(!spot){this.message("La rivolta attende un passaggio libero dagli alloggi.");return false;}
      reserved.add(`${Math.floor(spot.x)},${Math.floor(spot.y)}`);exits.push({u,house,spot});
    }
    for(const {u,house,spot} of exits)if(!this.releaseResident(u.id,house,spot))throw Error("Uscita riservata non disponibile durante la rivolta.");
    const keepsLocalWork=u=>personIds.has(u.id)&&["farm","production"].includes(u.task?.type)&&structureIds.has(u.task.target);
    for(const u of this.units){
      const target=u.task;
      if(personIds.has(u.id)&&!keepsLocalWork(u)||u.owner===0&&!personIds.has(u.id)&&target&&[target.target,target.source,target.market,target.home].some(id=>structureIds.has(id)))this.cancelTask(u);
      if(personIds.has(u.id)){
        u.owner=owner;u.mobilized=false;u.selected=false;
        if(u.homeVillageId&&!structureIds.has(u.homeVillageId))delete u.homeVillageId;
      }else if(u.owner===0&&structureIds.has(u.homeVillageId))delete u.homeVillageId;
    }
    for(const building of structures){
      building.owner=owner;
      building.assigned=building.assigned.filter(id=>{const u=this.findById(this.units,id);return u?.owner===owner&&u.task?.type==="farm"&&u.task.target===building.id;});
      if(Array.isArray(building.workers))building.workers=building.workers.filter(id=>{const u=this.findById(this.units,id);return u?.owner===owner&&u.task?.type==="production"&&u.task.target===building.id;});
    }
    for(const animal of this.animals){
      const nextOwner=animal.owner===0&&animal.integrationOriginOwner===owner?owner:animal.owner;
      const pen=this.findById(this.buildings,animal.penId);
      if(pen&&pen.owner!==nextOwner){pen.animalIds=(pen.animalIds||[]).filter(id=>id!==animal.id);animal.penId=null;}
      animal.owner=nextOwner;
    }
    this.groupSelection=this.groupSelection.filter(u=>u.owner===0);
    if(this.selected instanceof Unit&&this.selected.owner!==0)this.selected=base;
    if(this.lastSelectedUnit?.owner!==0)this.lastSelectedUnit=this.units.find(u=>u.owner===0&&u.health>0)||null;
    delete base.integratedFromOwner;delete base.integrationMode;delete base.occupationSinceDay;delete base.occupationStability;delete base.unrestSinceDay;
    base.rebelledDay=this.totalDays;base.loyalty=10;base.resistance=100;base.playerInfluence=0;base.relationship="hostile";base.integrationSinceDay=null;base.siegeReadyDay=null;base.siegeDefenderIds=[];
    this.message(`${base.factionName||"Il villaggio"} si ribella: persone e beni della comunità tornano indipendenti.`);
    this.renderPolitics?.();return true;
  };
  const diplomacyAction=Game.prototype.diplomacyAction;
  Game.prototype.diplomacyAction=function(owner,kind,transactionId){
    const settlement=kind==="gift"?this.neutralSettlement(owner):null;
    const trustFor=Number.isFinite(settlement?.base.rebelledDay)?settlement.id:null;
    const result=diplomacyAction.call(this,owner,kind,transactionId);
    if(trustFor&&result.ok&&!result.replayed)for(const u of this.units.filter(u=>u.owner===owner&&u.health>0&&u.neutralSettlementId===trustFor))u.communityTrust=Math.min(100,(u.communityTrust??0)+TERRA_POLITICS.giftLoyalty);
    return result;
  };
  const occupationDay=Game.prototype.occupationDay;
  Game.prototype.occupationDay=function(){occupationDay.call(this);if(this.totalDays%30!==0)return;for(const base of [...this.buildings])if(this.villageRebellionEligible(base))this.triggerVillageRebellion(base);};
})();
