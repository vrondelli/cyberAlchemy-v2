// One-command source-only matched development pair. No gold read before seal.
import {createHash} from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,openSync,closeSync,readFileSync,renameSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

const [suffix,instance]=process.argv.slice(2);
if(!/^[a-z0-9-]+$/.test(suffix??'')||!/^SWE-Bench-Pro__[A-Za-z0-9_-]+$/.test(instance??''))
  throw Error('g02-pair.invalid-target');
const root='/opt/are-benchmark-runs/g02-cross-layer-'+suffix;
const tools=process.env.G02_TOOLS_ROOT??'/opt/are/evolution-runtime/g02-db-closure-tools-r1';
if(!tools.startsWith('/opt/are/evolution-runtime/')||tools.includes('..'))
  throw Error('g02-pair.invalid-tools-root');
const node='/opt/cyberalchemy-are-tools/node-24.10.0/node';
const image='sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385';
const scorer='are-contextbench-scorer:g01-r1';
const scorerBase='/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev';
const repo='/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926';
const retryControl=process.env.G02_RETRY_CONTROL==='1';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const parse=path=>JSON.parse(readFileSync(path));
const need=(value,reason)=>{if(!value)throw Error('g02-pair.'+reason);};
const env={...process.env,G02_PAIR_SUFFIX:suffix,G02_INSTANCE:instance,G02_TOOLS_ROOT:tools};
const checked=(name,command,args,options={})=>{
  const result=spawnSync(command,args,{encoding:'utf8',maxBuffer:8*1024*1024,...options});
  if(result.status!==0)throw Error(name+': '+(result.error?.message??result.stderr?.slice(-600)??'unknown'));
  return result.stdout?.trim()??'';
};
const logRun=(name,command,args)=>new Promise((resolve,reject)=>{
  const stdout=openSync(join(root,name+'-driver-stdout.txt'),'wx',0o600);
  const stderr=openSync(join(root,name+'-driver-stderr.txt'),'wx',0o600);
  const child=spawn(command,args,{env,stdio:['ignore',stdout,stderr]});
  child.once('error',error=>{closeSync(stdout);closeSync(stderr);reject(error);});
  child.once('exit',(code,signal)=>{closeSync(stdout);closeSync(stderr);resolve({arm:name,code,signal});});
});
if(retryControl){
  need(existsSync(join(root,'FREEZE.json'))&&existsSync(join(root,'ARE-SETTLEMENT.json')),
    'retry-missing-frozen-are');
  need(!existsSync(join(root,'PAIR-PRE-SCORE-SEAL.json'))&&!existsSync(join(root,'PAIR-DECISION.json')),
    'retry-already-scored');
  need(parse(join(root,'ARE-SETTLEMENT.json')).status==='completed','retry-are-invalid');
  need(parse(join(root,'dsh-control/SETTLEMENT.json')).exit_code!==0,'retry-control-already-valid');
  need(!existsSync(join(root,'dsh-control-attempt-1')),'retry-already-used');
  renameSync(join(root,'dsh-control'),join(root,'dsh-control-attempt-1'));
  const baseName='are-g02-cross-layer-'+suffix+'-dsh';
  for(const name of [baseName,baseName+'-proxy'])
    checked('archive-control-container','docker',['rename',name,name+'-attempt-1']);
  writeFileSync(join(root,'CONTROL-RETRY.json'),JSON.stringify({schema_version:'are.g02-control-retry/v1',
    reason:'prior DSH transport failed after dispatch with unknown usage; control was unscored',
    failed_attempt:'dsh-control-attempt-1',retry_attempt:'dsh-control',
    freeze_sha256:sha(readFileSync(join(root,'FREEZE.json'))),gold_posture:'native gold unopened'},null,2)+'\n',{flag:'wx'});
}else{
  need(!existsSync(root),'root-exists');
  checked('prepare',node,[join(tools,'prepare-prospective.mjs')],{env});
}
const binding=parse(join(root,'tasks/binding.json'));
const bindingSha=sha(readFileSync(join(root,'tasks/binding.json')));
need(binding.instance_id===instance,'binding-identity');
const task=parse(join(root,'tasks',binding.task_file));
let arms;
if(retryControl){
  need(parse(join(root,'SOURCE-BINDING-CHECK.json')).disposition==='admissible','retry-source-binding');
  arms=[await logRun('dsh-retry1','python3',[join(root,'code/run_fixed_pair.py'),
    '--root',root,'--binding-sha',bindingSha,'--arm','dsh'])];
  writeFileSync(join(root,'DRIVER-ARM-OUTCOME-RETRY-1.json'),JSON.stringify(arms,null,2)+'\n',{flag:'wx'});
}else{
  const named=[...new Set(task.problem_statement.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g)??[])].slice(0,12);
  const bound=[];
  for(const name of named){
    const result=spawnSync('git',['-C',join(repo,'cache',binding.cache),'grep','-q','-F',name,binding.base_commit,'--']);
    need(result.status===0||result.status===1,'source-binding-check:'+name);
    if(result.status===0)bound.push(name);
  }
  const sourceBinding={schema_version:'are.g02-source-binding-check/v1',named_identifiers:named,found_in_base:bound,
    disposition:named.length>=2&&bound.length===0?'unbound-named-objective':'admissible'};
  writeFileSync(join(root,'SOURCE-BINDING-CHECK.json'),JSON.stringify(sourceBinding,null,2)+'\n',{flag:'wx'});
  if(sourceBinding.disposition==='unbound-named-objective'){
    const decision={schema_version:'are.g02-cross-layer-pair-decision/v1',instance_id:instance,
      strict_four_gate_decision:'not-run',reason:'Two or more task-named types are absent from the pinned base; source-selection comparison withheld before model dispatch.',
      source_binding:sourceBinding,claim_ceiling:'source-only eligibility diagnostic; no model or gold calls'};
    writeFileSync(join(root,'PAIR-DECISION.json'),JSON.stringify(decision,null,2)+'\n',{flag:'wx'});
    console.log(JSON.stringify(decision));process.exit(0);
  }
  arms=await Promise.all([
    logRun('are',node,[join(tools,'run-prospective-are.mjs')]),
    logRun('dsh','python3',[join(root,'code/run_fixed_pair.py'),'--root',root,'--binding-sha',bindingSha,'--arm','dsh']),
  ]);
  writeFileSync(join(root,'DRIVER-ARM-OUTCOME.json'),JSON.stringify(arms,null,2)+'\n',{flag:'wx'});
}
need(arms.every(arm=>arm.code===0),'arm-failure');
if(!existsSync(join(root,'dsh-export')))mkdirSync(join(root,'dsh-export'));
checked('control-export','docker',['run','--rm','--network','none',
  '-v',`${repo}:/repo:ro`,'-v',`${root}:/pair:ro`,'-v',`${root}/dsh-export:/out`,
  '-e',`ARE_TASK_FILE=${binding.task_file}`,'-e',`ARE_TASK_SHA=${binding.task_sha256}`,
  image,'node','/pair/code/export-sealed-dsh.mjs']);
