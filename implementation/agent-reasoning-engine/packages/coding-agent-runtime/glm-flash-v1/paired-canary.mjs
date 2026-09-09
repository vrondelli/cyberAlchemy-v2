import {accessSync, constants, closeSync, fsyncSync, mkdirSync, openSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseCredential} from './cli.mjs';
import {runCanary, createFixture, addRecyclingFixture, canaryRequest} from './canary.mjs';
import {snapshotTree} from '../verifier.mjs';
import {createGlmClient, MODEL, hash, need, GlmError} from './transport.mjs';

export const PAIR_LIMITS = Object.freeze({maximum_model_calls:24,maximum_tokenizer_calls:48,maximum_elapsed_ms:1200000});

const ordinaryFailures = new Set(['glm.model-request-limit','glm.tokenizer-limit','glm.tool-call-limit',
  'glm.run-deadline-exceeded',
  'glm.candidate-invalid','glm.candidate-scope-invalid','glm.incomplete-output','glm.tool-result-too-large',
  'glm.request-too-large','recycling.fresh-context-too-large']);

function writeEvidence(path, value) {
 const fd=openSync(path,'wx',0o600);
 try {writeFileSync(fd,JSON.stringify(value,null,2)+'\n');fsyncSync(fd);} finally {closeSync(fd);}
 const directory=openSync(dirname(path),'r');try{fsyncSync(directory);}finally{closeSync(directory);}
}

export function runtimeSources() {
 // Conservatively pin direct runtime modules as well as this GLM package.
 // Do not parse imports with regex: fixture strings also contain import text.
 const local=dirname(fileURLToPath(import.meta.url));
 return [dirname(local),local].flatMap(root=>readdirSync(root,{withFileTypes:true})
  .filter(item=>item.isFile() && item.name.endsWith('.mjs') && item.name!=='test.mjs' && !item.name.endsWith('.test.mjs'))
  .map(item=>({path:join(root,item.name),sha256:hash(readFileSync(join(root,item.name),'utf8'))}))).concat([{path:join(dirname(local),'schemas/patch-set-candidate.schema.json'),sha256:hash(readFileSync(join(dirname(local),'schemas/patch-set-candidate.schema.json'),'utf8'))}])
  .sort((a,b)=>a.path.localeCompare(b.path));
}
const loadedSources=runtimeSources();

function bridgePreflight(credential) {
 need(process.versions.node==='26.8.1','pair-node-version');
 need(credential.python_command && credential.project_root,'pair-explicit-bridge-required');
 accessSync(credential.python_command,constants.X_OK);
 accessSync(join(credential.project_root,'secret_management','bridge.py'),constants.R_OK);
 const sources=[];
 const walk=root=>{for(const item of readdirSync(root,{withFileTypes:true})) {
  const path=join(root,item.name);
  if(item.isDirectory() && item.name!=='__pycache__')walk(path);
  else if(item.isFile() && item.name.endsWith('.py'))sources.push({path,sha256:hash(readFileSync(path,'utf8'))});
 }};
 walk(join(credential.project_root,'secret_management'));
 return sources.sort((a,b)=>a.path.localeCompare(b.path));
}

