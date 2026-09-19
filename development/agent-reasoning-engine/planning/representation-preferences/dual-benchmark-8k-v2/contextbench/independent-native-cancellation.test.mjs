// Local HTTP only; no provider calls. Open questions: INDEPENDENT-PREPARED-RUNNER.md.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {mkdtempSync,mkdirSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createNativeInvestigationDriver} from './independent-native-driver.mjs';
import {createGlmClient,MODEL} from './packet-diversity-v1/transport-bounded-v3.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';

for(const phase of ['tokenizer','model'])test('shared abort drains actual in-flight '+phase+' HTTP and ledger', {timeout:10000},async()=>{
 const root=mkdtempSync(join(tmpdir(),'independent-cancel-')),source=join(root,'source'),out=join(root,'out');mkdirSync(source);mkdirSync(out);
 const controller=new AbortController();let heldClosed,resolveClosed;const closed=new Promise(resolve=>{resolveClosed=resolve;});const attempts=[];
 const server=createServer((request,response)=>{
  request.resume();request.on('end',()=>{
   const kind=request.url.endsWith('/tokenizer')?'tokenizer':'model';attempts.push(kind);
   if(kind!==phase){response.writeHead(200,{'content-type':'application/json'});response.end(JSON.stringify({usage:{prompt_tokens:100}}));return;}
   response.on('close',()=>{heldClosed=true;resolveClosed();});controller.abort();
  });
 });
 let driver;
 try{
  server.listen(0,'127.0.0.1');await once(server,'listening');const origin='http://127.0.0.1:'+server.address().port;
  const persistence=createStagePersistence({stage_root:out,stage_guard:createStageOutputGuard({root:out})}),directory=join(out,'driver');
  const client=createGlmClient({chat_endpoint:origin+'/chat/completions',tokenizer_endpoint:origin+'/tokenizer',maximum_output_tokens:1024,maximum_requests:96,request_budget:'contextbench-deferral-v1',timeout_ms:3000,model_timeout_ms:3000,persistence,before_dispatch:async()=>{},signal:controller.signal});
  driver=createNativeInvestigationDriver({client,profile:{model:MODEL,reasoning_effort:'low',output_cap:1024},scope:{request:'Inspect behavior'},fixture_root:source,directory,persistence,signal:controller.signal,before_dispatch:async()=>true});
  const prompt=JSON.stringify({messages:[{role:'user',content:'Inspect behavior'}],tools:[]});
  if(phase==='tokenizer')await assert.rejects(driver.prepare({prompt,output_cap:1024}),/cancelled/);
  else{const prepared=await driver.prepare({prompt,output_cap:1024});await assert.rejects(driver.dispatch(prepared),/cancelled/);}
  await driver.close();await closed;
  assert.equal(heldClosed,true);assert.equal(existsSync(join(directory,'writer.lock')),false);
  const ledger=JSON.parse(readFileSync(join(directory,'glm-transport-ledger.json')));
  assert.equal(ledger.phase,'failed');assert.deepEqual(ledger.receipts,client.receipts);
  assert.deepEqual(attempts,phase==='model'?['tokenizer','model']:['tokenizer']);
  assert.equal(ledger.model_calls,phase==='model'?1:0);assert.equal(ledger.tokenizer_calls,1);
  const failed=client.receipts.at(-1);assert.equal(failed.kind,phase);assert.equal(failed.dispatched,true);assert.notEqual(failed.status,200);
 }finally{controller.abort();if(driver)await driver.close().catch(()=>{});server.closeAllConnections();await new Promise(resolve=>server.close(resolve));rmSync(root,{recursive:true,force:true});}
});
