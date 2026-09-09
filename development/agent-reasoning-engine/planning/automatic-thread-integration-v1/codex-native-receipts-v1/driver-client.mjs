import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {openSync,closeSync} from 'node:fs';
import assert from 'node:assert/strict';

/** Test-only native driver transport. Each restart waits for the previous process
 * to exit; the native store independently holds an OS lock for its lifetime. */
export function nativeDriver({directory,binding,source,just,log,classify}) {
 let server,child,exited,waiting,queued,receiver,dead=true;
 const flush=()=>{if(waiting&&queued){waiting.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify(queued));waiting=null;queued=null;}};
 const closeServer=async()=>{if(server){server.closeAllConnections();await new Promise(r=>server.close(r));server=null;}};
 return {
  async start(){
   if(child)await exited;await closeServer();waiting=null;queued=null;receiver=null;
   const route=`/${randomUUID()}`;let readyResolve;
   const ready=new Promise(r=>readyResolve=r);
   server=createServer(async(req,res)=>{
    try {
     assert.equal(req.method,'POST');assert.ok([route,route+'/classify'].includes(req.url));
     const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;assert.ok(length<65536);chunks.push(chunk);}
     const message=JSON.parse(Buffer.concat(chunks));
     if(req.url.endsWith('/classify')){res.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify(await classify(message)));return;}
     if(message.ready)readyResolve();else{assert.ok(receiver);receiver.resolve(message);receiver=null;}
     assert.ok(!waiting);waiting=res;flush();
    }catch(error){res.writeHead(400).end();receiver?.reject(error);receiver=null;}
   });
   await new Promise(r=>server.listen(0,'127.0.0.1',r));
   const fd=openSync(log,'a',0o600);dead=false;
   child=spawn(just,['test','-p','codex-core','--test','all','--run-ignored','all','--retries','0','-E','test(context_receipts_native_driver)'],{
    cwd:source,stdio:['ignore',fd,fd],env:{...process.env,RUSTUP_TOOLCHAIN:'1.95.0',ARE_OFFLINE_RECEIPT_COORDINATOR:`http://127.0.0.1:${server.address().port}${route}`,ARE_OFFLINE_RECEIPT_DIRECTORY:directory,ARE_OFFLINE_RECEIPT_BINDING:binding}});closeSync(fd);
   exited=new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>{dead=true;receiver?.reject(Error(`native-driver-exited:${code}`));receiver=null;resolve(code);});});
   await Promise.race([ready,exited.then(code=>{throw Error(`native-driver-start-failed:${code}`);})]);
  },
  rpc(command){assert.ok(!dead&&!receiver&&!queued);return new Promise((resolve,reject)=>{receiver={resolve,reject};queued=command;flush();});},
  async exitCode(){return exited;},
  async close(){
   try{if(!dead){queued={kind:'finish'};flush();assert.equal(await exited,0,'native driver clean close');}}
   finally{await closeServer();}
  }
 };
}
