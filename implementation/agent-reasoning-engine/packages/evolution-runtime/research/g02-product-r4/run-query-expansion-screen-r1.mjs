// One frozen private acquisition screen; no replay or native-quality admission.
// Open Questions: evidence/G02-QUERY-EXPANSION-SCREEN-R1.json.
import{existsSync,mkdirSync,mkdtempSync,readFileSync,writeFileSync,lstatSync,realpathSync,statfsSync,rmdirSync}from'node:fs';
import{join,dirname,sep}from'node:path';import{fileURLToPath,pathToFileURL}from'node:url';
import{execFileSync}from'node:child_process';
import{hash}from'./vps-json-provider-r1.mjs';
import{providerBody,validateReply}from'./wsl-vps-provider-r1.mjs';
import{createMultiplexedVpsProvider,validatePrivateControlSocket}from'./wsl-vps-provider-multiplexed-r2.mjs';
import{createQueryExpansionRequest,parseQueryExpansionReply,projectExpandedLeads}from'./query-expansion-source-r1.mjs';
import{observedFiles,pairLeadWidths,goldFiles,scoreFileAcquisition,verifyLeadSeal}from'./query-expansion-screen-metrics-r1.mjs';
const ROOT='/home/vlad_/are-benchmark-archive/g02-query-expansion-screen-r1-20261006';
const PRIOR='/home/vlad_/are-benchmark-archive/g02-native-workspace-matched-exposed-r1-20261006';
const RAW='/home/vlad_/are-benchmark-archive/g02-product-replication-r11-20261002/pairs';
const PROBE='/home/vlad_/are-benchmark-archive/g02-multiplexed-vps-provider-probe-r2-20261006';
const HERE=dirname(fileURLToPath(import.meta.url));
const need=(v,r)=>{if(!v)throw Error('query-screen.'+r);},read=p=>JSON.parse(readFileSync(p));
const save=(p,d)=>writeFileSync(p,JSON.stringify(d,null,2)+'\n',{flag:'wx',mode:0o600});
const gate={all_12_valid_outputs:true,novel_reference_file_hits_at_least:4,
 hit_gain_vs_control_at_least:2,mean_reference_file_coverage_gain_vs_control_at_least:.03,
 unique_hit_files_per_36_allocated_slots_at_least:.20,known_generation_tokens_at_most:100000};
const git=(base,...args)=>execFileSync('git',['-c',`safe.directory=${base}`,'-c','core.hooksPath=/dev/null',
 '-c','core.fsmonitor=false','-C',base,...args],{timeout:120000,maxBuffer:16*1024**2});
function reserve(){const s=statfsSync(ROOT);need(s.bavail*s.bsize>=8*1024**3,'wsl-evidence-reserve');}
need(!existsSync(ROOT),'output-exists-no-replay');
const priorBytes=readFileSync(join(PRIOR,'FREEZE.json')),prior=JSON.parse(priorBytes);
need(prior.cases.length===12&&read(join(PRIOR,'PIPELINE-TERMINAL.json')).status==='terminal-quality-result','prior-not-terminal');
need(read(join(PRIOR,'PRE-SCORE-CAMPAIGN-SEAL.json')).freeze_sha256===hash(priorBytes),'prior-freeze-seal');
need(hash(readFileSync(join(PROBE,'RESULT.json')))==='e94c0d9333e9d06fe06c3b33f764d752417d1bcbb34a9f4d79ff84dac756957b','r2-probe-pin');
const probe=read(join(PROBE,'FREEZE.json'));
for(const n of ['wsl-vps-provider-multiplexed-r2.mjs','wsl-vps-provider-r1.mjs','vps-json-provider-r1.mjs'])
 need(hash(readFileSync(join(HERE,n)))===probe.source_sha256[n],'provider-source-pin');
const names=['run-query-expansion-screen-r1.mjs','query-expansion-source-r1.mjs','query-expansion-screen-metrics-r1.mjs',
 'wsl-vps-provider-multiplexed-r2.mjs','wsl-vps-provider-r1.mjs','vps-json-provider-r1.mjs'];
