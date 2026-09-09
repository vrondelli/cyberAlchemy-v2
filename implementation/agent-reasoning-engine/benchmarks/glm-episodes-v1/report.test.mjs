import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,cp} from 'node:fs/promises';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {checkedPages,reportRun,reportHash as hash} from './report.mjs';
const h='a'.repeat(64),model='glm-5.3-flash';
const save=(p,x)=>writeFile(p,JSON.stringify(x));
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const signed=body=>({...body,result_digest:hash(body)});
async function fixture(t,{incomplete=false,unstarted=false}={}){
 const dir=await mkdtemp('/tmp/episode-report-test-');t.after(()=>rm(dir,{recursive:true,force:true}));
 const task={episode_id:'fixture',request_sha256:hash('request'),fixture_tree_sha256:h,fixture_files:{'a.mjs':h},required_reads:['a.mjs'],observation_allowlist:['a.mjs'],mutation_allowlist:['a.mjs'],verification:{expected_tests:8}};
 const manifest={schema_version:'are.glm-episodes-manifest/v1',model,limits:{maximum_arms:2,maximum_model_calls:24,maximum_tokenizer_calls:48},delivery_policy:'bounded-reads-v1',context_policy:{context_limit:16384,recycle_at:8000,safety_margin:1024},sources:[{path:'runtime.mjs',sha256:h}],bridge_sources:[],arms:[],authority_effect:'none'};
 const result={schema_version:'are.glm-episodes-result/v1',status:incomplete||unstarted?'STOPPED':'COMPLETED',arms:[],arms_started:unstarted?1:2,accounting_complete:!incomplete,model_requests:incomplete||unstarted?1:2,tokenizer_requests:0,authority_effect:'none'};
 for(let index=0;index<2;index++){
  const retention_policy=index===0?'clear-v1':'recent-observations-v2',arm=join(dir,`arm-${index}`);await mkdir(arm);
  const config={model,request:'request',run_id:`run-${index}`,retention_policy,delivery_policy:'bounded-reads-v1',observation_allowlist:task.observation_allowlist,mutation_allowlist:task.mutation_allowlist,...manifest.context_policy,credential:{locator:'PRIVATE-CREDENTIAL-REFERENCE'}};
  await save(join(arm,'config.json'),config);manifest.arms.push({index,task,retention_policy,config_sha256:hash(config)});
  if(index===1&&unstarted)continue;
  await save(join(arm,'started.json'),{index,task_sha256:hash(task)});if(index===1&&incomplete)continue;
  const agent=signed({schema_version:'are.glm-agent-result/v1',run_id:config.run_id,model,status:'BLOCK',retention_policy,delivery_policy:'bounded-reads-v1',delivery_progress:{delivered_call_ids:[],meaningful_archive_delivery_call_ids:[]},authority_effect:'none',history:[],recycling:{recycles:0,dispatches:[]},reason_codes:['glm.model-request-limit'],final_response_evidence:{text:'PRIVATE-VISIBLE-CONTENT'},receipts:[{kind:'model',request_sha256:h,status:200,dispatched:true,automatic_retries:0,input_tokens:10,output_tokens:2}]});
  await save(join(arm,'agent-result.json'),agent);
  const completed={schema_version:'are.glm-episode-arm/v1',index,episode_id:task.episode_id,retention_policy,delivery_policy:'bounded-reads-v1',task_sha256:hash(task),request_sha256:task.request_sha256,fixture_tree_sha256:task.fixture_tree_sha256,agent_result_sha256:hash(agent),agent_status:'BLOCK',reasons:agent.reason_codes,model_requests:1,tokenizer_requests:0,model_usage:{input:10,output:2},verification:null,patch_correct:false,original_fixture_unchanged:true,continuity:{required_files_read:false,required_reads_on_distinct_turns:false,required_files_delivered:false,recycled:false,dispatched_after_recycle:false,archived_read_after_recycle:false,passed:false},elapsed_ms:123,authority_effect:'none'};
  await save(join(arm,'completed.json'),completed);result.arms.push(completed);
 }
 result.manifest_sha256=hash(manifest);await save(join(dir,'manifest.json'),manifest);await save(join(dir,'result.json'),result);return dir;
}
async function rewriteAgent(dir,change){const p=join(dir,'arm-0/agent-result.json'),agent=await read(p);change(agent);delete agent.result_digest;agent.result_digest=hash(agent);await save(p,agent);const c=await read(join(dir,'arm-0/completed.json'));c.agent_result_sha256=hash(agent);c.model_requests=agent.receipts.filter(r=>r.kind==='model').length;c.tokenizer_requests=agent.receipts.filter(r=>r.kind==='tokenizer').length;c.agent_status=agent.status;c.reasons=agent.reason_codes??[];c.model_usage={input:agent.receipts.every(r=>Number.isSafeInteger(r.input_tokens))?agent.receipts.reduce((n,r)=>n+r.input_tokens,0):null,output:agent.receipts.every(r=>Number.isSafeInteger(r.output_tokens))?agent.receipts.reduce((n,r)=>n+r.output_tokens,0):null};await save(join(dir,'arm-0/completed.json'),c);const result=await read(join(dir,'result.json'));result.arms[0]=c;result.model_requests=result.arms.reduce((n,r)=>n+r.model_requests,0);result.tokenizer_requests=result.arms.reduce((n,r)=>n+r.tokenizer_requests,0);await save(join(dir,'result.json'),result);}

