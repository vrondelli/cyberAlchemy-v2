// Receipt-only cost diagnosis. No provider, gold or prompt-body disclosure. Open questions: ../PLAN.md.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../../../../../..'),old=resolve(import.meta.dirname,'../../dual-benchmark-8k-v1');
const read=p=>JSON.parse(readFileSync(p)),bind=p=>({path:relative(root,p),sha256:createHash('sha256').update(readFileSync(p)).digest('hex')});
const resultPath=resolve(old,'AMENDED-RESULTS.json'),prior=read(resultPath).benchmarks.contextbench,rows=[];
for(const row of prior.rows)for(const arm of ['control','treatment']){
 const lane=row.stage===2?'amended-live/stage2':row.task_id==='contextbench-4'?'amended-live/first-exposure-cb4':'live/stage1';
 const path=resolve(old,lane,'pairs',row.task_id,'run',arm,'result.json'),result=read(path);
 const receipts=result.receipts.filter(r=>r.kind==='model'&&r.dispatched),input=receipts.reduce((s,r)=>s+r.input_tokens,0),output=receipts.reduce((s,r)=>s+r.output_tokens,0);
 assert.ok(receipts.every(r=>Number.isSafeInteger(r.input_tokens)&&Number.isSafeInteger(r.output_tokens)));
 assert.equal(input+output,row.arms[arm].generation_tokens);
 rows.push({stage:row.stage,task_id:row.task_id,arm,source:bind(path),status:result.status,calls:receipts.length,input,output,total:input+output,reasoning_output:receipts.reduce((s,r)=>s+(r.reasoning_tokens??0),0),last_call_tokens:receipts.at(-1).input_tokens+receipts.at(-1).output_tokens,finalizing:result.finalizing});
}
const totals=Object.fromEntries(['control','treatment'].map(arm=>[arm,Object.fromEntries(['calls','input','output','total','reasoning_output','last_call_tokens'].map(k=>[k,rows.filter(r=>r.arm===arm).reduce((s,r)=>s+r[k],0)]))]));
for(const arm of ['control','treatment'])assert.equal(totals[arm].total,prior.totals[arm].tokens);
const maxTreatment=Math.floor(totals.control.total*.85),additionalReduction=totals.treatment.total-maxTreatment;
const analysis={schema_version:'dual8k.token-diagnosis/v2',source:bind(resultPath),totals,
 actual_reduction:1-totals.treatment.total/totals.control.total,target:0.15,maximum_treatment_tokens_at_target:maxTreatment,additional_tokens_to_remove:additionalReduction,additional_fraction_of_treatment:additionalReduction/totals.treatment.total,
 treatment_input_fraction:totals.treatment.input/totals.treatment.total,
 limitations:['Input includes repeated history, tools, source bodies and other framing; this receipt-only analysis does not attribute exact tokens among them.','Removing output or a last call counterfactually can change task quality and subsequent calls; totals are not evidence of safe savings.','Terminal repair is a completion hypothesis, not a demonstrated efficiency mechanism.'],
 rows,authority_effect:'none',open_questions_ref:'../PLAN.md'};
writeFileSync(resolve(import.meta.dirname,'TOKEN-ANALYSIS.json'),JSON.stringify(analysis,null,2)+'\n');
console.log(JSON.stringify({totals,additionalReduction,input_fraction:analysis.treatment_input_fraction}));
