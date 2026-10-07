// Typed navigation development arm; historical controls are not fresh comparators.
// Open Questions: evidence/G02-INLINE-TYPED-DISCOVERY-CANDIDATE-R2.json.
import {existsSync,mkdirSync,mkdtempSync,rmdirSync,readFileSync,writeFileSync,appendFileSync,statfsSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {parseTypedSource} from './typed-navigation-r2.mjs';
import {appendPartialDefinitionMetadata} from './inline-typed-discovery-candidate-r2.mjs';
import {providerBody,RELAY_SHA} from './wsl-vps-provider-r1.mjs';
import {createMultiplexedVpsProvider,validatePrivateControlSocket} from './wsl-vps-provider-multiplexed-r2.mjs';
import {createStatelessRecyclingTransport,openContextRecycling} from '../../../coding-agent-runtime/context-recycling.mjs';
import {createRepositoryTools,tools as repositoryTools} from '../../../../benchmarks/contextbench-v1/repository-tools.mjs';
import {stable,bindDelivery,observationMaterial} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
const here=dirname(fileURLToPath(import.meta.url)),project=resolve(here,'../../../../../..');
const [campaignRoot,pair,experimentArm]=process.argv.slice(2);
if(process.argv.length!==5||campaignRoot!=='/home/vlad_/are-benchmark-archive/g02-inline-orientation-native-exposed-r1-20261006'||
  !/^(0[1-9]|1[0-2])-pr11-mixed-\d{2}$/.test(pair)||experimentArm!=='orientation')
  throw Error('matched-runner.arguments');
const campaignBytes=readFileSync(join(campaignRoot,'FREEZE.json')),campaign=JSON.parse(campaignBytes);
const caseBinding=campaign.cases.find(c=>c.pair===pair);
if(!caseBinding||campaign.source_sha256['run-native-inline-orientation-arm-r1.mjs']!==createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex'))
  throw Error('matched-runner.campaign-binding');
const root=join(campaignRoot,pair+'-'+experimentArm);
const raw='/home/vlad_/are-benchmark-archive/g02-product-replication-r11-20261002/pairs/'+pair+'/raw';
const base=join(raw,'sources/session/base');
const sha=x=>createHash('sha256').update(typeof x==='string'||x instanceof Uint8Array?x:stable(x)).digest('hex');
const save=(name,v)=>writeFileSync(join(root,name),JSON.stringify(v,null,2)+'\n',{flag:'wx',mode:0o600});
const git=(...args)=>execFileSync('git',['-c',`safe.directory=${base}`,'-c','core.hooksPath=/dev/null',
  '-c','core.fsmonitor=false','-C',base,...args],{encoding:'utf8',timeout:120000,maxBuffer:16000000});
const requireIt=(v,r)=>{if(!v)throw Error('workspace-canary.'+r);};
requireIt(!existsSync(root),'output-exists-no-replay');
const binding=JSON.parse(readFileSync(join(raw,'tasks/binding.json')));
const taskBytes=readFileSync(join(raw,'tasks',binding.task_file));
requireIt(sha(taskBytes)===binding.task_sha256&&binding.task_sha256===caseBinding.task_sha256,'task-pin');
const task=JSON.parse(taskBytes),cell=JSON.parse(readFileSync(join(raw,'evidence/run/started.json'))).cell;
requireIt(stable(cell)===stable(caseBinding.cell),'cell-drift');
for(const [name,expected] of Object.entries(caseBinding.archived_code_sha256))
  requireIt(sha(readFileSync(join(raw,'code',name)))===expected,'archived-ranker-drift');
requireIt(task.instance_id===caseBinding.instance_id&&task.instance_id===binding.instance_id&&task.base_commit===binding.base_commit&&
  git('rev-parse','HEAD').trim()===task.base_commit&&!git('diff','--name-only','HEAD').trim(),'base-identity');
const archive='/home/vlad_/are-benchmark-archive/g02-typed-navigation-construction-r2-20261006';
const constructionBytes=readFileSync(join(archive,'CONSTRUCTION-SEAL.json'));
requireIt(sha(constructionBytes)===campaign.parser_construction_sha256,'construction-pin');
const construction=JSON.parse(constructionBytes);
for(const name of ['typed-navigation-r2.mjs','typed-source-structure-r2.py'])
  requireIt(sha(readFileSync(join(here,name)))===construction.source_sha256[name],'construction-source-drift');
const probe='/home/vlad_/are-benchmark-archive/g02-wsl-vps-provider-probe-r1-20261006';
requireIt(sha(readFileSync(join(probe,'RESULT.json')))==='a551d691d7fd3517132bd5ac06de542beb65df4f5071a60bf8dfc6a10da7b797','provider-probe-pin');
const probeFreeze=JSON.parse(readFileSync(join(probe,'FREEZE.json')));
for(const name of ['vps-json-provider-r1.mjs','wsl-vps-provider-r1.mjs'])
  requireIt(sha(readFileSync(join(here,name)))===probeFreeze.source_sha256[name],'provider-source-drift');
const multiplexProbe='/home/vlad_/are-benchmark-archive/g02-multiplexed-vps-provider-probe-r2-20261006';
requireIt(sha(readFileSync(join(multiplexProbe,'RESULT.json')))==='e94c0d9333e9d06fe06c3b33f764d752417d1bcbb34a9f4d79ff84dac756957b','multiplex-probe-pin');
const multiplexFreeze=JSON.parse(readFileSync(join(multiplexProbe,'FREEZE.json')));
requireIt(sha(readFileSync(join(here,'wsl-vps-provider-multiplexed-r2.mjs')))===multiplexFreeze.source_sha256['wsl-vps-provider-multiplexed-r2.mjs'],'multiplex-source-drift');
const capacity=()=>{const fs=statfsSync(root);requireIt(fs.bavail*fs.bsize>=8*1024**3,'wsl-evidence-reserve');};
const canonical=join(project,'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/episode-recovery-v2.mjs');
const batch=join(dirname(canonical),'../full-cycle-79/snapshot/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/tool-batch-policy.mjs');
requireIt(sha(readFileSync(batch))==='a7e21ab77b111bfde17da1bc4b4084e9137039782eee4509acfa900d1151c1df','batch-policy-pin');
const episodeSource=readFileSync(join(raw,'code/episode-recovery-v2.mjs'),'utf8');
requireIt(sha(episodeSource)===campaign.episode_sha256,'episode-pin');
for(const [name,expected] of Object.entries(campaign.source_sha256))
  requireIt(sha(readFileSync(join(here,name)))===expected,'campaign-source-drift');
let overlay=episodeSource;
const directImports={};
overlay=overlay.replace(/from '([^']+)'/g,(m,s)=>{
  if(!s.startsWith('.')||s==='./candidate-workspace-r1.mjs')return m;
  const target=s==='../tool-batch-policy.mjs'?batch:resolve(dirname(canonical),s);
  directImports[target]=sha(readFileSync(target));return `from '${pathToFileURL(target).href}'`;
});
mkdirSync(root,{mode:0o700});mkdirSync(join(root,'requests'));mkdirSync(join(root,'snapshots'));
capacity();
for(const [name,data] of [['episode.mjs',overlay],
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
let inlineHintReads=0,inlineClassHintReads=0,inlineFunctionHintReads=0;
const typedIndices=new Map();
const execute_tool=async(name,args)=>{
  requireIt([...names,'rank_sources'].includes(name),'repository-write-or-unknown-tool');
  capacity();
  if(name==='rank_sources'){
    requireIt(args&&Object.keys(args).join(',')==='query'&&typeof args.query==='string','rank-arguments');
    return {ok:true,output:ranker.query(args.query)};
  }
  const original=await repository(name,args);
  if(name!=='read_file'||original.ok!==true||original.output?.source_revision!=='base')return original;
  const o=original.output,snapshot=[...snapshots.values()].find(s=>s.path===o.path&&s.source_sha256===o.source_sha256);
  requireIt(snapshot&&sha(snapshot.utf8)===o.source_sha256,'inline-snapshot-identity');
  const key=o.path+'\\0'+o.source_sha256;
  if(!typedIndices.has(key)){
   const ext=o.path.split('.').at(-1),language=ext==='py'?'python':['cpp','cc','cxx','hpp','hh','hxx'].includes(ext)?'cpp':null;
   typedIndices.set(key,language?parseTypedSource(snapshot.utf8,language):null);
  }
  const enriched=appendPartialDefinitionMetadata({result:original,index:typedIndices.get(key)});
  // A hard binding check before returning any enriched result to the episode.
  requireIt(stable(observationMaterial('identity-probe',original.output))===stable(observationMaterial('identity-probe',enriched.output)),'inline-observation-identity');
  const candidates=enriched.output?.typed_navigation?.candidates;
  if(candidates){inlineHintReads++;if(candidates.some(c=>c.kind==='class'))inlineClassHintReads++;if(candidates.some(c=>c.kind==='function'))inlineFunctionHintReads++;}
  return enriched;
};
const dependencyRoots=[...Object.keys(directImports),fileURLToPath(import.meta.url),
  join(here,'inline-typed-discovery-candidate-r2.mjs'),join(here,'typed-navigation-r2.mjs'),join(here,'typed-source-structure-r2.py'),join(here,'wsl-vps-provider-r1.mjs'),join(project,'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs'),
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
const protocol=readFileSync(join(here,'../../evidence/G02-INLINE-TYPED-DISCOVERY-CANDIDATE-R2.json'));
requireIt(sha(protocol)===campaign.protocol_sha256,'protocol-pin');
writeFileSync(join(root,'PROTOCOL.json'),protocol,{flag:'wx',mode:0o600});
save('FREEZE.json',{schema_version:'are.g02-native-workspace-task1-freeze/v1',status:'frozen-before-provider',
  campaign_sha256:sha(campaignBytes),pair,experiment_arm:experimentArm,
  task_sha256:sha(taskBytes),instance_id:task.instance_id,base_commit:task.base_commit,
  parser_construction_sha256:sha(constructionBytes),construction_sha256:campaign.construction_sha256,relay_sha256:RELAY_SHA,provider_probe_sha256:sha(readFileSync(join(probe,'RESULT.json'))),
  limits:cell.limits,context_limit:cell.context_limit,recycle_at:cell.recycle_at,safety_margin:cell.safety_margin,
  maximum_model_requests:20,maximum_request_tokenizers:291,maximum_index_tokenizers:512,automatic_retries:0,
  request_margin:512,model:'glm-5.3-flash',reasoning_effort:'low',model_timeout_ms:300000,
  seed_policy:'Archived ranker and native initial-source policy; no evaluator inputs.',
  overlay_sha256:sha(overlay),module_sha256:sha(readFileSync(join(here,'inline-typed-discovery-candidate-r2.mjs'))),
  ranker_sha256:sha(readFileSync(join(root,'ranked-source-acquisition.mjs'))),base_ranker_sha256:sha(readFileSync(join(root,'ranked-source-acquisition-base.mjs'))),
  selected_single_line_static_import_sha256:dependencies,protocol_sha256:sha(protocol),
  execution_binding:'Existing clean immutable WSL base; selection-only tool allowlist. No worktree clone, edit, repository code execution or reference labels.',
  parity_limit:'Pinned archived episode/ranker; selected one-line local static imports recorded, not all VPS deployment dependencies, dynamic imports or CommonJS transitive closure verified.',
  functionality_gate:'Terminal native export, zero unmapped delivery, complete known provider usage, unchanged base. Report inline presentation separately, not as native quality.',
  claim_ceiling:'Exposed matched pilot; historical DSH is diagnostic only; no superiority.'});
for(const [file,expected] of Object.entries(dependencies))requireIt(sha(readFileSync(file))===expected,'helper-drift-before-dispatch');
save('STARTED.json',{started_at:new Date().toISOString(),freeze_sha256:sha(readFileSync(join(root,'FREEZE.json')))});
const receipts=[],measurements=new Map();let modelCount=0,requestTokenizers=0,indexTokenizers=0,sequence=0;
let sharedProvider=null,ownedTemp=null,ownedSocket=null,transportError=null;
const ssh=args=>execFileSync('ssh',['-o','BatchMode=yes','-o','ConnectTimeout=10',...args],{stdio:['ignore','ignore','ignore'],timeout:30000});
async function callVpsProvider(input){
 if(!sharedProvider){
  ownedTemp=mkdtempSync('/tmp/are-g02-ssh-reuse-r2-');ownedSocket=join(ownedTemp,'control.sock');
  save('TRANSPORT-STARTED.json',{control_socket:ownedSocket,automatic_retries:0});
  ssh(['-M','-N','-f','-o','ControlPersist=60','-S',ownedSocket,'root@187.77.163.194']);
  validatePrivateControlSocket(ownedSocket);sharedProvider=createMultiplexedVpsProvider({controlSocket:ownedSocket});
 }
 return sharedProvider(input);
}
const validUsage=x=>Number.isSafeInteger(x)&&x>=0;
async function invoke(operation,prompt,index=false){
  capacity();const request=JSON.parse(prompt);requireIt(Array.isArray(request.messages)&&Array.isArray(request.tools)&&
    Object.keys(request).every(k=>['messages','tools'].includes(k)),'prompt-shape');
  if(operation==='generate')requireIt(++modelCount<=20,'model-call-cap');
  else if(index)requireIt(++indexTokenizers<=512,'index-tokenizer-cap');
  else requireIt(++requestTokenizers<=291,'request-tokenizer-cap');
  const ordinal=++sequence,id=pair+'-'+experimentArm+'-'+ordinal,input={operation,request_id:id,...request,output_cap:8192};
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
    limits:cell.limits,run_id:pair+'-'+experimentArm,source_context:()=>({snapshots:[...snapshots.values()],repoRoot:base,patch:''}),
    system_appendix:ranker.summary+'\nOrdinary source reads may include optional typed_navigation orientation hints for intersecting definitions. Use a hint only if it helps resolve the issue, with ordinary read_file to acquire the relevant source. Class suggestions are short header windows, not full-class evidence. Hints and definition IDs are not terminal handles. Select only relevant actually delivered reads, not every suggested definition. Partial indices are explicitly incomplete; ordinary read/search remain available.',initial_source_hints:ranker.primer.hints,initial_focused_source_hints:ranker.focused_source_hints,
    on_event:async event=>appendFileSync(join(root,'events.jsonl'),stable(event)+'\n',{mode:0o600})});
  if(result.status==='final_context_selected'){
    const {exportTerminalEvidenceSelection}=await import(pathToFileURL(join(dirname(canonical),'../terminal-evidence.mjs')));
    nativeExport=exportTerminalEvidenceSelection({...result,packet:result.terminal_evidence_packet,
      response_capture:result.response_captures.at(-1),source_snapshots:[...snapshots.values()],task},base);
    requireIt(stable(nativeExport.selection)===stable(result.selection),'native-selection-export-mismatch');
    save('prediction.json',nativeExport.prediction);save('EXPORT.json',nativeExport);
  }
}catch(e){error=String(e.message).slice(0,160);}finally{
 recycler.close();
 if(ownedSocket&&existsSync(ownedSocket))try{validatePrivateControlSocket(ownedSocket);ssh(['-S',ownedSocket,'-O','exit','root@187.77.163.194']);}catch{transportError='exact-owned-master-close-failed';}
 let cleanup='owned-directory-retained';if(ownedTemp&&!transportError)try{rmdirSync(ownedTemp);cleanup='empty-owned-transport-directory-removed';}catch{}
 save('TRANSPORT-TERMINAL.json',{error:transportError,cleanup,temporary_directory:ownedTemp});
}
const models=receipts.filter(r=>r.kind==='model'),unknown=models.filter(r=>!validUsage(r.input_tokens)||!validUsage(r.output_tokens)||r.dispatch_uncertain).length;
const bound=result?bindDelivery({captures:result.captures,receipts}):null;
const unchanged=git('rev-parse','HEAD').trim()===task.base_commit&&!git('diff','--name-only','HEAD').trim();
const passed=!error&&!transportError&&!!nativeExport&&bound.unmapped.length===0&&unknown===0&&unchanged;
save('RESULT.json',{status:passed?'matched-arm-passed':'matched-arm-failed',error,result,native_export:!!nativeExport,
  known_model_tokens:models.filter(r=>validUsage(r.input_tokens)&&validUsage(r.output_tokens)).reduce((n,r)=>n+r.input_tokens+r.output_tokens,0),
  unknown_model_usage:unknown,model_calls:modelCount,request_tokenizers:requestTokenizers,index_tokenizers:indexTokenizers,
  inline_hint_reads:inlineHintReads,inline_class_hint_reads:inlineClassHintReads,inline_function_hint_reads:inlineFunctionHintReads,transport_error:transportError,elapsed_ms:Date.now()-started,unchanged_base:unchanged,benchmark_cleared:false});
save('PRE-SCORE-SEAL.json',{status:'terminal-before-evaluator',score_unopened:true,freeze_sha256:sha(readFileSync(join(root,'FREEZE.json'))),
  result_sha256:sha(readFileSync(join(root,'RESULT.json'))),prediction_sha256:nativeExport?sha(readFileSync(join(root,'prediction.json'))):null,
  claim_ceiling:'Sealed matched exposed arm; no quality decision before campaign completion.'});
console.log(JSON.stringify({root,status:passed?'matched-arm-passed':'matched-arm-failed',episode_status:result?.status,
  error:error??result?.error,model_calls:modelCount,inline_hint_reads:inlineHintReads,inline_class_hint_reads:inlineClassHintReads,inline_function_hint_reads:inlineFunctionHintReads,
  result_sha256:sha(readFileSync(join(root,'RESULT.json')))}));
