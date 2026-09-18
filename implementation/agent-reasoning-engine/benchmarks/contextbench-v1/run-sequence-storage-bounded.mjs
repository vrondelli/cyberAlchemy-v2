// Sequential dispatcher for an already frozen matrix. No automatic model retries.
// Open questions: README.md. Existing incomplete directories require explicit diagnosis.
import {existsSync,mkdirSync,openSync,closeSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {verifyFreeze} from './verify-freeze.mjs';
import {validateDispatchCompletion} from './dispatch-validation.mjs';
import {assertStorageCapacity,cleanupCellSourceTrees,pruneCompletedCellSourceTrees} from './storage-lifecycle.mjs';
const [freezePath,credentialPath,outRoot]=process.argv.slice(2);
if(!outRoot)throw Error('freeze credential output-root required');
const {matrix}=verifyFreeze(freezePath),root=resolve(outRoot),driver=resolve(root,'sequence');
mkdirSync(driver,{recursive:true});
pruneCompletedCellSourceTrees(root);
for(const cell of matrix.cells){
 assertStorageCapacity({outRoot:root});
 verifyFreeze(freezePath);
 const out=resolve(root,cell.cell_id),completed=resolve(out,'completed.json');
 if(!existsSync(completed)){
  if(existsSync(out))throw Error('sequence.incomplete-existing-cell:'+cell.cell_id);
  const fd=openSync(resolve(driver,cell.cell_id+'.log'),'wx',0o600);
  console.log(JSON.stringify({cell_id:cell.cell_id,status:'starting'}));
  const run=spawnSync(process.execPath,[fileURLToPath(new URL('./run-cell-storage-bounded.mjs',import.meta.url)),freezePath,cell.cell_id,credentialPath,root],{stdio:['ignore',fd,fd]});closeSync(fd);
  if(run.status!==0)throw Error('sequence.cell-process-failed:'+cell.cell_id);
 }
 const validation=validateDispatchCompletion({cell,root:out});
 console.log(JSON.stringify(validation));
 if(!validation.ok){
  writeFileSync(resolve(driver,cell.cell_id+'.paused.json'),JSON.stringify(validation,null,2)+'\n',{flag:'wx'});
  throw Error('sequence.completion-review-required:'+cell.cell_id);
 }
 cleanupCellSourceTrees({cellRoot:out});
}
writeFileSync(resolve(driver,'completed.json'),JSON.stringify({scheduled_cells:matrix.cells.length,all_scheduled_outcomes_accounted:true,benchmark_cleared:false,authority_effect:'none'},null,2)+'\n',{flag:'wx'});
