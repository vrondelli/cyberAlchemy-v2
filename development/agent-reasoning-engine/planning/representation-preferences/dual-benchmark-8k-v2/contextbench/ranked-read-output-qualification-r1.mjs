// Scripted source-output qualification only; no model response or delivery credit.
// Open questions: RANKED-READ-PROJECTION-R1.md.
import {createHash} from 'node:crypto';import {join} from 'node:path';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {rankedReadTool,validateRankedReadResult} from './ranked-read-acquisition-tool-r2.mjs';
import {admitToolBatch} from './ranked-read-admission-r1.mjs';
import {createNativeInvestigationDriver} from './investigation-budget-native-driver.mjs';
import {providerAttemptHealth} from './provider-attempt-health.mjs';
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
const need=(v,m)=>{if(!v)throw Error('ranked-output-qualification.'+m);};
const modelCount=c=>[...(c?.receipts??[]),...(c?.index_receipts??[])].filter(r=>r?.kind==='model').length;
export async function qualifyRankedOutputRequest({task,cell,initial_wire,evidence,repoRoot,out,persistence,signal,create_client,before_measure}){
 need(signal instanceof AbortSignal&&!signal.aborted,'active-signal');
 need(cell?.comparison_arm==='ranked-read-acquisition'&&cell.instance_id===task.instance_id&&cell.context_limit===8000&&cell.limits?.output_cap===2048&&cell.limits.total_tokens===96000&&cell.limits.maximum_calls===96&&cell.provider_profile?.token_margin===512,'fixed-cell');
 need(Array.isArray(initial_wire?.messages)&&Array.isArray(initial_wire.tools)&&initial_wire.messages.some(m=>m.role==='user'&&m.content===task.problem_statement),'initial-context');
 const offered=initial_wire.tools.filter(t=>t.function?.name==='search');need(offered.length===1&&stable(offered[0])===stable(rankedReadTool),'ranked-tool-schema');
 validateRankedReadResult({...evidence,args:JSON.parse(evidence.call.function.arguments)});
 let client,driver,probes=0;
 const record=e=>persistence.append(join(out,'events.jsonl'),stable(e)+'\n');
 try{
  need(await before_measure()===true,'storage-admission');client=await create_client({cell,task,signal,record_event:record});
  need(Array.isArray(client.receipts)&&Array.isArray(client.index_receipts),'receipt-families');
  driver=createNativeInvestigationDriver({client,profile:{model:client.model,reasoning_effort:cell.provider_profile.reasoning_effort,output_cap:2048},scope:{request:task.problem_statement,instance_id:task.instance_id,cell_id:cell.cell_id,cell_sha256:hash(cell),qualification:'scripted-ranked-output-only'},fixture_root:repoRoot,directory:join(out,'state'),persistence,signal,before_dispatch:async()=>false,persist:record});
  // measurePrompt already includes the transport's two-token guard: an
  // aggregate envelope of 8000 is a native projected request of 7998.
  const admitted=await admitToolBatch({messages:initial_wire.messages,tools:initial_wire.tools,assistant:{role:'assistant',content:null,tool_calls:[evidence.call]},results:[evidence.result],ranked_evidence:new Map([[evidence.call.id,evidence]]),archive:async value=>record({kind:'qualification-scripted-output',value,delivery:'unconfirmed',model_generated:false}),limit:8000,measure:async prompt=>{need(++probes<=4,'probe-limit');need(await before_measure()===true,'storage-admission');return driver.measurePrompt(prompt);}});
  need(admitted.status==='admitted','request-not-admitted');
  const prepared=await driver.prepare({prompt:admitted.prompt,output_cap:2048});
  const projected=prepared.input_upper_bound+2048;
  need(prepared.prompt===admitted.prompt&&prepared.request_sha256===hash(bodyForReceipt(admitted.prompt,prepared.profile))&&Number.isSafeInteger(projected)&&projected<7999,'native-envelope');
  await driver.close();driver=null;
  need(modelCount(client)===0&&client.receipts.length>=1&&client.receipts.length<=5&&client.receipts.every(r=>r?.kind==='tokenizer')&&client.index_receipts.every(r=>r?.kind==='index-tokenizer'),'tokenizer-only');
  need(providerAttemptHealth([...client.receipts,...client.index_receipts]).healthy,'provider-health');
  const wire=JSON.parse(admitted.prompt),tokenizer_request_sha256=hash({model:client.model,messages:wire.messages,tools:wire.tools});
  need(client.receipts.some(r=>r.status===200&&r.dispatched===true&&r.request_sha256===tokenizer_request_sha256&&r.input_tokens+512+2048===projected),'request-receipt');
  const returned=admitted.outputs[0].ok===true?admitted.outputs[0].output.observations.length:0;
  const report={schema:'are.ranked-read-output-qualification/v1',qualified:true,source_output_visible:returned>0,returned_windows:returned,raw_returned_windows:evidence.result.output.observations.length,scripted_call_sha256:hash(evidence.call),raw_result_sha256:hash(evidence.result),model_calls:0,cell_sha256:hash(cell),prompt:wire,projected_tokens:projected,tokenizer_request_sha256,request_sha256:prepared.request_sha256,probes,receipts:structuredClone(client.receipts),index_receipts:structuredClone(client.index_receipts),scope:'Scripted representative tool output; not model generation or confirmed source delivery. Zero retained windows do not qualify useful ranked-source exposure.',live_generation_admitted:false};
  persistence.writeJson(join(out,'RESULTS.json'),report);return report;
 }catch(error){error.result={qualified:false,model_calls:modelCount(client),probes,receipts:structuredClone(client?.receipts??[]),index_receipts:structuredClone(client?.index_receipts??[]),error:String(error.message)};throw error;}
 finally{if(driver)await driver.close();}
}