test('valid pair reports accounting without private output, credentials or a winner',async t=>{const dir=await fixture(t),r=await reportRun(dir);assert.equal(r.planned,2);assert.equal(r.attempted,2);assert.equal(r.recorded_verified_repairs,0);assert.equal(r.totals.model_attempts,2);assert.equal(r.comparison.matched_single_pair,true);assert.equal(r.comparison.winner,null);assert(!JSON.stringify(r).includes('PRIVATE'));assert(!JSON.stringify(r).includes('history'));});
test('manifest and agent hash corruption reject',async t=>{const a=await fixture(t);const m=await read(join(a,'manifest.json'));m.model='changed';await save(join(a,'manifest.json'),m);await assert.rejects(reportRun(a),/manifest-digest/);const b=await fixture(t);const agent=await read(join(b,'arm-0/agent-result.json'));agent.status='changed';await save(join(b,'arm-0/agent-result.json'),agent);await assert.rejects(reportRun(b),/agent-digest/);});
test('missing started marker and mismatched policy cannot manufacture completion',async t=>{const a=await fixture(t);await rm(join(a,'arm-0/started.json'));await assert.rejects(reportRun(a),/started-accounting/);const b=await fixture(t);const c=await read(join(b,'arm-0/completed.json'));c.retention_policy='recent-observations-v2';await save(join(b,'arm-0/completed.json'),c);await assert.rejects(reportRun(b),/completed-result/);});
test('unknown usage stays null and endpoint failures disclose only typed metadata',async t=>{const dir=await fixture(t);await rewriteAgent(dir,a=>{delete a.receipts[0].input_tokens;delete a.receipts[0].output_tokens;a.receipts[0].status=500;a.receipts[0].provider_code='500';a.receipts[0].payload='PRIVATE-ERROR';});const r=await reportRun(dir);assert.equal(r.totals.input_tokens,null);assert.equal(r.totals.output_tokens,null);assert.equal(r.totals.model_attempts,2);assert.deepEqual(r.arms[0].metrics.endpoint_failures,[{kind:'model',status:500,provider_code:'500',dispatched:true}]);assert(!JSON.stringify(r).includes('PRIVATE'));});
test('started incomplete arm means total attempts/usage unknown, not zero',async t=>{const dir=await fixture(t,{incomplete:true}),r=await reportRun(dir);assert.equal(r.attempted,2);assert.equal(r.completed,1);assert.equal(r.unstarted,0);assert.equal(r.totals.model_attempts,null);assert.equal(r.totals.input_tokens,null);assert.equal(r.totals.known_completed_model_attempts,1);assert.equal(r.comparison.matched_single_pair,false);});
test('unstarted planned arm stays visible without inventing an attempt',async t=>{const r=await reportRun(await fixture(t,{unstarted:true}));assert.equal(r.planned,2);assert.equal(r.attempted,1);assert.equal(r.unstarted,1);assert.equal(r.totals.model_attempts,1);assert.equal(r.comparison.matched_single_pair,false);});
test('fabricated repair and total counts reject even when duplicated arm agrees',async t=>{const a=await fixture(t);const r=await read(join(a,'result.json'));r.arms[0].patch_correct=true;await save(join(a,'arm-0/completed.json'),r.arms[0]);await save(join(a,'result.json'),r);await assert.rejects(reportRun(a),/repair-verification/);const b=await fixture(t);const s=await read(join(b,'result.json'));s.model_requests=0;await save(join(b,'result.json'),s);await assert.rejects(reportRun(b),/total-model/);});
test('optional preserved real run can be copied and reported without current-source checks',{skip:!process.env.ARE_EPISODE_REPORT_RUN},async t=>{const dir=await mkdtemp('/tmp/episode-report-real-');t.after(()=>rm(dir,{recursive:true,force:true}));await cp(process.env.ARE_EPISODE_REPORT_RUN,dir,{recursive:true});const r=await reportRun(dir);assert.equal(r.provenance.manifest_verified,true);assert.equal(r.provenance.current_sources_checked,false);assert.equal(r.comparison.winner,null);});
test('call caps reject per-arm and aggregate overruns',async t=>{const a=await fixture(t);await rewriteAgent(a,agent=>{agent.receipts=Array.from({length:13},()=>({...agent.receipts[0]}));});await assert.rejects(reportRun(a),/per-arm-call-cap/);const b=await fixture(t);const m=await read(join(b,'manifest.json'));m.limits.maximum_model_calls=1;await save(join(b,'manifest.json'),m);const r=await read(join(b,'result.json'));r.manifest_sha256=hash(m);await save(join(b,'result.json'),r);await assert.rejects(reportRun(b),/aggregate-call-cap/);});
test('recorded successful independent verifier has a positive report path',async t=>{const dir=await fixture(t);const candidate={schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:h,changes:[{operation:'replace-file',path:'a.mjs',expected_file_sha256:h,utf8:'corrected'}],authority_effect:'none'};await rewriteAgent(dir,a=>{a.status='AWAITING_APPROVAL';delete a.reason_codes;a.candidate=candidate;});const c=await read(join(dir,'arm-0/completed.json'));c.patch_correct=true;c.verification=signed({schema_version:'are.patch-set-runtime-result/v1',status:'PATCH_CANDIDATE',candidate_digest:hash(candidate),before_tree_sha256:h,changed_paths:['a.mjs'],verification:{ok:true,passed:8,expected_tests:8,results:Array.from({length:8},(_,i)=>({id:String(i),passed:true}))},authority_effect:'none'});await save(join(dir,'arm-0/completed.json'),c);const r=await read(join(dir,'result.json'));r.arms[0]=c;await save(join(dir,'result.json'),r);const out=await reportRun(dir);assert.equal(out.recorded_verified_repairs,1);assert.equal(out.recorded_continuity_passes,0);assert(!JSON.stringify(out).includes('corrected'));});
test('archive defaults normalize repeated pages while delivery stays separate',async t=>{const dir=await fixture(t);await rewriteAgent(dir,a=>{a.receipts.push({...a.receipts[0]});a.history=[{calls:[{id:'one',name:'read-inspection-evidence',arguments:{call_id:'source'}}],observations:[{ok:true,output:{utf8:'slice'}}]},{calls:[{id:'two',name:'read-inspection-evidence',arguments:{call_id:'source',offset:0,max_chars:1024}}],observations:[{ok:true,output:{utf8:'slice'}}]}];a.delivery_progress={executed_read_call_ids:['one','two'],delivered_call_ids:['one'],undelivered_call_ids:['two'],meaningful_archive_delivery_call_ids:[]};});const r=await reportRun(dir),activity=r.arms[0].read_activity;assert.equal(activity.archive_pages.length,1);assert.equal(activity.repeated_successful_archive_pages,1);assert.equal(activity.delivery_counts.undelivered,1);assert.equal(r.recorded_verified_repairs,0);});
async function setCompletion(dir,policy){
 const m=await read(join(dir,'manifest.json')),result=await read(join(dir,'result.json'));m.completion_policy=policy;
 for(let i=0;i<m.arms.length;i++){
  const arm=join(dir,`arm-${i}`),config=await read(join(arm,'config.json'));config.completion_policy=policy;await save(join(arm,'config.json'),config);m.arms[i].config_sha256=hash(config);
  const a=await read(join(arm,'agent-result.json'));a.completion_policy=policy;delete a.result_digest;a.result_digest=hash(a);await save(join(arm,'agent-result.json'),a);
  const c=await read(join(arm,'completed.json'));c.completion_policy=policy;c.agent_result_sha256=hash(a);await save(join(arm,'completed.json'),c);result.arms[i]=c;
 }
 result.manifest_sha256=hash(m);await save(join(dir,'manifest.json'),m);await save(join(dir,'result.json'),result);
}
test('historical omission reports none; consistent optional completion policy remains comparable',async t=>{const dir=await fixture(t);assert((await reportRun(dir)).arms.every(a=>a.completion_policy==='none'));await setCompletion(dir,'budget-aware-v1');const r=await reportRun(dir);assert(r.arms.every(a=>a.completion_policy==='budget-aware-v1'));assert.equal(r.comparison.matched_single_pair,true);assert.equal(r.comparison.winner,null);});
test('completion policy mismatch at config, agent or completed boundary rejects',async t=>{
 for(const target of ['config','agent','completed']){
  const dir=await fixture(t);await setCompletion(dir,'budget-aware-v1');const m=await read(join(dir,'manifest.json')),r=await read(join(dir,'result.json'));
  if(target==='config'){const c=await read(join(dir,'arm-0/config.json'));c.completion_policy='none';await save(join(dir,'arm-0/config.json'),c);m.arms[0].config_sha256=hash(c);r.manifest_sha256=hash(m);await save(join(dir,'manifest.json'),m);}
  if(target==='agent'){const a=await read(join(dir,'arm-0/agent-result.json'));a.completion_policy='none';delete a.result_digest;a.result_digest=hash(a);await save(join(dir,'arm-0/agent-result.json'),a);r.arms[0].agent_result_sha256=hash(a);await save(join(dir,'arm-0/completed.json'),r.arms[0]);}
  if(target==='completed'){r.arms[0].completion_policy='none';await save(join(dir,'arm-0/completed.json'),r.arms[0]);}
  await save(join(dir,'result.json'),r);await assert.rejects(reportRun(dir),new RegExp(`${target}-completion`));
 }
});
test('unknown completion policy and missing bounded delivery reject',async t=>{for(const policy of ['unsupported',null]){const a=await fixture(t);await setCompletion(a,policy);await assert.rejects(reportRun(a),/completion-policy-invalid/);}const b=await fixture(t);await setCompletion(b,'budget-aware-v1');const m=await read(join(b,'manifest.json'));m.delivery_policy='legacy-v1';await save(join(b,'manifest.json'),m);const r=await read(join(b,'result.json'));r.manifest_sha256=hash(m);await save(join(b,'result.json'),r);await assert.rejects(reportRun(b),/completion-delivery-required/);});
async function setSourcePolicy(dir,policy){
 const m=await read(join(dir,'manifest.json')),result=await read(join(dir,'result.json'));m.source_policy=policy;
 for(let i=0;i<m.arms.length;i++){
  const arm=join(dir,`arm-${i}`),config=await read(join(arm,'config.json'));config.source_policy=policy;await save(join(arm,'config.json'),config);m.arms[i].config_sha256=hash(config);
  const a=await read(join(arm,'agent-result.json'));a.source_policy=policy;delete a.result_digest;a.result_digest=hash(a);await save(join(arm,'agent-result.json'),a);
  const c=await read(join(arm,'completed.json'));c.source_policy=policy;c.agent_result_sha256=hash(a);await save(join(arm,'completed.json'),c);result.arms[i]=c;
 }
 result.manifest_sha256=hash(m);await save(join(dir,'manifest.json'),m);await save(join(dir,'result.json'),result);
}
test('historical source omission is none; matched new source policy is exposed',async t=>{const dir=await fixture(t);assert((await reportRun(dir)).arms.every(a=>a.source_policy==='none'));await setSourcePolicy(dir,'inspected-mutation-v1');const r=await reportRun(dir);assert(r.arms.every(a=>a.source_policy==='inspected-mutation-v1'));assert.equal(r.comparison.matched_single_pair,true);assert.equal(r.comparison.winner,null);});
test('source policy mismatches reject at config, agent and completed boundaries',async t=>{
 for(const target of ['config','agent','completed']){
  const dir=await fixture(t);await setSourcePolicy(dir,'inspected-mutation-v1');const m=await read(join(dir,'manifest.json')),r=await read(join(dir,'result.json'));
  if(target==='config'){const c=await read(join(dir,'arm-0/config.json'));c.source_policy='none';await save(join(dir,'arm-0/config.json'),c);m.arms[0].config_sha256=hash(c);r.manifest_sha256=hash(m);await save(join(dir,'manifest.json'),m);}
  if(target==='agent'){const a=await read(join(dir,'arm-0/agent-result.json'));a.source_policy='none';delete a.result_digest;a.result_digest=hash(a);await save(join(dir,'arm-0/agent-result.json'),a);r.arms[0].agent_result_sha256=hash(a);await save(join(dir,'arm-0/completed.json'),r.arms[0]);}
  if(target==='completed'){r.arms[0].source_policy='none';await save(join(dir,'arm-0/completed.json'),r.arms[0]);}
  await save(join(dir,'result.json'),r);await assert.rejects(reportRun(dir),new RegExp(`${target}-source-policy`));
 }
});
test('invalid source policies and missing bounded delivery reject',async t=>{for(const policy of ['unsupported',null]){const dir=await fixture(t);await setSourcePolicy(dir,policy);await assert.rejects(reportRun(dir),/source-policy-invalid/);}const dir=await fixture(t);await setSourcePolicy(dir,'inspected-mutation-v1');const m=await read(join(dir,'manifest.json'));m.delivery_policy='legacy-v1';await save(join(dir,'manifest.json'),m);const r=await read(join(dir,'result.json'));r.manifest_sha256=hash(m);await save(join(dir,'result.json'),r);await assert.rejects(reportRun(dir),/source-delivery-required/);});


