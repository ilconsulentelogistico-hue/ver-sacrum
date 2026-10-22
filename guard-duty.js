// A mobilized person can guard a real village post and return after an attack.
(() => {
  'use strict';
  const attackReach=1.15,postReach=1.6;
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const threats=game=>[...game.raiders.filter(r=>r.health>0),...game.animals.filter(a=>a.type==='wolf'&&a.owner<0&&a.health>0)];
  const threatensPost=(enemy,post)=>enemy.raidStoreId===post.id||(enemy.lootFood>0&&enemy.lootStoreId===post.id);
  const keepDuty=(person,action)=>{
    person._keepGuardDuty=true;
    try{return action();}finally{delete person._keepGuardDuty;}
  };
  const cancel=Game.prototype.cancelTask;
  Game.prototype.cancelTask=function(person){
    const keep=person._keepGuardDuty;
    cancel.call(this,person);
    if(person.guardDuty&&!keep){person.guardDuty=false;person.guardPostId=null;person.guardCheckTimer=0;person.guardRepathTimer=0;}
  };
  Game.prototype.toggleGuardDuty=function(person){
    if(!person||person.owner!==0||person.health<=0||person.location?.kind!=='world')return 'Scegli un abitante sulla mappa.';
    if(person.guardDuty){this.cancelTask(person);this.message(`${person.name} lascia la guardia.`);return null;}
    if(!person.mobilized)return 'Mobilita prima questa persona dalla Comunità.';
    if((person.morale??70)<25||person.health<=35)return 'Questa persona deve recuperare salute e morale prima della guardia.';
    const post=this.buildings.filter(b=>b.owner===0&&b.type==='base'&&b.alive&&b.built)
      .sort((a,b)=>distance(person,a)-distance(person,b))[0];
    if(!post||distance(person,post)>18||this.pathToBuilding(person,post)===null)return 'Porta la sentinella vicino a una tua base raggiungibile.';
    this.cancelTask(person);
    person.guardDuty=true;person.guardPostId=post.id;person.guardCheckTimer=0;person.guardRepathTimer=0;
    this.message(`${person.name} sorveglia ${post.cityName||'questa base'} e affronta le minacce vicine.`);
    return null;
  };
  Game.prototype.assignTowerGuard=function(person,post){
    if(!person||person.owner!==0||person.health<=0||person.location?.kind!=='world')return 'Scegli un abitante sulla mappa.';
    if(!person.mobilized)return 'Mobilita prima questa persona dalla Comunità.';
    if((person.morale??70)<25||person.health<=35)return 'Questa persona deve recuperare salute e morale prima della guardia.';
    if(!post||post.type!=='tower'||post.owner!==0||!post.built||!post.alive)return 'Tocca una tua torre completata.';
    if(this.units.some(u=>u!==person&&u.guardDuty&&u.guardPostId===post.id))return 'La torre ha già una sentinella.';
    if(distance(person,post)>18||this.pathToBuilding(person,post)===null)return 'Porta la sentinella vicino a una torre raggiungibile.';
    this.cancelTask(person);
    person.guardDuty=true;person.guardPostId=post.id;person.guardCheckTimer=0;person.guardRepathTimer=0;
    this.message(`${person.name} presidia la torre: osserva e difende solo quando è al posto.`);
    return null;
  };
  Game.prototype.assignWarehouseGuard=function(person,post){
    if(!person||person.owner!==0||person.health<=0||person.location?.kind!=='world')return 'Scegli un abitante sulla mappa.';
    if(!person.mobilized)return 'Mobilita prima questa persona dalla Comunità.';
    if((person.morale??70)<25||person.health<=35)return 'Questa persona deve recuperare salute e morale prima della guardia.';
    if(!post||post.type!=='warehouse'||post.owner!==0||!post.built||!post.alive)return 'Tocca un tuo magazzino completato.';
    if(this.units.some(u=>u!==person&&u.guardDuty&&u.guardPostId===post.id))return 'Il magazzino ha già una sentinella.';
    if(distance(person,post)>18||this.pathToBuilding(person,post)===null)return 'Porta la sentinella vicino a un magazzino raggiungibile.';
    this.cancelTask(person);
    person.guardDuty=true;person.guardPostId=post.id;person.guardCheckTimer=0;person.guardRepathTimer=0;
    this.message(`${person.name} sorveglia il magazzino e affronta le minacce vicine.`);
    return null;
  };
  const order=Game.prototype.applyOrder;
  Game.prototype.applyOrder=function(type,pos,tx,ty,person=this.selected){
    if(type!=='tower-duty'&&type!=='warehouse-duty')return order.call(this,type,pos,tx,ty,person);
    const warehouse=type==='warehouse-duty';
    const post=this.nearestAt(this.buildings,pos,.9,b=>b.type===(warehouse?'warehouse':'tower')&&b.owner===0&&b.alive&&b.built);
    const error=warehouse?this.assignWarehouseGuard(person,post):this.assignTowerGuard(person,post);
    if(error)this.message(error);
    else {this.orderMode=null;this.syncModeButtons();this.updateUI();}
  };
  const help=Game.prototype.orderHelp;
  Game.prototype.orderHelp=function(type){return type==='tower-duty'?'Tocca una tua torre completata per assegnare una persona mobilitata.':type==='warehouse-duty'?'Tocca un tuo magazzino completato per assegnare una persona mobilitata.':help.call(this,type);};
  Game.prototype.updateGuardCombat=function(person,post,dt){
    const target=threats(this).find(enemy=>enemy.id===person.task?.target);
    if(!target||distance(target,post)>10||(person.morale??70)<25||person.health<=35){
      keepDuty(person,()=>this.cancelTask(person));return;
    }
    person.attackCooldown=Math.max(0,person.attackCooldown-dt);
    const gap=distance(person,target);
    if(gap>attackReach){
      person.guardRepathTimer=Math.max(0,(person.guardRepathTimer||0)-dt);
      const end=person.path.at(-1);
      if(person.guardRepathTimer===0||end&&distance(end,target)>2&&person.guardRepathTimer<=.5){
        person.path=this.findPath(person.x,person.y,Math.floor(target.x),Math.floor(target.y),1);
        person.guardRepathTimer=person.path.length?1:2;
      }
      if(person.path.length)this.followPath(person,dt,1.7);
      return;
    }
    person.path=[];
    if(person.attackCooldown<=0){
      person.attackCooldown=.85;
      target.health-=this.personAttackDamage(person,7+(person.skills.combat||1)*2+person.strength*.15);
      person.gain('combat',1);
      if(target.health<=0)keepDuty(person,()=>this.cancelTask(person));
    }
  };
  const update=Game.prototype.updateUnit;
  Game.prototype.updateUnit=function(person,dt){
    if(!person.guardDuty)return update.call(this,person,dt);
    const post=this.buildings.find(b=>b.id===person.guardPostId&&b.owner===0&&['base','tower','warehouse'].includes(b.type)&&b.alive&&b.built);
    if(!post||person.owner!==0||person.health<=0||!person.mobilized||person.location?.kind!=='world'){
      this.cancelTask(person);return;
    }
    if(post.type==='tower'&&person.task?.type==='attack')keepDuty(person,()=>this.cancelTask(person));
    if(person.task?.type==='attack'){
      if(post.type==='warehouse'&&(person.morale??70)>=25&&person.health>35){
        person.guardCheckTimer=Math.max(0,(person.guardCheckTimer||0)-dt);
        if(person.guardCheckTimer===0){
          person.guardCheckTimer=.75;
          const current=threats(this).find(enemy=>enemy.id===person.task?.target);
          if(!(current&&threatensPost(current,post))){
            const intruder=this.raiders.filter(enemy=>enemy.health>0&&threatensPost(enemy,post)&&distance(enemy,post)<=8)
              .sort((a,b)=>distance(a,post)-distance(b,post))[0];
            if(intruder)keepDuty(person,()=>this.assignAttack(person,intruder));
          }
        }
      }
      return this.updateGuardCombat(person,post,dt);
    }
    // A crowded entrance can displace a resting unit after path arrival.
    if(person.task?.type==='move'&&this.buildingDistance(person,post)<=postReach)keepDuty(person,()=>this.cancelTask(person));
    person.guardCheckTimer=Math.max(0,(person.guardCheckTimer||0)-dt);
    if(person.guardCheckTimer===0){
      person.guardCheckTimer=.75;
      if(post.type!=='tower'&&(person.morale??70)>=25&&person.health>35){
        const nearest=threats(this).filter(enemy=>distance(enemy,post)<=8)
          .sort((a,b)=>(post.type==='warehouse'?(Number(threatensPost(b,post))-Number(threatensPost(a,post))):0) ||
            distance(a,post)-distance(b,post))[0];
        if(nearest){keepDuty(person,()=>this.assignAttack(person,nearest));return;}
      }
      if(!person.task&&this.buildingDistance(person,post)>postReach){
        const path=this.pathToBuilding(person,post);
        if(path?.length){person.task={type:'move',x:path.at(-1).x,y:path.at(-1).y};person.path=path;person.state='moving';}
      }
    }
    if(post.type==='tower'){const stance=person.stance;person.stance='hold';try{return update.call(this,person,dt);}finally{person.stance=stance;}}
    return update.call(this,person,dt);
  };
  const status=Game.prototype.unitStatus;
  Game.prototype.unitStatus=function(person){return person.guardDuty&&person.task?.type!=='attack'?'di guardia':status.call(this,person);};
  const init=Game.prototype.initUI;
  Game.prototype.initUI=function(){
    init.call(this);
    const button=document.querySelector('[data-order="guard-duty"]');
    if(button)button.onclick=()=>{
      const error=this.toggleGuardDuty(this.selected);
      if(error)this.message(error);
      this.orderMode=null;this.syncModeButtons();this.updateUI();
    };
  };
  const updateUI=Game.prototype.updateUI;
  Game.prototype.updateUI=function(){
    const result=updateUI.call(this);
    const button=document.querySelector('[data-order="guard-duty"]');
    if(button){const active=!!this.selected?.guardDuty&&this.buildings.some(b=>b.id===this.selected.guardPostId&&b.type==='base');button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
    const towerButton=document.querySelector('[data-order="tower-duty"]');
    if(towerButton){const active=!!this.selected?.guardDuty&&this.buildings.some(b=>b.id===this.selected.guardPostId&&b.type==='tower');towerButton.classList.toggle('active',active||this.orderMode==='tower-duty');towerButton.setAttribute('aria-pressed',String(active));}
    const warehouseButton=document.querySelector('[data-order="warehouse-duty"]');
    if(warehouseButton){const active=!!this.selected?.guardDuty&&this.buildings.some(b=>b.id===this.selected.guardPostId&&b.type==='warehouse');warehouseButton.classList.toggle('active',active||this.orderMode==='warehouse-duty');warehouseButton.setAttribute('aria-pressed',String(active));}
    return result;
  };
  const selection=Game.prototype.selectionHTML;
  Game.prototype.selectionHTML=function(entity){
    const html=selection.call(this,entity);
    if(!(entity instanceof Building)||entity.owner!==0||!entity.built)return html;
    const sentry=this.units.find(u=>u.guardDuty&&u.guardPostId===entity.id);
    if(entity.type==='warehouse')return html.replace('</p>',`<br>${sentry?`Presidio: ${sentry.name} · sorveglia le minacce vicine`:'Nessuna sentinella assegnata'}</p>`);
    if(entity.type!=='tower')return html;
    const state=entity.towerNeedsGuard?(sentry?`Presidio: ${sentry.name} · attiva entro 2 caselle con salute e morale sufficienti`:'Senza sentinella: la torre non attacca'):'Torre del vecchio salvataggio: difesa automatica conservata';
    return html.replace('</p>',`<br>${state}</p>`);
  };
})();
