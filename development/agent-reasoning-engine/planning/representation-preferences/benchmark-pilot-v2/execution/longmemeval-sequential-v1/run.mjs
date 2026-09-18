import {readFileSync,writeFileSync,mkdirSync,statfsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {ROOT,sha,createProvider} from '../selectivity-v2/provider.mjs';
import {runSequential} from './runner.mjs';
import {prepareTasks} from './prepare.mjs';
import {verifyResearchContinuity} from '../../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
const dir=import.meta.dirname,json=p=>JSON.parse(readFileSync(join(dir,p)));
const freeze=json('freeze.json');
if(freeze.status!=='frozen'||!json('freeze-validation.json').ok)throw Error('unready freeze');
for(const b of freeze.bindings)if(sha(readFileSync(resolve(ROOT,b.path)))!==b.sha256)throw Error('source drift: '+b.path);
const binding=json('run-continuity.json');
const valid=verifyResearchContinuity({binding,policy:JSON.parse(readFileSync(resolve(ROOT,binding.policy_ref))),hypotheses:json('run-hypotheses.json'),phase:'freeze',root:ROOT});if(!valid.ok)throw Error(JSON.stringify(valid));
const disk=statfsSync(dir);if(disk.bavail*disk.bsize<2*1024**3)throw Error('disk floor');
const tasks=prepareTasks(),preflight=json('preflight-compact-notes/result.json');
for(const task of tasks){const admitted=preflight.tasks.find(t=>t.task_id===task.task_id);if(!admitted||sha(task.chunks)!==sha(admitted.chunks))throw Error('source partition drift');}
const output=join(dir,'live');mkdirSync(output);
writeFileSync(join(output,'source-ledgers.json'),JSON.stringify(tasks.map(t=>({task_id:t.task_id,ledger:t.ledger})),null,2)+'\n',{flag:'wx'});
await runSequential({tasks,preflight,provider:createProvider({directory:output}),budget:freeze.total_token_cap,saveClaim:async(id,claim)=>writeFileSync(join(output,id+'-claim.json'),JSON.stringify(claim,null,2)+'\n',{flag:'wx'}),save:async result=>{writeFileSync(join(output,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,calls:result.completed_calls,answers:result.completed_answers,total_tokens:result.total_tokens}));}});
