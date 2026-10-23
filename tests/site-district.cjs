const test=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');

// A confederation start on the 256 map with a free spot near the Casa comune.
function start(options={}){
  const h=make([],options),{g,run}=h;
  g.beginStartSelection(123456);g.chooseStartWorldSize(256);g.chooseStartMode('confederation');g.chooseStartLocation(0);g.finishStartExperience();g.setPaused(false);
  const base=g.buildings.find(b=>b.type==='base'&&b.owner===0),spots=[];
  for(let d=6;d<30&&spots.length<2;d++)for(const [dx,dy] of [[d,0],[0,d],[-d,0],[0,-d]]){
    const x=Math.floor(base.x)+dx,y=Math.floor(base.y)+dy;
    if(spots.length<2&&g.world.walkable(x,y,1,null,g.buildings)&&!g.buildings.some(b=>Math.abs(b.x-x)<7&&Math.abs(b.y-y)<7)&&!spots.some(s=>Math.abs(s.x-x)<7&&Math.abs(s.y-y)<7))spots.push({x,y});
  }
  const u=g.units.find(p=>p.owner===0&&p.location.kind==='world'&&!p.task);
  const select=()=>{for(const p of g.units)p.selected=p===u;g.selected=u;g.groupSelection=[u];};
  const tap=e=>{const TILE=run('TILE'),p=g.worldToScreen(e.x*TILE,e.y*TILE);g.rtsContextTap(p.x,p.y);};
  return {...h,base,spots,u,select,tap,Building:run('Building')};
}

test('a tap on your construction site sends the selected person to build it',()=>{
  const {g,spots,u,select,tap,Building,byId}=start();
  const site=new Building('warehouse',spots[0].x+.5,spots[0].y+.5,0,false);g.buildings.push(site);g.ensureInventories();
  assert.match(g.selectionHTML(site),/Nessuno ci lavora: seleziona un abitante e tocca il cantiere/);
  select();tap(site);
  assert.equal(u.task?.type,'build');assert.equal(u.task.target,site.id);
  assert.equal(g.selected,u,'the person stays selected');
  assert.match(byId.message.textContent,new RegExp(`${u.name} va al cantiere: Magazzino`));
  assert.match(g.selectionHTML(site),new RegExp(`Al lavoro: ${u.name}`));
  // Without anyone selected the tap still selects the site.
  g.selected=null;g.groupSelection=[];for(const p of g.units)p.selected=false;tap(site);
  assert.equal(g.selected,site);
});

test('the action tap on a finished District sends the person to live there',()=>{
  const {g,spots,u,select,tap,Building,byId,run}=start();
  const house=new Building('house',spots[0].x+.5,spots[0].y+.5,0,true);g.buildings.push(house);g.ensureInventories();
  select();tap(house);
  assert.equal(u.task?.type,'enter');assert.equal(g.selected,u,'the person stays selected');
  assert.match(byId.message.textContent,new RegExp(`${u.name} va a vivere nel Distretto`));
  for(let i=0;i<600&&u.location.kind==='world';i++)g.update(.1);
  assert.equal(u.location.kind,'resident');
  // Ordini › Vai a vivere: the help no longer reads like an error and the order confirms itself.
  // Leave and stand a few tiles away, or the order would re-enter at once from the door.
  g.exitHomePerson(u.id);g.cancelTask(u);u.x=spots[1].x+.5;u.y=spots[1].y+.5;select();
  assert.equal(g.orderHelp('enter'),'Tocca il Distretto dove andrà a vivere.');
  g.orderMode='enter';const TILE=run('TILE'),p=g.worldToScreen(house.x*TILE,house.y*TILE);g.rtsLeftTap(p.x,p.y);
  assert.equal(u.task?.type,'enter');
  assert.match(byId.message.textContent,new RegExp(`${u.name} va a vivere nel Distretto`));
  // Without anyone selected the District is selected, as before.
  g.cancelTask(u);g.selected=null;g.groupSelection=[];for(const q of g.units)q.selected=false;tap(house);
  assert.equal(g.selected,house);
});

test('several possible actions open the circles; a new touch closes them without giving an order',()=>{
  const {g,spots,u,select,tap,Building,byId}=start();
  const house=new Building('house',spots[0].x+.5,spots[0].y+.5,0,true);g.buildings.push(house);g.ensureInventories();
  house.health=house.maxHealth-40;
  select();tap(house);
  assert.equal(byId.actionWheel.hidden,false);
  assert.deepEqual([...byId.actionWheel.innerHTML.matchAll(/data-wheel="([a-z]+)"/g)].map(m=>m[1]),['enter','repair','select']);
  assert.equal(u.task,null,'nothing happens before the choice');
  g.pointerDown({pointerId:1,clientX:0,clientY:0,pointerType:'touch',button:0,preventDefault(){}});
  assert.equal(byId.actionWheel.hidden,true);
  tap(house);assert.equal(u.task,null,'the closing touch is not an order');
  tap(house);assert.equal(g.chooseAction('select'),true);
  assert.equal(g.selected,house);assert.equal(u.task,null);
  select();tap(house);assert.equal(g.chooseAction('repair'),true);
  assert.equal(u.task?.type,'repair');assert.equal(byId.actionWheel.hidden,true);
});

test('the message bar stays silent about the everyday work of other villages',()=>{
  const {g,u,byId}=start({neutrals:true});
  // Record what reaches the bar, after every message filter.
  const said=[];let shown='';Object.defineProperty(byId.message,'textContent',{get:()=>shown,set:v=>{shown=String(v);said.push(shown);}});
  for(let i=0;i<2000&&g.totalDays<120;i++)g.update(.5);
  const others=g.units.filter(p=>p.owner!==0).map(p=>p.name),mine=new Set(g.units.filter(p=>p.owner===0).map(p=>p.name));
  assert(others.length>0,'the map has neutral villagers');
  const leaked=said.filter(t=>others.some(n=>!mine.has(n)&&t.includes(n))||/Trasferimento automatico verso il magazzino collegato/.test(t)&&!g.buildings.some(b=>b.owner===0&&b.type==='farm'));
  assert.deepEqual(leaked,[]);
  const resource=g.world.resourcesInBounds(u.x-12,u.y-12,u.x+12,u.y+12).find(r=>r.amount>0);
  g.assignGather(u,resource);
  assert.match(said.at(-1),new RegExp(`${u.name}: raccolta`),'the player still hears about own people');
});
