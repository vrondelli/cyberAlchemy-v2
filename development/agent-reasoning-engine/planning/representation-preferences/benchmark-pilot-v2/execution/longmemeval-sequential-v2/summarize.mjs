import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const dir=import.meta.dirname,json=p=>JSON.parse(readFileSync(join(dir,p)));
const raw=json('live/result.json'),review=json('blind-review.json'),mapping=json('blind-review-mapping.json');
if(raw.status!=='completed'||raw.completed_answers!==16)throw Error('full run required');
if(review.items.length!==16||new Set(review.items.map(x=>x.review_id)).size!==16)throw Error('incomplete review');
const verdicts=new Map(mapping.map(m=>[m.call_id,review.items.find(x=>x.review_id===m.review_id)]));
if([...verdicts.values()].some(v=>!v||typeof v.pass!=='boolean'))throw Error('missing verdict');
const arms={};
for(const arm of ['control','treatment']){
 const answers=raw.answers.filter(x=>x.arm===arm),calls=raw.calls.filter(x=>x.arm===arm);
 arms[arm]={answers:answers.length,correct:answers.filter(x=>verdicts.get(x.id).pass).length,total_model_calls:calls.length,input_tokens:calls.reduce((s,c)=>s+c.usage.prompt_tokens,0),output_tokens:calls.reduce((s,c)=>s+c.usage.completion_tokens,0),total_tokens:calls.reduce((s,c)=>s+c.usage.total_tokens,0),note_calls:calls.filter(c=>c.phase==='ingestion').length,invalid_reference_mentions:calls.reduce((s,c)=>s+(c.unknown_refs?.length??0),0)};
}
const prior=json('../longmemeval-sequential-v1/live/result.json');
const results={status:'reviewed-adapted-pilot',arms,current_run_tokens:raw.total_tokens,prior_failed_run_tokens:prior.total_tokens,total_branch_tokens:raw.total_tokens+prior.total_tokens,branch_budget:204800,rows:raw.answers.map(a=>({...a,review:verdicts.get(a.id)})),limitations:['Sequential oracle-history adaptation, not official full-history or retrieval score.','Four development tasks; reserved tasks untouched.','Both arms receive complete source exposure before answering from bounded notes.','Reference validity establishes archive membership, not semantic entailment.','Independent native-rubric review is an evaluator adaptation; no API judge calls.'],authority_effect:'none'};
if(results.total_branch_tokens>results.branch_budget)throw Error('branch budget breach');
writeFileSync(join(dir,'RESULTS.json'),JSON.stringify(results,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(arms,null,2));
