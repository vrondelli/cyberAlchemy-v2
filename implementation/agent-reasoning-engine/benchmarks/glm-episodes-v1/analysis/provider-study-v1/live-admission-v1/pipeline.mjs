// Exact frozen live pilot; a transport stop terminates this pipeline. Open questions: README.md.
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {root,read,sha,verify,need} from './common.mjs';
const credential=process.argv[2],binding=read(new URL('execution-binding-76.json',root));
need(typeof credential==='string','credential configuration path required');
need(verify().digest===binding.freeze_digest,'freeze drift');
for(const f of binding.sources)need(sha(readFileSync(new URL(f.path,root)))===f.sha256,'execution source drift '+f.path);
const ready=read(new URL('readiness.json',root));
need(ready.freeze_digest===binding.freeze_digest&&ready.preflight_tests.passed===3&&ready.smoke_cases===12&&ready.provider_calls===0,'readiness mismatch');
need(!existsSync(new URL('live/',root)),'initial pipeline requires untouched schedule; inspect existing state');
async function command(stage,args){
 console.log(JSON.stringify({stage,state:'starting'}));
 const code=await new Promise((done,reject)=>{const child=spawn(process.execPath,args,{cwd:new URL('../',root),stdio:'inherit'});child.on('error',reject);child.on('close',done);});
 need(code===0,stage+' failed; no next stage');console.log(JSON.stringify({stage,state:'complete'}));
}
await command('h21-live',['live-admission-v1/run.mjs',credential,'24']);
need(read(new URL('prepared/schedule.json',root)).every(r=>existsSync(new URL('live/'+r.id+'/completed.json',root))),'H21 incomplete; preserve stop and review before resumption');
await command('h21-final-review',['live-admission-v1/review.mjs','live-admission-v1/review-final']);
await command('h21-final-dag',['live-admission-v1/assemble.mjs','final']);
writeFileSync(new URL('completed-76.json',root),JSON.stringify({freeze_digest:binding.freeze_digest,authority_effect:'none',open_questions_ref:'README.md'})+'\n',{flag:'wx'});
