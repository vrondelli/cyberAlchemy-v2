// Re-run one exposed source-only ARE task with a new immutable ranker overlay.
// This is a mechanism diagnostic, never a prospective matched comparison.
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {closeSync,existsSync,mkdirSync,openSync,readFileSync,writeFileSync,chownSync} from 'node:fs';
import {join} from 'node:path';

const root='/opt/are/evolution-runtime/g02-cross-layer-nodebb-live-diagnostic-r4';
const prior='/opt/are-benchmark-runs/g02-nodebb-09eb-r1';
const c='development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench';
const code=join(root,'code'),ranker=join(code,'ranked-source-acquisition.mjs'),helper=join(code,'cross-layer-source-hints.mjs');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const need=(value,reason)=>{if(!value)throw Error('g02-cross-layer-exposed.'+reason);};
need(existsSync(ranker)&&existsSync(helper)&&!existsSync(join(root,'FREEZE.json')),'fresh-source');
const original=JSON.parse(readFileSync(join(prior,'COMMAND.json')));
need(Array.isArray(original)&&original[0]==='docker'&&original[1]==='run','prior-command');
const oldRanker=join(prior,'code/ranked-source-acquisition.mjs');
need(original.includes(`${oldRanker}:/repo/${c}/ranked-source-acquisition.mjs:ro`),'prior-ranker');
need(original.includes(`${prior}/evidence:/evidence`)&&original.includes(`${prior}/sources:/sources`),'prior-outputs');
const args=original.slice(1),name=args.indexOf('--name');
need(name>=0&&args[name+1]==='are-g02-nodebb-09eb-r1','prior-name');
args[name+1]='are-g02-nodebb-cross-layer-exposed-r4';
for(const [before,after] of [
  [`${oldRanker}:/repo/${c}/ranked-source-acquisition.mjs:ro`,`${ranker}:/repo/${c}/ranked-source-acquisition.mjs:ro`],
  [`${prior}/evidence:/evidence`,`${root}/evidence:/evidence`],
  [`${prior}/sources:/sources`,`${root}/sources:/sources`],
]){
  const index=args.indexOf(before);need(index>=0,'missing-mount');args[index]=after;
}
const image=args.findIndex(value=>value.startsWith('sha256:'));
need(image>0,'image');
const orchestrate=join(prior,'code/orchestrate-recovery-v2.mjs');
need(existsSync(orchestrate),'orchestrate-overlay');
args.splice(image,0,'-v',`${orchestrate}:/repo/${c}/discovery-v1/orchestrate-recovery-v2.mjs:ro`);
for(const folder of ['evidence','sources']){const path=join(root,folder);need(!existsSync(path),'output-exists');mkdirSync(path,{mode:0o700});chownSync(path,65532,65532);}
const task=readFileSync(join(prior,'tasks/SWE-Bench-Pro__javascript__maintenance__bugfix__09eb0d6d.json'));
const freeze={schema_version:'are.g02-cross-layer-exposed-freeze/v1',status:'frozen-before-dispatch',task_sha256:sha(task),
  predecessor_command_sha256:sha(readFileSync(join(prior,'COMMAND.json'))),ranker_sha256:sha(readFileSync(ranker)),helper_sha256:sha(readFileSync(helper)),
  orchestrate_sha256:sha(readFileSync(orchestrate)),
  comparison:'exposed ARE mechanism diagnostic only; no DSH rerun or prospective accuracy claim'};
writeFileSync(join(root,'FREEZE.json'),JSON.stringify(freeze,null,2)+'\n',{flag:'wx',mode:0o600});
const stdout=openSync(join(root,'stdout.txt'),'wx',0o600),stderr=openSync(join(root,'stderr.txt'),'wx',0o600);
let result;
try{result=spawnSync('docker',args,{stdio:['ignore',stdout,stderr],timeout:1800000});}
finally{closeSync(stdout);closeSync(stderr);}
const outcome={status:result.error?'runner_error':result.status===0?'completed':'run_failed',exit_code:result.status,error:result.error?.message??null,
  result_path:join(root,'evidence/RESULTS.json')};
writeFileSync(join(root,'RUN-OUTCOME.json'),JSON.stringify(outcome,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify(outcome));
if(outcome.status!=='completed')process.exitCode=2;