const sourceHashes=Object.fromEntries(names.map(n=>[n,hash(readFileSync(join(HERE,n)))]));
const cases=[];
for(const c of prior.cases){
 need(/^(0[1-9]|1[0-2])-pr11-mixed-\d{2}$/.test(c.pair),'case-path');
 const raw=join(RAW,c.pair,'raw'),binding=read(join(raw,'tasks/binding.json')),
  taskPath=join(raw,'tasks',binding.task_file),taskBytes=readFileSync(taskPath),task=JSON.parse(taskBytes),base=join(raw,'sources/session/base');
 need(hash(taskBytes)===c.task_sha256&&task.instance_id===c.instance_id&&task.base_commit===binding.base_commit,'task-binding');
 need(git(base,'rev-parse','HEAD').toString().trim()===task.base_commit&&!git(base,'diff','--name-only','HEAD').length,'base-identity');
 // The archived indexer follows file symlinks. Reject an existing tracked
 // file link escaping the exact corpus before it can index unrelated data.
 for(const entry of git(base,'ls-files','-s','-z').toString().split('\0')){
  if(!entry.startsWith('120000 '))continue;const path=entry.slice(entry.indexOf('\t')+1),target=join(base,path);
  let resolved;try{resolved=realpathSync(target);}catch{continue;} // Dangling links are omitted by the original indexer.
  if(lstatSync(resolved).isFile())need(resolved.startsWith(realpathSync(base)+sep),'index-symlink-escape');
 }
 const rankerPath=join(raw,'code/base-overlay.mjs'),rankerHash=hash(readFileSync(rankerPath));
 need(rankerHash===c.archived_code_sha256['base-overlay.mjs'],'archived-ranker');
 const predPath=join(PRIOR,c.pair+'-control','prediction.json'),predBytes=readFileSync(predPath),pre=read(join(PRIOR,c.pair+'-control','PRE-SCORE-SEAL.json'));
 need(hash(predBytes)===pre.prediction_sha256,'prior-observations');
 const request=createQueryExpansionRequest({request_id:'g02-query-screen-r1-'+c.pair,problem_statement:task.problem_statement});
 cases.push({pair:c.pair,instance_id:c.instance_id,base,base_commit:task.base_commit,task_path:taskPath,
  task_sha256:hash(taskBytes),ranker_path:rankerPath,ranker_sha256:rankerHash,
  prior_prediction_path:predPath,prior_prediction_sha256:hash(predBytes),
  prior_bundle_sha256:read(join(PRIOR,c.pair+'-control','SCORE-TERMINAL.json')).bundle_sha256,
  observed_files:observedFiles(JSON.parse(predBytes)),
  generation_input:request});
}
mkdirSync(ROOT,{mode:0o700});reserve();
save(join(ROOT,'FREEZE.json'),{schema_version:'are.g02-query-expansion-screen-freeze/v1',frozen_at:new Date().toISOString(),
 source_sha256:sourceHashes,prior_freeze_sha256:hash(priorBytes),r2_probe_result_sha256:hash(readFileSync(join(PROBE,'RESULT.json'))),
 cases,gate,maximum_generation_calls:12,maximum_tokenizer_calls:12,output_cap:512,automatic_retries:0,
 control_rule:'Archived base-ranker primer on original issue, first3 hints outside all prior-control observed file paths.',
 treatment_rule:'One first-admissible new file interval per generated query, maximum3; no observed paths or exact interval duplicates.',
 width_rule:'<=17 lines per slot; exact min-width on paired nonempty slots. Missing treatment slots remain failures; corresponding controls retained.',
 proxy:'Distinct newly reached reference-file paths, not spans, symbols, relevance proof or native F1.',
 missing_slot_denominator:36,novelty_posture:'Prior observed paths are screening-only metadata, never generator input. Future native inference must use its own current observation ledger.',
 label_barrier:'All12 LEADS.json identities sealed and verified before any exposed Gold read.',
 gold_source_sha256:'3eee61cfe239590d069f03fdbf38a70a74efc6d170b37ca17e39ba7f9742e1a7',
 native_gold_synthetic_parity:{cases:7,passed:true,real_label_reads:0},
 authority_effect:'none',claim_ceiling:'Exposed FILE acquisition screen only; native matched quality and blinded superiority remain unproven.',
 open_questions_owner:'G02-QUERY-EXPANSION-SCREEN-R1.json'});
