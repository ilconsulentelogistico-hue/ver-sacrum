const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {readFileSync}=require('node:fs');
const path=require('node:path');

test('temporary HTTP failures are never saved in the offline cache',async()=>{
  const handlers={};const writes=[];let status=503,cached=null;
  const response=()=>({ok:status>=200&&status<300,status,clone(){return this}});
  const sandbox={self:{addEventListener:(name,fn)=>handlers[name]=fn},Request:class{constructor(request){Object.assign(this,request)}},
    fetch:async()=>response(),caches:{open:async()=>({put:async(request,r)=>writes.push(r.status)}),match:async()=>cached}};
  vm.runInNewContext(readFileSync(path.join(__dirname,'..','sw.js'),'utf8'),sandbox);
  async function request(){let result;handlers.fetch({request:{method:'GET',mode:'cors',destination:'script'},respondWith:p=>result=p});return (await result).status}
  assert.equal(await request(),503);await new Promise(setImmediate);assert.deepEqual(writes,[]);
  cached={ok:true,status:200};assert.equal(await request(),200,'a valid cached script survives a temporary 503');assert.deepEqual(writes,[]);
  status=200;assert.equal(await request(),200);await new Promise(setImmediate);assert.deepEqual(writes,[200]);
});
