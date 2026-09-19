// Prospective native research records and exact sources. No model generation. Open questions: LIVE-PROTOCOL.md.
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {resolve,join,relative,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createResearchHypothesis,createResearchExperiment,verifyResearchContinuity,verifyEvolutionRecord} from '../../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
export const dir=dirname(fileURLToPath(import.meta.url)),root=resolve(dir,'../../../../../../..'),prefix=relative(root,dir);
export const read=p=>JSON.parse(readFileSync(p,'utf8'));
export const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
export const save=(p,x)=>writeFileSync(p,JSON.stringify(x,null,2)+'\n',{flag:'wx',mode:0o600});
export const bind=p=>({path:relative(root,p),sha256:sha(p)});
export function verifyBindings(bs){for(const b of bs)assert.equal(sha(resolve(root,b.path)),b.sha256,b.path);}
export function verifyFreeze({review=true}={}){
 const f=read(join(dir,'live-freeze.json'));verifyBindings(f.bindings);
 const binding=read(join(dir,'live-continuity.json')),hypotheses=read(join(dir,'live-hypotheses.json')),policy=read(resolve(root,binding.policy_ref));assert.ok(verifyResearchContinuity({binding,hypotheses,policy,phase:'freeze',root}).ok);
 if(review){const r=read(join(dir,'LIVE-REVIEW.json'));assert.equal(r.approved,true);assert.equal(r.freeze_sha256,sha(join(dir,'live-freeze.json')));}
 return f;
}
export function freeze(){
 const config=read(join(dir,'live-config.json')),pre=read(join(dir,'preflight/RESULTS.json'));assert.equal(pre.admitted,true);assert.equal(pre.model_calls,0);assert.equal(pre.rows.length,8);assert.equal(pre.config_sha256,sha(join(dir,'live-config.json')));verifyBindings(pre.source_bindings);
 assert.deepEqual(pre.rows.map(r=>r.task_id+':'+r.arm).sort(),config.tasks.flatMap(t=>['control','treatment'].map(a=>t.id+':'+a)).sort());
 assert.ok(pre.rows.every(r=>r.model_calls===0&&r.admission.request_reservation<=8000&&r.admission.reason==='token-budget.preflight-disabled'));
 const prior=read(join(dir,'../../continuity.json')),policy=read(resolve(root,prior.policy_ref));
 const hypothesisTemplate={research_question:'Does recoverable recent history and bounded public-task discovery improve complete native ContextBench quality with at least15% full-trajectory token reduction?',baseline_ref:'compact-successor-terminal-review',treatment_ref:'task-discovery-retention-v1',dataset_refs:[prefix+'/live-config.json'],required_repetitions:1,success_criteria:{all_eight_assigned_valid:true,treatment_native_span_and_file_metrics_each_task:1,minimum_total_token_reduction:0.15,maximum_request_tokens:8000,unknown_usage:0,maximum_study_model_tokens:768000,untouched_confirmation_required:true,campaign_goal_achieved:false},stop_conditions:['No automatic retry or replacement','Health/capacity/unknown/persistence stops new model work','Fixed full denominator','Gold only in evaluator after all generation sealed','Host/output storage guard and source slots']};
 const records=[false,true].map(isNull=>createResearchHypothesis({hypothesis_key:'contextbench-discovery-v1-'+(isNull?'H0':'H1'),statement:isNull?'Recovery overhead, lost comparison context or extra discovery prevents15% savings or harms native quality.':'Recent complete exchanges, recoverable historical source and bounded discovery improve native selection with at least15% fewer full-trajectory tokens.',mechanism:'Project two recent complete exchanges plus pending first delivery; receipt-bound recovery pages; first recycle then four no-new-body cycles reminder, maximum three. Both arms share compact schemas and terminal review.',falsifier:isNull?'Replicated native quality and completion with full accounting,15% savings and untouched confirmation.':'Incomplete outcomes, lower quality, less than15% savings, unknown usage or failed admission.',scope:'GLM-5.3-flash 8K exact8000 development comparison; no full benchmark perfection claim.',metrics:['native-span-f1','native-file-f1','valid-completed-export','cumulative-model-input-plus-output','unknown-usage','request-admission'],provenance_refs:[prefix+'/live-continuity.json',prefix+'/LIVE-PROTOCOL.md',prefix+'/INTEGRATION-REVIEW.json',prior.binding_ref],continuity_contract:policy.required_hypothesis_continuity_values,experiment_template:hypothesisTemplate}));
 const hypotheses={records,selection:{selected:records[0].record_id,alternatives:[records[1].record_id]},authority_effect:'none'};
 const experiment=createResearchExperiment({...hypothesisTemplate,hypothesis_ref:records[0].record_id,metrics:records[0].metrics});assert.ok([...records,experiment].every(r=>verifyEvolutionRecord(r).ok));
 save(join(dir,'live-hypotheses.json'),hypotheses);save(join(dir,'live-experiment.json'),experiment);
 const manifest={id:config.experiment_id,token_budget:768000,worker_limits:{contextbench:2},jobs:config.tasks.map(t=>({id:t.id,benchmark:'contextbench',depends_on:[],reservation_tokens:192000,task_id:t.id,repetition:1}))};save(join(dir,'live-manifest.json'),manifest);
 const binding={...prior,binding_ref:prefix+'/live-continuity.json',objective_contribution:'Test reusable history recovery/discovery for the remaining ContextBench quality and15% gap; preserve full GLM/LongMemEval and untouched confirmation objectives.',question_and_hypotheses:{question:experiment.research_question,records_ref:prefix+'/live-hypotheses.json',...hypotheses.selection},experiment_and_task_refs:{plan_ref:prefix+'/LIVE-PROTOCOL.md',tasks:['integration','tokenizer-preflight','freeze','generation-two-workers','native-score','complete-report','independent-review'],unresolved:''},acceptance_and_scope:{...prior.acceptance_and_scope,pilot_protocol:prefix+'/LIVE-PROTOCOL.md'},continuity_review:{reviewer:'coordinator prospective protocol review plus exact independent LIVE-REVIEW before dispatch',reviewed_artifacts:[bind(join(dir,'LIVE-PROTOCOL.md')),bind(join(dir,'live-hypotheses.json'))],criterion_verdicts:Object.fromEntries(policy.required_review_criteria.map(k=>[k,'Preserve canonical objectives, initial GLM8K goal, native method and predecessor failures; exact four paired tasks, all-token accounting, no gold in generation and no campaign claim.'])),passed_for_candidate_plan:true,run_ready:true}};
 const validation=verifyResearchContinuity({binding,hypotheses,policy,phase:'freeze',root});assert.ok(validation.ok,JSON.stringify(validation));save(join(dir,'live-continuity.json'),binding);save(join(dir,'live-continuity-validation.json'),validation);
 const inherited=read(join(dir,'../../../dual-benchmark-8k-v1/freeze.json')).bindings;
 const paths=new Set(inherited.map(b=>resolve(root,b.path)));verifyBindings(inherited);
 for(const entry of readdirSync(dir))if(entry.endsWith('.mjs')||entry.endsWith('.md')||['LIVE-PROTOCOL.md','live-config.json','live-manifest.json','live-hypotheses.json','live-experiment.json','live-continuity.json','live-continuity-validation.json','INTEGRATION-REVIEW.json','INTEGRATION-REVIEW.md','TEST-RESULTS.json','LIVE-TEST-RESULTS.json'].includes(entry))paths.add(join(dir,entry));
 for(const p of ['preflight/RESULTS.json','../../scheduler.mjs','../../source-slots.mjs'])paths.add(resolve(dir,p));paths.add(resolve(root,prior.policy_ref));
 // Bind the static local module closure, including helper transitive imports.
 const entries=[...paths].filter(p=>p.endsWith('.mjs')&&!p.endsWith('.test.mjs'));
 const parser=`import {SourceTextModule} from 'node:vm';import {readFileSync} from 'node:fs';import {resolve,dirname} from 'node:path';const pending=JSON.parse(readFileSync(0,'utf8')),seen=new Set(),files=new Set();while(pending.length){const p=pending.pop();if(seen.has(p))continue;seen.add(p);const m=new SourceTextModule(readFileSync(p,'utf8'));for(const spec of m.dependencySpecifiers){if(!spec.startsWith('.'))continue;const child=resolve(dirname(p),spec);files.add(child);if(child.endsWith('.mjs'))pending.push(child);}}process.stdout.write(JSON.stringify([...files]));`;
 for(const p of JSON.parse(execFileSync(process.execPath,['--experimental-vm-modules','--input-type=module','-e',parser],{input:JSON.stringify(entries),encoding:'utf8',stdio:['pipe','pipe','pipe']})))paths.add(p);
 for(const b of pre.source_bindings)paths.add(resolve(root,b.path));
 save(join(dir,'live-freeze.json'),{created_at:new Date().toISOString(),bindings:[...paths].sort().map(bind),workers:2,fixed_pairs:4,assigned_trajectories:8,maximum_model_tokens:768000,authority_effect:'none',campaign_goal_achieved:false});
 console.log(JSON.stringify({frozen:true,bindings:paths.size,assigned:8,budget:768000,independent_review_required:true}));
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){if(process.argv[2]==='freeze')freeze();else if(process.argv[2]==='verify'){verifyFreeze();console.log('verified');}else throw Error('freeze | verify');}