test('execution completion policy is accepted only with consistent recorded bindings',async t=>{
 const dir=await fixture(t);await setCompletion(dir,'bounded-execution-v2');
 const r=await reportRun(dir);assert(r.arms.every(a=>a.completion_policy==='bounded-execution-v2'));
 assert.equal(r.comparison.matched_single_pair,true);
});

test('v3 execution completion policy is accepted only with consistent recorded bindings',async t=>{
 const dir=await fixture(t);await setCompletion(dir,'explicit-finalization-v3');
 const r=await reportRun(dir);assert(r.arms.every(a=>a.completion_policy==='explicit-finalization-v3'));
 assert.equal(r.comparison.matched_single_pair,true);
});


for(const soft of [10000,12000])test(`report verifies ${soft} context binding`,async t=>{
 const dir=await fixture(t),m=await read(join(dir,'manifest.json')),r=await read(join(dir,'result.json'));
 m.context_policy.recycle_at=soft;
 for(const planned of m.arms){const c=await read(join(dir,`arm-${planned.index}/config.json`));c.recycle_at=soft;await save(join(dir,`arm-${planned.index}/config.json`),c);planned.config_sha256=hash(c);}
 await save(join(dir,'manifest.json'),m);r.manifest_sha256=hash(m);await save(join(dir,'result.json'),r);
 assert.equal((await reportRun(dir)).context_policy.recycle_at,soft);
 const c=await read(join(dir,'arm-0/config.json'));c.recycle_at=8000;await save(join(dir,'arm-0/config.json'),c);m.arms[0].config_sha256=hash(c);await save(join(dir,'manifest.json'),m);r.manifest_sha256=hash(m);await save(join(dir,'result.json'),r);
 await assert.rejects(reportRun(dir),/config-context-policy/);
});

