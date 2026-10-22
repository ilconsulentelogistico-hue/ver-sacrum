// Mobile snapshots are separate from the original v2 slot, which is never overwritten.
(() => {
  'use strict';
  const SLOT='terra-italica-save-v5', PREVIOUS='terra-italica-save-v4', OLDER='terra-italica-save-v3';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const finite=(v,min=-Infinity,max=Infinity)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
  const check=(ok,label)=>{if(!ok)throw new Error('Salvataggio non valido: '+label)};
  const materials=new Set(Object.keys(window.TERRA_GOODS));
  const itemsValid=items=>items&&typeof items==='object'&&!Array.isArray(items)&&Object.entries(items).every(([k,v])=>materials.has(k)&&Number.isSafeInteger(v)&&v>=0);
  const chunkBits=(keys,size)=>{
    const side=size/8,bytes=new Uint8Array(side*side/8);
    for(const key of keys){const [x,y]=key.split(',').map(Number),n=y*side+x;bytes[n>>3]|=1<<(n&7);}
    return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  };
  const chunkKeys=(d,size)=>{
    if(!d.resourceChunkBits)return d.resourceChunksLoaded;
    const side=size/8,keys=[];
    for(let i=0;i<d.resourceChunkBits.length;i+=2){const b=parseInt(d.resourceChunkBits.slice(i,i+2),16);for(let bit=0;bit<8;bit++)if(b&(1<<bit)){const n=i/2*8+bit;keys.push(`${n%side},${Math.floor(n/side)}`);}}
    return keys;
  };

  function validate(d) {
    check(d&&d.version===5,'versione');check(d.populationRules===undefined||d.populationRules===1,'regole popolazione');check(d.neutralRules===undefined||d.neutralRules===1,'regole insediamenti neutrali');check(d.politicsRules===undefined||[1,2,3].includes(d.politicsRules),'regole politiche');check(d.warRules===undefined||d.warRules===1,'regole guerra');check(d.groupRules===undefined||d.groupRules===1,'regole gruppi');check(d.streamingRules===undefined||d.streamingRules===1,'regole streaming');check(d.gameMode===undefined||['legacy','sandbox','confederation'].includes(d.gameMode),'modalità partita');check(Number.isInteger(d.seed),'seed');
    const mapSize=d.worldSize??WORLD_SIZE;check([WORLD_SIZE,128,256,512,1024,2048].includes(mapSize),'dimensione mappa');
    check(d.resourceMode===undefined||mapSize>=256&&d.resourceMode==='changes','formato risorse');
    if(mapSize>WORLD_SIZE){
      const list=d.resourceChunksLoaded,side=mapSize/8,bits=d.resourceChunkBits;
      if(bits!==undefined)check(mapSize>=1024&&typeof bits==='string'&&bits.length===side*side/4&&/^[0-9a-f]+$/.test(bits),'mappa blocchi risorse');
      else check(Array.isArray(list)&&list.length<=side*side&&new Set(list).size===list.length&&list.every(k=>{if(typeof k!=='string'||!/^\d+,\d+$/.test(k))return false;const [x,y]=k.split(',').map(Number);return x<side&&y<side&&k===`${x},${y}`;}),'blocchi risorse');
    }
    if(d.streaming!==undefined)check(d.streaming&&d.streaming.chunkSize===8&&[20,128].includes(d.streaming.maxCached),'configurazione streaming');
    if(d.savedGroups!==undefined){check(d.savedGroups&&typeof d.savedGroups==='object'&&!Array.isArray(d.savedGroups)&&Object.keys(d.savedGroups).every(k=>['1','2','3'].includes(k)),'gruppi');for(const ids of Object.values(d.savedGroups))check(Array.isArray(ids)&&ids.every(id=>typeof id==='string'),'membri gruppi');}
    for(const key of ['units','buildings','animals','raiders','resources','roads'])check(Array.isArray(d[key]),key);
    check(d.warCamps===undefined||Array.isArray(d.warCamps),'campi ostili');check(d.gameResult===undefined||d.gameResult===null||['victory','defeat'].includes(d.gameResult),'esito partita');
    const ids=new Set();
    for(const e of [...d.units,...d.buildings,...d.animals,...d.raiders,...d.resources]){
      check(typeof e.id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(e.id)&&!ids.has(e.id),'ID');ids.add(e.id);
      check(finite(e.x,0,mapSize)&&finite(e.y,0,mapSize),'posizione');
      if(e.health!==undefined)check(finite(e.health)&&finite(e.maxHealth,1),'salute');
    }
    check(d.buildings.some(b=>b.type==='base'),'casa comune');
    for(const b of d.buildings){
      if(b.linkSettings!==undefined){check(b.linkSettings&&typeof b.linkSettings==='object'&&!Array.isArray(b.linkSettings),'collegamenti');for(const p of Object.values(b.linkSettings)){check(p&&typeof p.enabled==='boolean'&&p.goods&&typeof p.goods==='object','collegamento');for(const[k,v]of Object.entries(p.goods))check(materials.has(k)&&v&&typeof v.import==='boolean'&&typeof v.export==='boolean'&&(v.sellCommunal===undefined||typeof v.sellCommunal==='boolean')&&Number.isSafeInteger(v.min)&&v.min>=0&&Number.isSafeInteger(v.keep)&&v.keep>=v.min,'soglie collegamento');}}
      check(b.towerNeedsGuard===undefined||b.type==='tower'&&typeof b.towerNeedsGuard==='boolean','presidio torre');
      check(b.preferredRecipeId===undefined||b.preferredRecipeId===null||b.type==='press'&&window.TERRA_RECIPES.press.some(r=>r.id===b.preferredRecipeId),'priorità ricetta');
      check(b.desiredWorkers===undefined||Number.isSafeInteger(b.desiredWorkers)&&b.desiredWorkers>=0&&b.desiredWorkers<=8,'artigiani desiderati');check(b.returnPercent===undefined||Number.isSafeInteger(b.returnPercent)&&b.returnPercent>=0&&b.returnPercent<=100,'quota comunitaria');check(b.returnDue===undefined||itemsValid(b.returnDue),'prodotti riservati');check(b.returnRemainder===undefined||itemsValid(b.returnRemainder)&&Object.values(b.returnRemainder).every(n=>n<100),'resti quota');check(b.cityName===undefined||typeof b.cityName==='string'&&b.cityName.length<=60&&!/[<>]/.test(b.cityName),'nome insediamento');check(b.neutralBuildSearchNextDay===undefined||finite(b.neutralBuildSearchNextDay,0),'prossima ricerca materiali neutrali');
      check(Object.hasOwn(BUILD_LABEL,b.type),'edificio');check(finite(b.progress,0,1)&&finite(b.growth,0)&&finite(b.birthDays,0)&&finite(b.cooldown,0),'progresso edificio');
      check(Array.isArray(b.assigned)&&b.assigned.every(id=>typeof id==='string'),'lavoratori');
      check(b.workers===undefined||Array.isArray(b.workers)&&b.workers.every(id=>typeof id==='string'),'mestieri fabbrica');
      check(b.animalIds===undefined||Array.isArray(b.animalIds)&&new Set(b.animalIds).size===b.animalIds.length&&b.animalIds.every(id=>typeof id==='string'),'animali recinto');
      check(b.livestockDays===undefined||Number.isSafeInteger(b.livestockDays)&&b.livestockDays>=0,'giorni allevamento');check(b.herdingRemainder===undefined||finite(b.herdingRemainder,0,1)&&b.herdingRemainder<1,'resto allevamento');
      check(Array.isArray(b.residents)&&b.residents.length<=(b.type==='house'?5:0)&&b.residents.every(id=>typeof id==='string'),'residenti edificio');
      check(b.inventory&&itemsValid(b.inventory.items)&&finite(b.inventory.capacity,1),'inventario edificio');
      check(Object.entries(b.inventory.items).reduce((s,[good,n])=>s+n*window.TERRA_GOODS[good].volume,0)<=b.inventory.capacity,'capacità edificio');
      check(b.requiredMaterials===undefined||b.requiredMaterials===null||itemsValid(b.requiredMaterials),'materiali cantiere');
      check(b.materialsConsumed===undefined||typeof b.materialsConsumed==='boolean','consumo cantiere');
      check(b.repairMaterialDebt===undefined||finite(b.repairMaterialDebt,0,1),'debito riparazione');
      if(b.type==='farm')check(b.crop===undefined||b.crop==='Grano'||typeof b.crop==='string'&&Object.hasOwn(window.TERRA_CROPS,b.crop),'coltura');
      if(b.type==='market'){check(b.neutralTradeSent===undefined||typeof b.neutralTradeSent==='boolean','primo baratto neutrale');check(b.neutralTraderId===undefined||typeof b.neutralTraderId==='string','mercante neutrale');check(b.neutralTradeNextDay===undefined||finite(b.neutralTradeNextDay,0),'prossimo baratto neutrale');check(b.neutralTradeTrips===undefined||Number.isSafeInteger(b.neutralTradeTrips)&&b.neutralTradeTrips>=0,'viaggi neutrali');if(b.demand&&b.demand.planks===undefined)b.demand.planks=1;if(b.demand&&b.demand.clay===undefined)b.demand.clay=1;if(b.demand&&b.demand.copper===undefined)b.demand.copper=1;if(b.demand&&b.demand.tin===undefined)b.demand.tin=1;if(b.demand&&b.demand.bronze===undefined)b.demand.bronze=1;if(b.demand&&b.demand.pottery===undefined)b.demand.pottery=1;if(b.demand&&b.demand.wool===undefined)b.demand.wool=1;if(b.demand&&b.demand.cloth===undefined)b.demand.cloth=1;if(b.demand&&b.demand.wine===undefined)b.demand.wine=1;if(b.demand&&b.demand.oil===undefined)b.demand.oil=1;check(Number.isSafeInteger(b.money)&&b.money>=0,'liquidità mercato');check(b.demand&&Object.keys(window.TERRA_GOODS).every(k=>finite(b.demand[k],.1,10)),'domanda mercato');check(b.observedPrices===undefined||b.observedPrices&&typeof b.observedPrices==='object'&&!Array.isArray(b.observedPrices)&&Object.entries(b.observedPrices).every(([good,seen])=>materials.has(good)&&seen&&finite(seen.day,0)&&finite(seen.price,0)&&Number.isSafeInteger(seen.stock)&&seen.stock>=0),'prezzi osservati');check(Array.isArray(b.tradeLedger)&&b.tradeLedger.length<=50&&b.tradeLedger.every(x=>x&&typeof x.id==='string'&&x.ok===true&&['buy','sell'].includes(x.side)&&materials.has(x.good)&&Number.isSafeInteger(x.quantity)&&x.quantity>0&&Number.isSafeInteger(x.unitPrice)&&x.unitPrice>0&&x.total===x.quantity*x.unitPrice),'registro mercato');}
      if(b.owner>0&&b.type==='base'&&[1,2,3].includes(d.politicsRules)){check(finite(b.loyalty,0,100)&&finite(b.resistance,0,100)&&finite(b.playerInfluence,0,100),'valori politici');check(['neutral','friendly','allied','hostile'].includes(b.relationship),'relazione politica');check(Array.isArray(b.diplomacyLedger)&&b.diplomacyLedger.length<=40,'registro politico');if(d.politicsRules===3)check(b.integrationSinceDay===null||finite(b.integrationSinceDay,0),'avvio adesione');}if(b.integrationOriginOwner!==undefined)check([1,2].includes(b.integrationOriginOwner)&&[0,b.integrationOriginOwner].includes(b.owner),'provenienza edificio');if(b.integratedFromOwner!==undefined)check(b.type==='base'&&b.owner===0&&[1,2].includes(b.integratedFromOwner)&&b.relationship==='integrated'&&(b.integrationMode===undefined||['peaceful','military'].includes(b.integrationMode)),'villaggio integrato');if(b.occupationSinceDay!==undefined)check(finite(b.occupationSinceDay,0),'inizio occupazione');if(b.occupationStability!==undefined)check(finite(b.occupationStability,0,100),'fiducia villaggio');if(b.rebelledDay!==undefined)check(finite(b.rebelledDay,0),'giorno rivolta');if(b.unrestSinceDay!==undefined)check(b.unrestSinceDay===null||finite(b.unrestSinceDay,0),'inizio disordine');if(b.siegeDefenderIds!==undefined)check(b.siegeDefenderIds===null||Array.isArray(b.siegeDefenderIds)&&b.siegeDefenderIds.length<=2&&b.siegeDefenderIds.every(id=>typeof id==='string'),'difensori assedio');if(b.siegeReadyDay!==undefined)check(b.siegeReadyDay===null||finite(b.siegeReadyDay,0),'giorno resa');
      if(b.batch){const recipe=window.TERRA_RECIPES[b.type]?.find(r=>r.id===b.batch.recipeId)||window.TERRA_RECIPES[b.type]?.find(r=>b.batch.input===Object.keys(r.inputs)[0]&&b.batch.output===Object.keys(r.outputs)[0]);const inputs=b.batch.inputs||{[b.batch.input]:b.batch.amount},outputs=b.batch.outputs||{[b.batch.output]:b.batch.amount};check(recipe&&Object.entries(recipe.inputs).every(([k,n])=>inputs[k]===n)&&Object.entries(recipe.outputs).every(([k,n])=>outputs[k]===n)&&finite(b.batch.remaining,0,recipe.seconds),'ricetta');}
    }
    for(const u of d.units){
      check(Number.isSafeInteger(u.owner)&&u.owner>=0&&u.owner<=3,'proprietario abitante');
      if(u.owner>0)check(d.neutralRules===1&&typeof u.neutralSettlementId==='string'&&d.buildings.some(b=>b.owner===u.owner&&b.type==='base'&&b.settlementId===u.neutralSettlementId),'appartenenza neutrale');
      check(u.communityTrust===undefined||Number.isSafeInteger(u.communityTrust)&&u.communityTrust>=0&&u.communityTrust<=100,'fiducia persona');check(u.fedUntil===undefined||finite(u.fedUntil,0),'copertura alimentare');check(u.unfedDays===undefined||Number.isSafeInteger(u.unfedDays)&&u.unfedDays>=0,'giorni senza razione');check(u.nutritionDamage===undefined||finite(u.nutritionDamage,0,100),'danno da fame');check(u.hungry===undefined||typeof u.hungry==='boolean','fame');check(u.homeVillageId===undefined||typeof u.homeVillageId==='string','domicilio');check(u.neutralTradeRole===undefined||typeof u.neutralTradeRole==='boolean','mercante neutrale');
      check(u.money===undefined||Number.isSafeInteger(u.money)&&u.money>=0,'denaro abitante');
      check(u.mobilized===undefined||typeof u.mobilized==='boolean','mobilitazione');
      check(!u.mobilized||u.location?.kind==='world','mobilitato sulla mappa');
      check(u.location&&(u.location.kind==='world'&&(u.location.settlementId===null||typeof u.location.settlementId==='string')||u.location.kind==='resident'&&typeof u.location.settlementId==='string'),'collocazione abitante');
      check(u.occupation===(u.task?.type||'idle'),'occupazione abitante');
      check(typeof u.name==='string'&&u.name.length<=80&&!/[<>]/.test(u.name),'nome');check(u.origin===undefined||['ordinary','ver-sacrum-youth'].includes(u.origin),'origine abitante');check(u.mentorId===undefined||u.mentorId===null||typeof u.mentorId==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(u.mentorId),'maestro');
      check(u.inventory&&finite(u.inventory.cap,1)&&Number.isSafeInteger(u.inventory.amount)&&u.inventory.amount>=0&&u.inventory.amount<=u.inventory.cap,'carico');
      check(u.inventory.amount===0||materials.has(u.inventory.type),'merce');
      check(u.skills&&u.xp&&['wood','food','stone','iron','farming','construction','taming','combat'].every(k=>finite(u.skills[k],1))&&['transport','milling','carpentry','baking','herding','trading','pottery','weaving','metallurgy','pressing','healing'].every(k=>u.skills[k]===undefined||finite(u.skills[k],1)),'skill');
      check(u.followRepathTimer===undefined||finite(u.followRepathTimer,0,3),'timer segui maestro');
      check(u.lastTreatmentDay===undefined||Number.isSafeInteger(u.lastTreatmentDay)&&u.lastTreatmentDay>=0,'ultima cura');
      check(u.guardDuty===undefined||typeof u.guardDuty==='boolean','servizio sentinella');check(u.guardPostId===undefined||u.guardPostId===null||typeof u.guardPostId==='string','base sentinella');check(u.guardCheckTimer===undefined||finite(u.guardCheckTimer,0,1),'ricerca sentinella');check(u.guardRepathTimer===undefined||finite(u.guardRepathTimer,0,2),'percorso sentinella');if(u.guardDuty)check(u.owner===0&&u.mobilized&&u.location.kind==='world'&&typeof u.guardPostId==='string','sentinella attiva');
      check(u.healerDuty===undefined||typeof u.healerDuty==='boolean','servizio curante');check(u.healerPostId===undefined||u.healerPostId===null||typeof u.healerPostId==='string','base curante');check(u.healerCheckDay===undefined||Number.isSafeInteger(u.healerCheckDay)&&u.healerCheckDay>=-1,'giorno ricerca curante');if(u.healerDuty)check(u.owner===0&&u.location.kind==='world'&&typeof u.healerPostId==='string','curante attivo');
      check(u.personalKnowledge===undefined||Array.isArray(u.personalKnowledge)&&u.personalKnowledge.every(k=>typeof k==='string'),'sapere personale');
      check(Object.values(u.xp).every(v=>finite(v,0)),'XP');check(finite(u.workTimer)&&finite(u.attackCooldown,0),'timer unità');
      check(['idle','moving','gathering','building','taming','combat','farming','hauling','producing','repairing','livestock','caravan','raiding','healing','following'].includes(u.state),'stato');
      if(u.location.kind==='resident')check(u.task===null&&u.state==='idle'&&u.path.length===0,'stato residente');
      check(Array.isArray(u.path)&&u.path.every(p=>finite(p.x,0,mapSize)&&finite(p.y,0,mapSize)),'percorso');
      if(u.task){check(['move','gather','return','build','farm','enter','tame','attack','haul','production','repair','livestock','caravan','raid','heal','follow-mentor'].includes(u.task.type),'ordine');
        if(u.task.interceptThief!==undefined){check(u.task.type==='attack'&&u.task.interceptThief===true&&finite(u.task.repathIn,0,2),'inseguimento ladro');check(u.task.interceptOriginX===undefined&&u.task.interceptOriginY===undefined||finite(u.task.interceptOriginX,0,mapSize)&&finite(u.task.interceptOriginY,0,mapSize),'origine inseguimento ladro');}
        if(u.task.type==='follow-mentor')check(u.owner===0&&u.state==='following'&&typeof u.task.target==='string'&&u.task.target!==u.id&&u.task.target===u.mentorId,'ordine segui maestro');
        if(u.task.type==='heal')check(typeof u.task.target==='string'&&d.units.some(p=>p.id===u.task.target&&p.owner===0)&&['source','patient'].includes(u.task.phase)&&(u.task.source===null||typeof u.task.source==='string')&&u.owner===0&&u.state==='healing','ordine cura');
        if(u.task.type==='raid')check(typeof u.task.target==='string'&&u.mobilized&&u.owner===0,'razzia');
        if(u.task.type==='haul'){check(u.task.autoLink===undefined||u.task.autoLink===true&&Number.isSafeInteger(u.task.autoKeep)&&u.task.autoKeep>=0&&(u.task.autoMax===undefined||Number.isSafeInteger(u.task.autoMax)&&u.task.autoMax>0&&u.task.autoMax<=u.inventory.cap)&&(u.task.autoVia===undefined||typeof u.task.autoVia==='string')&&(u.task.autoDue===undefined||u.task.autoDue===true&&typeof u.task.autoVia==='string'),'trasporto automatico');check(typeof u.task.source==='string'&&typeof u.task.destination==='string'&&materials.has(u.task.good)&&['waiting','source','destination'].includes(u.task.phase)&&Number.isSafeInteger(u.task.amount)&&u.task.amount>=0&&u.task.amount<=u.inventory.cap&&typeof u.task.repeat==='boolean'&&finite(u.task.retry,0),'trasporto');}
        if(u.task.type==='production')check(typeof u.task.target==='string'&&['mugnaio','fornaio','falegname','ceramista','tessitore','fonditore','torchiatore'].includes(u.task.profession),'mestiere');
        if(u.task.type==='livestock')check(typeof u.task.target==='string'&&u.task.profession==='allevatore','mestiere allevamento');
        if(u.task.type==='caravan'&&u.task.barter){check(u.task.marketPath===undefined||Array.isArray(u.task.marketPath)&&u.task.marketPath.every(p=>finite(p.x,0,mapSize)&&finite(p.y,0,mapSize)),'percorso commerciale');check(u.task.returnPath===undefined||Array.isArray(u.task.returnPath)&&u.task.returnPath.every(p=>finite(p.x,0,mapSize)&&finite(p.y,0,mapSize)),'percorso rientro commerciale');check(u.task.retryAfterDay===undefined||finite(u.task.retryAfterDay,0),'riprovare carovana');check(u.task.blockedAttempts===undefined||Number.isSafeInteger(u.task.blockedAttempts)&&u.task.blockedAttempts>=0&&u.task.blockedAttempts<=3,'tentativi carovana');}if(u.task.type==='caravan'&&u.task.barter)check(typeof u.task.source==='string'&&typeof u.task.market==='string'&&materials.has(u.task.offerGood)&&materials.has(u.task.good)&&Number.isSafeInteger(u.task.offerQuantity)&&u.task.offerQuantity>0&&Number.isSafeInteger(u.task.quantity)&&u.task.quantity>0&&['source','market','return'].includes(u.task.phase)&&typeof u.task.traded==='boolean','carovana baratto');
        if(u.task.type==='caravan'&&!u.task.barter)check(typeof u.task.market==='string'&&materials.has(u.task.good)&&Number.isSafeInteger(u.task.quantity)&&u.task.quantity>0&&['buy','sell'].includes(u.task.side)&&typeof u.task.transactionId==='string'&&['market','return'].includes(u.task.phase)&&u.task.home&&finite(u.task.home.x,0,mapSize)&&finite(u.task.home.y,0,mapSize)&&typeof u.task.traded==='boolean'&&typeof u.task.threatened==='boolean','carovana');
      }
    }
    check(d.constructionRules===undefined||d.constructionRules===1,'regole sapere edilizio');
    check(d.tribalKnowledge===undefined||Array.isArray(d.tribalKnowledge)&&d.tribalKnowledge.every(k=>typeof k==='string'),'sapere tribale');
    check(d.equipmentRules===undefined||d.equipmentRules===1,'regole equipaggiamento');
    if(d.equipmentRules===undefined)check(d.gear===undefined,'equipaggiamento senza versione');
    else {
      check(Array.isArray(d.gear),'oggetti individuali');
      const occupied=new Set(),counts=new Map(),rules=window.TERRA_EQUIPMENT.rules,catalog=window.TERRA_EQUIPMENT.catalog;
      for(const item of d.gear){
        check(item&&typeof item.id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(item.id)&&!ids.has(item.id),'ID oggetto');ids.add(item.id);
        check(Object.hasOwn(catalog,item.type),'tipo oggetto');const l=item.location;
        check(l&&['bag','equipped','storage','ground'].includes(l.kind),'posizione oggetto');
        if(l.kind==='ground'){check(finite(l.x,0,mapSize)&&finite(l.y,0,mapSize)&&Object.keys(l).length===3,'oggetto a terra');continue;}
        check(Object.keys(l).length===(l.kind==='equipped'?3:2),'proprietà posizione oggetto');
        if(l.kind==='storage')check(d.buildings.some(b=>b.id===l.holder&&b.owner===0&&['base','warehouse','house'].includes(b.type)),'deposito oggetto');
        else check(d.units.some(u=>u.id===l.holder),'persona oggetto');
        const key=l.kind+':'+l.holder;
        if(l.kind==='equipped'){check(rules.slots.includes(l.slot)&&catalog[item.type].slot===l.slot&&!occupied.has(key+':'+l.slot),'slot oggetto');occupied.add(key+':'+l.slot);}
        else {counts.set(key,(counts.get(key)||0)+1);check(counts.get(key)<=(l.kind==='bag'?rules.bagCapacity:rules.rackCapacity),'capacità oggetti');}
      }
    }
    const residentIds=d.buildings.flatMap(b=>b.residents);
    check(new Set(residentIds).size===residentIds.length,'residente duplicato');
    for(const u of d.units)if(u.location.kind==='resident')check(residentIds.includes(u.id)&&d.buildings.some(b=>b.id===u.location.settlementId&&b.owner===u.owner&&b.type==='house'&&b.residents.includes(u.id)),'legame residente');
    check(residentIds.every(id=>d.units.some(u=>u.id===id&&u.location.kind==='resident')),'elenco residenti');
    for(const a of d.animals){if(a.integrationOriginOwner!==undefined)check([1,2].includes(a.integrationOriginOwner)&&[0,a.integrationOriginOwner].includes(a.owner),'provenienza animale');check(['sheep','wolf'].includes(a.type)&&finite(a.vx)&&finite(a.vy)&&finite(a.wander)&&finite(a.attackCooldown,0),'animale');check(a.penId===undefined||a.penId===null||typeof a.penId==='string'&&d.buildings.some(b=>b.id===a.penId&&b.type==='pen'&&b.animalIds?.includes(a.id)),'recinto animale');}
    for(const r of d.raiders){check(r.raidStoreId===undefined||r.raidStoreId===null||typeof r.raidStoreId==='string','bersaglio magazzino razziatore');check(r.lootStoreId===undefined||r.lootStoreId===null||typeof r.lootStoreId==='string'&&r.lootFood>0,'origine bottino razziatore');check(r.lootFood===undefined||Number.isSafeInteger(r.lootFood)&&r.lootFood>=0&&r.lootFood<=5,'bottino razziatore');check(r.escapedWithLoot===undefined||typeof r.escapedWithLoot==='boolean','fuga razziatore');check(finite(r.speed,0)&&finite(r.repath)&&finite(r.attackCooldown,0)&&Array.isArray(r.path)&&r.path.every(p=>finite(p.x,0,mapSize)&&finite(p.y,0,mapSize)),'razziatore');}
    for(const c of d.warCamps||[]){check(c.stolenFood===undefined||Number.isSafeInteger(c.stolenFood)&&c.stolenFood>=0,'scorta rubata campo ostile');check(c.stolenFoodRecovered===undefined||typeof c.stolenFoodRecovered==='boolean','recupero campo ostile');check(typeof c.id==='string'&&!ids.has(c.id),'ID campo ostile');ids.add(c.id);check(c.type==='enemy_camp'&&c.owner===-1&&finite(c.x,0,mapSize)&&finite(c.y,0,mapSize)&&finite(c.health,0)&&finite(c.maxHealth,1),'campo ostile');}
    for(const r of d.resources){check(materials.has(r.type)&&Number.isSafeInteger(r.amount)&&r.amount>=0&&finite(r.max,r.amount),'risorsa');check(r.recoveredLoot===undefined||r.recoveredLoot===true&&r.type==='food','cibo recuperato');}
    // Validate capacity reservations from jobs before any live-world mutation.
    for(const b of d.buildings){
      const jobs=d.units.filter(u=>u.health>0&&u.task?.type==='haul').map(u=>u.task);
      const incoming=jobs.filter(t=>t.destination===b.id&&['source','destination'].includes(t.phase)).reduce((n,t)=>n+t.amount,0);
      check(Object.entries(b.inventory.items).reduce((n,[good,v])=>n+v*window.TERRA_GOODS[good].volume,0)+(b.batch?.outputVolume??b.batch?.amount??0)+incoming<=b.inventory.capacity,'spazio prenotato');
      for(const good of materials){const outgoing=jobs.filter(t=>t.source===b.id&&t.phase==='source'&&t.good===good).reduce((n,t)=>n+t.amount,0);check(outgoing<=(b.inventory.items[good]||0),'merce prenotata');}
    }
    check(d.roads.every(p=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isInteger(v)&&v>=0&&v<mapSize)),'strade');
    if(d.terrainChanges!==undefined){
      check(Array.isArray(d.terrainChanges)&&d.terrainChanges.length<=mapSize*mapSize,'modifiche terreno');const positions=new Set();
      for(const patch of d.terrainChanges){
        check(patch&&Number.isInteger(patch.x)&&Number.isInteger(patch.y)&&patch.x>=0&&patch.y>=0&&patch.x<mapSize&&patch.y<mapSize,'posizione modifica terreno');
        const key=patch.y*mapSize+patch.x;check(!positions.has(key),'modifica terreno duplicata');positions.add(key);
        const fields=Object.keys(patch).filter(k=>k!=='x'&&k!=='y');
        check(fields.length>0&&fields.every(k=>['biome','z','nearWater'].includes(k)),'campi modifica terreno');
        if(Object.hasOwn(patch,'biome'))check(Object.hasOwn(BIOME,patch.biome),'bioma modificato');
        if(Object.hasOwn(patch,'z'))check(Number.isInteger(patch.z)&&patch.z>=0&&patch.z<=10,'quota modificata');
        if(Object.hasOwn(patch,'nearWater'))check(typeof patch.nearWater==='boolean','acqua modificata');
      }
    }
    check(d.clock&&['day','month','year','totalDays','nextRaidDay','raidLevel','dayAccumulator'].every(k=>finite(d.clock[k])),'calendario');
    check(finite(d.clock.day,1,30)&&finite(d.clock.month,0,11)&&finite(d.clock.totalDays,0)&&finite(d.clock.dayAccumulator,0,1),'tempo');
    check(d.camera&&finite(d.camera.x)&&finite(d.camera.y)&&finite(d.camera.zoom,.48,2.3),'camera');
    check(Number.isInteger(d.rngState)&&d.rngState>=0&&d.rngState<=4294967295,'generatore');
    check(typeof d.paused==='boolean'&&typeof d.gameEnded==='boolean','pausa');check(d.timeScale===undefined||[1,2,4].includes(d.timeScale),'velocità');
    check(Array.isArray(d.selection)&&d.selection.every(id=>typeof id==='string'),'selezione');
    return d;
  }

  function migrate(old) {
    check(old&&old.version===undefined&&itemsValid(old.stock),'vecchio formato');
    const d=clone(old);d.version=3;d.raiders=[];d.rngState=d.seed>>>0;d.paused=true;d.gameEnded=false;d.selection=[];
    d.clock={...d.clock,dayAccumulator:0};
    for(const b of d.buildings){b.inventory={items:{},capacity:window.TERRA_CAPACITY[b.type]||80};b.batch=null;}
    const base=d.buildings.find(b=>b.type==='base');check(base,'deposito originale');
    base.inventory.items={...d.stock};base.inventory.capacity=Math.max(base.inventory.capacity,Object.values(d.stock).reduce((a,b)=>a+b,0));
    // Old harvests could exceed carrying capacity. Preserve all existing goods.
    for(const u of d.units){u.inventory.cap=Math.max(u.inventory.cap,u.inventory.amount);u.workTimer=Math.max(0,u.workTimer||0);u.attackCooldown=Math.max(0,u.attackCooldown||0);}
    return migrateV4(migrateV3(d));
  }

  function migrateV3(old){
    check(old&&old.version===3,'versione precedente');
    const d=clone(old);d.version=4;
    check(Array.isArray(d.units),'abitanti precedenti');
    for(const u of d.units){u.owner=0;u.location={kind:'world',settlementId:null};u.occupation=u.task?.type||'idle';}
    return d;
  }

  function migrateV4(old){
    check(old&&old.version===4,'versione precedente');
    const d=clone(old);d.version=5;
    for(const b of d.buildings)b.residents=[];
    return validate(d);
  }

  Game.prototype.snapshot=function(){
    this.ensureInventories();this.ensureMarkets?.();
    return {version:5,populationRules:1,neutralRules:1,equipmentRules:1,gear:this.gear||[],seed:this.seed,worldSize:this.world.size,...(this.world.size>=1024?{resourceChunkBits:chunkBits(this.world.resourceChunksLoaded,this.world.size)}:this.world.size>WORLD_SIZE?{resourceChunksLoaded:[...this.world.resourceChunksLoaded]}:{}),...(this.world.size>=256?{resourceMode:'changes'}:{}),rngState:this.rng.s,paused:this.paused,gameEnded:this.gameEnded,timeScale:this.timeScale,
      clock:{day:this.day,month:this.month,year:this.year,totalDays:this.totalDays,nextRaidDay:this.nextRaidDay,raidLevel:this.raidLevel,dayAccumulator:this.dayAccumulator},
      roads:this.world.changedRoads(),terrainChanges:this.world.terrainChanges(),resources:this.world.size>=256?this.world.resources.filter(r=>!r.id.startsWith(`rp-${this.seed}-`)||r.amount!==r.max||r.depletedAt!==null||r.regrowing||r.cleared):this.world.resources,buildings:this.buildings,units:this.units,animals:this.animals,raiders:this.raiders,camera:this.camera,
      selection:(this.rtsSelectedUnits?.()||[]).map(u=>u.id),selectedId:this.selected?.id||null};
  };
  Game.prototype.save=function(show=false){
    try{
      const slot=this.world.size>WORLD_SIZE?`${SLOT}-${this.world.size}`:SLOT,temp=slot+'-pending',backup=slot+'-backup';
      const raw=JSON.stringify(this.snapshot());validate(JSON.parse(raw));
      localStorage.setItem(temp,raw);check(localStorage.getItem(temp)===raw,'scrittura temporanea');
      const previous=localStorage.getItem(slot);
      if(previous){try{validate(JSON.parse(previous));localStorage.setItem(backup,previous)}catch(e){if(e.name==='QuotaExceededError')throw e;}}
      localStorage.setItem(slot,raw);localStorage.removeItem(temp);this.saveFailed=false;return true;
    }catch(e){this.lastSaveError=e.message;this.saveFailed=true;if(show)this.message('Salvataggio non riuscito: spazio locale insufficiente o dati non validi.');return false;}
  };
  Game.prototype.load=function(){
    try{
      let d, recovered=false;
      const expectedSize=this.experimentalWorldSize||WORLD_SIZE,experimental=expectedSize>WORLD_SIZE,slot=experimental?`${SLOT}-${expectedSize}`:SLOT;
      const current=localStorage.getItem(slot),previous=experimental?null:localStorage.getItem(PREVIOUS),older=experimental?null:localStorage.getItem(OLDER),legacy=experimental?null:localStorage.getItem(SAVE_KEY);
      if(!current&&!previous&&!older&&!legacy){this.message('Nessun salvataggio presente.');return false;}
      if(current){try{d=validate(JSON.parse(current))}catch(e){const backup=localStorage.getItem(slot+'-backup');if(!backup)throw e;d=validate(JSON.parse(backup));recovered=true;}}
      else if(previous){try{d=migrateV4(JSON.parse(previous))}catch(e){const backup=localStorage.getItem(PREVIOUS+'-backup');if(!backup)throw e;d=migrateV4(JSON.parse(backup));recovered=true;}}
      else if(older){try{d=migrateV4(migrateV3(JSON.parse(older)))}catch(e){const backup=localStorage.getItem(OLDER+'-backup');if(!backup)throw e;d=migrateV4(migrateV3(JSON.parse(backup)));recovered=true;}}
      else d=migrate(JSON.parse(legacy));
      check((d.worldSize||WORLD_SIZE)===expectedSize,'slot mappa');
      // Construct and resolve everything before replacing the running world.
      const world=new World(d.seed,d.worldSize||WORLD_SIZE),rng=new RNG(d.seed);
      for(const [x,y] of d.roads)world.tile(x,y).road=true;
      for(const patch of d.terrainChanges||[]){const tile=world.tile(patch.x,patch.y);for(const field of ['biome','z','nearWater'])if(Object.hasOwn(patch,field))tile[field]=patch[field];}
      world.trimChunkCache?.();
      const naturalResources=world.resources;
      const natural=new Map(naturalResources.map(r=>[`${r.type}:${r.x}:${r.y}`,r]));
      const visitedChunks=world.size>WORLD_SIZE?chunkKeys(d,world.size):null;
      if(d.resourceMode==='changes'){
        if(world.size>=1024){
          // Remember the visited geography without materializing every distant node.
          world.resourceChunksLoaded=new Set(visitedChunks);
          world.resourceChunksResident=new Set();world.resourceOverrides=new Map();
          const restore=o=>Object.assign(new ResourceNode(o.type,o.x,o.y,o.amount),o);
          for(const change of d.resources){const r=restore(change);world.resources.push(r);if(r.id.startsWith(`rp-${d.seed}-`))world.resourceOverrides.set(r.id,r);}
          const visited=world.resourceChunksLoaded,side=world.chunkSize||8;
          const near=(x,y,radius=2)=>{
            if(!Number.isFinite(x)||!Number.isFinite(y))return;
            const left=Math.max(0,Math.floor((x-radius)/side)),right=Math.min(Math.ceil(world.size/side)-1,Math.floor((x+radius)/side));
            const top=Math.max(0,Math.floor((y-radius)/side)),bottom=Math.min(Math.ceil(world.size/side)-1,Math.floor((y+radius)/side));
            for(let cy=top;cy<=bottom;cy++)for(let cx=left;cx<=right;cx++)if(visited.has(`${cx},${cy}`))world.generateResourceChunk(cx,cy);
          };
          for(const e of [...d.units,...d.animals,...d.raiders,...d.buildings])near(e.x,e.y);
          const target=id=>{if(typeof id!=='string'||!id.startsWith(`rp-${d.seed}-`))return;const parts=id.split('-'),x=Number(parts.at(-2))/100,y=Number(parts.at(-1))/100;near(x,y,0);};
          target(d.selectedId);for(const u of d.units)target(u.task?.target);
        }else{
          for(const key of visitedChunks){const [cx,cy]=key.split(',').map(Number);world.generateResourceChunk(cx,cy);}
          const byId=new Map(world.resources.map(r=>[r.id,r]));
          for(const change of d.resources){
            const original=byId.get(change.id);
            if(original)Object.assign(original,change);
            else if(!change.id.startsWith(`rp-${d.seed}-`))world.resources.push(Object.assign(new ResourceNode(change.type,change.x,change.y,change.amount),change));
            else throw new Error('Risorsa naturale sconosciuta.');
          }
        }
      }else{
        if(world.size>WORLD_SIZE)world.resourceChunksLoaded=new Set(visitedChunks);
        world.resources=d.resources.map((o,index)=>{
          const r=Object.assign(new ResourceNode(o.type,o.x,o.y,o.amount),o);
          const indexed=naturalResources[index];
          const original=natural.get(`${r.type}:${r.x}:${r.y}`)||(indexed?.type===r.type?indexed:null);
          if(!r.naturalScale&&original&&r.max===original.max/10){r.amount*=10;r.max*=10;r.naturalScale=10;}
          return r;
        });
      }
      const buildings=d.buildings.map(o=>{const b=Object.assign(new Building(o.type,Math.floor(o.x),Math.floor(o.y),o.owner,o.progress>=1),o);if(b.type==='farm'&&(b.crop===undefined||b.crop==='Grano'))b.crop='grain';if(b.type==='tower'&&o.towerNeedsGuard===undefined)b.towerNeedsGuard=false;return b;});
      if(d.populationRules!==1)for(const b of buildings)if(b.type==='house')b.birthDays=0;
      const units=d.units.map(({occupation,...o})=>{const u=new Unit(o.name,o.x,o.y,rng),defaults=u.skills;return Object.assign(u,o,{skills:{...defaults,...o.skills}});});
      const animals=d.animals.map(o=>Object.assign(new Animal(o.type,o.x,o.y,o.owner),o));
      const raiders=d.raiders.map(o=>Object.assign(new Raider(o.x,o.y),o));rng.s=d.rngState;
      const entities=[...units,...buildings,...animals,...raiders,...world.resources],existing=new Set(entities.map(e=>e.id));
      for(const u of units){
        if(u.task?.type==='haul'){
          const t=u.task,source=buildings.find(b=>b.id===t.source&&b.health>0),dest=buildings.find(b=>b.id===t.destination&&b.health>0);
          if(!source||!dest){u.task=null;u.state='idle';u.path=[];}
          else if(t.phase==='destination')check(u.inventory.type===t.good&&u.inventory.amount===t.amount,'carico in viaggio');
          else check(u.inventory.amount===0,'trasporto senza prelievo');
        }else if(u.task?.type==='caravan'){
          const market=buildings.find(b=>b.id===u.task.market&&b.health>0&&b.built&&b.type==='market');
          if(!market&&u.task.phase==='market'){u.task=null;u.state='idle';u.path=[];}
        }else if(u.task?.target&&!existing.has(u.task.target)){u.task=null;u.state='idle';u.path=[];}
      }
      for(const b of buildings){b.assigned=b.assigned.filter(id=>units.some(u=>u.id===id&&u.health>0&&(u.task?.type==='farm'&&u.task.target===b.id||u.task?.after?.type==='farm'&&u.task.after.target===b.id)));b.workers=(b.workers||[]).filter(id=>units.some(u=>u.id===id&&u.health>0&&((u.task?.type==='production'||u.task?.type==='livestock')&&u.task.target===b.id)));if(b.type==='pen')b.animalIds=(b.animalIds||[]).filter(id=>animals.some(a=>a.id===id&&a.health>0&&a.owner===0));}
      const clock=Object.fromEntries(['day','month','year','totalDays','nextRaidDay','raidLevel','dayAccumulator'].map(k=>[k,d.clock[k]]));
      Object.assign(this,{seed:d.seed,world,experimentalWorldSize:world.size,rng,buildings,units,animals,raiders,warCamps:d.warCamps||[],gameResult:d.gameResult||null,gameMode:d.gameMode||'legacy',gear:d.gear||[],tribalKnowledge:d.tribalKnowledge,savedGroups:d.savedGroups||{},...clock,camera:d.camera});
      this.ensureInventories();this.groupSelection=units.filter(u=>u.health>0&&u.location.kind==='world'&&d.selection.includes(u.id));
      this.selected=entities.find(e=>e.id===d.selectedId)||this.groupSelection[0]||units[0]||null;
      for(const u of units)u.selected=this.groupSelection.includes(u);
      this.lastSelectedUnit=this.selected instanceof Unit?this.selected:units[0]||null;
      this.orderMode=null;this.buildMode=null;this.pointerCancel();this.syncModeButtons();this.autosave=0;
      this.setTimeScale(d.timeScale??1);this.gameEnded=d.gameEnded||units.every(u=>u.health<=0)||!buildings.some(b=>b.type==='base'&&b.alive);
      $('#gameOver').classList.toggle('hidden',!this.gameEnded);this.setPaused(true);this.lastFrame=performance.now();this.updateUI();
      this.message(recovered?'Ripristinata la copia precedente. Premi ▶ per riprendere.':current?'Partita caricata in pausa. Premi ▶.':'Salvataggio precedente importato. Originale conservato. Premi ▶.');return true;
    }catch(e){console.warn(e.message);this.message('Salvataggio non valido: la partita attuale è rimasta intatta.');return false;}
  };
  Game.prototype.setPaused=function(paused){this.paused=paused;this.lastFrame=performance.now();$('#pauseBtn').textContent=paused?'▶':'Ⅱ';$('#pauseBtn').setAttribute('aria-label',paused?'Riprendi':'Pausa');this.refreshSessionState();};
  Game.prototype.refreshSessionState=function(){const el=$('#sessionState');if(el)el.textContent=this.suspended?'Sospesa':this.paused?'In pausa · premi ▶ per riprendere':'';const notice=$('#pauseNotice');if(notice)notice.classList.toggle('hidden',!this.paused||this.suspended||this.gameEnded);};
  Game.prototype.suspend=function(){if(this.suspended)return;this.suspended=true;this.pointerCancel();this.orderMode=null;this.buildMode=null;this.syncModeButtons();this.lastFrame=performance.now();this.save(true);this.refreshSessionState();};
  Game.prototype.resumeFromBackground=function(){if(!this.suspended)return;this.suspended=false;this.setPaused(true);this.message('Partita in pausa. Premi ▶ per riprendere.');};
  Game.prototype.installLifecycle=function(){
    $('#resumeGame').onclick=()=>this.setPaused(false);
    document.addEventListener('visibilitychange',()=>document.hidden?this.suspend():this.resumeFromBackground());
    addEventListener('pagehide',()=>this.suspend());addEventListener('pageshow',()=>{if(!document.hidden)this.resumeFromBackground()});
    addEventListener('blur',()=>this.pointerCancel());
  };
  const newGame=Game.prototype.newGame;
  Game.prototype.newGame=function(seed){newGame.call(this,seed);this.autosave=0;this.suspended=!!document.hidden;this.setPaused(false);};
})();

