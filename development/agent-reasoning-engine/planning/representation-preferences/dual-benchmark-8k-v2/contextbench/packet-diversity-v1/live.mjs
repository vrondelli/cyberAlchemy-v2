// Bounded archived component execution only. Open questions: PLAN.md.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,lstatSync} from 'node:fs';
import {resolve,join,dirname,relative,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {hash,fixedDonors,loadDonor} from './prepare.mjs';
import {runPairs,runSlot} from './run.mjs';
import {storageGuard,verifyPreparationBindings} from './preflight.mjs';
import {liveClientFactory} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/live-client.mjs';
const dir=import.meta.dirname,root=resolve(dir,'../../../../../../..'),discovery=resolve(dir,'../discovery-v1');
const read=p=>JSON.parse(readFileSync(p)),save=(p,x)=>writeFileSync(p,JSON.stringify(x,null,2)+'\n',{flag:'wx',mode:0o600});
const need=(v,m)=>assert.ok(v,'packet-live.'+m);
const absolute=p=>resolve(root,p);
function bound(binding){need(binding&&typeof binding.path==='string'&&/^[a-f0-9]{64}$/.test(binding.sha256),'binding-schema');const path=absolute(binding.path);need(lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink(),'regular-binding');need(hash(readFileSync(path))===binding.sha256,'binding-drift:'+binding.path);return path;}
function within(base,path){const part=relative(base,path);need(part!==''&&!part.startsWith('..'+sep)&&part!=='..'&&!part.startsWith(sep),'preparation-path');return path;}
export function verifyLiveFreeze(freezePath){
 const path=absolute(freezePath),freeze=read(path);
 need(freeze.schema==='are.packet-component-live-freeze/v1'&&freeze.approved===true,'explicit-freeze');
 for(const [key,value]of Object.entries({maximum_new_model_tokens:128000,maximum_pair_concurrency:2,planned_donors:8,planned_slots:16,model:'glm-5.3-flash'}))need(freeze[key]===value,'fixed-'+key);
 need(Array.isArray(freeze.bindings)&&freeze.bindings.length>0,'source-bindings');freeze.bindings.forEach(bound);
 for(const name of ['live.mjs','run.mjs','prepare.mjs','preflight.mjs'])need(freeze.bindings.some(b=>absolute(b.path)===join(dir,name)),'runtime-bound:'+name);
 need(Array.isArray(freeze.prospective_records)&&freeze.prospective_records.length>=2,'prospective-records');freeze.prospective_records.forEach(bound);
 need(freeze.continuity,'native-continuity-binding');bound(freeze.continuity);
 need(Array.isArray(freeze.gate_results)&&freeze.gate_results.length>0,'native-gate-results');for(const gate of freeze.gate_results){const receipt=read(bound(gate));need(typeof gate.success_field==='string'&&Object.hasOwn(gate,'success_value'),'native-gate-predicate');need(gate.success_value===true||['ok','passed','admitted','valid'].includes(gate.success_value),'positive-gate-predicate');need(gate.success_field.split('.').reduce((v,k)=>v?.[k],receipt)===gate.success_value,'native-gate-failed');}
 const review=read(bound(freeze.review));need(review.approved===true&&review.scope==='packet-component-live','explicit-review');
 need(review.source_bindings?.some(b=>absolute(b.path)===join(dir,'live.mjs')&&b.sha256===hash(readFileSync(join(dir,'live.mjs')))),'reviewed-wrapper');review.source_bindings.forEach(bound);
 const preparation=absolute(freeze.preparation_directory),resultPath=join(preparation,'RESULTS.json');need(hash(readFileSync(resultPath))===freeze.preparation_results_sha256,'preflight-result-binding');
 const result=read(resultPath);need(result.admitted===true&&result.status==='prepared-not-live-frozen'&&result.model_calls===0&&result.provider_generation_enabled===false&&result.source_integrity_verified===true&&result.rows?.length===8,'successful-preflight');
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
  jobs.push({row,donor,prepared,manifest,repoRoot});
 }
 return {freeze,freeze_path:path,freeze_sha256:hash(readFileSync(path)),preparation,config,fixed,jobs};
}
const zero=()=>({prompt_tokens:0,completion_tokens:0,total_tokens:0,model_calls:0,unknown_usage_calls:0,conservative_total_tokens:0,unknown_usage:false});
export async function executeLive(freezePath,name){
 need(/^live-r[1-9][0-9]*$/.test(name),'single-use-name');const output=join(dir,name);need(!existsSync(output),'single-use-directory');
 const verified=verifyLiveFreeze(freezePath);storageGuard(dir);mkdirSync(output,{mode:0o700});
 const controller=new AbortController(),slots=Array(16),enteredSlots=new Set();let healthy=true,reserved=0,pool=null,failure=null,sourceVerified=true;
 save(join(output,'started.json'),{freeze_sha256:verified.freeze_sha256,planned_slots:16,maximum_new_model_tokens:128000,started_at:new Date().toISOString()});
 const timer=setTimeout(()=>{healthy=false;controller.abort();},3600000);
 const health={isHealthy:()=>healthy&&!controller.signal.aborted,report:async()=>{healthy=false;}};
 try{
  const factory=liveClientFactory({credential_path:verified.config.credential_path,signal:controller.signal});
  pool=await runPairs({jobs:verified.jobs,health,model_dispatch_enabled:true,execute_slot:async job=>{
   const index=job.donor.donor_index*2+(job.variant==='legacy'?0:1),directory=join(output,'pairs',job.donor.donor_id,job.variant);
   try{
    const result=await runSlot({...job,directory,create_client:factory.create_client,storage_guard:storageGuard,signal:controller.signal,before_model_dispatch:async()=>{
     if(!health.isHealthy())return false;storageGuard(output);need(!enteredSlots.has(index),'single-slot-dispatch');need(reserved+8000<=128000,'global-token-reservation');reserved+=8000;enteredSlots.add(index);return true;
    }});slots[index]=result;return result;
   }catch(error){healthy=false;const unknown=Boolean(error.unknown_usage)||(!error.result&&enteredSlots.has(index));slots[index]=error.result??{donor_id:job.donor.donor_id,variant:job.variant,status:'infrastructure-failure',error:String(error.message),usage:{...zero(),unknown_usage:unknown,unknown_usage_calls:unknown?1:0,conservative_total_tokens:unknown?8000:0},unknown_usage:unknown,persistence_failure:true};error.result=slots[index];throw error;}
  }});
 }catch(error){healthy=false;failure=String(error.message);}finally{clearTimeout(timer);controller.abort();}
 const finalSlots=pool?.slots??verified.jobs.flatMap(job=>['legacy','diversity'].map(variant=>slots[job.donor.donor_index*2+(variant==='legacy'?0:1)]??{donor_id:job.donor.donor_id,variant,status:'not-started-wrapper-failure',usage:zero(),unknown_usage:false}));
 const usage=zero();for(const slot of finalSlots){for(const key of ['prompt_tokens','completion_tokens','total_tokens','model_calls','unknown_usage_calls','conservative_total_tokens'])usage[key]+=slot.usage?.[key]??0;usage.unknown_usage ||= Boolean(slot.unknown_usage);}
 try{verifyLiveFreeze(freezePath);}catch(error){failure??=String(error.message);healthy=false;sourceVerified=false;}
 const seal={schema:'are.packet-component-generation-seal/v1',terminal:true,status:failure?'failed':pool?.all_valid?'completed':'completed-with-failures',freeze_sha256:verified.freeze_sha256,planned_slots:16,slots:finalSlots,usage,reserved_tokens:reserved,maximum_new_model_tokens:128000,maximum_pair_concurrency:2,health_errors:pool?.health_errors??[],wrapper_error:failure,source_integrity_verified:sourceVerified,logical_totals:pool?.logical_totals??null,historical_prefix_tokens:pool?.historical_prefix_tokens??null,completed_at:new Date().toISOString(),campaign_goal_achieved:false,claim_ceiling:'Archived terminal component only; no fresh full-trajectory or 15% claim.',open_questions_ref:'../PLAN.md'};
 try{save(join(output,'GENERATION-SEAL.json'),seal);}catch(error){error.generation_seal=seal;error.persistence_failure=true;throw error;}return seal;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const result=await executeLive(process.argv[2],process.argv[3]);console.log(JSON.stringify({status:result.status,usage:result.usage}));}
