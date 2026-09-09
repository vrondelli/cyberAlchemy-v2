// Supplemental accounting, not a change to the frozen quality screen. Open questions: README.md.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {root,read,sha,verify} from './common.mjs';
import {save,trialState} from '../controller.mjs';
const m=verify();assert.equal(existsSync(new URL('live/controller.lock',root)),false);
const sources=[],rows=[];
const percentile=(values,p)=>{if(!values.length)return null;const sorted=values.toSorted((a,b)=>a-b);return sorted[Math.max(0,Math.ceil(p*sorted.length)-1)];};
const sum=(rs,key)=>rs.reduce((s,r)=>s+(r[key]??0),0);
for(const row of read(new URL('prepared/schedule.json',root))){
 if(!existsSync(new URL(`live/${row.id}/completed.json`,root)))continue;
 const state=trialState(new URL('live/',root).pathname,row,m.digest),r=state.result;
 sources.push({path:state.root+'/result.json',sha256:sha(readFileSync(state.root+'/result.json'))});
 const models=r.receipts.filter(r=>r.kind==='model'),tokens=r.receipts.filter(r=>r.kind==='tokenizer'),known=models.filter(r=>Number.isSafeInteger(r.input_tokens)&&Number.isSafeInteger(r.output_tokens));
 assert.ok(r.receipts.every(r=>Number.isFinite(r.latency_ms)&&r.latency_ms>=0));
 rows.push({id:row.id,arm:row.arm,window:row.soft_limit,block:row.block,qualified:r.qualified,models:models.length,tokenizers:tokens.length,known_usage_requests:known.length,unknown_usage_requests:models.length-known.length,input_tokens:sum(known,'input_tokens'),output_tokens:sum(known,'output_tokens'),reasoning_tokens_known_sum:sum(known,'reasoning_tokens'),cached_tokens_known_sum:sum(known,'cached_tokens'),model_latency_sum_ms:sum(models,'latency_ms'),tokenizer_latency_sum_ms:sum(tokens,'latency_ms'),last_model_latency_ms:models.at(-1)?.latency_ms??null,request_p50_ms:percentile(models.map(r=>r.latency_ms),.5),request_p95_ms:percentile(models.map(r=>r.latency_ms),.95)});
}
const group=rs=>({trials:rs.length,qualified:rs.filter(r=>r.qualified).length,models:sum(rs,'models'),tokenizers:sum(rs,'tokenizers'),input_tokens:sum(rs,'input_tokens'),output_tokens:sum(rs,'output_tokens'),unknown_usage_requests:sum(rs,'unknown_usage_requests'),model_latency_sum_ms:sum(rs,'model_latency_sum_ms'),tokenizer_latency_sum_ms:sum(rs,'tokenizer_latency_sum_ms'),trial_model_time_p50_ms:percentile(rs.map(r=>r.model_latency_sum_ms),.5),trial_model_time_p95_ms:percentile(rs.map(r=>r.model_latency_sum_ms),.95)});
const by_arm=['byte-baseline','scope-clarified'].map(arm=>({arm,...group(rows.filter(r=>r.arm===arm))}));
const result={complete:rows.length===16,totals:group(rows),by_arm,by_window:[8000,10000,12000].map(window=>({window,...group(rows.filter(r=>r.window===window))})),rows,sources,verifier_sha256:sha(readFileSync(new URL('receipt-summary.mjs',root))),interpretation:'Descriptive receipt accounting. Nearest-rank percentiles. Summed request latency is not full wall time; input totals sum repeated context and are not context capacity or provider bills. Unknown usage is explicit. No prices or inference about model-internal reasoning content.',authority_effect:'none',open_questions_ref:'README.md'};
save(new URL('receipt-summary.json',root),result);console.log(JSON.stringify({...result,rows:undefined,sources:undefined}));
