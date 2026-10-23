// Individual objects have exactly one location; views never own copies.
(() => {
  'use strict';
  const RULES=Object.freeze({bagCapacity:4,rackCapacity:8,slots:Object.freeze(['hand','body','head'])});
  const CATALOG=Object.freeze({tunic:Object.freeze({name:'Tunica',slot:'body'}),axe:Object.freeze({name:'Ascia',slot:'hand'}),cap:Object.freeze({name:'Copricapo',slot:'head'})});
  window.TERRA_EQUIPMENT={rules:RULES,catalog:CATALOG};
  const same=(a,b)=>a&&b&&a.kind===b.kind&&a.holder===b.holder&&a.slot===b.slot&&a.x===b.x&&a.y===b.y;
  const owns=(l,kind,id)=>l.kind===kind&&l.holder===id;
  Game.prototype.personEquipment=function(id){
    const items=(this.gear||[]).filter(i=>i.location.holder===id&&['bag','equipped'].includes(i.location.kind));
    return {bag:items.filter(i=>i.location.kind==='bag'),slots:Object.fromEntries(RULES.slots.map(slot=>[slot,items.find(i=>i.location.kind==='equipped'&&i.location.slot===slot)||null]))};
  };
  Game.prototype.transferEquipment=function(personId,itemId,expected,destination){
    const u=this.units.find(u=>u.id===personId&&u.owner===0&&u.health>0),item=(this.gear||[]).find(i=>i.id===itemId);
    if(!u||!item)return 'Persona o oggetto non disponibile';
    if(!same(item.location,expected))return 'Oggetto già spostato: aggiorna la vista';
    if(!destination||!['bag','equipped','storage'].includes(destination.kind))return 'Destinazione non valida';
    const source=item.location;
    const near=b=>u.location.kind==='resident'?u.location.settlementId===b.id:Math.hypot(u.x-b.x,u.y-b.y)<=2;
    const rack=id=>this.buildings.find(b=>b.id===id&&b.owner===0&&b.alive&&b.built&&['base','warehouse','house'].includes(b.type)&&near(b));
    const accessible=l=>['bag','equipped'].includes(l.kind)?l.holder===personId:l.kind==='storage'?!!rack(l.holder):l.kind==='ground'&&u.location.kind==='world'&&Math.hypot(u.x-l.x,u.y-l.y)<=1.5;
    if(!accessible(source))return 'Oggetto non accessibile';
    if(destination.kind==='storage'?!rack(destination.holder):destination.holder!==personId)return 'Destinazione non accessibile';
    const target=destination.kind==='equipped'?{kind:'equipped',holder:personId,slot:destination.slot}:{kind:destination.kind,holder:destination.holder};
    if(same(source,target))return null;
    if(target.kind==='equipped'){
      if(!RULES.slots.includes(target.slot)||CATALOG[item.type].slot!==target.slot)return 'Slot incompatibile';
      if(this.gear.some(i=>i!==item&&same(i.location,target)))return 'Slot occupato: rimuovi prima l’oggetto';
    }else{
      const capacity=target.kind==='bag'?RULES.bagCapacity:RULES.rackCapacity;
      if(this.gear.filter(i=>i!==item&&owns(i.location,target.kind,target.holder)).length>=capacity)return 'Spazio esaurito';
    }
    // Validation is complete before the single atomic ownership update.
    item.location=target;return null;
  };
  // Manual tailoring creates one owned object from goods already delivered to a nearby rack.
  Game.prototype.personCombatDamage=function(u,raw){
    const tunic=(this.gear||[]).some(i=>i.type==='tunic'&&i.location.kind==='equipped'&&i.location.holder===u.id&&i.location.slot==='body');
    return Math.max(1,raw-(tunic?1:0));
  };
  Game.prototype.craftTunic=function(personId,storeId){
    const u=this.units.find(u=>u.id===personId&&u.owner===0&&u.health>0);
    if(!u)return 'Abitante non disponibile';
    const b=this.buildings.find(b=>b.id===storeId&&b.owner===0&&b.alive&&b.built&&['base','warehouse','house'].includes(b.type));
    if(!b||!(u.location.kind==='resident'?u.location.settlementId===b.id:Math.hypot(u.x-b.x,u.y-b.y)<=2))return 'Deposito non accessibile';
    if((b.inventory?.items?.cloth||0)<2)return 'Servono 2 tessuti nel deposito locale';
    if((this.gear||[]).filter(i=>owns(i.location,'bag',personId)).length>=RULES.bagCapacity)return 'Borsa oggetti piena';
    const id=crypto.randomUUID?.()||Math.random().toString(36).slice(2);
    b.inventory.items.cloth-=2;
    this.gear.push({id:'sewn-'+id,type:'tunic',location:{kind:'bag',holder:personId}});
    u.gain('weaving',1);
    return null;
  };
  Game.prototype.personAttackDamage=function(u,raw){
    const axe=(this.gear||[]).some(i=>i.type==='axe'&&i.location.kind==='equipped'&&i.location.holder===u.id&&i.location.slot==='hand');
    return raw+(axe?1:0);
  };
  Game.prototype.personGatherTimeFactor=function(u,r){
    if(r?.type!=='wood')return 1;
    return (this.gear||[]).some(i=>i.type==='axe'&&i.location.kind==='equipped'&&i.location.holder===u.id&&i.location.slot==='hand')?.85:1;
  };
  Game.prototype.forgeBronzeAxe=function(personId,foundryId){
    const u=this.units.find(u=>u.id===personId&&u.owner===0&&u.health>0);
    if(!u)return 'Abitante non disponibile';
    const b=this.buildings.find(b=>b.id===foundryId&&b.owner===0&&b.type==='foundry'&&b.alive&&b.built);
    if(!b||u.location.kind!=='world'||Math.hypot(u.x-b.x,u.y-b.y)>2)return 'Fonderia non accessibile';
    if((b.inventory?.items?.bronze||0)<2||(b.inventory?.items?.wood||0)<1)return 'Servono 2 bronzi e 1 legna nella fonderia';
    if((this.gear||[]).filter(i=>owns(i.location,'bag',personId)).length>=RULES.bagCapacity)return 'Borsa oggetti piena';
    const id=crypto.randomUUID?.()||Math.random().toString(36).slice(2);
    b.inventory.items.bronze-=2;b.inventory.items.wood-=1;
    this.gear.push({id:'forged-'+id,type:'axe',location:{kind:'bag',holder:personId}});
    u.gain('metallurgy',1);
    return null;
  };
  const newGame=Game.prototype.newGame;
  Game.prototype.newGame=function(seed){newGame.call(this,seed);this.gear=this.units.map(u=>({id:'gear-'+u.id,type:'tunic',location:{kind:'equipped',holder:u.id,slot:'body'}}));};
  const recover=Game.prototype.recoverDeadCargo;
  Game.prototype.recoverDeadCargo=function(){
    for(const item of this.gear||[]){
      const l=item.location,holder=['bag','equipped'].includes(l.kind)?this.units.find(u=>u.id===l.holder):l.kind==='storage'?this.buildings.find(b=>b.id===l.holder):null;
      if(holder&&holder.health<=0)item.location={kind:'ground',x:holder.x,y:holder.y};
    }
    recover.call(this);
  };
})();
