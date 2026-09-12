// Offline instrumentation replay only; no ContextBench or model-success claim.
// Open questions: README.md.
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {join,relative,resolve} from 'node:path';import {createHash} from 'node:crypto';
import {bindDelivery} from './delivery.mjs';
const base=fileURLToPath(new URL('../external-context-v1/',import.meta.url)),rows=[];
for(const study of ['feedback-timing-v1','recovery-reservation-v1'])for(const name of readdirSync(join(base,study,'evidence')).sort()){
 const path=join(base,study,'evidence',name);let captures,result,cb,rb;
 try{cb=readFileSync(join(path,'captures.json'));rb=readFileSync(join(path,'result.json'));captures=JSON.parse(cb);result=JSON.parse(rb);}catch{continue;}
 const bound=bindDelivery({captures,receipts:result.receipts});const receipts=result.receipts.filter(r=>r.kind==='model'&&r.dispatched===true),complete=receipts.filter(r=>Number.isSafeInteger(r.input_tokens)&&Number.isSafeInteger(r.output_tokens));
 const sum=complete.reduce((s,r)=>s+r.input_tokens+r.output_tokens,0);if(sum!==bound.token_accounting.known_total_tokens)throw Error('token-reconciliation');
 rows.push({study,episode:name,source:relative(process.cwd(),path),source_hashes:{captures:createHash('sha256').update(cb).digest('hex'),result:createHash('sha256').update(rb).digest('hex')},model_receipts:receipts.length,successful_bound_requests:bound.requests.filter(r=>r.posture==='confirmed-successful-request').length,read_observations:bound.read_observations.length,unmapped:bound.unmapped,token_accounting:bound.token_accounting});
}
if(rows.length!==20)throw Error('historical-cohort-count');
const report={status:'passed',scope:'20 completed historical development episodes; delivery binding and token accounting only, no new model runs or ContextBench scores.',rows,authority_effect:'none',open_questions_ref:'README.md'};
writeFileSync(new URL('delivery-replay-summary.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({episodes:rows.length,model_receipts:rows.reduce((s,r)=>s+r.model_receipts,0),confirmed_requests:rows.reduce((s,r)=>s+r.successful_bound_requests,0),read_observations:rows.reduce((s,r)=>s+r.read_observations,0),unmapped:rows.reduce((s,r)=>s+r.unmapped.length,0)}));
