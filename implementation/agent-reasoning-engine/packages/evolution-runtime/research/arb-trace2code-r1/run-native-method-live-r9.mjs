// Qualified profile-bound native successor of frozen r8; unchanged tasks and gates.
// Private native adaptive campaign. No secrets, hidden reasoning, labels or replay.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R9.json.
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {readFileSync,mkdirSync,existsSync,mkdtempSync,rmdirSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';import {fileURLToPath} from 'node:url';
import {loadProfileBoundMethodEpisode as loadNativeMethodEpisode} from './native-method-episode-r9.mjs';
import {runProfileBoundMethodEpisode as runNativeMethodEpisode} from './native-method-episode-r9.mjs';
import {createReceipt} from './atomic-campaign-receipt-r1.mjs';
import {providerAdmitted,generationAdmitted,nativeFilePredictionR9 as nativeFilePrediction,uint} from './native-method-live-policy-r9.mjs';
import {createStatelessRecyclingTransport,openContextRecycling} from '../../../../packages/coding-agent-runtime/context-recycling.mjs';
import {stable} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
import {providerBody,createPublicStatelessVpsProvider,validatePrivateControlSocket} from '../g02-product-r4/public-stateless-provider-binding-r1.mjs';
const HERE=dirname(fileURLToPath(import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(readFileSync(p));
const ROOT='/home/vlad_/are-benchmark-archive/g01-native-method-live-r9-20261007';
const INDEX='/home/vlad_/are-benchmark-archive/g01-canonical-method-index-r1-20261007';
const SOURCE='/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r6-20261007';
const SCREEN='/home/vlad_/are-benchmark-archive/defects4j-canonical-exposed-r1/ARE-SCREEN.json';
const protocolPath=join(HERE,'../../evidence/G01-NATIVE-METHOD-LIVE-R9.json');
const need=(v,c)=>{if(!v)throw Error('native-live.'+c);};
const save=(p,x)=>{createReceipt(p,x);return sha(readFileSync(p));};
const mode=process.argv[2];need(process.argv.length===3&&['prepare','run'].includes(mode),'exact-mode');
if(mode==='prepare'){
 need(!existsSync(ROOT),'existing-campaign');
 need(sha(readFileSync(SCREEN))==='7e8f0c59fff072d2ef2c275577243f56cd27e8fb82abcafb47f5234bcedf8b7c','failure-input-pin');
 need(sha(readFileSync(join(INDEX,'RESULT.json')))==='4476e7072b6117bc7c7c8bae481f85e1496e8c7b535dfcd520ef46b3b2443f56','source-index-pin');
 const offline='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r9-20261007/RESULT.json';
 need(sha(readFileSync(offline))==='976c8647ea9034da156442dd788d5ddfe7c05077bc6c161d4dbf9dd1a9a48d6e','offline-pin');
 const native=await loadNativeMethodEpisode(),pins={};
 function trace(path){if(pins[path])return;const bytes=readFileSync(path),text=bytes.toString('utf8');pins[path]=sha(bytes);
  for(const m of text.matchAll(/\b(?:import|export)\s+[^;\n]*?\sfrom\s+['"](\.[^'"]+)['"]/g))trace(resolve(dirname(path),m[1]));}
 for(const path of [fileURLToPath(import.meta.url),native.binding.native_source_path,
  join(HERE,'native-method-live-policy-r7.test.mjs'),join(HERE,'score-native-method-live-r9.py'),
  join(HERE,'score-runtime-linked-reader-r1.py'),join(HERE,'test_native_method_live_score_r1.py'),join(HERE,'native-method-live-r9-wiring.test.mjs'),join(HERE,'native-method-live-r8-wiring.test.mjs'),join(HERE,'../g02-product-r4/public-stateless-provider-binding-r1.test.mjs'),join(HERE,'../g02-product-r4/public-stateless-provider-profile-r1.test.mjs'),join(HERE,'../g02-product-r4/wsl-vps-provider-multiplexed-r2.test.mjs'),join(HERE,'../g02-product-r4/vps-json-provider-r1.test.mjs'),join(HERE,'audit-native-method-live-r9.mjs'),join(HERE,'audit-native-method-live-r7.test.mjs'),
  join(HERE,'native-method-episode-r7.test.mjs'),join(HERE,'explicit-method-tools-r2.test.mjs'),join(HERE,'method-selection-terminal-r5.test.mjs'),join(HERE,'method-navigation-state-r6.test.mjs'),join(HERE,'native-navigation-state-r6.test.mjs'),join(HERE,'native-method-navigation-recycle-r7.test.mjs'),join(HERE,'audit-navigation-state-r6b.test.mjs'),join(HERE,'audit-navigation-state-r6b-equivalence.test.mjs'),join(HERE,'audit-acquisition-guidance-r7.test.mjs'),join(HERE,'evidence-acquisition-guidance-r7.test.mjs'),join(HERE,'native-method-guidance-parity-r7.test.mjs')])trace(path);
 for(const path of [join(HERE,'../../../../packages/coding-agent-runtime/schemas/patch-set-candidate.schema.json'),SCREEN,offline,protocolPath,join(INDEX,'RESULT.json')])pins[path]=sha(readFileSync(path));
 const predecessor='/home/vlad_/are-benchmark-archive/g01-native-method-live-r7-20261007/FREEZE.json';
 need(sha(readFileSync(predecessor))==='5bcff6edf117d236ec50b208484ee47e84631b9a9439fc12b291c48c2f0e8dff','predecessor-freeze-pin');
 const predecessorFreeze=read(predecessor);
 for(const[p,pin]of Object.entries(predecessorFreeze.source_pins)){need(sha(readFileSync(p))===pin,'predecessor-source-pin');pins[p]=pin;}
 const qualificationPins={
  '/home/vlad_/are-benchmark-archive/g01-public-stateless-provider-profile-r1-20261007/FREEZE.json':'53ef65c7ba4a67b5a95a54c21f06696c93b8781fa34e1fde9b377636c1052532',
  '/home/vlad_/are-benchmark-archive/g01-public-stateless-provider-profile-r1-20261007/RESULT.json':'da513fb5b1f59dbba79a422a063bebc7916a05aaa2e8ee7001d250eb28828e82',
  '/home/vlad_/are-benchmark-archive/g01-public-stateless-provider-binding-r1-20261007/FREEZE.json':'baa96bf5fc82dca150cbcaf0e5a3bc9048261a31be1d7ea5de998d943a55fd6e',
  '/home/vlad_/are-benchmark-archive/g01-public-stateless-provider-binding-r1-20261007/RESULT.json':'ab81e09250c63fd004ec90d2349fcbb59bfe30991cc17e486983066aceac1031'};
 for(const[p,pin]of Object.entries(qualificationPins)){need(sha(readFileSync(p))===pin,'shared-profile-qualification-pin');pins[p]=pin;}
 pins[predecessor]=sha(readFileSync(predecessor));
 const screen=new Map(read(SCREEN).cases.map(c=>[c.case_id,c]));
 const cases=read(join(INDEX,'RESULT.json')).rows.map((r,i)=>{
  const c=screen.get(r.case_id);need(c&&typeof c.expanded_query==='string'&&sha(c.expanded_query)===c.expanded_query_sha256,'case-query');
  const problem_statement='Localize the production Java files responsible for the failure below. Tools are read-only; no reference solution is available. All production files remain eligible. Start with runtime_status, then inspect positive runtime methods where available (small pages, exact class filters when useful), and retrieve complete source methods. Explore source references when needed; unresolved/zero observations do not prove irrelevance. Return only context_handles from the exact eligible current-request table, with up to8 distinct files; no summary or other fields, most likely first. Select only delivered evidence.\nUNTRUSTED FAILURE INPUT:\n'+c.expanded_query;
  return{case_id:r.case_id,project:c.project,bug:c.bug,ordinal:i+1,query_sha256:sha(c.expanded_query),problem_statement,
   dispatch_arms:i%2===0?['baseline','index']:['index','baseline']};
 });
 assert.deepEqual(cases,predecessorFreeze.cases,'unchanged full16 tasks and dispatch');
 const profileQualification='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r9-20261007/FREEZE.json';
 need(sha(readFileSync(profileQualification))==='7ac7fd4782085650fd4b86516d464e2fb41ddeb0064a40bc0cd105f13bc05f6d','profile-closure-qualification-pin');
 const qualifiedFreeze=read(profileQualification);
 for(const[p,pin]of Object.entries(qualifiedFreeze.source_pins)){need(sha(readFileSync(p))===pin,'profile-closure-qualified-source-pin');pins[p]=pin;}
 pins[profileQualification]=sha(readFileSync(profileQualification));
 const regressions='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r9-20261007/POST-REGRESSION.json';
 need(sha(readFileSync(regressions))==='8eed5790499cd650d4da0a6e2634a731ae1902504f56603ffffc1192956aec53','profile-closure-regressions-pin');pins[regressions]=sha(readFileSync(regressions));
 const priorCampaign='/home/vlad_/are-benchmark-archive/g01-native-method-live-r8-20261007/FREEZE.json';
 need(sha(readFileSync(priorCampaign))==='a7fe0022b0f6d8df91009daf1fc4aa604ac4d4472ce568e79b0cbf24b60cee30','r8-predecessor-freeze-pin');pins[priorCampaign]=sha(readFileSync(priorCampaign));
 assert.deepEqual(cases,read(priorCampaign).cases,'unchanged r8 full16 tasks and dispatch');
 need(cases.length===16,'full16');mkdirSync(ROOT,{mode:0o700});
 const protocol=read(protocolPath),freeze={status:'frozen-before-provider',cases,protocol,source_pins:pins,native_binding:native.binding,
  model:'glm-5.3-flash',reasoning_effort:'low',window:8192,output_cap:512,
  source_view_budget:'Whole32768byte tool replies or explicit capacity; actual8K admission separately enforced, no silent tool/source truncation.',
  gold_opened:false,authority_effect:'none',open_questions_owner:'G01-NATIVE-METHOD-LIVE-R9.json'};
 console.log(JSON.stringify({status:'prepared',freeze_sha256:save(join(ROOT,'FREEZE.json'),freeze),cases:16,episodes:32}));
}else{
 const freeze=read(join(ROOT,'FREEZE.json')),freezeHash=sha(readFileSync(join(ROOT,'FREEZE.json'))),check=()=>{
  for(const[p,pin]of Object.entries(freeze.source_pins))need(sha(readFileSync(p))===pin,'frozen-source-drift');};check();
 need(!existsSync(join(ROOT,'STARTED.json'))&&!existsSync(join(ROOT,'RESULT.json')),'no-replay');
 save(join(ROOT,'STARTED.json'),{pid:process.pid,started_at:new Date().toISOString(),freeze_sha256:freezeHash});
 let socket=null,owned=null,post=null,globalError=null,cleanupError=null,sequence=0,campaignTokens=0;
 const rows=[],predictions=[],armTokens={baseline:0,index:0};
 const ssh=args=>execFileSync('ssh',['-o','BatchMode=yes','-o','ConnectTimeout=10',...args],{stdio:['ignore','ignore','ignore'],timeout:30000});
 try{
  owned=mkdtempSync('/tmp/are-g02-ssh-reuse-r2-');socket=join(owned,'control.sock');
  save(join(ROOT,'TRANSPORT-STARTED.json'),{owned_directory:owned,control_socket:socket});
  ssh(['-M','-N','-f','-o','ControlPersist=60','-S',socket,'root@187.77.163.194']);
  validatePrivateControlSocket(socket);post=await createPublicStatelessVpsProvider({controlSocket:socket});
  for(const c of freeze.cases){
   if(globalError)break;
   for(const arm of c.dispatch_arms){
    if(globalError)break;check();
    const ordinal=(c.ordinal-1)*2+(arm==='baseline'?1:2),cellName=c.case_id+'-'+arm,cell=join(ROOT,cellName);
    mkdirSync(cell,{mode:0o700});mkdirSync(join(cell,'requests'),{mode:0o700});
    const receipts=[],measurements=new Map();let modelCalls=0,tokenizerCalls=0,error=null;
    async function invoke(operation,prompt,index=false){
     check();need(!globalError,'provider-stop');
     const request=JSON.parse(prompt);need(Object.keys(request).every(k=>['messages','tools'].includes(k)),'prompt-shape');
     if(operation==='generate'){need(++modelCalls<=11,'model-cap');need(uint(measurements.get(sha(prompt))),'unmeasured-generation');
      need(measurements.get(sha(prompt))+512<=8192,'actual8k-cap');
      need(campaignTokens+measurements.get(sha(prompt))+512<=2097152,'campaign-token-cap');}
     else need(++tokenizerCalls<=128,'tokenizer-cap');
     const n=++sequence,input={operation,request_id:'g01-native-method-r9-'+n,...request,output_cap:512};
     const requestHash=sha(providerBody(input));
     save(join(cell,'requests',n+'-STARTED.json'),{input,request_sha256:requestHash,index_measurement:index});
     const reply=await post(input);save(join(cell,'requests',n+'-REPLY.json'),reply);
     const receipt={kind:operation==='generate'?'model':'tokenizer',model:'glm-5.3-flash',request_sha256:requestHash,
      dispatched:reply.dispatched===true,dispatch_uncertain:reply.dispatch_uncertain===true,status:reply.status??null,
      failure_code:reply.failure_code??null,input_tokens:reply.prompt_tokens??null,output_tokens:operation==='generate'?reply.completion_tokens??null:0,
      output_cap:512,reasoning_effort:'low',finish_reason:reply.public_response?.finish_reason??null,
      latency_ms:reply.latency_ms??null,ssh_elapsed_ms:reply.ssh_elapsed_ms??null,automatic_retries:0};
     receipts.push(receipt);save(join(cell,'requests',n+'-RECEIPT.json'),receipt);
     if(!providerAdmitted(reply)){globalError='provider-unconfirmed-stop-no-replay';throw Error(globalError);}
     if(operation==='tokenize')return reply.prompt_tokens;
     if(!uint(reply.completion_tokens)){globalError='unknown-generation-usage-stop';throw Error(globalError);}
     campaignTokens+=reply.prompt_tokens+reply.completion_tokens;armTokens[arm]+=reply.prompt_tokens+reply.completion_tokens;
     if(!generationAdmitted(reply,measurements.get(sha(prompt))))throw Error('native-live.invalid-public-generation');
     return{receipt,final_bytes:stable(reply.public_response)};
    }
    const transport=createStatelessRecyclingTransport({adapter_id:'native-method-vps-r9',source_ref:fileURLToPath(import.meta.url),maximum_output_tokens:512,
     measure_request:async({prompt})=>{const id=sha(prompt);if(!measurements.has(id))measurements.set(id,await invoke('tokenize',prompt));return measurements.get(id);},
     request_once:async({prompt})=>invoke('generate',prompt)});
    const task={problem_statement:c.problem_statement};let recycler=null,result=null;
    try{
     recycler=openContextRecycling({transport,fixture_root:join(SOURCE,c.case_id,'buggy-java-only/corpus'),scope:{request:task.problem_statement},
      options:{directory:join(cell,'state'),context_limit:8192,recycle_at:7680,safety_margin:512,
       state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:[c.query_sha256]}}});
     result=await runNativeMethodEpisode({caseId:c.case_id,arm,task,client:{receipts,maximum_model_retries:0},recycler,
      measure_index_tokens:text=>invoke('tokenize',stable({messages:[{role:'user',content:text}],tools:[]}),true),
      run_id:'native-live-'+c.case_id+'-'+arm});
    }catch(e){error=String(e.message).slice(0,120);}finally{if(recycler)recycler.close();}
    const prediction={ordinal,case_id:c.case_id,arm,...nativeFilePrediction(result)};
    delete prediction.delivery_binding;
    const resultHash=save(join(cell,'RESULT.json'),{prediction,result,receipts,error,model_calls:modelCalls,tokenizer_calls:tokenizerCalls,
     actual_provider:true,gold_opened:false,authority_effect:'none'});
    const row={ordinal,case_id:c.case_id,arm,cell:cellName,result_sha256:resultHash,valid:prediction.valid,
     episode_status:result?.status??'not-completed',error:error??result?.error,model_calls:modelCalls,tokenizer_calls:tokenizerCalls};
    rows.push(row);predictions.push(prediction);console.log(JSON.stringify(row));
   }
  }
 }catch{globalError=globalError??'campaign-or-transport-stop-no-replay';}finally{
  if(socket&&existsSync(socket))try{validatePrivateControlSocket(socket);ssh(['-S',socket,'-O','exit','root@187.77.163.194']);}catch{cleanupError='owned-socket-close-failed';}
  let cleanup='owned-directory-retained';if(owned&&!cleanupError)try{rmdirSync(owned);cleanup='empty-owned-directory-removed';}catch{}
  save(join(ROOT,'TRANSPORT-TERMINAL.json'),{error:cleanupError,cleanup,owned_directory:owned});
 }
 for(const c of freeze.cases)for(const arm of ['baseline','index'])if(!predictions.some(p=>p.case_id===c.case_id&&p.arm===arm))
  predictions.push({ordinal:(c.ordinal-1)*2+(arm==='baseline'?1:2),case_id:c.case_id,arm,valid:false,ranked_files:[],failure:'missing-after-stop'});
 predictions.sort((a,b)=>a.ordinal-b.ordinal);rows.sort((a,b)=>a.ordinal-b.ordinal);check();
 const result={status:'terminal-native-method-live-development',freeze_sha256:freezeHash,completed:rows.length,
  valid:predictions.filter(p=>p.valid).length,expected:32,rows,predictions,error:globalError,transport_error:cleanupError,
  known_generation_tokens:campaignTokens,arm_generation_tokens:armTokens,provider_calls:sequence,authority_effect:'none',
  open_questions_owner:'G01-NATIVE-METHOD-LIVE-R9.json'};
 const resultHash=save(join(ROOT,'RESULT.json'),result);
 save(join(ROOT,'PREDICTION-SEAL.json'),{status:'full32-native-predictions-sealed-before-labels',expected_predictions:32,gold_opened:false,
  result_sha256:resultHash,freeze_sha256:freezeHash,arm_denominator:32,authority_effect:'none'});
 console.log(JSON.stringify({completed:rows.length,valid:result.valid,error:globalError,result_sha256:resultHash,known_generation_tokens:campaignTokens}));
 if(globalError||cleanupError||result.valid!==32)process.exitCode=2;
}
