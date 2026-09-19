// Additive v2 live wrapper; no freeze creation, providers or network on import.
// Open questions: SUCCESSOR-READINESS.md.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,lstatSync,openSync,fsyncSync,closeSync} from 'node:fs';
import {resolve,join,dirname,relative,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {hash,fixedDonors,loadDonor} from './prepare.mjs';
import {runPairs,runSlot} from './run-v2.mjs';
import {terminalSourceClosure} from './source-closure.mjs';
import {SUCCESSOR_FILES,storageGuard} from './preflight-v2.mjs';
import {verifyPreparationBindings} from './preflight.mjs';
import {projectObservationsToBase} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/source-map.mjs';
import {liveClientFactory} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/live-client.mjs';
import {accountReceipts} from '../discovery-v1/run.mjs';
const dir=import.meta.dirname,root=resolve(dir,'../../../../../../..'),discovery=resolve(dir,'../discovery-v1');
const read=p=>JSON.parse(readFileSync(p));
function save(path,value){
 const fd=openSync(path,'wx',0o600);try{writeFileSync(fd,JSON.stringify(value,null,2)+'\n');fsyncSync(fd);}finally{closeSync(fd);}
 const directory=openSync(dirname(path),'r');try{fsyncSync(directory);}finally{closeSync(directory);}
}
const need=(v,m)=>assert.ok(v,'packet-live-v2.'+m);
const absolute=p=>resolve(root,p);
function bound(binding){need(binding&&typeof binding.path==='string'&&/^[a-f0-9]{64}$/.test(binding.sha256),'binding-schema');const path=absolute(binding.path);need(lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink(),'regular-binding');need(hash(readFileSync(path))===binding.sha256,'binding-drift:'+binding.path);return path;}
function within(base,path){const part=relative(base,path);need(part!==''&&!part.startsWith('..'+sep)&&part!=='..'&&!part.startsWith(sep),'preparation-path');return path;}
/** Rechecks complete archived terminal delivery, not only ranked candidates. */
export function verifyJobSource(job){
 const {manifest,repoRoot,donor,closure,row}=job;
 need(manifest.commit===donor.task.base_commit&&manifest.schema_version==='are.packet-base/v1'&&manifest.bytes<=33554432,'source-manifest');
 need(hash(read(join(repoRoot,'.packet-base-manifest.json')))===hash(manifest),'base-manifest-drift');
 for(const file of manifest.files){const path=within(repoRoot,resolve(repoRoot,file.path)),stat=lstatSync(path);need(stat.isFile()&&!stat.isSymbolicLink()&&stat.size===file.bytes&&hash(readFileSync(path))===file.sha256,'source-file-drift');}
 const current=terminalSourceClosure(donor);need(hash(current)===hash(closure)&&current.source_set_sha256===row.source_set_sha256,'complete-terminal-closure-drift');
 const projected=projectObservationsToBase(current.reads,donor.snapshots,repoRoot);need(projected.projections.length===current.reads.length,'complete-source-projection');
 return {all_delivered_sources_projected:true,source_set_sha256:current.source_set_sha256,projected_reads:projected.projections.length};
}
export function verifyLiveFreezeV2(freezePath){
 const path=absolute(freezePath),freeze=read(path);
 need(freeze.schema==='are.packet-component-live-freeze/v2'&&freeze.approved===true,'explicit-freeze');
 for(const [key,value]of Object.entries({maximum_new_model_tokens:128000,maximum_pair_concurrency:2,planned_donors:8,planned_slots:16,model:'glm-5.3-flash'}))need(freeze[key]===value,'fixed-'+key);
 need(Array.isArray(freeze.bindings)&&freeze.bindings.length>0,'source-bindings');freeze.bindings.forEach(bound);
 for(const name of SUCCESSOR_FILES)need(freeze.bindings.some(b=>absolute(b.path)===join(dir,name)),'runtime-bound:'+name);
 need(Array.isArray(freeze.prospective_records)&&freeze.prospective_records.length>=2,'prospective-records');freeze.prospective_records.forEach(bound);
 need(freeze.continuity,'native-continuity-binding');bound(freeze.continuity);
 need(Array.isArray(freeze.gate_results)&&freeze.gate_results.length>0,'native-gate-results');for(const gate of freeze.gate_results){const receipt=read(bound(gate));need(typeof gate.success_field==='string'&&Object.hasOwn(gate,'success_value'),'native-gate-predicate');need(gate.success_value===true||['ok','passed','admitted','valid'].includes(gate.success_value),'positive-gate-predicate');need(gate.success_field.split('.').reduce((v,k)=>v?.[k],receipt)===gate.success_value,'native-gate-failed');}
 const review=read(bound(freeze.review));need(review.approved===true&&review.scope==='packet-component-live-v2','explicit-review');
 need(review.source_bindings?.some(b=>absolute(b.path)===join(dir,'live-v2.mjs')&&b.sha256===hash(readFileSync(join(dir,'live-v2.mjs')))),'reviewed-wrapper');review.source_bindings.forEach(bound);for(const name of SUCCESSOR_FILES)need(review.source_bindings.some(b=>absolute(b.path)===join(dir,name)),'reviewed-successor:'+name);
 const preparation=absolute(freeze.preparation_directory),resultPath=join(preparation,'RESULTS.json');need(hash(readFileSync(resultPath))===freeze.preparation_results_sha256,'preflight-result-binding');
 const result=read(resultPath);need(result.schema==='are.packet-preparation/v2'&&result.transport_settled===true&&result.all_delivered_sources_projected===true&&result.admitted===true&&result.status==='prepared-not-live-frozen'&&result.model_calls===0&&result.provider_generation_enabled===false&&result.source_integrity_verified===true&&result.rows?.length===8,'successful-preflight');
 verifyPreparationBindings(result.source_bindings);
 const config=read(join(discovery,'live-config.json')),fixed=fixedDonors(config),jobs=[];
 for(const [i,row]of result.rows.entries()){
  need(row.donor_id===fixed[i].donor_id&&row.task_id===fixed[i].task_id&&row.donor_arm===fixed[i].donor_arm,'fixed-prepared-donor');
  verifyPreparationBindings(row.donor_bindings);
  const preparedPath=within(preparation,absolute(row.prepared_path)),cell=dirname(preparedPath),manifestPath=join(cell,'source-manifest.json');
  need(hash(readFileSync(preparedPath))===row.prepared_sha256&&hash(readFileSync(manifestPath))===row.source_manifest_sha256,'prepared-source-binding');
  const prepared=read(preparedPath),manifest=read(manifestPath),repoRoot=join(cell,'base');
  need(hash(read(join(repoRoot,'.packet-base-manifest.json')))===hash(manifest),'base-manifest-binding');
  need(manifest.schema_version==='are.packet-base/v1'&&Array.isArray(manifest.files)&&manifest.bytes<=33554432,'source-manifest');
  for(const file of manifest.files){const source=within(repoRoot,resolve(repoRoot,file.path));need(lstatSync(source).isFile()&&!lstatSync(source).isSymbolicLink()&&readFileSync(source).length===file.bytes&&hash(readFileSync(source))===file.sha256,'source-file-drift');}
  const donor=loadDonor({config,discovery_root:discovery,...fixed[i]});need(hash(donor.bindings)===hash(row.donor_bindings),'donor-binding-equality');need(manifest.commit===donor.task.base_commit,'base-commit');
  need(prepared.admitted&&prepared.donor_id===donor.donor_id&&prepared.prefix_receipts_sha256===donor.prefix_receipts_sha256,'prepared-identity');
  need(['legacy','diversity'].every(v=>Number.isSafeInteger(prepared.bounds?.[v])&&prepared.bounds[v]<=8000&&prepared.bounds[v]<donor.cell.recycle_at),'prepared-window');
  const closurePath=join(cell,'source-closure.json');need(hash(readFileSync(closurePath))===row.source_closure_sha256,'source-closure-file-binding');
  const closure=read(closurePath),job={row,donor,prepared,manifest,repoRoot,closure};verifyJobSource(job);jobs.push(job);
 }
 return {freeze,freeze_path:path,freeze_sha256:hash(readFileSync(path)),preparation,config,fixed,jobs};
}
const zero=()=>accountReceipts([]);
/** All drains await actual runSlot promises; no fabricated client settlement API. */
export async function executeVerified({verified,output,create_factory=liveClientFactory,run_slot=runSlot,run_pairs=runPairs,verify_source=verifyJobSource,reverify=()=>verifyLiveFreezeV2(verified.freeze_path),guard=storageGuard,write=save,signals=process,timeout_ms=3600000,drain_timeout_ms=60000}){
 need(!existsSync(output),'single-use-directory');need(Number.isSafeInteger(timeout_ms)&&timeout_ms>0&&timeout_ms<=3600000,'deadline');
 need(Number.isSafeInteger(drain_timeout_ms)&&drain_timeout_ms>0&&drain_timeout_ms<=60000,'drain-deadline');need(verified.jobs?.length===8,'fixed-jobs');guard(output,{growth_reservation_bytes:536870912});mkdirSync(output,{recursive:true,mode:0o700});
 const controller=new AbortController(),slots=Array(16),entered=new Set(),pending=new Set(),clients=new Map(),admissions=new Map(),signal_events=[];let healthy=true,reserved=0,pool=null,failure=null,sourceVerified=false,timer,drainTimer,drainExpired=false;const activeJobs=new Map();let resolveDrain;const drainDeadline=new Promise(resolve=>{resolveDrain=resolve;});
 const beginDrain=()=>{if(!drainTimer)drainTimer=setTimeout(()=>{drainExpired=true;resolveDrain(null);},drain_timeout_ms);};
 const abort=reason=>{signal_events.push({reason,at:new Date().toISOString()});healthy=false;controller.abort();beginDrain();};
 const onInt=()=>abort('SIGINT'),onTerm=()=>abort('SIGTERM');signals.on('SIGINT',onInt);signals.on('SIGTERM',onTerm);
 const health={isHealthy:()=>healthy&&!controller.signal.aborted,report:async()=>{healthy=false;controller.abort();beginDrain();}};
 const fallback=(job,index,error)=>{
  const client=clients.get(index),receipts=client?.receipts??[],suffix=receipts.slice(Math.min(job.donor.receipts.length,receipts.length));
  let usage=accountReceipts(suffix);
  if(entered.has(index)&&!suffix.some(r=>r.kind==='model'&&r.dispatched!==false))usage={...usage,unknown_usage:true,unknown_usage_calls:usage.unknown_usage_calls+1,conservative_total_tokens:usage.conservative_total_tokens+8000};
  return {donor_id:job.donor.donor_id,variant:job.variant,status:'infrastructure-failure',infrastructure_failure:true,error:String(error?.message??'wrapper failure'),usage,unknown_usage:usage.unknown_usage,entered:entered.has(index),admission:admissions.get(index)??null,receipts,suffix_receipt_start:job.donor.receipts.length};
 };
 try{
  write(join(output,'started.json'),{schema:'are.packet-component-start/v2',freeze_sha256:verified.freeze_sha256,planned_slots:16,maximum_new_model_tokens:128000,started_at:new Date().toISOString()});
  timer=setTimeout(()=>abort('deadline'),timeout_ms);
  const factory=await create_factory({credential_path:verified.config.credential_path,signal:controller.signal});
  const poolWork=run_pairs({jobs:verified.jobs,health,model_dispatch_enabled:true,execute_slot:job=>{
   const index=job.donor.donor_index*2+(job.variant==='legacy'?0:1),directory=join(output,'pairs',job.donor.donor_id,job.variant);
   activeJobs.set(index,job);const operation=(async()=>{try{
    if(!health.isHealthy())return slots[index]={donor_id:job.donor.donor_id,variant:job.variant,status:'not-started-interruption',usage:zero(),unknown_usage:false};
    const create_client=async options=>{const client=await factory.create_client(options);clients.set(index,client);return client;};
    const result=await run_slot({...job,directory,create_client,storage_guard:guard,signal:controller.signal,before_model_dispatch:async admission=>{
     if(!health.isHealthy()||await job.before_model_dispatch(admission)===false)return false;
     guard(output);verify_source(job);need(admission?.dispatch?.output_reservation===2048&&admission.dispatch.projected_upper_bound<=8000,'native-admission-proof');admissions.set(index,structuredClone(admission.dispatch));need(!entered.has(index),'single-slot-dispatch');need(reserved+8000<=128000,'global-reservation');
     // Source validation is synchronous; recheck immediately before the native boundary.
     if(!health.isHealthy())return false;reserved+=8000;entered.add(index);return true;
    }});slots[index]=result;return result;
   }catch(error){healthy=false;controller.abort();beginDrain();const result=error.result??fallback(job,index,error);result.status='infrastructure-failure';result.infrastructure_failure=true;result.persistence_failure=Boolean(result.persistence_failure||error.persistence_failure||error.receipt?.persistence_failure);slots[index]=result;error.result=result;throw error;}})();
   pending.add(operation);operation.then(()=>{pending.delete(operation);activeJobs.delete(index);},()=>{pending.delete(operation);activeJobs.delete(index);});return operation;
  }});
  pool=await Promise.race([poolWork,drainDeadline]);
 }catch(error){healthy=false;controller.abort();beginDrain();failure=String(error.message);}
 finally{
  clearTimeout(timer);controller.abort();
  // Await real active slot/native generation promises, including receipt persistence
  // and recycler close. Native transport cancellation/deadlines own their lifetime.
  if(pending.size){beginDrain();await Promise.race([Promise.allSettled([...pending]),drainDeadline]);}clearTimeout(drainTimer);
 }
 try{
 if(drainExpired&&pending.size){failure??='native-slot-drain-deadline';for(const [index,job]of activeJobs)if(!slots[index])slots[index]=fallback(job,index,Error('native-slot-drain-deadline'));}
 const finalSlots=structuredClone(pool?.slots??verified.jobs.flatMap(job=>['legacy','diversity'].map(variant=>slots[job.donor.donor_index*2+(variant==='legacy'?0:1)]??{donor_id:job.donor.donor_id,variant,status:'not-started-wrapper-failure',usage:zero(),unknown_usage:false})));
 const usage=zero(),keys=['prompt_tokens','completion_tokens','total_tokens','model_calls','unknown_usage_calls','conservative_total_tokens'];
 for(let index=0;index<finalSlots.length;index++){
  let slot=finalSlots[index];const valid=keys.every(k=>Number.isSafeInteger(slot.usage?.[k])&&slot.usage[k]>=0)&&slot.usage.total_tokens===slot.usage.prompt_tokens+slot.usage.completion_tokens;
  if(!valid){failure??='malformed-slot-accounting';const donorJob=verified.jobs[Math.floor(index/2)],job={...donorJob,variant:index%2?'diversity':'legacy'};try{slot=fallback(job,index,Error('malformed-slot-accounting'));}catch{slot={donor_id:job.donor.donor_id,variant:job.variant,status:'infrastructure-failure',infrastructure_failure:true,entered:entered.has(index),admission:admissions.get(index)??null,usage:{...zero(),unknown_usage:entered.has(index),unknown_usage_calls:entered.has(index)?1:0,conservative_total_tokens:entered.has(index)?8000:0},unknown_usage:entered.has(index)};}finalSlots[index]=slot;}
  for(const key of keys)usage[key]+=slot.usage[key];usage.unknown_usage ||= Boolean(slot.unknown_usage);
 }

 try{reverify();for(const job of verified.jobs)verify_source(job);sourceVerified=true;}catch(error){failure??=String(error.message);healthy=false;}
 const logical_totals=Object.fromEntries(['legacy','diversity'].map(variant=>[variant,verified.jobs.reduce((n,j,i)=>n+(j.donor.prefix_usage?.total_tokens??0)+(finalSlots[i*2+(variant==='legacy'?0:1)].usage?.total_tokens??0),0)])),historical_prefix_tokens=verified.jobs.reduce((n,j)=>n+(j.donor.prefix_usage?.total_tokens??0),0);
 const seal={schema:'are.packet-component-generation-seal/v2',terminal:true,status:failure?'failed':signal_events.length?'interrupted':pool?.all_valid?'completed':'completed-with-failures',freeze_sha256:verified.freeze_sha256,planned_slots:16,slots:finalSlots,usage,reserved_tokens:reserved,maximum_new_model_tokens:128000,maximum_pair_concurrency:2,health_errors:pool?.health_errors??[],wrapper_error:failure,interruptions:signal_events,transport_settled:pending.size===0,drain_timeout_ms,drain_expired:drainExpired,settlement_basis:'Actual runSlot promises awaited through native receipts/cleanup, bounded after abort; unresolved calls remain unknown/failed, never declared settled.',source_integrity_verified:sourceVerified,logical_totals,historical_prefix_tokens,completed_at:new Date().toISOString(),campaign_goal_achieved:false,claim_ceiling:'Archived terminal component only; no fresh full-trajectory or15% claim.',open_questions_ref:'../SUCCESSOR-READINESS.md'};
 try{write(join(output,'GENERATION-SEAL.json'),seal);}catch(error){throw Object.assign(error,{generation_seal:seal,persistence_failure:true});}
 return seal;
 }finally{clearTimeout(timer);clearTimeout(drainTimer);signals.removeListener('SIGINT',onInt);signals.removeListener('SIGTERM',onTerm);}
}
export async function executeLiveV2(freezePath,name){need(/^live-v2-r[1-9][0-9]*$/.test(name),'single-use-name');const verified=verifyLiveFreezeV2(freezePath);return executeVerified({verified,output:join(dir,name)});}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const r=await executeLiveV2(process.argv[2],process.argv[3]);console.log(JSON.stringify({status:r.status,usage:r.usage,planned_slots:r.planned_slots,transport_settled:r.transport_settled}));if(r.status!=='completed')process.exitCode=1;}
