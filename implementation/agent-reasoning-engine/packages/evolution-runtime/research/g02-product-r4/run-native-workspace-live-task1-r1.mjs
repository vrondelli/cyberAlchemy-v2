// One already-exposed native canary, WSL source/evidence + VPS-only GLM.
// Open Questions: evidence/G02-NATIVE-CANDIDATE-WORKSPACE-R1.md.
import {existsSync,mkdirSync,readFileSync,writeFileSync,appendFileSync,statfsSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {buildNativeWorkspaceOverlay} from './build-native-workspace-overlay-r1.mjs';
import {callVpsProvider,providerBody,RELAY_SHA} from './wsl-vps-provider-r1.mjs';
import {createStatelessRecyclingTransport,openContextRecycling} from '../../../coding-agent-runtime/context-recycling.mjs';
import {createRepositoryTools,tools as repositoryTools} from '../../../../benchmarks/contextbench-v1/repository-tools.mjs';
import {stable,bindDelivery} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
const here=dirname(fileURLToPath(import.meta.url)),project=resolve(here,'../../../../../..');
const root='/home/vlad_/are-benchmark-archive/g02-native-workspace-live-exposed-task1-r1b-20261006';
const raw='/home/vlad_/are-benchmark-archive/g02-product-replication-r11-20261002/pairs/01-pr11-mixed-01/raw';
const base=join(raw,'sources/session/base');
const sha=x=>createHash('sha256').update(typeof x==='string'||x instanceof Uint8Array?x:stable(x)).digest('hex');
const save=(name,v)=>writeFileSync(join(root,name),JSON.stringify(v,null,2)+'\n',{flag:'wx',mode:0o600});
const git=(...args)=>execFileSync('git',['-c',`safe.directory=${base}`,'-c','core.hooksPath=/dev/null',
  '-c','core.fsmonitor=false','-C',base,...args],{encoding:'utf8',timeout:120000,maxBuffer:16000000});
const requireIt=(v,r)=>{if(!v)throw Error('workspace-canary.'+r);};
requireIt(!existsSync(root),'output-exists-no-replay');
const binding=JSON.parse(readFileSync(join(raw,'tasks/binding.json')));
const taskBytes=readFileSync(join(raw,'tasks',binding.task_file));
requireIt(sha(taskBytes)===binding.task_sha256&&binding.task_sha256==='f9b796d655b52b3e68c10d9109cedc8fc1e67fe35b1c20d2a69d842278fea369','task-pin');
const task=JSON.parse(taskBytes),cell=JSON.parse(readFileSync(join(raw,'evidence/run/started.json'))).cell;
requireIt(task.instance_id===binding.instance_id&&task.base_commit===binding.base_commit&&
  git('rev-parse','HEAD').trim()===task.base_commit&&!git('diff','--name-only','HEAD').trim(),'base-identity');
const archive='/home/vlad_/are-benchmark-archive/g02-native-workspace-r1-20261006';
const constructionBytes=readFileSync(join(archive,'CONSTRUCTION-SEAL.json'));
requireIt(sha(constructionBytes)==='2869c8c3c9aa26645af7bb0c309a69f06309da508ce0864e3021084b0ea8db62','construction-pin');
const construction=JSON.parse(constructionBytes);
for(const name of ['candidate-workspace-r1.mjs','build-native-workspace-overlay-r1.mjs'])
  requireIt(sha(readFileSync(join(here,name)))===construction.source_sha256[name],'construction-source-drift');
const probe='/home/vlad_/are-benchmark-archive/g02-wsl-vps-provider-probe-r1-20261006';
requireIt(sha(readFileSync(join(probe,'RESULT.json')))==='a551d691d7fd3517132bd5ac06de542beb65df4f5071a60bf8dfc6a10da7b797','provider-probe-pin');
const probeFreeze=JSON.parse(readFileSync(join(probe,'FREEZE.json')));
for(const name of ['vps-json-provider-r1.mjs','wsl-vps-provider-r1.mjs'])
  requireIt(sha(readFileSync(join(here,name)))===probeFreeze.source_sha256[name],'provider-source-drift');
const capacity=()=>{const fs=statfsSync(root);requireIt(fs.bavail*fs.bsize>=8*1024**3,'wsl-evidence-reserve');};
const canonical=join(project,'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/episode-recovery-v2.mjs');
const batch=join(dirname(canonical),'../full-cycle-79/snapshot/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/tool-batch-policy.mjs');
requireIt(sha(readFileSync(batch))==='a7e21ab77b111bfde17da1bc4b4084e9137039782eee4509acfa900d1151c1df','batch-policy-pin');
let overlay=buildNativeWorkspaceOverlay(readFileSync(join(raw,'code/episode-recovery-v2.mjs'),'utf8'));
const directImports={};
overlay=overlay.replace(/from '([^']+)'/g,(m,s)=>{
  if(!s.startsWith('.')||s==='./candidate-workspace-r1.mjs')return m;
  const target=s==='../tool-batch-policy.mjs'?batch:resolve(dirname(canonical),s);
  directImports[target]=sha(readFileSync(target));return `from '${pathToFileURL(target).href}'`;
});
mkdirSync(root,{mode:0o700});mkdirSync(join(root,'requests'));mkdirSync(join(root,'snapshots'));
capacity();
for(const [name,data] of [['episode.mjs',overlay],['candidate-workspace-r1.mjs',readFileSync(join(here,'candidate-workspace-r1.mjs'))],
  ['ranked-source-acquisition.mjs',readFileSync(join(raw,'code/ranked-source-acquisition.mjs'))],
  ['ranked-source-acquisition-base.mjs',readFileSync(join(raw,'code/base-overlay.mjs'))]])
  writeFileSync(join(root,name),data,{flag:'wx',mode:0o600});
