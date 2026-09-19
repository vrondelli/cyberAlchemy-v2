// Tokenizer-only study core. Open questions: RECOVERY-TOKENIZER-PROTOCOL.md.
import {createHash} from 'node:crypto';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {createFreshRecoverySession} from './recovery-freshness.mjs';
import {projectRecoveryWire} from './recovery-wire.mjs';
import {MODEL} from './packet-diversity-v1/transport-bounded-v3.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const need=(x,m)=>{if(!x)throw Error('recovery-tokenizer.'+m);};
export function createTokenizerMeasurer({post,record,before_dispatch,signal,maximum_calls=512}){
 need(Number.isSafeInteger(maximum_calls)&&maximum_calls>0&&maximum_calls<=512,'call-limit');
 const receipts=[],cache=new Map();let invocations=0;
 return {receipts,get invocations(){return invocations;},async measure(request){
  invocations++;need(!signal?.aborted,'aborted');
  need(Array.isArray(request.messages)&&Array.isArray(request.tools),'wire-shape');
  const raw=stable({model:MODEL,messages:request.messages,tools:request.tools}),digest=hash(raw);
  need(Buffer.byteLength(raw)<=262144,'request-bytes');
  if(cache.has(digest))return cache.get(digest);
  need(receipts.length<maximum_calls,'call-limit');
  const receipt={sequence:receipts.length,request_sha256:digest,kind:'tokenizer',dispatched:false,status:'started',tokens:null};receipts.push(receipt);
  // Share the promise across identical simultaneous measurements; failures stay failed.
  const promise=(async()=>{
   try{
    await record({...receipt});need(!signal?.aborted,'aborted');
    const response=await post(raw,async()=>{await before_dispatch();need(!signal?.aborted,'aborted');receipt.dispatched=true;try{await record({...receipt});}catch(e){receipt.dispatched=false;receipt.dispatch_journal_failed=true;throw e;}return ()=>{receipt.dispatched=false;receipt.proven_pre_http_abort=true;};});
    need(receipt.dispatched,'response-without-dispatch');receipt.status=response.status;receipt.tokens=response.payload?.usage?.prompt_tokens??null;
    need(receipt.status===200&&Number.isSafeInteger(receipt.tokens)&&receipt.tokens>=0,'invalid-response');return receipt.tokens;
   }catch(e){receipt.failure_code=typeof e.code==='string'?e.code:'measurement-failed';throw e;}
   finally{await record({...receipt});}
  })();cache.set(digest,promise);return promise;
 }};
}

export async function runCounterfactual({outcomes,load_source,measure,write_row,signal,abort}){
 need(outcomes.length===4&&new Set(outcomes.map(x=>x.task_id)).size===4,'fixed-four');
 need(outcomes.reduce((n,x)=>n+x.requests.length,0)===97,'fixed-97');
 const rows=outcomes.flatMap(o=>o.requests.map(p=>({task_id:o.task_id,request_sha256:p.request_sha256,status:'not-started',variants:{}}))),failures=[];
 need(new Set(rows.map(r=>r.task_id+':'+r.request_sha256)).size===97,'duplicate-boundary');let next=0;
 async function worker(){
  while(!signal.aborted&&next<outcomes.length){
   const outcome=outcomes[next++];
   try{
    const result=await load_source(outcome.task_id),session=createFreshRecoverySession({measure_tokens:text=>measure({messages:[{role:'user',content:text}],tools:[]})});
    for(const presentation of outcome.requests){
     need(!signal.aborted,'aborted');
     const indices=result.receipts.flatMap((r,i)=>r.kind==='model'&&r.dispatched&&r.request_sha256===presentation.request_sha256?[i]:[]);
     need(indices.length===1,'receipt-ambiguity');const receiptIndex=indices[0],receipt=result.receipts[receiptIndex];
     need(receipt.status===200&&Number.isSafeInteger(receipt.output_cap),'original-receipt');
     const captureIndex=result.captures.findIndex(c=>hash(stable(bodyForReceipt(c.prompt,receipt)))===receipt.request_sha256);need(captureIndex>=0,'capture-missing');
     const capture=result.captures[captureIndex];need(hash(capture.prompt)===capture.prompt_sha256,'capture-drift');
     const original=JSON.parse(capture.prompt),archive={captures:result.captures.slice(0,captureIndex),receipts:result.receipts.slice(0,receiptIndex)};
     const page=await session.prepare(archive);need(page.model?.text,'page-unfit');
     const originalPresentations=result.recovery_presentations.filter(x=>x.request_sha256===receipt.request_sha256);need(originalPresentations.length===1,'presentation-ambiguity');
     const row=rows.find(r=>r.task_id===outcome.task_id&&r.request_sha256===receipt.request_sha256);Object.assign(row,{receipt_index:receiptIndex,original_output_reserve:receipt.output_cap,available_observations:page.freshness.available_observations,catalog_observations:JSON.parse(page.model.text).total,status:'started'});
     await write_row(row);
     for(const variant of ['eager','demand']){
      need(!signal.aborted,'aborted');const request=projectRecoveryWire({request:original,presentation:originalPresentations[0],page,variant});
      const digest=hash(stable({model:MODEL,...request})),tokens=await measure(request);
      row.variants[variant]={request_sha256:digest,input_tokens:tokens,tokenizer_plus_original_output_within_8k:tokens+receipt.output_cap<=8000};await write_row(row);
     }
     row.input_difference=row.variants.demand.input_tokens-row.variants.eager.input_tokens;row.status='completed';await write_row(row);
    }
   }catch(e){failures.push({task_id:outcome.task_id,code:typeof e.code==='string'?e.code:'study-failure',message:String(e.message).slice(0,256)});abort();}
  }
 }
 await Promise.all([worker(),worker()]);
 const complete=rows.filter(r=>r.status==='completed'),eager=complete.reduce((n,r)=>n+r.variants.eager.input_tokens,0),demand=complete.reduce((n,r)=>n+r.variants.demand.input_tokens,0);
 const all=complete.length===97&&rows.length===97&&failures.length===0;
 return {schema:'are.recovery-tokenizer-study/v1',status:all?'completed':'failed',classification:!all?'inconclusive':demand<eager?'supporting':'counterevidence',rows,failures,completed_pairs:complete.length,planned_pairs:97,complete_pair_input_totals:{eager,demand,difference:demand-eager},input_size_supported:all&&demand<eager,model_calls:0,campaign_goal_achieved:false,limitations:['Input-only matched counterfactual, not observed model spend or quality.','Opening turns/output costs are unmeasured; demand remains unopened in this diagnostic.','Tokenizer plus original output cap does not establish retained-reasoning admission.'],open_questions_ref:'../RECOVERY-TOKENIZER-PROTOCOL.md'};
}
