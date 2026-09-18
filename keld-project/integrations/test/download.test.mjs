import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {createRepository} from '../src/repository.mjs';
import {createCheckoutService} from '../src/checkout.mjs';
import {createHandler} from '../src/index.mjs';
import {openDownload} from '../src/download-stream.mjs';

test('large verified archive reaches HTTP with exact bytes and rejects corruption and wrong owner',async t=>{
 const root=await mkdtemp(join(tmpdir(),'keld-stream-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const data=Buffer.alloc(13*1024*1024,67),digest=createHash('sha256').update(data).digest('hex');
 await writeFile(join(root,'archive.bin'),data);
 const repository=createRepository({database:join(root,'ledger.db'),releaseDigest:digest,delivery:{root,artifacts:[{sha256:digest,bytes:data.length,relative_path:'archive.bin'}]}});
 const common={customer:'alice',now:100};
 const order=await repository('prepare',{...common,requestKey:'large',provider:'stripe',account:'acct_test',amountCents:20000,terms:{amountCents:20000,currency:'USD'}});
 await repository('bind',{...common,orderId:order.id,generation:(await repository('claim',{...common,orderId:order.id})).generation,remoteId:'cs_test',response:{remoteId:'cs_test'}});
 await repository('settle',{...common,orderId:order.id,remoteId:'cs_test',paymentId:'pi_test',amountCents:20000,currency:'USD'});
 let handler;const server=createServer((req,res)=>handler(req,res));server.listen(0,'127.0.0.1');await once(server,'listening');
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const host='127.0.0.1:'+server.address().port,origin='https://'+host;
 const auth={handle:async()=>false,identity:async req=>({customer:req.headers['x-test-buyer']??'alice'})};
 const checkout=createCheckoutService({auth,repository,adapters:{},origin,clock:()=>101});
 handler=createHandler({auth,checkout,origin,diagnostic:()=>{}});
 const request=buyer=>fetch('http://'+host+'/api/download',{method:'POST',headers:{'content-type':'application/json','x-test-buyer':buyer},body:JSON.stringify({orderId:order.id})});
 let response=await request('bob');assert.equal(response.status,404);await response.arrayBuffer();
 response=await request('alice');assert.equal(response.status,200);
 const hash=createHash('sha256');let bytes=0;for await(const chunk of response.body){bytes+=chunk.length;hash.update(chunk);}
 assert.equal(bytes,data.length);assert.equal(hash.digest('hex'),digest);
 await writeFile(join(root,'archive.bin'),Buffer.alloc(data.length,68));
 response=await request('alice');assert.equal(response.status,503);assert.equal((await response.json()).error,'artifact-integrity-failed');
});

test('download cancellation terminates a blocked bridge process',async t=>{
 const root=await mkdtemp(join(tmpdir(),'keld-stream-cancel-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const script=join(root,'bridge.py'),pidFile=join(root,'pid'),digest='a'.repeat(64);
 await writeFile(script,["import os,sys,json,time","open("+JSON.stringify(pidFile)+",'w').write(str(os.getpid()))","sys.stdin.read()","print(json.dumps({'ok':True,'value':{'bytes':100,'sha256':'"+digest+"'}}),flush=True)","time.sleep(60)"].join('\n'));
 const controller=new AbortController();
 const result=await openDownload({python:'python3',script,payload:{releaseDigest:digest},signal:controller.signal});
 const pid=Number(await readFile(pidFile,'utf8'));
 const consuming=(async()=>{for await(const chunk of result.stream){void chunk;}})();
 controller.abort();await assert.rejects(consuming);
 for(let i=0;i<100;i++){try{process.kill(pid,0);}catch(error){if(error.code==='ESRCH')return;throw error;}await new Promise(r=>setTimeout(r,10));}
 assert.fail('bridge process still running');
});

test('truncated binary body fails instead of completing a successful stream',async t=>{
 const root=await mkdtemp(join(tmpdir(),'keld-stream-truncated-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const script=join(root,'bridge.py'),digest='a'.repeat(64);
 await writeFile(script,["import sys,json","sys.stdin.read()","print(json.dumps({'ok':True,'value':{'bytes':100,'sha256':'"+digest+"'}}),flush=True)","sys.stdout.buffer.write(b'short')"].join('\n'));
 const {stream}=await openDownload({python:'python3',script,payload:{releaseDigest:digest}});
 await assert.rejects(async()=>{for await(const chunk of stream){void chunk;}},{code:'download-integrity-failed'});
});

test('HTTP client disconnect cancels the binary worker',async t=>{
 const root=await mkdtemp(join(tmpdir(),'keld-http-cancel-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const script=join(root,'bridge.py'),pidFile=join(root,'pid'),digest='b'.repeat(64);
 await writeFile(script,["import os,sys,json,time","open("+JSON.stringify(pidFile)+",'w').write(str(os.getpid()))","sys.stdin.read()","print(json.dumps({'ok':True,'value':{'bytes':100,'sha256':'"+digest+"'}}),flush=True)","sys.stdout.buffer.write(b'x');sys.stdout.buffer.flush()","time.sleep(60)"].join('\n'));
 let handler;const server=createServer((req,res)=>handler(req,res));server.listen(0,'127.0.0.1');await once(server,'listening');
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const host='127.0.0.1:'+server.address().port;
 handler=createHandler({origin:'https://'+host,auth:{handle:async()=>false},diagnostic:()=>{},
  checkout:{downloadStream:async(req,id,{signal})=>openDownload({python:'python3',script,payload:{releaseDigest:digest},signal})}});
 const controller=new AbortController();
 const response=await fetch('http://'+host+'/api/download',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({orderId:'fixture'}),signal:controller.signal});
 const reader=response.body.getReader();assert.equal((await reader.read()).value.length,1);
 const pid=Number(await readFile(pidFile,'utf8'));controller.abort();
 await assert.rejects(()=>reader.read());
 for(let i=0;i<100;i++){try{process.kill(pid,0);}catch(error){if(error.code==='ESRCH')return;throw error;}await new Promise(r=>setTimeout(r,10));}
 assert.fail('HTTP disconnect left worker running');
});