const areOutcome=parse(join(root,'evidence/RESULTS.json'));
const controlExport=parse(join(root,'dsh-export/EXPORT.json'));
if(areOutcome.status!=='final_context_selected'||controlExport.status!=='final_context_selected'){
  const decision={schema_version:'are.g02-cross-layer-pair-decision/v1',instance_id:instance,
    strict_four_gate_decision:'unscored-invalid-arm',arm_status:{are:areOutcome.status,dsh:controlExport.status},
    known_model_tokens:{are:areOutcome.known_total_tokens,dsh:controlExport.accounting.known_total_tokens},
    claim_ceiling:'No matched native quality comparison; gold was not opened by the driver.'};
  writeFileSync(join(root,'PAIR-DECISION.json'),JSON.stringify(decision,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify(decision));process.exit(2);
}
checked('pre-score-seal',node,[join(tools,'seal-prospective.mjs')],{env});
const score=(arm,work)=>{
  const output=openSync(join(root,arm+'-score-stdout.txt'),'wx',0o600);
  const error=openSync(join(root,arm+'-score-stderr.txt'),'wx',0o600);
  try{
    const result=spawnSync('docker',['run','--rm','--network','host',
      '-v',`${scorerBase}/repo:/repo:ro`,'-v',`${scorerBase}/upstream:/upstream:ro`,
      '-v',`${scorerBase}/scoring-cache:/cache`,'-v',`${root}/${work}:/work`,
      scorer,'python','/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py',
      '--upstream','/upstream','--gold','/upstream/data/full.parquet','--pred','/work/prediction.json',
      '--cache','/cache','--out','/work/native-score.json'],{stdio:['ignore',output,error],timeout:300000});
    need(result.status===0,'score-'+arm+':'+(result.error?.message??result.status));
  }finally{closeSync(output);closeSync(error);}
};
score('are','evidence/run');score('dsh','dsh-export');
const f1=value=>value.coverage+value.precision?2*value.coverage*value.precision/(value.coverage+value.precision):0;
const seal=parse(join(root,'PAIR-PRE-SCORE-SEAL.json'));
const quality={};
for(const [arm,path] of [['are','evidence/run/native-score.json'],['dsh','dsh-export/native-score.json']]){
  const scoreResult=parse(join(root,path));
  quality[arm]={span_f1:f1(scoreResult.native.final.span),file_f1:f1(scoreResult.native.final.file),
    known_model_tokens:seal.known_model_tokens[arm],arm_seconds:seal.arm_seconds[arm],
    score_sha256:sha(readFileSync(join(root,path)))};
}
const passed=quality.are.span_f1>quality.dsh.span_f1&&quality.are.file_f1>quality.dsh.file_f1&&
  quality.are.known_model_tokens<quality.dsh.known_model_tokens&&quality.are.arm_seconds<quality.dsh.arm_seconds;
const decision={schema_version:'are.g02-cross-layer-pair-decision/v1',instance_id:instance,
  task_posture:'source-only development pair, not globally unseen',candidate_ranker_sha256:parse(join(root,'FREEZE.json')).source_hashes['code/ranked-source-acquisition.mjs'],
  pre_score_seal_sha256:sha(readFileSync(join(root,'PAIR-PRE-SCORE-SEAL.json'))),quality,
  control_retry:retryControl?'one unscored transport-failed attempt retained at dsh-control-attempt-1':null,
  failed_control_attempt:retryControl?{
    known_model_tokens:parse(join(root,'dsh-control-attempt-1/transport/RESULTS.json')).known_total_tokens,
    elapsed_seconds:parse(join(root,'dsh-control-attempt-1/SETTLEMENT.json')).elapsed_seconds,
    cost_complete:false}:null,
  strict_four_gate_decision:passed?'pass':'fail',claim_ceiling:'one matched development pair; no full ContextBench generalization'};
writeFileSync(join(root,'PAIR-DECISION.json'),JSON.stringify(decision,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(decision));