const freezeHash=hash(readFileSync(join(ROOT,'FREEZE.json')));
for(const c of cases)mkdirSync(join(ROOT,c.pair),{mode:0o700});
const checkSources=()=>{need(hash(readFileSync(join(ROOT,'FREEZE.json')))===freezeHash,'freeze-drift');
 for(const[n,h]of Object.entries(sourceHashes))need(hash(readFileSync(join(HERE,n)))===h,'source-drift');reserve();};
let knownTokens=0,generations=0,tokenizers=0,unknownUsage=0,error=null,transportError=null;
try{
 const temp=mkdtempSync('/tmp/are-g02-ssh-reuse-r2-'),socket=join(temp,'control.sock'),host='root@187.77.163.194';
 const ssh=args=>execFileSync('ssh',['-o','BatchMode=yes','-o','ConnectTimeout=10',...args],{stdio:['ignore','ignore','ignore'],timeout:30000});
 let opened=false,cleanup=null;
 save(join(ROOT,'TRANSPORT-STARTED.json'),{control_socket:socket,automatic_retries:0,provider_binding:'Same fixed r1 VPS relay; private r2 SSH connection reuse.'});
 try{
  ssh(['-M','-N','-f','-o','ControlPersist=60','-S',socket,host]);opened=true;validatePrivateControlSocket(socket);
  const call=createMultiplexedVpsProvider({controlSocket:socket});
  for(const c of cases){
   checkSources();need(hash(readFileSync(c.task_path))===c.task_sha256,'task-drift');
   const dir=join(ROOT,c.pair),input=c.generation_input,
    measurement={...input,operation:'tokenize',request_id:input.request_id+'-tokens'};
   save(join(dir,'TOKENIZER-STARTED.json'),{request_sha256:hash(providerBody(measurement)),started_at:new Date().toISOString()});
   tokenizers++;const tokens=await call(measurement);save(join(dir,'TOKENIZER-REPLY.json'),tokens);
   validateReply(tokens,measurement);need(tokens.status===200&&tokens.failure_code===null&&Number.isSafeInteger(tokens.prompt_tokens)&&tokens.prompt_tokens>=0,'tokenizer-failure');
   need(knownTokens+tokens.prompt_tokens+512<=100000,'prospective-generation-token-cap');
   save(join(dir,'GENERATION-STARTED.json'),{request_sha256:hash(providerBody(input)),started_at:new Date().toISOString()});
   generations++;const reply=await call(input);save(join(dir,'GENERATION-REPLY.json'),reply);
   if(![reply.prompt_tokens,reply.completion_tokens].every(n=>Number.isSafeInteger(n)&&n>=0))unknownUsage++;
   validateReply(reply,input);need(reply.status===200&&reply.failure_code===null&&unknownUsage===0,'generation-failure-or-unknown-usage');
   knownTokens+=reply.prompt_tokens+reply.completion_tokens;need(knownTokens<=100000,'known-generation-token-cap');
   let parsed=null,parse_error=null;try{parsed=parseQueryExpansionReply(reply,input);}catch(e){parse_error=String(e.message).startsWith('query-expansion.')?e.message:'query-expansion.reply-invalid';}
   save(join(dir,'QUERY-RESULT.json'),{parsed,parse_error,reply_sha256:hash(readFileSync(join(dir,'GENERATION-REPLY.json'))),authority_effect:'none'});
   console.log(JSON.stringify({pair:c.pair,status:parsed?'queries-sealed':'invalid-queries-preserved',generations,known_model_tokens:knownTokens}));
  }
 }finally{
  if(opened||existsSync(socket))try{validatePrivateControlSocket(socket);ssh(['-S',socket,'-O','exit',host]);}catch{transportError='exact-owned-master-close-failed';}
  if(!transportError)try{rmdirSync(temp);cleanup='empty-owned-transport-directory-removed';}catch{cleanup='owned-directory-retained';}
  save(join(ROOT,'TRANSPORT-TERMINAL.json'),{error:transportError,cleanup,temporary_directory:temp,authority_effect:'none'});
 }
 need(!transportError&&generations===12&&tokenizers===12,'generation-phase-incomplete');
 const seals=[];
 for(const c of cases){
  checkSources();need(git(c.base,'rev-parse','HEAD').toString().trim()===c.base_commit&&!git(c.base,'diff','--name-only','HEAD').length,'projection-base-drift');
  need(hash(readFileSync(c.ranker_path))===c.ranker_sha256&&hash(readFileSync(c.prior_prediction_path))===c.prior_prediction_sha256,'projection-input-drift');
  const dir=join(ROOT,c.pair),code=join(dir,'ranker.mjs');writeFileSync(code,readFileSync(c.ranker_path),{flag:'wx',mode:0o600});
  const{createRankedSourceAcquisition}=await import(pathToFileURL(code));
  const task=read(c.task_path),ranker=createRankedSourceAcquisition({root:c.base,base_commit:c.base_commit,problem_statement:task.problem_statement,maximum_index_bytes:64*1024**2});
  const old=new Set(c.observed_files),cache=new Map();mkdirSync(join(dir,'sources'),{mode:0o700});
  const resolveSource=path=>{
   if(cache.has(path))return cache.get(path);
   const target=join(c.base,path);if(!lstatSync(target).isFile()||!realpathSync(target).startsWith(realpathSync(c.base)+sep))return null;
   git(c.base,'ls-files','--error-unmatch','--',path);const bytes=readFileSync(target),blob=git(c.base,'show',c.base_commit+':'+path);
   need(bytes.length<=8*1024**2&&hash(bytes)===hash(blob),'source-blob-drift');
   const s={path,utf8:new TextDecoder('utf-8',{fatal:true}).decode(bytes),source_sha256:hash(bytes)};
   save(join(dir,'sources',hash([path,s.source_sha256])+'.json'),s);cache.set(path,s);return s;
  };
  const novel=r=>({...r,hints:r.hints.filter(h=>!old.has(h.path))}),q=read(join(dir,'QUERY-RESULT.json'));
  const treatment=q.parsed?projectExpandedLeads({queries:q.parsed.queries,queryRanker:text=>novel(ranker.query(text)),resolveSource}):{leads:[],rejections:[{reason:q.parse_error}],ranker_queries:[]};
  const original=novel(ranker.primer);let slot=0;
  const control=projectExpandedLeads({queries:['original-issue-slot-0','original-issue-slot-1','original-issue-slot-2'],
   queryRanker:()=>({...original,hints:original.hints[slot]?[original.hints[slot++]]:[]}),resolveSource});
  const paired=pairLeadWidths(treatment.leads,control.leads);
  save(join(dir,'LEADS.json'),{pair:c.pair,instance_id:c.instance_id,...paired,queries_valid:!!q.parsed,
   observed:c.observed_files,treatment_projection:treatment,control_projection:control,
   query_result_sha256:hash(readFileSync(join(dir,'QUERY-RESULT.json'))),authority_effect:'none'});
  seals.push({pair:c.pair,leads_sha256:hash(readFileSync(join(dir,'LEADS.json')))});
  console.log(JSON.stringify({pair:c.pair,status:'source-leads-sealed',treatment_leads:treatment.leads.length,control_leads:control.leads.length}));
 }
 checkSources();save(join(ROOT,'PRE-SCORE-SEAL.json'),{freeze_sha256:freezeHash,rows:seals,generations,tokenizers,known_model_tokens:knownTokens,unknown_generation_usage:unknownUsage,score_unopened:true});
 // Entire cohort verifies before the FIRST exposed label read.
 const verified=verifyLeadSeal({cases,seal:read(join(ROOT,'PRE-SCORE-SEAL.json')),readLeadBytes:p=>readFileSync(join(ROOT,p,'LEADS.json'))});
 const scored=[];
 for(const data of verified){
  const oldBundle=join(PRIOR,'score-bundles',data.pair+'-control'),bundleBytes=readFileSync(join(oldBundle,'BUNDLE.json'));
  need(hash(bundleBytes)===cases.find(c=>c.pair===data.pair).prior_bundle_sha256,'prior-bundle-seal');
  const bundle=JSON.parse(bundleBytes);
  const goldBytes=readFileSync(join(oldBundle,'GOLD-EXPOSED-TASK1.json'));need(hash(goldBytes)===bundle.gold_sha256,'exposed-gold-digest');
  const gold=JSON.parse(goldBytes);need(gold.inst_id===data.instance_id,'gold-identity');
  scored.push({pair:data.pair,instance_id:data.instance_id,queries_valid:data.queries_valid,gold_sha256:hash(goldBytes),
   ...scoreFileAcquisition({referenceFiles:goldFiles(gold),observed:data.observed,treatment:data.treatment,control:data.control})});
 }
 const hits=a=>scored.reduce((n,r)=>n+r[a].hit_count,0),gain=scored.reduce((n,r)=>n+r.treatment.reference_file_coverage_gain-r.control.reference_file_coverage_gain,0)/12;
 const checks={all_12_valid_outputs:scored.every(r=>r.queries_valid),novel_hits:hits('treatment')>=gate.novel_reference_file_hits_at_least,
  hit_gain:hits('treatment')-hits('control')>=gate.hit_gain_vs_control_at_least,mean_file_coverage_gain:gain>=gate.mean_reference_file_coverage_gain_vs_control_at_least,
  precision:hits('treatment')/36>=gate.unique_hit_files_per_36_allocated_slots_at_least,cost:unknownUsage===0&&knownTokens<=gate.known_generation_tokens_at_most};
 save(join(ROOT,'SCREEN-RESULT.json'),{status:Object.values(checks).every(Boolean)?'acquisition-screen-qualified-for-native-test':'acquisition-screen-rejected',
  freeze_sha256:freezeHash,pre_score_seal_sha256:hash(readFileSync(join(ROOT,'PRE-SCORE-SEAL.json'))),checks,
  treatment_novel_reference_file_hits:hits('treatment'),control_novel_reference_file_hits:hits('control'),
  mean_reference_file_coverage_gain_vs_control:gain,unique_hit_files_per_allocated_slot:hits('treatment')/36,
  known_model_tokens:knownTokens,rows:scored,claim_ceiling:'Exposed file-acquisition proxy only; not native Span-F1, superiority or product admission.',authority_effect:'none',open_questions_owner:'G02-QUERY-EXPANSION-SCREEN-R1.json'});
}catch(e){error=String(e.message).startsWith('query-screen.')?e.message:'query-screen.setup-or-runtime-failure';}
save(join(ROOT,'RESULT.json'),{status:error?'failed-no-replay':'terminal-acquisition-screen',error,generations,tokenizers,
 known_model_tokens:knownTokens,unknown_generation_usage:unknownUsage,transport_error:transportError,
 screen_result_sha256:existsSync(join(ROOT,'SCREEN-RESULT.json'))?hash(readFileSync(join(ROOT,'SCREEN-RESULT.json'))):null,
 authority_effect:'none',open_questions_owner:'G02-QUERY-EXPANSION-SCREEN-R1.json'});
console.log(JSON.stringify({root:ROOT,status:error?'failed-no-replay':'terminal-acquisition-screen',error,generations,known_model_tokens:knownTokens}));
if(error)process.exitCode=1;
