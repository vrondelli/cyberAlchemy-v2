import test from 'node:test';
import assert from 'node:assert/strict';
import {IDS,sha,planConfirmation,flattenHistory} from './adapter-note-v5.mjs';
import {generationPlan,runPair,runGeneration} from './runner-note-v5.mjs';
const rows=()=>IDS.map(question_id=>({question_id,question_type:'multi-session',question:'Which source fact was recorded?',question_date:'2024/03/01 (Fri) 12:00',haystack_dates:['2024/02/01 (Thu) 12:00','2024/01/01 (Mon) 12:00'],haystack_sessions:[0,1].map(s=>Array.from({length:6},(_,i)=>({role:i%2?'assistant':'user',content:`item ${s}-${i} `+'source fact '.repeat(350)})))}));
const meter=async request=>({input_tokens:Math.ceil(JSON.stringify(request).length/4),wire_sha256:sha(request)});
async function fixture(){const source=rows(),qualified=await planConfirmation(source,meter),plan=generationPlan(source,qualified);return {source,qualified,plan};}
const response=request=>({status:200,ok:true,finish_reason:'stop',output:request.max_tokens===768?'retained source notes':'final answer',request_sha256:sha(request),usage:{prompt_tokens:Math.ceil(JSON.stringify(request).length/4),completion_tokens:30,total_tokens:Math.ceil(JSON.stringify(request).length/4)+30,completion_tokens_details:{reasoning_tokens:20}}});
const options=plan=>({plan,meter,generate:async({request})=>response(request),record:async()=>{},tokenizer_limits:{max_calls:plan.planned_model_calls,timeout_ms:10000}});
const pairOptions=pair=>({pair,meter,generate:async({request})=>response(request),record:async()=>{},health:{stopped:false,reason:null,reserved_tokens:0,token_budget:pair.token_budget}});
test('qualified source and real counts bind fixed plan; altered source/projection or budgets reject',async()=>{
 const {source,qualified,plan}=await fixture();assert.equal(plan.planned_answer_slots,8);assert.deepEqual(plan.pairs.map(p=>p.order),[['control','treatment'],['treatment','control'],['control','treatment'],['treatment','control']]);
 assert.equal(plan.token_budget,plan.pairs.reduce((n,p)=>n+8000*p.chunks.length+16000,0));
 const bad=structuredClone(qualified);bad.tasks[0].ingestion.chunks[0].pop();assert.throws(()=>generationPlan(source,bad),/coverage/);
 const changed=structuredClone(source);changed[0].question+=' changed';assert.throws(()=>generationPlan(changed,qualified),/answer-wire/);
 const budget=structuredClone(qualified);budget.generation_reservation=1;assert.throws(()=>generationPlan(source,budget),/branch-budget/);
});
test('complete query-free control ingestion with carry; identical answers policy; fresh wire each call',async()=>{
 const {plan}=await fixture(),pair=plan.pairs[0],seen=[],measured=[];
 const r=await runPair({...pairOptions(pair),meter:async request=>{measured.push(sha(request));return meter(request);},generate:async({id,request})=>{seen.push({id,request});return response(request);}});
 assert.equal(r.status,'completed');assert.equal(r.answers.length,2);assert.equal(r.calls.length,pair.chunks.length+2);assert.deepEqual(seen.map(x=>sha(x.request)),measured);
 const ing=seen.filter(x=>x.request.max_tokens===768);assert.ok(ing.every(x=>!JSON.stringify(x.request).includes(pair.row.question)));assert.ok(ing[1].request.messages.some(m=>m.content.includes('retained source notes')));
 assert.equal(seen.at(-1).request.messages[0].content,seen.at(-2).request.messages[0].content);assert.deepEqual(pair.chunks.flat(),flattenHistory(pair.row));
 assert.equal(r.usage.completion_tokens,30*seen.length);assert.ok(r.usage.total_tokens<r.token_budget);assert.equal(r.unknown_usage,false);
});
test('two-worker full schedule preserves eight answers and exact observed spend',async()=>{
 const {plan}=await fixture();let active=0,peak=0;
 const r=await runGeneration({...options(plan),generate:async({request})=>{active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,1));active--;return response(request);}});
 assert.equal(r.status,'completed');assert.equal(r.results.length,4);assert.equal(r.results.flatMap(p=>p.answers).length,8);assert.equal(peak,2);assert.equal(r.model_generation_calls,plan.planned_model_calls);assert.equal(r.tokenizer_calls,plan.planned_model_calls);assert.equal(r.usage.completion_tokens,30*plan.planned_model_calls);assert.equal(r.reserved_tokens,plan.token_budget);
});
test('actual carried notes oversized blocks dependency only, independent treatment still runs',async()=>{
 const {plan}=await fixture(),pair=plan.pairs[0];let gens=0;
 const r=await runPair({...pairOptions(pair),meter:async request=>({input_tokens:request.max_tokens===768&&request.messages.some(m=>m.content.includes('retained source notes'))?7233:100,wire_sha256:sha(request)}),generate:async({request})=>{gens++;return response(request);}});
 assert.equal(r.answers.find(a=>a.arm==='control').status,'blocked');assert.equal(r.answers.find(a=>a.arm==='treatment').status,'completed');assert.equal(gens,2);assert.equal(r.calls.find(c=>c.reason==='actual-wire-over-budget').model_started,false);
});
test('known ordinary first-arm failure retains cost and independent opposite answer',async()=>{
 const {plan}=await fixture();let n=0;
 const r=await runPair({...pairOptions(plan.pairs[0]),generate:async({request})=>{n++;return {...response(request),finish_reason:n===1?'length':'stop'};}});
 assert.equal(r.answers.find(a=>a.arm==='control').status,'blocked');assert.equal(r.answers.find(a=>a.arm==='treatment').status,'completed');assert.equal(r.usage.completion_tokens,60);assert.equal(r.unknown_usage,false);
});
test('unknown and capacity failures stop shared health without discarding slots or retrying',async()=>{
 const {plan}=await fixture();for(const kind of ['unknown','capacity']){let calls=0;
  const r=await runGeneration({...options(plan),generate:async({request})=>{calls++;if(kind==='unknown')throw Error('connection ended');throw Object.assign(Error('capacity'),{receipt:{...response(request),status:503,error_code:'1305'}});}});
  assert.equal(r.results.flatMap(p=>p.answers).length,8);assert.ok(calls<=2);assert.equal(r.status,'failed');assert.ok(r.health_stop);assert.equal(r.unknown_usage,kind==='unknown');assert.equal(r.held_tokens>0,kind==='unknown');
 }
});
test('pair and branch persistence failures attach complete known or unknown accounting',async()=>{
 const {plan}=await fixture();
 for(const unknown of [false,true])await assert.rejects(runPair({...pairOptions(plan.pairs[0]),generate:unknown?async()=>{throw Error('lost');}:async({request})=>response(request),record:async event=>{if(event.kind==='pair-result')throw Error('disk');}}),error=>Boolean(error.result&&error.result.answers.length===2&&error.result.unknown_usage===unknown&&(unknown?!error.usage:error.usage.total_tokens>0)));
 await assert.rejects(runGeneration({...options(plan),record:async event=>{if(event.kind==='generation-result')throw Error('disk');}}),error=>Boolean(error.result?.results.length===4&&error.usage?.total_tokens>0));
});
test('pre-dispatch journal failure makes no model call and tokenizer failure cannot trigger generation',async()=>{
 const {plan}=await fixture();let called=0;
 const r=await runPair({...pairOptions(plan.pairs[0]),generate:async()=>{called++;},record:async event=>{if(event.kind==='call-start')throw Error('disk');}});
 assert.equal(called,0);assert.equal(r.persistence_failure,true);assert.equal(r.usage.total_tokens,0);assert.equal(r.unknown_usage,false);
 const result=await runGeneration({...options(plan),meter:async()=>{throw Error('tokenizer down');},generate:async()=>{called++;}});assert.equal(called,0);assert.equal(result.health_stop,'tokenizer-failure');assert.equal(result.unknown_usage,false);
});
test('request hash drift and usage overrun fail closed but preserve measured cost',async()=>{
 const {plan}=await fixture();for(const mode of ['hash','usage']){const r=await runPair({...pairOptions(plan.pairs[0]),generate:async({request})=>mode==='hash'?{...response(request),request_sha256:'wrong'}:{...response(request),usage:{prompt_tokens:7233,completion_tokens:400,total_tokens:7633}}});assert.equal(r.status,'failed');assert.equal(r.unknown_usage,false);assert.ok(r.usage.total_tokens>0);assert.equal(r.calls.filter(c=>c.model_started).length,1);}
});
test('shared tokenizer budget and timeout fail closed with every answer slot retained',async()=>{
 const {plan}=await fixture();
 const limited=await runGeneration({...options(plan),tokenizer_limits:{max_calls:1,timeout_ms:10000}});assert.equal(limited.tokenizer_calls,1);assert.equal(limited.health_stop,'tokenizer-failure');assert.equal(limited.results.flatMap(p=>p.answers).length,8);
 let aborted=false;const timeout=await runGeneration({...options(plan),meter:(_r,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(Error('aborted'));},{once:true})),tokenizer_limits:{max_calls:100,timeout_ms:100}});assert.equal(aborted,true);assert.equal(timeout.tokenizer_calls,1);assert.equal(timeout.model_generation_calls,0);assert.equal(timeout.results.flatMap(p=>p.answers).length,8);
});
test('provider persistence and inconsistent reasoning subtotals cannot pass as completed',async()=>{
 const {plan}=await fixture();for(const mode of ['persistence','details']){const r=await runPair({...pairOptions(plan.pairs[0]),generate:async({request})=>{const receipt=response(request);if(mode==='persistence')receipt.persistence_failure=true;else receipt.usage.completion_tokens_details.reasoning_tokens=31;return receipt;}});assert.equal(r.status,'failed');assert.equal(r.usage.completion_tokens,30);assert.equal(r.unknown_usage,false);assert.equal(r.calls.filter(c=>c.model_started).length,1);}
});
test('not-started claims require proof and cannot erase positive authoritative receipt usage',async()=>{
 const {plan}=await fixture();
 for(const mode of ['positive','masked-positive','unproven','proven-zero']){
  const health={stopped:false,reason:null,reserved_tokens:0,token_budget:plan.token_budget};let invokes=0;
  const result=await runPair({...pairOptions(plan.pairs[0]),health,generate:async({request})=>{
   invokes++;const error=Object.assign(Error('transport pre-dispatch claim'),{model_started:false});
   if(mode!=='unproven')error.dispatch_proof='not-dispatched';
   if(mode==='positive'||mode==='masked-positive')error.receipt={...response(request),usage:{prompt_tokens:100,completion_tokens:20,total_tokens:120}};
   if(mode==='masked-positive'||mode==='proven-zero')error.usage={prompt_tokens:0,completion_tokens:0,total_tokens:0};
   throw error;
  }});
  assert.equal(result.answers.length,2);
  if(mode.includes('positive')){assert.equal(result.usage.total_tokens,120);assert.equal(result.unknown_usage,false);assert.equal(result.calls.filter(c=>c.model_started).length,1);assert.equal(invokes,1);assert.ok(health.stopped);}
  else if(mode==='unproven'){assert.equal(result.unknown_usage,true);assert.equal(result.held_tokens,8000);assert.equal(invokes,1);assert.ok(health.stopped);}
  else{assert.equal(result.usage.total_tokens,0);assert.equal(result.unknown_usage,false);assert.equal(result.calls.filter(c=>c.model_started).length,0);}
 }
});
test('768 note allowance admits longer stopped note but preserves length-failure and accounting',async()=>{
 const {plan}=await fixture(),pair=plan.pairs[0];for(const finish of ['stop','length']){let first=true;const result=await runPair({...pairOptions(pair),generate:async({request})=>{const receipt=response(request);if(first){first=false;assert.equal(request.max_tokens,768);receipt.finish_reason=finish;receipt.usage.completion_tokens=600;receipt.usage.total_tokens=receipt.usage.prompt_tokens+600;}return receipt;}});const firstCall=result.calls[0];assert.equal(firstCall.reservation_tokens,8000);assert.equal(firstCall.usage.completion_tokens,600);assert.equal(result.unknown_usage,false);assert.equal(result.answers.find(a=>a.arm==='control').status,finish==='stop'?'completed':'blocked');assert.equal(result.answers.find(a=>a.arm==='treatment').status,'completed');assert.equal(result.usage.total_tokens,result.calls.reduce((n,c)=>n+c.usage.total_tokens,0));}
});
test('old384-note qualification cannot authorize768-note reservations',async()=>{const {planConfirmation:oldQualification}=await import('./adapter.mjs'),source=rows(),old=await oldQualification(source,meter);assert.throws(()=>generationPlan(source,old),/qualified-generation-budget/);});

test('v4 input-ceiling qualification budgets cannot authorize v5 full-window calls',async()=>{const {planConfirmation:v4Qualification}=await import('./adapter-note-v4.mjs'),source=rows(),old=await v4Qualification(source,meter);assert.throws(()=>generationPlan(source,old),/qualified-generation-budget/);});
test('fresh ingestion wire accepts7051input and rejects7233input before generation',async()=>{const {plan}=await fixture();for(const input of [7051,7233]){const result=await runPair({...pairOptions(plan.pairs[0]),meter:async request=>({input_tokens:request.max_tokens===768?input:100,wire_sha256:sha(request)}),generate:async({request})=>{const receipt=response(request);if(request.max_tokens===768)receipt.usage={prompt_tokens:input,completion_tokens:100,total_tokens:input+100};return receipt;}});assert.equal(result.answers.find(a=>a.arm==='control').status,input===7051?'completed':'blocked');assert.ok(result.calls.filter(c=>c.model_started).every(c=>c.reservation_tokens===8000));assert.equal(result.answers.find(a=>a.arm==='treatment').status,'completed');}});
