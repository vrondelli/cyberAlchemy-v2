// Run the frozen source-only ARE arm. DSH uses the existing generic fixed-pair runner.
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {chownSync,closeSync,existsSync,mkdirSync,openSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

const suffix=process.env.G02_PAIR_SUFFIX??'groups-r1';
if(!/^[a-z0-9-]+$/.test(suffix))throw Error('g02-cross-layer-pair.invalid-target');
const root='/opt/are-benchmark-runs/g02-cross-layer-'+suffix;
const tools=process.env.G02_TOOLS_ROOT??'/opt/are/evolution-runtime/g02-cross-layer-prospective-tools-r1';
const prior='/opt/are-benchmark-runs/g02-nodebb-09eb-r1';
const c='development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const need=(value,reason)=>{if(!value)throw Error('g02-cross-layer-pair.'+reason);};
const freeze=JSON.parse(readFileSync(join(root,'FREEZE.json')));
need(freeze.status==='frozen-before-model-dispatch'&&!existsSync(join(root,'ARE-STARTED.json')),'not-fresh');
for(const [path,digest] of Object.entries(freeze.source_hashes))need(sha(readFileSync(join(root,path)))===digest,'source-drift:'+path);
const binding=JSON.parse(readFileSync(join(root,'tasks/binding.json')));
const old=JSON.parse(readFileSync(join(prior,'COMMAND.json')));
need(Array.isArray(old)&&old[0]==='docker'&&old[1]==='run','prior-command');
const args=old.slice(1),name=args.indexOf('--name');
need(name>=0&&args[name+1]==='are-g02-nodebb-09eb-r1','prior-name');
args[name+1]=binding.container_name;
const replace=(before,after)=>{const index=args.indexOf(before);need(index>=0,'missing-mount:'+before);args[index]=after;};
for(const part of ['tasks','code/deepseek-full-window-profile.mjs','code/confirm-are.mjs','code/ranked-source-acquisition.mjs',
  'code/episode-recovery-v2.mjs','code/base-overlay.mjs']){
  const priorPart=join(prior,part),nextPart=join(root,part);
  const index=args.findIndex(value=>value.startsWith(priorPart+':'));
  need(index>=0,'missing-mount:'+part);args[index]=nextPart+args[index].slice(priorPart.length);
}
replace(`${prior}/evidence:/evidence`,`${root}/evidence:/evidence`);
replace(`${prior}/sources:/sources`,`${root}/sources:/sources`);
const image=args.findIndex(value=>value.startsWith('sha256:'));
need(image>0,'image');
const gitConfig=join(tools,'product-replication-gitconfig');
need(existsSync(gitConfig),'missing-git-config');
const configIndex=args.indexOf('GIT_CONFIG_GLOBAL=/repo/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/g02-fresh-pair-20260926/are-gitconfig');
need(configIndex>=0,'missing-git-config-env');
args[configIndex]='GIT_CONFIG_GLOBAL=/run/are-product-replication-gitconfig';
args.splice(image,0,'-v',`${gitConfig}:/run/are-product-replication-gitconfig:ro`);
args.splice(image,0,'-v',`${root}/code/orchestrate-recovery-v2.mjs:/repo/${c}/discovery-v1/orchestrate-recovery-v2.mjs:ro`);
for(const folder of ['evidence','sources']){const path=join(root,folder);need(!existsSync(path),'output-exists');mkdirSync(path,{mode:0o700});chownSync(path,65532,65532);}
writeFileSync(join(root,'ARE-STARTED.json'),JSON.stringify({arm:'are',instance_id:binding.instance_id,
  task_sha256:binding.task_sha256,ranker_sha256:freeze.source_hashes['code/ranked-source-acquisition.mjs'],
  command_sha256:sha(Buffer.from(JSON.stringify(args)))},null,2)+'\n',{flag:'wx'});
writeFileSync(join(root,'ARE-COMMAND.json'),JSON.stringify(['docker',...args],null,2)+'\n',{flag:'wx'});
const stdout=openSync(join(root,'are-stdout.txt'),'wx',0o600),stderr=openSync(join(root,'are-stderr.txt'),'wx',0o600);
const started=Date.now();let result;
try{result=spawnSync('docker',args,{stdio:['ignore',stdout,stderr],timeout:1800000});}
finally{closeSync(stdout);closeSync(stderr);}
const outcome={status:result.error?'runner_error':result.status===0?'completed':'run_failed',exit_code:result.status,
  error:result.error?.message??null,elapsed_seconds:(Date.now()-started)/1000};
writeFileSync(join(root,'ARE-SETTLEMENT.json'),JSON.stringify(outcome,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(outcome));
if(outcome.status!=='completed')process.exitCode=2;
