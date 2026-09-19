import {test} from 'node:test';import assert from 'node:assert/strict';
import http from 'node:http';import {mkdtempSync,mkdirSync,readFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {createNativeInvestigationDriver} from './aggregate-native-driver-v2.mjs';
import {createGlmClient} from './packet-diversity-v1/transport-admission-v5.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {renderCompactPrompt} from './compact-prompt.mjs';
import {stable,attachObservationHandles} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';

test('real transport measures a reduced batch, dispatches under 8K, and retains projection and receipts',async t=>{
 const root=mkdtempSync(join(tmpdir(),'aggregate-wire-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const out=join(root,'out'),source=join(root,'source');mkdirSync(out);mkdirSync(source);
 const persistence=createStagePersistence({stage_root:out,stage_guard:createStageOutputGuard({root:out})});
 let modelCalls=0,tokenizerCalls=0;const count=wire=>Math.ceil(Buffer.byteLength(stable({messages:wire.messages,tools:wire.tools}))/4);
 const server=http.createServer(async(req,res)=>{let raw='';for await(const b of req)raw+=b;const wire=JSON.parse(raw);res.setHeader('content-type','application/json');
  if(req.url==='/tokenizer'){tokenizerCalls++;res.end(JSON.stringify({usage:{prompt_tokens:count(wire)}}));}
  else {modelCalls++;res.end(JSON.stringify({model:'glm-5.3-flash',usage:{prompt_tokens:count(wire),completion_tokens:10,completion_tokens_details:{reasoning_tokens:7}},choices:[{message:{role:'assistant',content:'done',reasoning_content:'fixture reasoning'},finish_reason:'stop'}]}));}
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{server.closeAllConnections();server.close(r);}));
 const endpoint='http://127.0.0.1:'+server.address().port,client=createGlmClient({chat_endpoint:endpoint+'/chat/completions',tokenizer_endpoint:endpoint+'/tokenizer',maximum_output_tokens:1024,maximum_requests:96,maximum_request_bytes:262144,request_budget:'contextbench-budget-v1',token_margin:512,persistence,before_dispatch:async()=>{}});
 const directory=join(out,'driver'),events=[];
 const driver=createNativeInvestigationDriver({client,profile:{model:client.model,reasoning_effort:'low',output_cap:1024},scope:{request:'fixture'},fixture_root:source,directory,persistence,before_dispatch:async()=>true,persist:e=>{persistence.append(join(out,'events.jsonl'),stable(e)+'\n');events.push(e);}});t.after(()=>driver.close());
 const calls=['a','b'].map(id=>({id,type:'function',function:{name:'read_file',arguments:stable({path:'a.py',start_line:1,line_count:100,revision:'base'})}}));
 const output={ok:true,output:{path:'a.py',start_line:1,end_line:100,total_lines:100,source_revision:'base',base_commit:'b'.repeat(40),source_sha256:'a'.repeat(64),utf8:Array.from({length:100},()=>('x'.repeat(250))).join('\n')}};
 const messages=[{role:'system',content:'fixture'},{role:'user',content:'inspect source'},{role:'assistant',tool_calls:calls},...calls.map(call=>({role:'tool',tool_call_id:call.id,content:stable(attachObservationHandles(call,output))}))];
 const original=renderCompactPrompt({messages,tools:[]});assert.ok(await client.measureEnvelope(original)>8000);assert.equal(modelCalls,0);
 const prompt=await driver.admitMessages(messages,[]);assert.notEqual(prompt,original);assert.ok(await client.measureEnvelope(prompt)<=8000);assert.equal(modelCalls,0);
 const before=tokenizerCalls,prepared=await driver.prepare({prompt,output_cap:1024});assert.equal(tokenizerCalls,before,'native prepare uses the same measurement cache');assert.ok(prepared.input_upper_bound+1024<7999);
 const response=await driver.dispatch(prepared);assert.equal(modelCalls,1);assert.equal(await driver.admitMessages(messages,[]),prompt,'projection cannot regrow on repeated history');assert.equal(tokenizerCalls,before);
 assert.equal(events.filter(e=>e.kind==='tool-output-archive').length,2);assert.ok(events.find(e=>e.kind==='aggregate-admission').attempts.length>1);
 const retainedPrompt=renderCompactPrompt({messages:[...JSON.parse(prompt).messages,JSON.parse(response.final_bytes).message,{role:'user',content:'continue'}],tools:[]});
 assert.equal(await client.measureEnvelope(retainedPrompt),count(JSON.parse(retainedPrompt))+512+1024+2+7);
 assert.equal(client.receipts.at(-1).retained_reasoning_reservation,7);
 const ledger=JSON.parse(readFileSync(join(directory,'glm-transport-ledger.json')));assert.deepEqual(ledger.receipts,client.receipts);assert.equal(ledger.tokenizer_calls,tokenizerCalls);assert.equal(ledger.model_calls,1);await driver.close();
});
