// Requirement-by-requirement first-task completion audit. Open questions: CLEAN-RESULT.md.
import {validateArgs} from './controls-contract.mjs';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';import {hash} from '../common.mjs';
const root=new URL('./',import.meta.url),bytes=p=>readFileSync(new URL(p,root)),read=p=>JSON.parse(bytes(p)),dir='evidence/pressure-strict-1/';
const r=read(dir+'result.json'),a=read('assessment-pressure-strict-1.json'),t=read('clean-pressure-transition.json'),freeze=read('freeze-pressure-strict-1.json');
const check=(v,m)=>{if(!v)throw Error('completion unproven: '+m);};
for(const f of freeze.sources)check(hash(bytes(f.path))===f.sha256,'source drift '+f.path);
check(r.instance_id===read('../prepared/task.json').instance_id&&r.instance_id==='sveltejs__svelte-16666','same benchmark task');
check(r.status==='patch_submitted'&&a.verified_success,'verified model patch');
check(a.observed_input_bounds_hold&&a.accounting_replay_pass&&a.projection_replay_pass&&t.measured_transition,'pressure/accounting/projection');
check(r.elapsed_ms<=1800000&&r.model_attempts<=24&&r.tokenizer_attempts<=48,'episode budgets');
check(r.receipts.every(x=>x.status===200&&x.automatic_retries===0),'clean provider receipts');
check(r.recycling.dispatches.every(d=>d.projected_upper_bound<12000&&d.output_reservation===2048),'admitted bounds');
check(r.cleanup_verified,'rollout cleanup');
const c=read(dir+r.candidate_id+'.json'),events=read(dir+'events.json'),responses=read(dir+'responses.json');
check(hash(c.patch)===r.patch_sha256&&hash(bytes(dir+'prediction.patch'))===r.patch_sha256,'exact candidate export');
check(c.files.every(f=>/^packages\/svelte\/src\/.*\.(js|ts)$/.test(f.path)&&/^[a-f0-9]{64}$/.test(f.before_sha256)&&/^[a-f0-9]{64}$/.test(f.after_sha256)),'source-only manifests');
const calls=responses.flatMap(x=>x.message.tool_calls??[]);check(calls.length===events.length,'every model tool call has event');
let schema_rejections=0;
for(let i=0;i<calls.length;i++){const call=calls[i],event=events[i],v=validateArgs(call.function.name,call.function.arguments);check(call.function.name===event.tool,'model/tool name attribution');if(v.ok){check(hash(v.value)===hash(event.arguments)&&event.result.ok===true,'valid call attribution and no execution failure');}else{schema_rejections++;check(event.arguments===null&&event.result.ok===false&&hash(v.issues)===hash(event.result.issues),'schema rejection reproduced with no tool effect');}}
const stage=events.find(e=>e.tool==='stage_patch_candidate'&&e.result.candidate_id===c.candidate_id);check(stage&&hash(stage.result.patch)===r.patch_sha256,'model staged exact final patch');
for(const f of c.files)check(events.slice(0,events.indexOf(stage)).some(e=>e.tool==='read_file'&&e.result.ok&&e.arguments.path===f.path),'inspected source before mutation');
const final=events.at(-1);check(final.tool==='submit_patch_candidate'&&final.arguments.candidate_id===c.candidate_id,'exact final submission');
const probeEvents=events.filter(e=>e.tool==='run_public_reproducer');check(probeEvents.length<=4,'probe budget');
for(const e of probeEvents)check(e.result.cleanup_verified&&['passed','failed','intended_failure'].includes(e.result.status),'no suppressed probe infrastructure failure');
const publicPass=probeEvents.find(e=>e.arguments.candidate_id===c.candidate_id&&e.result.status==='passed');check(publicPass&&publicPass.result.checks.async==='passed'&&publicPass.result.checks.sync==='passed','both public checks for exact candidate');
let componentCount=0;const componentRefs=[];
for(const name of readdirSync(new URL(dir,root)).filter(n=>n.startsWith('probe-')))for(const part of ['async','sync']){const path=dir+name+'/'+part+'/report.json',p=read(path);componentRefs.push(path);componentCount++;check(p.cleanup_verified&&p.status!=='execution_error','component infrastructure');if(p.candidate_id===c.candidate_id)check(p.modes.length===2&&p.modes.every(m=>m.passed),'four final public modes');}
const base=read('evidence/strict-preflight/report.json');check(base.status==='intended_failure'&&base.checks.async==='intended_failure'&&base.checks.sync==='passed'&&base.cleanup_verified,'fresh intended baseline');
const invocationIds=[];
for(const name of ['evaluation','reproduction']){const p=dir+name+'/',e=read(p+'report.json'),i=read(p+'invocation.json'),statuses=read(p+'status.json');check(e.resolved&&e.strict_all_expected_pass&&e.fail_to_pass_passed===67&&e.fail_to_pass_total===67&&e.pass_to_pass_passed===5120&&e.pass_to_pass_total===5120&&e.missing_expected===0&&e.failed_expected===0&&e.cleanup_verified,'full evaluator '+name);check(!Object.values(statuses).some(s=>String(s).toLowerCase()==='fail'),'no parsed failures '+name);check(i.patch_sha256===r.patch_sha256&&i.report_sha256===hash(bytes(p+'report.json'))&&i.evaluator_sha256===hash(bytes('../evaluate.py'))&&i.freeze_sha256===hash(bytes('freeze-pressure-strict-1.json')),'evaluator artifact binding '+name);invocationIds.push(i.output_directory);}
check(new Set(invocationIds).size===2,'distinct fresh evaluation directories');
const captures=read(dir+'captures.json'),first=JSON.parse(captures[0].original);check(first.messages.every(m=>m.role!=='assistant'&&m.role!=='tool'),'fresh model history');
for(const prior of ['controls-1','pressure-1'])check(!captures[0].original.includes(read('evidence/'+prior+'/result.json').patch_sha256)&&!captures[0].original.includes(bytes('evidence/'+prior+'/prediction.patch').toString()),'no prior winning artifact preloaded');
const refs=['manifest.json','freeze-pressure-strict-1.json','assessment-pressure-strict-1.json','clean-pressure-transition.json',dir+'events.json',dir+'responses.json',dir+'captures.json',dir+'result.json',dir+'prediction.patch',dir+r.candidate_id+'.json','evidence/strict-preflight/report.json',...componentRefs,...['evaluation','reproduction'].flatMap(n=>[dir+n+'/report.json',dir+n+'/invocation.json',dir+n+'/status.json'])];
const report={status:'clean-first-benchmark-verified',instance_id:r.instance_id,patch_sha256:r.patch_sha256,requirements:{task_identity:true,source_attribution:true,public_baseline_and_four_final_modes:true,measured_pressure_and_budgets:true,two_all_pass_evaluations:true,complete_trace_and_cleanup:true,no_protocol_deviation:true},schema_rejections,model_calls:r.model_attempts,tokenizer_calls:r.tokenizer_attempts,candidates:events.filter(e=>e.tool==='stage_patch_candidate').length,paired_probe_requests:probeEvents.length,component_probes:componentCount,recycles:r.recycling.recycles,artifacts:refs.map(path=>({path,sha256:hash(bytes(path))})),scope:'First Svelte development benchmark only; strict normalized scoring, not a leaderboard or broad qualification claim.',authority_effect:'none',open_questions_ref:'CLEAN-RESULT.md'};
writeFileSync(new URL('clean-closeout.json',root),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:report.status,requirements:report.requirements,model_calls:report.model_calls}));
