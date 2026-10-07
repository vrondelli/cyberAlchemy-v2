// Post-settlement, source-only export for the frozen 1177 DSH arm.
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {loadSealedExchanges,reconcileTransport} from '/repo/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/deepseek-durable-transport.mjs';
import {exportDeepSeekWire} from '/repo/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/deepseek-wire-export.mjs';

const run='/pair/dsh-control';
const taskPath='/pair/tasks/SWE-Bench-Pro__go__maintenance__bugfix__1177cd53.json';
const expectedTaskSha='9846ff1e35cc0d779541d090bde1c3bc1073f606d02a0077a5a959f37e8d046b';
const sha=data=>createHash('sha256').update(data).digest('hex');
const taskBytes=readFileSync(taskPath);
if(sha(taskBytes)!==expectedTaskSha)throw Error('control.task-drift');
const task=JSON.parse(taskBytes);
const settlement=JSON.parse(readFileSync(join(run,'SETTLEMENT.json'),'utf8'));
if(settlement.exit_code!==0||settlement.container_state?.Running||settlement.proxy_state?.Running)throw Error('control.unsettled');
const accounting=reconcileTransport(join(run,'transport'));
const records=readdirSync(join(run,'tools')).filter(x=>/^\d{6}\.json$/.test(x)).sort()
  .map(x=>JSON.parse(readFileSync(join(run,'tools',x),'utf8')));
const {exchanges}=loadSealedExchanges(join(run,'transport'));
const exported=exportDeepSeekWire({exchanges,records,task,repoRoot:join(run,'sources/base')});
if(exported.token_accounting.known_total_tokens!==accounting.known_total_tokens)throw Error('control.accounting-drift');
const prediction=exported.prediction;
if(prediction.instance_id!==task.instance_id||prediction.commit!==task.base_commit||prediction.repo_url!==task.repo_url)throw Error('control.prediction-drift');
const bytes=JSON.stringify(prediction,null,2)+'\n';
writeFileSync('/out/prediction.json',bytes,{flag:'wx',mode:0o600});
writeFileSync('/out/EXPORT.json',JSON.stringify({schema_version:'are.g02-control-export/v1',
  instance_id:task.instance_id,task_sha256:sha(taskBytes),status:'final_context_selected',
  accounting,prediction_sha256:sha(bytes),settlement_exit:settlement.exit_code,
  authority_effect:'none'},null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({status:'final_context_selected',tokens:accounting.known_total_tokens}));
