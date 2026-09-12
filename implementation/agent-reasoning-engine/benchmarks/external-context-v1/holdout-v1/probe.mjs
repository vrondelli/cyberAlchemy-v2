// Generic fixed public diagnostic adapter; no private inputs. Open questions: PLAN.md.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {docker,start,cleanup,applyCandidate} from '../success-v1/container.mjs';import {hash} from '../common.mjs';import {enforceProbe,handleProbeError} from '../success-v1/strict-probe.mjs';
export {handleProbeError};const root=fileURLToPath(new URL('./',import.meta.url));
export function rawProbe({task_id,candidate=null,out,fixture=null}){
 const taskdir=root+'tasks/'+task_id,read=n=>JSON.parse(readFileSync(taskdir+'/'+n));const task=read('task.json'),image=read('image.json'),config=read('probe.json');
 mkdirSync(out,{recursive:true});const name='are102-public-'+Date.now(),started=Date.now();let report={candidate_id:candidate?.candidate_id??'baseline',probe_id:'public-holdout-v1',task_id,status:'started',authority_effect:'none',open_questions_ref:'PLAN.md'};
 try{
  start(name,image.id);if(docker(['exec',name,'git','rev-parse','HEAD']).trim()!==task.base_commit)throw Error('image base mismatch');if(candidate)applyCandidate(name,candidate);
  const before=docker(['exec',name,'git','diff','--binary']);let args,dest;
  if(config.kind==='runtime'){
   dest='/testbed/packages/svelte/tests/runtime-runes/samples/'+config.sample_name;docker(['cp',fixture??taskdir+'/probe',name+':'+dest]);const owner=docker(['exec',name,'stat','-c','%u',dest]).trim();if(!/^\d+$/.test(owner))throw Error('fixture owner invalid');docker(['exec','-u',owner,name,'chmod','-R','a+rwX',dest]);
   args=['exec',name,'pnpm','exec','vitest','run','packages/svelte/tests/runtime-runes/test.ts','--reporter=verbose','--maxWorkers=2','--minWorkers=1','--testTimeout=30000','-t',config.sample_name];
  }else{
   docker(['cp',root+'compiler-probe.mjs',name+':/tmp/are-public-compiler.mjs']);docker(['cp',(fixture??taskdir+'/probe')+'/main.svelte',name+':/tmp/are-public-main.svelte']);args=['exec',name,'node','/tmp/are-public-compiler.mjs'];
  }
  const r=spawnSync('docker',args,{encoding:'utf8',timeout:120000,maxBuffer:2000000}),log=(r.stdout??'')+(r.stderr??'');writeFileSync(out+'/output.log',log);
  if(docker(['exec',name,'git','diff','--binary'])!==before)throw Error('diagnostic changed tracked source');
  const modes=config.kind==='runtime'?['dom','hydrate'].map(mode=>({mode,passed:new RegExp('[✓✔] .*'+config.sample_name+' \\('+mode+'\\)').test(log)})):[{mode:'compiler',passed:log.includes('ARE_PUBLIC_COMPILER_PASS')}];
  report={...report,status:r.error?'execution_error':r.status===0&&modes.every(m=>m.passed)?'passed':new RegExp(config.intended_failure_pattern,'i').test(log)?'intended_failure':'failed',exit_code:r.status,execution_error:r.error?{code:r.error.code,message:r.error.message}:null,modes,log_sha256:hash(log),excerpt:log.slice(-9000)};
  try{const path=config.kind==='runtime'?dest+'/_output/client/main.svelte.js':'/tmp/are-public-compiled.js',compiled=docker(['exec',name,'cat',path]);writeFileSync(out+'/compiled-client.js',compiled);report.compiled_client=compiled.slice(0,12000);}catch{}
 }catch(e){report.status='execution_error';report.error=e.message.slice(0,1200);}finally{cleanup(name);report.cleanup_verified=true;report.elapsed_ms=Date.now()-started;writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');}
 return report;
}
export const runProbe=args=>enforceProbe(rawProbe,args);
if(process.argv[1]===fileURLToPath(import.meta.url)){const r=rawProbe({task_id:process.argv[2],out:process.argv[3]});console.log(JSON.stringify({status:r.status,modes:r.modes,cleanup_verified:r.cleanup_verified,error:r.error,excerpt:r.excerpt?.slice(-2000)}));}
