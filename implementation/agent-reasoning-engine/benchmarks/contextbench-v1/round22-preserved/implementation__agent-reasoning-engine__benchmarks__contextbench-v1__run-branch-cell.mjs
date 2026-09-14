// Execute and score one exact frozen Round 15 branch from its shared prefix.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {verifyFreeze} from './verify-freeze.mjs';
import {liveClientFactory} from './live-client.mjs';
import {runPreparedBranch} from './orchestrate.mjs';
const [freezePath,cellId,credentialPath,outRoot]=process.argv.slice(2);
if(!outRoot)throw Error('freeze branch-cell-id credential output-root required');
const {freeze,matrix}=verifyFreeze(freezePath),cell=matrix.branches?.find(candidate=>candidate.cell_id===cellId);
if(!cell||cell.cell_kind!=='branch')throw Error('branch cell not in frozen matrix');
const taskManifest=JSON.parse(readFileSync(freeze.task_manifest_ref)),task=taskManifest.tasks.find(candidate=>candidate.instance_id===cell.instance_id);
const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),1800000);
try{
  const out=resolve(outRoot,cellId),result=await runPreparedBranch({task_path:resolve(freeze.task_directory,task.file),task_sha256:task.sha256,prefix_root:resolve(outRoot,cell.prefix_cell_id),out,cell,
    ...liveClientFactory({credential_path:credentialPath,signal:abort.signal})});
  let scoring=null;
  if(result.native_export){const scored=spawnSync(freeze.python,[freeze.scorer,'--upstream',freeze.upstream,'--gold',resolve(freeze.upstream,'data/full.parquet'),'--pred',resolve(out,'prediction.json'),'--cache',freeze.scoring_cache,'--out',resolve(out,'native-score.json')],{encoding:'utf8',timeout:180000,maxBuffer:2000000});scoring={exit_code:scored.status,error:scored.error?.code??null,stderr:scored.stderr};writeFileSync(resolve(out,'scoring-status.json'),JSON.stringify(scoring,null,2)+'\n',{flag:'wx'});}
  console.log(JSON.stringify({cell_id:cellId,status:result.status,error:result.error,model_calls:result.receipts?.filter(receipt=>receipt.kind==='model'&&receipt.dispatched).length,
    cumulative_model_tokens:result.receipts?.filter(receipt=>receipt.kind==='model').reduce((sum,receipt)=>sum+(receipt.input_tokens??0)+(receipt.output_tokens??0),0),prefix_model_tokens:result.prefix_model_tokens,scoring}));
}finally{clearTimeout(timer);}