test('v4 execution completion policy is accepted only with consistent recorded bindings',async t=>{
 const dir=await fixture(t);await setCompletion(dir,'patch-contract-v4');
 const r=await reportRun(dir);assert(r.arms.every(a=>a.completion_policy==='patch-contract-v4'));
 assert.equal(r.comparison.matched_single_pair,true);
});

test('v5 execution completion policy is accepted only with consistent recorded bindings',async t=>{
 const dir=await fixture(t);await setCompletion(dir,'compact-contract-v5');
 const r=await reportRun(dir);assert(r.arms.every(a=>a.completion_policy==='compact-contract-v5'));
 assert.equal(r.comparison.matched_single_pair,true);
});

test('v6 execution completion policy is accepted only with consistent recorded bindings',async t=>{
 const dir=await fixture(t);await setCompletion(dir,'deduplicated-state-v6');
 const r=await reportRun(dir);assert(r.arms.every(a=>a.completion_policy==='deduplicated-state-v6'));
 assert.equal(r.comparison.matched_single_pair,true);
});

test('v7 execution completion policy is accepted only with consistent recorded bindings',async t=>{
 const dir=await fixture(t);await setCompletion(dir,'reserved-headroom-v7');
 const r=await reportRun(dir);assert(r.arms.every(a=>a.completion_policy==='reserved-headroom-v7'));
 assert.equal(r.comparison.matched_single_pair,true);
});


