const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const make=require('./harness.cjs');
const root=path.join(__dirname,'..');

test('the current renderer maps the complete P16 set and distinct craft jobs',()=>{
  const {g,sandbox}=make();
  const names=sandbox.TERRA_UNIT_TOKENS.names;
  assert.equal(names.length,14);
  for(const name of names)assert(fs.existsSync(path.join(root,`assets/p16/professions/${name}.png`)),name);
  for(const name of ['ceramista','tessitore','fonditore','torchiatore']){
    const resident={task:{type:'production',profession:name},mobilized:false,state:'working',inventory:{}};
    assert.equal(sandbox.TERRA_UNIT_TOKENS.professionForUnit(g,resident),name);
  }
  for(const name of ['base','sawmill','bakery','market','pen','warehouse','tower','mill','kiln','loom','foundry','press','house']){
    assert(sandbox.TERRA_P16_SPRITES[name],name);
  }
  assert.equal(Object.keys(sandbox.TERRA_ANIMAL_TOKENS).length,12);
  assert.equal(Object.keys(sandbox.TERRA_RESOURCE_TILES).length,30);
});
