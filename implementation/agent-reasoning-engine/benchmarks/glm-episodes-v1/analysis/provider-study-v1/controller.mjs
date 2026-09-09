// Bounded provider controller. Open questions: README.md#open-questions.
import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync,rmSync,openSync,writeSync,fsyncSync,closeSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {compileCandidate} from '../study-runner-v1/candidate.mjs';
import {createStudyAdapter} from '../study-runner-v1/adapter.mjs';
import {credentials} from './calibrate.mjs';
import {createGlmClient} from '../../../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
import {createReadOnlyToolRuntime} from '../../../../packages/coding-agent-runtime/read-only-tools.mjs';
import {createContainerPublicValidator} from '../../../../packages/coding-agent-runtime/container-public-validation.mjs';
const engine=new URL('../../../../',import.meta.url),prepared=new URL('../controlled-study-v1/prepared/',import.meta.url);
const sha=x=>createHash('sha256').update(x).digest('hex'),json=p=>JSON.parse(readFileSync(p)),need=(x,m)=>{if(!x)throw Error(m);};
export function save(path,value){const fd=openSync(path,'wx',0o600);try{writeSync(fd,JSON.stringify(value,null,2)+'\n');fsyncSync(fd);}finally{closeSync(fd);}}
export function verifyFreeze(directory){
 const m=json(join(directory,'manifest.json'));
 for(const s of m.sources)need(sha(readFileSync(new URL(s.path,engine)))===s.sha256,'source drift: '+s.path);
 for(const s of m.artifacts)need(sha(readFileSync(join(directory,s.path)))===s.sha256,'frozen artifact drift: '+s.path);
 return {...m,digest:sha(readFileSync(join(directory,'manifest.json')))};
}
export function freeze(directory){
 mkdirSync(directory);const compiled=compileCandidate(join(directory,'candidate-agent.mjs'));
 const calibration=json(new URL('calibration/result.json',import.meta.url));need(calibration.calibrations.length===2&&calibration.calibrations.every(c=>c.matched),'calibration incomplete');
 const preflight=json(new URL('container-preflight/result.json',import.meta.url));need(preflight.ok&&preflight.backend_id===createContainerPublicValidator().id,'container preflight missing or drifted');
 const original=json(new URL('manifest.json',prepared));for(const f of original.files)need(sha(readFileSync(new URL(f.path,prepared)))===f.sha256,'prepared fixture drift');
 const schedule=json(new URL('schedule.json',prepared)),protocol=json(new URL('protocol.json',prepared));
 save(join(directory,'schedule.json'),schedule);save(join(directory,'protocol.json'),{...protocol,status:'frozen-for-bounded-provider-execution',neutral_instructions:Object.fromEntries(calibration.calibrations.map(c=>[c.family,c.neutral_instruction])),calibration_sha256:sha(readFileSync(new URL('calibration/result.json',import.meta.url))),
  calibration_scope:'Exact equality on representative final prompts; other live prompts have separate actual usage. No extra calibration calls occur inside a trial.',provider_endpoints:{model:'https://api.z.ai/api/paas/v4/chat/completions',tokenizer:'https://api.z.ai/api/paas/v4/tokenizer'},validator_backend_id:preflight.backend_id,execution_blockers:[],open_questions_ref:'../README.md#open-questions'});
 const sources=[];const collect=dir=>{for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory()&&!['evidence','node_modules'].includes(e.name))collect(p);else if(e.isFile()&&/\.(mjs|json)$/.test(p))sources.push({path:relative(engine.pathname,p),sha256:sha(readFileSync(p))});}};
 collect(new URL('packages/coding-agent-runtime/',engine).pathname);
 for(const p of ['controller.mjs','controller.test.mjs','preflight.mjs','calibrate.mjs',...readdirSync(new URL('calibration/',import.meta.url)).map(p=>'calibration/'+p),...readdirSync(new URL('container-preflight/',import.meta.url)).map(p=>'container-preflight/'+p),'../study-runner-v1/candidate.mjs','../study-runner-v1/adapter.mjs','../controlled-study-v1/treatments.mjs']){const u=new URL(p,import.meta.url);sources.push({path:relative(engine.pathname,u.pathname),sha256:sha(readFileSync(u))});}
 for(const f of original.files){const u=new URL(f.path,prepared);sources.push({path:relative(engine.pathname,u.pathname),sha256:f.sha256});}
 const artifacts=readdirSync(directory).map(path=>({path,sha256:sha(readFileSync(join(directory,path)))}));
 save(join(directory,'manifest.json'),{compiled,sources,artifacts,maximum_model_attempts:1600,maximum_tokenizer_attempts:3200,maximum_trials:120,authority_effect:'none',open_questions_ref:'../README.md#open-questions'});return verifyFreeze(directory);
}
export function trialState(directory,row,freezeDigest){
 const root=join(directory,row.id),started=join(root,'started.json'),completed=join(root,'completed.json');
 if(existsSync(completed)){
  const c=json(completed),s=json(started),bytes=readFileSync(join(root,'result.json'));
  need(c.freeze_digest===freezeDigest&&s.freeze_digest===freezeDigest&&JSON.stringify(s.row)===JSON.stringify(row)&&c.result_sha256===sha(bytes),'completed trial binding drift');
  const r=JSON.parse(bytes);need(r.id===row.id&&Array.isArray(r.receipts),'completed result shape');checkCounts(r.receipts,row);return {status:'completed',root,result:r};
 }
 if(existsSync(started))throw Error('ambiguous unfinished trial; no redispatch: '+row.id);
 return {status:'pending',root};
}
export function checkCounts(receipts,row){
 const models=receipts.filter(r=>r.kind==='model').length,tokens=receipts.filter(r=>r.kind==='tokenizer').length;
 need(models+tokens===receipts.length&&models<=row.maximum_model_attempts&&tokens<=row.maximum_tokenizer_attempts,'receipt cap violation');
 need(receipts.every(r=>!(r.attempt_index>0)&&!(r.automatic_retries>0)),'retry forbidden');return {models,tokens};
}
export async function executeRow({directory,row,frozen,manifest,credential,makeClient=createGlmClient,runAgent,validator=createContainerPublicValidator()}){
 const prior=trialState(directory,row,manifest.digest);if(prior.status==='completed')return prior.result;
 mkdirSync(prior.root,{recursive:true});save(join(prior.root,'started.json'),{row,freeze_digest:manifest.digest,reserved_model_attempts:row.maximum_model_attempts,reserved_tokenizer_attempts:row.maximum_tokenizer_attempts,authority_effect:'none'});
 const fixture=join(prior.root,'fixture');mkdirSync(fixture);const task=json(new URL(`fixtures/${row.fixture}/task.json`,prepared));
 for(const p of task.observation_allowlist)writeFileSync(join(fixture,p),readFileSync(new URL(`fixtures/${row.fixture}/${p}`,prepared)),{flag:'wx'});
 const protocol=json(join(frozen,'protocol.json')),baseAdapter=createStudyAdapter({arm:row.arm,family:row.family,candidate_sha256:manifest.compiled.candidate_sha256});
 const adapter=Object.freeze({...baseAdapter,binding:sha(JSON.stringify({base:baseAdapter.binding,freeze:manifest.digest,row})),decorate(prompt){
  const decorated=baseAdapter.decorate(prompt);if(row.arm!=='neutral-card')return decorated;const b=JSON.parse(decorated);
  if(b.tools?.some(t=>t.function?.name==='submit_patch_candidate'))b.messages.at(-1).content=protocol.neutral_instructions[row.family];return JSON.stringify(b);
 }});
 const {registry,reference}=credential;const client=makeClient({api_key_ref:reference,secret_registry:registry,maximum_requests:row.maximum_model_attempts,request_budget:row.soft_limit===8000?'paging-v1':'standard-v1',native_submission:true,token_margin:512,model_timeout_ms:60000,final_timeout_ms:60000,maximum_model_retries:0});
 const request='Restore the contract in subject.mjs; inspect all allowlisted files, preserve unrelated behavior and propose only.';
 let generated;
 try{generated=await runAgent({run_id:row.id,request,fixture_root:fixture,client,study_adapter:adapter,observation_allowlist:task.observation_allowlist,mutation_allowlist:task.mutation_allowlist,verification_command:[],tool_runtime:createReadOnlyToolRuntime({repository_root:fixture,observation_allowlist:task.observation_allowlist}),tool_policy:{allow:['read-file','read-inspection-evidence']},
  retention_policy:'recent-observations-v2',delivery_policy:'bounded-reads-v1',completion_policy:'example-fields-v20',source_policy:'inspected-mutation-v1',completion_requirements:{required_reads:task.observation_allowlist,distinct_turns:true,archive_after_recycle:true},
  context_recycling:{directory:join(prior.root,'state'),context_limit:16384,recycle_at:row.soft_limit,safety_margin:1000,state:{objective:request,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['study-fixture']}}});}
 catch(e){save(join(prior.root,'interrupted.json'),{reason:'runner exception; audit required before any further dispatch',receipts:client.receipts??[],authority_effect:'none'});throw e;}
 const receipts=client.receipts;checkCounts(receipts,row);save(join(prior.root,'agent-result.json'),generated);
 let validation=null;
 if(generated.status==='AWAITING_APPROVAL'){
  const subject=join(prior.root,'validation-subject.mjs'),oraclePath=join(prior.root,'oracle.json');writeFileSync(subject,generated.candidate.changes[0].utf8,{flag:'wx'});
  const oracle=json(new URL(`fixtures/${row.fixture}/oracle.json`,prepared));save(oraclePath,oracle);
  const plan={schema_version:'are.public-case-plan/v1',sources:[{path:oraclePath,sha256:sha(readFileSync(oraclePath))}],checks:oracle.map((c,i)=>({...c,evidence:[{path:oraclePath,selector:'/'+i,value_sha256:sha(JSON.stringify(c))}]}))};
  validation=validator.validate({subject,plan});save(join(prior.root,'validation.json'),validation);
  need(validation.worker_cleanup_verified,'worker cleanup unknown');
 }
 const result={id:row.id,arm:row.arm,fixture:row.fixture,soft_limit:row.soft_limit,freeze_digest:manifest.digest,status:generated.status,initial_pass:generated.status==='AWAITING_APPROVAL'&&validation?.ok===true,semantics:validation?.ok??null,raw_response_sha256:generated.final_response_evidence?.text_sha256??null,normalization:adapter.evidence,receipts,counts:checkCounts(receipts,row),validation_ref:validation?'validation.json':null,authority_effect:'none'};
 verifyFreeze(frozen);save(join(prior.root,'result.json'),result);save(join(prior.root,'completed.json'),{freeze_digest:manifest.digest,result_sha256:sha(readFileSync(join(prior.root,'result.json'))),authority_effect:'none'});return result;
}
export async function run({frozen,directory,credentialPath,maxTrials}){
 need(Number.isSafeInteger(maxTrials)&&maxTrials>=1&&maxTrials<=120,'max trials required');const manifest=verifyFreeze(frozen),rows=json(join(frozen,'schedule.json'));
 need(rows.length===120&&new Set(rows.map(r=>r.id)).size===120&&rows.reduce((s,r)=>s+r.maximum_model_attempts,0)===1600&&rows.reduce((s,r)=>s+r.maximum_tokenizer_attempts,0)===3200,'schedule caps invalid');
 mkdirSync(directory,{recursive:true});const lock=join(directory,'controller.lock');mkdirSync(lock);
 try{
  const bound=join(directory,'study-binding.json');if(existsSync(bound))need(json(bound).freeze_digest===manifest.digest,'run freeze drift');else save(bound,{freeze_digest:manifest.digest});
  // Audit all prior rows before new effects; a later unfinished row cannot be hidden by a small maxTrials.
  const states=rows.map(r=>trialState(directory,r,manifest.digest));let gap=false;
  for(const s of states){if(s.status==='pending')gap=true;else need(!gap,'non-prefix completed schedule');}
  const candidate=await import(pathToFileURL(join(frozen,'candidate-agent.mjs'))),credential=credentials(credentialPath);let count=0;
  for(let i=0;i<rows.length&&count<maxTrials;i++)if(states[i].status==='pending'){
   verifyFreeze(frozen);const r=await executeRow({directory,row:rows[i],frozen,manifest,credential,runAgent:candidate.runGlmAgent});count++;console.log(JSON.stringify({id:r.id,initial_pass:r.initial_pass,counts:r.counts}));
   if(r.receipts.some(x=>x.kind==='model'&&x.status!==200))break;
  }
  return {new_trials:count};
 }finally{rmSync(lock,{recursive:true});}
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const [op,...args]=process.argv.slice(2);if(op==='freeze'&&args.length===1)console.log(JSON.stringify({digest:freeze(resolve(args[0])).digest}));else if(op==='run'&&args.length===4)console.log(JSON.stringify(await run({frozen:resolve(args[0]),directory:resolve(args[1]),credentialPath:args[2],maxTrials:Number(args[3])})));else throw Error('freeze NEW_DIRECTORY | run FROZEN_DIRECTORY PRIVATE_RUN_DIRECTORY CREDENTIAL MAX_NEW_TRIALS');}
