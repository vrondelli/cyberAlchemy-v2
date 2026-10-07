// One private exposed FILE screen. Open Questions: G02-INVENTORY-NAVIGATION-R2.json.
import{existsSync,mkdirSync,mkdtempSync,readFileSync,writeFileSync,rmdirSync,realpathSync,lstatSync,statfsSync}from'node:fs';
import{join,dirname,sep}from'node:path';import{fileURLToPath}from'node:url';import{execFileSync}from'node:child_process';
import{hash}from'./vps-json-provider-r1.mjs';import{providerBody,validateReply}from'./wsl-vps-provider-r1.mjs';
import{createMultiplexedVpsProvider,validatePrivateControlSocket}from'./wsl-vps-provider-multiplexed-r2.mjs';
import{buildInventory,buildFilePacket,buildNavigationRequest,parseDirectoryChoice,parseFileChoice}from'./inventory-navigation-r2.mjs';
import{observedFiles,goldFiles,scoreFileAcquisition,verifyLeadSeal}from'./query-expansion-screen-metrics-r1.mjs';
const ROOT='/home/vlad_/are-benchmark-archive/g02-inventory-navigation-screen-r2-20261006',OLD='/home/vlad_/are-benchmark-archive/g02-query-expansion-screen-r1-20261006';
const PRIOR='/home/vlad_/are-benchmark-archive/g02-native-workspace-matched-exposed-r1-20261006/score-bundles',HERE=dirname(fileURLToPath(import.meta.url));
const need=(v,r)=>{if(!v)throw Error('inventory-screen.'+r);},read=p=>JSON.parse(readFileSync(p));
const save=(p,d)=>writeFileSync(p,JSON.stringify(d,null,2)+'\n',{flag:'wx',mode:0o600});
const git=(base,...args)=>execFileSync('git',['-c',`safe.directory=${base}`,'-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false','-C',base,...args],{timeout:120000,maxBuffer:16*1024**2});
need(!existsSync(ROOT),'no-replay');
const construction='/home/vlad_/are-benchmark-archive/g02-inventory-navigation-prototype-r2-20261006/CONSTRUCTION-SEAL.json';
need(hash(readFileSync(construction))==='fcc7d1d0c017af49c9b95f1f48368366030bd0582358b282121fb6d4c1585da8','construction-pin');
for(const[n,h]of Object.entries(read(construction).source_sha256))need(hash(readFileSync(join(HERE,n)))===h,'construction-source-drift');
const oldFreezeBytes=readFileSync(join(OLD,'FREEZE.json')),oldFreeze=JSON.parse(oldFreezeBytes),indexBytes=readFileSync(join(OLD,'INDEX-ADMISSION-SEAL.json')),index=JSON.parse(indexBytes);
need(index.freeze_sha256===hash(oldFreezeBytes)&&oldFreeze.cases.length===12&&index.rows.length===12,'source-inputs');
const probe=read('/home/vlad_/are-benchmark-archive/g02-multiplexed-vps-provider-probe-r2-20261006/FREEZE.json');
for(const n of ['wsl-vps-provider-multiplexed-r2.mjs','wsl-vps-provider-r1.mjs','vps-json-provider-r1.mjs'])need(hash(readFileSync(join(HERE,n)))===probe.source_sha256[n],'provider-pin');
const names=['run-inventory-navigation-screen-r2.mjs','inventory-navigation-r2.mjs','inventory-navigation-r1.mjs','query-expansion-screen-metrics-r1.mjs','wsl-vps-provider-multiplexed-r2.mjs','wsl-vps-provider-r1.mjs','vps-json-provider-r1.mjs'];
const sources=Object.fromEntries(names.map(n=>[n,hash(readFileSync(join(HERE,n)))])),cases=[];
for(const c of oldFreeze.cases){const row=index.rows.find(r=>r.pair===c.pair);need(row?.instance_id===c.instance_id,'inventory-identity');
 need(hash(readFileSync(c.task_path))===c.task_sha256&&git(c.base,'rev-parse','HEAD').toString().trim()===c.base_commit&&!git(c.base,'diff','--name-only','HEAD').length,'base-task-drift');
 const oldLeadPath=join(OLD,c.pair,'LEADS.json');need(read(join(OLD,'PRE-SCORE-SEAL.json')).rows.find(r=>r.pair===c.pair)?.leads_sha256===hash(readFileSync(oldLeadPath)),'control-seal');
 need(hash(readFileSync(c.prior_prediction_path))===c.prior_prediction_sha256,'observation-ledger-drift');
 need(JSON.stringify(observedFiles(read(c.prior_prediction_path)))===JSON.stringify(c.observed_files),'observation-ledger-identity');
 buildInventory(row.admitted,c.observed_files);cases.push({...c,admitted_paths:row.admitted,old_leads_path:oldLeadPath,old_leads_sha256:hash(readFileSync(oldLeadPath))});}
