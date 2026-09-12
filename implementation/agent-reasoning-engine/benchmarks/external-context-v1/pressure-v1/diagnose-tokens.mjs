// Receipt-only analysis: no provider calls. Open questions: PLAN.md.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('./',import.meta.url),read=p=>JSON.parse(readFileSync(new URL(p,root)));
const episodes=['../evidence/live-v2-baseline/result.json','../evidence/live-v3-payload/result.json','../recovery-v1/evidence/live/result.json','evidence/live/result.json'];
const runs=episodes.map(path=>{
 const r=read(path),models=r.receipts.filter(x=>x.kind==='model');let generation=null,priorReasoning=0;
 const rows=models.map((m,i)=>{const d=r.recycling.dispatches[i];if(d.generation!==generation){generation=d.generation;priorReasoning=0;}const hasUsage=Number.isInteger(m.input_tokens)&&Number.isInteger(m.reserved_input_tokens);
 const row={turn:i+1,generation,has_usage:hasUsage,tokenizer_input:hasUsage?m.reserved_input_tokens-512:null,actual_input:m.input_tokens??null,reserved_input:m.reserved_input_tokens??null,tokenizer_gap:hasUsage?m.input_tokens-m.reserved_input_tokens+512:null,prior_reasoning_tokens_in_generation:priorReasoning,response_reasoning_tokens:m.reasoning_tokens??null,actual_with_full_output_reservation:hasUsage?m.input_tokens+2048:null};row.gap_matches_prior_reasoning=hasUsage?row.tokenizer_gap===priorReasoning:null;priorReasoning+=m.reasoning_tokens??0;return row;});
 return {path,terminal_reason:r.error??null,rows};
});
const current=runs.at(-1),post=current.rows.filter(r=>r.generation===1&&r.has_usage);
const output={runs,pressure_post_transition_gap_matches:{matched:post.filter(r=>r.gap_matches_prior_reasoning).length,total:post.length},hypothesis:'Retained reasoning contributes to the tokenizer-versus-chat input discrepancy. All measured post-transition turns in this pressure episode match cumulative prior reasoning tokens; the initial-generation counterexample prevents treating this as a universal counting rule.',next_action:'Test request-scoped accounting for retained reasoning against all captured episodes and boundary cases before changing the safety margin or performing another live run.',limitations:['Observed usage is not a guaranteed upper bound for future provider accounting.','Unknown usage from timeouts remains unknown.','No final response was exposed by the transport after its input-reservation guard failed.'],authority_effect:'none',open_questions_ref:'PLAN.md'};
writeFileSync(new URL('token-diagnosis.json',root),JSON.stringify(output,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(output.pressure_post_transition_gap_matches));
