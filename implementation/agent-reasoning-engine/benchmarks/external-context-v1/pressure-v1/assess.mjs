// Post-run replay audit; not a pre-registered statistical evaluator. Open questions: PLAN.md.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {hash} from '../common.mjs';
import {stable} from '../../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
import {projectPrompt} from '../../glm-episodes-v1/analysis/provider-study-v1/payload-js-v1/projection.mjs';
import {createHypothesisObservation,createLearningDecision,verifyEvolutionRecord} from '../../../packages/evolution-runtime/index.mjs';
const root=new URL('./',import.meta.url),read=p=>JSON.parse(readFileSync(new URL(p,root))),save=(p,v)=>writeFileSync(new URL(p,root),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
for(const f of read('freeze.json').sources)if(hash(readFileSync(new URL(f.path,root)))!==f.sha256)throw Error('frozen source drift');
const result=read('evidence/live/result.json'),captures=read('evidence/live/captures.json'),events=read('evidence/live/events.json'),recovery=read('evidence/live/recovery.json');
const anchors=new Map();let projected=0;
for(const c of captures){
 const expected=projectPrompt(c.original);if(expected.prompt!==c.prompt)throw Error('projection mismatch');projected+=expected.receipts.filter(x=>x.projected).length;
 if(c.generation>0){const notices=JSON.parse(c.original).messages.filter(m=>m.role==='user').flatMap(m=>{try{const v=JSON.parse(m.content);return v.recovery?[v]:[];}catch{return []}});const n=notices.at(-1);if(!n||n.generation!==c.generation)throw Error('missing recovery notice');if(anchors.has(c.generation)&&anchors.get(c.generation)!==n.recovery.digest)throw Error('unstable generation handle');anchors.set(c.generation,n.recovery.digest);}
}
for(const r of result.receipts.filter(r=>r.kind==='model')){
 const matched=captures.filter(c=>hash(stable({...JSON.parse(c.prompt),model:'glm-5.3-flash',stream:false,max_tokens:2048,thinking:{type:'enabled',clear_thinking:false},reasoning_effort:'low'}))===r.request_sha256);if(matched.length!==1)throw Error('dispatch capture mismatch');
}
if(result.model_attempts>12||result.tokenizer_attempts>24||result.receipts.some(r=>r.automatic_retries!==0)||!result.cleanup_verified)throw Error('budget or cleanup violation');
if(result.recycling.dispatches.some(r=>r.projected_upper_bound>=12000))throw Error('context admission violation');
const pages=events.filter(e=>e.tool==='read_archive'&&e.result.ok&&e.result.output.text.length),keys=pages.map(e=>e.result.output.digest+':'+e.result.output.offset);
if(new Set(keys).size!==keys.length)throw Error('duplicate page delivered');
const firstRecovery=captures.find(c=>c.generation>0)?.step??null;
const sourceReads=events.filter(e=>e.tool==='read_file'&&e.result.ok),after=sourceReads.filter(e=>firstRecovery!==null&&e.step>=firstRecovery);
const evaluation=existsSync(new URL('evidence/evaluation/report.json',root))?read('evidence/evaluation/report.json'):null;
if(evaluation&&!evaluation.cleanup_verified)throw Error('evaluator cleanup');
const pressure=result.pressure;
if(pressure?.exercised&&(!anchors.size||!result.recycling.recycles))throw Error('pressure audit mismatch');
const assessment={pressure,instance_id:result.instance_id,partition:'development-only',status:result.status,terminal_reason:result.error??null,model_attempts:result.model_attempts,tokenizer_attempts:result.tokenizer_attempts,all_provider_requests_successful:result.receipts.every(r=>r.status===200),recycles:result.recycling.recycles,recovery_exercised:anchors.size>0,handles_per_generation:[...anchors].map(([generation,digest])=>({generation,digest,handle_count:1})),archive_requests:events.filter(e=>e.tool==='read_archive').length,delivered_pages:pages.length,duplicate_pages_delivered:0,cursor_progress:recovery.recovery?.next_offset??null,rejected_archive_requests:recovery.reads.filter(r=>!r.accepted).length,successful_source_reads:sourceReads.length,source_reads_after_recovery:after.length,source_rereads_after_recovery:after.filter(e=>sourceReads.some(p=>p.step<e.step&&p.arguments.path===e.arguments.path)).length,patch_produced:result.patch_produced,evaluation_status:evaluation?.status??'no-proposal',resolved:evaluation?.resolved??null,strict_all_expected_pass:evaluation?.strict_all_expected_pass??null,projection_replay_pass:true,projected_message_occurrences:projected,dispatched_captures:result.model_attempts,context_admission_pass:true,cleanup_verified:result.cleanup_verified,input_tokens:result.receipts.filter(r=>r.kind==='model').reduce((s,r)=>s+(r.input_tokens??0),0),output_tokens:result.receipts.filter(r=>r.kind==='model').reduce((s,r)=>s+(r.output_tokens??0),0),list_price_estimate_usd:result.list_price_estimate_usd,result_sha256:hash(readFileSync(new URL('evidence/live/result.json',root))),limitations:['One previously seen development task with labelled synthetic pressure; no fresh matched baseline.','Stable handle, cursor feedback and source index are a compound treatment.','Custom bounded executor; no official benchmark score.'],authority_effect:'none',open_questions_ref:'PLAN.md'};
save('assessment.json',assessment);
const h=read('../next-hypothesis.json').records.find(r=>r.schema_version==='are.research-hypothesis/v1'),e=read('research.json').records[0];
const observation=createHypothesisObservation({hypothesis_ref:h.record_id,source_result_ref:'assessment.json',source_result_digest:hash(readFileSync(new URL('assessment.json',root))),observation_kind:'inconclusive',phase:'experiment',claim:'Controlled-pressure outcome and deterministic recovery checks are recorded separately from natural-pressure effectiveness.',evaluator_id:'external94-pressure-replay',evidence_refs:['assessment.json','evidence/live/recovery.json','RESULT.md'],limitations:assessment.limitations});
const decision=createLearningDecision({hypothesis_ref:h.record_id,experiment_ref:e.record_id,observation_refs:[observation.record_id],disposition:'inconclusive',reason_codes:['single-development-episode'],next_action:'Review the observed remaining failure mechanism before selecting another bounded experiment.'});
for(const r of [e,observation,decision])if(!verifyEvolutionRecord(r,r.schema_version).ok)throw Error('invalid research record');
save('research-result.json',{records:[e,observation,decision],external_parent_ref:'../next-hypothesis.json',projection:{edges:[{from:h.record_id,to:e.record_id},{from:e.record_id,to:observation.record_id},{from:observation.record_id,to:decision.record_id}]},authority_effect:'none',open_questions_ref:'PLAN.md'});
console.log(JSON.stringify(assessment,null,2));