// Dependency seams are trusted in-process tests, never JSON/CLI configuration.
export async function runPairedCanary({directory,credential,limits=PAIR_LIMITS,treatment_policy='recent-observations-v1',recycle_at=5000},
 {run_canary=runCanary,create_client=createGlmClient,snapshot_sources=runtimeSources,preflight=bridgePreflight,now=Date.now,report=console.log}={}) {
 const selected=parseCredential(credential);
 need(['recent-observations-v1','recent-observations-v2'].includes(treatment_policy),'pair-treatment-invalid');
 need([5000,8000].includes(recycle_at),'pair-threshold-invalid');
 const policies=['clear-v1',treatment_policy];
 need(hash(limits)===hash(PAIR_LIMITS),'pair-limits-invalid');
 need(typeof directory==='string' && directory.length>0,'pair-directory-required');
 const sources=snapshot_sources(),bridgeSources=preflight(selected);
 if(snapshot_sources===runtimeSources)need(hash(sources)===hash(loadedSources),'pair-source-drift');
 const dir=resolve(directory);mkdirSync(dir,{mode:0o700});
 const root=createFixture(dir),casePaths=addRecyclingFixture(root),before=snapshotTree(root);
 const task={request_sha256:hash(canaryRequest(casePaths)),fixture_tree_sha256:before.tree_sha256};
 const started=now(),arms=[];
 const manifest={schema_version:'are.glm-paired-canary-manifest/v1',model:MODEL,scenario:'queue-recycling',
  status:'prepared',policies,limits,per_arm_timeout_ms:580000,context_policy:{context_limit:16384,recycle_at,safety_margin:1024,maximum_output_tokens:2048},
  task,sources,bridge_sources:bridgeSources,node_version:process.versions.node,started_at:new Date(started).toISOString(),automatic_retries:0,
  credential_reference_sha256:hash(selected),authority_effect:'none',open_questions:['One run per arm is a smoke comparison, not a statistically established improvement.','Provider internal compaction remains unobserved.']};
 writeEvidence(join(dir,'manifest.json'),manifest);
 let status='COMPLETED',reason=null,armsStarted=0;
 try {
  for(const [index,retention_policy] of policies.entries()) {
   need(hash(snapshot_sources())===hash(sources) && hash(preflight(selected))===hash(bridgeSources),'pair-source-drift');
   const modelUsed=arms.reduce((n,a)=>n+a.model_requests,0),tokenizerUsed=arms.reduce((n,a)=>n+a.tokenizer_requests,0);
   need(modelUsed+12<=limits.maximum_model_calls && tokenizerUsed+24<=limits.maximum_tokenizer_calls,'pair-call-budget');
   const remaining=limits.maximum_elapsed_ms-(now()-started);
   // Equal arm deadlines; reserve 20 seconds for verification and evidence.
   need(remaining>=600000,'pair-time-budget');
   writeEvidence(join(dir,`arm-${index}-started.json`),{index,retention_policy,started_at:new Date(now()).toISOString(),task,remaining_ms:remaining,authority_effect:'none'});
   armsStarted++;
   const controller=new AbortController();
   const timer=setTimeout(()=>controller.abort(),580000);
   let arm;
   try {
    arm=await run_canary(selected,{scenario:'queue-recycling',retention_policy,recycle_at,expected_task:task,report,
     create_client:options=>create_client({...options,signal:AbortSignal.any([options.signal,controller.signal].filter(Boolean))})});
   } finally {clearTimeout(timer);}
   writeEvidence(join(dir,`arm-${index}-completed.json`),arm);
   need(arm.retention_policy===retention_policy && arm.request_sha256===task.request_sha256 && arm.fixture_tree_sha256===task.fixture_tree_sha256,'paired-task-drift');
   need(hash(arm.context_policy)===hash(manifest.context_policy),'pair-context-drift');
   for(const [field,cap] of [['model_requests',12],['tokenizer_requests',24]])need(Number.isSafeInteger(arm[field]) && arm[field]>=0 && arm[field]<=cap,'pair-call-budget');
   arms.push(arm);
   need(hash(snapshot_sources())===hash(sources) && hash(preflight(selected))===hash(bridgeSources),'pair-source-drift');
   need(now()-started<=limits.maximum_elapsed_ms,'pair-time-budget');
   need(arm.original_fixture_unchanged===true,'pair-fixture-drift');
   need(arm.status==='PASS_BOUNDED' || (arm.status==='BLOCK' && Array.isArray(arm.reasons)
    && (arm.reasons.length>0 ? arm.reasons.every(code=>ordinaryFailures.has(code)) : arm.agent_status==='AWAITING_APPROVAL')),'pair-unsafe-arm-failure');
  }
 } catch(error) {status='STOPPED';reason=error instanceof GlmError?error.message:'glm.pair-execution-failed';}
 const result={schema_version:'are.glm-paired-canary-result/v1',status,reason,directory:dir,manifest_sha256:hash(manifest),
  arms,arms_started:armsStarted,accounting_complete:armsStarted===arms.length,elapsed_ms:now()-started,
  model_requests:arms.reduce((n,a)=>n+a.model_requests,0),tokenizer_requests:arms.reduce((n,a)=>n+a.tokenizer_requests,0),
  authority_effect:'none',automatic_retries:0,product_approval:'not-requested',open_questions:manifest.open_questions};
 writeEvidence(join(dir,'pair-result.json'),result);report(JSON.stringify({status,reason,directory:dir,arms_completed:arms.length}));return result;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 try {
  const args=process.argv.slice(2);
  need([4,8].includes(args.length) && args[0]==='--credential' && args[2]==='--output-directory'
   && (args.length===4 || (args[4]==='--treatment' && args[6]==='--recycle-at' && /^(5000|8000)$/.test(args[7]))),'pair-usage-invalid');
  const result=await runPairedCanary({credential:JSON.parse(readFileSync(resolve(args[1]),'utf8')),directory:args[3],...(args.length===8?{treatment_policy:args[5],recycle_at:Number(args[7])}:{})});
  process.exitCode=result.status==='COMPLETED'?0:1;
 } catch {console.error('Paired canary failed before completion; inspect the selected private evidence directory.');process.exitCode=1;}
}
