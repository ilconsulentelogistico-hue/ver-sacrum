// A person learns to treat combat wounds by carrying real cloth to a patient.
(() => {
  'use strict';
  const reach=1.15;
  const wounds=patient=>Math.max(0,patient.maxHealth-patient.health-(patient.nutritionDamage||0));
  const available=(game,building)=>game.available(building,'cloth')>0;
  const homeFor=(game,patient)=>patient?.location?.kind==='resident'
    ?game.buildings.find(b=>b.id===patient.location.settlementId&&b.owner===0&&b.type==='house'&&b.alive&&b.built&&b.residents.includes(patient.id))
    :null;
  const patientFor=(game,task)=>game.units.find(person=>person.id===task?.target&&person.owner===0&&person.health>0
    &&(person.location?.kind==='world'||homeFor(game,person)));

  Game.prototype.assignTreatment=function(healer,patient){
    if(!healer||healer.owner!==0||healer.health<=0||healer.location?.kind!=='world'||healer===patient)return 'Scegli un abitante sulla mappa che curi un’altra persona.';
    if(!patient||patient.owner!==0||patient.health<=0||patient.location?.kind!=='world'&&!homeFor(this,patient))return 'Tocca un abitante ferito o la casa in cui vive.';
    if(wounds(patient)<1)return 'Questa persona non ha ferite da curare. La fame richiede razioni.';
    if(patient.lastTreatmentDay===this.totalDays)return 'Questa persona è già stata curata oggi.';
    const home=homeFor(this,patient);
    if(home&&this.pathToBuilding(healer,home)===null)return 'La casa del ferito non è raggiungibile.';
    if(healer.inventory.amount&&healer.inventory.type!=='cloth')return 'Fai consegnare prima il carico del curante.';
    this.ensureInventories();
    let source=null,path=[];
    if(healer.inventory.type!=='cloth'||healer.inventory.amount<1){
      const stores=this.buildings.filter(b=>b.owner===0&&b.alive&&b.built&&available(this,b))
        .sort((a,b)=>Math.hypot(healer.x-a.x,healer.y-a.y)-Math.hypot(healer.x-b.x,healer.y-b.y));
      for(const b of stores){const route=this.pathToBuilding(healer,b);if(route!==null){source=b;path=route;break;}}
      if(!source)return 'Serve tessuto in un deposito raggiungibile o nel carico del curante.';
    }
    this.cancelTask(healer);
    healer.task={type:'heal',target:patient.id,source:source?.id||null,phase:source?'source':'patient'};
    healer.state='healing';
    healer.path=path;
    healer.workTimer=0;
    this.message(source?`${healer.name} va a prendere tessuto per ${patient.name}.`:`${healer.name} raggiunge ${patient.name} per curarlo.`);
    return null;
  };

  Game.prototype.updateTreatment=function(healer,dt){
    const task=healer.task,patient=patientFor(this,task);
    if(!patient||wounds(patient)<1||patient.lastTreatmentDay===this.totalDays){this.cancelTask(healer);return;}
    if(task.phase==='source'){
      let source=this.buildings.find(b=>b.id===task.source&&b.owner===0&&b.alive&&b.built);
      if(!source||!available(this,source)){
        source=null;
        for(const candidate of this.buildings.filter(b=>b.owner===0&&b.alive&&b.built&&available(this,b)).sort((a,b)=>Math.hypot(healer.x-a.x,healer.y-a.y)-Math.hypot(healer.x-b.x,healer.y-b.y))){
          const route=this.pathToBuilding(healer,candidate);
          if(route!==null){source=candidate;healer.path=route;task.source=candidate.id;break;}
        }
        if(!source){this.cancelTask(healer);this.message('Tessuto esaurito nei depositi raggiungibili.');return;}
      }
      if(this.buildingDistance(healer,source)>reach){
        if(!healer.path.length){const path=this.pathToBuilding(healer,source);if(path===null){this.cancelTask(healer);return;}healer.path=path;}
        this.followPath(healer,dt,1.55);
        return;
      }
      source.inventory.items.cloth--;
      healer.inventory.type='cloth';
      healer.inventory.amount=1;
      task.phase='patient';
      healer.path=[];
    }
    if(task.phase!=='patient'||healer.inventory.type!=='cloth'||healer.inventory.amount<1){this.cancelTask(healer);return;}
    const home=homeFor(this,patient);
    const destination=home||patient;
    const distance=home?this.buildingDistance(healer,home):Math.hypot(healer.x-patient.x,healer.y-patient.y);
    if(distance>reach){
      healer.workTimer=0;
      const last=healer.path.at(-1);
      if(!last||!home&&Math.hypot(last.x-destination.x,last.y-destination.y)>1.3){
        const path=home?this.pathToBuilding(healer,home):this.findPath(healer.x,healer.y,Math.floor(patient.x),Math.floor(patient.y),1);
        if(!path?.length){this.cancelTask(healer);this.message('Il ferito non è raggiungibile: il tessuto resta al curante.');return;}
        healer.path=path;
      }
      this.followPath(healer,dt,1.55);
      return;
    }
    healer.path=[];
    healer.workTimer+=dt;
    if(healer.workTimer<2)return;
    const amount=Math.min(wounds(patient),6+(healer.skills.healing||1)*.5);
    patient.health=Math.min(patient.maxHealth,patient.health+amount);
    patient.lastTreatmentDay=this.totalDays;
    healer.inventory.amount--;
    if(!healer.inventory.amount)healer.inventory.type=null;
    // One nearby, free apprentice can learn from a completed treatment.
    // This never creates a second treatment or consumes another cloth.
    const mentorLevel=healer.skills.healing||1;
    const apprentice=this.units.filter(person=>person!==healer&&person!==patient
      &&person.owner===healer.owner&&person.health>0&&person.location?.kind==='world'
      &&person.mentorId===healer.id&&((person.state==='idle'&&!person.task)||(person.state==='following'&&person.task?.type==='follow-mentor'&&person.task.target===healer.id))&&!person.mobilized
      &&mentorLevel>=(person.skills.healing||1)+2
      &&Math.hypot(person.x-healer.x,person.y-healer.y)<=1.8)
      .sort((a,b)=>Math.hypot(a.x-healer.x,a.y-healer.y)-Math.hypot(b.x-healer.x,b.y-healer.y)||a.id.localeCompare(b.id))[0];
    healer.gain('healing',6);
    if(apprentice)apprentice.gain('healing',2);
    this.message(`${healer.name} cura ${patient.name}: +${amount.toFixed(1)} salute.${apprentice?` ${apprentice.name} osserva e impara.`:''} Nuova cura domani.`);
    this.cancelTask(healer);
  };

  const update=Game.prototype.updateUnit;
  Game.prototype.updateUnit=function(person,dt){
    if(person.task?.type==='heal'&&person.state==='healing')return this.updateTreatment(person,dt);
    return update.call(this,person,dt);
  };
  const order=Game.prototype.applyOrder;
  Game.prototype.applyOrder=function(type,pos,tx,ty,person=this.selected){
    if(type!=='heal')return order.call(this,type,pos,tx,ty,person);
    let patient=this.nearestAt(this.units,pos,.9,p=>p.owner===0&&p.health>0&&p.location?.kind==='world');
    if(!patient){
      const house=this.buildings.find(b=>{
        if(b.owner!==0||b.type!=='house'||!b.built||!b.alive)return false;
        const area=window.VER_SACRUM_VILLAGE.bounds(b);
        return pos.x>=area.left&&pos.x<area.right&&pos.y>=area.top&&pos.y<area.bottom;
      });
      if(house){
        patient=this.units.filter(p=>p.owner===0&&p.health>0&&p.location?.kind==='resident'&&p.location.settlementId===house.id&&house.residents.includes(p.id)&&wounds(p)>=1&&p.lastTreatmentDay!==this.totalDays)
          .sort((a,b)=>wounds(b)-wounds(a))[0];
        if(!patient){this.message('Nessun residente ferito da curare in questa casa.');return;}
      }
    }
    const error=this.assignTreatment(person,patient);
    if(error){this.message(error);return;}
    this.orderMode=null;this.syncModeButtons();this.updateUI();
  };
  const help=Game.prototype.orderHelp;
  Game.prototype.orderHelp=function(type){return type==='heal'?'Scegli un curante, poi tocca un ferito o la sua casa. Serve un tessuto in deposito o nel suo carico.':help.call(this,type);};

  // A permanent duty belongs to the same person and reuses the manual treatment route.
  const cancel=Game.prototype.cancelTask;
  Game.prototype.cancelTask=function(person){
    cancel.call(this,person);
    if(person.healerDuty&&!person._keepHealerDuty){person.healerDuty=false;person.healerPostId=null;person.healerCheckDay=-1;}
  };
  const keepDuty=(person,action)=>{
    if(!person.healerDuty)return action();
    person._keepHealerDuty=true;
    try{return action();}finally{delete person._keepHealerDuty;}
  };
  Game.prototype.toggleHealerDuty=function(person){
    if(!person||person.owner!==0||person.health<=0||person.location?.kind!=='world')return 'Scegli un abitante sulla mappa.';
    if(person.healerDuty){this.cancelTask(person);this.message(`${person.name} lascia il servizio di cura.`);return null;}
    if(person.mobilized)return 'Congeda prima questo combattente.';
    if(person.inventory.amount&&person.inventory.type!=='cloth')return 'Fai consegnare prima il carico del curante.';
    const posts=this.buildings.filter(b=>b.owner===0&&b.type==='base'&&b.alive&&b.built)
      .sort((a,b)=>Math.hypot(person.x-a.x,person.y-a.y)-Math.hypot(person.x-b.x,person.y-b.y));
    const post=posts[0];
    if(!post||Math.hypot(person.x-post.x,person.y-post.y)>18)return 'Porta il curante vicino a una tua base.';
    this.cancelTask(person);
    person.healerDuty=true;person.healerPostId=post.id;person.healerCheckDay=-1;
    this.message(`${person.name} cura i feriti entro 12 passi da ${post.cityName||'questa base'}, quando c’è tessuto.`);
    return null;
  };
  const treatment=Game.prototype.updateTreatment;
  Game.prototype.updateTreatment=function(person,dt){return keepDuty(person,()=>treatment.call(this,person,dt));};
  const updateDuty=Game.prototype.updateUnit;
  Game.prototype.updateUnit=function(person,dt){
    if(person.healerDuty&&person.owner===0&&person.health>0&&person.location?.kind==='world'&&(!person.task&&person.state==='idle'||person.task?.type==='move'&&person.state==='moving')&&person.healerCheckDay!==this.totalDays){
      person.healerCheckDay=this.totalDays;
      const post=this.buildings.find(b=>b.id===person.healerPostId&&b.owner===0&&b.type==='base'&&b.alive&&b.built);
      if(!post)this.cancelTask(person);
      else{
        const patients=this.units.filter(patient=>{
          if(patient===person||patient.owner!==0||patient.health<=0||wounds(patient)<1||patient.lastTreatmentDay===this.totalDays)return false;
          const home=homeFor(this,patient),place=home||patient;
          return (patient.location?.kind==='world'||home)&&Math.hypot(place.x-post.x,place.y-post.y)<=12;
        }).sort((a,b)=>wounds(b)-wounds(a));
        for(const patient of patients){
          const error=keepDuty(person,()=>this.assignTreatment(person,patient));
          if(!error)break;
        }
        // Wait at the actual base entrance between visits; the trip is an ordinary move task.
        if(!person.task&&this.buildingDistance(person,post)>1.15){
          const path=this.pathToBuilding(person,post);
          if(path?.length){
            person.task={type:'move',x:path.at(-1).x,y:path.at(-1).y};
            person.path=path;
            person.state='moving';
          }
        }
      }
    }
    return updateDuty.call(this,person,dt);
  };

  // A learner can accompany their assigned mentor without interrupting the mentor's work.
  Game.prototype.toggleFollowMentor=function(person){
    if(!person||person.owner!==0||person.health<=0||person.location?.kind!=='world')return 'Scegli un allievo sulla mappa.';
    if(person.task?.type==='follow-mentor'){this.cancelTask(person);this.message(`${person.name} smette di seguire il maestro.`);return null;}
    if(person.mobilized)return 'Congeda prima questo combattente.';
    const mentor=this.units.find(u=>u.id===person.mentorId&&u!==person&&u.owner===person.owner&&u.health>0&&u.location?.kind==='world');
    if(!mentor)return 'Assegna prima un maestro presente sulla mappa dalla scheda Abilità.';
    this.cancelTask(person);
    person.task={type:'follow-mentor',target:mentor.id};person.state='following';person.path=[];person.followRepathTimer=0;
    this.message(`${person.name} segue ${mentor.name}; può imparare Cura assistendo da vicino.`);
    return null;
  };
  const updateFollow=Game.prototype.updateUnit;
  Game.prototype.updateUnit=function(person,dt){
    if(person.task?.type!=='follow-mentor')return updateFollow.call(this,person,dt);
    const mentor=this.units.find(u=>u.id===person.task.target&&u.id===person.mentorId&&u.owner===person.owner&&u.health>0&&u.location?.kind==='world');
    if(!mentor||person.health<=0||person.location?.kind!=='world'){this.cancelTask(person);return;}
    person.attackCooldown=Math.max(0,person.attackCooldown-dt);
    person.followRepathTimer=Math.max(0,(person.followRepathTimer||0)-dt);
    const distance=Math.hypot(person.x-mentor.x,person.y-mentor.y);
    if(distance<=1.55){person.path=[];return;}
    const endpoint=person.path.at(-1);
    if(person.followRepathTimer===0||!endpoint||Math.hypot(endpoint.x-mentor.x,endpoint.y-mentor.y)>1.85){
      const x=Math.floor(mentor.x),y=Math.floor(mentor.y);
      const candidates=[[x-1,y],[x+1,y],[x,y-1],[x,y+1]]
        .filter(([cx,cy])=>this.world.walkable(cx,cy,1,null,this.buildings))
        .sort((a,b)=>Math.hypot(person.x-a[0]-.5,person.y-a[1]-.5)-Math.hypot(person.x-b[0]-.5,person.y-b[1]-.5));
      person.path=[];
      for(const [cx,cy] of candidates){const route=this.findPath(person.x,person.y,cx,cy,1);if(route.length){person.path=route;break;}}
      person.followRepathTimer=person.path.length?1.5:3;
    }
    if(person.path.length)this.followPath(person,dt,1.7);
  };
  const followStatus=Game.prototype.unitStatus;
  Game.prototype.unitStatus=function(person){return person.task?.type==='follow-mentor'?'segue il maestro':followStatus.call(this,person);};

  const init=Game.prototype.initUI;
  Game.prototype.initUI=function(){
    init.call(this);
    const button=document.querySelector('[data-order="healer-duty"]');
    if(button)button.onclick=()=>{
      const error=this.toggleHealerDuty(this.selected);
      if(error)this.message(error);
      this.orderMode=null;this.syncModeButtons();this.updateUI();
    };
    const followButton=document.querySelector('[data-order="follow-mentor"]');
    if(followButton)followButton.onclick=()=>{
      const error=this.toggleFollowMentor(this.selected);
      if(error)this.message(error);
      this.orderMode=null;this.syncModeButtons();this.updateUI();
    };
  };
  const updateUI=Game.prototype.updateUI;
  Game.prototype.updateUI=function(){
    const result=updateUI.call(this);
    const button=document.querySelector('[data-order="healer-duty"]');
    if(button){const active=!!this.selected?.healerDuty;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
    const followButton=document.querySelector('[data-order="follow-mentor"]');
    if(followButton){const active=this.selected?.task?.type==='follow-mentor';followButton.classList.toggle('active',!!active);followButton.setAttribute('aria-pressed',String(!!active));}
    return result;
  };
})();
