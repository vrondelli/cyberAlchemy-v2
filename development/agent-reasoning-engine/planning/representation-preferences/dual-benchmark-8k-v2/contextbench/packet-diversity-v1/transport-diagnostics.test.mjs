import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';import {EventEmitter} from 'node:events';import {syncBuiltinESMExports} from 'node:module';
import {mkdtempSync,mkdirSync,readFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {transportDiagnostic} from './transport-diagnostics.mjs';import {postOnce,createGlmClient} from './transport-bounded-v4.mjs';
import {createStagePersistence} from './stage-persistence.mjs';import {createStageOutputGuard} from './stage-output-guard.mjs';import {createNativeInvestigationDriver} from '../independent-native-driver.mjs';
const secret='DO-NOT-RETAIN-credential-host-path',error=code=>Object.assign(Error(secret),{code,address:secret,hostname:secret,headers:{authorization:secret}});
async function inject(mode,fn,{modelOnly=false,code='ECONNRESET',fault=null}={}){
 const saved=http.request,calls=[];
 http.request=(url,options,callback)=>{
  calls.push(url.pathname);const fail=!modelOnly||url.pathname.endsWith('/chat/completions');
  if(fail&&mode==='request-construction')throw (fault??error(code));
  const req=new EventEmitter();req.destroy=()=>{};req.end=()=>queueMicrotask(()=>{
   if(fail&&mode==='request-event'){req.emit('error',fault??error(code));return;}
   if(fail&&mode==='silent')return;
   const res=new EventEmitter();res.headers={'content-type':'application/json'};res.statusCode=200;res.destroy=()=>{};callback(res);
   if(fail&&mode==='response-event'){res.emit('error',fault??error(code));return;}
   res.emit('data',Buffer.from(JSON.stringify({usage:{prompt_tokens:100}})));res.emit('end');
  });return req;
 };syncBuiltinESMExports();try{return await fn(calls);}finally{http.request=saved;syncBuiltinESMExports();}
}
test('fixed allowlist and bounded aggregate diagnostics retain no raw data or accessors',()=>{
 let getterCalls=0;const bad=Object.defineProperty(Error(secret),'code',{get(){getterCalls++;throw Error(secret);}}),children=Array.from({length:20},(_,i)=>i===0?bad:error(i%2?'ENETUNREACH':'EAI_AGAIN'));
 const aggregate=Object.assign(Error(secret),{errors:children}),d=transportDiagnostic('request-event',aggregate);
 assert.deepEqual(d.codes,['EAI_AGAIN','ENETUNREACH']);assert.equal(d.child_entries_inspected,8);assert.equal(d.child_entries_truncated,true);assert.equal(getterCalls,0);assert.equal(d.unknown_entries,2);assert.ok(!JSON.stringify(d).includes(secret));
 assert.deepEqual(transportDiagnostic('request-event',error(secret)).codes,[]);assert.throws(()=>transportDiagnostic(secret,error('ECONNRESET')),/phase/);
});
test('HTTP primitive separates construction, request and response events without changing failure code',async()=>{
 for(const phase of ['request-construction','request-event','response-event'])await inject(phase,async calls=>{
  await assert.rejects(postOnce(new URL('http://127.0.0.1/tokenizer'),'{}',{apiKey:secret,timeout_ms:100,maximum_response_bytes:1024}),e=>{assert.equal(e.code,phase==='response-event'?'response-interrupted':'request-failed');assert.equal(e.transport_diagnostic.phase,phase);assert.deepEqual(e.transport_diagnostic.codes,['ECONNRESET']);assert.ok(!JSON.stringify(e).includes(secret));return true;});assert.equal(calls.length,1);
 });
});
test('deadline and cancellation keep their distinct categories without inventing network causes',async()=>{
 await inject('silent',async()=>{await assert.rejects(postOnce(new URL('http://127.0.0.1/tokenizer'),'{}',{apiKey:null,timeout_ms:5,maximum_response_bytes:1024}),e=>e.code==='deadline-exceeded'&&!e.transport_diagnostic);});
 const signal=AbortSignal.abort();await inject('silent',async calls=>{await assert.rejects(postOnce(new URL('http://127.0.0.1/tokenizer'),'{}',{apiKey:null,timeout_ms:100,maximum_response_bytes:1024,signal}),e=>e.code==='cancelled'&&!e.transport_diagnostic);assert.equal(calls.length,0);});
});
test('actual native tokenizer/model failure receipts and persisted ledger retain sanitized diagnostics with no retries',async()=>{
 for(const modelOnly of [false,true])await inject('request-event',async calls=>{
  const root=mkdtempSync(join(tmpdir(),'transport-diagnostic-')),out=join(root,'out'),source=join(root,'source');mkdirSync(out);mkdirSync(source);let driver;
  try{
   const persistence=createStagePersistence({stage_root:out,stage_guard:createStageOutputGuard({root:out})}),client=createGlmClient({chat_endpoint:'http://127.0.0.1/chat/completions',tokenizer_endpoint:'http://127.0.0.1/tokenizer',maximum_requests:1,maximum_output_tokens:128,maximum_model_retries:0,maximum_tokenizer_transport_attempts:1,token_margin:512,request_budget:'holdout-window-v1',persistence,before_dispatch:async()=>{}});
   const directory=join(out,'driver');driver=createNativeInvestigationDriver({client,profile:{model:'glm-5.3-flash',reasoning_effort:'low',output_cap:128},scope:{request:'fixture'},fixture_root:source,directory,persistence,signal:new AbortController().signal,before_dispatch:async()=>true});
   const request={prompt:JSON.stringify({messages:[{role:'user',content:'fixture'}],tools:[]}),output_cap:128};
   if(modelOnly){const p=await driver.prepare(request);await assert.rejects(driver.dispatch(p),/request-failed/);}else await assert.rejects(driver.prepare(request),/request-failed/);
   await driver.close();const receipts=client.receipts,last=receipts.at(-1),ledger=JSON.parse(readFileSync(join(directory,'glm-transport-ledger.json')));
   assert.equal(last.kind,modelOnly?'model':'tokenizer');assert.equal(last.failure_code,'request-failed');assert.equal(last.dispatched,true);assert.equal(last.automatic_retries,0);assert.deepEqual(last.transport_diagnostic.codes,['ECONNRESET']);assert.deepEqual(ledger.receipts,receipts);assert.equal(calls.length,modelOnly?2:1);assert.ok(!JSON.stringify(ledger).includes(secret));
  }finally{await driver?.close();rmSync(root,{recursive:true,force:true});}
 },{modelOnly});
});

test('uninspectable revoked aggregate cannot escape HTTP error settlement',async()=>{
 const revoked=Proxy.revocable([],{});revoked.revoke();const fault=Object.assign(error('ECONNRESET'),{errors:revoked.proxy});
 for(const phase of ['request-construction','request-event','response-event'])await inject(phase,async()=>{
  await assert.rejects(postOnce(new URL('http://127.0.0.1/tokenizer'),'{}',{apiKey:null,timeout_ms:100,maximum_response_bytes:1024}),e=>{
   assert.equal(e.transport_diagnostic.phase,phase);assert.equal(e.transport_diagnostic.aggregate_uninspectable,true);
   assert.deepEqual(e.transport_diagnostic.codes,['ECONNRESET']);assert.equal(e.transport_diagnostic.unknown_entries,1);return true;
  });
 },{fault});
});
