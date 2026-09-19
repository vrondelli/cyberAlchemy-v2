// Tokenizer-only initial-request preflight; no generation admission. Open questions: LIVE-PROTOCOL.md.
import {mkdirSync,existsSync,readFileSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import {dir,root,read,sha,save,bind,verifyBindings} from './prepare-live.mjs';
import {buildCell,validateConfig} from './run.mjs';
import {runPreparedTask} from './orchestrate.mjs';
import {liveClientFactory} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/live-client.mjs';
import {assertStorageCapacity,cleanupCellSourceTrees} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/storage-lifecycle.mjs';
const config=read(join(dir,'live-config.json'));validateConfig(config);
const directory=join(dir,'preflight');assert.ok(!existsSync(directory),'preflight already attempted; inspect evidence before another attempt');mkdirSync(directory);
const source_bindings=[bind(join(dir,'live-config.json')),...['episode.mjs','orchestrate.mjs','run.mjs','preflight-live.mjs','prepare-live.mjs','history.mjs','recovery-index.mjs','recovery-session.mjs'].map(p=>bind(join(dir,p)))];
const rows=[];
save(join(directory,'SOURCE-BINDINGS-BEFORE.json'),source_bindings);
try{
 for(const task of config.tasks)for(const arm of ['control','treatment']){
  const storage=assertStorageCapacity({outRoot:directory});
  const cell=buildCell({config,task_id:task.id,arm,repetition:1}),out=join(directory,task.id+'-'+arm),factory=liveClientFactory({credential_path:config.credential_path});
  const result=await runPreparedTask({task_path:task.task_path,task_sha256:task.task_sha256,repository_cache:task.repository_cache,out,cell,...factory,model_dispatch_enabled:false});
  const models=result.receipts.filter(r=>r.kind==='model'&&r.dispatched);assert.equal(models.length,0);assert.equal(result.status,'token_budget_stopped',result.error);assert.equal(result.admissions.at(-1)?.reason,'token-budget.preflight-disabled');
  const admission=result.admissions.at(-1);assert.ok(admission.request_reservation<=8000);assert.ok(result.captures.length>0);
  const row={task_id:task.id,arm,cell_id:cell.cell_id,status:result.status,model_calls:0,admission,index_tokenizer_calls:result.index_tokenizer_receipts.length,receipts:result.receipts,capture_count:result.captures.length,output_directory:out,storage};rows.push(row);save(join(out,'preflight-row.json'),row);
  cleanupCellSourceTrees({cellRoot:out});
 }
 verifyBindings(source_bindings);
 const result={admitted:true,model_calls:0,rows,config_sha256:sha(join(dir,'live-config.json')),source_bindings,claim_ceiling:'Actual tokenizer admission for each initial request only; all subsequent live requests must be measured again. Not a score or saving result.',open_questions_ref:'LIVE-PROTOCOL.md'};save(join(directory,'RESULTS.json'),result);console.log(JSON.stringify({admitted:true,rows:rows.length,model_calls:0,maximum_request_reservation:Math.max(...rows.map(r=>r.admission.request_reservation))}));
}catch(error){save(join(directory,'FAILED.json'),{error:String(error.message),rows,model_calls:rows.reduce((n,r)=>n+r.model_calls,0)});throw error;}
