// Sequential dispatcher for an already frozen matrix. No automatic model retries.
// Open questions: README.md. Existing incomplete directories require explicit diagnosis.
import {readFileSync,existsSync,mkdirSync,openSync,closeSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {verifyFreeze,sha} from './verify-freeze.mjs';
const [freezePath,credentialPath,outRoot]=process.argv.slice(2);
if(!outRoot)throw Error('freeze credential output-root required');
const {matrix}=verifyFreeze(freezePath),root=resolve(outRoot),driver=resolve(root,'sequence');
mkdirSync(driver,{recursive:true});
const allowed=new Set(['final_context_selected','invalid_final_response','token_budget_stopped','call_budget_exhausted']);
for(const cell of matrix.cells){
 verifyFreeze(freezePath);
 const out=resolve(root,cell.cell_id),completed=resolve(out,'completed.json');
 if(!existsSync(completed)){
  if(existsSync(out))throw Error('sequence.incomplete-existing-cell:'+cell.cell_id);
  const fd=openSync(resolve(driver,cell.cell_id+'.log'),'wx',0o600);
  console.log(JSON.stringify({cell_id:cell.cell_id,status:'starting'}));
  const run=spawnSync(process.execPath,[fileURLToPath(new URL('./run-cell.mjs',import.meta.url)),freezePath,cell.cell_id,credentialPath,root],{stdio:['ignore',fd,fd]});closeSync(fd);
  if(run.status!==0)throw Error('sequence.cell-process-failed:'+cell.cell_id);
 }
 const bytes=readFileSync(resolve(out,'result.json')),r=JSON.parse(bytes),c=JSON.parse(readFileSync(completed));
 if(sha(bytes)!==c.result_sha256)throw Error('sequence.result-integrity:'+cell.cell_id);
 if(r.native_export&&!existsSync(resolve(out,'scoring-status.json')))throw Error('sequence.scoring-incomplete:'+cell.cell_id);
 if(r.native_export&&JSON.parse(readFileSync(resolve(out,'scoring-status.json'))).exit_code!==0)throw Error('sequence.scoring-failure:'+cell.cell_id);
 console.log(JSON.stringify({cell_id:cell.cell_id,status:r.status,export_error:r.export_error??null}));
 if(!allowed.has(r.status))throw Error('sequence.shared-failure-review:'+cell.cell_id);
}
writeFileSync(resolve(driver,'completed.json'),JSON.stringify({scheduled_cells:matrix.cells.length,all_scheduled_outcomes_accounted:true,benchmark_cleared:false,authority_effect:'none'},null,2)+'\n',{flag:'wx'});
