import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {createComparisonGenerationProcess} from './schema-agreement-generation-process-r1.mjs';
import {buildSchemaAgreementSchedule as buildComparisonSchedule} from './schema-agreement-schedule-r1.mjs';import {launchComparison,recoverComparisonCosts} from './schema-agreement-launcher-r1.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex'),cohort_path=fileURLToPath(new URL('./RECOVERY-TRAJECTORY-COHORT-R1.json',import.meta.url));
const sources={cohort_path,cohort_sha256:hash(readFileSync(cohort_path)),config_path:fileURLToPath(new URL('./discovery-v1/live-config.json',import.meta.url))};
function fixture(t){
 const root=mkdtempSync(join(tmpdir(),'comparison-launch-'));t.after(()=>rmSync(root,{recursive:true,force:true}));const paths=Object.fromEntries(['outcome_root','runs_root','metadata_root','score_root','supervision_root'].map(k=>{const p=join(root,k);mkdirSync(p);return [k,p];}));
 const {score_root,supervision_root,...generation}=paths,request={...generation,source_root:join(root,'sources'),schedule:buildComparisonSchedule(sources),sources,binding:{}};
 const calls=[],settlement={local_settled:true,process_group_absent:true,exit_code:0,forced:false,remote_completion_claimed:false};let terminal;
 const deps={host_guard:()=>({admitted:true}),process_adapter:{generate:async({request:r})=>{calls.push('generate');assert.ok(Object.isFrozen(r.schedule));const manifest={outcome_seal_sha256:'a'.repeat(64)},body={manifest_sha256:hash(stable(manifest)),terminal_status:'settled'};writeFileSync(join(r.metadata_root,'EVIDENCE-MANIFEST.json'),stable(manifest));writeFileSync(join(r.metadata_root,'RESULTS.json'),stable(body));terminal={...body,result_file_sha256:hash(stable(body))};return terminal;},settle:async args=>{calls.push('settle');assert.deepEqual(args.terminal,terminal);return {...settlement};}},score:async a=>{calls.push('score');assert.ok(calls.indexOf('settle')<calls.indexOf('score'));await a.verify_settlement({schedule_sha256:request.schedule.schedule_sha256,manifest_sha256:terminal.manifest_sha256});await a.admit_score({output:score_root,growth_reservation_bytes:33554432});return {development_target_passed:false,assigned_outcomes:4};}};
 return {args:{request,score_root,supervision_root,qualify:async()=>({admitted:true})},deps,calls,settlement};
}
test('launcher binds saved metadata and settlement before scoring and persists final report',async t=>{
 const f=fixture(t),r=await launchComparison(f.args,f.deps);assert.equal(r.status,'scored');assert.equal(r.assigned_outcomes,4);assert.equal(r.benchmark_cleared,false);assert.deepEqual(JSON.parse(readFileSync(join(f.args.supervision_root,'RESULTS.json'))),r);assert.deepEqual(f.calls,['generate','settle','score','settle']);
});
test('qualification denial never starts child or charges tokens',async t=>{
 const f=fixture(t);f.args.qualify=async()=>({admitted:false});const r=await launchComparison(f.args,f.deps);assert.deepEqual(f.calls,[]);assert.equal(r.recovery.conservative_total_tokens,0);assert.equal(r.recovery.rows.length,4);
});
test('unknown terminal still settles and reserves all four outcomes',async t=>{
 const f=fixture(t);f.deps.process_adapter.generate=async()=>{f.calls.push('generate');throw Error('lost terminal');};f.deps.process_adapter.settle=async({terminal})=>{f.calls.push('settle');assert.equal(terminal,null);return {...f.settlement,exit_code:3};};
 const r=await launchComparison(f.args,f.deps);assert.deepEqual(f.calls,['generate','settle']);assert.equal(r.recovery.conservative_total_tokens,384000);assert.equal(r.recovery.accounting_complete,false);assert.equal(r.score_summary,null);
});
test('forced process settlement and substituted metadata deny evaluator access',async t=>{
 for(const mode of ['forced','drift']){const f=fixture(t);if(mode==='forced')f.settlement.forced=true;else{const generate=f.deps.process_adapter.generate;f.deps.process_adapter.generate=async a=>{const r=await generate(a);writeFileSync(join(a.request.metadata_root,'RESULTS.json'),'{}');return r;};}const r=await launchComparison(f.args,f.deps);assert.equal(r.status,'incomplete');assert.ok(!f.calls.includes('score'));assert.equal(r.recovery.conservative_total_tokens,384000);}
});
test('deadline aborts child and invokes settlement even with no terminal',async t=>{
 const f=fixture(t);f.args.deadline_ms=15;f.deps.process_adapter.generate=({signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true}));f.deps.process_adapter.settle=async()=>{f.calls.push('settle');return {...f.settlement,exit_code:null,forced:true};};
 const r=await launchComparison(f.args,f.deps);assert.equal(r.abort_reason,'generation-deadline');assert.deepEqual(f.calls,['settle']);assert.equal(r.status,'incomplete');
});
test('post-generation persistence failure cannot skip settlement',async t=>{
 const f=fixture(t),generate=f.deps.process_adapter.generate;f.deps.process_adapter.generate=async a=>{const r=await generate(a);writeFileSync(join(f.args.supervision_root,'GENERATION-TERMINAL.json'),'already exists');return r;};const r=await launchComparison(f.args,f.deps);assert.ok(f.calls.includes('settle'));assert.ok(!f.calls.includes('score'));assert.equal(r.status,'incomplete');
});
test('failure recovery retains maximum known witness without summing duplicate receipts',t=>{
 const f=fixture(t),request=f.args.request,slot=request.schedule.slots[0],receipt={kind:'model',dispatched:true,status:200,input_tokens:100,output_tokens:20};
 mkdirSync(join(request.outcome_root,'outcomes'));writeFileSync(join(request.outcome_root,'outcomes','00.json'),stable({...slot,status:'returned',attempted:true,result:{receipts:[receipt],index_tokenizer_receipts:[]}}));
 const state=join(request.runs_root,'00','state');mkdirSync(state,{recursive:true});const ledger={receipts:[receipt,receipt]};writeFileSync(join(state,'glm-transport-ledger.json'),stable({...ledger,ledger_digest:hash(stable(ledger))}));
 const r=recoverComparisonCosts({...request,generation_attempted:true,local_settled:true});assert.equal(r.known_token_lower_bound,240);assert.equal(r.conservative_total_tokens,384000);assert.equal(r.rows[0].witnesses.length,2);assert.equal(r.accepted_savings,null);
});
test('returned paid failure survives even when no outcome file exists',async t=>{
 const f=fixture(t),slot=f.args.request.schedule.slots[0],terminal={terminal:{outcomes:[{...slot,status:'failed',attempted:true,result:{receipts:[{kind:'model',dispatched:true,status:200,input_tokens:200,output_tokens:10}],index_tokenizer_receipts:[]}}]}};
 f.deps.process_adapter.generate=async()=>{throw Object.assign(Error('outcome persistence failed'),{result:terminal});};f.deps.process_adapter.settle=async()=>({...f.settlement,exit_code:2});
 const r=await launchComparison(f.args,f.deps);assert.equal(r.recovery.known_token_lower_bound,210);assert.equal(r.recovery.conservative_total_tokens,384000);assert.equal(r.recovery.rows[0].witnesses[0].kind,'returned-outcome');
});

