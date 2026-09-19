import {runSharedCorrection,SHARED_CORRECTION_POLICY} from '../../packages/coding-agent-runtime/glm-flash-v1/shared-correction.mjs';
import {selectFeedbackSchedule,feedbackOutcome,selectCorrectionInput} from './feedback-schedule.mjs';
import {createContainerPublicValidator} from '../../packages/coding-agent-runtime/container-public-validation.mjs';
import {measureExecutionReadiness} from '../../packages/coding-agent-runtime/execution-readiness.mjs';
import {readFileSync,existsSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {runPublicRepairFeedback} from '../../packages/coding-agent-runtime/glm-flash-v1/public-feedback.mjs';
import {createGlmClient,hash} from '../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
import {openContextRecycling} from '../../packages/coding-agent-runtime/context-recycling.mjs';
import {parseCredential} from '../../packages/coding-agent-runtime/glm-flash-v1/cli.mjs';
import {createSopsAgeProcessSecretProvider} from '../../packages/coding-agent-runtime/sops-age-secret-provider.mjs';
import {createSecretProviderRegistry,createSecretReference} from '../../packages/coding-agent-runtime/secret-provider.mjs';
import {publicCheckPlan} from './public-checks.mjs';
import {episodeSources} from './runner.mjs';
import {verifyEpisodeCandidate} from './episodes.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const [credentialPath,historicalRoot,outputArg,privateArg,mode]=process.argv.slice(2);
if(!privateArg||!(process.argv.length===6||process.argv.length===7&&['--fresh-four','--fresh-matrix','--shared-matrix'].includes(mode)))throw Error('usage: credential historical-run output private-state [--fresh-four|--fresh-matrix|--shared-matrix]');
const shared=mode==='--shared-matrix';
const output=resolve(outputArg),privateRoot=resolve(privateArg),history=resolve(historicalRoot);
mkdirSync(output,{mode:0o700});mkdirSync(privateRoot,{mode:0o700});
const save=(name,value)=>writeFileSync(join(output,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
const extra=['../../packages/coding-agent-runtime/glm-flash-v1/shared-correction.mjs','../../packages/coding-agent-runtime/glm-flash-v1/format-repair.mjs','feedback-schedule.mjs','public-feedback-run.mjs','public-checks.mjs','../../packages/coding-agent-runtime/glm-flash-v1/public-feedback.mjs','../../packages/coding-agent-runtime/public-case-validation.mjs','../../packages/coding-agent-runtime/execution-readiness.mjs','../../packages/coding-agent-runtime/container-public-validation.mjs','../../packages/coding-agent-runtime/owned-container.mjs','../../packages/coding-agent-runtime/sandbox.mjs'].map(p=>resolve(here,p));
const sources=[...episodeSources(),...extra.map(path=>({path,sha256:hash(readFileSync(path,'utf8'))}))];
const check=()=>{for(const s of sources)if(hash(readFileSync(s.path,'utf8'))!==s.sha256)throw Error('feedback-frozen-source-drift');};
const old=JSON.parse(readFileSync(join(history,'result.json')));
const {schedule,maximum_model_attempts:maximum_correction_requests}=selectFeedbackSchedule(old,(shared||mode==='--fresh-matrix')?12:mode==='--fresh-four');
const historicalManifest=JSON.parse(readFileSync(join(history,'manifest.json'),'utf8'));
const correctionRetries=shared?(historicalManifest.plan?.maximum_correction_model_retries??0):0;
if(![0,1].includes(correctionRetries))throw Error('feedback-retry-budget-invalid');
const maximum_model_attempts=maximum_correction_requests*(1+correctionRetries);
save('manifest.json',{policy:shared?SHARED_CORRECTION_POLICY:'public-feedback-v3',sources,schedule,maximum_correction_requests,maximum_model_attempts,maximum_tokenizer_attempts:maximum_correction_requests*2,context_limit:16384,effective_soft_limit:7744,output_cap:2048,token_margin:512,...(correctionRetries?{maximum_model_retries:correctionRetries}:{automatic_retries:0}),authority_effect:'none',open_questions_ref:'../README.md#open-questions'});
const c=parseCredential(JSON.parse(readFileSync(credentialPath,'utf8')));
const provider=createSopsAgeProcessSecretProvider({...c,python_command:'/usr/bin/python3',project_root:fileURLToPath(new URL('../../../../secret-management',import.meta.url))});
const registry=createSecretProviderRegistry({providers:[provider]}),ref=createSecretReference({provider_id:c.provider_id,locator:c.locator});
const results=[];let calls=0;
for(const t of schedule) {
 check();
 if(!t.gate&&!shared){const result={status:'NO_SUBMISSION',model_attempts:0,authority_effect:'none'};results.push({id:t.id,episode:t.episode,prior_repair:t.repair,result,transport:null});save(t.id+'-skipped.json',result);console.log(JSON.stringify({id:t.id,status:result.status}));continue;}const trial=join(history,`trial-${String(t.index).padStart(2,'0')}`),m=JSON.parse(readFileSync(join(trial,'manifest.json'))),task=m.arms[0].task;
 const trace=JSON.parse(readFileSync(join(trial,'visible-trace.json'))),candidatePath=join(trial,'candidate.json');
 const selected=shared?selectCorrectionInput(trace,existsSync(candidatePath)?JSON.parse(readFileSync(candidatePath)):undefined):{candidate:JSON.parse(readFileSync(candidatePath))};
 const {candidate,rejected_text}=selected;
 if(rejected_text&&hash(rejected_text)!==trace.final_response_evidence.text_sha256)throw Error('feedback-rejected-text-drift');
 const base={tree_sha256:task.fixture_tree_sha256,files:task.fixture_files};
 const plan=publicCheckPlan(t.episode,join(here,'fixtures',t.episode,'cases.json'));
 if(plan.sources[0].sha256!==task.fixture_files['evidence/cases.json'])throw Error('feedback-task-drift');
 let transportEvidence=null;
 const result=await (shared?runSharedCorrection:runPublicRepairFeedback)({...(candidate===undefined?{rejected_text}:{candidate}),base,plan,maximum_model_retries:correctionRetries,validation_backend:createContainerPublicValidator(),directory:join(output,t.id),check_readiness:()=>measureExecutionReadiness({consume_secret:()=>registry.consume({secret_ref:ref,consumer_id:'glm-flash-transport',request_digest:hash({readiness:'public-feedback-v2',id:t.id}),consumer(){}})}),request_once:async prompt=>{
  if(calls>=maximum_correction_requests)throw Error('feedback-total-call-cap');calls++;
  const client=createGlmClient({api_key_ref:ref,secret_registry:registry,maximum_requests:1,maximum_model_retries:correctionRetries,native_submission:true,final_timeout_ms:60000,token_margin:512});
  const scope={request:'One public-feedback correction',candidate_sha256:hash(candidate??rejected_text),plan_sha256:hash(plan),client:client.identity};
  const state={objective:scope.request,constraints:[],completed:[],pending:[scope.request],facts:[],lessons:[],evidence_refs:[hash(plan)]};
  const directory=join(privateRoot,t.id),session=openContextRecycling({options:{context_limit:16384,recycle_at:7744,safety_margin:1024,state,directory},transport:client.transport,scope,fixture_root:trial});
  try {client.bindRunLedger({directory,binding:hash(scope)});const r=await session.generate({history:[],render:()=>prompt,run_id:t.id});session.completeStep([],true);return {...JSON.parse(r.final_bytes),transport_accounting:{model_attempts:client.receipts.filter(r=>r.kind==='model').length,tokenizer_attempts:client.receipts.filter(r=>r.kind==='tokenizer').length}};}
  finally {transportEvidence={receipts:client.receipts,recycling:session.snapshot()};session.close();save(t.id+'-transport.json',transportEvidence);}
 }});
 check();results.push({id:t.id,episode:t.episode,prior_repair:t.repair,result,transport:transportEvidence});
 console.log(JSON.stringify({id:t.id,status:result.status,public_pass:result.after?.ok??result.before?.ok}));
}
// Hidden oracle is run only after all public-feedback calls. Its inputs/results never enter prompts.
const oracle=[];
for(const r of results) {
 const candidate=r.result.candidate;if(!candidate){oracle.push({id:r.id,result:null});continue;}
 const root=mkdtempSync(join(tmpdir(),'are-feedback-oracle-'));
 try {mkdirSync(join(root,'src'));writeFileSync(join(root,'src/subject.mjs'),candidate.changes[0].utf8);oracle.push({id:r.id,result:verifyEpisodeCandidate(r.episode,root)});}
 finally {rmSync(root,{recursive:true,force:true});}
}
check();const receipts=results.flatMap(r=>r.transport?.receipts??[]);
save('result.json',{status:'COMPLETED',first_pass_repairs:schedule.filter(t=>t.repair).length,...feedbackOutcome(results,oracle),results,oracle,model_attempts:receipts.filter(r=>r.kind==='model').length,tokenizer_attempts:receipts.filter(r=>r.kind==='tokenizer').length,corrected:results.filter(r=>r.result.status==='REPAIRED').length,oracle_passes:oracle.filter(r=>r.result?.ok).length,authority_effect:'none',open_questions_ref:'../README.md#open-questions'});
