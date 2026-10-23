const game = new Game();
// Prefer the last saved map size; an explicit worldSize query still wins.
try {
  if(typeof location!=="undefined"&&!new URLSearchParams(location.search).has("worldSize")){
    const remembered=Number(localStorage.getItem("ver-sacrum-active-world-size-v1"));
    if([88,128,256,512,1024,2048].includes(remembered)){
      const slot=remembered>88?`terra-italica-save-v5-${remembered}`:"terra-italica-save-v5";
      if(localStorage.getItem(slot))game.experimentalWorldSize=remembered;
    }
  }
}catch{}
let restoredSave=false;
function unfinishedFirstVisitSave(raw){
  if(!raw||window.__TEST_HARNESS__)return false;
  try{
    const d=JSON.parse(raw);
    // BUILD 171 saved a paused, untouched village during the first site choice.
    // Keep that file recoverable by the Load button, but reopen the choice screen.
    return d.startComplete===false||d.startComplete===undefined&&d.version===5&&d.worldSize>=256&&d.paused===true&&d.gameEnded===false&&d.clock?.totalDays===0&&d.units?.filter(u=>u.owner===0).length===5&&d.units.filter(u=>u.owner===0).every(u=>!u.task)&&d.buildings?.some(b=>b.owner===0&&b.type==='base');
  }catch{return false;}
}
const stressQuery=typeof location==='undefined'?null:new URLSearchParams(location.search);
const stressCount=stressQuery?.get('perf')==='1'&&[100,300].includes(Number(stressQuery.get('crowd')))?Number(stressQuery.get('crowd')):0;
if(stressCount){
  const area=stressQuery.get('crowdArea')==='far'?'far':'visible';
  const originalNewGame=game.newGame.bind(game);
  game.newGame=function(){
    originalNewGame(123456);
    const base=this.buildings.find(b=>b.type==='base'&&b.owner===0);
    const initialCount=this.units.length,cols=stressCount===300?15:10,rows=Math.ceil((stressCount-initialCount)/cols),spacing=stressCount===300?.55:.75;
    const cx=area==='far'?Math.min(this.world.size-20,base.x+Math.min(80,this.world.size/4)):base.x;
    const cy=area==='far'?Math.min(this.world.size-20,base.y+Math.min(80,this.world.size/4)):base.y+3;
    for(let i=initialCount;i<stressCount;i++){
      const n=i-initialCount,x=cx+((n%cols)-(cols-1)/2)*spacing,y=cy+(Math.floor(n/cols)-(rows-1)/2)*spacing;
      const person=new Unit(`Prova ${i+1}`,x,y,this.rng);
      person.owner=0;person.mobilized=true;person.fedUntil=1e9;this.units.push(person);
    }
    for(const person of this.units)person.fedUntil=1e9;
    this.raidsEnabled=false;this.nextRaidDay=1e9;this.updateUI();
    window.__terraStress={count:stressCount,area,seed:this.seed,synthetic:true};
  };
  game.save=()=>false;game.load=()=>false;
  game.newGame(123456);
  game.message(`Prova prestazioni: ${stressCount} abitanti sintetici, salvataggi disattivati.`);
}
// Restore before the first animation frame can overwrite an existing save.
try {
  const experimental=game.experimentalWorldSize>WORLD_SIZE;
  const slot=experimental?`terra-italica-save-v5-${game.experimentalWorldSize}`:'terra-italica-save-v5';
  if (!stressCount&&!unfinishedFirstVisitSave(localStorage.getItem(slot))&&(localStorage.getItem(slot) || !experimental&&(localStorage.getItem('terra-italica-save-v4') || localStorage.getItem('terra-italica-save-v3') || localStorage.getItem('terra-italica-save-v2')))) {
    game.setPaused(true);
    restoredSave=game.load();
  }
} catch (error) {
  game.setPaused(true);
  game.message('Archivio locale non disponibile. Puoi giocare, ma il salvataggio potrebbe non riuscire.');
}


if (!stressCount && !restoredSave && !window.__TEST_HARNESS__) game.beginStartSelection();


if ('serviceWorker' in navigator && !new URLSearchParams(location.search).has('perf')) {
  window.addEventListener('load', async () => {
    try {
      // A newly installed worker must not interrupt the start screen or an active game.
      const registration=await navigator.serviceWorker.register('./sw.js?v=272', {updateViaCache:'none'});
      await registration.update();
      if(registration.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});
      registration.addEventListener('updatefound', () => {
        const worker=registration.installing;
        worker?.addEventListener('statechange', () => {
          if(worker.state==='installed'&&navigator.serviceWorker.controller)worker.postMessage({type:'SKIP_WAITING'});
        });
      });
    } catch (_) {}
  });
}

if(typeof window!=="undefined")window.__verSacrumReady=true;
