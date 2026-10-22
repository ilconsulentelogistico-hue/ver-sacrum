const {test}=require('node:test'),assert=require('node:assert/strict'),make=require('./harness.cjs');

function farmSetup(){
  const {g,run}=make(),mentor=g.units[0],pupil=g.units[1],farm=run("new Building('farm',40,40,0,true)");
  g.buildings.push(farm);g.ensureInventories();g.feedPeople();
  for(const [i,u] of [mentor,pupil].entries()){
    u.x=farm.x+(i?1:-1);u.y=farm.y;g.assignFarm(u,farm);u.state='farming';
  }
  mentor.skills.farming=5;assert.equal(g.setWorkshopMentor(pupil.id,mentor.id),null);
  return {g,mentor,pupil,farm};
}

test('harvest gives mentor bonus only when both are working the same field',()=>{
  const {g,mentor,pupil,farm}=farmSetup();farm.growth=1;
  g.buildingDay(farm);
  assert((farm.inventory.items.grain||0)>0);
  assert.equal(mentor.xp.farming,5);assert.equal(pupil.xp.farming,7.5);
  g.cancelTask(mentor);farm.growth=1;g.buildingDay(farm);
  assert.equal(pupil.xp.farming,12.5);
});

test('gathering gives bonus only for a unit collected together at one node',()=>{
  const {g,run}=make(),mentor=g.units[0],pupil=g.units[1];
  g.world.resources=[];const node=run("new ResourceNode('wood',40.5,40.5,5)");g.world.resources.push(node);
  mentor.skills.wood=5;assert.equal(g.setWorkshopMentor(pupil.id,mentor.id),null);
  for(const [i,u] of [mentor,pupil].entries()){
    u.x=40.5+(i?0.4:-0.4);u.y=40.5;u.task={type:'gather',target:node.id,workSpot:{x:u.x,y:u.y}};
    u.state='gathering';u.workTimer=0;u.inventory.amount=0;
  }
  g.gatherTick(pupil,1);
  assert.equal(node.amount,4);assert.equal(pupil.inventory.amount,1);assert.equal(pupil.xp.wood,1.5);
  mentor.x=50;mentor.task={type:'gather',target:node.id,workSpot:{x:50,y:40.5}};
  pupil.workTimer=0;g.gatherTick(pupil,1);
  assert.equal(node.amount,3);assert.equal(pupil.xp.wood,2.5);
});
