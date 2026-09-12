// Compare observed behavior without treating this unpaired episode as causal proof.
// Open questions: PRESSURE-PLAN.md.
import {readFileSync,writeFileSync} from 'node:fs';
import {hash} from '../common.mjs';
import {createHypothesisObservation,createLearningDecision,verifyEvolutionRecord} from '../../../packages/evolution-runtime/index.mjs';
const root=new URL('./',import.meta.url),read=p=>JSON.parse(readFileSync(new URL(p,root)));
function summarize(attempt){
 const a=read('assessment-'+attempt+'.json'),events=read('evidence/'+attempt+'/events.json');
 const stage=events.filter(e=>e.tool==='stage_patch_candidate');
 return {attempt,status:a.status,model_calls:a.model_calls,tokenizer_calls:a.tokenizer_calls,stage_requests:stage.length,rejected_stages:stage.filter(e=>!e.result.ok).length,valid_stages:stage.filter(e=>e.result.ok).length,unique_candidates:a.candidates.length,placeholder_edits:stage.filter(e=>e.arguments?.edits?.some(x=>x.old_text==='y'&&x.new_text==='x')).length,public_green:a.candidates.some(c=>c.test?.status==='passed'),public_probes:a.public_probe_requests,patch_produced:a.patch_produced,verified_success:a.verified_success,recycles:a.recycles,accounting_pass:a.accounting_replay_pass&&a.observed_input_bounds_hold,projection_pass:a.projection_replay_pass,cleanup_verified:a.cleanup_verified};
}
const result={baseline:summarize('controls-1'),treatment:summarize('pressure-1'),limitations:['One unpaired episode on a repeatedly used development task.','Synthetic padding on one repeatedly used task does not establish general reliability.','Fewer invalid edits without a repair is not task success.'],authority_effect:'none',open_questions_ref:'PRESSURE-PLAN.md#open-questions'};
const save=(p,v)=>writeFileSync(new URL(p,root),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
save('pressure-comparison.json',result);
const {records:[h,e],projection}=read('research-pressure-1.json');
const o=createHypothesisObservation({hypothesis_ref:h.record_id,source_result_ref:'pressure-comparison.json',source_result_digest:hash(readFileSync(new URL('pressure-comparison.json',root))),observation_kind:'inconclusive',phase:'experiment',claim:`Observed treatment outcome: ${result.treatment.status}; rejected stages ${result.treatment.rejected_stages}, public-green ${result.treatment.public_green}, verified repair ${result.treatment.verified_success}. Single-episode observation does not identify a causal treatment effect.`,evaluator_id:'pressure100-comparison',evidence_refs:['pressure-comparison.json','assessment-pressure-1.json','evidence/pressure-1/events.json'],limitations:result.limitations});
const d=createLearningDecision({hypothesis_ref:h.record_id,experiment_ref:e.record_id,observation_refs:[o.record_id],disposition:result.treatment.verified_success?'candidate-supported':'revise-hypothesis',reason_codes:[result.treatment.verified_success?'development-example-verified':'repair-milestone-unmet'],next_action:result.treatment.verified_success?'Review measured pressure-transition evidence before claiming M2 completion.':'Review the observed remaining failure before selecting another bounded intervention.'});
for(const x of [o,d])if(!verifyEvolutionRecord(x,x.schema_version).ok)throw Error('invalid research result');
save('pressure-research-result.json',{records:[h,e,o,d],projection:{edges:[...projection.edges,{from:e.record_id,to:o.record_id},{from:o.record_id,to:d.record_id}]},authority_effect:'none',open_questions_ref:'PRESSURE-PLAN.md#open-questions'});
console.log(JSON.stringify(result,null,2));
