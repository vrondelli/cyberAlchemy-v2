// One bounded continuation, no retries or study overlap. Open questions: README.md.
import {readFileSync,existsSync,writeFileSync} from 'node:fs';import {spawn} from 'node:child_process';import {join} from 'node:path';
import {root,verify,read,need,sha} from './common.mjs';
const credential=process.argv[2],binding=read(new URL('execution-binding.json',root)),provider=new URL('../',root).pathname;
need(typeof credential==='string','existing credential config required');need(verify().digest===binding.freeze_digest,'execution freeze drift');need(sha(readFileSync(new URL('pipeline.mjs',root)))===binding.pipeline_sha256,'pipeline source drift');
const emit=x=>console.log(JSON.stringify({...x,at:new Date().toISOString()}));
async function command(label,args){emit({stage:label,state:'starting'});const code=await new Promise((done,reject)=>{const child=spawn(process.execPath,args,{cwd:provider,stdio:'inherit'});child.on('error',reject);child.on('close',done);});need(code===0,label+' failed; no subsequent dispatch');emit({stage:label,state:'complete'});}
need(!existsSync(join(provider,'live-run/controller.lock')),'another original controller is active');
await command('original-unstarted-25',['controller.mjs','run','frozen','live-run',credential,'25']);
need(!existsSync(join(provider,'live-run/controller.lock')),'terminal original left lock; audit required');const schedule=read(join(provider,'frozen/schedule.json'));need(schedule.every(r=>existsSync(join(provider,'live-run',r.id,'completed.json'))),'original incomplete; no successor dispatch');
await command('original-integrity',['research/verify-complete.mjs','frozen','live-run','research/final-integrity.json']);
await command('original-final-screen',['research/finalize.mjs','frozen','live-run','research/raw-audits-v1','research/final-contract-study']);
await command('original-research-dag',['research/assemble-contract-final.mjs','research/dag-contract-final.json']);
need(verify().digest===binding.freeze_digest,'successor source drift before dispatch');
await command('live-recovery-24',['live-recovery-v1/run.mjs',credential,'24']);
await command('live-recovery-review',['live-recovery-v1/review.mjs','live-recovery-v1/review-final']);
await command('live-recovery-dag',['live-recovery-v1/assemble.mjs','final']);
writeFileSync(new URL('pipeline-completed.json',root),JSON.stringify({freeze_digest:binding.freeze_digest,original_final:'../research/final-contract-study/report.json',recovery_final:'review-final/report.json',authority_effect:'none',open_questions_ref:'README.md'},null,2)+'\n',{flag:'wx'});emit({stage:'pipeline',state:'complete'});
