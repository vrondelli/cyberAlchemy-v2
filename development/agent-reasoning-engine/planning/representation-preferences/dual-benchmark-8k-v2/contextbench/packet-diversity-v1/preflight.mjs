// Explicit tokenizer-only preparation; never dispatches model generation.
// Open questions: PLAN.md. Each output directory is single-use, including failures.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync,appendFileSync} from 'node:fs';
import {join,resolve,dirname,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {fixedDonors,loadDonor,restoreVerifiedBase,preparePackets,hash} from './prepare.mjs';
import {measureNativeWire} from './run.mjs';
import {verifyFreeze} from '../discovery-v1/prepare-live.mjs';
import {liveClientFactory} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/live-client.mjs';
import {assertStorageCapacity} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/storage-lifecycle.mjs';
const dir=import.meta.dirname,root=resolve(dir,'../../../../../../..'),discovery=join(dir,'../discovery-v1');
const read=p=>JSON.parse(readFileSync(p)),save=(p,x)=>writeFileSync(p,JSON.stringify(x,null,2)+'\n',{flag:'wx',mode:0o600});
export function storageGuard(path){let parent=resolve(path);while(!existsSync(parent))parent=dirname(parent);assert.ok(existsSync('/mnt/c'),'host storage measurement required');return assertStorageCapacity({outRoot:parent,hostRoot:'/mnt/c',minimumFreeBytes:8*1024**3,minimumHostFreeBytes:12*1024**3});}
export function preparationBindings(){
 const frozen=verifyFreeze(),map=new Map(frozen.bindings.map(b=>[b.path,b]));
 for(const name of readdirSync(dir).filter(n=>n.endsWith('.mjs')||['PLAN.md','hypotheses.json','experiment.json'].includes(n))){const path=join(dir,name);map.set(relative(root,path),{path:relative(root,path),sha256:hash(readFileSync(path))});}
 return [...map.values()].sort((a,b)=>a.path.localeCompare(b.path));
}
export function verifyPreparationBindings(bindings){for(const b of bindings)assert.equal(hash(readFileSync(resolve(root,b.path))),b.sha256,b.path);}
export async function preflight(name){
 assert.match(name,/^preflight-r[1-9][0-9]*$/);const out=join(dir,name);assert.ok(!existsSync(out),'single-use preflight directory');storageGuard(dir);
 const bindings=preparationBindings(),config=read(join(discovery,'live-config.json')),controller=new AbortController();
 mkdirSync(out,{mode:0o700});save(join(out,'source-bindings.json'),bindings);
 const timer=setTimeout(()=>controller.abort(),900000),rows=[];let meter_calls=0,wire_number=0,error=null;
 const beforeMeter=()=>{assert.ok(!controller.signal.aborted,'preflight deadline');assert.ok(meter_calls<256,'preflight tokenizer-call ceiling');storageGuard(out);meter_calls++;};
 try{
  const factory=liveClientFactory({credential_path:config.credential_path,signal:controller.signal});
  for(const item of fixedDonors(config)){
   const donor=loadDonor({config,discovery_root:discovery,...item}),cellRoot=join(out,donor.donor_id),base=join(cellRoot,'base');mkdirSync(cellRoot,{mode:0o700});
   const restored=restoreVerifiedBase({donor,directory:base,storage_guard:storageGuard});save(join(cellRoot,'source-manifest.json'),restored);
   const indexClient=await factory.create_client({cell:donor.cell,task:donor.task,record_event:event=>appendFileSync(join(cellRoot,'index-tokenizer.jsonl'),JSON.stringify(event)+'\n',{mode:0o600})});
   const wires=[];
   const prepared=await preparePackets({donor,repoRoot:base,
    measure_tokens:async text=>{beforeMeter();return indexClient.measure_index(text);},
    measure_wire:async({variant,prompt})=>{beforeMeter();const directory=join(cellRoot,'wire-'+(++wire_number)+'-'+variant);const measured=await measureNativeWire({donor,prompt,variant,directory,repoRoot:base,create_client:factory.create_client,storage_guard:storageGuard,signal:controller.signal});assert.equal(measured.result.usage.model_calls,0);wires.push({variant,directory:relative(root,directory),projected_upper_bound:measured.projected_upper_bound,usage:measured.result.usage});return measured.projected_upper_bound;}});
   assert.ok(prepared.admitted,'paired preparation rejected');save(join(cellRoot,'prepared.json'),prepared);
   rows.push({donor_id:donor.donor_id,task_id:item.task_id,donor_arm:item.donor_arm,source_bytes:restored.bytes,matched_handles:prepared.pair.matched_handles,bounds:prepared.bounds,wire_preflights:wires,index_tokenizer_receipts:indexClient.index_receipts,prepared_path:relative(root,join(cellRoot,'prepared.json')),prepared_sha256:hash(readFileSync(join(cellRoot,'prepared.json'))),source_manifest_sha256:hash(readFileSync(join(cellRoot,'source-manifest.json'))),donor_bindings:donor.bindings});
  }
  verifyPreparationBindings(bindings);for(const row of rows)verifyPreparationBindings(row.donor_bindings);assert.equal(rows.length,8);
 }catch(e){error=String(e.message);}finally{clearTimeout(timer);controller.abort();}
 const result={status:error?'failed':'prepared-not-live-frozen',admitted:!error,error,rows,model_calls:0,maximum_context:8000,maximum_tokenizer_invocations:256,tokenizer_invocations:meter_calls,source_bindings:bindings,source_integrity_verified:!error,provider_generation_enabled:false,campaign_goal_achieved:false,open_questions_ref:'../PLAN.md'};
 save(join(out,'RESULTS.json'),result);console.log(JSON.stringify({status:result.status,rows:rows.length,tokenizer_invocations:meter_calls,error}));if(error)throw Error(error);return result;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)await preflight(process.argv[2]);
