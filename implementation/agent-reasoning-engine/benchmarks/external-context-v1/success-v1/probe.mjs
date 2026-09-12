// Public issue reproduction only; no benchmark private test input. Open questions: README.md.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {docker,start,cleanup,applyCandidate} from './container.mjs';import {hash} from '../common.mjs';
const root=fileURLToPath(new URL('./',import.meta.url));
export function runProbe({candidate=null,out,fixture=root+'probe'}){
 mkdirSync(out,{recursive:true});const name='are97-probe-'+Date.now();const image=JSON.parse(readFileSync(root+'../prepared/image.json'));const task=JSON.parse(readFileSync(root+'../prepared/task.json'));const started=Date.now();let report={candidate_id:candidate?.candidate_id??'baseline',probe_id:'public-async-snippet-v1',status:'started',authority_effect:'none',open_questions_ref:'../../../README.md'};
 try{
 start(name,image.id);if(docker(['exec',name,'git','rev-parse','HEAD']).trim()!==task.base_commit)throw Error('image base mismatch');
 if(candidate)applyCandidate(name,candidate);
 const before=docker(['exec',name,'git','diff','--binary']);
 const dest='/testbed/packages/svelte/tests/runtime-runes/samples/async-are-public-snippet';docker(['cp',fixture,name+':'+dest]);const owner=docker(['exec',name,'stat','-c','%u',dest]).trim();if(!/^\d+$/.test(owner))throw Error('fixture owner invalid');docker(['exec','-u',owner,name,'chmod','-R','a+rwX',dest]);
 const args=['exec',name,'pnpm','exec','vitest','run','packages/svelte/tests/runtime-runes/test.ts','--reporter=verbose','--maxWorkers=2','--minWorkers=1','--testTimeout=30000','-t','async-are-public-snippet'];
 const r=spawnSync('docker',args,{encoding:'utf8',timeout:120000,maxBuffer:2000000});const log=(r.stdout??'')+(r.stderr??'');writeFileSync(out+'/output.log',log);
 if(docker(['exec',name,'git','diff','--binary'])!==before)throw Error('diagnostic changed tracked source');
 const modes=['dom','hydrate'].map(mode=>({mode,passed:new RegExp('[✓✔] .*async-are-public-snippet \\('+mode+'\\)').test(log)}));
 report={...report,status:r.error?'execution_error':r.status===0&&modes.every(m=>m.passed)?'passed':/ReferenceError: value is not defined/.test(log)?'intended_failure':'failed',exit_code:r.status,modes,log_sha256:hash(log),excerpt:log.slice(-9000)};
 try{const compiled=docker(['exec',name,'cat',dest+'/_output/client/Child.svelte.js']);writeFileSync(out+'/compiled-client.js',compiled);report.compiled_client=compiled.slice(0,12000);report.compiled_truncated=compiled.length>12000;}catch{}
 }catch(e){report.status='execution_error';report.error=e.message.slice(0,1000);}finally{cleanup(name);report.cleanup_verified=true;report.elapsed_ms=Date.now()-started;writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');}
 return report;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const out=process.argv[2],c=process.argv[3]?JSON.parse(readFileSync(process.argv[3])):null;console.log(JSON.stringify(runProbe({out,candidate:c})));}
