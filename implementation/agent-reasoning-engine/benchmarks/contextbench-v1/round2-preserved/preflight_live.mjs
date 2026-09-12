// Tokenizer-only initial-envelope check. Zero cumulative model tokens prevents dispatch.
// Open questions: README.md. No benchmark outcome is produced.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {runPreparedTask} from './orchestrate.mjs';
import {liveClientFactory} from './live-client.mjs';
const [matrixPath,inventoryPath,credentialPath,outRoot,reportPath]=process.argv.slice(2);
if(!reportPath)throw Error('matrix inventory credential output-root report required');
const matrix=JSON.parse(readFileSync(matrixPath)),inventory=JSON.parse(readFileSync(inventoryPath));
const taskRoot=new URL('./development-tasks/',import.meta.url),tasks=JSON.parse(readFileSync(new URL('manifest.json',taskRoot)));
const live=liveClientFactory({credential_path:credentialPath}),rows=[];
for(const original of matrix.cells.filter(c=>c.arm==='baseline')){
 const task=tasks.tasks.find(t=>t.instance_id===original.instance_id),repo=inventory.repositories.find(r=>r.instance_id===original.instance_id);
 const cell={...original,cell_id:`preflight-${original.cell_id}`,limits:{...original.limits,total_tokens:0}};
 const result=await runPreparedTask({task_path:new URL(task.file,taskRoot),task_sha256:task.sha256,repository_cache:repo.cache_path,out:resolve(outRoot,cell.cell_id),cell,...live});
 const models=result.receipts?.filter(r=>r.kind==='model'&&r.dispatched)??[];
 if(models.length)throw Error('preflight unexpected model dispatch');
 const row={instance_id:cell.instance_id,status:result.status,error:result.error,model_calls:models.length,tokenizer_receipts:result.receipts?.filter(r=>r.kind==='tokenizer'),admissions:result.admissions,output_path:resolve(outRoot,cell.cell_id)};rows.push(row);console.log(JSON.stringify({instance_id:row.instance_id,status:row.status,error:row.error,model_calls:0}));
 if(result.status!=='token_budget_stopped')break;
}
writeFileSync(reportPath,JSON.stringify({status:rows.length===matrix.tasks.length&&rows.every(r=>r.status==='token_budget_stopped')?'passed-initial-envelope':'incomplete',rows,model_calls:0,claim_ceiling:'Tokenizer-only initial prompts. No model outcomes, retention proof or benchmark clearance.',authority_effect:'none'},null,2)+'\n',{flag:'wx'});
