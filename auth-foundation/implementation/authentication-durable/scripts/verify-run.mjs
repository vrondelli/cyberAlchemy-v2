import {suites} from './receipt-policy.mjs';
import {snapshot,root,sha} from './source-snapshot.mjs';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
const [name,command,...args]=process.argv.slice(2);
if(!suites[name]||JSON.stringify([command,...args])!==JSON.stringify(suites[name].command))throw Error('Usage: verify-run.mjs suite command args');
const dir=resolve(root,'evidence/repairs');mkdirSync(dir,{recursive:true});
rmSync(resolve(dir,name+'-receipt.json'),{force:true});
const before=snapshot(),started=new Date().toISOString(),chunks=[];
const child=spawn(command,args,{cwd:root,env:process.env,stdio:['ignore','pipe','pipe']});
for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{chunks.push(b);process.stdout.write(b);});
const code=await new Promise((done,reject)=>{child.on('error',reject);child.on('close',done);});
const after=snapshot(),log=Buffer.concat(chunks);writeFileSync(resolve(dir,name+'.txt'),log);
const artifacts={};for(const p of suites[name].artifacts){try{const bytes=readFileSync(resolve(root,'evidence',p)),result=JSON.parse(bytes);if(result.status!=='passed'&&result.verified?.verdict!=='passed')throw Error('Result not passing');artifacts[p]=sha(bytes);}catch{}}
const passed=suites[name].artifacts.every(p=>artifacts[p])&&code===0&&before.source_digest===after.source_digest;
writeFileSync(resolve(dir,name+'-receipt.json'),JSON.stringify({schema_version:'auth-source-test-receipt/v1',suite:name,status:passed?'passed':'failed',command:[command,...args],started,finished:new Date().toISOString(),exit_code:code,artifacts,source_digest:before.source_digest,after_source_digest:after.source_digest,output_sha256:sha(log),authority_effect:'none',open_questions_ref:'../../README.md#open-questions'},null,2)+'\n');
if(!passed){console.error('Test failed or source changed during execution');process.exitCode=1;}
