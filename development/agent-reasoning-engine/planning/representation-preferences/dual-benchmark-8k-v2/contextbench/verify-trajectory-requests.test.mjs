import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {verifyTrajectoryRequests} from './verify-trajectory-requests.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
function fixture(){const request={messages:[{role:'user',content:'fixture'}],tools:[]},prompt=stable(request),cell={context_limit:8000,provider_profile:{token_margin:512,reasoning_effort:'low'},limits:{output_cap:2048}};
 const model={kind:'model',model:'glm-5.3-flash',dispatched:true,status:200,input_tokens:100,output_tokens:10,output_cap:2048,reserved_input_tokens:612,reasoning_effort:'low'};model.request_sha256=hash(stable(bodyForReceipt(prompt,model)));
 const tokenizer={kind:'tokenizer',dispatched:true,status:200,input_tokens:100,request_sha256:hash(stable({model:model.model,...request})),retained_reasoning_reservation:0,retained_reasoning_occurrences:0};
 return {cell,result:{captures:[{prompt,prompt_sha256:hash(prompt)}],receipts:[tokenizer,model],recycling:{dispatches:[{sequence:1,prompt_digest:hash(stable(prompt)),input_upper_bound:612,output_reservation:2048,projected_upper_bound:2660}]}}};}
test('binds original request bytes to tokenizer, reserved window and model receipt',()=>{const args=fixture();assert.equal(verifyTrajectoryRequests(args).total_tokens,110);args.result.captures.push({...args.result.captures[0]});assert.equal(verifyTrajectoryRequests(args).model_calls,1);});
test('rejects capture/receipt/tokenizer drift, omitted calls, bad reservations and unknown usage',()=>{
 for(const change of [a=>a.result.captures[0].prompt+=' ',a=>a.result.receipts[1].request_sha256='0'.repeat(64),a=>a.result.receipts[0].input_tokens++,a=>a.result.receipts[1].input_tokens=9000,a=>a.result.receipts[1].output_tokens=null,a=>a.result.recycling.dispatches=[],a=>a.result.receipts[0].retained_reasoning_reservation=10,a=>a.result.recycling.dispatches[0].sequence=2]){const args=fixture();change(args);assert.throws(()=>verifyTrajectoryRequests(args));}
});
