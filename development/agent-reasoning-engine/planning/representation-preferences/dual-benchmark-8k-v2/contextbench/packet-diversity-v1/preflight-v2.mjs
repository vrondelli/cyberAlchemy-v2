// Additive request-complete preparation. Frozen predecessors remain unchanged.
// Open questions: SUCCESSOR-READINESS.md. No effects on module import.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,appendFileSync,openSync,fsyncSync,closeSync} from 'node:fs';
import {join,resolve,relative,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {fixedDonors,loadDonor,preparePackets,hash} from './prepare.mjs';
import {restoreRequestCompleteBase} from './source-closure.mjs';
import {measureNativeWire} from './run-v2.mjs';
import {preparationBindings,verifyPreparationBindings} from './preflight.mjs';
import {guardStorage} from '../../storage-host.mjs';
import {liveClientFactory} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/live-client.mjs';
const dir=import.meta.dirname,root=resolve(dir,'../../../../../../..'),discovery=resolve(dir,'../discovery-v1');
export function storageGuard(output=dir,{growth_reservation_bytes=0}={}){return guardStorage({binding:JSON.parse(readFileSync(resolve(dir,'../../storage-host-binding.json'))),output,growth_reservation_bytes});}
function save(path,value){
 const fd=openSync(path,'wx',0o600);try{writeFileSync(fd,JSON.stringify(value,null,2)+'\n');fsyncSync(fd);}finally{closeSync(fd);}
 const directory=openSync(dirname(path),'r');try{fsyncSync(directory);}finally{closeSync(directory);}
}
export const SUCCESSOR_FILES=Object.freeze(['preflight-v2.mjs','live-v2.mjs','run-v2.mjs','source-closure.mjs','prepare.mjs','preflight.mjs','terminal-evidence.mjs','ranking.mjs','paired-packets.mjs','../../storage-host.mjs','../../storage-host-binding.json','../../cleanup-20260918/HOST-STORAGE-CORRECTION.md']);
export function successorBindings(){const map=new Map(preparationBindings().map(b=>[b.path,b]));for(const name of SUCCESSOR_FILES){const path=join(dir,name);map.set(relative(root,path),{path:relative(root,path),sha256:hash(readFileSync(path))});}return [...map.values()].sort((a,b)=>a.path.localeCompare(b.path));}
/** Native operations are awaited directly: abort then drain the actual in-flight call. */
export async function runPreparation({output,config,bindings,create_factory=liveClientFactory,load_donor=loadDonor,restore_base=restoreRequestCompleteBase,prepare_packets=preparePackets,measure_wire=measureNativeWire,verify_bindings=verifyPreparationBindings,guard=storageGuard,write=save,signals=process,timeout_ms=900000}){
 assert.ok(!existsSync(output),'single-use successor preparation');assert.ok(Number.isSafeInteger(timeout_ms)&&timeout_ms>0&&timeout_ms<=900000);guard(output,{growth_reservation_bytes:536870912});mkdirSync(output,{recursive:true,mode:0o700});
 const controller=new AbortController(),rows=[],receipts=[];let invocation=0,wireNumber=0,failure=null,interruption=null,phase='setup',timer;
 const abort=reason=>{interruption??=reason;controller.abort();};const onInt=()=>abort('SIGINT'),onTerm=()=>abort('SIGTERM');signals.on('SIGINT',onInt);signals.on('SIGTERM',onTerm);
 const before=()=>{assert.ok(!controller.signal.aborted,'preparation interrupted');assert.ok(invocation<256,'shared tokenizer ceiling');guard(output);invocation++;};
 try{
  write(join(output,'source-bindings.json'),bindings);timer=setTimeout(()=>abort('deadline'),timeout_ms);
  const factory=await create_factory({credential_path:config.credential_path,signal:controller.signal});phase='preparation';
  for(const fixed of fixedDonors(config)){
   assert.ok(!controller.signal.aborted,'preparation interrupted');const donor=load_donor({config,discovery_root:discovery,...fixed}),cell=join(output,fixed.donor_id),base=join(cell,'base');mkdirSync(cell,{mode:0o700});
   const complete=restore_base({donor,directory:base,storage_guard:guard});assert.equal(complete.all_delivered_sources_projected,true);
   write(join(cell,'source-manifest.json'),complete.restored);write(join(cell,'source-closure.json'),complete.closure);
   const index=await factory.create_client({cell:donor.cell,task:donor.task,record_event:event=>{receipts.push(event);appendFileSync(join(cell,'index-tokenizer.jsonl'),JSON.stringify(event)+'\n',{mode:0o600});}});
   const wires=[];const prepared=await prepare_packets({donor,repoRoot:base,measure_tokens:async text=>{before();return await index.measure_index(text);},measure_wire:async({variant,prompt})=>{before();const directory=join(cell,'wire-'+(++wireNumber)+'-'+variant);const measured=await measure_wire({donor,prompt,variant,directory,repoRoot:base,create_client:factory.create_client,storage_guard:guard,signal:controller.signal});assert.equal(measured.result.usage.model_calls,0);wires.push({variant,directory:relative(root,directory),projected_upper_bound:measured.projected_upper_bound,usage:measured.result.usage});return measured.projected_upper_bound;}});
   assert.ok(prepared.admitted,'paired preparation rejected');write(join(cell,'prepared.json'),prepared);
   rows.push({...fixed,source_bytes:complete.restored.bytes,matched_handles:prepared.pair.matched_handles,bounds:prepared.bounds,wire_preflights:wires,index_tokenizer_receipts:index.index_receipts,prepared_path:relative(root,join(cell,'prepared.json')),prepared_sha256:hash(readFileSync(join(cell,'prepared.json'))),source_manifest_sha256:hash(readFileSync(join(cell,'source-manifest.json'))),source_closure_sha256:hash(readFileSync(join(cell,'source-closure.json'))),source_set_sha256:complete.closure.source_set_sha256,all_delivered_sources_projected:true,donor_bindings:donor.bindings});
  }
  assert.ok(!controller.signal.aborted,'preparation interrupted');verify_bindings(bindings);for(const row of rows)verify_bindings(row.donor_bindings);assert.equal(rows.length,8);
 }catch(error){failure={phase,message:String(error.message)};}finally{clearTimeout(timer);controller.abort();signals.removeListener('SIGINT',onInt);signals.removeListener('SIGTERM',onTerm);}
 const result={schema:'are.packet-preparation/v2',status:failure||interruption?'failed':'prepared-not-live-frozen',admitted:!failure&&!interruption,rows,error:failure,interruption,tokenizer_invocations:invocation,maximum_tokenizer_invocations:256,model_calls:0,source_bindings:bindings,source_integrity_verified:!failure&&!interruption,all_delivered_sources_projected:rows.length===8&&rows.every(r=>r.all_delivered_sources_projected),provider_generation_enabled:false,transport_settled:true,settlement_basis:'Every invoked native factory/client/measurement promise was awaited; no synthetic settlement API.',partial_index_receipts:receipts,campaign_goal_achieved:false,open_questions_ref:'../SUCCESSOR-READINESS.md'};
 try{write(join(output,'RESULTS.json'),result);}catch(error){throw Object.assign(error,{result,persistence_failure:true});}return result;
}
export async function preflightV2(name){assert.match(name,/^preflight-v2-r[1-9][0-9]*$/);return runPreparation({output:join(dir,name),config:JSON.parse(readFileSync(join(discovery,'live-config.json'))),bindings:successorBindings()});}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const r=await preflightV2(process.argv[2]);console.log(JSON.stringify({status:r.status,rows:r.rows.length,tokenizer_invocations:r.tokenizer_invocations,model_calls:0}));if(!r.admitted)process.exitCode=1;}
