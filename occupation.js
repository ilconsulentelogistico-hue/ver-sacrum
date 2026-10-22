// Trust belongs to each original person; occupation cannot erase skills or cargo.
(() => {
  'use strict';
  const clamp=n=>Math.max(0,Math.min(100,Math.round(n)));
  Game.prototype.ensureOccupation=function(){for(const base of this.buildings.filter(b=>b.type==='base'&&b.owner===0&&b.integratedFromOwner&&b.alive)){
    if(!Number.isFinite(base.occupationSinceDay))base.occupationSinceDay=this.totalDays;
    if(base.unrestSinceDay===undefined)base.unrestSinceDay=null;
    // Older saves can identify village structures by settlementId, but not unmarked warehouses.
    for(const building of this.buildings)if(building.owner===0&&building.settlementId===base.settlementId&&building.integrationOriginOwner===undefined)building.integrationOriginOwner=base.integratedFromOwner;
    const initial=base.integrationMode==='military'?35:80;
    const people=this.units.filter(u=>u.owner===0&&u.health>0&&u.neutralSettlementId===base.settlementId);
    for(const u of people)if(!Number.isFinite(u.communityTrust))u.communityTrust=initial;
    base.occupationStability=people.length?clamp(people.reduce((sum,u)=>sum+u.communityTrust,0)/people.length):initial;
  }};
  Game.prototype.occupationDay=function(){this.ensureOccupation();if(this.totalDays%30!==0)return;for(const base of this.buildings.filter(b=>b.type==='base'&&b.owner===0&&b.integratedFromOwner&&b.alive)){
    const people=this.units.filter(u=>u.owner===0&&u.health>0&&u.neutralSettlementId===base.settlementId);
    for(const u of people){let change=u.hungry?-8:(u.fedUntil??-1)>this.totalDays?2:0;
      if(u.health<50)change-=4;
      if(u.task&&u.task.type!=='attack')change+=2;
      u.communityTrust=clamp((u.communityTrust??(base.integrationMode==='military'?35:80))+change);
    }
    base.occupationStability=people.length?clamp(people.reduce((sum,u)=>sum+u.communityTrust,0)/people.length):base.occupationStability;
    base.loyalty=base.occupationStability;
    const discontent=people.filter(u=>u.communityTrust<=25).length;
    if(base.integrationMode==='military'&&people.length&&this.totalDays-base.occupationSinceDay>=90&&discontent>=Math.ceil(people.length*2/3)){
      if(base.unrestSinceDay===null){base.unrestSinceDay=this.totalDays;this.message(`${base.factionName||'Il villaggio'} è in disordine: nutri, cura e impiega gli abitanti.`);}
    }else base.unrestSinceDay=null;
  }};
  const advance=Game.prototype.advanceDay;
  Game.prototype.advanceDay=function(){const result=advance.call(this);this.occupationDay();return result;};
  const load=Game.prototype.load;
  Game.prototype.load=function(){const ok=load.call(this);if(ok)this.ensureOccupation();return ok;};
  const snapshot=Game.prototype.snapshot;
  Game.prototype.snapshot=function(){this.ensureOccupation();return snapshot.call(this);};
  const selection=Game.prototype.selectionHTML;
  Game.prototype.selectionHTML=function(e){let html=selection.call(this,e);if(e instanceof Building&&e.type==='base'&&e.owner===0&&e.integratedFromOwner){this.ensureOccupation();html+=`<p>${e.integrationMode==='military'?'Conquistata':'Aderente'} · fiducia ${e.occupationStability}/100 · persone originarie ${this.units.filter(u=>u.owner===0&&u.health>0&&u.neutralSettlementId===e.settlementId).length}.</p>${Number.isFinite(e.unrestSinceDay)?`<p>Disordine: ${Math.min(90,this.totalDays-e.unrestSinceDay)}/90 giorni. Cibo, cure e lavoro possono fermarlo.</p>`:''}`;}return html;};
})();
