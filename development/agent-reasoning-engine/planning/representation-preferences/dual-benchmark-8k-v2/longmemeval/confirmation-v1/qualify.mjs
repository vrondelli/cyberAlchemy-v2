// Tokenizer-only full-history qualification. No generation endpoint is exposed.
// Open questions: PLAN.md. A successful plan is not a benchmark result.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {IDS,SOURCE,sha,loadSourceManifest,planConfirmation,wire,createTokenizerSession} from './adapter.mjs';
import {stable,postOnce} from '../../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
import {parseCredential} from '../../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/cli.mjs';
import {createSecretProviderRegistry,createSecretReference} from '../../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/secret-provider.mjs';
import {createSopsAgeProcessSecretProvider} from '../../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/sops-age-secret-provider.mjs';
import {assertStorageCapacity} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/storage-lifecycle.mjs';
const save=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx',mode:0o600});
export function sourceManifest(directory){
 const package_directory=resolve(directory),raw=readFileSync(join(directory,'acquisition.json')),receipt=JSON.parse(raw);
 const rows=IDS.map(question_id=>{const selected=receipt.selected.find(s=>s.question_id===question_id);assert.ok(selected);assert.equal(selected.path,`source-${question_id}.json`);const bytes=readFileSync(join(directory,selected.path));assert.equal(sha(bytes),selected.sha256);const row=JSON.parse(bytes);return {question_id,path:selected.path,sha256:selected.sha256,question_sha256:sha(row.question),question_date:row.question_date};});
 const manifest={schema:'longmemeval-full-s-source-manifest/v1',variant:SOURCE.filename,source_sha256:SOURCE.sha256,source_revision:SOURCE.revision,package_directory,acquisition_sha256:sha(raw),rows};
 loadSourceManifest(manifest);return manifest;
}
export function createMeter({exchange,record,before=()=>{}}){
 assert.equal(typeof exchange,'function');assert.equal(typeof record,'function');let calls=0,failed=false,active=false,pending=null;
 const execute=async(request,{signal}={})=>{
  assert.ok(!failed&&!active,'meter permanently stopped or concurrent');assert.ok(!signal?.aborted,'meter aborted');assert.ok(calls<256,'meter ceiling');
  assert.equal(stable(request),stable(wire(request.messages,request.max_tokens)),'exact supported wire required');
  before();active=true;const receipt={kind:'tokenizer',id:++calls,wire_sha256:sha(request),started_at:new Date().toISOString(),model_calls:0,dispatched:false};
  const payload={model:request.model,messages:request.messages},raw=stable(payload);receipt.tokenizer_request_sha256=sha(raw);
  try{
   await record({...receipt,status:'started'});receipt.dispatched=true;
   const response=await exchange(raw,sha(raw),{signal});receipt.http_status=response.status;
   assert.equal(response.status,200,'tokenizer HTTP failure');assert.ok(Number.isSafeInteger(response.payload?.usage?.prompt_tokens)&&response.payload.usage.prompt_tokens>=0,'invalid tokenizer usage');
   receipt.input_tokens=response.payload.usage.prompt_tokens;receipt.response_sha256=sha(response.payload);receipt.status='measured';receipt.finished_at=new Date().toISOString();await record(receipt);
   return {input_tokens:receipt.input_tokens,wire_sha256:receipt.wire_sha256};
  }catch(error){failed=true;receipt.status='failed';receipt.failure_code=error.code??'tokenizer-or-journal-failure';receipt.finished_at=new Date().toISOString();try{await record(receipt);}catch{receipt.persistence_failure=true;}throw Object.assign(Error(receipt.failure_code),{receipt});}
  finally{active=false;}
 };
 const meter=(...args)=>{const attempt=execute(...args);pending=attempt;return attempt;};
 meter.settle=async({timeout_ms=5000}={})=>{let timer;try{return await Promise.race([Promise.resolve(pending).then(()=>({settled:true}),()=>({settled:true})),new Promise(resolve=>{timer=setTimeout(()=>resolve({settled:false,reason:'audit-drain-deadline',timeout_ms}),timeout_ms);})]);}finally{clearTimeout(timer);}};return meter;
}
export function liveExchange(credential){
 const c=parseCredential(JSON.parse(readFileSync(credential))),provider=createSopsAgeProcessSecretProvider(c),registry=createSecretProviderRegistry({providers:[provider]}),reference=createSecretReference({provider_id:c.provider_id,locator:c.locator});
 return async(raw,digest,{signal})=>{let response,failure;await registry.consume({secret_ref:reference,consumer_id:'glm-flash-transport',request_digest:digest,consumer:async material=>{try{response=await postOnce(new URL('https://api.z.ai/api/paas/v4/tokenizer'),raw,{apiKey:Buffer.from(material).toString('utf8'),timeout_ms:30000,maximum_response_bytes:65536,signal});}catch(error){failure=error;}}});if(failure)throw failure;return response;};
}
export async function qualify(source,name){
 assert.match(name,/^qualification-r[1-9][0-9]*$/);const parent=import.meta.dirname,directory=join(parent,name);assert.ok(!existsSync(directory),'single-use qualification');
 const guard=()=>{assert.ok(existsSync('/mnt/c'));return assertStorageCapacity({outRoot:parent,hostRoot:'/mnt/c',minimumFreeBytes:8*1024**3,minimumHostFreeBytes:12*1024**3});};guard();
 const manifest=sourceManifest(source),loaded=loadSourceManifest(manifest);mkdirSync(directory,{mode:0o700});save(join(directory,'source-manifest.json'),manifest);
 const bindings=['qualify.mjs','adapter.mjs'].map(path=>({path,sha256:sha(readFileSync(join(parent,path)))}));save(join(directory,'code-bindings.json'),bindings);
 const receipts=[];let result,meter,budget;
 try{
  meter=createMeter({exchange:liveExchange('/home/vrondelli/.config/are/glm-flash-credential.json'),before:guard,record:r=>{save(join(directory,`${r.id}-${r.status}.json`),r);if(r.status!=='started')receipts.push(r);}});
  budget=createTokenizerSession(meter);const plan=await planConfirmation(loaded.rows,budget);guard();loadSourceManifest(manifest);for(const b of bindings)assert.equal(sha(readFileSync(join(parent,b.path))),b.sha256);
  result={...plan,source_bindings:loaded.bindings,receipts,code_bindings:bindings,campaign_goal_achieved:false,open_questions_ref:'../PLAN.md'};
 }catch(error){result={status:'failed',admitted:false,failure:error.receipt??{code:error.code??'qualification-failure',message:String(error.message)},receipts,model_generation_calls:0,campaign_goal_achieved:false,open_questions_ref:'../PLAN.md'};}
 finally{const settlement=await meter?.settle();if(result){result.tokenizer_budget=budget?.snapshot()??null;result.audit_settlement=settlement??null;if(settlement?.settled===false){result.status='failed-unresolved-tokenizer';result.admitted=false;}}}
 try{save(join(directory,'RESULTS.json'),result);}catch(error){throw Object.assign(error,{result,persistence_failure:true});}console.log(JSON.stringify({status:result.status,admitted:result.admitted,tokenizer_calls:receipts.length,model_calls:0,tasks:result.tasks?.map(t=>({question_id:t.question_id,original_history_tokens:t.original_history.input_tokens,chunks:t.ingestion.chunk_count,treatment_input_tokens:t.treatment.admission.input_tokens})),total_reservation:result.total_reservation}));return result;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const result=await qualify(process.argv[2],process.argv[3]);if(!result.admitted)process.exitCode=1;}
