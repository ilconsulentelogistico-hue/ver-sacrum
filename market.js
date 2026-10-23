// Local redistribution and external barter. No money is created or spent.
(() => {
'use strict';
const BASE={food:3,wood:2,stone:3,iron:8,copper:6,tin:9,bronze:13,clay:2,pottery:7,planks:4,grain:2,barley:2,flour:3,barleyFlour:3,bread:4,barleyBread:4,milk:3,forage:1,wool:4,cloth:6,grapes:4,olives:4,wine:8,oil:9};
window.TERRA_MARKET={rules:{version:2},basePrices:BASE};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const int=n=>Number.isSafeInteger(n)&&n>0;
Game.prototype.ensureMarkets=function(){this.ensureInventories();for(const b of this.buildings)if(b.type==='market'){b.money=0;b.demand??={};for(const k of Object.keys(TERRA_GOODS))b.demand[k]=Math.max(.1,Math.min(10,b.demand[k]||1));b.tradeLedger??=[];b.observedPrices??={};}for(const u of this.units)u.money=0;};
Game.prototype.marketPrice=function(m,good){if(!m||!TERRA_GOODS[good])return null;return (BASE[good]||3)*Math.max(.5,Math.min(3,30/(10+(m.inventory.items[good]||0))))*(m.demand[good]||1);};
Game.prototype.barterQuote=function(d,atDestination=false){
 const {source,market,trader,offerGood,offerQuantity,good,quantity}=d;
 if(!source?.alive||!source.built||source.type!=='market'||source.owner!==trader?.owner||!market?.alive||!market.built||market.type!=='market'||market.owner===source.owner)return 'Servono mercati operativi di comunità diverse e un tuo mercante.';
 if(!trader||trader.health<=0||trader.location?.kind!=='world'||!TERRA_GOODS[good]||!TERRA_GOODS[offerGood]||good===offerGood||!int(quantity)||!int(offerQuantity))return 'Indica due merci diverse e quantità intere positive.';
 if(quantity>trader.inventory.cap||offerQuantity>trader.inventory.cap)return 'Il carico supera la capacità del mercante.';
 if(atDestination?(trader.inventory.type!==offerGood||trader.inventory.amount!==offerQuantity):this.available(source,offerGood)<offerQuantity)return 'Merce offerta insufficiente.';
 if(this.available(market,good)<quantity)return 'Il mercato esterno non ha la quantità richiesta.';
 if(this.freeSpace(market)+quantity<offerQuantity)return 'Il mercato esterno non ha spazio per ricevere il carico.';
 if(this.marketPrice(market,offerGood)*offerQuantity*TERRA_SKILLS.tradeFactor(trader.skills.trading)+1e-8<this.marketPrice(market,good)*quantity)return 'Offerta insufficiente per le necessità di questa comunità.';
 return null;
};
Game.prototype.recordMarketObservation=function(market,goods){
 market.observedPrices??={};
 for(const good of new Set(goods))market.observedPrices[good]={day:this.totalDays,price:Math.round(this.marketPrice(market,good)*100)/100,stock:this.available(market,good)};
};
Game.prototype.tradeAtMarket=function(d){
 const error=this.barterQuote(d,true);if(error)return{ok:false,error};
 if(dist(d.trader,d.market)>1.15)return{ok:false,error:'Il mercante deve arrivare al mercato.'};
 const {market,trader,offerGood,offerQuantity,good,quantity}=d;
 this.recordMarketObservation(market,[offerGood,good]);
 market.inventory.items[good]-=quantity;market.inventory.items[offerGood]=(market.inventory.items[offerGood]||0)+offerQuantity;
 trader.inventory={...trader.inventory,type:good,amount:quantity};trader.gain('trading',Math.max(1,quantity/5));return{ok:true};
};
Game.prototype.tradeDraft=function(){return{trader:this.units.find(u=>u.id===$('#tradePerson').value),source:this.buildings.find(b=>b.id===$('#tradeSource').value),market:this.buildings.find(b=>b.id===$('#tradeMarket').value),offerGood:$('#tradeOffer').value,offerQuantity:Number($('#tradeOfferQuantity').value),good:$('#tradeGood').value,quantity:Number($('#tradeQuantity').value)};};
Game.prototype.tradeValuePreview=function(d){
 if(!d.market||!d.trader||!TERRA_GOODS[d.good]||!TERRA_GOODS[d.offerGood]||!int(d.quantity)||!int(d.offerQuantity))return '';
 const offered=this.marketPrice(d.market,d.offerGood)*d.offerQuantity*TERRA_SKILLS.tradeFactor(d.trader.skills.trading);
 const requested=this.marketPrice(d.market,d.good)*d.quantity;
 if(!Number.isFinite(offered)||!Number.isFinite(requested)||requested<=0)return '';
 return `Valore indicativo: offerta ${offered.toFixed(1)} · richiesta ${requested.toFixed(1)} (rapporto ${(offered/requested).toFixed(2)}×). Sono valori di confronto, non moneta.`;
};
Game.prototype.marketObservationsText=function(market,goods){
 if(!market)return 'Scegli un mercato di destinazione.';
 const entries=[...new Set(goods)].filter(good=>TERRA_GOODS[good]).map(good=>{const seen=market.observedPrices?.[good];return seen?`${this.resourceName(good)}: valore ${seen.price}, scorta ${seen.stock} (giorno ${seen.day})`:`${this.resourceName(good)}: mai osservato`;});
 return `Ultima visita della carovana: ${entries.join(' · ')}. Le osservazioni possono essere superate.`;
};
Game.prototype.updateTradePreview=function(){const d=this.tradeDraft(),error=this.barterQuote(d);$('#tradeObservations').textContent=this.marketObservationsText(d.market,[d.offerGood,d.good]);$('#tradeBalances').textContent=d.source&&d.market?`Scorte: origine ${d.source.inventory.items[d.offerGood]||0} ${this.resourceName(d.offerGood)} · destinazione ${d.market.inventory.items[d.good]||0} ${this.resourceName(d.good)}.`:'Costruisci un mercato e seleziona un’altra comunità.';const estimate=this.tradeValuePreview(d);const deal=`Dai ${d.offerQuantity} ${this.resourceName(d.offerGood)}, ricevi ${d.quantity} ${this.resourceName(d.good)}`;$('#tradePreview').textContent=`${error?`Non si può partire: ${error}`:`${deal}. Scorte e accettazione si verificano all’arrivo.`}${estimate?' '+estimate:''}`;const send=$('#sendCaravan');send.disabled=!!error;send.textContent=error?'Invia carovana':`Invia ${d.trader?.name||'la carovana'} · ${deal}`;return d;};
Game.prototype.renderTrade=function(){this.ensureMarkets();const fill=(id,list)=>{const e=$(id),old=e.value;e.innerHTML=list.map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join('');e.value=list.some(([v])=>v===old)?old:list[0]?.[0]||'';};fill('#tradePerson',this.units.filter(u=>u.owner===0&&u.health>0&&u.location.kind==='world'&&!u.inventory.amount).map(u=>[u.id,u.name]));for(const [id,own]of [['#tradeSource',true],['#tradeMarket',false]])fill(id,this.buildings.filter(b=>b.type==='market'&&b.built&&b.alive&&(b.owner===0)===own).map(b=>[b.id,`${b.factionName||'Comunità'} (${Math.floor(b.x)}, ${Math.floor(b.y)})`]));for(const id of ['#tradeGood','#tradeOffer'])fill(id,Object.keys(TERRA_GOODS).map(k=>[k,this.resourceName(k)]));this.updateTradePreview();};
Game.prototype.openTrade=function(){const d=$('#tradeDialog');this.pauseBeforeTrade=this.paused;this.pointerCancel();this.orderMode=null;this.buildMode=null;this.renderTrade();$('#tradeStatus').textContent='';if(!d.open)this.showManagement('tradeDialog');return true;};
Game.prototype.confirmTrade=function(){this.updateTradePreview();return false;};
const init=Game.prototype.initUI;Game.prototype.initUI=function(){init.call(this);$('#tradeBtn').onclick=()=>this.openTrade();$('#confirmTrade').hidden=true;$('#closeTrade').onclick=()=>this.closeManagement();for(const id of ['tradePerson','tradeSource','tradeMarket','tradeOffer','tradeOfferQuantity','tradeGood','tradeQuantity'])$('#'+id).onchange=()=>this.updateTradePreview();$('#tradeForm').onsubmit=e=>{e.preventDefault();this.updateTradePreview();};$('#tradeDialog').addEventListener('close',()=>{if(!this.suspended)this.setPaused(this.pauseBeforeTrade);});};
})();
