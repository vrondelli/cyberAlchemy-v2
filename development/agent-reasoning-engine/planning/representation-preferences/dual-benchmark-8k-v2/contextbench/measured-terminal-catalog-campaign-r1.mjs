// Additive ranked-source-hints production candidate. Open questions: MEASURED-TERMINAL-CATALOG-PROTOCOL-R2.md.
// Candidate-only descendant of comparison-compact-campaign-runner.mjs. Open questions: CANDIDATE-ONLY-PLAN.md.
// Cooperative campaign composition; external process supervision remains required. Open questions: COMPARISON-CAMPAIGN-RUNNER-R2.md.
import {readFileSync,readdirSync,realpathSync,lstatSync,existsSync,openSync,closeSync,fstatSync,readSync,constants} from 'node:fs';
import {resolve,join,relative,isAbsolute,sep} from 'node:path';import {createHash} from 'node:crypto';
import {verifyMeasuredTerminalCatalogSchedule as verifyComparisonSchedule} from './measured-terminal-catalog-schedule-r1.mjs';
import {runComparisonQueue} from './measured-terminal-catalog-queue-r1.mjs';
import {createComparisonOutcomeStore} from './measured-terminal-catalog-outcome-store-r1.mjs';
import {runComparisonArm} from './measured-terminal-catalog-arm-r1.mjs';
import {comparisonLiveClientFactory} from './measured-terminal-catalog-live-client-r1.mjs';
import {createComparisonEvidenceManifest,reconcileComparisonCampaignEvidence} from './measured-terminal-catalog-evidence-manifest-r1.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const need=(v,m)=>{if(!v)throw Error('comparison-campaign.'+m);};
function pinRun(root,arm){
 need(realpathSync(root)===root,'run-canonical');let total=0;const files={};
 for(const name of ['source-index.json','started.json','result.json','completed.json','events.jsonl','state/glm-transport-ledger.json',...(arm==='current-are'?[]:['state/driver-binding.json'])]){
  let path=root;for(const part of name.split('/')){path=join(path,part);need(!lstatSync(path).isSymbolicLink(),'pin-symlink');}
  need(lstatSync(path).isFile(),'pin-file-kind');const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
  try{const stat=fstatSync(fd);need(stat.isFile()&&stat.size<=128*1024*1024-total,'pin-size');total+=stat.size;
   const digest=createHash('sha256'),buffer=Buffer.alloc(65536);let offset=0;
   while(offset<stat.size){const n=readSync(fd,buffer,0,Math.min(buffer.length,stat.size-offset),offset);need(n>0,'pin-short-read');digest.update(buffer.subarray(0,n));offset+=n;}
   need(fstatSync(fd).size===stat.size,'pin-size-changed');files[name]=digest.digest('hex');
  }finally{closeSync(fd);}
 }
 return files;
}
export async function runComparisonCampaign({schedule,sources,outcome_root,runs_root,metadata_root,source_root,outcome_persistence,run_persistence,metadata_persistence,credential_path,signal,admit_campaign,admit_source,before_model_dispatch}, {execute_arm=runComparisonArm,create_factory=comparisonLiveClientFactory}={}){
 need(signal instanceof AbortSignal&&typeof admit_campaign==='function'&&typeof admit_source==='function'&&typeof before_model_dispatch==='function','callbacks');
 verifyComparisonSchedule({schedule,...sources});
 const roots=[outcome_root,runs_root,metadata_root,source_root].map(path=>resolve(path));
 const within=(a,b)=>{const r=relative(a,b);return r===''||(r!=='..'&&!r.startsWith('..'+sep)&&!isAbsolute(r));};
 need(roots.every((a,i)=>roots.every((b,j)=>i===j||(!within(a,b)&&!within(b,a)))),'root-overlap');
 [outcome_root,runs_root,metadata_root,source_root]=roots;
 for(const root of roots.slice(0,3))need(realpathSync(root)===root&&readdirSync(root).length===0,'fresh-evidence-roots');
 need(!existsSync(source_root),'fresh-source-root');
 for(const p of [outcome_persistence,run_persistence,metadata_persistence])need(p&&typeof p.writeJson==='function','persistence');
 need(await admit_campaign({schedule,roots:{outcome_root,runs_root,metadata_root,source_root}})===true,'campaign-admission');
 const config=JSON.parse(readFileSync(sources.config_path)),store=createComparisonOutcomeStore({root:outcome_root,schedule,sources,persistence:outcome_persistence});
 const entries=schedule.slots.map(s=>({slot_id:s.slot_id,files:null,transport_identity:null})),binding_failures=[];
 let terminal;
 try{terminal=await runComparisonQueue({schedule,sources,signal,persist:store.persist,execute:async({slot,signal:sharedSignal})=>{
  const run=join(runs_root,String(slot.sequence).padStart(2,'0'));let client,result,failure;
  try{
   const factory=create_factory({credential_path,signal:sharedSignal,persistence:run_persistence,before_dispatch:before_model_dispatch});
   result=await execute_arm({config,task_id:slot.task_id,arm:slot.arm,signal:sharedSignal,out:run,evidence_root:runs_root,source_out:join(source_root,String(slot.sequence).padStart(2,'0')),persistence:run_persistence,admit_source,before_model_dispatch,
    create_client:async args=>{client=await factory.create_client(args);return client;},measure_index_tokens:factory.measure_index_tokens});
  }catch(error){failure=error;result=error.result;}
  if(client){try{need(/^[a-f0-9]{64}$/.test(client.identity),'client-identity');entries[slot.sequence]={slot_id:slot.slot_id,transport_identity:client.identity,files:pinRun(run,slot.arm)};}
   catch(error){binding_failures.push({slot_id:slot.slot_id,error:String(error.message)});failure??=Object.assign(error,{result});}}
  else if(!failure)failure=Object.assign(Error('comparison-campaign.missing-client'),{result});
  if(failure)throw failure;return result;
 }});}catch(error){error.campaign_evidence={terminal:error.result,entries,binding_failures};throw error;}
 try{
  const sealed=store.seal(terminal),manifest=createComparisonEvidenceManifest({schedule,sources,outcome_seal_sha256:sealed.seal_sha256,entries});
  metadata_persistence.writeJson(join(metadata_root,'EVIDENCE-MANIFEST.json'),manifest);
  const manifest_sha256=hash(stable(manifest));need(hash(readFileSync(join(metadata_root,'EVIDENCE-MANIFEST.json')))===manifest_sha256,'saved-manifest');
  const reconciliation=reconcileComparisonCampaignEvidence({outcome_root,runs_root,schedule,sources,manifest,expected_manifest_sha256:manifest_sha256});
  const result={schema:'are.candidate-only-campaign-run/v1',outcome_seal_sha256:sealed.seal_sha256,manifest_sha256,terminal_status:terminal.status,binding_failures,reconciliation,outer_process_settlement_pending:true,native_scoring_pending:true,benchmark_cleared:false};
  metadata_persistence.writeJson(join(metadata_root,'RESULTS.json'),result,{final:true});
  return {...result,result_file_sha256:hash(readFileSync(join(metadata_root,'RESULTS.json')))};
 }catch(error){error.campaign_evidence={terminal,entries,binding_failures};throw error;}
}
