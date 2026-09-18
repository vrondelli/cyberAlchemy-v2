// Execute one frozen prefix through its first held terminal candidate.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {verifyFreeze} from './verify-freeze.mjs';
import {liveClientFactory} from './live-client.mjs';
import {runPreparedTask} from './orchestrate-outcome-pressure-review-v1.mjs';
const [freezePath,cellId,credentialPath,outRoot]=process.argv.slice(2);
if(!outRoot)throw Error('freeze prefix-cell-id credential output-root required');
const {freeze,matrix}=verifyFreeze(freezePath),cell=matrix.prefixes?.find(candidate=>candidate.cell_id===cellId);
if(!cell||cell.cell_kind!=='shared-prefix')throw Error('prefix cell not in frozen matrix');
const taskManifest=JSON.parse(readFileSync(freeze.task_manifest_ref)),task=taskManifest.tasks.find(candidate=>candidate.instance_id===cell.instance_id);
const inventory=JSON.parse(readFileSync(freeze.repository_inventory_ref)),repository=inventory.repositories.find(candidate=>candidate.instance_id===cell.instance_id);
const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),1800000);
try{
  const result=await runPreparedTask({task_path:resolve(freeze.task_directory,task.file),task_sha256:task.sha256,repository_cache:repository.cache_path,out:resolve(outRoot,cellId),cell,
    ...liveClientFactory({credential_path:credentialPath,signal:abort.signal}),pause_before_terminal_candidate:true});
  console.log(JSON.stringify({cell_id:cellId,status:result.status,error:result.error,model_calls:result.receipts?.filter(receipt=>receipt.kind==='model'&&receipt.dispatched).length,
    model_tokens:result.receipts?.filter(receipt=>receipt.kind==='model').reduce((sum,receipt)=>sum+(receipt.input_tokens??0)+(receipt.output_tokens??0),0),boundary:result.shared_prefix_boundary??null}));
}finally{clearTimeout(timer);}