test('independent page report rejects missing coverage, native mismatch and rehashed forged content',()=>{
 const text='a'.repeat(5000)+'b'.repeat(3000),files={'a.mjs':hash(text)};
 const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
 const make=(offset,id)=>{const utf8=text.slice(offset,offset+5000),args={path:'a.mjs',offset},output={path:'a.mjs',sha256:hash(text),paged:true,offset_unit:'utf16-code-units',offset,next_offset:offset+utf8.length,total_chars:text.length,eof:offset+utf8.length===text.length,utf8,page_sha256:hash(utf8)},obs={ok:true,output};return {calls:[{id,name:'read-file',arguments:args}],observations:[obs],messages:[{role:'assistant',tool_calls:[{id,function:{name:'read-file',arguments:JSON.stringify(args)}}]},{role:'tool',tool_call_id:id,content:stable(obs)}]};};
 const a=make(0,'a'),b=make(5000,'b');
 assert.equal(checkedPages([a,b],files,new Set(['a','b']))[0].delivered,true);
 assert.equal(checkedPages([a,b],files,new Set(['a']))[0].delivered,false);
 assert.equal(checkedPages([b],files,new Set(['b']))[0].read,false);
 const bad=structuredClone(b);bad.observations[0].output.utf8='z'.repeat(3000);bad.observations[0].output.page_sha256=hash('z'.repeat(3000));bad.messages[1].content=stable(bad.observations[0]);
 assert.throws(()=>checkedPages([a,bad],files,new Set(['a','b'])),/page-file-hash/);
 b.messages[1].content='{}';assert.throws(()=>checkedPages([a,b],files,new Set()),/page-native/);
});

