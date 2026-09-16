import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createGlmClient, MODEL, hash} from './transport.mjs';
import {runGlmAgent, projectInspectionProgress, captureFinalResponse} from './agent.mjs';
import {validateCalls} from './tools.mjs';
import {projectRecentObservations} from './retention.mjs';
import {parseConfig, runConfiguredGlm} from './cli.mjs';
import {createReadOnlyToolRuntime} from '../read-only-tools.mjs';
import {snapshotTree} from '../verifier.mjs';
import {SecretResolutionError, createSecretReference, createSecretProviderRegistry, createInjectedSecretProvider} from '../secret-provider.mjs';

const tc = (id = 'call1', name = 'read-file', args = {path: 'a.mjs'}) => ({id, type: 'function', function: {name, arguments: JSON.stringify(args)}});
const reply = (message, finish_reason = 'stop', usage = {}) => ({model: MODEL, choices: [{message: {role: 'assistant', ...message}, finish_reason}], usage: {prompt_tokens: 100, completion_tokens: 20, ...usage}});

test('observation masking preserves complete multi-tool exchanges and original journal bytes',()=>{
 const history=Array.from({length:3},(_,step)=>({messages:[{role:'assistant',reasoning_content:'returned protocol content',tool_calls:[tc(`a${step}`),tc(`b${step}`)]},
  {role:'tool',tool_call_id:`a${step}`,content:'original A'}, {role:'tool',tool_call_id:`b${step}`,content:'original B'}]}));
 const original=JSON.stringify(history), projected=projectRecentObservations(history,'a'.repeat(64));
 assert.equal(JSON.stringify(history),original);
 assert.equal(projected[0].messages[0].reasoning_content,'returned protocol content');
 assert.equal(projected[0].messages[1].tool_call_id,'a0');
 assert.equal(JSON.parse(projected[0].messages[1].content).original_content_sha256,hash('original A'));
 assert.equal(projected[1].messages[1].content,'original A');
 for(const mutate of [h=>h[0].messages.pop(),h=>{h[0].messages[1].tool_call_id='orphan';},h=>{h[0].messages[0].tool_calls[1].id='a0';}]) {
  const broken=structuredClone(history);mutate(broken);
  assert.throws(()=>projectRecentObservations(broken,'a'.repeat(64)),/retention-tool-pair-invalid/);
 }
});
async function setup(t, handler = null, extra = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'are-glm-test-')); const root = join(dir,'repo'); mkdirSync(root);
  writeFileSync(join(root,'a.mjs'), 'export const a=1;\n');
  const base = snapshotTree(root);
  const candidate = {schema_version:'are.patch-set-candidate/v1', expected_base_tree_sha256:base.tree_sha256, changes:[{operation:'replace-file',path:'a.mjs',expected_file_sha256:base.files['a.mjs'],utf8:'export const a=2;\n'}], rationale:'test',authority_effect:'none'};
  const requests = [];
  const server = createServer(async (req,res) => {
    const chunks=[]; for await (const c of req) chunks.push(c);
    const body=JSON.parse(Buffer.concat(chunks)); requests.push({path:req.url,body,auth:req.headers.authorization});
    res.setHeader('content-type','application/json');
    const value=await handler?.({req,res,body,requests,candidate});
    if (res.writableEnded || res.destroyed) return;
    if (value === 'stall') return;
    res.end(JSON.stringify(value ?? (req.url.endsWith('/tokenizer') ? {usage:{prompt_tokens:100}} : reply({content:JSON.stringify(candidate)}))));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  t.after(async()=>{server.closeAllConnections(); await new Promise(r=>server.close(r)); rmSync(dir,{recursive:true,force:true});});
  const origin=`http://127.0.0.1:${server.address().port}`;
  const clientOpts={chat_endpoint:origin+'/chat/completions',tokenizer_endpoint:origin+'/tokenizer',...extra};
  const client=createGlmClient(clientOpts);
  const input={run_id:'test',request:'Change a to 2',fixture_root:root,client,observation_allowlist:['a.mjs'],mutation_allowlist:['a.mjs'],verification_command:[],
    tool_runtime:createReadOnlyToolRuntime({repository_root:root,observation_allowlist:['a.mjs']}), tool_policy:{allow:['read-file','read-context-evidence']},
    context_recycling:{directory:join(dir,'state'),context_limit:10000,recycle_at:9000,safety_margin:1000,state:{objective:'Change a to 2',constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['test']}}};
  return {input,requests,candidate,root,dir,clientOpts};
}

test('tokenizer reservation, native round trip, reasoning preservation, proposal only',async t=>{
 const x=await setup(t,({req,requests})=>{
  if(req.url.endsWith('/tokenizer'))return;
  const n=requests.filter(r=>r.path.endsWith('/chat/completions')).length;
  if(n===1)return reply({content:'',reasoning_content:'preserve verbatim',tool_calls:[tc()]},'tool_calls');
 });
 const r=await runGlmAgent(x.input); assert.equal(r.status,'AWAITING_APPROVAL'); assert.equal(r.history.length,2);
 const bodies=x.requests.filter(r=>r.path.endsWith('/chat/completions')).map(r=>r.body);
 assert.equal(bodies[1].messages[2].reasoning_content,'preserve verbatim');
 assert.equal(bodies[1].messages[3].tool_call_id,'call1');
 assert.equal(bodies[0].max_tokens,2048);assert.equal(bodies[0].model,MODEL);assert.equal(bodies[0].thinking.clear_thinking,false);
 assert.deepEqual(x.requests[0].body.tools,bodies[0].tools);
 assert.equal(readFileSync(join(x.root,'a.mjs'),'utf8'),'export const a=1;\n');
});

test('safe pause and fresh-client resume preserve complete exchange',async t=>{
 const x=await setup(t,({req,requests})=>req.url.endsWith('/chat/completions') && requests.filter(r=>r.path.endsWith('/chat/completions')).length===1 ? reply({content:'',tool_calls:[tc()]},'tool_calls'):undefined);
 const first=await runGlmAgent({...x.input,pause_after_steps:1});assert.equal(first.status,'PAUSED');
 const r=await runGlmAgent({...x.input,client:createGlmClient(x.clientOpts)});assert.equal(r.status,'AWAITING_APPROVAL');assert.equal(r.history.length,2);
});

test('forced recycle archives whole exchanges and retains bounded progress',async t=>{
 const x=await setup(t,({req,body,requests})=>{
  if(req.url.endsWith('/tokenizer'))return {usage:{prompt_tokens:body.messages.length>2?7000:100}};
  if(requests.filter(r=>r.path.endsWith('/chat/completions')).length===1)return reply({content:'',tool_calls:[tc()]},'tool_calls');
 });
 const r=await runGlmAgent(x.input);assert.equal(r.status,'AWAITING_APPROVAL');assert.equal(r.recycling.recycles,1);
 const last=x.requests.filter(r=>r.path.endsWith('/chat/completions')).at(-1).body.messages;
 assert.equal(last.length,2);assert.match(last[0].content,/recent_progress/);assert.match(last[0].content,/call/);
});

for(const delta of [-1,0,1]) test(`retention measures full candidate at admission boundary ${delta}`,async t=>{
 const x=await setup(t,({req,body,requests})=>{
  if(req.url.endsWith('/tokenizer')) {
   if(body.messages.length===2)return {usage:{prompt_tokens:100}};
   const generation=JSON.parse(body.messages[0].content.split('\n').at(-1)).generation;
   return {usage:{prompt_tokens:generation===0?7000:6696+delta}};
  }
  if(requests.filter(r=>r.path.endsWith('/chat/completions')).length===1)return reply({tool_calls:[tc()]},'tool_calls');
 });
 const r=await runGlmAgent({...x.input,retention_policy:'recent-observations-v1'});
 assert.equal(r.status,'AWAITING_APPROVAL',JSON.stringify(r.reason_codes));
 assert.equal(r.recycling.recycles,1);
 const messages=x.requests.filter(r=>r.path.endsWith('/chat/completions')).at(-1).body.messages;
 assert.equal(messages.length,delta<0?4:2);
 assert.ok(r.recycling.dispatches.every(d=>d.projected_upper_bound<9000 && d.output_reservation===2048));
 assert.ok(r.history[0].observations[0].output.utf8.includes('export const a=1'));
});

test('retention shrinks oversized recent results without orphaning calls across recycle and resume',async t=>{
 const x=await setup(t,({req,body,requests})=>{
  if(req.url.endsWith('/tokenizer'))return {usage:{prompt_tokens:body.messages.length>4?7000:100}};
  const n=requests.filter(r=>r.path.endsWith('/chat/completions')).length;
  if(n<=4)return reply({tool_calls:[tc('call-'+n)]},'tool_calls');
 });
 const input={...x.input,retention_policy:'recent-observations-v1'};
 const paused=await runGlmAgent({...input,pause_after_steps:3});
 assert.equal(paused.status,'PAUSED');assert.equal(paused.recycling.recycles,1);
 const r=await runGlmAgent({...input,client:createGlmClient(x.clientOpts)});
 assert.equal(r.status,'AWAITING_APPROVAL',JSON.stringify(r.reason_codes));
 assert.equal(r.recycling.recycles,3);assert.equal(r.history.length,5);
 for(const {body} of x.requests.filter(r=>r.path.endsWith('/chat/completions'))) {
  for(let i=2;i<body.messages.length;i+=2) {
   assert.equal(body.messages[i+1].tool_call_id,body.messages[i].tool_calls[0].id);
   assert.match(body.messages[i+1].content,/export const a=1/);
  }
 }
 const checkpoint=JSON.parse(readFileSync(join(x.dir,'state','checkpoint.json'),'utf8'));
 assert.equal(checkpoint.history.length,5);
 assert.ok(checkpoint.history.slice(0,4).every(e=>e.observations[0].output.utf8.includes('export const a=1')));
});

test('retention policy change rejects resume before HTTP and unsupported policy blocks',async t=>{
 const x=await setup(t,({req})=>req.url.endsWith('/chat/completions')?reply({tool_calls:[tc()]},'tool_calls'):undefined);
 const input={...x.input,retention_policy:'recent-observations-v1'};
 assert.equal((await runGlmAgent({...input,pause_after_steps:1})).status,'PAUSED');
 const count=x.requests.length;
 const r=await runGlmAgent({...input,retention_policy:'clear-v1',client:createGlmClient(x.clientOpts)});
 assert.deepEqual(r.reason_codes,['recycling.scope-or-policy-drift']);assert.equal(x.requests.length,count);
 assert.deepEqual((await runGlmAgent({...input,retention_policy:'guess'})).reason_codes,['glm.retention-policy-invalid']);
 assert.throws(()=>parseConfig({...configuredInput(x),retention_policy:'guess'}),/retention-policy-invalid/);
 assert.equal(parseConfig({...configuredInput(x),retention_policy:'recent-observations-v1'}).retention_policy,'recent-observations-v1');
});

test('unknown candidate measurement blocks immediately without model replay',async t=>{
 const x=await setup(t,({req,body})=>{
  if(req.url.endsWith('/tokenizer')) {
   if(body.messages.length===2)return {usage:{prompt_tokens:100}};
   const generation=JSON.parse(body.messages[0].content.split('\n').at(-1)).generation;
   return generation===0?{usage:{prompt_tokens:7000}}:{usage:{}};
  }
  return reply({tool_calls:[tc()]},'tool_calls');
 });
 const r=await runGlmAgent({...x.input,retention_policy:'recent-observations-v1'});
 assert.deepEqual(r.reason_codes,['glm.tokenizer-count-invalid']);
 assert.equal(x.requests.filter(r=>r.path.endsWith('/chat/completions')).length,1);
 assert.equal(x.requests.filter(r=>r.path.endsWith('/tokenizer')).length,3);
});

test('retention fails closed when all recovery candidates including mandatory state exceed budget',async t=>{
 const x=await setup(t,({req,body})=>{
  if(req.url.endsWith('/tokenizer')) {
   const c=JSON.parse(body.messages[0].content.split('\n').at(-1));
   return {usage:{prompt_tokens:c.recent_progress.length?7000:100}};
  }
  return reply({tool_calls:[tc()]},'tool_calls');
 });
 const r=await runGlmAgent({...x.input,retention_policy:'recent-observations-v1'});
 assert.deepEqual(r.reason_codes,['recycling.fresh-context-too-large']);
 assert.equal(x.requests.filter(r=>r.path.endsWith('/chat/completions')).length,1);
});

test('retention keeps the tokenizer ceiling even when multiple projections are measured',async t=>{
 const x=await setup(t,({req,body,requests})=>{
  if(req.url.endsWith('/tokenizer'))return {usage:{prompt_tokens:body.messages.length>2?7000:100}};
  return reply({tool_calls:[tc('read-'+requests.filter(r=>r.path.endsWith('/chat/completions')).length)]},'tool_calls');
 });
 const r=await runGlmAgent({...x.input,retention_policy:'recent-observations-v1'});
 assert.deepEqual(r.reason_codes,['glm.tokenizer-limit']);
 assert.equal(x.requests.filter(r=>r.path.endsWith('/tokenizer')).length,24);
 assert.ok(x.requests.filter(r=>r.path.endsWith('/chat/completions')).length<12);
});

test('oversized individual result still blocks rather than silently masking or dispatching it',async t=>{
 const x=await setup(t,({req})=>req.url.endsWith('/chat/completions')?reply({tool_calls:[tc()]},'tool_calls'):undefined);
 const runtime={...x.input.tool_runtime,invoke:async()=>({ok:true,output:'x'.repeat(17000)})};
 const r=await runGlmAgent({...x.input,tool_runtime:runtime,retention_policy:'recent-observations-v1'});
 assert.deepEqual(r.reason_codes,['glm.tool-result-too-large']);
 assert.equal(x.requests.filter(r=>r.path.endsWith('/chat/completions')).length,1);
});

test('paired scripted continuation retains source content and avoids clearing-induced rereads',async t=>{
 const results=[];
 for(const retention_policy of ['clear-v1','recent-observations-v1']) {
  const x=await setup(t,({req,body,requests,candidate})=>{
   const context=JSON.parse(body.messages[0].content.split('\n').at(-1));
   if(req.url.endsWith('/tokenizer')) {
    const previous=requests.filter(r=>r.path.endsWith('/chat/completions')).length;
    return {usage:{prompt_tokens:body.messages.length>2 && context.generation<previous?7000:100}};
   }
   const n=requests.filter(r=>r.path.endsWith('/chat/completions')).length;
   if(body.messages.some(m=>m.role==='tool' && m.content.includes('export const a=1')))
    return reply({content:JSON.stringify(candidate)});
   return reply({tool_calls:[tc('read-'+n)]},'tool_calls');
  });
  const r=await runGlmAgent({...x.input,retention_policy});
  results.push({status:r.status,reads:r.history.filter(e=>e.calls?.[0]?.name==='read-file').length});
 }
 assert.deepEqual(results,[{status:'BLOCK',reads:12},{status:'AWAITING_APPROVAL',reads:1}]);
});

test('inspection continuity outlives four exchanges and resumes without repeating completed reads',async t=>{
 // A deterministic policy reproduces the four-entry forgetting mechanism; it is
 // not a replay or prediction of GLM's private reasoning.
 for(const legacyView of [true,false]) {
  const paths=['a.mjs','b.mjs','c.mjs','d.mjs','e.mjs'];
  const x=await setup(t,({req,body,requests,candidate})=>{
   if(req.url.endsWith('/tokenizer'))return {usage:{prompt_tokens:body.messages.length>2?7000:100}};
   const n=requests.filter(r=>r.path.endsWith('/chat/completions')).length;
   const context=body.messages[0].content.split('\n').map(line=>{try{return JSON.parse(line);}catch{return null;}}).find(value=>value?.task_state);
   const read=legacyView
    ? context.recent_progress.flatMap(entry=>entry.calls.filter(call=>call.name==='read-file').map(call=>call.arguments.path))
    : (context.inspection_progress?.successful_file_reads??[]).map(item=>item.path);
   const missing=paths.find(path=>!read.includes(path));
   if(missing)return reply({tool_calls:[tc('step-'+n,'read-file',{path:missing})]},'tool_calls');
   if(!context.inspection_progress?.archived_evidence_read_after_recycle)return reply({tool_calls:[tc('step-'+n,'read-context-evidence',{digest:context.history_ref,max_chars:1024})]},'tool_calls');
   return reply({content:JSON.stringify(candidate)});
  });
  for(const path of paths.slice(1))writeFileSync(join(x.root,path),'export const value=1;\n');
  x.candidate.expected_base_tree_sha256=snapshotTree(x.root).tree_sha256;
  x.input.observation_allowlist=paths;
  x.input.tool_runtime=createReadOnlyToolRuntime({repository_root:x.root,observation_allowlist:paths});
  if(legacyView) {
   const result=await runGlmAgent(x.input);
   assert.equal(result.status,'BLOCK');assert.deepEqual(result.reason_codes,['glm.model-request-limit']);
   assert.equal(result.history.length,12);
  } else {
   const paused=await runGlmAgent({...x.input,pause_after_steps:5});assert.equal(paused.status,'PAUSED');
   const result=await runGlmAgent({...x.input,client:createGlmClient(x.clientOpts)});
   assert.equal(result.status,'AWAITING_APPROVAL',JSON.stringify(result.reason_codes));
   const reads=result.history.flatMap(entry=>(entry.calls??[]).filter(call=>call.name==='read-file').map(call=>call.arguments.path));
   assert.deepEqual(reads,paths);assert.equal(result.history.length,7);assert.ok(result.recycling.recycles>=1);
   assert.equal(readFileSync(join(x.root,'a.mjs'),'utf8'),'export const a=1;\n');
  }
 }
});

test('inspection projection excludes failed, stale and out-of-scope reads without copying file contents',async t=>{
 const x=await setup(t),base=snapshotTree(x.root);
 const observation=await x.input.tool_runtime.invoke('read-file',{path:'a.mjs'});
 const entry={calls:[{id:'read-1',name:'read-file',arguments:{path:'a.mjs'}}],observations:[observation]};
 const project=(history,selected=base,allowlist=['a.mjs'])=>projectInspectionProgress(history,selected,[{generation:0}],allowlist);
 const good=project([entry,entry]);assert.equal(good.successful_file_reads.length,1);
 assert.equal(good.successful_file_reads[0].file_sha256,base.files['a.mjs']);
 assert.doesNotMatch(JSON.stringify(good),/export const/);
 for(const mutate of [e=>{e.observations[0].ok=false;},e=>{e.observations[0].output.utf8='changed bytes';},e=>{e.observations[0].output.sha256='0'.repeat(64);},e=>{e.observations[0].output.path='other.mjs';}]) {
  const changed=structuredClone(entry);mutate(changed);assert.deepEqual(project([changed]).successful_file_reads,[]);
 }
 assert.deepEqual(project([entry],{files:{'a.mjs':'0'.repeat(64)}}).successful_file_reads,[]);
 assert.deepEqual(project([entry],base,[]).successful_file_reads,[]);
 const failed=structuredClone(entry);failed.observations[0].ok=false;
 assert.equal(project([entry,failed]).successful_file_reads.length,1);
});

test('inspection evidence state requires successful retrieval after a recycle',()=>{
 const digest='a'.repeat(64);
 const entry={calls:[{name:'read-context-evidence',arguments:{digest}}],observations:[{ok:true,output:{digest}}]};
 const project=(history,generation)=>projectInspectionProgress(history,{files:{}},[{generation}],[]).archived_evidence_read_after_recycle;
 assert.equal(project([entry],0),false);assert.equal(project([entry],1),true);
 const failed=structuredClone(entry);failed.observations[0].ok=false;assert.equal(project([failed],1),false);
 const mismatched=structuredClone(entry);mismatched.observations[0].output.digest='b'.repeat(64);assert.equal(project([mismatched],1),false);
 assert.equal(project([],1),false);
});

for(const [label,payload,reason] of [
 ['truncated',reply({content:''},'length'),'incomplete-output'],
 ['wrong-model',{...reply({content:'{}'}),model:'glm-4.7'},'model-mismatch'],
 ['input-overrun',reply({content:'{}'},'stop',{prompt_tokens:9999}),'input-reservation-exceeded'],
 ['output-overrun',reply({content:'{}'},'stop',{completion_tokens:9999}),'output-cap-exceeded'],
 ['bad-tool',reply({tool_calls:[tc('id','delete-all')]},'tool_calls'),'tool-denied'],
 ['bad-json-args',reply({tool_calls:[{...tc(),function:{name:'read-file',arguments:'{'}}]},'tool_calls'),'tool-arguments-invalid'],
 ['bad-final',reply({content:'not a patch'}),'candidate-invalid']]) {
 test(label+' blocks with no tool or mutation',async t=>{
  const x=await setup(t,({req})=>req.url.endsWith('/chat/completions')?payload:undefined);
  let invoked=0; const r=await runGlmAgent({...x.input,tool_runtime:{...x.input.tool_runtime,invoke(){invoked++;}}});
  assert.equal(r.status,'BLOCK');assert.ok(r.reason_codes.includes('glm.'+reason),JSON.stringify(r));assert.equal(invoked,0);
  assert.equal(readFileSync(join(x.root,'a.mjs'),'utf8'),'export const a=1;\n');
 });
}

test('accounted malformed response can return the bound transport ledger to idle without tool execution',async t=>{
 const x=await setup(t,({req})=>req.url.endsWith('/chat/completions')?reply({content:'',tool_calls:[]},'tool_calls'):undefined);
 let invoked=0;x.input.tool_runtime={...x.input.tool_runtime,invoke(){invoked++;}};
 const result=await runGlmAgent(x.input);assert.equal(result.status,'BLOCK');assert.deepEqual(result.reason_codes,['glm.tool-calls-invalid']);assert.equal(invoked,0);
 const receipt=x.input.client.receipts.at(-1);assert.equal(receipt.status,200);assert.ok(Number.isSafeInteger(receipt.input_tokens));assert.ok(Number.isSafeInteger(receipt.output_tokens));
 x.input.client.acknowledgeResponseFailure({request_sha256:receipt.request_sha256,code:'tool-calls-invalid'});
 const ledger=JSON.parse(readFileSync(join(x.dir,'state','glm-transport-ledger.json')));assert.equal(ledger.phase,'idle');
 assert.throws(()=>x.input.client.acknowledgeResponseFailure({request_sha256:'0'.repeat(64),code:'tool-calls-invalid'}),/response-failure-ack-invalid/);
});

test('batch validation rejects duplicate IDs before any execution',()=>{
 assert.throws(()=>validateCalls([tc(),tc()],['read-file'],new Set(),[]),/duplicate/);
 assert.throws(()=>validateCalls([tc('old')],['read-file'],new Set(['old']),[]),/duplicate/);
 assert.throws(()=>validateCalls([tc('id','run-command',{command:['sh','-c','echo nope']})],['run-command'],new Set(),['node','--test']),/command-not-exact/);
});

test('billing code is classified and never retried or leaked',async t=>{
 const x=await setup(t,({req,res})=>{if(req.url.endsWith('/chat/completions')){res.statusCode=429;return {error:{code:'1113',message:'sensitive-provider-diagnostic'}};}});
 const r=await runGlmAgent(x.input);assert.deepEqual(r.reason_codes,['glm.billing-unavailable']);assert.equal(x.requests.length,2);assert.doesNotMatch(JSON.stringify(r),/sensitive-provider/);
 const again=await runGlmAgent(x.input);assert.equal(again.status,'BLOCK');assert.equal(x.requests.length,2);
});

test('unknown tokenizer count prevents model dispatch',async t=>{
 const x=await setup(t,()=>({usage:{}}));const r=await runGlmAgent(x.input);assert.deepEqual(r.reason_codes,['glm.tokenizer-count-invalid']);assert.equal(x.requests.length,1);
});

test('fresh context over threshold never dispatches',async t=>{
 const x=await setup(t,({req})=>req.url.endsWith('/tokenizer')?{usage:{prompt_tokens:10000}}:undefined);
 const r=await runGlmAgent(x.input);assert.equal(r.status,'BLOCK');assert.equal(x.requests.length,1);
});

test('timeout includes stalled response body and no retry',async t=>{
 const x=await setup(t,({req,res})=>{if(req.url.endsWith('/chat/completions')){res.writeHead(200);res.write('{');return 'stall';}}, {timeout_ms:60});
 const r=await runGlmAgent(x.input);assert.deepEqual(r.reason_codes,['glm.deadline-exceeded']);assert.equal(x.requests.length,2);
});

test('redirect not followed',async t=>{
 const x=await setup(t,({res})=>{res.statusCode=302;res.setHeader('location','https://example.com/');return {};});
 const r=await runGlmAgent(x.input);assert.equal(r.status,'BLOCK');assert.equal(x.requests.length,1);
});

test('secret exists only in authenticated request, not receipt or checkpoint',async t=>{
 const secret='synthetic-secret-not-real';
 const provider=createInjectedSecretProvider({provider_id:'fixture',resolve:async()=>Buffer.from(secret)});
 const x=await setup(t,null,{api_key_ref:createSecretReference({provider_id:'fixture',locator:'fixture'}),secret_registry:createSecretProviderRegistry({providers:[provider]})});
 const r=await runGlmAgent(x.input);assert.equal(r.status,'AWAITING_APPROVAL');
 assert.equal(x.requests[0].auth,'Bearer '+secret);assert.doesNotMatch(JSON.stringify(r),new RegExp(secret));
 assert.doesNotMatch(readFileSync(join(x.dir,'state','checkpoint.json'),'utf8'),new RegExp(secret));
});

test('checkpoint corruption and changed scope block before network',async t=>{
 const x=await setup(t,({req})=>req.url.endsWith('/chat/completions')?reply({tool_calls:[tc()]},'tool_calls'):undefined);
 assert.equal((await runGlmAgent({...x.input,pause_after_steps:1})).status,'PAUSED');
 const count=x.requests.length;
 assert.equal((await runGlmAgent({...x.input,mutation_allowlist:[]})).status,'BLOCK');
 const path=join(x.dir,'state','checkpoint.json');const value=JSON.parse(readFileSync(path));value.history=[];writeFileSync(path,JSON.stringify(value));
 assert.equal((await runGlmAgent(x.input)).status,'BLOCK');assert.equal(x.requests.length,count);
});

test('writer lock after process loss prevents blind replay',async t=>{
 const x=await setup(t);mkdirSync(join(x.dir,'state'));writeFileSync(join(x.dir,'state','writer.lock'),'');
 assert.equal((await runGlmAgent(x.input)).status,'BLOCK');assert.equal(x.requests.length,0);
});

test('request cap and duplicate IDs across turns stop loop',async t=>{
 const x=await setup(t,({req})=>req.url.endsWith('/chat/completions')?reply({tool_calls:[tc()]},'tool_calls'):undefined);
 const r=await runGlmAgent(x.input);assert.deepEqual(r.reason_codes,['glm.duplicate-or-invalid-tool-id']);assert.equal(r.history.length,1);
});

test('config rejects embedded keys and alternative models',()=>{
 assert.throws(()=>parseConfig({api_key:'no'}));
 assert.throws(()=>createGlmClient({chat_endpoint:'https://example.com/chat/completions'}),/endpoint-forbidden/);
});

function configuredInput(x, credential = {}) {
 return {schema_version:'are.glm-flash-config/v1',model:MODEL,
  credential:{provider_kind:'local-sops-age',provider_id:'local-model-secrets',locator:'model/zai-key',...credential},
  run_id:'configured-test',request:x.input.request,fixture_root:x.root,state_directory:join(x.dir,'configured-state'),
  observation_allowlist:['a.mjs'],mutation_allowlist:['a.mjs'],context_limit:10000,recycle_at:9000,safety_margin:1000};
}

test('configured bridge paths are optional and reject malformed or secret-bearing config',async t=>{
 const x=await setup(t);
 const config=configuredInput(x);
 assert.deepEqual(parseConfig(config),config);
 for(const key of ['python_command','project_root','key_file','vault_file']) {
  const valid=configuredInput(x,{[key]:'/explicit/path with spaces'});
  assert.deepEqual(parseConfig(valid),valid);
  for(const value of ['',null,undefined,42,[],{},'bad\0path']) {
   assert.throws(()=>parseConfig(configuredInput(x,{[key]:value})),/credential-path-invalid/);
  }
 }
 for(const extra of [{api_key:'embedded'},{env:{API_KEY:'embedded'}},{create_client:'override'},{provider_kind:'environment'},{locator:'model/other-key'}]) {
  assert.throws(()=>parseConfig(configuredInput(x,extra)),/credential-config-invalid/);
 }
 let created=false;
 await assert.rejects(()=>runConfiguredGlm(configuredInput(x,{python_command:''}),{create_client(){created=true;}}),/credential-path-invalid/);
 assert.equal(created,false);assert.equal(x.requests.length,0);
});

test('configured runner uses explicit bridge executable, root and store paths without leaking material',async t=>{
 const x=await setup(t);
 const bridgeRoot=join(x.dir,'bridge project');mkdirSync(bridgeRoot);
 const executable=join(x.dir,'fixture-python');
 const material='synthetic-configured-bridge-secret';
 // A synthetic interpreter exercises the real process bridge, without SOPS or a live vault.
 writeFileSync(executable,`#!${process.execPath}\n`+
  `const fs=require('node:fs');const request=JSON.parse(fs.readFileSync(0,'utf8'));`+
  `fs.writeFileSync('observed.json',JSON.stringify({argv:process.argv.slice(2),cwd:process.cwd(),request}));`+
  `process.stdout.write(${JSON.stringify(material)});\n`,{mode:0o700});
 const config=configuredInput(x,{python_command:executable,project_root:bridgeRoot,
  key_file:join(x.dir,'explicit key.txt'),vault_file:join(x.dir,'explicit vault.yaml')});
 const result=await runConfiguredGlm(config,{create_client:options=>createGlmClient({...x.clientOpts,...options})});
 assert.equal(result.status,'AWAITING_APPROVAL',JSON.stringify(result.reason_codes));
 const observed=JSON.parse(readFileSync(join(bridgeRoot,'observed.json'),'utf8'));
 assert.deepEqual(observed.argv,['-m','secret_management.bridge']);assert.equal(observed.cwd,bridgeRoot);
 assert.equal(observed.request.key_file,config.credential.key_file);
 assert.equal(observed.request.vault_file,config.credential.vault_file);
 assert.equal(observed.request.locator,'model/zai-key');
 assert.equal(observed.request.schema_version,'secret-management.process-bridge-request/v1');
 assert.equal(x.requests.length,2);
 for(const request of x.requests)assert.equal(request.auth,'Bearer '+material);
 assert.doesNotMatch(JSON.stringify(result),new RegExp(material));
 assert.doesNotMatch(readFileSync(join(config.state_directory,'checkpoint.json'),'utf8'),new RegExp(material));
 assert.equal(readFileSync(join(x.root,'a.mjs'),'utf8'),'export const a=1;\n');
});

test('missing configured bridge blocks before HTTP dispatch with a redacted result',async t=>{
 const x=await setup(t);
 const config=configuredInput(x,{python_command:join(x.dir,'missing-private-interpreter'),project_root:x.dir});
 const result=await runConfiguredGlm(config,{create_client:options=>createGlmClient({...x.clientOpts,...options})});
 assert.equal(result.status,'BLOCK');assert.deepEqual(result.reason_codes,['glm.secret-resolution-failed']);
 assert.equal(x.requests.length,0);assert.doesNotMatch(JSON.stringify(result),/missing-private-interpreter/);
});

import {createFixture, verifyCandidate, runCanary, addRecyclingFixture, assessRecycling} from './canary.mjs';

test('recycling assessment rejects missing reads and pre-recycle evidence access',()=>{
 const paths=['cases-first.json','cases-second.json'];
 const entry=(name,args)=>({calls:[{name,arguments:args}],observations:[{ok:true}]});
 const output={history:[entry('read-file',{path:paths[0]}),entry('read-file',{path:paths[1]}),entry('read-context-evidence',{})],
  recycling:{recycles:1,dispatches:[{generation:0},{generation:1},{generation:1}]}};
 assert.ok(Object.values(assessRecycling(output,paths)).every(Boolean));
 output.recycling.dispatches[2].generation=0;
 assert.equal(assessRecycling(output,paths).evidence_read_after_recycle,false);
 output.history[0].observations[0].ok=false;
 assert.equal(assessRecycling(output,paths).required_files_read,false);
 assert.ok(Object.values(assessRecycling({},paths)).every(value=>value===false));
});

test('recycling fixtures fit the real read-only tool result ceiling',async t=>{
 const x=await setup(t);const paths=addRecyclingFixture(x.root);
 const runtime=createReadOnlyToolRuntime({repository_root:x.root,observation_allowlist:paths,maximum_result_bytes:12000});
 for(const path of paths) {
  const result=await runtime.invoke('read-file',{path});assert.equal(result.ok,true);
  assert.equal(JSON.parse(readFileSync(join(x.root,path),'utf8')).length,28);
 }
});

test('canary rejects invalid credential settings before constructing its client',async()=>{
 let created=false,reports=0;
 for(const credential of [{api_key:'must-not-persist'},null,[],{provider_kind:'local-sops-age',provider_id:'local-model-secrets',locator:'model/zai-key',python_command:''}]) {
  await assert.rejects(()=>runCanary(credential,{create_client(){created=true;},report(){reports++;}}),/credential-/);
 }
 assert.equal(created,false);assert.equal(reports,0);
});

test('canary carries explicit bridge settings through an offline model call and seven-test verification',async t=>{
 const x=await setup(t,({req,body})=>{
  if(req.url.endsWith('/tokenizer'))return;
  const binding=body.messages[0].content.split('\n').map(line=>{try{return JSON.parse(line);}catch{return null;}}).find(value=>value?.base_tree_sha256);
  const source=`export function createQueue(){const jobs=new Map();return {enqueue(job){if(!job||typeof job!=='object'||Array.isArray(job)||typeof job.id!=='string'||!job.id)throw new TypeError();if(jobs.has(job.id))return false;jobs.set(job.id,job);return true},dequeue(){if(!jobs.size)return null;const [id,job]=jobs.entries().next().value;jobs.delete(id);return job},size(){return jobs.size}}}`;
  return reply({content:JSON.stringify({schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:binding.base_tree_sha256,
   changes:[{operation:'replace-file',path:'src/queue.mjs',expected_file_sha256:binding.mutation_files['src/queue.mjs'],utf8:source}],authority_effect:'none'})});
 });
 const bridgeRoot=join(x.dir,'canary bridge');mkdirSync(bridgeRoot);
 const executable=join(x.dir,'canary-python');
 writeFileSync(executable,`#!${process.execPath}\nconst fs=require('node:fs');fs.writeFileSync('observed.json',fs.readFileSync(0));process.stdout.write('synthetic-canary-secret');\n`,{mode:0o700});
 const credential={provider_kind:'local-sops-age',provider_id:'local-model-secrets',locator:'model/zai-key',
  python_command:executable,project_root:bridgeRoot,key_file:join(x.dir,'key.txt'),vault_file:join(x.dir,'vault.yaml')};
 const reports=[];
 const receipt=await runCanary(credential,{retention_policy:'recent-observations-v1',create_client:options=>createGlmClient({...x.clientOpts,...options}),report(line){
  const record=JSON.parse(line);reports.push(record);
  if(record.status==='RUNNING')t.after(()=>rmSync(record.directory,{recursive:true,force:true}));
 }});
 assert.equal(receipt.status,'PASS_BOUNDED');assert.equal(receipt.original_fixture_unchanged,true);
 assert.equal(receipt.model_requests,1);assert.equal(receipt.tokenizer_requests,1);
 assert.match(receipt.verification.verification.stdout,/# pass 7/);
 assert.deepEqual(JSON.parse(readFileSync(join(receipt.directory,'config.json'),'utf8')).credential,credential);
 const recordedConfig=JSON.parse(readFileSync(join(receipt.directory,'config.json'),'utf8'));
 assert.equal(recordedConfig.retention_policy,'recent-observations-v1');assert.equal(receipt.retention_policy,recordedConfig.retention_policy);
 assert.equal(receipt.request_sha256,hash(recordedConfig.request));
 assert.equal(receipt.fixture_tree_sha256,snapshotTree(recordedConfig.fixture_root).tree_sha256);
 assert.equal(receipt.dispatch_headroom.length,1);
 assert.equal(receipt.dispatch_headroom[0].soft_headroom_tokens,recordedConfig.recycle_at-receipt.dispatch_headroom[0].projected_upper_bound);
 assert.deepEqual(receipt.read_counts,{attempts:0,successful:0,unique_paths:0,by_path:{}});
 const observed=JSON.parse(readFileSync(join(bridgeRoot,'observed.json'),'utf8'));
 assert.equal(observed.key_file,credential.key_file);assert.equal(observed.vault_file,credential.vault_file);
 assert.equal(x.requests[1].auth,'Bearer synthetic-canary-secret');
 assert.doesNotMatch(JSON.stringify(reports),/synthetic-canary-secret/);
 for(const file of ['config.json','agent-result.json','receipt.json'])assert.doesNotMatch(readFileSync(join(receipt.directory,file),'utf8'),/synthetic-canary-secret/);
});
test('independent queue verifier accepts correct implementation and rejects wrong one', t=>{
 const dir=mkdtempSync(join(tmpdir(),'are-glm-verifier-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const root=createFixture(dir),base=snapshotTree(root);
 const candidate={schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,changes:[{operation:'replace-file',path:'src/queue.mjs',expected_file_sha256:base.files['src/queue.mjs'],utf8:`export function createQueue(){const jobs=new Map();return {enqueue(job){if(!job||typeof job!=='object'||Array.isArray(job)||typeof job.id!=='string'||!job.id)throw new TypeError();if(jobs.has(job.id))return false;jobs.set(job.id,job);return true},dequeue(){if(!jobs.size)return null;const [id,job]=jobs.entries().next().value;jobs.delete(id);return job},size(){return jobs.size}}}`}],authority_effect:'none'};
 assert.equal(verifyCandidate(root,candidate,join(dir,'good')).status,'PATCH_CANDIDATE');
 candidate.changes[0].utf8='export function createQueue(){return {enqueue(){return true},dequeue(){return null},size(){return 0}}}';
 assert.equal(verifyCandidate(root,candidate,join(dir,'bad')).status,'BLOCK');
});

test('verification denies network and reading host secrets', t=>{
 const dir=mkdtempSync(join(tmpdir(),'are-glm-permission-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const root=createFixture(dir),base=snapshotTree(root);
 for(const [name,source] of [['read',"import {readFileSync} from 'node:fs';readFileSync('/etc/passwd');"],['network',"import net from 'node:net';net.connect(80,'127.0.0.1');"]]){
 const candidate={schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,changes:[{operation:'replace-file',path:'src/queue.mjs',expected_file_sha256:base.files['src/queue.mjs'],utf8:source+' export function createQueue(){}'}],authority_effect:'none'};
 const r=verifyCandidate(root,candidate,join(dir,name));assert.equal(r.status,'BLOCK');assert.match(r.verification.stdout+r.verification.stderr,/ERR_ACCESS_DENIED/);
 }
});


test('invalid candidate keeps bounded visible final text without accepting it or retaining reasoning',async t=>{
 const text='not a JSON patch';
 const x=await setup(t,({req})=>req.url.endsWith('/chat/completions')?reply({content:text,reasoning_content:'private-provider-field'}):undefined);
 const r=await runGlmAgent(x.input);
 assert.equal(r.status,'BLOCK');assert.deepEqual(r.reason_codes,['glm.candidate-invalid']);
 assert.equal(r.final_response_evidence.text,text);assert.equal(r.final_response_evidence.text_sha256,hash(text));
 assert.equal(r.final_response_evidence.truncated,false);assert.equal(r.candidate,undefined);
 assert.equal(JSON.stringify(r).includes('private-provider-field'),false);
 assert.equal(r.recycling.phase,'model-returned');
});

test('final evidence truncates on UTF-8 boundaries with original digest and explicit length',()=>{
 const text='é'.repeat(8191)+'😀tail'; const r=captureFinalResponse(text);
 assert.equal(r.recorded_bytes,16382);assert.equal(r.text,'é'.repeat(8191));
 assert.equal(r.original_bytes,Buffer.byteLength(text));assert.equal(r.text_sha256,hash(text));
 assert.equal(r.truncated,true);assert.ok(r.recorded_bytes<=16384);
});

test('successful candidate also carries separate visible final evidence',async t=>{
 const x=await setup(t);const r=await runGlmAgent(x.input);
 assert.equal(r.status,'AWAITING_APPROVAL');
 assert.deepEqual(JSON.parse(r.final_response_evidence.text),r.candidate);
 assert.equal(r.final_response_evidence.posture,'unvalidated-model-output');
});


test('rejected archive call preserves visible arguments without provider reasoning',async t=>{
 const call=tc('foreign','read-context-evidence',{digest:'f'.repeat(64),max_chars:100});
 const x=await setup(t,({req})=>req.url.endsWith('/chat/completions')?reply({tool_calls:[call],reasoning_content:'private-provider-field'},'tool_calls'):undefined);
 const r=await runGlmAgent(x.input);
 assert.equal(r.status,'BLOCK');assert.deepEqual(r.reason_codes,['recycling.foreign-evidence']);
 assert.deepEqual(JSON.parse(r.last_model_response_evidence.text).tool_calls,[call]);
 assert.equal(r.last_model_response_evidence.finish_reason,'tool_calls');
 assert.equal(r.final_response_evidence,null);
 assert.equal(JSON.stringify(r).includes('private-provider-field'),false);
 assert.equal(r.recycling.phase,'tool-pending');
});

test('final deadline extends only tool-free model requests and binds client identity',async t=>{
 const x=await setup(t,async({req})=>{if(req.url.endsWith('/chat/completions'))await new Promise(r=>setTimeout(r,200));}, {timeout_ms:100,final_timeout_ms:1000,maximum_requests:1});
 assert.notEqual(x.input.client.identity,createGlmClient({...x.clientOpts,final_timeout_ms:100}).identity);
 const r=await runGlmAgent({...x.input,tool_policy:{allow:['read-file','read-context-evidence','read-inspection-evidence']},delivery_policy:'bounded-reads-v1',completion_policy:'explicit-finalization-v3'});
 assert.equal(r.status,'AWAITING_APPROVAL',JSON.stringify(r.reason_codes));
 assert.deepEqual(x.requests.find(r=>r.path.endsWith('/chat/completions')).body.tools,[]);
 assert.equal(r.receipts.find(r=>r.kind==='tokenizer').timeout_ms,100);
 assert.equal(r.receipts.find(r=>r.kind==='model').timeout_ms,1000);
});
test('extended final deadline leaves ordinary requests bounded without retries',async t=>{
 const x=await setup(t,({req})=>req.url.endsWith('/chat/completions')?'stall':undefined,{timeout_ms:100,final_timeout_ms:1000});
 const r=await runGlmAgent(x.input);
 assert.ok(r.reason_codes.includes('glm.deadline-exceeded'));
 assert.equal(r.receipts.filter(r=>r.kind==='model').length,1);
 assert.equal(r.receipts.find(r=>r.kind==='model').timeout_ms,100);
 for(const final_timeout_ms of [0,60001,1.5])assert.throws(()=>createGlmClient({...x.clientOpts,final_timeout_ms}),/final-timeout-invalid/);
});

 test('typed secret timeout survives in receipt without dispatch or secret text',async t=>{
 const provider=createInjectedSecretProvider({provider_id:'fixture',resolve:async()=>{throw new SecretResolutionError('timeout');}});
 const x=await setup(t,null,{api_key_ref:createSecretReference({provider_id:'fixture',locator:'private-locator-never-export'}),secret_registry:createSecretProviderRegistry({providers:[provider]})});
 const r=await runGlmAgent(x.input);assert.deepEqual(r.reason_codes,['glm.secret-resolution-failed']);
 assert.equal(x.requests.length,0);assert.equal(r.receipts[0].secret_resolution_failure,'timeout');assert.equal(r.receipts[0].dispatched,false);
 assert.doesNotMatch(JSON.stringify(r),/private-locator-never-export/);
 });

test('model deadline extends ordinary requests independently of tokenizer and binds identity',async t=>{
 const x=await setup(t,async({req})=>{if(req.url.endsWith('/chat/completions'))await new Promise(r=>setTimeout(r,250));},{timeout_ms:100,model_timeout_ms:1500});
 assert.notEqual(x.input.client.identity,createGlmClient({...x.clientOpts,model_timeout_ms:100}).identity);
 const r=await runGlmAgent(x.input);
 assert.equal(r.status,'AWAITING_APPROVAL',JSON.stringify(r.reason_codes));
 assert.deepEqual(r.receipts.map(r=>[r.kind,r.timeout_ms]),[['tokenizer',100],['model',1500]]);
 assert.equal(x.requests.length,2);
});
test('extended model deadline retains tokenizer timeout and does not dispatch model on failed measurement',async t=>{
 const x=await setup(t,({req})=>req.url.endsWith('/tokenizer')?'stall':undefined,{timeout_ms:100,model_timeout_ms:1500});
 const r=await runGlmAgent(x.input);
 assert.ok(r.reason_codes.includes('glm.deadline-exceeded'));
 assert.equal(r.receipts.length,1);assert.equal(r.receipts[0].kind,'tokenizer');assert.equal(r.receipts[0].timeout_ms,100);
});
test('extended model deadline still times out once without retry',async t=>{
 const x=await setup(t,({req})=>req.url.endsWith('/chat/completions')?'stall':undefined,{timeout_ms:100,model_timeout_ms:200});
 const r=await runGlmAgent(x.input);
 assert.ok(r.reason_codes.includes('glm.deadline-exceeded'));assert.equal(r.receipts.filter(r=>r.kind==='model').length,1);
 assert.equal(r.receipts.find(r=>r.kind==='model').timeout_ms,200);assert.equal(x.requests.length,2);
});
test('run cancellation interrupts extended model wait without retry',async t=>{
 const controller=new AbortController();
 const x=await setup(t,({req})=>{if(req.url.endsWith('/chat/completions')){controller.abort();return 'stall';}},{timeout_ms:100,model_timeout_ms:1500,signal:controller.signal});
 const r=await runGlmAgent({...x.input,signal:controller.signal});
 assert.equal(r.status,'BLOCK');assert.equal(r.receipts.filter(r=>r.kind==='model').length,1);
 assert.ok(r.receipts.find(r=>r.kind==='model').latency_ms<1500);assert.equal(x.requests.length,2);
});
test('deadline constraints reject invalid values and config cannot bypass bounds',async t=>{
 const x=await setup(t);
 for(const model_timeout_ms of [0,29999,60001,1.5,NaN,'60000',null])assert.throws(()=>createGlmClient({...x.clientOpts,model_timeout_ms}),/model-timeout-invalid/);
 assert.throws(()=>createGlmClient({...x.clientOpts,model_timeout_ms:60000,final_timeout_ms:30000}),/final-timeout-invalid/);
 const c=configuredInput(x);
 assert.equal(parseConfig({...c,model_timeout_ms:60000}).model_timeout_ms,60000);
 for(const model_timeout_ms of [29999,60001,'60000',null])assert.throws(()=>parseConfig({...c,model_timeout_ms}),/config-model-timeout-invalid/);
});

test('configured run passes explicit deadline to client before any provider access',async t=>{
 const x=await setup(t),sentinel=new Error('captured-client');let captured;
 await assert.rejects(()=>runConfiguredGlm({...configuredInput(x),model_timeout_ms:60000},{create_client(options){captured=options;throw sentinel;}}),error=>error===sentinel);
 assert.equal(captured.model_timeout_ms,60000);assert.equal(captured.signal.aborted,false);
});

test('opt-in transient recovery preserves logical turns and never replays tools',async t=>{
 let calls=0;
 const x=await setup(t,({req})=>{if(req.url.endsWith('/chat/completions')){calls++;if(calls===1)return 'stall';if(calls===2)return reply({tool_calls:[tc('read-once')]},'tool_calls');}},{timeout_ms:100,model_timeout_ms:200,maximum_model_retries:2,maximum_requests:2});
 const r=await runGlmAgent(x.input);
 assert.equal(r.status,'AWAITING_APPROVAL',JSON.stringify(r.reason_codes));
 const physical=r.receipts.filter(r=>r.kind==='model');assert.equal(physical.length,3);
 assert.deepEqual(physical.map(r=>[r.model_request_sequence,r.attempt_index]),[[1,0],[1,1],[2,0]]);
 assert.equal(physical[0].failure_code,'deadline-exceeded');assert.equal(physical[0].retryable,true);
 assert.equal(physical[0].request_sha256,physical[1].request_sha256);
 assert.equal(x.input.client.logical_receipts.filter(r=>r.kind==='model').length,2);
 assert.equal(r.history.flatMap(h=>h.calls??[]).filter(c=>c.id==='read-once').length,1);
 assert.equal(r.recycling.dispatches.length,2);assert.equal(r.automatic_retry_permitted,true);
 const ledger=JSON.parse(readFileSync(join(x.input.context_recycling.directory,'glm-transport-ledger.json')));
 assert.equal(ledger.model_calls,3);assert.equal(ledger.model_requests,2);assert.equal(ledger.phase,'idle');
 assert.equal(x.input.client.transport.kind,'are-bounded-recovery-recycling');
 assert.notEqual(x.input.client.identity,createGlmClient({...x.clientOpts,maximum_model_retries:0}).identity);
});
test('one request never gets a second retry and failed ledger cannot resume',async t=>{
 const x=await setup(t,({req})=>req.url.endsWith('/chat/completions')?'stall':undefined,{timeout_ms:100,model_timeout_ms:150,maximum_model_retries:2});
 const r=await runGlmAgent(x.input);assert.equal(r.status,'BLOCK');assert.equal(r.receipts.filter(r=>r.kind==='model').length,2);
 const ledgerPath=join(x.input.context_recycling.directory,'glm-transport-ledger.json');const ledger=JSON.parse(readFileSync(ledgerPath));
 assert.equal(ledger.phase,'failed');assert.equal(ledger.model_calls,2);assert.equal(ledger.model_requests,1);
 const before=x.requests.length;const resumed=await runGlmAgent({...x.input,client:createGlmClient(x.clientOpts)});
 assert.equal(resumed.status,'BLOCK');assert.equal(x.requests.length,before);
});
test('total retry allowance is shared across logical requests',async t=>{
 let calls=0;
 const x=await setup(t,({req})=>{if(req.url.endsWith('/chat/completions')){calls++;if(calls%2===1)return 'stall';return reply({tool_calls:[tc('read-'+calls)]},'tool_calls');}},{timeout_ms:100,model_timeout_ms:150,maximum_model_retries:2,maximum_requests:3});
 const r=await runGlmAgent(x.input);assert.equal(r.status,'BLOCK');assert.equal(calls,5);
 const m=r.receipts.filter(r=>r.kind==='model');assert.equal(m.filter(r=>r.attempt_index===1).length,2);
 assert.deepEqual(m.map(r=>r.model_request_sequence),[1,1,2,2,3]);
});
test('recovery never retries tokenizer, billing, authentication or malformed model output',async t=>{
 for(const scenario of ['tokenizer','billing','auth','malformed']){
  const x=await setup(t,({req,res})=>{
   if(scenario==='tokenizer'&&req.url.endsWith('/tokenizer'))return 'stall';
   if(req.url.endsWith('/chat/completions')){
    if(scenario==='billing'){res.statusCode=429;return {error:{code:'1113'}};}
    if(scenario==='auth'){res.statusCode=401;return {error:{code:'1000'}};}
    if(scenario==='malformed')return {model:MODEL,choices:[]};
   }
  },{timeout_ms:100,model_timeout_ms:150,maximum_model_retries:2});
  const r=await runGlmAgent(x.input);assert.equal(r.status,'BLOCK');assert.equal(r.receipts.filter(r=>r.kind==='model').length,scenario==='tokenizer'?0:1);
 }
});
test('cancellation during retry backoff does not dispatch or reserve another attempt',async t=>{
 const controller=new AbortController();
 const x=await setup(t,({req,res})=>{if(req.url.endsWith('/chat/completions')){res.statusCode=503;setTimeout(()=>controller.abort(),50);return {error:{code:'500'}};}},{maximum_model_retries:2,signal:controller.signal});
 const r=await runGlmAgent({...x.input,signal:controller.signal});assert.equal(r.status,'BLOCK');assert.equal(r.receipts.filter(r=>r.kind==='model').length,1);
 const ledger=JSON.parse(readFileSync(join(x.input.context_recycling.directory,'glm-transport-ledger.json')));assert.equal(ledger.model_calls,1);assert.equal(ledger.phase,'failed');
});
test('retry configuration has a closed two-attempt reserve',async t=>{
 const x=await setup(t);for(const maximum_model_retries of [-1,3,1.5,true,'2',null]){
  assert.throws(()=>createGlmClient({...x.clientOpts,maximum_model_retries}),/model-retry-budget-invalid/);
  assert.throws(()=>parseConfig({...configuredInput(x),maximum_model_retries}),/config-model-retries-invalid/);
 }
});

test('successful recovery resumes with its consumed retry budget and physical receipts intact',async t=>{
 let calls=0;
 const x=await setup(t,({req})=>{if(req.url.endsWith('/chat/completions')){calls++;if(calls===1)return 'stall';if(calls===2)return reply({tool_calls:[tc('recovered-read')]},'tool_calls');}},{timeout_ms:100,model_timeout_ms:150,maximum_model_retries:1,maximum_requests:2});
 const first=await runGlmAgent({...x.input,pause_after_steps:1});assert.equal(first.status,'PAUSED');
 const client=createGlmClient(x.clientOpts);const result=await runGlmAgent({...x.input,client});
 assert.equal(result.status,'AWAITING_APPROVAL',JSON.stringify(result.reason_codes));assert.equal(calls,3);
 assert.equal(result.receipts.filter(r=>r.kind==='model').length,3);assert.equal(client.logical_receipts.filter(r=>r.kind==='model').length,2);
});
