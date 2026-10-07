// Complete only the unattempted remainder of the exact frozen exposed cohort.
// Open Questions: evidence/G02-INLINE-TYPED-DISCOVERY-CANDIDATE-R2.json.
import{existsSync,readFileSync,writeFileSync,appendFileSync}from'node:fs';import{join,dirname}from'node:path';import{fileURLToPath}from'node:url';import{spawn}from'node:child_process';import{createHash}from'node:crypto';
const here=dirname(fileURLToPath(import.meta.url)),root='/home/vlad_/are-benchmark-archive/g02-inline-orientation-native-exposed-r1-20261006';
const sha=x=>createHash('sha256').update(x).digest('hex'),read=p=>JSON.parse(readFileSync(p));
const save=(n,v)=>writeFileSync(join(root,n),JSON.stringify(v,null,2)+'\n',{flag:'wx',mode:0o600});
if(existsSync(join(root,'CONTINUATION-STARTED.json')))throw Error('navigation-batch.no-replay');
const frozenBytes=readFileSync(join(root,'FREEZE.json')),frozen=JSON.parse(frozenBytes),freezeSha=sha(frozenBytes);
const first=frozen.cases[0].pair+'-orientation';
if(!existsSync(join(root,first,'RESULT.json'))||read(join(root,first,'RESULT.json')).status!=='matched-arm-passed')throw Error('navigation-batch.first-case-not-valid-terminal');
save('CONTINUATION-STARTED.json',{status:'running-unattempted-remainder',freeze_sha256:freezeSha,controller_sha256:sha(readFileSync(fileURLToPath(import.meta.url))),first_case:first,remaining_cases:frozen.cases.slice(1).map(c=>c.pair),automatic_retries:0});
let error=null;const rows=[];
try{
 for(const [i,c]of frozen.cases.entries()){
  if(sha(readFileSync(join(root,'FREEZE.json')))!==freezeSha)throw Error('navigation-batch.freeze-drift');
  const dir=join(root,c.pair+'-orientation');
  if(i>0){
   if(existsSync(dir))throw Error('navigation-batch.attempt-exists-no-replay');
   const code=await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[join(here,'run-native-inline-orientation-arm-r1.mjs'),root,c.pair,'orientation'],{stdio:['ignore','pipe','pipe']});
    child.on('error',reject);child.stdout.on('data',b=>{process.stdout.write(b);appendFileSync(join(root,'BATCH-STDOUT.log'),b,{mode:0o600});});
    child.stderr.on('data',b=>appendFileSync(join(root,'BATCH-STDERR.log'),b,{mode:0o600}));child.on('close',resolve);
   });
   if(code!==0)throw Error('navigation-batch.child-nonzero');
  }
  const seal=read(join(dir,'PRE-SCORE-SEAL.json')),resultBytes=readFileSync(join(dir,'RESULT.json')),result=JSON.parse(resultBytes);
  if(sha(resultBytes)!==seal.result_sha256||result.status!=='matched-arm-passed'||result.unknown_model_usage!==0||!result.unchanged_base)throw Error('navigation-batch.invalid-terminal-no-replay');
  rows.push({pair:c.pair,result_sha256:sha(resultBytes),pre_score_seal_sha256:sha(readFileSync(join(dir,'PRE-SCORE-SEAL.json'))),prediction_sha256:seal.prediction_sha256,model_calls:result.model_calls,known_model_tokens:result.known_model_tokens,inline_hint_reads:result.inline_hint_reads,inline_class_hint_reads:result.inline_class_hint_reads,inline_function_hint_reads:result.inline_function_hint_reads});
  console.log(JSON.stringify({case_completed:c.pair,cases_completed:rows.length,model_calls:result.model_calls,inline_hint_reads:result.inline_hint_reads}));
 }
}catch(e){error=String(e.message).slice(0,160);}
save('CAMPAIGN-TERMINAL.json',{status:!error&&rows.length===12?'all12-terminal-before-scoring':'campaign-stopped-no-replay',error,freeze_sha256:freezeSha,rows,
 total_known_model_tokens:rows.reduce((n,r)=>n+r.known_model_tokens,0),total_model_calls:rows.reduce((n,r)=>n+r.model_calls,0),
 reference_label_reads:0,claim_ceiling:'Native outputs only; no score or superiority yet. Failed/uncertain attempted cases remain in campaign denominator.',authority_effect:'none',open_questions_owner:'G02-INLINE-TYPED-DISCOVERY-CANDIDATE-R2.json'});
console.log(JSON.stringify({status:!error&&rows.length===12?'all12-terminal-before-scoring':'campaign-stopped-no-replay',cases:rows.length,error}));
