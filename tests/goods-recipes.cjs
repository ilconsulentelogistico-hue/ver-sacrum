const test=require('node:test'),assert=require('node:assert/strict'),make=require('./harness.cjs');
const setup=type=>{const e=make(),g=e.g;g.newGame(123456);g.feedPeople();const b=e.run(`(()=>{const b=new Building('${type}',40,40,0,true);game.buildings.push(b);game.ensureInventories();return b})()`),u=g.units[0];u.x=b.x+1;u.y=b.y;u.path=[];g.assignProduction(u,b);return{...e,g,b,u}};

test('catalog covers every crop, livestock input and recipe product with volume',()=>{const{sandbox}=make();for(const good of ['grain','barley','grapes','olives','forage','milk','flour','barleyFlour','bread','barleyBread'])assert(sandbox.TERRA_GOODS[good]?.volume>0,good)});

for(const spec of [
  {name:'barley flour',type:'mill',input:'barley',output:'barleyFlour'},
  {name:'barley bread',type:'bakery',input:'barleyFlour',output:'barleyBread'}
]){
  test(`${spec.name}: absent local input starts no batch`,()=>{const{g,b}=setup(spec.type);g.updateBuilding(b,1);assert.equal(b.batch,null);assert.equal(b.inventory.items[spec.output]||0,0)});
  test(`${spec.name}: full output inventory blocks consumption`,()=>{const{g,b}=setup(spec.type);b.inventory.capacity=3;b.inventory.items[spec.input]=2;b.inventory.items.stone=1;g.updateBuilding(b,.1);assert.equal(b.batch,null);assert.equal(b.inventory.items[spec.input],2)});
  test(`${spec.name}: interrupted worker pauses without duplicate output`,()=>{const{g,b,u}=setup(spec.type);b.inventory.items[spec.input]=2;g.updateBuilding(b,.1);const left=b.batch.remaining;g.cancelTask(u);g.updateBuilding(b,20);assert.equal(b.batch.remaining,left);assert.equal(b.inventory.items[spec.input],0);assert.equal(b.inventory.items[spec.output]||0,0)});
  test(`${spec.name}: reload resumes one persistent batch`,()=>{const{g,b}=setup(spec.type);b.inventory.items[spec.input]=2;g.updateBuilding(b,.1);assert(g.save());assert(g.load());const loaded=g.buildings.find(x=>x.id===b.id),worker=g.units.find(x=>x.task?.target===loaded.id);worker.x=loaded.x+1;worker.y=loaded.y;g.updateBuilding(loaded,20);assert.equal(loaded.batch,null);assert.equal(loaded.inventory.items[spec.output],3);g.updateBuilding(loaded,20);assert.equal(loaded.inventory.items[spec.output],3)});
}

