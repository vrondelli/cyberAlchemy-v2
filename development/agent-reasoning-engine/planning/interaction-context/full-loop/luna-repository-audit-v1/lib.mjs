import {createHash} from 'node:crypto';
export const sha=x=>createHash('sha256').update(x).digest('hex');
export function reserveCost(bytes,task,budget){
 if(!Number.isSafeInteger(bytes)||bytes<0||bytes>task.max_request_bytes)throw Error('request-byte-cap');
 const input=bytes+4096;if(input>=272000)throw Error('long-context-price-boundary');
 return (input*budget.conservative_input_rate+task.max_output_tokens*budget.rates_per_million.output)/1e6;
}
export function checkBudget(total,arm,cost,budget){if(![total,arm,cost].every(n=>Number.isFinite(n)&&n>=0)||total+cost>budget.experiment_cap||arm+cost>budget.per_arm_cap)throw Error('budget-exhausted');}
export function scoreFinding(answer,oracle,sourceMap){
 const verdict_ok=answer?.verdict===oracle.verdict;
 const citations_ok=Array.isArray(answer?.citations)&&answer.citations.length>0&&answer.citations.every(c=>{
  if(!oracle.sources.includes(c.path)||!Number.isSafeInteger(c.line)||c.line<1||typeof c.quote!=='string'||!c.quote.trim())return false;
  const lines=sourceMap[c.path]?.split('\n');return Boolean(lines&&lines[c.line-1]?.includes(c.quote));
 });
 return {verdict_ok,citations_ok,passed:verdict_ok&&citations_ok,semantic_entailment:'requires-review'};
}
export const outputSchema={type:'object',additionalProperties:false,properties:{verdict:{type:'string',enum:['supported','refuted','not_evaluable']},analysis:{type:'string'},citations:{type:'array',items:{type:'object',additionalProperties:false,properties:{path:{type:'string'},line:{type:'integer'},quote:{type:'string'}},required:['path','line','quote']}},carry_forward:{type:'string'}},required:['verdict','analysis','citations','carry_forward']};
