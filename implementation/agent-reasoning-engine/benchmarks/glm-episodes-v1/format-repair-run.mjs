import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';import {tmpdir} from 'node:os';
import {runNativeFormatRepair} from '../../packages/coding-agent-runtime/glm-flash-v1/format-repair.mjs';
import {createGlmClient,hash} from '../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
import {parseCredential} from '../../packages/coding-agent-runtime/glm-flash-v1/cli.mjs';
import {openContextRecycling} from '../../packages/coding-agent-runtime/context-recycling.mjs';
import {createContainerPublicValidator} from '../../packages/coding-agent-runtime/container-public-validation.mjs';
import {measureExecutionReadiness} from '../../packages/coding-agent-runtime/execution-readiness.mjs';
import {createSecretProviderRegistry,createSecretReference} from '../../packages/coding-agent-runtime/secret-provider.mjs';
import {createSopsAgeProcessSecretProvider} from '../../packages/coding-agent-runtime/sops-age-secret-provider.mjs';
import {episodeSources} from './runner.mjs';import {publicCheckPlan} from './public-checks.mjs';import {verifyEpisodeCandidate} from './episodes.mjs';
const here=dirname(fileURLToPath(import.meta.url)),[credentialPath,outputArg,privateArg]=process.argv.slice(2);
if(!privateArg||process.argv.length!==5)throw Error('usage: credential fresh-output fresh-private-state');
const output=resolve(outputArg),privateRoot=resolve(privateArg);mkdirSync(output,{mode:0o700});mkdirSync(privateRoot,{mode:0o700});
const save=(name,value)=>writeFileSync(join(output,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
const original=join(here,'evidence/matrix-feedback-2026-09-08/initial/trial-10'),trace=JSON.parse(readFileSync(join(original,'visible-trace.json'))),task=JSON.parse(readFileSync(join(original,'manifest.json'))).arms[0].task;
const text=trace.final_response_evidence.text;if(hash(text)!==trace.final_response_evidence.text_sha256)throw Error('format-original-integrity');
const base={tree_sha256:task.fixture_tree_sha256,files:task.fixture_files},plan=publicCheckPlan(task.episode_id,join(here,'fixtures',task.episode_id,'cases.json'));
if(plan.sources[0].sha256!==task.fixture_files['evidence/cases.json'])throw Error('format-evidence-drift');
const extra=['format-repair-run.mjs','public-checks.mjs','../../packages/coding-agent-runtime/glm-flash-v1/format-repair.mjs','../../packages/coding-agent-runtime/container-public-validation.mjs','../../packages/coding-agent-runtime/public-case-validation.mjs','../../packages/coding-agent-runtime/owned-container.mjs','../../packages/coding-agent-runtime/execution-readiness.mjs'].map(p=>resolve(here,p));
const sources=[...episodeSources(),...extra.map(path=>({path,sha256:hash(readFileSync(path,'utf8'))}))];const check=()=>{if(sources.some(s=>hash(readFileSync(s.path,'utf8'))!==s.sha256))throw Error('format-source-drift');};
save('manifest.json',{sources,original,original_sha256:hash(text),maximum_model_attempts:1,maximum_tokenizer_attempts:2,automatic_retries:0,authority_effect:'none',open_questions_ref:'../README.md#open-questions'});
const c=parseCredential(JSON.parse(readFileSync(credentialPath,'utf8'))),provider=createSopsAgeProcessSecretProvider({...c,python_command:'/usr/bin/python3',project_root:'/home/vrondelli/projects/domainspec-core/projects/secret-management'}),registry=createSecretProviderRegistry({providers:[provider]}),ref=createSecretReference({provider_id:c.provider_id,locator:c.locator});
let transport=null;
const result=await runNativeFormatRepair({text,base,directory:join(output,'stage'),check_readiness:()=>measureExecutionReadiness({consume_secret:()=>registry.consume({secret_ref:ref,consumer_id:'glm-flash-transport',request_digest:hash('format-repair-37-readiness'),consumer(){}})}),request_once:async prompt=>{
 check();const client=createGlmClient({api_key_ref:ref,secret_registry:registry,maximum_requests:1,native_submission:true,final_timeout_ms:60000,token_margin:512});
 const scope={request:'Preserve source and recover missing authority field',original_sha256:hash(text),client:client.identity},state={objective:scope.request,constraints:[],completed:[],pending:[scope.request],facts:[],lessons:[],evidence_refs:[hash(text)]},directory=join(privateRoot,'state');
 const session=openContextRecycling({options:{directory,context_limit:16384,recycle_at:7744,safety_margin:1024,state},transport:client.transport,scope,fixture_root:original});
 try{client.bindRunLedger({directory,binding:hash(scope)});const response=await session.generate({history:[],render:()=>prompt,run_id:'format-repair-37'});session.completeStep([],true);return JSON.parse(response.final_bytes);}
 finally{transport={receipts:client.receipts,recycling:session.snapshot()};session.close();save('transport.json',transport);}
}});
check();let validation=null,oracle=null;
if(result.status==='FORMAT_REPAIRED') {
 const root=mkdtempSync(join(tmpdir(),'are-format-verify-'));
 try{mkdirSync(join(root,'src'));const subject=join(root,'src/subject.mjs');writeFileSync(subject,result.candidate.changes[0].utf8);validation=createContainerPublicValidator().validate({subject,plan});save('public-validation.json',validation);if(validation.worker_cleanup_verified!==true)throw Error('format-cleanup-unconfirmed');oracle=verifyEpisodeCandidate(task.episode_id,root);}
 finally{rmSync(root,{recursive:true,force:true});}
}
check();save('result.json',{status:'COMPLETED',target_met:result.status==='FORMAT_REPAIRED'&&validation?.ok===true&&oracle?.ok===true,format:result,validation,oracle,model_attempts:transport?.receipts.filter(r=>r.kind==='model').length??0,tokenizer_attempts:transport?.receipts.filter(r=>r.kind==='tokenizer').length??0,authority_effect:'none',open_questions_ref:'../README.md#open-questions'});
console.log(JSON.stringify({format_status:result.status,public_pass:validation?.ok??false,oracle_pass:oracle?.ok??false}));