const {runEpisode}=await import(pathToFileURL(join(root,'episode.mjs')));
const {createRankedSourceAcquisition,rankSourcesTool}=await import(pathToFileURL(join(root,'ranked-source-acquisition.mjs')));
const ranker=createRankedSourceAcquisition({root:base,base_commit:task.base_commit,problem_statement:task.problem_statement});
const snapshots=new Map();
const repository=createRepositoryTools({root:base,base_commit:task.base_commit,record_source:s=>{
  const id=sha([s.path,s.source_sha256]);if(!snapshots.has(id)){
    save('snapshots/'+id+'.json',s);snapshots.set(id,s);}
}});
const names=['list_files','read_file','search','get_patch'];
const tools=[...repositoryTools.filter(t=>names.includes(t.function.name)),rankSourcesTool];
const execute_tool=async(name,args)=>{
  requireIt([...names,'rank_sources'].includes(name),'repository-write-or-unknown-tool');
  capacity();
  if(name==='rank_sources'){
    requireIt(args&&Object.keys(args).join(',')==='query'&&typeof args.query==='string','rank-arguments');
    return {ok:true,output:ranker.query(args.query)};
  }
  return repository(name,args);
};
const dependencyRoots=[...Object.keys(directImports),fileURLToPath(import.meta.url),
  join(here,'wsl-vps-provider-r1.mjs'),join(project,'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs'),
  join(project,'implementation/agent-reasoning-engine/packages/coding-agent-runtime/context-recycling.mjs')];
const dependencies={};
function traceImports(file){
  if(dependencies[file])return;const b=readFileSync(file),text=b.toString('utf8');dependencies[file]=sha(b);
  // Bound to actual single-line import declarations, not generated-source strings.
  for(const match of text.matchAll(/^\s*import\s+[^;\n]*?\sfrom\s+['"]([^'"]+)['"]/gm)){
    const spec=match[1];if(spec.startsWith('.'))traceImports(resolve(dirname(file),spec));
  }
}
for(const file of dependencyRoots)traceImports(file);
const protocol=readFileSync(join(here,'../../evidence/G02-NATIVE-CANDIDATE-WORKSPACE-R1.md'));
writeFileSync(join(root,'PROTOCOL.md'),protocol,{flag:'wx',mode:0o600});
save('FREEZE.json',{schema_version:'are.g02-native-workspace-task1-freeze/v1',status:'frozen-before-provider',
  task_sha256:sha(taskBytes),instance_id:task.instance_id,base_commit:task.base_commit,
  construction_sha256:sha(constructionBytes),relay_sha256:RELAY_SHA,provider_probe_sha256:sha(readFileSync(join(probe,'RESULT.json'))),
  limits:cell.limits,context_limit:cell.context_limit,recycle_at:cell.recycle_at,safety_margin:cell.safety_margin,
  maximum_model_requests:20,maximum_request_tokenizers:291,maximum_index_tokenizers:512,automatic_retries:0,
  request_margin:512,model:'glm-5.3-flash',reasoning_effort:'low',model_timeout_ms:300000,
  seed_policy:'Archived ranker and native initial-source policy; no evaluator inputs.',
  overlay_sha256:sha(overlay),module_sha256:sha(readFileSync(join(root,'candidate-workspace-r1.mjs'))),
  ranker_sha256:sha(readFileSync(join(root,'ranked-source-acquisition.mjs'))),base_ranker_sha256:sha(readFileSync(join(root,'ranked-source-acquisition-base.mjs'))),
  selected_single_line_static_import_sha256:dependencies,protocol_sha256:sha(protocol),
  execution_binding:'Existing clean immutable WSL base; selection-only tool allowlist. No worktree clone, edit, repository code execution or reference labels.',
  parity_limit:'Pinned archived episode/ranker; selected one-line local static imports recorded, not all VPS deployment dependencies, dynamic imports or CommonJS transitive closure verified.',
  functionality_gate:'Terminal native export, at least one accepted workspace update, zero unmapped delivery, complete known provider usage, unchanged base. Not a quality advancement gate.',
  claim_ceiling:'One exposed functional canary; archived task comparison is not matched evidence or superiority.'});