test('report binds explicit model deadline across manifest config and receipts',async t=>{
 const dir=await fixture(t),m=await read(join(dir,'manifest.json')),r=await read(join(dir,'result.json'));
 m.model_timeout_ms=60000;
 for(let i=0;i<2;i++){
  const d=join(dir,`arm-${i}`),c=await read(join(d,'config.json'));c.model_timeout_ms=60000;
  await save(join(d,'config.json'),c);m.arms[i].config_sha256=hash(c);
  const a=await read(join(d,'agent-result.json'));a.receipts[0].timeout_ms=60000;delete a.result_digest;a.result_digest=hash(a);await save(join(d,'agent-result.json'),a);
  r.arms[i].agent_result_sha256=hash(a);await save(join(d,'completed.json'),r.arms[i]);
 }
 r.manifest_sha256=hash(m);await save(join(dir,'manifest.json'),m);await save(join(dir,'result.json'),r);
 assert.equal((await reportRun(dir)).model_timeout_ms,60000);
 await rewriteAgent(dir,a=>{a.receipts[0].timeout_ms=30000;});
 await assert.rejects(reportRun(dir),/model-timeout-receipt/);
 await rewriteAgent(dir,a=>{a.receipts[0].timeout_ms=60000;});
 m.model_timeout_ms=30000;r.manifest_sha256=hash(m);r.arms[0]=await read(join(dir,'arm-0/completed.json'));
 await save(join(dir,'manifest.json'),m);await save(join(dir,'result.json'),r);
 await assert.rejects(reportRun(dir),/config-model-timeout/);
});

