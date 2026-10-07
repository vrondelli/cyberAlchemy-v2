// Post-settlement source-selection export. Run in the pinned image with /repo:ro and /out writable.
// No benchmark gold, model dispatch, or retry is reachable here.
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {loadSealedExchanges,reconcileTransport} from '../deepseek-durable-transport.mjs';
import {exportDeepSeekWire} from '../deepseek-wire-export.mjs';

const ROOT='/repo';
const tasks={
  'contextbench-1':'SWE-Bench-Pro__go__maintenance__bugfix__6efcf999.json',
  'contextbench-2':'SWE-Bench-Pro__javascript__maintenance__bugfix__bc5ac89f.json'
};
const sha=data=>createHash('sha256').update(data).digest('hex');
const parse=path=>JSON.parse(readFileSync(path,'utf8'));

export function exportSlot(taskId,arm){
  if(!tasks[taskId]||!['are','dsh-repair'].includes(arm))throw Error('export-slot.invalid-selection');
  const slot=taskId+'-'+arm,run=join(ROOT,'runs',slot),settlement=parse(join(run,'SETTLEMENT.json'));
  if(settlement.container_state?.Running||settlement.proxy_state?.Running)throw Error('export-slot.unsettled');
  const task=parse(join(ROOT,'tasks',tasks[taskId]));
  let exported,accounting,status;
  if(arm==='are'){
    const seal=parse(join(run,'evidence/RESULTS.json'));
    accounting={model_calls:seal.model_calls,known_total_tokens:seal.known_total_tokens,
      unknown_usage_dispatched_requests:seal.unknown_usage_dispatched_requests};
    status=seal.status;
    if(status!=='final_context_selected'||!seal.native_export)throw Error('export-slot.are-invalid');
    exported=seal.native_export;
  }else{
    accounting=reconcileTransport(join(run,'transport'));
    const records=readdirSync(join(run,'tools')).filter(x=>/^\d{6}\.json$/.test(x)).sort()
      .map(x=>parse(join(run,'tools',x)));
    const {exchanges}=loadSealedExchanges(join(run,'transport'));
    exported=exportDeepSeekWire({exchanges,records,task,repoRoot:join(run,'sources/base')});
    if(exported.token_accounting.known_total_tokens!==accounting.known_total_tokens)
      throw Error('export-slot.accounting-drift');
    status='final_context_selected';
  }
  const prediction=exported.prediction;
  if(prediction.instance_id!==task.instance_id||prediction.commit!==task.base_commit||
      prediction.repo_url!==task.repo_url)throw Error('export-slot.task-drift');
  const bytes=JSON.stringify(prediction,null,2)+'\n';
  writeFileSync('/out/prediction.json',bytes,{flag:'wx',mode:0o600});
  const record={schema_version:'are.g02-fresh-slot-export/v1',slot,task_id:taskId,instance_id:task.instance_id,
    arm,status,accounting,prediction_sha256:sha(bytes),settlement_exit: settlement.exit_code,
    claim_ceiling:'Sealed one-task source-selection export; native quality scoring pending.',
    authority_effect:'none',open_questions:['Will native scoring succeed?', 'Will the paired arm match?']};
  writeFileSync('/out/EXPORT.json',JSON.stringify(record,null,2)+'\n',{flag:'wx',mode:0o600});
  return record;
}

if(process.argv[1]?.endsWith('/export_slot.mjs')){
  const result=exportSlot(process.argv[2],process.argv[3]);
  console.log(JSON.stringify({slot:result.slot,status:result.status,tokens:result.accounting.known_total_tokens}));
}
