// One real carrier supplies local stone ammunition to a staffed tower.
(() => {
  'use strict';
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  Game.prototype.supplyTower=function(tower){
    this.ensureInventories();
    if(!tower||tower.type!=='tower'||tower.owner!==0||!tower.alive||!tower.built||!tower.towerNeedsGuard)return 'Scegli una tua torre nuova e completata.';
    if(this.units.some(u=>u.owner===0&&u.task?.type==='haul'&&u.task.destination===tower.id&&u.task.good==='stone'))return 'Una persona sta già rifornendo questa torre.';
    const sources=this.buildings.filter(b=>b.owner===0&&['base','warehouse'].includes(b.type)&&b.alive&&b.built&&this.available(b,'stone')>0)
      .sort((a,b)=>distance(a,tower)-distance(b,tower));
    if(!sources.length)return 'Non c’è pietra disponibile nella Casa comune o nei magazzini.';
    const carriers=this.units.filter(u=>u.owner===0&&u.health>0&&!u.mobilized&&u.location?.kind==='world'&&!u.task&&u.inventory.amount===0);
    if(!carriers.length)return 'Serve un abitante libero, sulla mappa e senza carico.';
    if(this.freeSpace(tower)<=0)return 'La torre non ha spazio per altre pietre.';
    for(const source of sources)for(const carrier of carriers){
      const error=this.assignHaul(carrier,source,tower,'stone',true);
      if(!error){this.message(`${carrier.name} porta pietra alla torre e la rifornisce quando serve.`);return null;}
    }
    return 'Nessun percorso raggiungibile per rifornire la torre.';
  };
  const selection=Game.prototype.selectionHTML;
  Game.prototype.selectionHTML=function(entity){
    const html=selection.call(this,entity);
    if(!(entity instanceof Building)||entity.type!=='tower'||entity.owner!==0||!entity.built||!entity.towerNeedsGuard)return html;
    const stone=entity.inventory?.items.stone||0;
    const route=this.units.find(u=>u.task?.type==='haul'&&u.task.destination===entity.id&&u.task.good==='stone');
    return html.replace('</p>',`</p><p>Pietre da lancio: ${stone}. Ogni colpo usa 1 pietra locale. ${route?`Rifornisce ${route.name}.`:'Senza rifornimento attivo.'}</p><button type="button" data-supply-tower="${entity.id}">Rifornisci con un abitante</button>`);
  };
  const updateUI=Game.prototype.updateUI;
  Game.prototype.updateUI=function(){
    const result=updateUI.call(this);
    document.querySelector('#selectionCard')?.querySelectorAll?.('[data-supply-tower]').forEach(button=>button.onclick=()=>{
      const tower=this.buildings.find(b=>b.id===button.dataset.supplyTower);
      const error=this.supplyTower(tower);if(error)this.message(error);this.updateUI();
    });
    return result;
  };
})();
