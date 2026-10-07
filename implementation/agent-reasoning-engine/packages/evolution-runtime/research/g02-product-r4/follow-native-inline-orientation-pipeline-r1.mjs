// Follow exact campaign, validate complete seal, score once; never runs models.
// Open Questions: evidence/G02-INLINE-TYPED-DISCOVERY-CANDIDATE-R2.json.
import{readFileSync,writeFileSync,existsSync}from'node:fs';import{join,dirname}from'node:path';import{fileURLToPath}from'node:url';import{spawn}from'node:child_process';import{createHash}from'node:crypto';
const here=dirname(fileURLToPath(import.meta.url)),root='/home/vlad_/are-benchmark-archive/g02-inline-orientation-native-exposed-r1-20261006';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(readFileSync(p)),need=(v,r)=>{if(!v)throw Error('navigation-pipeline.'+r);};
const save=(n,v)=>writeFileSync(join(root,n),JSON.stringify(v,null,2)+'\n',{flag:'wx',mode:0o600});
const frozenBytes=readFileSync(join(root,'FREEZE.json')),freeze=JSON.parse(frozenBytes),freezeSha=sha(frozenBytes);
const names=['follow-native-inline-orientation-pipeline-r1.mjs','prepare-native-inline-orientation-score-r1.py','score-native-inline-orientation-campaign-r1.mjs','score-native-workspace-filtered-task1-r1.py','summarize-native-inline-orientation-r1.mjs','matched-workspace-statistics-r1.mjs'];
const pins=Object.fromEntries(names.map(n=>[n,sha(readFileSync(join(here,n)))]));
save('PIPELINE-STARTED.json',{status:'waiting-for-all12',freeze_sha256:freezeSha,source_sha256:pins,maximum_wait_ms:14400000,automatic_retries:0,authority_effect:'none'});
const run=(command,args)=>new Promise((resolve,reject)=>{const child=spawn(command,args,{stdio:['ignore','inherit','inherit']});child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error('pipeline-child-'+code)));});
let error=null;
try{
 const deadline=Date.now()+14400000;
 while(!existsSync(join(root,'CAMPAIGN-TERMINAL.json'))){need(Date.now()<deadline,'deadline');need(sha(readFileSync(join(root,'FREEZE.json')))===freezeSha,'freeze-drift');await new Promise(r=>setTimeout(r,2000));}
 const terminal=read(join(root,'CAMPAIGN-TERMINAL.json'));need(terminal.status==='all12-terminal-before-scoring'&&terminal.rows.length===12&&terminal.freeze_sha256===freezeSha,'incomplete-campaign-no-scoring');
 const results=[];
 for(const c of freeze.cases){const row=terminal.rows.find(r=>r.pair===c.pair),dir=join(root,c.pair+'-orientation'),resultBytes=readFileSync(join(dir,'RESULT.json')),preBytes=readFileSync(join(dir,'PRE-SCORE-SEAL.json')),pre=JSON.parse(preBytes),r=JSON.parse(resultBytes);
  need(row&&sha(resultBytes)===row.result_sha256&&sha(preBytes)===row.pre_score_seal_sha256&&pre.result_sha256===row.result_sha256&&pre.score_unopened&&sha(readFileSync(join(dir,'prediction.json')))===row.prediction_sha256&&r.status==='matched-arm-passed'&&r.unknown_model_usage===0&&r.unchanged_base,'terminal-identity');
  results.push({pair:c.pair,arm:'orientation',result_sha256:row.result_sha256,pre_score_sha256:sha(preBytes)});
 }
 save('PRE-SCORE-CAMPAIGN-SEAL.json',{status:'all12-outputs-verified-before-evaluator',freeze_sha256:freezeSha,results,authority_effect:'none'});
 for(const[n,pin]of Object.entries(pins))need(sha(readFileSync(join(here,n)))===pin,'pipeline-source-drift');
 await run('python3',[join(here,'prepare-native-inline-orientation-score-r1.py')]);
 await run(process.execPath,[join(here,'score-native-inline-orientation-campaign-r1.mjs')]);
 await run(process.execPath,[join(here,'summarize-native-inline-orientation-r1.mjs')]);
}catch(e){error=String(e.message).slice(0,240);}
save('PIPELINE-TERMINAL.json',{status:error?'failed-no-replay':'terminal-quality-result',error,quality_result_sha256:existsSync(join(root,'QUALITY-RESULT.json'))?sha(readFileSync(join(root,'QUALITY-RESULT.json'))):null,authority_effect:'none',open_questions_owner:'G02-INLINE-TYPED-DISCOVERY-CANDIDATE-R2.json'});
console.log(JSON.stringify({status:error?'failed-no-replay':'terminal-quality-result',error}));if(error)process.exitCode=1;
