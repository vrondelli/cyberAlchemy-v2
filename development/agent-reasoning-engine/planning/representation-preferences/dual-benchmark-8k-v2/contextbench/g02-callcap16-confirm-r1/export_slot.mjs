// Post-settlement, source-only export. Gold and model credentials are absent.
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {loadSealedExchanges,reconcileTransport} from '/repo/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/deepseek-durable-transport.mjs';
import {exportDeepSeekWire} from '/repo/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/deepseek-wire-export.mjs';

const ROOT='/confirm';
const tasks={
 'contextbench-1':'SWE-Bench-Pro__go__maintenance__bugfix__997c7afd.json',
 'contextbench-2':'SWE-Bench-Pro__javascript__maintenance__bugfix__93b583ae.json'
};
const parse=path=>JSON.parse(readFileSync(path,'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

export function exportSlot(taskId,arm){
 if(!tasks[taskId]||!['are','dsh'].includes(arm))throw Error('confirm-export.selection');
 const slot=taskId+'-'+arm,run=join(ROOT,'runs',slot),settlement=parse(join(run,'SETTLEMENT.json'));
 if(settlement.container_state?.Running||settlement.proxy_state?.Running)throw Error('confirm-export.unsettled');
 const task=parse(join(ROOT,'tasks',tasks[taskId]));
 let exported,accounting,status;
 if(arm==='are'){
  const result=parse(join(run,'evidence/RESULTS.json'));
  accounting={model_calls:result.model_calls,known_total_tokens:result.known_total_tokens,
   unknown_usage_dispatched_requests:result.unknown_usage_dispatched_requests};
  status=result.status;
  if(status!=='final_context_selected'||!result.native_export)throw Error('confirm-export.are-invalid');
  exported=result.native_export;
 }else{
  accounting=reconcileTransport(join(run,'transport'));
  const records=readdirSync(join(run,'tools')).filter(x=>/^\d{6}\.json$/.test(x)).sort()
   .map(x=>parse(join(run,'tools',x)));
  const {exchanges}=loadSealedExchanges(join(run,'transport'));
  exported=exportDeepSeekWire({exchanges,records,task,repoRoot:join(run,'sources/base')});
  if(exported.token_accounting.known_total_tokens!==accounting.known_total_tokens)
   throw Error('confirm-export.accounting-drift');
  status='final_context_selected';
 }
 const prediction=exported.prediction;
 if(prediction.instance_id!==task.instance_id||prediction.commit!==task.base_commit||
    prediction.repo_url!==task.repo_url)throw Error('confirm-export.task-drift');
 const bytes=JSON.stringify(prediction,null,2)+'\n';
 writeFileSync('/out/prediction.json',bytes,{flag:'wx',mode:0o600});
 const record={schema_version:'are.g02-callcap16-confirm-export/v1',task_id:taskId,slot,arm,
  instance_id:task.instance_id,status,accounting,prediction_sha256:sha(bytes),
  settlement_exit:settlement.exit_code,authority_effect:'none',
  claim_ceiling:'One sealed task export; native scoring and paired comparison pending.'};
 writeFileSync('/out/EXPORT.json',JSON.stringify(record,null,2)+'\n',{flag:'wx',mode:0o600});
 return record;
}

if(process.argv[1]?.endsWith('/export_slot.mjs')){
 const result=exportSlot(process.argv[2],process.argv[3]);
 console.log(JSON.stringify({slot:result.slot,status:result.status,tokens:result.accounting.known_total_tokens}));
}
