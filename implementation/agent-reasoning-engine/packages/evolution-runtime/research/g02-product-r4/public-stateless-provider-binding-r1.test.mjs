// Local synthetic Unix sockets/processes only. No VPS or model calls.
// Open Questions: evidence/G01-PUBLIC-STATELESS-PROVIDER-BINDING-R1.json.
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,chmodSync,rmdirSync,readFileSync} from 'node:fs';import {join} from 'node:path';
import {createServer} from 'node:net';import {EventEmitter} from 'node:events';
import {hash} from './vps-json-provider-r1.mjs';import {providerBody as originalBody} from './wsl-vps-provider-r1.mjs';
import {BASE_MUX_PATH,BASE_MUX_SHA,RELAY_PATH,RELAY_SHA,providerBody,validateReply,buildPublicStatelessMuxSource,createPublicStatelessVpsProvider} from './public-stateless-provider-binding-r1.mjs';
const input={operation:'generate',request_id:'synthetic-stateless-binding',messages:[{role:'user',content:'x'}],tools:[],output_cap:512};
const replyFor=input=>({schema_version:'are.private-vps-provider-reply/v1',operation:input.operation,request_id:input.request_id,
 request_sha256:hash(providerBody(input)),dispatched:true,automatic_retries:0,redirects_followed:0,status:200});
