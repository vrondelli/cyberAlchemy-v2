// Tokenizer-only first-request qualification. Open questions: COMPARISON-REQUEST-QUALIFICATION-R3.md.
import {readFileSync,lstatSync} from 'node:fs';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {verifyComparisonSchedule} from './comparison-schedule.mjs';
import {runComparisonArm} from './comparison-repair-arm.mjs';
import {comparisonLiveClientFactory} from './comparison-live-client.mjs';
import {createComparisonGenerationStorage} from './comparison-generation-storage-r2.mjs';
import {providerAttemptHealth} from './provider-attempt-health.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex'),need=(v,m)=>{if(!v)throw Error('comparison-request-qualification.'+m);};
const receiptFamilies=(client,result)=>({client:client?.receipts??[],client_index:client?.index_receipts??[],result:result?.receipts??[],result_index:result?.index_tokenizer_receipts??[]});
const modelCount=(client,result)=>Math.max(0,...Object.values(receiptFamilies(client,result)).map(rs=>Array.isArray(rs)?rs.filter(r=>r?.kind==='model').length:0));
export async function qualifyComparisonRequests(request,{execute=runComparisonArm,create_factory=comparisonLiveClientFactory,create_storage=createComparisonGenerationStorage}={}){
 const {schedule,sources,outcome_root,runs_root,metadata_root,source_root,credential_path,binding,signal}=request;verifyComparisonSchedule({schedule,...sources});need(signal instanceof AbortSignal&&!signal.aborted,'active-signal');
 const controller=new AbortController(),cancel=()=>controller.abort();
 const storage=create_storage({schedule,sources,outcome_root,runs_root,metadata_root,source_root,binding}),config=JSON.parse(readFileSync(sources.config_path));signal.addEventListener('abort',cancel,{once:true});
 const rows=schedule.slots.map(slot=>({slot_id:slot.slot_id,status:'not-started',qualified:false}));let next=0;
 async function worker(){while(next<12){const i=next++,slot=schedule.slots[i];if(controller.signal.aborted)continue;let client,result,error;
  try{
   storage.check();const out=join(runs_root,String(i).padStart(2,'0')),factory=create_factory({credential_path,signal:controller.signal,persistence:storage.run_persistence,before_dispatch:()=>{storage.check();return true;}});
   try{result=await execute({config,task_id:slot.task_id,arm:slot.arm,signal:controller.signal,out,evidence_root:runs_root,source_out:join(source_root,String(i).padStart(2,'0')),persistence:storage.run_persistence,admit_source:storage.admit_source,create_client:async args=>{client=await factory.create_client(args);return client;},measure_index_tokens:factory.measure_index_tokens,model_dispatch_enabled:false,before_model_dispatch:async()=>false});}
   catch(e){result=e.result;error=String(e.message);}
   need(client&&Array.isArray(client.receipts),'client-receipts');for(const rs of Object.values(receiptFamilies(client,result))){need(Array.isArray(rs),'receipt-array');need(rs.every(r=>r?.kind!=='model'),'model-call-forbidden');}
   const journalPath=join(out,'events.jsonl'),journalStat=lstatSync(journalPath);need(journalStat.isFile()&&!journalStat.isSymbolicLink()&&journalStat.size<=8*1024**2,'journal-file');const journal=readFileSync(journalPath,'utf8');need(Buffer.byteLength(journal)<=8*1024**2,'journal-bound');const events=journal.trim().split('\n').filter(Boolean).map(JSON.parse);
   need(!error&&(slot.arm==='current-are'?result?.status==='token_budget_stopped'&&events.some(e=>e.kind==='dispatch-admission'&&e.admission?.reason==='token-budget.preflight-disabled'):result?.status==='run_error'&&result.error==='independent-native.shared-health-stop'),'expected-disabled-stop');
   need(!result.infrastructure_failure&&!result.persistence_failure&&(!result.persistence_failures||(Array.isArray(result.persistence_failures)&&result.persistence_failures.length===0))&&!result.accounting_requires_reconciliation&&!result.unknown_usage&&!result.phase_state?.unknown_calls,'infrastructure-or-accounting-failure');
   need(result.provider_healthy!==false&&result.provider_health?.healthy!==false,'provider-health-failure');
   for(const receipts of [client.receipts,client.index_receipts??[],result.receipts??[],result.index_tokenizer_receipts??[]])need(providerAttemptHealth(receipts).healthy,'provider-attempt-failure');
   const captures=events.flatMap(e=>e.kind==='request-capture'?[e.capture]:Array.isArray(e.captures)?e.captures:[]);need(captures.length===1,'single-initial-capture');const capture=captures[0];need(typeof capture.prompt==='string'&&hash(capture.prompt)===capture.prompt_sha256,'capture-hash');
   const wire=JSON.parse(capture.prompt),body=stable({model:'glm-5.3-flash',messages:wire.messages,tools:wire.tools}),digest=hash(body);
   const receipts=client.receipts.filter(r=>r.kind==='tokenizer'&&r.request_sha256===digest);need(receipts.length===1,'single-tokenizer-receipt');const receipt=receipts[0];need(receipt.status===200&&receipt.dispatched===true&&Number.isSafeInteger(receipt.input_tokens)&&receipt.input_tokens>=0,'successful-tokenizer');
   const projected=receipt.input_tokens+slot.cell.provider_profile.token_margin+slot.cell.limits.output_cap;need(Number.isSafeInteger(projected)&&projected<=8000,'initial-window');
   const prompt_path=join(metadata_root,'prompts',String(i).padStart(2,'0')+'.json');storage.metadata_persistence.writeJson(prompt_path,JSON.parse(body));need(hash(readFileSync(prompt_path))===digest,'saved-prompt');
   rows[i]={slot_id:slot.slot_id,status:'qualified',qualified:true,task_sha256:slot.task_sha256,cell_sha256:slot.cell_sha256,prompt_path,prompt_sha256:digest,events_path:journalPath,events_sha256:hash(journal),source_capture_sha256:capture.prompt_sha256,receipt,projected_tokens:projected,model_calls:0,episode_status:result?.status??null,episode_error:result?.error??null,expected_dispatch_denial:error??null};
  }catch(e){rows[i]={...rows[i],status:'failed',receipts:structuredClone(client?.receipts??[]),index_receipts:structuredClone(client?.index_receipts??[]),receipt_families:structuredClone(receiptFamilies(client,result)),infrastructure_failure:result?.infrastructure_failure??null,error:String(e.message),episode_status:result?.status??null,episode_error:result?.error??error??null,model_calls:modelCount(client,result)};controller.abort();}
 }}
 try{await Promise.all([worker(),worker()]);const report={schema:'are.comparison-request-qualification/v1',schedule_sha256:schedule.schedule_sha256,qualified:rows.every(r=>r.qualified),model_calls:rows.reduce((n,r)=>n+(r.model_calls??0),0),rows,workers:2,dispatch_mode:'model-disabled',scope:'Initial request only; subsequent requests require native measured admission.',live_generation_admitted:false};try{storage.metadata_persistence.writeJson(join(metadata_root,'RESULTS.json'),report,{final:true});}
 catch(cause){const error=new Error('comparison-request-qualification.final-persistence-failure',{cause});error.result={...report,qualified:false,persistence_failure:String(cause.message),status:'incomplete'};throw error;}return report;}
 finally{signal.removeEventListener('abort',cancel);}
}
