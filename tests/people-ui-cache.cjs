const test=require('node:test');
const assert=require('node:assert/strict');
const make=require('./harness.cjs');

test('unchanged people list keeps its DOM, while a status change refreshes it',()=>{
  const {g,byId}=make(),people=byId.people;
  let html=people.innerHTML,writes=0;
  Object.defineProperty(people,'innerHTML',{get:()=>html,set:value=>{html=value;writes++;},configurable:true});
  g.updateUI();g.updateUI();assert.equal(writes,0);
  g.units[0].health-=7;g.updateUI();assert.equal(writes,2);
  assert.match(html,/HP 93/);
  g.updateUI();assert.equal(writes,2);
  assert.equal((html.match(/data-open-community/g)||[]).length,1);
});