async function fixture(t){
 const dir=mkdtempSync('/tmp/are-g02-ssh-reuse-r2-'),socket=join(dir,'control.sock'),server=createServer();
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(socket,resolve);});chmodSync(socket,0o600);
 t.after(async()=>{chmodSync(dir,0o700);await new Promise(resolve=>server.close(resolve));rmdirSync(dir);});
 return {dir,socket};
}
function fakeSpawner({observe=()=>{},bytes=Buffer.from(JSON.stringify(replyFor(input))),code=0,error=false}={}){
 return(...args)=>{observe(args);const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();
  child.stdin=new EventEmitter();child.kill=()=>{};
  child.stdin.end=raw=>queueMicrotask(()=>{
   assert.deepEqual(JSON.parse(raw),input);
   if(error){child.emit('error',Error('UNTRUSTED_DIAGNOSTIC'));return;}
   child.stderr.emit('data',Buffer.from('UNTRUSTED_DIAGNOSTIC'));child.stdout.emit('data',bytes);child.emit('close',code);
  });return child;};
}
test('exact pinned mux changes only two declared imports, not transport implementation',()=>{
 const base=readFileSync(BASE_MUX_PATH,'utf8');assert.equal(hash(base),BASE_MUX_SHA);
 const source=buildPublicStatelessMuxSource();
 const validation=JSON.stringify(new URL('./vps-json-provider-r1.mjs',import.meta.url).href);
 const binding=JSON.stringify(new URL('./public-stateless-provider-binding-r1.mjs',import.meta.url).href);
 assert.equal(source.replace(validation,"'./vps-json-provider-r1.mjs'").replace(binding,"'./wsl-vps-provider-r1.mjs'"),base);
 assert.throws(()=>buildPublicStatelessMuxSource(base+'\n'),/base-mux-drift/);
});
test('reply requires new effective digest and original identity/no-retry conditions',()=>{
 const reply=replyFor(input);assert.equal(validateReply(reply,input),reply);
 for(const change of [{request_sha256:hash(originalBody(input))},{request_id:'wrong'},{operation:'tokenize'},
  {dispatched:false},{automatic_retries:1},{redirects_followed:1},{schema_version:'other'}])assert.throws(()=>validateReply({...reply,...change},input));
});
test('one fixed SSH invocation binds new relay path/SHA and disables fresh connection fallback',async t=>{
 const f=await fixture(t);let calls=0,args;
 const call=await createPublicStatelessVpsProvider({controlSocket:f.socket,spawnProcess:fakeSpawner({observe:a=>{calls++;args=a;}})});
 const result=await call(input);assert.equal(calls,1);assert.equal(result.request_sha256,hash(providerBody(input)));
 assert.equal(result.connection_reuse,true);assert.equal(args[0],'ssh');
 assert.deepEqual(args[1],['-o','BatchMode=yes','-o','ConnectTimeout=10','-o','ServerAliveInterval=10','-o','ServerAliveCountMax=2',
  '-o','ControlMaster=no','-o','ProxyCommand=/bin/false','-S',f.socket,'root@187.77.163.194',
  '/opt/cyberalchemy-are-tools/node-24.10.0/node',RELAY_PATH,'once',RELAY_SHA]);
 assert.equal(result.automatic_retries,0);assert.ok(!JSON.stringify(result).includes('UNTRUSTED_DIAGNOSTIC'));
});
test('original-profile generation digest is uncertain, never admitted or retried',async t=>{
 const f=await fixture(t);let calls=0;
 const call=await createPublicStatelessVpsProvider({controlSocket:f.socket,spawnProcess:fakeSpawner({
  observe:()=>calls++,bytes:Buffer.from(JSON.stringify({...replyFor(input),request_sha256:hash(originalBody(input))}))})});
 const result=await call(input);assert.equal(calls,1);assert.equal(result.dispatch_uncertain,true);
 assert.equal(result.dispatched,null);assert.equal(result.request_sha256,hash(providerBody(input)));
 assert.equal(result.failure_code,'ssh-no-bound-reply');assert.equal(result.automatic_retries,0);assert.equal(result.public_response,undefined);
});
test('malformed JSON, invalid UTF8 and nonzero process exit remain uncertain with one invocation',async t=>{
 const f=await fixture(t);
 for(const variant of [{bytes:Buffer.from('{')},{bytes:Buffer.from([0xff])},{code:2}]){
  let calls=0;const call=await createPublicStatelessVpsProvider({controlSocket:f.socket,spawnProcess:fakeSpawner({...variant,observe:()=>calls++})});
  const result=await call(input);assert.equal(calls,1);assert.equal(result.dispatch_uncertain,true);assert.equal(result.failure_code,'ssh-no-bound-reply');
  assert.equal(result.request_sha256,hash(providerBody(input)));assert.equal(result.automatic_retries,0);
 }
});
test('reply byte cap and process errors remain sanitized uncertainty without retry',async t=>{
 const f=await fixture(t);
 for(const [variant,expected]of [[{bytes:Buffer.alloc(2*1024*1024+1)},'ssh-reply-byte-cap'],[{error:true},'ssh-process-error']]){
  let calls=0;const call=await createPublicStatelessVpsProvider({controlSocket:f.socket,spawnProcess:fakeSpawner({...variant,observe:()=>calls++})});
  const result=await call(input);assert.equal(calls,1);assert.equal(result.failure_code,expected);assert.equal(result.dispatch_uncertain,true);
  assert.equal(result.automatic_retries,0);assert.ok(!JSON.stringify(result).includes('UNTRUSTED_DIAGNOSTIC'));
 }
});
test('confirmed tokenizer500 stays a bound failure, not unknown SSH dispatch',async t=>{
 const f=await fixture(t);const tokenInput={...input,operation:'tokenize'};let calls=0;
 const tokenReply={...replyFor(tokenInput),status:500,provider_code:'500',prompt_tokens:null,completion_tokens:null,public_response:null};
 const spawnProcess=(...args)=>{
  calls++;assert.equal(args[1].at(-1),RELAY_SHA);const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();
  child.stdin=new EventEmitter();child.kill=()=>{};child.stdin.end=raw=>queueMicrotask(()=>{
   assert.deepEqual(JSON.parse(raw),tokenInput);child.stdout.emit('data',Buffer.from(JSON.stringify(tokenReply)));child.emit('close',0);
  });return child;
 };
 const call=await createPublicStatelessVpsProvider({controlSocket:f.socket,spawnProcess});const result=await call(tokenInput);
 assert.equal(calls,1);assert.equal(result.status,500);assert.equal(result.dispatched,true);assert.equal(result.dispatch_uncertain,undefined);
 assert.equal(result.prompt_tokens,null);assert.equal(result.automatic_retries,0);assert.equal(providerBody(tokenInput),originalBody(tokenInput));
});
test('invalid socket scope or changed permissions rejects before dispatch',async t=>{
 await assert.rejects(createPublicStatelessVpsProvider({controlSocket:'/tmp/arbitrary.sock'}),/socket-scope/);
 const f=await fixture(t);let calls=0;const call=await createPublicStatelessVpsProvider({controlSocket:f.socket,spawnProcess:fakeSpawner({observe:()=>calls++})});
 chmodSync(f.socket,0o666);await assert.rejects(call(input),/not-private/);assert.equal(calls,0);
 chmodSync(f.socket,0o600);chmodSync(f.dir,0o755);await assert.rejects(call(input),/not-private/);assert.equal(calls,0);
});
