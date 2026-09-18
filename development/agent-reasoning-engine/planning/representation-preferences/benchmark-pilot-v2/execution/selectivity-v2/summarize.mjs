import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const dir=import.meta.dirname,json=p=>JSON.parse(readFileSync(join(dir,p)));
const raw=json('live/result.json'),mapping=json('blind-review-mapping.json'),review=json('blind-review.json');
if(raw.status!=='completed'||raw.completed!==16)throw Error('incomplete run');
if(review.items.length!==16||new Set(review.items.map(x=>x.review_id)).size!==16)throw Error('incomplete blind review');
const byCall=new Map(mapping.map(m=>[m.call_id,review.items.find(x=>x.review_id===m.review_id)]));
if([...byCall.values()].some(v=>!v||typeof v.semantic_pass!=='boolean'))throw Error('missing verdict');
const gold=json('gold.json'),arms={};
for(const arm of ['control','treatment']) {
 const rows=raw.results.filter(r=>r.arm===arm);
 arms[arm]={generations:rows.length,completed:rows.length,structural_pass:rows.filter(r=>r.score.pass).length,semantic_pass:rows.filter(r=>byCall.get(r.id).semantic_pass).length,combined_pass:rows.filter(r=>r.score.pass&&byCall.get(r.id).semantic_pass).length,input_tokens:rows.reduce((s,r)=>s+r.usage.prompt_tokens,0),output_tokens:rows.reduce((s,r)=>s+r.usage.completion_tokens,0),total_tokens:rows.reduce((s,r)=>s+r.usage.total_tokens,0),suppression_opportunities:rows.filter(r=>['suppress','override'].includes(gold[r.task_id].category)).length,parsed_dag_misapplications:rows.filter(r=>r.score.misapplication===true).length,unparseable_outputs:rows.filter(r=>r.score.reason==='invalid-json').length};
}
const out={status:'reviewed-pilot-result',arms,known_successor_tokens:raw.total_tokens,prior_failed_and_diagnostic_usage:'unknown',prior_conservative_token_reservation:32768,branch_reserved_upper_bound:32768+raw.total_tokens,primary_metric:'frozen structural pass AND blind semantic pass',limitations:['Four tasks; two repetitions are not independent task samples.','Structured JSON transport is part of this protocol.','Concept matching is stricter than semantic equivalence; preserve disagreements.','Unparseable outputs remain failures and their automated misapplication classification is unknown.','Exact whole-episode token total unavailable because prior failed requests lacked usage.','No external LongMemEval/PersonaMem quality claim.'],rows:raw.results.map(r=>({...r,semantic_review:byCall.get(r.id),combined_pass:r.score.pass&&byCall.get(r.id).semantic_pass})),authority_effect:'none'};
writeFileSync(join(dir,'RESULTS.json'),JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(arms,null,2));
