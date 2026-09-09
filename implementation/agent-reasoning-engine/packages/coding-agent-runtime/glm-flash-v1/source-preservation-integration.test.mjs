import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createGlmClient,MODEL,hash,stable} from './transport.mjs';
import {runGlmAgent} from './agent.mjs';
import {parseConfig} from './cli.mjs';
import {createReadOnlyToolRuntime} from '../read-only-tools.mjs';
import {snapshotTree} from '../verifier.mjs';

const tc=(id,path='a.mjs',name='read-file')=>({id,type:'function',function:{name,arguments:JSON.stringify(name==='read-file'?{path}:path)}});
const reply=(message,finish_reason='stop')=>({model:MODEL,choices:[{message:{role:'assistant',...message},finish_reason}],usage:{prompt_tokens:100,completion_tokens:20}});
async function setup(t,handler) {
 const directory=mkdtempSync(join(tmpdir(),'are-delivery-')),root=join(directory,'fixture');mkdirSync(root);
 writeFileSync(join(root,'a.mjs'),'export const a=1;\n');writeFileSync(join(root,'b.mjs'),'export const b=1;\n');
 const base=snapshotTree(root),requests=[],invoked=[];
 const candidate={schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,
  changes:[{operation:'replace-file',path:'a.mjs',expected_file_sha256:base.files['a.mjs'],utf8:'export const a=2;\n'}],authority_effect:'none'};
 const server=createServer(async(req,res)=>{
  const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=JSON.parse(Buffer.concat(chunks));requests.push({path:req.url,body});
  res.setHeader('content-type','application/json');res.end(JSON.stringify(handler({body,requests,tokenizer:req.url.endsWith('/tokenizer'),candidate})));
 });
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 t.after(async()=>{server.closeAllConnections();await new Promise(done=>server.close(done));rmSync(directory,{recursive:true,force:true});});
 const origin=`http://127.0.0.1:${server.address().port}`,clientOptions={chat_endpoint:origin+'/chat/completions',tokenizer_endpoint:origin+'/tokenizer'};
 const runtime=createReadOnlyToolRuntime({repository_root:root,observation_allowlist:['a.mjs','b.mjs']});
 const input={run_id:'delivery',request:'Change a to 2',fixture_root:root,client:createGlmClient(clientOptions),retention_policy:'recent-observations-v2',delivery_policy:'bounded-reads-v1',
  observation_allowlist:['a.mjs','b.mjs'],mutation_allowlist:['a.mjs'],verification_command:[],
  tool_runtime:{...runtime,invoke:async(name,args)=>{invoked.push({name,args});return runtime.invoke(name,args);}},
  tool_policy:{allow:['read-file','read-context-evidence','read-inspection-evidence']},
  context_recycling:{directory:join(directory,'state'),context_limit:10000,recycle_at:9000,safety_margin:1000,
   state:{objective:'Change a to 2',constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['fixture']}}};
 return {input,root,directory,requests,invoked,clientOptions};
}



