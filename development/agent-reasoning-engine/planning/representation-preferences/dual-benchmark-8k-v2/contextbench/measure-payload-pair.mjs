// Prospective public-derived pair, not historical replay. Open questions: PAYLOAD-PAIR-QUALIFICATION.md.
import {readFileSync,lstatSync,realpathSync,readdirSync} from 'node:fs';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {createGlmClient} from './packet-diversity-v1/transport-bounded-v3.mjs';
import {credentials} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/provider-study-v1/calibrate.mjs';
import {createNativeInvestigationDriver} from './independent-native-driver.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';import {guardStorage} from '../storage-host-small-run.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex'),need=(v,m)=>{if(!v)throw Error('payload-pair.'+m);};
function clientFactory({credential_path,persistence,signal,before_dispatch}){const {registry,reference}=credentials(credential_path);return createGlmClient({api_key_ref:reference,secret_registry:registry,persistence,signal,before_dispatch,maximum_requests:1,maximum_output_tokens:2048,maximum_model_retries:0,maximum_tokenizer_transport_attempts:1,request_budget:'holdout-window-v1',maximum_request_bytes:262144,token_margin:512,reasoning_effort:'low'});}
export async function measurePayloadPair(request,{create_client=clientFactory,host_guard=guardStorage}={}){
 const {rows:assigned,out_root,binding,credential_path,fixture_root,signal}=request;
 need(signal instanceof AbortSignal&&!signal.aborted&&Array.isArray(assigned)&&assigned.length===2&&assigned[0].id==='raw'&&assigned[1].id==='encoded','request');
 need(realpathSync(out_root)===out_root&&readdirSync(out_root).length===0,'fresh-output');
 const guard=createStageOutputGuard({root:out_root}),persistence=createStagePersistence({stage_root:out_root,stage_guard:guard});
 const check=()=>need(host_guard({binding,output:out_root,growth_reservation_bytes:32*1024**2}).admitted===true,'storage');
 const rows=assigned.map(r=>({id:r.id,status:'not-started',receipts:[]}));let dispatches=0;
 for(const [i,row]of assigned.entries()){
  let client,driver,prepared,prepare_error=null;
  try{
   check();need(!signal.aborted,'cancelled');
   const st=lstatSync(row.prompt_path);need(st.isFile()&&!st.isSymbolicLink()&&st.size<=262144,'prompt-file');
   const bytes=readFileSync(row.prompt_path);need(hash(bytes)===row.prompt_sha256,'prompt-drift');const prompt=JSON.parse(bytes);
   need(Array.isArray(prompt.messages)&&Array.isArray(prompt.tools)&&prompt.messages.every(m=>!Object.hasOwn(m,'reasoning_content')),'public-prompt');
   const tokenizer_sha=hash(stable({model:'glm-5.3-flash',messages:prompt.messages,tools:prompt.tools}));
   client=create_client({credential_path,persistence,signal,before_dispatch:async a=>{check();need(!signal.aborted&&a.kind==='tokenizer'&&a.request_sha256===tokenizer_sha&&dispatches<2,'tokenizer-only-dispatch');dispatches++;}});
   driver=createNativeInvestigationDriver({client,profile:{model:'glm-5.3-flash',output_cap:2048,reasoning_effort:'low'},scope:{request:'Prospective public-derived payload pair: '+row.id},fixture_root,directory:join(out_root,row.id),persistence,signal,before_dispatch:async()=>false});
   try{prepared=await driver.prepare({prompt:bytes.toString(),output_cap:2048});}catch(e){prepare_error=String(e.message);}
   await driver.close();driver=null;
   need(client.receipts.length===1&&client.receipts[0].kind==='tokenizer','one-tokenizer-only');const receipt=client.receipts[0];
   need(receipt.dispatched===true&&receipt.status===200&&!receipt.failure_code&&receipt.automatic_retries===0&&receipt.request_sha256===tokenizer_sha&&Number.isSafeInteger(receipt.input_tokens)&&receipt.input_tokens>0&&receipt.retained_reasoning_reservation===0,'receipt');
   const projected_tokens=receipt.input_tokens+512+2048;
   need(prepare_error===null||prepare_error==='recycling.fresh-context-too-large','prepare-error');
   need(projected_tokens<7999?!!prepared:prepare_error==='recycling.fresh-context-too-large','admission-correspondence');
   rows[i]={id:row.id,status:'measured',prompt_sha256:row.prompt_sha256,receipts:structuredClone(client.receipts),input_tokens:receipt.input_tokens,projected_tokens,within8k:projected_tokens<=8000,native_prepare_admitted:!!prepared,prepare_error};
  }catch(e){rows[i]={id:row.id,status:'failed',error:String(e.message),prepare_error,receipts:structuredClone(client?.receipts??[])};break;}
  finally{if(driver)try{await driver.close();}catch(e){rows[i]={...rows[i],status:'failed',close_error:String(e.message)};}}
  if(rows[i].status==='failed')break;
 }
 const complete=rows.every(r=>r.status==='measured'),models=rows.flatMap(r=>r.receipts).filter(r=>r.kind==='model').length;
 const report={schema:'are.public-payload-pair-result/v1',source_mode:'prospective-public-derived-pair',complete,rows,model_calls:models,tokenizer_dispatches:dispatches,diagnostic_passed:complete&&models===0&&rows[1].input_tokens<rows[0].input_tokens&&rows[1].within8k,relative_input_reduction:complete?1-rows[1].input_tokens/rows[0].input_tokens:null,historical_replay:false,runtime_admitted:false,quality_established:false,total_task_savings_established:false,open_questions_ref:'../PAYLOAD-PAIR-QUALIFICATION.md'};
 try{persistence.writeJson(join(out_root,'RESULTS.json'),report,{final:true});}catch(e){e.result={...report,complete:false,diagnostic_passed:false,persistence_failure:String(e.message)};throw e;}
 return report;
}
