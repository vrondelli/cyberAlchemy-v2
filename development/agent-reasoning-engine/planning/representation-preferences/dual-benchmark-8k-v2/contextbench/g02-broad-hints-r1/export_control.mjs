// Post-settlement same-instance DSH export. No gold or model call.
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {loadSealedExchanges,reconcileTransport} from '../deepseek-durable-transport.mjs';
import {exportDeepSeekWire} from '../deepseek-wire-export.mjs';

const run='/pair/dsh-control';
const taskFile=process.env.G02_EXPORT_TASK??'SWE-Bench-Pro__javascript__maintenance__bugfix__e31ec45c.json';
const expectedTaskSha=process.env.G02_EXPORT_TASK_SHA??'d54918fefde9f74b64d158511e2c1ec0453118fec8695a8935957e23de5b0004';
if(!/^SWE-Bench-Pro__[a-z]+__maintenance__bugfix__[a-f0-9]{8}\.json$/.test(taskFile)||!/^[a-f0-9]{64}$/.test(expectedTaskSha))throw Error('control.invalid-task-selection');
const taskPath='/pair/tasks/'+taskFile;
const taskBytes=readFileSync(taskPath);
const sha=data=>createHash('sha256').update(data).digest('hex');
if(sha(taskBytes)!==expectedTaskSha)throw Error('control.task-drift');
const task=JSON.parse(taskBytes);
const settlement=JSON.parse(readFileSync(join(run,'SETTLEMENT.json'),'utf8'));
if(settlement.container_state?.Running||settlement.proxy_state?.Running)throw Error('control.unsettled');
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
