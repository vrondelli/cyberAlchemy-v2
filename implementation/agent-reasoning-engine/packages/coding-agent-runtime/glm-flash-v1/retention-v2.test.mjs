import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createGlmClient,MODEL,hash} from './transport.mjs';
import {runGlmAgent} from './agent.mjs';
import {projectRecentObservations,projectRecentObservationsV2,validateRetentionPolicy} from './retention.mjs';
import {createReadOnlyToolRuntime} from '../read-only-tools.mjs';
import {snapshotTree} from '../verifier.mjs';

const tc=id=>({id,type:'function',function:{name:'read-file',arguments:JSON.stringify({path:'a.mjs'})}});
const reply=(message,finish_reason='stop')=>({model:MODEL,choices:[{message:{role:'assistant',...message},finish_reason}],usage:{prompt_tokens:100,completion_tokens:20}});
const context=body=>JSON.parse(body.messages[0].content.split('\n').at(-1));

async function setup(t,handler) {
 const directory=mkdtempSync(join(tmpdir(),'are-retention-v2-')),root=join(directory,'fixture');mkdirSync(root);
 writeFileSync(join(root,'a.mjs'),'export const a=1;\n');
 const base=snapshotTree(root),requests=[];
 const candidate={schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,
  changes:[{operation:'replace-file',path:'a.mjs',expected_file_sha256:base.files['a.mjs'],utf8:'export const a=2;\n'}],rationale:'fixture',authority_effect:'none'};
 const server=createServer(async(req,res)=>{
  const chunks=[];for await(const chunk of req)chunks.push(chunk);
  const body=JSON.parse(Buffer.concat(chunks));requests.push({path:req.url,body});
  const response=handler({body,requests,tokenizer:req.url.endsWith('/tokenizer'),candidate});
  res.setHeader('content-type','application/json');res.end(JSON.stringify(response));
 });
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 t.after(async()=>{server.closeAllConnections();await new Promise(done=>server.close(done));rmSync(directory,{recursive:true,force:true});});
 const origin=`http://127.0.0.1:${server.address().port}`;
 const clientOptions={chat_endpoint:origin+'/chat/completions',tokenizer_endpoint:origin+'/tokenizer'};
 const input={run_id:'retention-v2',request:'Change a to 2',fixture_root:root,client:createGlmClient(clientOptions),retention_policy:'recent-observations-v2',
  observation_allowlist:['a.mjs'],mutation_allowlist:['a.mjs'],verification_command:[],
  tool_runtime:createReadOnlyToolRuntime({repository_root:root,observation_allowlist:['a.mjs']}),tool_policy:{allow:['read-file','read-context-evidence']},
  context_recycling:{directory:join(directory,'state'),context_limit:10000,recycle_at:9000,safety_margin:1000,
   state:{objective:'Change a to 2',constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['fixture']}}};
 return {input,directory,root,requests,clientOptions};
}

for(const resume of [false,true])test(`v2 reaches all 12 model turns without tokenizer exhaustion; resume=${resume}`,async t=>{
 const x=await setup(t,({body,requests,tokenizer})=>tokenizer?{usage:{prompt_tokens:body.messages.length>2?7000:100}}
  :reply({tool_calls:[tc('read-'+requests.filter(r=>r.path.endsWith('/chat/completions')).length)]},'tool_calls'));
 if(resume)assert.equal((await runGlmAgent({...x.input,pause_after_steps:6})).status,'PAUSED');
 const result=await runGlmAgent({...x.input,client:resume?createGlmClient(x.clientOptions):x.input.client});
 assert.deepEqual(result.reason_codes,['glm.model-request-limit']);assert.equal(result.history.length,12);
 assert.equal(result.receipts.filter(r=>r.kind==='model').length,12);
 assert.equal(result.receipts.filter(r=>r.kind==='tokenizer').length,23);
 let measured=0;
 for(const request of x.requests) {
  if(request.path.endsWith('/tokenizer'))measured++;
  else {assert.ok(measured>=1 && measured<=2,`measurements before a dispatch: ${measured}`);measured=0;}
 }
 assert.equal(measured,0);assert.equal(result.recycling.recycles,11);
 assert.ok(result.recycling.dispatches.every(d=>d.projected_upper_bound<9000 && d.output_reservation===2048));
 const checkpoint=JSON.parse(readFileSync(join(x.directory,'state','checkpoint.json'),'utf8'));
 assert.equal(checkpoint.history.length,12);assert.ok(checkpoint.history.every(e=>e.observations[0].output.utf8==='export const a=1;\n'));
});

