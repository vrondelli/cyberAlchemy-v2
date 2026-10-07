// Post-settlement source-only DSH export. Gold and model credentials are absent.
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {loadSealedExchanges,reconcileTransport} from '/repo/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/deepseek-durable-transport.mjs';
import {exportDeepSeekWire} from '/repo/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/deepseek-wire-export.mjs';

const ROOT='/pair',parse=path=>JSON.parse(readFileSync(path,'utf8'));
const task=parse(join(ROOT,'tasks/SWE-Bench-Pro__javascript__maintenance__bugfix__14ef25ae.json'));
const run=join(ROOT,'runs/dsh'),settlement=parse(join(run,'SETTLEMENT.json'));
if(settlement.container_state?.Running||settlement.proxy_state?.Running)throw Error('dsh-export.unsettled');
const accounting=reconcileTransport(join(run,'transport'));
const records=readdirSync(join(run,'tools')).filter(x=>/^\d{6}\.json$/.test(x)).sort().map(x=>parse(join(run,'tools',x)));
const {exchanges}=loadSealedExchanges(join(run,'transport'));
const exported=exportDeepSeekWire({exchanges,records,task,repoRoot:join(run,'sources/base')});
if(exported.token_accounting.known_total_tokens!==accounting.known_total_tokens)throw Error('dsh-export.accounting-drift');
const prediction=exported.prediction;
if(prediction.instance_id!==task.instance_id||prediction.commit!==task.base_commit||prediction.repo_url!==task.repo_url)throw Error('dsh-export.task-drift');
const bytes=Buffer.from(JSON.stringify(prediction,null,2)+'\n');
writeFileSync('/out/prediction.json',bytes,{flag:'wx',mode:0o600});
writeFileSync('/out/EXPORT.json',JSON.stringify({schema_version:'are.g02-task-path-dsh-export/v1',
  task_id:'contextbench-2',instance_id:task.instance_id,accounting,
  prediction_sha256:createHash('sha256').update(bytes).digest('hex'),
  settlement_exit:settlement.exit_code,authority_effect:'none',
  claim_ceiling:'One sealed DSH export; native scoring and pair comparison pending.'},null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({status:'exported',tokens:accounting.known_total_tokens}));