function sources(body){return body.messages.filter(m=>m.role==='user').map(m=>{try{return JSON.parse(m.content);}catch{return null;}}).find(v=>v?.schema_version==='are.glm-inspected-mutation-sources/v1');}
test('exact inspected mutation bytes survive recycle and resume as bounded untrusted data',async t=>{
 let models=0,measures=0;const observed=[];
 const x=await setup(t,({tokenizer,body,candidate})=>{
  if(tokenizer){measures++;return {usage:{prompt_tokens:measures===3?8000:100}};}
  models++;assert.ok(!body.tools.some(t=>t.function.name==='read-context-evidence'));
  assert.ok(body.tools.some(t=>t.function.name==='read-inspection-evidence'));
  const pin=sources(body);observed.push(pin);
  if(models===1){assert.equal(pin,undefined);return reply({tool_calls:[tc('a')]},'tool_calls');}
  assert.equal(pin.sources.length,1);assert.equal(pin.sources[0].path,'a.mjs');assert.equal(pin.sources[0].utf8,'export const a=1;\n');
  assert.equal(pin.posture,'untrusted-source-data');
  assert.ok(Buffer.byteLength(body.messages.find(m=>m.role==='user'&&m.content.includes('are.glm-inspected-mutation-sources/v1')).content)<=4096);
  assert.ok(!body.messages[0].content.includes('export const a=1;'));
  if(models===2)return reply({tool_calls:[tc('b','b.mjs')]},'tool_calls');
  return reply({content:JSON.stringify(candidate)});
 });
 const input={...x.input,source_policy:'inspected-mutation-v1',retention_policy:'clear-v1'};
 const paused=await runGlmAgent({...input,pause_after_steps:2});assert.equal(paused.status,'PAUSED');
 assert.equal(paused.last_confirmed_source_pins[0].path,'a.mjs');
 const r=await runGlmAgent({...input,client:createGlmClient(x.clientOptions)});
 assert.equal(r.status,'AWAITING_APPROVAL',JSON.stringify(r.reason_codes));assert.equal(r.recycling.recycles,1);
 assert.equal(r.source_policy,'inspected-mutation-v1');assert.equal(observed[2].sources[0].source_call_id,'a');
 assert.deepEqual(r.history[2].source_pin_refs,r.last_confirmed_source_pins);
 assert.equal(x.invoked.length,2); // pinning made no extra reads
});
test('source policy is source-bound on resume and requires bounded delivery',async t=>{
 const x=await setup(t,({tokenizer})=>tokenizer?{usage:{prompt_tokens:100}}:reply({tool_calls:[tc('a')]},'tool_calls'));
 const input={...x.input,source_policy:'inspected-mutation-v1'};
 assert.equal((await runGlmAgent({...input,pause_after_steps:1})).status,'PAUSED');
 const drift=await runGlmAgent({...input,source_policy:'none',client:createGlmClient(x.clientOptions)});
 assert.deepEqual(drift.reason_codes,['recycling.scope-or-policy-drift']);
 assert.deepEqual((await runGlmAgent({...input,delivery_policy:'legacy-v1'})).reason_codes,['glm.source-requires-bounded-delivery']);
});
test('omission injects no source message and unchanged patch scope validation applies',async t=>{
 const x=await setup(t,({tokenizer,body,candidate})=>{
  if(tokenizer)return {usage:{prompt_tokens:100}};
  assert.equal(sources(body),undefined);candidate.changes[0].path='b.mjs';return reply({content:JSON.stringify(candidate)});
 });
 const r=await runGlmAgent(x.input);assert.equal(r.source_policy,'none');assert.deepEqual(r.reason_codes,['glm.candidate-scope-invalid']);
});
test('pinned source stays subject to full-request admission and rejected renders do not confirm pins',async t=>{
 let models=0,measures=0;
 const x=await setup(t,({tokenizer,body})=>{
  if(tokenizer){measures++;if(measures>1)assert.ok(sources(body));return {usage:{prompt_tokens:measures===1?100:9000}};}
  models++;return reply({tool_calls:[tc('a')]},'tool_calls');
 });
 const r=await runGlmAgent({...x.input,source_policy:'inspected-mutation-v1'});
 assert.deepEqual(r.reason_codes,['recycling.fresh-context-too-large']);assert.equal(models,1);assert.equal(measures,3);
 assert.deepEqual(r.last_confirmed_source_pins,[]);assert.deepEqual(r.delivery_progress.delivered_call_ids,[]);
});
test('an immediately failing resume preserves historical confirmed source references',async t=>{
 let models=0;
 const x=await setup(t,({tokenizer})=>{
  if(tokenizer)return {usage:{prompt_tokens:100}};
  models++;return models<=2?reply({tool_calls:[tc(models===1?'a':'b',models===1?'a.mjs':'b.mjs')]},'tool_calls'):{};
 });
 const input={...x.input,source_policy:'inspected-mutation-v1'};
 const paused=await runGlmAgent({...input,pause_after_steps:2});assert.equal(paused.status,'PAUSED');assert.equal(paused.last_confirmed_source_pins.length,1);
 const result=await runGlmAgent({...input,client:createGlmClient(x.clientOptions)});
 assert.equal(result.status,'BLOCK');assert.deepEqual(result.last_confirmed_source_pins,paused.last_confirmed_source_pins);
 assert.deepEqual(result.history,paused.history);
});

test('source policy rejects legacy digest recovery without invoking a tool',async t=>{
 const x=await setup(t,({tokenizer})=>tokenizer?{usage:{prompt_tokens:100}}:reply({tool_calls:[tc('raw',{digest:'f'.repeat(64)},'read-context-evidence')]},'tool_calls'));
 const r=await runGlmAgent({...x.input,source_policy:'inspected-mutation-v1'});
 assert.deepEqual(r.reason_codes,['glm.tool-denied']);assert.equal(x.invoked.length,0);
});