const gate={all_12_valid_outputs:true,novel_reference_file_hits_at_least:4,hit_gain_vs_control_at_least:2,mean_reference_file_coverage_gain_vs_control_at_least:.03,unique_hit_files_per_36_allocated_slots_at_least:.20,known_generation_tokens_at_most:600000};
mkdirSync(ROOT,{mode:0o700});for(const c of cases)mkdirSync(join(ROOT,c.pair),{mode:0o700});
save(join(ROOT,'FREEZE.json'),{schema_version:'are.g02-inventory-screen-freeze/v1',frozen_at:new Date().toISOString(),source_sha256:sources,construction_sha256:hash(readFileSync(construction)),prior_freeze_sha256:hash(oldFreezeBytes),index_seal_sha256:hash(indexBytes),cases,gate,maximum_generation_calls:24,maximum_tokenizer_calls:24,output_cap:512,automatic_retries:0,model:'glm-5.3-flash fixed low-thinking relay',selection:'Original issue plus exact-ID directory catalog of admitted paths outside a frozen legitimate source observation ledger, then file choices from that available inventory. Historical control ledger is declared proxy starting-state metadata, not Gold. Live native policy must use its own contemporaneous ledger.',comparison:'Archived sealed original-issue control leads outside the same observed paths. Both arms share the legitimate source availability state. r2 applies observation filtering before model inputs; r1 remains unchanged.',proxy:'Distinct new reference-file reach with36 allocated slots, not native spans/F1.',label_barrier:'Every one of12 choices must be sealed and verified before first exposed Gold read.',authority_effect:'none',open_questions_owner:'G02-INVENTORY-NAVIGATION-R2.json'});
const freezeHash=hash(readFileSync(join(ROOT,'FREEZE.json')));
const check=()=>{need(hash(readFileSync(join(ROOT,'FREEZE.json')))===freezeHash,'freeze-drift');for(const[n,h]of Object.entries(sources))need(hash(readFileSync(join(HERE,n)))===h,'source-drift');const s=statfsSync(ROOT);need(s.bavail*s.bsize>=8*1024**3,'evidence-reserve');};
let generations=0,tokenizers=0,known=0,unknown=0,error=null,transportError=null;
try{
 check();const temp=mkdtempSync('/tmp/are-g02-ssh-reuse-r2-'),socket=join(temp,'control.sock'),host='root@187.77.163.194';
 const ssh=args=>execFileSync('ssh',['-o','BatchMode=yes','-o','ConnectTimeout=10',...args],{stdio:['ignore','ignore','ignore'],timeout:30000});let opened=false;
 save(join(ROOT,'TRANSPORT-STARTED.json'),{control_socket:socket,automatic_retries:0});
 try{
  ssh(['-M','-N','-f','-o','ControlPersist=60','-S',socket,host]);opened=true;validatePrivateControlSocket(socket);const call=createMultiplexedVpsProvider({controlSocket:socket});
  const generate=async(c,stage,packet)=>{
   check();const dir=join(ROOT,c.pair),input=buildNavigationRequest({request_id:'g02-inventory-r2-'+c.pair+'-'+stage,problem_statement:read(c.task_path).problem_statement,stage,packet});
   save(join(dir,stage+'-INPUT.json'),input);const measurement={...input,operation:'tokenize',request_id:input.request_id+'-tokens'};
   save(join(dir,stage+'-TOKENIZER-STARTED.json'),{request_sha256:hash(providerBody(measurement))});tokenizers++;need(tokenizers<=24,'tokenizer-cap');
   const tokens=await call(measurement);save(join(dir,stage+'-TOKENIZER-REPLY.json'),tokens);validateReply(tokens,measurement);
   need(tokens.status===200&&tokens.failure_code===null&&Number.isSafeInteger(tokens.prompt_tokens)&&tokens.prompt_tokens>=0,'tokenizer-failure');need(known+tokens.prompt_tokens+512<=600000,'prospective-cost-cap');
   save(join(dir,stage+'-GENERATION-STARTED.json'),{request_sha256:hash(providerBody(input))});generations++;need(generations<=24,'generation-cap');
   const reply=await call(input);save(join(dir,stage+'-GENERATION-REPLY.json'),reply);
   if(![reply.prompt_tokens,reply.completion_tokens].every(n=>Number.isSafeInteger(n)&&n>=0))unknown++;
   validateReply(reply,input);need(reply.status===200&&reply.failure_code===null&&unknown===0,'provider-failure-or-unknown');known+=reply.prompt_tokens+reply.completion_tokens;need(known<=600000,'cost-cap');
   return reply.public_response?.message?.content;
  };
  for(const c of cases){
   check();need(hash(readFileSync(c.task_path))===c.task_sha256&&hash(readFileSync(c.prior_prediction_path))===c.prior_prediction_sha256,'task-or-ledger-drift');need(git(c.base,'rev-parse','HEAD').toString().trim()===c.base_commit&&!git(c.base,'diff','--name-only','HEAD').length,'base-drift');const inventory=buildInventory(c.admitted_paths,c.observed_files);let prefixes=null,paths=[],invalid=null;
   const dirs=await generate(c,'directories',inventory.catalog);
   try{prefixes=parseDirectoryChoice(dirs,inventory);}catch{invalid='directory-choice-invalid';}
   if(prefixes){const packet=buildFilePacket(inventory,prefixes),files=await generate(c,'files',packet);try{paths=parseFileChoice(files,packet);}catch{invalid='file-choice-invalid';}}
   // Host validates exact tracked blobs; file selection still is not a read/span claim.
   need(paths.every(p=>!c.observed_files.includes(p)),'choice-already-observed');const identities=[];for(const path of paths){const target=join(c.base,path);need(lstatSync(target).isFile()&&realpathSync(target).startsWith(realpathSync(c.base)+sep),'selected-source-not-regular');git(c.base,'ls-files','--error-unmatch','--',path);const bytes=readFileSync(target);need(hash(bytes)===hash(git(c.base,'show',c.base_commit+':'+path)),'selected-source-drift');identities.push({path,source_sha256:hash(bytes)});}
   save(join(ROOT,c.pair,'CHOICES.json'),{pair:c.pair,instance_id:c.instance_id,prefixes,paths,source_identities:identities,invalid,authority_effect:'none'});
   console.log(JSON.stringify({pair:c.pair,status:invalid??'file-choices-sealed',selected_files:paths.length,generations,known_model_tokens:known}));
  }
 }finally{
  if(opened||existsSync(socket))try{validatePrivateControlSocket(socket);ssh(['-S',socket,'-O','exit',host]);}catch{transportError='exact-owned-master-close-failed';}
  let cleanup='owned-directory-retained';if(!transportError)try{rmdirSync(temp);cleanup='empty-owned-transport-directory-removed';}catch{}
  save(join(ROOT,'TRANSPORT-TERMINAL.json'),{error:transportError,cleanup,temporary_directory:temp});
 }
 need(!transportError,'transport-cleanup');const seals=[];
 for(const c of cases){check();need(hash(readFileSync(c.old_leads_path))===c.old_leads_sha256,'control-drift');const choices=read(join(ROOT,c.pair,'CHOICES.json')),old=new Set(c.observed_files);
  const treatment=choices.paths.filter(p=>!old.has(p)).map(path=>({path,start_line:1,end_line:1}));while(treatment.length<3)treatment.push(null);
  const control=read(c.old_leads_path).control.map(x=>x?{path:x.path,start_line:1,end_line:1}:null);
  save(join(ROOT,c.pair,'LEADS.json'),{pair:c.pair,instance_id:c.instance_id,treatment,control,observed:c.observed_files,queries_valid:choices.invalid===null,choices_sha256:hash(readFileSync(join(ROOT,c.pair,'CHOICES.json'))),range_posture:'Dummy unit-width slots only for file-proxy arithmetic; no source spans delivered or claimed.'});
  seals.push({pair:c.pair,leads_sha256:hash(readFileSync(join(ROOT,c.pair,'LEADS.json')))});
 }
 save(join(ROOT,'PRE-SCORE-SEAL.json'),{freeze_sha256:freezeHash,rows:seals,generations,tokenizers,known_model_tokens:known,unknown_generation_usage:unknown,score_unopened:true});
 const verified=verifyLeadSeal({cases,seal:read(join(ROOT,'PRE-SCORE-SEAL.json')),readLeadBytes:p=>readFileSync(join(ROOT,p,'LEADS.json'))}),rows=[];
 for(const data of verified){const c=cases.find(c=>c.pair===data.pair),dir=join(PRIOR,c.pair+'-control'),bundleBytes=readFileSync(join(dir,'BUNDLE.json'));need(hash(bundleBytes)===c.prior_bundle_sha256,'bundle-drift');const goldBytes=readFileSync(join(dir,'GOLD-EXPOSED-TASK1.json'));need(hash(goldBytes)===JSON.parse(bundleBytes).gold_sha256,'gold-drift');const gold=JSON.parse(goldBytes);need(gold.inst_id===c.instance_id,'gold-identity');rows.push({pair:c.pair,instance_id:c.instance_id,choices_valid:data.queries_valid,gold_sha256:hash(goldBytes),...scoreFileAcquisition({referenceFiles:goldFiles(gold),observed:data.observed,treatment:data.treatment,control:data.control})});}
 const hits=arm=>rows.reduce((n,r)=>n+r[arm].hit_count,0),gain=rows.reduce((n,r)=>n+r.treatment.reference_file_coverage_gain-r.control.reference_file_coverage_gain,0)/12;
 const checks={all_12_valid_outputs:rows.every(r=>r.choices_valid),novel_hits:hits('treatment')>=4,hit_gain:hits('treatment')-hits('control')>=2,mean_file_coverage_gain:gain>=.03,precision:hits('treatment')/36>=.20,cost:unknown===0&&known<=600000};
 save(join(ROOT,'SCREEN-RESULT.json'),{status:Object.values(checks).every(Boolean)?'acquisition-screen-qualified-for-native-test':'acquisition-screen-rejected',freeze_sha256:freezeHash,pre_score_seal_sha256:hash(readFileSync(join(ROOT,'PRE-SCORE-SEAL.json'))),checks,treatment_novel_reference_file_hits:hits('treatment'),control_novel_reference_file_hits:hits('control'),mean_reference_file_coverage_gain_vs_control:gain,unique_hit_files_per_allocated_slot:hits('treatment')/36,known_model_tokens:known,rows,claim_ceiling:'Exposed FILE proxy only, not native F1 or superiority.',authority_effect:'none',open_questions_owner:'G02-INVENTORY-NAVIGATION-R2.json'});
}catch(e){error=String(e.message).startsWith('inventory-screen.')?e.message:'inventory-screen.setup-or-runtime-failure';}
save(join(ROOT,'RESULT.json'),{status:error?'failed-no-replay':'terminal-acquisition-screen',error,generations,tokenizers,known_model_tokens:known,unknown_generation_usage:unknown,transport_error:transportError,screen_result_sha256:existsSync(join(ROOT,'SCREEN-RESULT.json'))?hash(readFileSync(join(ROOT,'SCREEN-RESULT.json'))):null,authority_effect:'none',open_questions_owner:'G02-INVENTORY-NAVIGATION-R2.json'});
console.log(JSON.stringify({root:ROOT,error,generations,known_model_tokens:known}));if(error)process.exitCode=1;
