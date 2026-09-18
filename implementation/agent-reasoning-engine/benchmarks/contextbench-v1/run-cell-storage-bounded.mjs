// Execute one exact frozen development cell. No restart or replacement policy.
// Open questions: README.md. Scoring runs separately from the agent checkout.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {verifyFreeze} from './verify-freeze.mjs';
import {liveClientFactory} from './live-client.mjs';
import {runPreparedTask} from './orchestrate.mjs';
import {cleanupCellSourceTrees} from './storage-lifecycle.mjs';
const [freezePath,cellId,credentialPath,outRoot]=process.argv.slice(2);
if(!outRoot)throw Error('freeze cell-id credential output-root required');
const {freeze,matrix}=verifyFreeze(freezePath),cell=matrix.cells.find(c=>c.cell_id===cellId);
if(!cell)throw Error('cell not in frozen matrix');
const taskManifest=JSON.parse(readFileSync(freeze.task_manifest_ref)),task=taskManifest.tasks.find(t=>t.instance_id===cell.instance_id);
const inventory=JSON.parse(readFileSync(freeze.repository_inventory_ref)),repository=inventory.repositories.find(t=>t.instance_id===cell.instance_id);
const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),1800000),out=resolve(outRoot,cellId);
try{
 const result=await runPreparedTask({task_path:resolve(freeze.task_directory,task.file),task_sha256:task.sha256,repository_cache:repository.cache_path,out,cell,...liveClientFactory({credential_path:credentialPath,signal:abort.signal})});
 let scoring=null;
 if(result.native_export){
  const scored=spawnSync(freeze.python,[freeze.scorer,'--upstream',freeze.upstream,'--gold',resolve(freeze.upstream,'data/full.parquet'),'--pred',resolve(out,'prediction.json'),'--cache',freeze.scoring_cache,'--out',resolve(out,'native-score.json')],{encoding:'utf8',timeout:180000,maxBuffer:2000000});
  scoring={exit_code:scored.status,error:scored.error?.code??null,stderr:scored.stderr};
  writeFileSync(resolve(out,'scoring-status.json'),JSON.stringify(scoring,null,2)+'\n',{flag:'wx'});
 }
 console.log(JSON.stringify({cell_id:cellId,status:result.status,error:result.error,export_error:result.export_error,model_calls:result.receipts?.filter(r=>r.kind==='model'&&r.dispatched).length,scoring}));
}finally{clearTimeout(timer);cleanupCellSourceTrees({cellRoot:out,requireCompleted:false});}