test('actual generation child closes before launcher invokes scoring',async t=>{
 const f=fixture(t),worker=join(f.args.supervision_root,'..','worker.mjs');
 writeFileSync(worker,`import {writeFileSync} from 'node:fs';import {join} from 'node:path';import {createHash} from 'node:crypto';let input='';for await(const c of process.stdin)input+=c;const r=JSON.parse(input).config;const hash=x=>createHash('sha256').update(x).digest('hex');const manifest=JSON.stringify({outcome_seal_sha256:'a'.repeat(64)}),body=JSON.stringify({manifest_sha256:hash(manifest),terminal_status:'settled'});writeFileSync(join(r.metadata_root,'EVIDENCE-MANIFEST.json'),manifest);writeFileSync(join(r.metadata_root,'RESULTS.json'),body);process.stdout.write(JSON.stringify({terminal:{...JSON.parse(body),result_file_sha256:hash(body)},error:null}),()=>process.exit(0));`);
 f.deps.process_adapter=createComparisonGenerationProcess({worker});f.deps.score=async a=>{assert.equal(await a.verify_settlement({schedule_sha256:f.args.request.schedule.schedule_sha256,manifest_sha256:a.expected_manifest_sha256}),true);return {development_target_passed:false};};
 const r=await launchComparison(f.args,f.deps);assert.equal(r.status,'scored');assert.equal(r.settlement.process_group_absent,true);assert.equal(r.settlement.exit_code,0);assert.throws(()=>process.kill(r.settlement.child_pid,0),{code:'ESRCH'});
});

test('overflowing receipt preserves exact positive evidence and all four rows',t=>{
 const f=fixture(t),slot=f.args.request.schedule.slots[0],terminal={terminal:{outcomes:[{...slot,status:'failed',attempted:true,result:{receipts:[{kind:'model',dispatched:true,status:200,input_tokens:Number.MAX_SAFE_INTEGER,output_tokens:20}],index_tokenizer_receipts:[]}}]}};
 const r=recoverComparisonCosts({...f.args.request,generation_attempted:true,local_settled:true,terminal});assert.equal(r.rows.length,4);assert.equal(r.known_token_lower_bound,null);assert.equal(r.known_token_lower_bound_exact,(BigInt(Number.MAX_SAFE_INTEGER)+20n).toString());assert.equal(r.numeric_totals_representable,false);
});
test('aggregate overflow still writes complete launcher failure report',async t=>{
 const f=fixture(t),terminal={reconciliation:{rows:f.args.request.schedule.slots.map(s=>({slot_id:s.slot_id,task_id:s.task_id,arm:s.arm,raw_accounting:{known_token_lower_bound:Number.MAX_SAFE_INTEGER}}))}};
 f.deps.process_adapter.generate=async()=>{throw Object.assign(Error('corrupt accounting'),{result:terminal});};f.deps.process_adapter.settle=async()=>({...f.settlement,exit_code:2});
 const r=await launchComparison(f.args,f.deps);assert.equal(r.recovery.rows.length,4);assert.equal(r.recovery.known_token_lower_bound,null);assert.equal(r.recovery.known_token_lower_bound_exact,(4n*BigInt(Number.MAX_SAFE_INTEGER)).toString());assert.equal(r.development_target_passed,false);assert.deepEqual(JSON.parse(readFileSync(join(f.args.supervision_root,'RESULTS.json'))),r);
});
