// One physical person carries the offer out and the received goods back.
(() => {
'use strict';
Game.prototype.assignCaravan=function(d){this.ensureMarkets();const error=this.barterQuote(d);if(error)return error;const u=d.trader;if(u.inventory.amount)return 'Deposita prima il carico.';const path=d.precomputedSourcePath??this.pathToBuilding(u,d.source);if(path===null||d.precomputedOutboundPath===undefined&&this.pathToBuilding(path.length?path[path.length-1]:u,d.market)===null)return 'Percorso commerciale non raggiungibile.';this.cancelTask(u);u.task={type:'caravan',barter:true,source:d.source.id,market:d.market.id,offerGood:d.offerGood,offerQuantity:d.offerQuantity,good:d.good,quantity:d.quantity,phase:'source',traded:false};if(d.precomputedOutboundPath){u.task.marketPath=d.precomputedOutboundPath;const endpoint=path.length?path[path.length-1]:{x:u.x,y:u.y};u.task.returnPath=[endpoint,...d.precomputedOutboundPath].slice(0,-1).reverse();}u.state='caravan';u.path=path;return null;};
Game.prototype.caravanThreat=function(u){return this.raiders.some(r=>r.health>0&&dist(u,r)<=4);};
Game.prototype.updateCaravan=function(u,dt){
 const t=u.task;if(!t?.barter){this.cancelTask(u);return;}
 const source=this.findById(this.buildings,t.source),market=this.findById(this.buildings,t.market);
 if(!source?.alive||source.owner!==u.owner){this.cancelTask(u);this.message('Mercato di origine perduto: il carico resta alla carovana.');return;}
 if(t.phase==='market'&&(!market?.alive||!market.built)){t.phase='return';u.path=[];delete t.returnPath;}
 const target=t.phase==='market'?market:source;t.threatened=this.caravanThreat(u);if(t.threatened){u.path=[];return;}
 if(this.buildingDistance(u,target)>1.15){if(!u.path.length){
  if(t.blocked&&this.totalDays<(t.retryAfterDay||0))return;
  let p;
  if(this.world.size>128&&this.neutralLargeMarketRoute){
   const origin={id:`caravan-${u.id}-${t.phase}-${Math.floor(u.x)}-${Math.floor(u.y)}`,x:u.x,y:u.y};
   const route=this.neutralLargeMarketRoute(origin,target);
   if(route===undefined)return;
   if(route&&this.neutralRouteWalkable(route))p=route.path;
   else p=null;
   this._neutralRouteJobs.delete(`${origin.id}:${target.id}`);
  }else p=this.pathToBuilding(u,target);
  if(p===null){
   t.blocked=true;t.retryAfterDay=this.totalDays+5;t.blockedAttempts=(t.blockedAttempts||0)+1;
   if(t.phase==='market'&&t.blockedAttempts>=3){t.phase='return';t.blocked=false;t.blockedAttempts=0;this.message('Strada commerciale chiusa: la carovana riporta la merce.');}
   return;
  }
  u.path=p;t.blockedAttempts=0;
 }t.blocked=false;this.followPath(u,dt,1.45);return;}
 if(t.phase==='source'){const d={...t,trader:u,source,market};const error=this.barterQuote(d);if(error){this.cancelTask(u);this.message(error);return;}source.inventory.items[t.offerGood]-=t.offerQuantity;u.inventory.type=t.offerGood;u.inventory.amount=t.offerQuantity;t.phase='market';u.path=t.marketPath||[];delete t.marketPath;return;}
 if(t.phase==='market'){const result=this.tradeAtMarket({...t,trader:u,source,market});t.traded=result.ok;t.phase='return';u.path=t.returnPath||[];delete t.returnPath;if(!result.ok)this.message(result.error+' La carovana riporta l’offerta.');return;}
 const n=Math.min(u.inventory.amount,this.freeSpace(source));if(n){source.inventory.items[u.inventory.type]=(source.inventory.items[u.inventory.type]||0)+n;u.inventory.amount-=n;}if(u.inventory.amount)return;u.inventory.type=null;this.cancelTask(u);this.message('Carovana rientrata: merci depositate nel mercato.');
};
const update=Game.prototype.updateUnit;Game.prototype.updateUnit=function(u,dt){if(u.state==='caravan')return this.updateCaravan(u,dt);return update.call(this,u,dt);};
const status=Game.prototype.unitStatus;Game.prototype.unitStatus=function(u){return u.task?.type==='caravan'?(u.task.threatened?'carovana: minaccia':u.task.blocked?'carovana: percorso bloccato':u.task.phase==='source'?'carovana: carico al mercato':u.task.phase==='market'?'carovana: viaggio di baratto':'carovana: ritorno e scarico'):status.call(this,u);};
Game.prototype.startTradeCaravan=function(){const error=this.assignCaravan(this.tradeDraft());$('#tradeStatus').textContent=error||'Carovana assegnata.';if(error)return false;this.save(true);this.closeManagement();return true;};
const init=Game.prototype.initUI;Game.prototype.initUI=function(){init.call(this);$('#sendCaravan').onclick=()=>this.startTradeCaravan();};
})();
