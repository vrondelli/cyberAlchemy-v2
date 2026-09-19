// Bounded archive-compatibility replay. No providers, scorer, gold, or v1 mutations.
// Caller-selected export probes are NOT model predictions. Open questions: REPLAY.md.
import {readFileSync,writeFileSync,readdirSync,existsSync,mkdirSync,mkdtempSync,rmSync,statfsSync,statSync} from 'node:fs';
import {join,resolve,dirname,relative} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {EXPANDED,buildTerminalEvidenceFromCaptures,projectDeliveredEvidence,diagnoseTerminalEvidence,selectTerminalEvidenceSubmission} from './terminal-evidence.mjs';
import {bindDelivery,stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {diagnoseSourceSelection} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/provenance-validator.mjs';
import {exportCapturedContext} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/receipt-export.mjs';
const here=import.meta.dirname,root=resolve(here,'../../../../../..'),v1=resolve(here,'../../dual-benchmark-8k-v1/contextbench');
const hash=x=>createHash('sha256').update(x).digest('hex'),fileHash=p=>hash(readFileSync(p));
const read=p=>{if(statSync(p).size>64*1024*1024)throw Error('bounded replay file exceeds64MiB');return JSON.parse(readFileSync(p));};
const output=join(here,'REPLAY.json');if(existsSync(output))throw Error('replay receipt already exists; no overwrite');
const configPath=join(v1,'config.json'),failurePath=join(v1,'FAILURE-ANALYSIS.json'),config=read(configPath),failures=read(failurePath);
const fixedInputs=[configPath,failurePath,join(here,'terminal-evidence.mjs')].map(path=>({path:relative(root,path),sha256:fileHash(path)}));
const diskRoot='/home/vrondelli/.local/share/are/dual-benchmark-8k-v2-replay';mkdirSync(diskRoot,{recursive:true});
const space=statfsSync(diskRoot);if(space.bsize*space.bavail<5_000_000_000)throw Error('replay disk headroom below5GB');
const work=mkdtempSync(join(diskRoot,'owned-clone-')),commands=[],cases=[],checkouts=[];
const git=(cwd,args)=>{
  const r=spawnSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],{cwd,encoding:'utf8',timeout:180000,maxBuffer:8_000_000});
  commands.push({cwd,argv:['git','-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],status:r.status,stdout:(r.stdout??'').slice(0,3000),stderr:(r.stderr??'').slice(-3000)});
  if(r.status!==0)throw Error('replay git failed:'+args.join(' '));return r.stdout.trim();
};
let passed=false,error=null;
try{
  for(const taskId of [...new Set(failures.cases.map(c=>c.task_id))]){
    const taskConfig=config.tasks.find(t=>t.id===taskId),task=read(taskConfig.task_path),repoRoot=join(work,taskId);
    if(git(taskConfig.repository_cache,['remote','get-url','origin'])!==task.repo_url)throw Error('cache origin mismatch');
    git(work,['clone','--no-local','--no-checkout','--',taskConfig.repository_cache,repoRoot]);git(repoRoot,['checkout','--detach',taskConfig.base_commit]);
    const head=git(repoRoot,['rev-parse','HEAD']),tree=git(repoRoot,['rev-parse','HEAD^{tree}']);if(head!==taskConfig.base_commit)throw Error('pinned revision mismatch');
    checkouts.push({task_id:taskId,cache:taskConfig.repository_cache,pinned_commit:head,pinned_tree:tree,created_path:repoRoot,exact_native_clone:true,removed:false});
    for(const original of failures.cases.filter(c=>c.task_id===taskId)){
      const resultPath=resolve(root,original.source.result_path),directory=dirname(resultPath),resultHash=fileHash(resultPath),r=read(resultPath);
      if(resultHash!==original.source.result_sha256)throw Error('v1 result hash changed before replay');
      const snapshotFiles=readdirSync(join(directory,'snapshots')).filter(n=>n.endsWith('.json')).sort().map(n=>join(directory,'snapshots',n));
      const snapshotManifest=snapshotFiles.map(path=>({path:relative(root,path),sha256:fileHash(path)})),snapshotDigest=hash(stable(snapshotManifest));
      const snapshots=snapshotFiles.map(read),delivery=bindDelivery(r);if(delivery.unmapped.length)throw Error('archive contains unmapped delivery');
      const projected=projectDeliveredEvidence({reads:delivery.read_observations,snapshots,repoRoot,problem_statement:task.problem_statement});
      const packet=await buildTerminalEvidenceFromCaptures({captures:r.captures,receipts:r.receipts,snapshots,repoRoot,problem_statement:task.problem_statement,version:EXPANDED,max_handles:32,max_state_bytes:8192,max_state_tokens:4096,
        measure_tokens:async text=>Math.ceil(Buffer.byteLength(text)/4)});
      const response=r.response_captures.at(-1),call=response.public_response.message.tool_calls?.find(c=>c.function.name==='submit_context_selection'),raw=call?call.function.arguments:response.public_response.message.content;
      const originalDiagnostic=diagnoseSourceSelection({raw,reads:delivery.read_observations,snapshots,repoRoot});
      const originalCodes=originalDiagnostic.issues.map(i=>i.code),expectedCodes=original.diagnostic.issues.map(i=>i.code);
      if(stable(originalCodes)!==stable(expectedCodes)||originalDiagnostic.ok!==original.diagnostic.ok)throw Error('original sealed diagnostic no longer reproduces');
      let probe={status:'not-applicable-no-ready-presentation'},originalAcceptanceRejected=false,mutationRejected=false;
      if(packet.status==='ready'){
        try{selectTerminalEvidenceSubmission({packet,captures:r.captures,receipts:r.receipts,response_capture:response,snapshots,repoRoot});}catch(e){if(!String(e.message).includes('presentation-not-in-terminal-request'))throw e;originalAcceptanceRejected=true;}
        if(!originalAcceptanceRejected)throw Error('original response incorrectly accepted under newly generated handles');
        const syntheticRaw=stable({summary:'OFFLINE CALLER-SELECTED STRUCTURAL PROBE; NOT A MODEL PREDICTION',context_handles:packet.private.bindings.map(b=>b.handle)});
        const selection=diagnoseTerminalEvidence(syntheticRaw,packet);if(!selection.ok)throw Error('candidate schema probe failed');
        const native=diagnoseSourceSelection({raw:stable({summary:selection.value.summary,context_read_ids:selection.value.context_read_ids}),reads:delivery.read_observations,snapshots,repoRoot});if(!native.ok)throw Error('candidate native provenance probe failed');
        const exported=exportCapturedContext({captures:r.captures,receipts:r.receipts,task,final_read_ids:selection.value.context_read_ids,source_snapshots:snapshots},repoRoot);
        const changed=structuredClone(packet);changed.private.bindings[0].read_id='f'.repeat(64);
        try{diagnoseTerminalEvidence(syntheticRaw,changed);}catch(e){if(!String(e.message).includes('presentation-integrity'))throw e;mutationRejected=true;}
        if(!mutationRejected)throw Error('private binding mutation accepted');
        probe={status:'native-schema-provenance-and-export-passed',selection_origin:'caller-selected engineering probe, not model output',selected_read_ids:selection.value.context_read_ids.length,predicted_files:exported.prediction.traj_data.pred_files.length,projected_final_events:exported.sidecar.final_event_ids.length,prediction_sha256:hash(stable(exported.prediction)),native_score:null,actual_model_prediction:false};
      }
      if(fileHash(resultPath)!==resultHash||hash(stable(snapshotFiles.map(path=>({path:relative(root,path),sha256:fileHash(path)}))))!==snapshotDigest)throw Error('v1 evidence mutated during replay');
      cases.push({task_id:taskId,arm:original.arm,stage:original.stage,source_result:relative(root,resultPath),source_result_sha256:resultHash,snapshot_count:snapshots.length,snapshot_manifest_sha256:snapshotDigest,original_status:r.status,
        original_diagnostic_reproduced:true,original_diagnostic_codes:originalCodes,delivered_reads:delivery.read_observations.length,projection_eligible_unique:projected.eligible.length,projection_excluded:projected.excluded.length,exclusion_counts:Object.fromEntries([...new Set(projected.excluded.map(x=>x.reason))].map(reason=>[reason,projected.excluded.filter(x=>x.reason===reason).length])),
        historical_read_ids_visible_in_original_terminal:original.historically_delivered_ids_occurring_in_terminal_prompt,candidate_status:packet.status,rendered_handles:packet.private.bindings.length,omitted_eligible:packet.fit.omitted_eligible,rendered_state_bytes:packet.fit.rendered_state_bytes,provider_token_measurement:null,offline_fit_note:'bytes/4 fixture estimate only; no provider tokenizer or actual8K admission was performed',
        added_state_contains_full_read_ids:packet.model?projected.delivered_read_ids.some(id=>stable(packet.model).includes(id)):false,original_response_rejected_under_new_presentation:originalAcceptanceRejected,private_mapping_mutation_rejected:mutationRejected,export_probe:probe,v1_result_and_snapshots_unchanged:true});
    }
    if(git(repoRoot,['status','--porcelain'])!=='')throw Error('read-only replay source changed');
    rmSync(repoRoot,{recursive:true,force:false});checkouts.at(-1).removed=true;
  }
  for(const input of fixedInputs)if(fileHash(resolve(root,input.path))!==input.sha256)throw Error('bound input changed during replay');
  passed=true;
}catch(e){error=String(e.message);}
finally{
  rmSync(work,{recursive:true,force:true});
  writeFileSync(output,JSON.stringify({schema_version:'dual8k.contextbench-archive-replay/v1',passed,error,cases,checkouts,commands,bound_inputs:fixedInputs,maximum_concurrent_clones:1,temporary_root_removed:!existsSync(work),model_calls:0,provider_tokenizer_calls:0,gold_access:false,native_scorer_calls:0,v1_files_modified:[],actual_new_model_selections:0,claim_ceiling:'Archived delivery/projector compatibility and caller-selected structural native export only; no model quality, perfect-score, token-efficiency or live8K-admission result.',authority_effect:'none',open_questions_ref:'REPLAY.md'},null,2)+'\n',{flag:'wx'});
}
if(!passed)throw Error(error);console.log(JSON.stringify({passed,cases:cases.map(c=>({task:c.task_id,arm:c.arm,delivered:c.delivered_reads,eligible:c.projection_eligible_unique,rendered:c.rendered_handles,omitted:c.omitted_eligible,probe:c.export_probe.status})),model_calls:0}));
