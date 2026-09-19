// Offline qualification of complete known trajectories. Open questions: RECOVERY-CAMPAIGN.md.
import {createHash} from 'node:crypto';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {retainedReasoning} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/accounting-v1/accounting.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex'),uint=x=>Number.isSafeInteger(x)&&x>=0;
const need=(x,m)=>{if(!x)throw Error('trajectory-requests.'+m);};
export function verifyTrajectoryRequests({result,cell}){
 need(cell.context_limit===8000&&uint(cell.provider_profile?.token_margin)&&uint(cell.limits?.output_cap)&&cell.limits.output_cap>0,'cell');
 need(Array.isArray(result.captures)&&Array.isArray(result.receipts)&&Array.isArray(result.recycling?.dispatches),'evidence');
 const captures=new Map();for(const c of result.captures){need(typeof c.prompt==='string'&&hash(c.prompt)===c.prompt_sha256,'capture-drift');captures.set(hash(stable(c.prompt)),c.prompt);}
 const models=result.receipts.flatMap((r,index)=>r.kind==='model'?[{r,index}]:[]),dispatches=result.recycling.dispatches;
 need(models.length>0&&models.length===dispatches.length,'all-dispatches-accounted');
 const rows=[];
 for(const [i,{r,index}]of models.entries()){
  const d=dispatches[i];need(d.sequence===i+1&&uint(d.input_upper_bound)&&d.output_reservation===cell.limits.output_cap&&d.projected_upper_bound===d.input_upper_bound+d.output_reservation&&d.projected_upper_bound<=8000,'dispatch-reservation');
  need(r.dispatched===true&&r.status===200&&uint(r.input_tokens)&&uint(r.output_tokens)&&r.model==='glm-5.3-flash'&&r.output_cap===d.output_reservation&&r.reserved_input_tokens===d.input_upper_bound&&r.reasoning_effort===cell.provider_profile.reasoning_effort,'model-receipt');
  need(r.input_tokens<=d.input_upper_bound&&r.output_tokens<=d.output_reservation&&(r.automatic_retries??0)===0,'actual-usage');
  const prompt=captures.get(d.prompt_digest);need(typeof prompt==='string','dispatch-capture');
  const body=bodyForReceipt(prompt,r);need(hash(stable(body))===r.request_sha256,'request-digest');
  const tokenizer_digest=hash(stable({model:r.model,messages:body.messages,tools:body.tools}));
  const tokenizers=result.receipts.slice(0,index).flatMap((t,j)=>t.kind==='tokenizer'&&t.dispatched===true&&t.status===200&&t.request_sha256===tokenizer_digest&&uint(t.input_tokens)?[{t,index:j}]:[]);
  need(tokenizers.length>0,'tokenizer-binding');
  // The transport caches the first successful measurement for identical request bytes.
  const {t,index:tokenizer_index}=tokenizers[0],retained=retainedReasoning(body.messages,result.receipts.slice(0,tokenizer_index));
  need(t.retained_reasoning_reservation===retained.tokens&&t.retained_reasoning_occurrences===retained.message_occurrences,'retained-reasoning');
  need(t.input_tokens+cell.provider_profile.token_margin+retained.tokens===d.input_upper_bound,'measured-admission');
  rows.push({sequence:d.sequence,receipt_index:index,request_sha256:r.request_sha256,tokenizer_receipt_index:tokenizer_index,input_tokens:r.input_tokens,output_tokens:r.output_tokens,projected_upper_bound:d.projected_upper_bound});
 }
 return {schema:'are.trajectory-request-verification/v1',verified:true,model_calls:rows.length,total_tokens:rows.reduce((n,r)=>n+r.input_tokens+r.output_tokens,0),maximum_projected_tokens:Math.max(...rows.map(r=>r.projected_upper_bound)),requests:rows,quality_claim:false,authority_effect:'none'};
}
