// Exact production factory/secret bridge with fixture-only credentials; HTTPS redirected to localhost.
// Open questions: COMPARISON-LIVE-CLIENT.md.
import {test} from 'node:test';import assert from 'node:assert/strict';
import http from 'node:http';import https from 'node:https';import {once} from 'node:events';import {syncBuiltinESMExports} from 'node:module';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {comparisonLiveClientFactory} from './comparison-live-client.mjs';import {createNativeInvestigationDriver} from './independent-native-driver.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
const cell=()=>({comparison_arm:'minimal-history',context_limit:8000,limits:{total_tokens:96000,maximum_calls:96,output_cap:1024,finalization_reserve_tokens:8000},provider_profile:{reasoning_effort:'low',token_margin:512,model_timeout_ms:30000,index_tokenizer_maximum_calls:512,request_tokenizer_transport_attempts:1,index_tokenizer_transport_attempts:1}});
function fixture(){const root=mkdtempSync(join(tmpdir(),'comparison-factory-')),out=join(root,'out'),source=join(root,'source');mkdirSync(out);mkdirSync(source);const bridge=join(root,'fixture-bridge');writeFileSync(bridge,"#!/bin/sh\n/bin/cat >/dev/null\nprintf 'fixture-credential-not-real'\n",{mode:0o700});const credential_path=join(root,'credential.json');writeFileSync(credential_path,JSON.stringify({provider_kind:'local-sops-age',provider_id:'local-model-secrets',locator:'model/zai-key',python_command:bridge,project_root:root,timeout_ms:1000}));return {root,out,source,credential_path,persistence:createStagePersistence({stage_root:out,stage_guard:createStageOutputGuard({root:out})})};}
for(const phase of ['tokenizer','model','index-tokenizer'])test('production factory shares cancellation with '+phase,{timeout:10000},async()=>{
 const f=fixture(),controller=new AbortController(),attempts=[],events=[];let driver,closedResolve;const closed=new Promise(r=>{closedResolve=r;});
 const server=http.createServer((request,response)=>{request.resume();request.on('end',()=>{const kind=request.url.endsWith('/tokenizer')?(phase==='index-tokenizer'?'index-tokenizer':'tokenizer'):'model';attempts.push(kind);if(kind!==phase){response.writeHead(200,{'content-type':'application/json'});response.end(JSON.stringify({usage:{prompt_tokens:100}}));return;}response.on('close',closedResolve);controller.abort();});});
 const original=https.request;
 try{
  server.listen(0,'127.0.0.1');await once(server,'listening');const origin='http://127.0.0.1:'+server.address().port;
  https.request=(url,options,callback)=>{assert.equal(url.origin,'https://api.z.ai');return http.request(new URL(url.pathname,origin),options,callback);};syncBuiltinESMExports();
  const factory=comparisonLiveClientFactory({...f,signal:controller.signal,before_dispatch:async()=>true});const client=factory.create_client({cell:cell(),signal:controller.signal,record_event:e=>events.push(structuredClone(e))});
  const directory=join(f.out,'driver');driver=createNativeInvestigationDriver({client,profile:{model:client.model,reasoning_effort:'low',output_cap:1024},scope:{request:'Inspect behavior'},fixture_root:f.source,directory,persistence:f.persistence,signal:controller.signal,before_dispatch:async()=>true});
  const prompt=JSON.stringify({messages:[{role:'user',content:'Inspect behavior'}],tools:[]});
  if(phase==='index-tokenizer')await assert.rejects(factory.measure_index_tokens('Evidence packet',client),/cancelled/);
  else if(phase==='tokenizer')await assert.rejects(driver.prepare({prompt,output_cap:1024}),/cancelled/);
  else{const prepared=await driver.prepare({prompt,output_cap:1024});await assert.rejects(driver.dispatch(prepared),/cancelled/);}
  await driver.close();await closed;assert.equal(existsSync(join(directory,'writer.lock')),false);
  const ledger=JSON.parse(readFileSync(join(directory,'glm-transport-ledger.json')));assert.deepEqual(ledger.receipts,client.receipts);
  assert.deepEqual(attempts,phase==='model'?['tokenizer','model']:[phase]);
  if(phase==='index-tokenizer'){assert.equal(client.index_receipts.length,1);assert.equal(client.index_receipts[0].failure_code,'cancelled');assert.equal(client.index_receipts[0].transport_attempts.length,1);assert.deepEqual(events.at(-1).receipt,client.index_receipts[0]);}
  else{assert.equal(ledger.phase,'failed');assert.equal(client.receipts.at(-1).dispatched,true);}
 }finally{controller.abort();if(driver)await driver.close().catch(()=>{});https.request=original;syncBuiltinESMExports();server.closeAllConnections();await new Promise(r=>server.close(r));rmSync(f.root,{recursive:true,force:true});}
});
test('rejects foreign signal, unknown arm, retry policy and denied dispatch',{timeout:10000},async()=>{
 const f=fixture(),controller=new AbortController(),original=https.request;let calls=0;https.request=()=>{calls++;throw Error('unexpected HTTP');};syncBuiltinESMExports();
 try{const factory=comparisonLiveClientFactory({...f,signal:controller.signal,before_dispatch:async()=>false});assert.throws(()=>factory.create_client({cell:cell(),signal:new AbortController().signal}),/signal-identity/);const wrong=cell();wrong.comparison_arm='unknown';assert.throws(()=>factory.create_client({cell:wrong,signal:controller.signal}),/arm/);const retry=cell();retry.provider_profile.request_tokenizer_transport_attempts=2;assert.throws(()=>factory.create_client({cell:retry,signal:controller.signal}),/single-attempt-policy/);
 const client=factory.create_client({cell:cell(),signal:controller.signal});await assert.rejects(client.measure_index('packet'));assert.equal(calls,0);assert.equal(client.index_receipts[0].dispatched,false);
 }finally{controller.abort();https.request=original;syncBuiltinESMExports();rmSync(f.root,{recursive:true,force:true});}
});
