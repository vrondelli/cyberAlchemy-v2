// Open Questions: evidence/G02-NATIVE-CANDIDATE-WORKSPACE-R1.md.
// Sequential, write-once exposed pairs. Never retries an attempted arm.
import {readFileSync,writeFileSync,mkdirSync,existsSync,statfsSync,openSync,closeSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const here=dirname(fileURLToPath(import.meta.url));
const root='/home/vlad_/are-benchmark-archive/g02-native-workspace-matched-exposed-r1-20261006';
const archive='/home/vlad_/are-benchmark-archive/g02-product-replication-r11-20261002/pairs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const read=path=>JSON.parse(readFileSync(path));
const save=(path,data)=>writeFileSync(path,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
const requireIt=(condition,reason)=>{if(!condition)throw Error('matched-campaign.'+reason);};
const files=['run-native-workspace-matched-campaign-r1.mjs','run-native-workspace-matched-arm-r1.mjs',
 'candidate-workspace-r1.mjs','build-native-workspace-overlay-r1.mjs','wsl-vps-provider-r1.mjs','vps-json-provider-r1.mjs'];
const sources=Object.fromEntries(files.map(f=>[f,sha(readFileSync(join(here,f)))]));
const episodeSHA='bc6501801f860b2efc59198153e1f58462cbac54c0820dc6960ad56d53d1c3e7';
if(!existsSync(root)){
 const cases=[];
 for(let n=1;n<=12;n++){
  const id=String(n).padStart(2,'0'),pair=id+'-pr11-mixed-'+id,raw=join(archive,pair,'raw');
  const binding=read(join(raw,'tasks/binding.json'));
  requireIt(sha(readFileSync(join(raw,'tasks',binding.task_file)))===binding.task_sha256,'task-pin');
  requireIt(sha(readFileSync(join(raw,'code/episode-recovery-v2.mjs')))===episodeSHA,'episode-pin');
  requireIt(existsSync(join(raw,'sources/session/base/.git')),'missing-base');
  const cell=read(join(raw,'evidence/run/started.json')).cell;
  requireIt(cell.limits.maximum_calls<=20&&cell.limits.total_tokens<=650000,'archived-budget');
  cases.push({pair,instance_id:binding.instance_id,task_sha256:binding.task_sha256,cell,
   archived_code_sha256:Object.fromEntries(['ranked-source-acquisition.mjs','base-overlay.mjs'].map(
    name=>[name,sha(readFileSync(join(raw,'code',name)))]))});
 }
 mkdirSync(root,{mode:0o700});
 save(join(root,'FREEZE.json'),{schema_version:'are.g02-workspace-matched-exposed/v1',
  cases,source_sha256:sources,episode_sha256:episodeSHA,model:'glm-5.3-flash',reasoning_effort:'low',
  maximum_model_calls:480,maximum_known_model_tokens:15600000,automatic_retries:0,
  order:'Ascending cases; odd control first, even workspace first. Two arms per case, all included.',
  comparator:'Concurrent native control without workspace, identical task/base/ranker/tools/budgets/WSL-VPS binding. Archived DSH diagnostic only.',
  scoring:'No evaluator access until all attempted arms terminal and predictions sealed; pinned native Span-F1 and File-F1; failures retained.',
  advancement_gate:{all_24_valid_exports:true,workspace_updates_at_least:1,mean_span_f1_gain_vs_control_at_least:0.03,
   mean_file_f1_gain_vs_control_at_least:0,mean_span_f1_gain_vs_archived_dsh_at_least:0.03,
   mean_file_f1_gain_vs_archived_dsh_at_least:0,known_model_tokens_ratio_vs_control_at_most:1.25},
  claim_ceiling:'Exposed development only; even passing does not establish superiority. New matched DSH and untouched confirmation needed.',
  stop:'Any missing result, unknown provider usage, source drift, infrastructure error or uncertain dispatch stops; no automatic replay.',
  authority_effect:'none',open_questions_owner:'G02-NATIVE-CANDIDATE-WORKSPACE-R1.md'});
}
const freezeBytes=readFileSync(join(root,'FREEZE.json')),freeze=JSON.parse(freezeBytes);
requireIt(JSON.stringify(freeze.source_sha256)===JSON.stringify(sources),'source-drift');
let calls=0,tokens=0;
for(let n=0;n<freeze.cases.length;n++){
 const c=freeze.cases[n],arms=n%2===0?['control','workspace']:['workspace','control'];
 for(const arm of arms){
  const out=join(root,c.pair+'-'+arm),result=join(out,'RESULT.json');
  if(!existsSync(out)){
   const fs=statfsSync(root);requireIt(fs.bavail*fs.bsize>=8*1024**3,'evidence-reserve');
   for(const [name,expected] of Object.entries(sources))requireIt(sha(readFileSync(join(here,name)))===expected,'source-drift');
   // A STARTED marker precedes child launch, independently of the child directory.
   const prefix=join(root,c.pair+'-'+arm);
   requireIt(!existsSync(prefix+'-STARTED.json'),'attempt-already-started');
   save(prefix+'-STARTED.json',{started_at:new Date().toISOString(),freeze_sha256:sha(freezeBytes)});
   const stdout=openSync(prefix+'-stdout.log','wx',0o600),stderr=openSync(prefix+'-stderr.log','wx',0o600);
   let r;
   try{r=spawnSync(process.execPath,[join(here,'run-native-workspace-matched-arm-r1.mjs'),root,c.pair,arm],
    {stdio:['ignore',stdout,stderr],timeout:7200000});}finally{closeSync(stdout);closeSync(stderr);}
   save(prefix+'-PROCESS.json',{exit_code:r.status,signal:r.signal,error_code:r.error?.code??null,terminal_at:new Date().toISOString()});
   requireIt(r.status===0,'child-failed-no-replay');
  }
  requireIt(existsSync(result)&&existsSync(join(out,'PRE-SCORE-SEAL.json')),'incomplete-attempt-no-replay');
  const r=read(result);
  requireIt(r.unknown_model_usage===0&&r.error===null&&r.unchanged_base,'unsafe-or-incomplete-arm');
  calls+=r.model_calls;tokens+=r.known_model_tokens;
  requireIt(calls<=480&&tokens<=15600000,'campaign-budget');
  console.log(JSON.stringify({pair:c.pair,arm,status:r.status,native_export:r.native_export,calls_so_far:calls,tokens_so_far:tokens}));
 }
}
if(!existsSync(join(root,'PRE-SCORE-CAMPAIGN-SEAL.json'))){
 const results=[];
 for(const c of freeze.cases)for(const arm of ['control','workspace']){
  const out=join(root,c.pair+'-'+arm);
  results.push({pair:c.pair,arm,result_sha256:sha(readFileSync(join(out,'RESULT.json'))),
   pre_score_sha256:sha(readFileSync(join(out,'PRE-SCORE-SEAL.json')))});
 }
 save(join(root,'PRE-SCORE-CAMPAIGN-SEAL.json'),{freeze_sha256:sha(freezeBytes),results,
  model_calls:calls,known_model_tokens:tokens,labels_unopened_for_campaign:true,terminal_at:new Date().toISOString(),authority_effect:'none'});
}
console.log(JSON.stringify({root,status:'terminal-all-arms-sealed',model_calls:calls,known_model_tokens:tokens}));
