// Local synthetic Unix sockets and subprocesses only; zero provider/VPS calls.
// Open Questions: evidence/G02-WSL-VPS-PROVIDER-BINDING-R1.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,chmodSync,rmdirSync,writeFileSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {createServer} from 'node:net';
import {EventEmitter} from 'node:events';
import {createMultiplexedVpsProvider,validatePrivateControlSocket} from './wsl-vps-provider-multiplexed-r2.mjs';
import {providerBody} from './wsl-vps-provider-r1.mjs';
import {hash} from './vps-json-provider-r1.mjs';
const input={operation:'generate',request_id:'synthetic-reuse',messages:[{role:'user',content:'x'}],tools:[],output_cap:512};
async function fixture(t){
 const dir=mkdtempSync('/tmp/are-g02-ssh-reuse-r2-'),socket=join(dir,'control.sock'),server=createServer();
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(socket,resolve);});chmodSync(socket,0o600);
 t.after(async()=>{await new Promise(resolve=>server.close(resolve));rmdirSync(dir);});
 return {dir,socket,server};
}
function fakeSpawner(reply,observe,code=0){
 return (...args)=>{
  observe(args);const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();
  child.stdin=new EventEmitter();child.kill=()=>{};
  child.stdin.end=bytes=>queueMicrotask(()=>{
   assert.deepEqual(JSON.parse(bytes),input);
   child.stderr.emit('data',Buffer.from('Untrusted SSH diagnostic must not be persisted'));
   child.stdout.emit('data',Buffer.from(JSON.stringify(reply)));child.emit('close',code);
  });return child;
 };
}
const reply={schema_version:'are.private-vps-provider-reply/v1',operation:input.operation,request_id:input.request_id,
 request_sha256:hash(providerBody(input)),dispatched:true,automatic_retries:0,redirects_followed:0,status:200};
test('rejects arbitrary socket scope and non-socket targets',async t=>{
 const f=await fixture(t);assert.throws(()=>validatePrivateControlSocket('/tmp/arbitrary.sock'));
 assert.equal(validatePrivateControlSocket(f.socket),f.socket);
 const other=mkdtempSync('/tmp/are-g02-ssh-reuse-r2-'),path=join(other,'control.sock');writeFileSync(path,'not a socket',{mode:0o600});
 try{assert.throws(()=>validatePrivateControlSocket(path),/not-private/);}finally{unlinkSync(path);rmdirSync(other);}
});
test('rejects public socket or parent permissions before dispatch',async t=>{
 const f=await fixture(t);chmodSync(f.socket,0o666);assert.throws(()=>validatePrivateControlSocket(f.socket),/not-private/);
 chmodSync(f.socket,0o600);chmodSync(f.dir,0o755);assert.throws(()=>validatePrivateControlSocket(f.socket),/not-private/);
 chmodSync(f.dir,0o700);
});
test('one fixed invocation binds reply/body and disables fresh-connection fallback',async t=>{
 const f=await fixture(t);let calls=0,args;
 const call=createMultiplexedVpsProvider({controlSocket:f.socket,spawnProcess:fakeSpawner(reply,a=>{calls++;args=a;})});
 const r=await call(input);assert.equal(calls,1);assert.equal(r.request_sha256,reply.request_sha256);assert.equal(r.connection_reuse,true);
 assert.equal(args[0],'ssh');assert.ok(args[1].includes('ProxyCommand=/bin/false'));assert.ok(args[1].includes('ControlMaster=no'));
 assert.ok(args[1].includes('root@187.77.163.194'));assert.equal(args[1].at(-1),'0f5d4b71251075e6687947f1b1feea08b2cbbe04e6090235cbb010e1585745e2');
});
test('unbound reply remains uncertain and is never automatically retried',async t=>{
 const f=await fixture(t);let calls=0;
 const call=createMultiplexedVpsProvider({controlSocket:f.socket,spawnProcess:fakeSpawner({...reply,request_id:'wrong'},()=>calls++)});
 const r=await call(input);assert.equal(calls,1);assert.equal(r.dispatch_uncertain,true);assert.equal(r.automatic_retries,0);
 assert.equal(r.failure_code,'ssh-no-bound-reply');assert.equal(r.public_response,undefined);
});
