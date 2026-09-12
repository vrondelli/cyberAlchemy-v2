import {hash} from './common.mjs';
// Independent replay/accounting checks. Open questions: README.md.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {stable} from '../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
import {projectPrompt} from '../glm-episodes-v1/analysis/provider-study-v1/payload-js-v1/projection.mjs';
import {createHypothesisObservation,createLearningDecision,verifyEvolutionRecord} from '../../packages/evolution-runtime/index.mjs';
const root=new URL('./',import.meta.url),read=p=>JSON.parse(readFileSync(new URL(p,root))),save=(p,v)=>writeFileSync(new URL(p,root),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const freeze=read('prepared/freeze.json');for(const f of freeze.sources)if(hash(readFileSync(new URL(f.path,root)))!==f.sha256)throw Error('source drift');
const rows=[];let intact=true;
for(const arm of ['baseline','payload']){
 const dir='evidence/live-'+arm+'/',r=read(dir+'result.json'),c=read(dir+'captures.json');
 let projected=0,dispatched=0;
 for(const capture of c){const expected=arm==='payload'?projectPrompt(capture.original):{prompt:capture.original,receipts:[]};if(expected.prompt!==capture.prompt)throw Error('projection mismatch');projected+=expected.receipts.filter(x=>x.projected).length;}
 for(const receipt of r.receipts.filter(x=>x.kind==='model')){
  const found=c.filter(capture=>{const body={...JSON.parse(capture.prompt),model:'glm-5.3-flash',stream:false,max_tokens:2048,thinking:{type:'enabled',clear_thinking:false},reasoning_effort:'low'};return hash(stable(body))===receipt.request_sha256;});
  if(found.length!==1)throw Error('dispatch capture mismatch');dispatched++;
 }
 if(r.model_attempts>12||r.tokenizer_attempts>24||r.receipts.some(x=>x.automatic_retries!==0)||!r.cleanup_verified)throw Error('accounting/cleanup violation');
 if(r.recycling.dispatches.some(x=>x.projected_upper_bound>=12000))throw Error('context admission violation');
 const evaluationPath='evidence/evaluation-'+arm+'/report.json',evaluation=existsSync(new URL(evaluationPath,root))?read(evaluationPath):null;
 if(evaluation&&!evaluation.cleanup_verified)throw Error('evaluator cleanup');
 rows.push({arm,status:r.status,patch_produced:r.patch_produced,resolved:evaluation?.resolved??(r.patch_produced?null:false),strict_all_expected_pass:evaluation?.strict_all_expected_pass??null,evaluation_status:evaluation?.status??'no-proposal',model_attempts:r.model_attempts,tokenizer_attempts:r.tokenizer_attempts,input_tokens:r.receipts.filter(x=>x.kind==='model').reduce((n,x)=>n+(x.input_tokens??0),0),output_tokens:r.receipts.filter(x=>x.kind==='model').reduce((n,x)=>n+(x.output_tokens??0),0),recycles:r.recycling.recycles,dispatched_captures:dispatched,projected_message_occurrences:projected,elapsed_ms:r.elapsed_ms,list_price_estimate_usd:r.list_price_estimate_usd,cleanup_verified:r.cleanup_verified,source_result_sha256:hash(readFileSync(new URL(dir+'result.json',root)))});
}
const result={instance_id:read('prepared/task.json').instance_id,partition:'development-only',rows,projection_integrity:intact,live_pair_complete:true,external_generalization:'inconclusive: one development task; common executor differs from historical H21',authority_effect:'none',open_questions_ref:'README.md'};save('assessment.json',result);
const records=read('prepared/research.json').records,h=records.find(r=>r.schema_version==='are.research-hypothesis/v1'),e=records.find(r=>r.schema_version==='are.research-experiment/v1');
const observation=createHypothesisObservation({hypothesis_ref:h.record_id,source_result_ref:'assessment.json',source_result_digest:hash(readFileSync(new URL('assessment.json',root))),observation_kind:rows.every(r=>r.patch_produced&&r.evaluation_status==='scored')&&rows.find(r=>r.arm==='payload').projected_message_occurrences>0?'supporting':'inconclusive',phase:'experiment',claim:'First external development pair completed; exact projection and dispatch reconstruction checked. Outcomes remain separate from generalization.',evaluator_id:'external92-replay-audit',evidence_refs:['assessment.json'],limitations:['One development task, not held out.','Custom bounded executor and resource-adapted test command.','No native ContextBench score or general continuity qualification.']});
const decision=createLearningDecision({hypothesis_ref:h.record_id,experiment_ref:e.record_id,observation_refs:[observation.record_id],disposition:'inconclusive',reason_codes:['external-development-only'],next_action:'Review actual failures and adapter readiness before any larger frozen cohort.'});for(const r of [...records,observation,decision])if(!verifyEvolutionRecord(r,r.schema_version).ok)throw Error('invalid record');
save('research-result.json',{records:[...records,observation,decision],projection:{edges:[...read('prepared/research.json').projection.edges,{from:e.record_id,to:observation.record_id},{from:observation.record_id,to:decision.record_id}]},authority_effect:'none',open_questions_ref:'README.md'});console.log(JSON.stringify(result));
