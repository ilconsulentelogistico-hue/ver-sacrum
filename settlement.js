// Settlement links, communal construction stock and autonomous artisan commissions.
(() => {
'use strict';
const RANGE=12,EDIBLE=['food','milk','bread','barleyBread'];
const operational=b=>b&&b.alive&&b.built;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pair=(a,b)=>[a.id,b.id].sort().join(':');
window.VER_SACRUM={version:1,linkRange:RANGE,edible:EDIBLE};
const ensure=Game.prototype.ensureInventories;
Game.prototype.ensureInventories=function(){ensure.call(this);const store=this.buildings.find(b=>b.owner===0&&b.type==='warehouse'&&b.alive);if(store)this.stock=store.inventory.items;};
Game.prototype.ensureSettlement=function(){
 this.ensureInventories();
 for(const b of this.buildings){b.linkSettings??={};b.returnDue??={};if(TERRA_RECIPES[b.type]){b.desiredWorkers??=1;b.returnPercent??=75;}}
};
Game.prototype.linkCompatible=function(a,b){if(a===b||a.owner!==b.owner||!operational(a)||!operational(b)||dist(a,b)>RANGE)return false;const types=[a.type,b.type];return types.includes('base')&&types.includes('warehouse')||types.includes('farm')&&types.includes('warehouse')||types.includes('market')&&(types.includes('warehouse')||types.includes('house')||types.some(t=>TERRA_RECIPES[t]))||types.includes('house')&&types.some(t=>TERRA_RECIPES[t]);};
Game.prototype.linkPolicy=function(a,b){const holder=a.id<b.id?a:b;holder.linkSettings??={};return holder.linkSettings[pair(a,b)]??={enabled:true,goods:{}};};
Game.prototype.linkOpen=function(a,b){return this.linkCompatible(a,b)&&this.linkPolicy(a,b).enabled!==false;};
Game.prototype.linkedBuildings=function(b,type){return this.buildings.filter(a=>(!type||a.type===type)&&this.linkOpen(a,b));};
Game.prototype.linkGoodPolicy=function(a,b,good){const p=this.linkPolicy(a,b);p.goods??={};return p.goods[good]??={import:true,export:true,min:good==='planks'?20:0,keep:good==='planks'?20:good==='food'?30:good==='wood'?30:good==='stone'?20:0};};
Game.prototype.communalStores=function(owner=0,anchor=null){return this.buildings.filter(b=>b.type==='warehouse'&&b.owner===owner&&operational(b)&&this.linkedBuildings(b,'base').some(t=>!anchor||t.id===anchor.id));};
Game.prototype.fundingBaseAt=function(x,y){return this.buildings.filter(b=>b.owner===0&&b.type==='base'&&operational(b)).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0]||null;};
Game.prototype.fundingBaseForItems=function(items){const first=items.find(item=>!item.reuseId);if(!first)return null;const base=this.fundingBaseAt(first.x,first.y);return base&&items.every(item=>item.reuseId||this.fundingBaseAt(item.x,item.y)?.id===base.id)?base:null;};
Game.prototype.defaultFundingBase=function(){return this.buildings.find(b=>b.owner===0&&b.type==='base'&&operational(b)&&!b.integratedFromOwner)||this.buildings.find(b=>b.owner===0&&b.type==='base'&&operational(b))||null;};
Game.prototype.communalStock=function(owner=0,anchor=null){const items={};for(const b of this.communalStores(owner,anchor))for(const k of Object.keys(TERRA_GOODS))items[k]=(items[k]||0)+this.available(b,k);return items;};
Game.prototype.canPay=function(cost,anchor=this.defaultFundingBase()){this.ensureInventories();if(!cost||!anchor||anchor.owner!==0)return false;const items=this.communalStock(0,anchor);return Object.entries(cost).every(([k,n])=>Number.isSafeInteger(n)&&n>=0&&(items[k]||0)>=n);};
Game.prototype.pay=function(cost,anchor=this.defaultFundingBase()){if(!this.canPay(cost,anchor))return false;const stores=this.communalStores(0,anchor);for(const[k,n]of Object.entries(cost)){let left=n;for(const b of stores){const used=Math.min(left,this.available(b,k));b.inventory.items[k]=(b.inventory.items[k]||0)-used;left-=used;if(!left)break;}}return true;};
Game.prototype.moveLinkedGoods=function(a,b,good,wanted){const reserve=b.type==='warehouse'&&[1,2].includes(b.owner)&&!b.neutralBuildMaterialsComplete&&((b.inventory.items.wood||0)<BUILD_COSTS.bakery.wood||(b.inventory.items.stone||0)<BUILD_COSTS.bakery.stone)&&!['wood','stone'].includes(good)?48:0;const n=Math.max(0,Math.floor(Math.min(wanted,this.available(a,good),Math.max(0,this.freeSpace(b)-reserve))));if(n){a.inventory.items[good]-=n;b.inventory.items[good]=(b.inventory.items[good]||0)+n;}return n;};
Game.prototype.initializeSettlement=function(){
 this.ensureSettlement();
 for(const base of this.buildings.filter(b=>b.type==='base'&&b.alive)){
  base.cityName??=base.factionName||'Ver Sacrum';
  if(base.economyVersion===1&&!Object.values(base.inventory.items).some(n=>n>0))continue;
  let warehouse=this.buildings.find(b=>b.type==='warehouse'&&b.owner===base.owner&&b.alive&&dist(b,base)<=RANGE);
  if(!warehouse){let spot=null;for(let r=1;r<=5&&!spot;r++)for(let dy=-r;dy<=r&&!spot;dy++)for(let dx=-r;dx<=r;dx++){const x=Math.floor(base.x)+dx,y=Math.floor(base.y)+dy;if(this.world.walkable(x,y,1,null,this.buildings)&&!this.buildings.some(b=>b.alive&&Math.floor(b.x)===x&&Math.floor(b.y)===y)){spot={x,y};break;}}if(!spot)continue;warehouse=new Building('warehouse',spot.x,spot.y,base.owner,true);this.buildings.push(warehouse);this.ensureInventories();}
  const old=base.inventory.items;warehouse.inventory.capacity=Math.max(warehouse.inventory.capacity,Object.values(old).reduce((a,b)=>a+b,0)+Object.values(warehouse.inventory.items).reduce((a,b)=>a+b,0));
  for(const[k,n]of Object.entries(old))warehouse.inventory.items[k]=(warehouse.inventory.items[k]||0)+n;base.inventory.items={};base.economyVersion=1;
 }
 this.ensureInventories();
 for(const u of this.units)if(u.task?.type==='caravan'&&!u.task.barter)this.cancelTask(u);
};
const newGame=Game.prototype.newGame;Game.prototype.newGame=function(seed){newGame.call(this,seed);this.initializeSettlement();this.year=800;this.economyTimer=0;this.updateUI();};
const load=Game.prototype.load;Game.prototype.load=function(){const ok=load.call(this);if(ok){this.initializeSettlement();this.economyTimer=0;this.updateUI();}return ok;};
// Opening a site transfers its full material requirement once from linked warehouses.
const place=Game.prototype.placeBuild;Game.prototype.placeBuild=function(type,x,y,crop=null){const before=new Set(this.buildings.map(b=>b.id));place.call(this,type,x,y,crop);const site=this.buildings.find(b=>!before.has(b.id));if(site&&this.pay(site.requiredMaterials,this.fundingBaseAt(site.x,site.y))){site.inventory.items={...site.requiredMaterials};this.message('Materiali assegnati al cantiere dai magazzini collegati al totem.');}};
const nearest=Game.prototype.nearestStorage;Game.prototype.nearestStorage=function(u){
 if(u.owner===0)return nearest.call(this,u);
 this.ensureInventories();const stores=this.communalStores(u.owner).filter(b=>this.freeSpace(b)>0).sort((a,b)=>dist(u,a)-dist(u,b));
 return stores.find(b=>{const route=this.neutralMarketRoute?.(u,b);return (route===undefined?this.pathToBuilding(u,b):route)!==null;})||null;
};
// Food is consumed once per person per 30 days, including artisans.
Game.prototype.foodStoresFor=function(u){
 const withLinkedStores=places=>{
  if(u.owner===0&&!u.neutralSettlementId)return places;
  const result=[...places],seen=new Set(result.map(b=>b.id));
  for(const market of places.filter(b=>b.type==='market'))for(const store of [...this.linkedBuildings(market,'warehouse'),...this.linkedBuildings(market,'bakery')]){
   if(store.owner===u.owner&&!seen.has(store.id)){result.push(store);seen.add(store.id);}
  }
  return result;
 };
 const factory=u.task?.type==='production'?this.findById(this.buildings,u.task.target):null;
 if(factory)return withLinkedStores([factory,...this.linkedBuildings(factory,'market')]);
 const home=this.buildings.find(b=>b.id===(u.location.kind==='resident'?u.location.settlementId:u.homeVillageId));
 if(home?.alive)return withLinkedStores([home,...this.linkedBuildings(home,'market')]);
 // Exiles and directly commanded workers use their communal supplies before a village exists.
 const adoptedBase=u.owner===0&&u.neutralSettlementId?this.buildings.find(b=>b.owner===0&&b.type==='base'&&b.settlementId===u.neutralSettlementId&&b.integratedFromOwner):null;
 return this.communalStores(u.owner,adoptedBase);
};
Game.prototype.takeFood=function(stores,amount,neutralRations=false){
 const available=(b,k)=>Math.max(0,this.available(b,k)-(neutralRations&&b.owner>0&&b.type==='bakery'?0:(b.returnDue?.[k]||0)));
 if(stores.reduce((sum,b)=>sum+EDIBLE.reduce((n,k)=>n+available(b,k),0),0)<amount)return false;
 let left=amount;
 for(const b of stores)for(const k of EDIBLE){
  const n=Math.min(left,available(b,k));if(!n)continue;
  if(neutralRations&&b.owner>0&&b.type==='bakery'){
   const due=b.returnDue?.[k]||0,unreserved=Math.max(0,this.available(b,k)-due);
   b.returnDue[k]=Math.max(0,due-Math.max(0,n-unreserved));
  }
  b.inventory.items[k]=(b.inventory.items[k]||0)-n;left-=n;
 }
 return true;
};
Game.prototype.feedPeople=function(forDay=this.totalDays){const due=this.units.filter(u=>u.health>0&&(u.fedUntil??-1)<=forDay).sort((a,b)=>(b.unfedDays||0)-(a.unfedDays||0)||(a.fedUntil??-1)-(b.fedUntil??-1));for(const u of due){u.hungry=!this.takeFood(this.foodStoresFor(u),1,u.owner>0);if(!u.hungry)u.fedUntil=forDay+30;}};
Game.prototype.settlementTick=function(){
 this.ensureSettlement();const markets=this.buildings.filter(b=>b.type==='market'&&operational(b));
 // A ready market feeds the press before the same carrier is reassigned upstream.
 for(const press of this.buildings.filter(b=>b.owner===0&&b.type==='press'&&operational(b))){
  const recipes=[...TERRA_RECIPES.press].sort((a,b)=>(a.id===press.preferredRecipeId?-1:0)-(b.id===press.preferredRecipeId?-1:0));
  const supplies=this.linkedBuildings(press,'market');let scheduled=false;
  for(const market of supplies){
   for(const recipe of recipes)for(const[good,quantity]of Object.entries(recipe.inputs)){
    const needed=Math.max(0,quantity*2-this.available(press,good));
    if(!needed||!this.available(market,good)||this.freeSpace(press)<=0||this.units.some(u=>u.task?.autoLink&&u.task.destination===press.id&&u.task.good===good))continue;
    const idle=this.units.filter(u=>u.owner===0&&u.health>0&&u.location?.kind==='world'&&!u.task&&!u.mobilized&&u.inventory.amount===0).sort((a,b)=>dist(a,market)-dist(b,market));
    for(const u of idle)if(this.assignHaul(u,market,press,good,false,0,Math.min(needed,u.inventory.cap))===null){scheduled=true;break}
    if(scheduled)break;
   }
   if(scheduled)break;
  }
  if(scheduled)continue;
  // If the market lacks fruit, move a load from its linked warehouse first.
  for(const market of supplies){
   for(const store of this.linkedBuildings(market,'warehouse').filter(w=>w.owner===0)){
    for(const recipe of recipes)for(const good of Object.keys(recipe.inputs)){
     const policy=this.linkGoodPolicy(store,market,good),keep=Math.max(0,policy.keep||0),amount=Math.min(12,Math.max(0,this.available(store,good)-keep));
     if(!policy.export||this.available(market,good)>0||!amount||this.freeSpace(market)<=0||this.units.some(u=>u.task?.autoLink&&u.task.source===store.id&&u.task.destination===market.id&&u.task.good===good))continue;
     const idle=this.units.filter(u=>u.owner===0&&u.health>0&&u.location?.kind==='world'&&!u.task&&!u.mobilized&&u.inventory.amount===0).sort((a,b)=>dist(a,store)-dist(b,store));
     for(const u of idle)if(this.assignHaul(u,store,market,good,false,keep,Math.min(amount,u.inventory.cap))===null){scheduled=true;break}
     if(scheduled)break;
    }
    if(scheduled)break;
   }
   if(scheduled)break;
  }
 }
 // Fields may feed a nearby linked warehouse directly. Goods remain local if the link is closed or the warehouse is full.
 for(const farm of this.buildings.filter(b=>b.type==='farm'&&operational(b))){
  const good=farm.crop;
  if(!TERRA_CROPS[good])continue;
  for(const warehouse of this.linkedBuildings(farm,'warehouse')){
   const p=this.linkGoodPolicy(farm,warehouse,good);
   if(!p.export)continue;
   const available=Math.max(0,this.available(farm,good)-Math.max(0,p.keep||0));
   if(available<=0||this.freeSpace(warehouse)<=0)continue;
   if(farm.owner===0){
    if(this.units.some(u=>u.task?.autoLink&&u.task.source===farm.id&&u.task.good===good))continue;
    const idle=this.units.filter(u=>u.owner===0&&u.health>0&&u.location?.kind==='world'&&!u.task&&!u.mobilized&&u.inventory.amount===0).sort((a,b)=>dist(a,farm)-dist(b,farm));
    for(const u of idle)if(this.assignHaul(u,farm,warehouse,good,false,Math.max(0,p.keep||0))===null)break;
   }else this.moveLinkedGoods(farm,warehouse,good,available);
  }
 }
 for(const m of markets)for(const w of this.linkedBuildings(m,'warehouse')){
  for(const good of Object.keys(TERRA_GOODS)){const p=this.linkGoodPolicy(w,m,good);let n=this.available(w,good);if(p.import&&n<p.min){this.moveLinkedGoods(m,w,good,p.min-n);continue;}if(p.export&&(w.owner!==0||!['wine','oil'].includes(good)||p.sellCommunal===true)&&n>p.keep){const due=EDIBLE.includes(good)?this.units.filter(u=>u.owner===w.owner&&u.health>0).length:0;const keep=Math.max(p.keep,due),amount=Math.min(12,Math.max(0,n-keep));if(w.owner===0&&['grapes','olives'].includes(good)){
   if(amount>0&&this.freeSpace(m)>0&&!this.units.some(u=>u.task?.autoLink&&u.task.source===w.id&&u.task.destination===m.id&&u.task.good===good)){
    const idle=this.units.filter(u=>u.owner===0&&u.health>0&&u.location?.kind==='world'&&!u.task&&!u.mobilized&&u.inventory.amount===0).sort((a,b)=>dist(a,w)-dist(b,w));
    for(const u of idle)if(this.assignHaul(u,w,m,good,false,keep,Math.min(amount,u.inventory.cap))===null)break;
   }
  }else this.moveLinkedGoods(w,m,good,amount);}}
 }
 for(const b of this.buildings.filter(b=>operational(b)&&TERRA_RECIPES[b.type])){
  const markets=this.linkedBuildings(b,'market');
  // Finished products carry a precise communal quota, even if a store is temporarily full.
  for(const good of Object.keys(b.returnDue)){
   let due=b.returnDue[good];for(const m of markets)for(const w of this.linkedBuildings(m,'warehouse').filter(w=>this.communalStores(b.owner).includes(w))){if(!this.linkGoodPolicy(w,m,good).import)continue;if(b.owner===0&&b.type==='press'){
    if(due>0&&this.available(b,good)>0&&this.freeSpace(w)>0&&!this.units.some(u=>u.task?.autoDue&&u.task.source===b.id&&u.task.good===good)){
     const idle=this.units.filter(u=>u.owner===0&&u.health>0&&u.location?.kind==='world'&&!u.task&&!u.mobilized&&u.inventory.amount===0).sort((a,c)=>dist(a,b)-dist(c,b));
     for(const u of idle)if(this.assignHaul(u,b,w,good,false,0,Math.min(due,this.available(b,good),u.inventory.cap),m.id,true)===null)break;
    }
   }else due-=this.moveLinkedGoods(b,w,good,due);}b.returnDue[good]=Math.max(0,due);
  }
  const outputs=new Set(TERRA_RECIPES[b.type].flatMap(r=>Object.keys(r.outputs)));
  for(const good of outputs)for(const m of markets){const keep=Math.max(0,b.returnDue[good]||0),amount=Math.max(0,this.available(b,good)-keep);if(b.owner===0&&b.type==='press'){
   if(amount>0&&this.freeSpace(m)>0&&!this.units.some(u=>u.task?.autoLink&&u.task.source===b.id&&u.task.good===good)){
    const idle=this.units.filter(u=>u.owner===0&&u.health>0&&u.location?.kind==='world'&&!u.task&&!u.mobilized&&u.inventory.amount===0).sort((a,c)=>dist(a,b)-dist(c,b));
    for(const u of idle)if(this.assignHaul(u,b,m,good,false,keep,Math.min(amount,u.inventory.cap))===null)break;
   }
  }else this.moveLinkedGoods(b,m,good,amount);}
  for(const m of markets){for(const r of TERRA_RECIPES[b.type])for(const[k,n]of Object.entries(r.inputs)){
   let needed=Math.max(0,n*2-this.available(b,k));
   if(b.owner===0&&b.type==='press'){
    if(needed>0&&this.available(m,k)>0&&this.freeSpace(b)>0&&!this.units.some(u=>u.task?.autoLink&&u.task.destination===b.id&&u.task.good===k)){
     const idle=this.units.filter(u=>u.owner===0&&u.health>0&&u.location?.kind==='world'&&!u.task&&!u.mobilized&&u.inventory.amount===0).sort((a,c)=>dist(a,m)-dist(c,m));
     for(const u of idle)if(this.assignHaul(u,m,b,k,false,0,Math.min(needed,u.inventory.cap))===null)break;
    }
   }else needed-=this.moveLinkedGoods(m,b,k,needed);
   // Neutral workshops can draw through the same open market link if its shelves are full.
   if(b.owner>0&&needed>0)for(const w of this.linkedBuildings(m,'warehouse')){
    if(w.owner!==b.owner||!this.linkGoodPolicy(w,m,k).export)continue;
    needed-=this.moveLinkedGoods(w,b,k,needed);if(needed<=0)break;
   }
  }for(const k of EDIBLE)this.moveLinkedGoods(m,b,k,Math.max(0,b.desiredWorkers-EDIBLE.reduce((n,k)=>n+this.available(b,k),0)));}
  let workers=this.factoryWorkers(b);const extra=workers.filter(u=>u.autoArtisan).slice(Math.max(0,b.desiredWorkers-workers.filter(u=>!u.autoArtisan).length));for(const u of extra){this.cancelTask(u);u.autoArtisan=false;const home=this.findById(this.buildings,u.homeVillageId);if(home?.alive)this.assignEnter(u,home);}
  workers=this.factoryWorkers(b);
  if(workers.length<b.desiredWorkers&&markets.length&&EDIBLE.some(k=>this.available(b,k)>0))for(const home of this.linkedBuildings(b,'house')){
   const u=this.units.find(u=>u.owner===b.owner&&u.health>0&&u.location.kind==='resident'&&u.location.settlementId===home.id&&!u.mobilized);if(!u)continue;
   if(this.pathToBuilding(home,b)===null)continue;
   if(this.releaseResident(u.id,home)){const error=this.assignProduction(u,b);if(!error){u.homeVillageId=home.id;u.autoArtisan=true;}}if(this.factoryWorkers(b).length>=b.desiredWorkers)break;
  }
 }
 this.feedPeople();
};
const update=Game.prototype.update;Game.prototype.update=function(dt){if(this.paused||this.suspended||this.gameEnded)return;this.economyTimer=(this.economyTimer||0)+dt;if(this.economyTimer>=1){this.economyTimer=0;this.settlementTick();}return update.call(this,dt);};
// Intercept recipe progression, preserving other building systems.
const updateBuilding=Game.prototype.updateBuilding;Game.prototype.updateBuilding=function(b,dt){if(!TERRA_RECIPES[b.type])return updateBuilding.call(this,b,dt);if(!operational(b))return;const workers=this.factoryWorkers(b).filter(u=>this.buildingDistance(u,b)<=1.15&&(u.fedUntil??-1)>this.totalDays);if(!workers.length)return;const old=b.batch?{...b.batch,outputs:{...b.batch.outputs}}:null;updateBuilding.call(this,b,dt);if(old&&!b.batch){b.returnDue??={};b.returnRemainder??={};for(const[k,n]of Object.entries(old.outputs)){const exact=n*(b.returnPercent??75)+(b.returnRemainder[k]||0);b.returnDue[k]=(b.returnDue[k]||0)+Math.floor(exact/100);b.returnRemainder[k]=exact%100;}}};
const assignProduction=Game.prototype.assignProduction;Game.prototype.assignProduction=function(u,b){const error=assignProduction.call(this,u,b);if(!error){u.autoArtisan=false;b.desiredWorkers=Math.max(b.desiredWorkers||0,this.factoryWorkers(b).length);}return error;};
// Remove manufactured goods from the build pool unless returned to a connected store.
BUILD_COSTS.tower={wood:8,planks:6,stone:8};
TERRA_CONSTRUCTION.requirements.sawmill=['insediamento'];
Game.prototype.openLinks=function(b=this.selected){this.ensureSettlement();this.linkFocus=b instanceof Building?b.id:this.buildings.find(b=>b.owner===0)?.id;this.pauseBeforeLinks=this.paused;this.pointerCancel();this.renderLinks();this.showManagement('linksDialog');};
Game.prototype.renderLinks=function(){const own=this.buildings.filter(b=>b.owner===0&&b.alive),select=$('#linkBuilding');select.innerHTML=own.map(b=>`<option value="${b.id}">${BUILD_LABEL[b.type]} (${Math.floor(b.x)},${Math.floor(b.y)})</option>`).join('');select.value=own.some(b=>b.id===this.linkFocus)?this.linkFocus:own[0]?.id||'';const b=own.find(b=>b.id===select.value);if(!b)return;this.linkFocus=b.id;$('#cityForm').hidden=b.type!=='base';$('#cityName').value=b.cityName||'';const linked=own.filter(a=>this.linkCompatible(a,b)),list=$('#linkPair');list.innerHTML=linked.map(a=>`<option value="${a.id}">${BUILD_LABEL[a.type]} (${Math.floor(a.x)},${Math.floor(a.y)})</option>`).join('');list.value=linked[0]?.id||'';$('#linksList').textContent=linked.length?linked.map(a=>`${BUILD_LABEL[a.type]}: ${this.linkOpen(a,b)?'aperto':'chiuso'}`).join(' · '):'Nessuna struttura compatibile entro 12 tile.';$('#linkGood').innerHTML=Object.keys(TERRA_GOODS).map(k=>`<option value="${k}">${this.resourceName(k)}</option>`).join('');$('#linkGood').value='wood';$('#factoryPolicy').hidden=!TERRA_RECIPES[b.type];$('#factoryWorkers').value=b.desiredWorkers||0;$('#factoryReturn').value=b.returnPercent??75;$('#pressRecipeLabel').hidden=b.type!=='press';$('#pressRecipe').value=b.type==='press'?(b.preferredRecipeId||''):'';this.renderLinkPolicy();};
Game.prototype.renderLinkPolicy=function(){const a=this.findById(this.buildings,this.linkFocus),b=this.findById(this.buildings,$('#linkPair').value);if(!a||!b)return;const p=this.linkGoodPolicy(a,b,$('#linkGood').value);$('#linkEnabled').checked=this.linkOpen(a,b);$('#linkImport').checked=p.import;$('#linkExport').checked=p.export;const communal=a.owner===0&&['wine','oil'].includes($('#linkGood').value)&&[a.type,b.type].includes('warehouse')&&[a.type,b.type].includes('market');$('#linkCommunitySaleLabel').hidden=!communal;$('#linkCommunitySale').checked=communal&&p.sellCommunal===true;$('#linkMin').value=p.min;$('#linkKeep').value=p.keep;};
const init=Game.prototype.initUI;Game.prototype.initUI=function(){init.call(this);$('#settlementBtn').onclick=()=>this.openLinks();$('#cityForm').onsubmit=e=>{e.preventDefault();const b=this.findById(this.buildings,this.linkFocus),name=$('#cityName').value.trim();if(b?.type!=='base'||!name||name.length>60||/[<>]/.test(name))return;b.cityName=name;this.save(true);$('#linkStatus').textContent='Nome dell’insediamento aggiornato.';};$('#closeLinks').onclick=()=>this.closeManagement();$('#linksDialog').addEventListener('close',()=>{if(!this.suspended)this.setPaused(this.pauseBeforeLinks);});$('#linkBuilding').onchange=()=>{this.linkFocus=$('#linkBuilding').value;this.renderLinks();};for(const id of ['linkPair','linkGood'])$('#'+id).onchange=()=>this.renderLinkPolicy();$('#linkForm').onsubmit=e=>{e.preventDefault();const a=this.findById(this.buildings,this.linkFocus),b=this.findById(this.buildings,$('#linkPair').value),min=Number($('#linkMin').value),keep=Number($('#linkKeep').value);if(!a||!b||![min,keep].every(n=>Number.isSafeInteger(n)&&n>=0)||min>keep){$('#linkStatus').textContent='Il minimo deve essere intero, non negativo e non superiore alla scorta da trattenere.';return;}this.linkPolicy(a,b).enabled=$('#linkEnabled').checked;Object.assign(this.linkGoodPolicy(a,b,$('#linkGood').value),{min,keep,import:$('#linkImport').checked,export:$('#linkExport').checked,sellCommunal:$('#linkCommunitySaleLabel').hidden?false:$('#linkCommunitySale').checked});$('#linkStatus').textContent=this.save(true)?'Collegamento salvato.':'Impostazione applicata; salvataggio non riuscito.';};$('#factoryPolicy').onsubmit=e=>{e.preventDefault();const b=this.findById(this.buildings,this.linkFocus),n=Number($('#factoryWorkers').value),p=Number($('#factoryReturn').value);if(!b||!Number.isSafeInteger(n)||n<0||n>8||!Number.isSafeInteger(p)||p<0||p>100)return;const recipeId=$('#pressRecipe').value;if(b.type==='press'&&recipeId&&!TERRA_RECIPES.press.some(r=>r.id===recipeId))return;b.desiredWorkers=n;b.returnPercent=p;if(b.type==='press')b.preferredRecipeId=recipeId||null;this.save(true);$('#linkStatus').textContent='Produzione impostata.';};};
const selection=Game.prototype.selectionHTML;Game.prototype.selectionHTML=function(e){let html=selection.call(this,e);if(e instanceof Building){if(e.type==='base')html+=`<p>Città di <b>${esc(e.cityName||e.factionName||'Ver Sacrum')}</b> · segnaposto dell’insediamento.</p>`;if(e.owner===0)html+='<button id="openLinks" type="button">Collegamenti e produzione</button>';if(TERRA_RECIPES[e.type]&&e.built)html+=`<p>Artigiani ${this.factoryWorkers(e).length}/${e.desiredWorkers??1} · ritorno comunitario ${e.returnPercent??75}%. Senza razioni la lavorazione si ferma.</p>`;}return html;};
const ui=Game.prototype.updateUI;Game.prototype.updateUI=function(){ui.call(this);const s=this.communalStock();for(const[k,id]of [['wood','woodVal'],['stone','stoneVal'],['iron','ironVal']])if($('#'+id))$('#'+id).textContent=s[k]||0;if($('#foodVal'))$('#foodVal').textContent=EDIBLE.reduce((n,k)=>n+(s[k]||0),0);const btn=$('#openLinks');if(btn)btn.onclick=()=>this.openLinks();};
const drawBuilding=Game.prototype.drawBuilding;Game.prototype.drawBuilding=function(b){const p=this.worldToScreen(b.x*TILE,b.y*TILE),z=this.camera.zoom,c=this.ctx;
 drawBuilding.call(this,b);
 if(this.selected?.id===b.id){c.save();c.setLineDash?.([4*z,3*z]);for(const a of this.buildings.filter(a=>this.linkCompatible(a,b))){const q=this.worldToScreen(a.x*TILE,a.y*TILE);c.strokeStyle=this.linkOpen(a,b)?'#e0c27a':'#8c4940';c.lineWidth=2*z;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();}c.restore();}
};
})();
