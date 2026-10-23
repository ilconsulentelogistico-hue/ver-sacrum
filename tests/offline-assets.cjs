const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');

test('offline cache contains every current P16 profession, resource, animal and building',()=>{
  const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  const list=sw.match(/const ASSETS=\[(.*?)\];/s);
  assert(list);
  const files=[...list[1].matchAll(/'\.\/([^']*)'/g)].map(m=>m[1]);
  assert.equal(new Set(files).size,files.length,'duplicate precache path');
  for(const file of files)assert(fs.existsSync(path.join(root,file)),`missing precache asset ${file}`);
  for(const folder of ['assets/p16/professions','assets/p16/animals-nuovi','assets/p16/resources-nuovi']){
    for(const name of fs.readdirSync(path.join(root,folder)).filter(name=>name.endsWith('.png'))){
      const file=`${folder}/${name}`;
      assert(files.includes(file),`not precached ${file}`);
    }
  }
  for(const name of ['base','sawmill','bakery','market','pen','warehouse','tower','mill','kiln','loom','foundry','press','house']){
    const file=`assets/p16/buildings/building_${name}_p16.png`;
    assert(files.includes(file),`not precached ${file}`);
  }
});