test('recovery report counts every attempt and rejects changed retry bytes or false categories',async t=>{
 const dir=await fixture(t),m=await read(join(dir,'manifest.json')),r=await read(join(dir,'result.json'));m.maximum_model_retries=2;
 for(let i=0;i<2;i++){
  const d=join(dir,`arm-${i}`),c=await read(join(d,'config.json'));c.maximum_model_retries=2;await save(join(d,'config.json'),c);m.arms[i].config_sha256=hash(c);
  const a=await read(join(d,'agent-result.json'));a.automatic_retry_permitted=true;
  Object.assign(a.receipts[0],{model_request_sequence:1,attempt_index:i===0?1:0,automatic_retries:i===0?1:0});
  if(i===0)a.receipts.unshift({kind:'model',model_request_sequence:1,attempt_index:0,automatic_retries:0,request_sha256:h,dispatched:true,status:null,failure_code:'deadline-exceeded',retryable:true});
  delete a.result_digest;a.result_digest=hash(a);await save(join(d,'agent-result.json'),a);
  Object.assign(r.arms[i],{agent_result_sha256:hash(a),model_requests:a.receipts.length,automatic_retries:i===0?1:0,model_usage:i===0?{input:null,output:null}:{input:10,output:2}});
  await save(join(d,'completed.json'),r.arms[i]);
 }
 r.manifest_sha256=hash(m);r.model_requests=3;r.automatic_retries=1;await save(join(dir,'manifest.json'),m);await save(join(dir,'result.json'),r);
 const checked=await reportRun(dir);assert.equal(checked.totals.model_attempts,3);assert.equal(checked.totals.input_tokens,null);assert.equal(checked.maximum_model_retries,2);
 await rewriteAgent(dir,a=>{a.receipts[1].request_sha256='b'.repeat(64);});await assert.rejects(reportRun(dir),/retry-binding/);
 await rewriteAgent(dir,a=>{a.receipts[1].request_sha256=h;a.receipts[0].failure_code='authentication-or-permission';});await assert.rejects(reportRun(dir),/retry-category/);
});