test('v2 retains useful newest output when it fits and masks only older observations',async t=>{
 const x=await setup(t,({body,requests,tokenizer,candidate})=>{
  if(tokenizer)return {usage:{prompt_tokens:100}};
  const n=requests.filter(r=>r.path.endsWith('/chat/completions')).length;
  if(n<3)return reply({reasoning_content:'returned protocol',tool_calls:[tc('read-'+n)]},'tool_calls');
  assert.equal(body.messages[2].tool_calls[0].id,'read-1');assert.equal(body.messages[2].reasoning_content,'returned protocol');
  assert.equal(body.messages[3].tool_call_id,'read-1');assert.equal(JSON.parse(body.messages[3].content).are_observation_masked,true);
  assert.equal(body.messages[4].tool_calls[0].id,'read-2');assert.equal(body.messages[5].tool_call_id,'read-2');
  assert.equal(JSON.parse(body.messages[5].content).output.utf8,'export const a=1;\n');
  return reply({content:JSON.stringify(candidate)});
 });
 const result=await runGlmAgent(x.input);assert.equal(result.status,'AWAITING_APPROVAL');assert.equal(result.recycling.recycles,0);
 assert.equal(result.receipts.filter(r=>r.kind==='tokenizer').length,3);
 assert.equal(readFileSync(join(x.root,'a.mjs'),'utf8'),'export const a=1;\n');
});

for(const delta of [-1,0,1])test(`v2 full-request boundary ${delta} uses empty fallback only on overflow`,async t=>{
 const x=await setup(t,({body,requests,tokenizer,candidate})=>{
  if(tokenizer)return {usage:{prompt_tokens:body.messages.length>2?6696+delta:100}};
  const n=requests.filter(r=>r.path.endsWith('/chat/completions')).length;
  return n===1?reply({tool_calls:[tc('read-1')]},'tool_calls'):reply({content:JSON.stringify(candidate)});
 });
 const result=await runGlmAgent(x.input),model=x.requests.filter(r=>r.path.endsWith('/chat/completions'));
 assert.equal(result.status,'AWAITING_APPROVAL');assert.equal(model.length,2);
 assert.equal(model[1].body.messages.length,delta<0?4:2);
 assert.equal(result.receipts.filter(r=>r.kind==='tokenizer').length,delta<0?2:3);
 assert.equal(result.recycling.recycles,delta<0?0:1);
 assert.equal(result.history[0].observations[0].output.utf8,'export const a=1;\n');
});

test('v2 validates complete multi-tool pairs without changing v1 projection',()=>{
 const history=Array.from({length:2},(_,step)=>({messages:[{role:'assistant',tool_calls:[tc(`a-${step}`),tc(`b-${step}`)]},
  {role:'tool',tool_call_id:`a-${step}`,content:'first'}, {role:'tool',tool_call_id:`b-${step}`,content:'second'}]}));
 const original=JSON.stringify(history),ref='a'.repeat(64);
 const v1=projectRecentObservations(history,ref),v2=projectRecentObservationsV2(history,ref);
 assert.equal(JSON.stringify(v1),original);assert.equal(JSON.stringify(history),original);
 assert.equal(v2[1].messages[1].content,'first');
 assert.equal(JSON.parse(v2[0].messages[2].content).original_content_sha256,hash('second'));
 for(const mutate of [h=>h[0].messages.pop(),h=>{h[1].messages[1].tool_call_id='wrong';},h=>{h[0].messages[0].tool_calls[1].id='a-0';}]) {
  const broken=structuredClone(history);mutate(broken);
  assert.throws(()=>projectRecentObservationsV2(broken,ref),/retention-tool-pair-invalid/);
 }
 assert.equal(validateRetentionPolicy(),'clear-v1');assert.equal(validateRetentionPolicy('recent-observations-v2'),'recent-observations-v2');
});

test('v2 policy drift on resume blocks before network',async t=>{
 const x=await setup(t,({tokenizer})=>tokenizer?{usage:{prompt_tokens:100}}:reply({tool_calls:[tc('read-1')]},'tool_calls'));
 assert.equal((await runGlmAgent({...x.input,pause_after_steps:1})).status,'PAUSED');const count=x.requests.length;
 for(const retention_policy of ['clear-v1','recent-observations-v1']) {
  const result=await runGlmAgent({...x.input,retention_policy,client:createGlmClient(x.clientOptions)});
  assert.deepEqual(result.reason_codes,['recycling.scope-or-policy-drift']);assert.equal(x.requests.length,count);
 }
});

for(const failure of ['unknown','oversize'])test(`v2 fallback ${failure} fails closed without more measurement candidates`,async t=>{
 const x=await setup(t,({body,tokenizer})=>{
  if(!tokenizer)return reply({tool_calls:[tc('read-1')]},'tool_calls');
  if(context(body).generation>0)return failure==='unknown'?{usage:{}}:{usage:{prompt_tokens:7000}};
  return {usage:{prompt_tokens:body.messages.length>2?7000:100}};
 });
 const result=await runGlmAgent(x.input);
 assert.deepEqual(result.reason_codes,[failure==='unknown'?'glm.tokenizer-count-invalid':'recycling.fresh-context-too-large']);
 assert.equal(x.requests.filter(r=>r.path.endsWith('/tokenizer')).length,3);
 assert.equal(x.requests.filter(r=>r.path.endsWith('/chat/completions')).length,1);
});
