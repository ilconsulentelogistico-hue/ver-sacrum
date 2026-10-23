// Persistent hostile camps and ownership-correct terminal conditions.
(() => {
  'use strict';
  const RULES=Object.freeze({version:1,camps:3,campHealth:420,raidInitialDay:65,raidIntervalMin:75,raidIntervalMax:100});
  window.TERRA_WAR=RULES;
  // Temporary playtest switch. Do not persist it in saves.
  Game.prototype.raidsEnabled=false;
  Game.prototype.clearDisabledRaids=function(){
    if(this.raidsEnabled || !this.raiders.length)return;
    const ids=new Set(this.raiders.map(r=>r.id));
    for(const u of this.units)if(ids.has(u.task?.target))this.cancelTask(u);
    if(ids.has(this.selected?.id))this.selected=null;
    this.raiders=[];
  };
  const makeCamp=(x,y)=>({id:crypto.randomUUID?.()||Math.random().toString(36).slice(2),type:'enemy_camp',owner:-1,x:x+.5,y:y+.5,health:RULES.campHealth,maxHealth:RULES.campHealth,alive:true});
  Game.prototype.ensureWar=function(){if(!Array.isArray(this.warCamps))this.warCamps=[];for(const c of this.warCamps)c.alive=c.health>0;};
  Game.prototype.createWarCamps=function(){
    this.ensureWar();if(this.warCamps.length)return;
    const size=this.world.size,base=this.buildings.find(b=>b.owner===0&&b.type==='base'&&b.alive);
    if(size<=WORLD_SIZE||!base){
      const sites=[[size-10,10],[size-9,size-11],[10,size-10]];
      for(const [px,py] of sites.slice(0,RULES.camps)){
        let site=null;
        for(let r=0;r<14&&!site;r++)for(let i=0;i<24;i++){
          const x=Math.floor(px+Math.cos(i/24*Math.PI*2)*r),y=Math.floor(py+Math.sin(i/24*Math.PI*2)*r),t=this.world.tile(x,y);
          if(t&&BIOME[t.biome].walk&&!this.buildings.some(b=>dist(b,{x:x+.5,y:y+.5})<4)){site={x,y};break;}
        }
        if(site)this.warCamps.push(makeCamp(site.x,site.y));
      }
      return;
    }
    // Flood from actual village doors: every chosen camp can march to the village.
    const radius=Math.min(36,Math.floor(size*.28)),limit=radius+14;
    const queue=[],seen=new Set(),reachable=[];
    for(const door of this.buildingDoors(base)){
      const x=Math.floor(door.x),y=Math.floor(door.y),k=`${x},${y}`;
      if(!seen.has(k)){seen.add(k);queue.push({x,y,steps:0});}
    }
    for(let head=0;head<queue.length;head++){
      const {x,y,steps}=queue[head],spot={x:x+.5,y:y+.5},distance=dist(spot,base);
      if(distance>=Math.max(18,radius-14)&&distance<=limit&&
        !this.buildings.some(b=>dist(b,spot)<4))reachable.push(spot);
      if(steps>=radius*2)continue;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx,ny=y+dy,k=`${nx},${ny}`;
        if(seen.has(k)||Math.hypot(nx+.5-base.x,ny+.5-base.y)>limit)continue;
        if(!this.world.walkable(nx,ny,1,{x,y},this.buildings))continue;
        seen.add(k);queue.push({x:nx,y:ny,steps:steps+1});
      }
    }
    const ideals=[[base.x+radius,base.y-radius*.25],[base.x+radius*.35,base.y+radius],[base.x,base.y-radius]];
    for(const [ix,iy] of ideals){
      let best=null,score=Infinity;
      for(const spot of reachable){
        if(this.warCamps.some(c=>dist(c,spot)<14))continue;
        const cost=Math.hypot(spot.x-ix,spot.y-iy);
        if(cost<score){best=spot;score=cost;}
      }
      if(best)this.warCamps.push(makeCamp(Math.floor(best.x),Math.floor(best.y)));
    }
  };
  Game.prototype.playerPeopleAlive=function(){return this.units.filter(u=>u.owner===0&&u.health>0);};
  Game.prototype.playerDepositsAlive=function(){return this.buildings.filter(b=>b.owner===0&&b.alive&&b.built&&['base','warehouse'].includes(b.type));};
  Game.prototype.warOutcome=function(){this.ensureWar();if(!this.playerPeopleAlive().length||!this.playerDepositsAlive().length)return'defeat';if(!this.warCamps.some(c=>c.health>0)&&!this.raiders.some(r=>r.health>0))return'victory';return null;};
  Game.prototype.showGameResult=function(outcome){const victory=outcome==='victory';$('#gameResultEyebrow').textContent=victory?'TERRITORIO PACIFICATO':'FINE DELLA COMUNITÀ';$('#gameResultTitle').textContent=victory?'Vittoria':'L’insediamento è caduto';$('#gameResultText').textContent=victory?'Tutti i campi ostili sono stati distrutti e non resta alcun razziatore.':'Non restano persone vive oppure depositi operativi della tua comunità.';};
  const newGame=Game.prototype.newGame;Game.prototype.newGame=function(seed){newGame.call(this,seed);this.gameResult=null;this.warCamps=[];this.createWarCamps();this.nextRaidDay=RULES.raidInitialDay;this.showGameResult('defeat');};
  const spawnRaid=Game.prototype.spawnRaid;Game.prototype.spawnRaid=function(){if(!this.raidsEnabled)return;this.ensureWar();const camps=this.warCamps.filter(c=>c.health>0);if(!camps.length)return;this.raidLevel++;const count=2+Math.floor(this.raidLevel*1.5);for(let i=0;i<count;i++){const c=camps[i%camps.length],r=new Raider(c.x+(i%2?.6:-.6),c.y+(i%3?.6:-.6),this.raidLevel);r.campId=c.id;this.raiders.push(r);}this.message(`Incursione: ${count} razziatori partono dai campi ostili.`);};
  const applyOrder=Game.prototype.applyOrder;Game.prototype.applyOrder=function(o,pos,tx,ty,u=this.selected){if(o==='attack'){const target=this.nearestAt([...this.raiders,...this.animals.filter(a=>a.type==='wolf'),...this.warCamps.filter(c=>c.health>0)],pos,.9);if(target)this.assignAttack(u,target);else this.message('Nessuna minaccia selezionata.');this.orderMode=null;this.syncModeButtons();this.updateUI();return;}return applyOrder.call(this,o,pos,tx,ty,u);};
  const combatTick=Game.prototype.combatTick;Game.prototype.combatTick=function(u,dt){if(this.warCamps?.some(c=>c.id===u.task?.target)){const c=this.warCamps.find(c=>c.id===u.task.target);if(!c||c.health<=0){this.cancelTask(u);return;}const d=dist(u,c);if(d>1.3){if(!u.path.length)u.path=this.pathToBuilding(u,c)||[];this.followPath(u,dt,1.7);}else if(u.attackCooldown<=0){u.attackCooldown=.85;c.health-=this.personAttackDamage(u,7+u.skills.combat*2+u.strength*.15);u.gain('combat',1);if(c.health<=0){c.health=0;c.alive=false;this.message('Campo ostile distrutto. Elimina i razziatori rimasti.');}}return;}combatTick.call(this,u,dt);};
  const pickEntity=Game.prototype.pickEntity;Game.prototype.pickEntity=function(p){const e=pickEntity.call(this,p);let best=e,bd=e?dist(e,p):.58;for(const c of this.warCamps||[])if(c.health>0&&dist(c,p)<bd){best=c;bd=dist(c,p);}return best;};
  const selectionHTML=Game.prototype.selectionHTML;Game.prototype.selectionHTML=function(e){if(e?.type==='enemy_camp')return`<h3>Campo ostile</h3><p>${this.raidsEnabled?'Genera incursioni finché resta operativo.':'Incursioni temporaneamente disattivate.'}</p><div class="bar"><i style="width:${Math.max(0,e.health/e.maxHealth*100)}%;background:#a94c43"></i></div>`;return selectionHTML.call(this,e);};
  const draw=Game.prototype.draw;Game.prototype.draw=function(){draw.call(this);const c=this.ctx,z=this.camera.zoom;for(const camp of this.warCamps||[])if(camp.health>0){const p=this.worldToScreen(camp.x*TILE,camp.y*TILE);c.save();c.fillStyle='#573a32';c.fillRect(p.x-13*z,p.y-9*z,26*z,18*z);c.fillStyle='#34231f';c.beginPath();c.moveTo(p.x-16*z,p.y-9*z);c.lineTo(p.x,p.y-20*z);c.lineTo(p.x+16*z,p.y-9*z);c.fill();c.fillStyle='#a94c43';c.fillRect(p.x-13*z,p.y+12*z,26*z*(camp.health/camp.maxHealth),3*z);c.restore();}};
  const endGame=Game.prototype.endGame;Game.prototype.endGame=function(outcome='defeat'){if(this.gameEnded)return;this.gameResult=outcome;this.showGameResult(outcome);endGame.call(this);this.setPaused(true);};
  const update=Game.prototype.update;Game.prototype.update=function(dt){this.clearDisabledRaids();update.call(this,dt);if(this.gameEnded)return;this.ensureWar();const outcome=this.warOutcome();if(outcome)this.endGame(outcome);};
  const snapshot=Game.prototype.snapshot;Game.prototype.snapshot=function(){const d=snapshot.call(this);d.warRules=1;d.warCamps=this.warCamps||[];d.gameResult=this.gameResult||null;return d;};
  const load=Game.prototype.load;Game.prototype.load=function(){const ok=load.call(this);if(!ok)return false;this.clearDisabledRaids();this.ensureWar();if(!this.warCamps.length&&!this.gameEnded)this.createWarCamps();this.showGameResult(this.gameResult||'defeat');return true;};
})();