for(const [file,expected] of Object.entries(dependencies))requireIt(sha(readFileSync(file))===expected,'helper-drift-before-dispatch');
save('STARTED.json',{started_at:new Date().toISOString(),freeze_sha256:sha(readFileSync(join(root,'FREEZE.json')))});
const receipts=[],measurements=new Map();let modelCount=0,requestTokenizers=0,indexTokenizers=0,sequence=0;
const validUsage=x=>Number.isSafeInteger(x)&&x>=0;
async function invoke(operation,prompt,index=false){
  capacity();const request=JSON.parse(prompt);requireIt(Array.isArray(request.messages)&&Array.isArray(request.tools)&&
    Object.keys(request).every(k=>['messages','tools'].includes(k)),'prompt-shape');
  if(operation==='generate')requireIt(++modelCount<=20,'model-call-cap');
  else if(index)requireIt(++indexTokenizers<=512,'index-tokenizer-cap');
  else requireIt(++requestTokenizers<=291,'request-tokenizer-cap');
  const ordinal=++sequence,id='workspace-task1-'+ordinal,input={operation,request_id:id,...request,output_cap:8192};
  save('requests/'+ordinal+'-STARTED.json',{input,request_sha256:sha(providerBody(input)),started_at:new Date().toISOString()});
  const r=await callVpsProvider(input);save('requests/'+ordinal+'-REPLY.json',r);
  const receipt={kind:operation==='generate'?'model':'tokenizer',model:'glm-5.3-flash',request_sha256:sha(providerBody(input)),
    dispatched:true,dispatch_uncertain:r.dispatch_uncertain===true,status:r.status??null,failure_code:r.failure_code??null,
    input_tokens:r.prompt_tokens??null,output_tokens:operation==='generate'?r.completion_tokens??null:0,
    output_cap:8192,reasoning_effort:'low',finish_reason:r.public_response?.finish_reason??null,
    latency_ms:r.latency_ms??null,ssh_elapsed_ms:r.ssh_elapsed_ms,response_bytes:r.response_bytes??null,
    automatic_retries:0,redirects_followed:0,authority_effect:'none'};
  receipts.push(receipt);
  save('requests/'+ordinal+'-RECEIPT.json',receipt);
  if(r.dispatch_uncertain||r.status!==200||r.failure_code||!validUsage(r.prompt_tokens))throw Error('provider-unconfirmed-or-invalid');
  if(operation==='generate'){
    requireIt(validUsage(r.completion_tokens),'unknown-generation-usage');
    requireIt(r.prompt_tokens<=measurements.get(sha(prompt)),'measured-input-bound-exceeded');
    const p=r.public_response;
    requireIt(p?.message?.role==='assistant'&&['stop','tool_calls'].includes(p.finish_reason),'public-response-invalid');
    if(p.finish_reason==='tool_calls')requireIt(Array.isArray(p.message.tool_calls)&&p.message.tool_calls.length>0,'tool-response-invalid');
    else requireIt(typeof p.message.content==='string','final-content-invalid');
    console.log(JSON.stringify({model_call:modelCount,known_tokens:r.prompt_tokens+r.completion_tokens,finish:p.finish_reason}));
    return {receipt,final_bytes:stable(p)};
  }
  return r.prompt_tokens+512;
}
const transport=createStatelessRecyclingTransport({adapter_id:'g02-wsl-vps-native-canary-r1',source_ref:fileURLToPath(import.meta.url),
  maximum_output_tokens:8192,measure_request:async({prompt})=>{
    const id=sha(prompt);if(!measurements.has(id))measurements.set(id,await invoke('tokenize',prompt));return measurements.get(id);},
  request_once:async({prompt})=>invoke('generate',prompt)});
