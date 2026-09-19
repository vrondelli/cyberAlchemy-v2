// Exact production join. Open questions: RECOVERY-PRODUCTION.md.
import assert from 'node:assert/strict';
import {readFileSync,realpathSync,lstatSync,existsSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {launchRecovery} from './recovery-launcher.mjs';
import {createGenerationProcess} from './recovery-generation-process.mjs';
import {validateConfig,buildCell,accountReceipts} from './discovery-v1/run-recovery-pair.mjs';
import {hydrateReferencedSeal} from './referenced-generation-seal.mjs';
import {campaignContract} from './recovery-campaign.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';
const read=p=>JSON.parse(readFileSync(p)),hash=x=>createHash('sha256').update(x).digest('hex');
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const need=(x,m)=>{if(!x)throw Error('recovery-production.'+m);};
export const COMBINED_GROWTH=2*1024**3+192*1024**2;
export function verifyProductionFreeze(path,expected){
 const bytes=readFileSync(path);need(hash(bytes)===expected,'freeze-drift');const f=JSON.parse(bytes);
 need(f.schema==='are.recovery-production-freeze/v1'&&f.files.length>0&&f.files.length<=2048,'freeze-shape');
 need(new Set(f.files.map(x=>x.path)).size===f.files.length,'duplicate-binding');
 for(const file of f.files){need(resolve(file.path)===file.path&&realpathSync(file.path)===file.path&&lstatSync(file.path).isFile(),'binding-path');need(hash(readFileSync(file.path))===file.sha256,'source-drift:'+file.path);}
 return f;
}
export function qualifyProduction({manifest_path,manifest_sha256}){
 const f=verifyProductionFreeze(manifest_path,manifest_sha256),config=read(f.config_path),binding=read(f.binding_path),cohort=read(f.cohort_path);
 need(hash(readFileSync(f.config_path))===cohort.source_config_sha256,'original-config');validateConfig(config);
 need(config.model==='glm-5.3-flash'&&config.tasks.length===4&&f.workers===2,'fixed-cohort');
 const expected=config.tasks.map(t=>({task_id:t.id,instance_id:t.instance_id,task_path:t.task_path,task_sha256:t.task_sha256,base_commit:t.base_commit}));
 assert.deepEqual(expected,cohort.cohort,'prospective fixed cohort');
 need(f.generation_deadline_ms===150*60*1000&&f.qualification_deadline_ms===120000&&f.score_deadline_ms===60*60*1000,'fixed-deadlines');
 const tasks=[];
 for(const t of config.tasks){
  need(hash(readFileSync(t.task_path))===t.task_sha256,'task-drift');
  const git=args=>execFileSync('git',['--no-optional-locks','-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false','-C',t.repository_cache,...args],{timeout:10000,maxBuffer:8*1024**2,encoding:'utf8',env:{...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_OPTIONAL_LOCKS:'0',GIT_NO_LAZY_FETCH:'1',GIT_ALLOW_PROTOCOL:'',GIT_TERMINAL_PROMPT:'0'}});
  need(git(['rev-parse','--verify',t.base_commit+'^{commit}']).trim()===t.base_commit,'base-commit');
  need(!git(['ls-tree','-r',t.base_commit]).split('\n').some(x=>/^(120000|160000) /.test(x)),'unsupported-source-entry');
  for(const arm of ['control','treatment']){const c=buildCell({config,task_id:t.id,arm});need(c.limits.recovery_visibility===(arm==='control'?'eager':'demand')&&c.limits.discovery_retention===true&&c.provider_profile.request_tokenizer_transport_attempts===1&&c.provider_profile.index_tokenizer_transport_attempts===1,'arm-contract');}
  tasks.push({id:t.id,task_verified:true,base_verified:true});
 }
 const capacity=Object.values(f.roots).map(output=>guardStorage({binding,output,growth_reservation_bytes:COMBINED_GROWTH}));
 return {admitted:true,manifest_sha256,tasks,capacity,combined_growth_bytes:COMBINED_GROWTH,provider_calls:0};
}
export function reconcileProduction({config,generation_root,terminal}){
 need(terminal?.status==='sealed'&&terminal.workers_settled,'sealed-generation-required');
 const seal=read(join(generation_root,'GENERATION-SEAL.json'));assert.deepEqual(seal,terminal.seal,'saved global seal');
 const pairs=hydrateReferencedSeal({root:generation_root,seal,expected_slots:terminal.outcomes.map(r=>r.reference),...campaignContract({config,root:generation_root})});
 const arms=[];
 for(const {result:pair}of pairs)for(const arm of ['control','treatment']){
  const a=pair.arms[arm];need(a.result_path,'all-arms-dispatched');const r=read(a.result_path),directory=join(a.run_directory,'state');
  need(!existsSync(join(directory,'writer.lock')),'writer-not-settled');
  const ledger=read(join(directory,'glm-transport-ledger.json')),{ledger_digest,...body}=ledger;
  need(hash(stable(body))===ledger_digest&&body.phase==='idle','ledger-not-settled');
  assert.deepEqual(ledger.receipts,r.receipts,'raw result equals durable transport receipts');
  need(ledger.model_calls===r.receipts.filter(x=>x.kind==='model').length&&ledger.tokenizer_calls===r.receipts.filter(x=>x.kind==='tokenizer').length,'attempt-counts');
  const task=config.tasks.find(t=>t.id===pair.task_id),cell=buildCell({config,task_id:task.id,arm}),publicTask=read(task.task_path);
  const scope={request:publicTask.problem_statement,instance_id:publicTask.instance_id,cell_id:cell.cell_id,cell_sha256:hash(stable(cell))};
  need(ledger.binding===hash(stable(scope)),'ledger-scope');
  const usage=accountReceipts(r.receipts);assert.deepEqual(usage,a.usage,'receipt totals');
  need(usage.unknown_usage_calls===0&&usage.model_calls<=96&&usage.total_tokens<=96000,'complete-bounded-usage');
  need(r.receipts.every(x=>x.status===200&&x.dispatched===true&&x.automatic_retries===0),'successful-single-attempts');
  const index=r.index_tokenizer_receipts??[];need(index.length<=512&&index.every(x=>x.status===200&&x.dispatched===true&&Number.isSafeInteger(x.tokens)&&x.tokens>=0&&x.transport_attempts.length===1&&x.transport_attempts[0].status===200),'index-tokenizer-settlement');
  need(ledger.tokenizer_calls<=291,'request-tokenizer-ceiling');
  arms.push({task_id:task.id,arm,known_tokens:usage.total_tokens,model_calls:usage.model_calls,index_tokenizer_calls:index.length,request_tokenizer_calls:ledger.tokenizer_calls});
 }
 need(arms.length===8&&arms.reduce((n,a)=>n+a.known_tokens,0)===terminal.usage.total_tokens,'fixed-accounting');
 return {verified:true,arms,known_tokens:terminal.usage.total_tokens,unknown_usage_calls:0};
}
export async function runProductionStage({operation,args,deadline_ms,signal}){
 need(['qualify','score'].includes(operation),'stage-operation');
 const processRun=createGenerationProcess({worker:fileURLToPath(new URL('./recovery-stage-worker.mjs',import.meta.url)),kill_grace_ms:1000});
 const abort=new AbortController(),cancel=()=>abort.abort();signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();
 const timer=setTimeout(cancel,deadline_ms);let terminal=null;
 try{terminal=await processRun.generate({config:{operation,args},signal:abort.signal});const receipt=await processRun.settle({terminal});need(receipt.local_settled&&!abort.signal.aborted,'stage-deadline-or-cancel');return terminal;}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',cancel);}
}
export async function runProduction({manifest_path,manifest_sha256,review_path,signal}){
 const f=verifyProductionFreeze(manifest_path,manifest_sha256),review=read(review_path);
 need(review.approved===true&&review.live_execution_admitted===true&&review.manifest_sha256===manifest_sha256,'exact-live-review-required');
 const config=read(f.config_path),binding=read(f.binding_path),processRun=createGenerationProcess();
 for(const root of Object.values(f.roots))mkdirSync(root,{recursive:true,mode:0o700});
 const qualify=()=>runProductionStage({operation:'qualify',args:{manifest_path,manifest_sha256},deadline_ms:f.qualification_deadline_ms,signal});
 return await launchRecovery({config,binding,...f.roots,signal,deadline_ms:f.generation_deadline_ms,qualify,
 generate:async args=>{verifyProductionFreeze(manifest_path,manifest_sha256);return await processRun.generate(args);},
 settle:async args=>{const local=await processRun.settle(args);need(local.local_settled,'local-process-not-settled');verifyProductionFreeze(manifest_path,manifest_sha256);const reconciliation=reconcileProduction({...args,config});return {...local,reconciliation};},
 score:async args=>{const {host_guard,...serializable}=args;const result=await runProductionStage({operation:'score',args:{...serializable,manifest_path,manifest_sha256},deadline_ms:f.score_deadline_ms,signal});verifyProductionFreeze(manifest_path,manifest_sha256);return result;}
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [manifest_path,manifest_sha256,review_path]=process.argv.slice(2);const abort=new AbortController();
 process.on('SIGINT',()=>abort.abort());process.on('SIGTERM',()=>abort.abort());
 try{const result=await runProduction({manifest_path,manifest_sha256,review_path,signal:abort.signal});console.log(JSON.stringify({status:result.status,failure:result.failure,known_usage:result.known_usage,development_target_passed:result.development_target_passed}));process.exitCode=result.status==='scored'?0:2;}
 catch(error){console.error(String(error.message));process.exitCode=2;}
}
