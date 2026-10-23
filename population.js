// Food-backed village growth. Artisans remain the same people and keep their beds.
(() => {
'use strict';
const RULES={baseHousing:0,districtHousing:5,mealEveryDays:30,foodPerPerson:1,minimumResidents:2,settledDays:150,arrivalFood:18};window.TERRA_POPULATION=RULES;
window.TERRA_NUTRITION={hungryWorkFactor:0.7,restHealPerDay:0.5};
Game.prototype.nutritionWorkFactor=function(u){return u.hungry?window.TERRA_NUTRITION.hungryWorkFactor:1;};
Game.prototype.villagePeople=function(b){return this.units.filter(u=>u.health>0&&u.owner===b.owner&&(u.location.kind==='resident'?u.location.settlementId===b.id:u.homeVillageId===b.id));};
Game.prototype.populationCap=function(){return this.buildings.filter(b=>b.owner===0&&b.type==='house'&&b.alive&&b.built).length*5;};
Game.prototype.villageFoodStores=function(b){
 const markets=this.linkedBuildings(b,'market'),stores=[b,...markets];
 if(b.owner>0||b.owner===0&&b.settlementId&&this.buildings.some(base=>base.owner===0&&base.type==='base'&&base.settlementId===b.settlementId&&base.integratedFromOwner)){const seen=new Set(stores.map(x=>x.id));for(const market of markets)for(const w of [...this.linkedBuildings(market,'warehouse'),...this.linkedBuildings(market,'bakery')])if(w.owner===b.owner&&!seen.has(w.id)){stores.push(w);seen.add(w.id);}}
 return stores;
};
Game.prototype.populationFood=function(b=null){this.ensureInventories();const stores=b?this.villageFoodStores(b):this.buildings.filter(b=>b.owner===0&&b.alive&&b.built&&['warehouse','market','house','sawmill','mill','bakery'].includes(b.type));return stores.reduce((n,b)=>n+['bread','barleyBread','food','milk'].reduce((s,k)=>s+this.available(b,k),0),0);};
Game.prototype.spendPopulationFood=function(n,b){return this.takeFood(b?this.villageFoodStores(b):this.communalStores(),n,!!b&&b.owner>0);};
Game.prototype.populationInfo=function(){const count=this.units.filter(u=>u.owner===0&&u.health>0).length,capacity=this.populationCap();return{count,capacity,free:Math.max(0,capacity-count),overcrowded:Math.max(0,count-capacity),meal:count,food:this.populationFood(),nextMealIn:30-this.totalDays%30};};
Game.prototype.admissionBlocker=function(b){if(!b||b.type!=='house'||!b.alive||!b.built)return 'Distretto non operativo';const people=this.villagePeople(b);if(people.length>=5)return 'Distretto pieno';if(people.length<2)return 'Servono 2 abitanti domiciliati';if(people.some(u=>(u.fedUntil??-1)<=this.totalDays))return 'Abitanti senza razioni';if(!this.linkedBuildings(b,'market').length)return 'Serve un mercato collegato';if(this.populationFood(b)<RULES.arrivalFood+people.length+1)return 'Cibo insufficiente per crescita e riserva';return null;};
const day=Game.prototype.buildingDay;Game.prototype.buildingDay=function(b){if(b.type!=='house')return day.call(this,b);if(this.admissionBlocker(b)){b.birthDays=0;return;}if(++b.birthDays<RULES.settledDays)return;if(!this.spendPopulationFood(RULES.arrivalFood,b))return;const u=new Unit(NAMES[this.rng.int(0,NAMES.length-1)],b.x,b.y,this.rng);u.owner=b.owner;u.homeVillageId=b.id;u.location={kind:'resident',settlementId:b.id};if(b.owner>0||b.integratedFromOwner||b.settlementId&&this.buildings.some(base=>base.type==='base'&&base.owner===0&&base.settlementId===b.settlementId&&base.integratedFromOwner))u.neutralSettlementId=b.settlementId;this.units.push(u);b.residents.push(u.id);b.birthDays=0;this.message('Il villaggio accoglie un nuovo abitante.');};
const enter=Game.prototype.enterResident;Game.prototype.enterResident=function(u,b){if(b&&this.villagePeople(b).filter(p=>p!==u).length>=5){this.message('Distretto pieno: i letti degli artigiani restano occupati.');return;}const result=enter.call(this,u,b);if(u.location.kind==='resident')u.homeVillageId=b.id;return result;};
const advance=Game.prototype.advanceDay;Game.prototype.advanceDay=function(){
  this.feedPeople?.(this.totalDays+1);const result=advance.call(this);
  for(const u of this.units){
    if(u.health<=0)continue;
    if(u.hungry){
      u.unfedDays=(u.unfedDays||0)+1;
      if(u.unfedDays>5){const loss=Math.min(1,u.health);u.health-=loss;u.nutritionDamage=(u.nutritionDamage||0)+loss;}
    }else{
      u.unfedDays=0;
      const healed=Math.min(1,u.nutritionDamage||0,u.maxHealth-u.health);
      u.health+=healed;u.nutritionDamage=Math.max(0,(u.nutritionDamage||0)-healed);
      if((u.nutritionDamage||0)===0&&u.location?.kind==='resident'&&(u.fedUntil??-1)>this.totalDays){
        const home=this.buildings.find(b=>b.id===u.location.settlementId&&b.owner===u.owner&&b.type==='house'&&b.built&&b.alive);
        if(home)u.health=Math.min(u.maxHealth,u.health+window.TERRA_NUTRITION.restHealPerDay);
      }
    }
  }
  return result;
};
const community=Game.prototype.renderCommunity;Game.prototype.renderCommunity=function(){community.call(this);const local=this.selected?.type==='house'?this.selected:null;const p=local?{count:this.villagePeople(local).length,capacity:5,food:this.populationFood(local)}:this.populationInfo();$('#populationSummary').textContent=`Popolazione ${p.count} · Alloggi ${p.capacity} · Cibo ${p.food}. Una razione ogni 30 giorni per abitante, artigiani inclusi.`;$('#populationDistricts').innerHTML=this.buildings.filter(b=>b.owner===0&&b.type==='house'&&(!local||b===local)).map(b=>`<p>Distretto: ${this.villagePeople(b).length}/5 · ${this.admissionBlocker(b)||`crescita ${b.birthDays}/150 giorni`}</p>`).join('')||'<p>Costruisci un Distretto e un Mercato, poi fai entrare almeno due esuli.</p>';};
})();
