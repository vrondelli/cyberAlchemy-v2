// Reapply exact model artifact to the isolated evaluator. Open questions: README.md.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {resolve} from 'node:path';import {spawnSync} from 'node:child_process';import {hash} from '../common.mjs';
const root=fileURLToPath(new URL('./',import.meta.url)),attempt=process.argv[2],out=process.argv[3];if(attempt!=='pressure-strict-1'||!out)throw Error('usage: node reproduce-pressure-strict.mjs pressure-strict-1 NEW_OUTPUT_DIRECTORY');
const freeze=JSON.parse(readFileSync(root+'freeze-'+attempt+'.json'));for(const f of freeze.sources)if(hash(readFileSync(root+f.path))!==f.sha256)throw Error('source drift');
const result=JSON.parse(readFileSync(root+'evidence/'+attempt+'/result.json')),patch=root+'evidence/'+attempt+'/prediction.patch';if(!result.patch_produced||hash(readFileSync(patch))!==result.patch_sha256)throw Error('model patch missing or changed');if(existsSync(out))throw Error('output must be new');
const started_at=new Date().toISOString(),evaluator_sha256=hash(readFileSync(root+'../evaluate.py'));
const cache=process.env.ARE_BENCHMARK_CACHE??'/home/vrondelli/.cache/are-external92';const r=spawnSync('python3',[root+'../evaluate.py',cache,'clean101-'+attempt,resolve(out),patch],{stdio:'inherit',timeout:1800000});if(r.error)throw r.error;if(r.status)process.exitCode=r.status;

if(hash(readFileSync(patch))!==result.patch_sha256)throw Error('patch changed during evaluation');
if(existsSync(out+'/report.json'))writeFileSync(out+'/invocation.json',JSON.stringify({attempt,started_at,completed_at:new Date().toISOString(),patch_sha256:result.patch_sha256,evaluator_sha256,report_sha256:hash(readFileSync(out+'/report.json')),freeze_sha256:hash(readFileSync(root+'freeze-'+attempt+'.json')),output_directory:resolve(out),authority_effect:'none',open_questions_ref:'../../../CLEAN-PLAN.md'},null,2)+'\n',{flag:'wx'});
