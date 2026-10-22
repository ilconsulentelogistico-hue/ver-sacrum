(() => {
  'use strict';
  const RULES={
    initialTribal:['insediamento'],
    labels:{insediamento:'Tecniche d’insediamento',muratura:'Muratura',molitoria:'Molitoria',fornace:'Forni in muratura',fortificazione:'Fortificazione'},
    unlockAt:{muratura:2,molitoria:3,fornace:4,fortificazione:5},
    requirements:{road:['insediamento'],warehouse:['insediamento'],house:['insediamento'],farm:['insediamento'],pen:['insediamento'],market:['insediamento'],mill:['molitoria'],bakery:['fornace'],kiln:['fornace'],foundry:['fornace'],loom:['insediamento'],press:['insediamento'],palisade:['insediamento'],tower:['fortificazione','muratura']}
  };
  window.TERRA_CONSTRUCTION=RULES;
  const unique=a=>[...new Set(a.filter(k=>Object.hasOwn(RULES.labels,k)))];
  Game.prototype.ensureConstructionKnowledge=function(){
    this.tribalKnowledge=unique(this.tribalKnowledge||RULES.initialTribal);
    for(const u of this.units){u.personalKnowledge=unique(u.personalKnowledge||[]);for(const [k,level] of Object.entries(RULES.unlockAt))if((u.skills?.construction||1)>=level&&!u.personalKnowledge.includes(k))u.personalKnowledge.push(k);}
  };
  Game.prototype.constructionRequirements=function(type){return RULES.requirements[type]||[];};
  Game.prototype.constructionCheck=function(type,u){this.ensureConstructionKnowledge();const required=this.constructionRequirements(type),knowledge=u?.owner>0?(this.neutralSettlement?.(u.owner)?.base.neutralKnowledge||['insediamento']):this.tribalKnowledge,missing=required.filter(k=>!knowledge.includes(k)&&!u?.personalKnowledge?.includes(k));return{ok:!!u&&!missing.length,required,missing};};
  Game.prototype.constructionRequirementText=function(type,u){const c=this.constructionCheck(type,u),keys=c.ok?c.required:c.missing;if(!c.required.length)return'Nessun sapere richiesto';return(c.ok?'Sapere disponibile: ':'Manca: ')+keys.map(k=>RULES.labels[k]).join(', ');};
  Game.prototype.renderKnowledge=function(){this.ensureConstructionKnowledge();const u=this.units.find(p=>p.id===this.knowledgePersonId&&p.owner===0&&p.health>0);if(!u){$('#knowledgeIdentity').textContent='Persona non disponibile';return;}$('#knowledgePeople').innerHTML=this.units.filter(p=>p.owner===0&&p.health>0).map(p=>`<option value="${p.id}">${p.name} · ${p.id.slice(0,8)}</option>`).join('');$('#knowledgePeople').value=u.id;$('#knowledgeIdentity').textContent=u.name+' · ID '+u.id;const list=a=>a.length?a.map(k=>`<li>${RULES.labels[k]}</li>`).join(''):'<li>Nessuno</li>';$('#personalKnowledge').innerHTML=list(u.personalKnowledge);$('#tribalKnowledge').innerHTML=list(this.tribalKnowledge);$('#knowledgeRules').textContent='Soglie provvisorie configurabili — Costruzione 2: Muratura; 3: Molitoria; 4: Forni; 5: Fortificazione (torri). La palizzata è disponibile dall’insediamento. Completare un cantiere trasmette alla tribù il sapere personale usato.';};
  Game.prototype.openKnowledge=function(id){if(!this.units.some(u=>u.id===id&&u.owner===0&&u.health>0)){this.message('Seleziona un abitante dalla Comunità.');return false;}const d=$('#knowledgeDialog');if(!d.open)this.pauseBeforeKnowledge=this.paused;this.knowledgePersonId=id;this.renderKnowledge();if(!d.open)this.showManagement('knowledgeDialog');return true;};
  const initUI=Game.prototype.initUI;Game.prototype.initUI=function(){initUI.call(this);const d=$('#knowledgeDialog');$('#knowledgeBtn').onclick=()=>this.openKnowledge(this.selected?.id);$('#knowledgePeople').onchange=()=>{this.knowledgePersonId=$('#knowledgePeople').value;this.renderKnowledge();};$('#closeKnowledge').onclick=()=>this.closeManagement();d.addEventListener('close',()=>{this.knowledgePersonId=null;if(!this.suspended)this.setPaused(this.pauseBeforeKnowledge);});};
  const newGame=Game.prototype.newGame;Game.prototype.newGame=function(seed){newGame.call(this,seed);this.tribalKnowledge=[...RULES.initialTribal];this.ensureConstructionKnowledge();};
  const placeBuild=Game.prototype.placeBuild;Game.prototype.placeBuild=function(type,tx,ty){const builder=this.selected instanceof Unit&&this.selected.location.kind==='world'?this.selected:this.units.find(u=>u.health>0&&u.location.kind==='world'&&!u.mobilized&&u.state==='idle'),c=this.constructionCheck(type,builder);if(!c.ok)return this.message(builder?this.constructionRequirementText(type,builder):'Serve un costruttore disponibile per aprire il cantiere.');return placeBuild.call(this,type,tx,ty);};
  const assignBuild=Game.prototype.assignBuild;Game.prototype.assignBuild=function(u,b){if(!this.constructionCheck(b.type,u).ok){this.message(this.constructionRequirementText(b.type,u));return false;}assignBuild.call(this,u,b);return true;};
  const buildTick=Game.prototype.buildTick;Game.prototype.buildTick=function(u,dt){const b=this.findById(this.buildings,u.task?.target),wasBuilt=b?.built;buildTick.call(this,u,dt);this.ensureConstructionKnowledge();if(b&&!wasBuilt&&b.built&&u.owner===0)for(const k of this.constructionRequirements(b.type))if(u.personalKnowledge.includes(k)&&!this.tribalKnowledge.includes(k))this.tribalKnowledge.push(k);};
  const updateUI=Game.prototype.updateUI;Game.prototype.updateUI=function(){this.ensureConstructionKnowledge();updateUI.call(this);const builder=this.selected instanceof Unit?this.selected:this.lastSelectedUnit;$$('[data-build]').forEach(btn=>btn.classList.toggle('knowledge-missing',!this.constructionCheck(btn.dataset.build,builder).ok));};
  const snapshot=Game.prototype.snapshot;Game.prototype.snapshot=function(){this.ensureConstructionKnowledge();const d=snapshot.call(this);d.constructionRules=1;d.tribalKnowledge=[...this.tribalKnowledge];return d;};
  const load=Game.prototype.load;Game.prototype.load=function(){const ok=load.call(this);if(ok)this.ensureConstructionKnowledge();return ok;};
})();

