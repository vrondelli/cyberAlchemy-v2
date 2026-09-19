import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable,Writable} from 'node:stream';
import {createHandler} from '../src/index.mjs';

const origin='https://keld.localhost';
const app={
  index:Buffer.from('<!doctype html><title>React preview</title><div id="root"></div>'),
  assets:new Map([['/assets/index-ABC123.js',{content:Buffer.from('export default true'),type:'text/javascript',immutable:true}]])
};
const handler=createHandler({origin,app,auth:{handle:async()=>false,identity:async()=>({csrf:'fixture'})},checkout:{list:async()=>({orders:[],next:null})},diagnostic:()=>{}});

async function call(path){
  const req=Readable.from([]);req.url=path;req.method='GET';req.headers={host:new URL(origin).host};req.rawHeaders=[];
  let status=200,headers={};const chunks=[];
  const res=new Writable({write(chunk,_encoding,done){chunks.push(Buffer.from(chunk));done();}});
  res.headersSent=false;res.writeHead=(code,values)=>{status=code;headers=values;res.headersSent=true;};
  await handler(req,res);return {status,headers,body:Buffer.concat(chunks).toString()};
}

test('React storefront serves the staging root, compatibility preview, explicit return pages and manifest assets',async()=>{
  for(const path of ['/','/react-preview','/react-preview/','/purchase/return','/purchase/cancel','/signed-out']){
    const result=await call(path);assert.equal(result.status,200);assert.match(result.body,/React preview/);assert.equal(result.headers['cache-control'],'no-store');
    assert.match(result.headers['content-security-policy'],/connect-src 'self'/);
  }
  const asset=await call('/assets/index-ABC123.js');assert.equal(asset.status,200);assert.match(asset.headers['cache-control'],/immutable/);assert.equal(asset.headers['content-type'],'text/javascript; charset=utf-8');
  for(const path of ['/assets/not-in-manifest.js','/src/main.tsx','/api/not-real','/events/not-real','/readyz'])assert.equal((await call(path)).status,404);
});
