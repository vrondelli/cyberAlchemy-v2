// Open Questions: evidence/G02-NATIVE-CANDIDATE-WORKSPACE-R1.md.
// Follow the existing campaign, then score once. Never launches/retries models.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
const root='/home/vlad_/are-benchmark-archive/g02-native-workspace-matched-exposed-r1-20261006';
const here=dirname(fileURLToPath(import.meta.url));
const sha=x=>createHash('sha256').update(x).digest('hex');
const freezeBytes=readFileSync(join(root,'FREEZE.json')),freeze=JSON.parse(freezeBytes);
const names=['follow-native-workspace-matched-pipeline-r1.mjs','prepare-native-workspace-matched-score-r1.py',
 'score-native-workspace-matched-campaign-r1.mjs','score-native-workspace-filtered-task1-r1.py',
 'summarize-native-workspace-matched-r1.mjs','matched-workspace-statistics-r1.mjs'];
const sources=Object.fromEntries(names.map(n=>[n,sha(readFileSync(join(here,n)))]));
const save=(name,data)=>writeFileSync(join(root,name),JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
const requireIt=(v,r)=>{if(!v)throw Error('matched-pipeline.'+r);};
save('PIPELINE-STARTED.json',{started_at:new Date().toISOString(),freeze_sha256:sha(freezeBytes),
 source_sha256:sources,maximum_wait_ms:14400000,automatic_retries:0,authority_effect:'none'});
const run=(command,args)=>new Promise((resolve,reject)=>{
 const child=spawn(command,args,{stdio:['ignore','inherit','inherit']});
 child.on('error',reject);child.on('close',(code,signal)=>code===0?resolve():reject(Error('child-exit-'+code+'-'+signal)));
});
let error=null;
try{
 const deadline=Date.now()+14400000;
 while(!existsSync(join(root,'PRE-SCORE-CAMPAIGN-SEAL.json'))){
  requireIt(Date.now()<deadline,'wait-deadline');
  requireIt(sha(readFileSync(join(root,'FREEZE.json')))===sha(freezeBytes),'freeze-drift');
  for(const c of freeze.cases)for(const arm of ['control','workspace']){
   const prefix=join(root,c.pair+'-'+arm),processFile=prefix+'-PROCESS.json';
   if(!existsSync(processFile))continue;
   const p=JSON.parse(readFileSync(processFile));requireIt(p.exit_code===0,'campaign-process-failed');
   requireIt(existsSync(join(prefix,'RESULT.json')),'missing-terminal-result');
   const r=JSON.parse(readFileSync(join(prefix,'RESULT.json')));
   requireIt(r.error===null&&r.unknown_model_usage===0&&r.unchanged_base,'campaign-unsafe-result');
  }
  await new Promise(resolve=>setTimeout(resolve,2000));
 }
 for(const [name,expected] of Object.entries(sources))requireIt(sha(readFileSync(join(here,name)))===expected,'pipeline-source-drift');
 await run('python3',[join(here,'prepare-native-workspace-matched-score-r1.py')]);
 await run(process.execPath,[join(here,'score-native-workspace-matched-campaign-r1.mjs')]);
 await run(process.execPath,[join(here,'summarize-native-workspace-matched-r1.mjs')]);
}catch(e){error=String(e.message).slice(0,240);}
save('PIPELINE-TERMINAL.json',{status:error?'failed-no-replay':'terminal-quality-result',error,
 terminal_at:new Date().toISOString(),quality_result_sha256:existsSync(join(root,'QUALITY-RESULT.json'))?
 sha(readFileSync(join(root,'QUALITY-RESULT.json'))):null,authority_effect:'none'});
console.log(JSON.stringify({root,status:error?'failed-no-replay':'terminal-quality-result',error}));
if(error)process.exitCode=1;