const recycler=openContextRecycling({transport,fixture_root:base,scope:{request:task.problem_statement,instance_id:task.instance_id},
  options:{directory:join(root,'state'),context_limit:cell.context_limit,recycle_at:cell.recycle_at,safety_margin:cell.safety_margin,
    state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:[task.base_commit]}}});
const started=Date.now();let result=null,nativeExport=null,error=null;
try{
  result=await runEpisode({task,arm:cell.arm,client:{receipts,maximum_model_retries:0},recycler,tools,execute_tool,
    measure_index_tokens:text=>invoke('tokenize',stable({messages:[{role:'user',content:text}],tools:[]}),true),
    limits:cell.limits,run_id:'g02-workspace-task1-r1',source_context:()=>({snapshots:[...snapshots.values()],repoRoot:base,patch:''}),
    system_appendix:ranker.summary,initial_source_hints:ranker.primer.hints,initial_focused_source_hints:ranker.focused_source_hints,
    on_event:async event=>appendFileSync(join(root,'events.jsonl'),stable(event)+'\n',{mode:0o600})});
  if(result.status==='final_context_selected'){
    const {exportTerminalEvidenceSelection}=await import(pathToFileURL(join(dirname(canonical),'../terminal-evidence.mjs')));
    nativeExport=exportTerminalEvidenceSelection({...result,packet:result.terminal_evidence_packet,
      response_capture:result.response_captures.at(-1),source_snapshots:[...snapshots.values()],task},base);
    requireIt(stable(nativeExport.selection)===stable(result.selection),'native-selection-export-mismatch');
    save('prediction.json',nativeExport.prediction);save('EXPORT.json',nativeExport);
  }
}catch(e){error=String(e.message).slice(0,160);}finally{recycler.close();}
const models=receipts.filter(r=>r.kind==='model'),unknown=models.filter(r=>!validUsage(r.input_tokens)||!validUsage(r.output_tokens)||r.dispatch_uncertain).length;
const bound=result?bindDelivery({captures:result.captures,receipts}):null;
const unchanged=git('rev-parse','HEAD').trim()===task.base_commit&&!git('diff','--name-only','HEAD').trim();
const passed=!error&&!!nativeExport&&result.candidate_workspace.generation>=1&&bound.unmapped.length===0&&unknown===0&&unchanged;
save('RESULT.json',{status:passed?'functional-canary-passed':'functional-canary-failed',error,result,native_export:!!nativeExport,
  known_model_tokens:models.filter(r=>validUsage(r.input_tokens)&&validUsage(r.output_tokens)).reduce((n,r)=>n+r.input_tokens+r.output_tokens,0),
  unknown_model_usage:unknown,model_calls:modelCount,request_tokenizers:requestTokenizers,index_tokenizers:indexTokenizers,
  elapsed_ms:Date.now()-started,unchanged_base:unchanged,benchmark_cleared:false});
save('PRE-SCORE-SEAL.json',{status:'terminal-before-evaluator',score_unopened:true,freeze_sha256:sha(readFileSync(join(root,'FREEZE.json'))),
  result_sha256:sha(readFileSync(join(root,'RESULT.json'))),prediction_sha256:nativeExport?sha(readFileSync(join(root,'prediction.json'))):null,
  claim_ceiling:'Functional exposed canary only, not matched quality or superiority.'});
console.log(JSON.stringify({root,status:passed?'functional-canary-passed':'functional-canary-failed',episode_status:result?.status,
  error:error??result?.error,model_calls:modelCount,workspace_generation:result?.candidate_workspace?.generation,
  result_sha256:sha(readFileSync(join(root,'RESULT.json')))}));
