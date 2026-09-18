// Tokenizer-only initial-envelope check. Explicit admission denial prevents dispatch.
// Open questions: README.md. No benchmark outcome is produced.
import {existsSync,mkdirSync,readFileSync,renameSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runPreparedTask} from './orchestrate-completion-readiness-v1.mjs';
import {assertStorageCapacity,cleanupCellSourceTrees} from './storage-lifecycle.mjs';
import {liveClientFactory} from './live-client.mjs';
import {classifyInputAvailability,unavailablePreflightRow} from './input-availability.mjs';
const [matrixPath,inventoryPath,credentialPath,outRoot,reportPath]=process.argv.slice(2);
if(!reportPath)throw Error('matrix inventory credential output-root report required');
mkdirSync(resolve(outRoot),{recursive:true});
const matrix=JSON.parse(readFileSync(matrixPath)),inventory=JSON.parse(readFileSync(inventoryPath));
const taskManifestPath=matrix.task_manifest_ref?resolve(matrix.task_manifest_ref):fileURLToPath(new URL('./development-tasks/manifest.json',import.meta.url)),taskRoot=dirname(taskManifestPath),tasks=JSON.parse(readFileSync(taskManifestPath));
const live=liveClientFactory({credential_path:credentialPath}),rows=[];
const representatives=matrix.tasks.map(task=>matrix.cells.find(cell=>cell.instance_id===task.instance_id));
if(representatives.some(cell=>!cell))throw Error('preflight task-cell binding missing');
const allowed=new Set(['token_budget_stopped','context_budget_stopped']);
const rowFromResult=(cell,outputPath,result)=>{
 const models=result.receipts?.filter(r=>r.kind==='model'&&r.dispatched)??[];
 if(models.length||!allowed.has(result.status))throw Error('preflight invalid zero-model result:'+cell.instance_id);
 return{instance_id:cell.instance_id,status:result.status,error:result.error,model_calls:0,tokenizer_receipts:result.receipts?.filter(r=>r.kind==='tokenizer'),admissions:result.admissions,output_path:outputPath};
};
for(const original of representatives){
 assertStorageCapacity({outRoot});
 const taskSpec=matrix.tasks.find(t=>t.instance_id===original.instance_id),availability=classifyInputAvailability(taskSpec);
 if(!availability.available){const row=unavailablePreflightRow(original,availability.reason);rows.push(row);console.log(JSON.stringify(row));continue;}
 const task=tasks.tasks.find(t=>t.instance_id===original.instance_id),repo=inventory.repositories.find(r=>r.instance_id===original.instance_id);
 const cell={...original,cell_id:`preflight-${original.cell_id}`};
 const outputPath=resolve(outRoot,cell.cell_id),resultPath=resolve(outputPath,'result.json'),completedPath=resolve(outputPath,'completed.json');let result,resumed=false;
 if(existsSync(resultPath)&&existsSync(completedPath)){const resultBytes=readFileSync(resultPath);result=JSON.parse(resultBytes);const completed=JSON.parse(readFileSync(completedPath));if(completed.status!==result.status||completed.result_sha256!==createHash('sha256').update(resultBytes).digest('hex'))throw Error('preflight completion mismatch:'+cell.instance_id);resumed=true;}
 else if(existsSync(outputPath))throw Error('preflight incomplete existing output:'+cell.instance_id);
 else result=await runPreparedTask({task_path:resolve(taskRoot,task.file),task_sha256:task.sha256,repository_cache:repo.cache_path,out:outputPath,cell,...live,model_dispatch_enabled:false});
 const row=rowFromResult(cell,outputPath,result);cleanupCellSourceTrees({cellRoot:outputPath});rows.push(row);console.log(JSON.stringify({instance_id:row.instance_id,status:row.status,error:row.error,model_calls:0,resumed}));
}
const report={status:rows.length===matrix.tasks.length&&rows.every(r=>[...allowed,'input_unavailable'].includes(r.status))?'passed-initial-envelope':'incomplete',rows,model_calls:0,claim_ceiling:'Tokenizer-only initial prompts plus explicit unavailable-input accounting. No model outcomes, retention proof or benchmark clearance.',authority_effect:'none'},bytes=JSON.stringify(report,null,2)+'\n',temporary=reportPath+'.tmp';
if(existsSync(reportPath)){const previous=JSON.parse(readFileSync(reportPath));if(previous.status!=='incomplete')throw Error('preflight report already terminal');writeFileSync(temporary,bytes,{flag:'wx'});renameSync(temporary,reportPath);}else writeFileSync(reportPath,bytes,{flag:'wx'});
