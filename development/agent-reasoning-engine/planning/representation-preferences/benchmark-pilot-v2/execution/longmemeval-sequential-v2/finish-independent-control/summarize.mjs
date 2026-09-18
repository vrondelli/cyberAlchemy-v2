import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const dir=import.meta.dirname,json=p=>JSON.parse(readFileSync(join(dir,p)));
const prefix=json('../recovery-v1/live/result.json'),tail=json('live/result.json'),early=json('../../longmemeval-sequential-v1/live/result.json');
if(tail.status!=='completed'||tail.calls.length!==4||prefix.completed_answers!==14)throw Error('wrong disposition');
const answers=[...prefix.answers,tail.calls.at(-1)],calls=[...prefix.calls,...tail.calls];
const review=[...json('../blind-review.json').items,...json('blind-review.json').items],mapping=[...json('../blind-review-mapping.json'),...json('blind-review-mapping.json')];
if(review.length!==15||new Set(review.map(r=>r.review_id)).size!==15)throw Error('review incomplete');
const verdicts=new Map(mapping.map(m=>[m.call_id,review.find(r=>r.review_id===m.review_id)]));
if(answers.some(a=>typeof verdicts.get(a.id)?.pass!=='boolean'))throw Error('missing verdict');
const arms={};
for(const arm of ['control','treatment']){
 const aa=answers.filter(a=>a.arm===arm),cc=calls.filter(c=>c.arm===arm),failed=arm==='treatment'?prefix.failed_usage:{prompt_tokens:0,completion_tokens:0,total_tokens:0};
 arms[arm]={planned_answer_slots:8,completed_answers:aa.length,failed_answer_slots:8-aa.length,correct_completed_answers:aa.filter(a=>verdicts.get(a.id).pass).length,task_success_denominator:8,input_tokens:cc.reduce((s,c)=>s+c.usage.prompt_tokens,failed.prompt_tokens),output_tokens:cc.reduce((s,c)=>s+c.usage.completion_tokens,failed.completion_tokens),total_tokens:cc.reduce((s,c)=>s+c.usage.total_tokens,failed.total_tokens)};
}
if(arms.control.total_tokens+arms.treatment.total_tokens!==tail.total_tokens)throw Error('accounting mismatch');
const result={status:'reviewed-amended-descriptive-pilot',arms,generation_slots:{planned:64,successful:61,failed:1,blocked_by_failed_dependency:2},answer_slots:{planned:16,completed:15,failed:1},current_protocol_tokens:tail.total_tokens,prior_stopped_protocol_tokens:early.total_tokens,whole_branch_tokens:tail.total_tokens+early.total_tokens,branch_budget:204800,recovery_disclosures:['Tokenizer-only request retried at a verified task boundary; no completed model generation repeated.','After treatment output truncation, final independent control slot ran unchanged under reviewed post-stop amendment.','Failed treatment remains zero in fixed8-slot task-success denominator; no partial note or fabricated answer accepted.'],rows:answers.map(a=>({...a,review:verdicts.get(a.id)})),failed_slot:{task_id:'longmemeval:eeda8a6d_abs',arm:'treatment',repetition:2,stage:'ingestion-1',reason:'finish-length',final_answer:null,task_success:false},limitations:['Descriptive amended sequential oracle-history subset, not a clean preregistered completion or official benchmark score.','Four development tasks, no population or cross-model claim.','Gold/rubric ambiguity preserved in individual reviews.','Validity of source references establishes archive membership, not semantic entailment.'],authority_effect:'none'};
if(result.whole_branch_tokens>204800)throw Error('branch budget');
writeFileSync(join(dir,'RESULTS.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({arms,whole_branch_tokens:result.whole_branch_tokens},null,2));
