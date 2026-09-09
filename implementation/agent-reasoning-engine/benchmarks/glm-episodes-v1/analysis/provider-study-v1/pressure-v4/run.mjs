// Two prospective live trials, same engine, changed inspected load. Open questions: README.md#open-questions.
import {readFileSync,writeFileSync,mkdirSync,existsSync,rmSync} from 'node:fs';import {join,resolve} from 'node:path';import {createHash} from 'node:crypto';
import {createStudyAdapter} from '../../study-runner-v1/adapter.mjs';
import {verifyFreeze,save} from '../controller.mjs';import {credentials} from '../calibrate.mjs';
import {createGlmClient} from '../../../../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
import {createReadOnlyToolRuntime} from '../../../../../packages/coding-agent-runtime/read-only-tools.mjs';
import {createContainerPublicValidator} from '../../../../../packages/coding-agent-runtime/container-public-validation.mjs';
const root=new URL('./',import.meta.url),prepared=new URL('prepared/',root),read=p=>JSON.parse(readFileSync(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const need=(ok,why)=>{if(!ok)throw Error(why);};
const manifest=read(new URL('manifest.json',prepared)),frozen=new URL('../frozen/',root).pathname;
need(verifyFreeze(frozen).digest===manifest.freeze_digest,'freeze drift');need(sha(readFileSync(new URL('run.mjs',root)))===manifest.runner_sha256,'runner drift');
for(const f of manifest.files)need(sha(readFileSync(new URL(f.path,prepared)))===f.sha256,'fixture drift');
for(const f of ['hypothesis','experiment'])need(sha(readFileSync(new URL(f+'.json',root)))===manifest[f+'_sha256'],f+' drift');
need(!existsSync(new URL('../live-run/controller.lock',root)),'main study is still active');
const output=new URL('live/',root).pathname;mkdirSync(output); // Create-only entire probe; never rerun in place.
const originalAgent=await import(new URL('../frozen/candidate-agent.mjs',root)),candidateAgent=await import(new URL('prepared/candidate-agent.mjs',root));const credential=credentials(process.argv[2]);
const summaries=[];
for(const arm of ['baseline','pressure']){
 const directory=join(output,arm);mkdirSync(directory);save(join(directory,'started.json'),{arm,manifest_sha256:sha(readFileSync(new URL('manifest.json',prepared))),maximum_model_calls:16,maximum_tokenizer_calls:32});
 const fixture=join(directory,'fixture');mkdirSync(fixture);const paths=['README.md','subject.mjs','contract.json'];
 for(const p of paths)writeFileSync(join(fixture,p),readFileSync(new URL(arm+'/'+p,prepared)),{flag:'wx'});
 const client=createGlmClient({api_key_ref:credential.reference,secret_registry:credential.registry,maximum_requests:16,request_budget:'paging-v1',native_submission:true,token_margin:512,model_timeout_ms:60000,final_timeout_ms:60000,maximum_model_retries:0});
 const request='Restore the contract in subject.mjs; inspect all allowlisted files, preserve unrelated behavior and propose only.';
 const runGlmAgent=(arm==='pressure'?candidateAgent:originalAgent).runGlmAgent;
 const a=await runGlmAgent({run_id:'pressure59-v4-'+arm,study_adapter:createStudyAdapter({arm:'baseline',family:'archive',candidate_sha256:arm==='pressure'?sha(readFileSync(new URL('candidate-agent.mjs',prepared))):verifyFreeze(frozen).compiled.candidate_sha256}),request,fixture_root:fixture,client,observation_allowlist:paths,mutation_allowlist:['subject.mjs'],verification_command:[],tool_runtime:createReadOnlyToolRuntime({repository_root:fixture,observation_allowlist:paths}),tool_policy:{allow:['read-file','read-inspection-evidence']},retention_policy:'recent-observations-v2',delivery_policy:'bounded-reads-v1',completion_policy:'example-fields-v20',source_policy:'inspected-mutation-v1',completion_requirements:{required_reads:paths,distinct_turns:true,archive_after_recycle:true},context_recycling:{directory:join(directory,'state'),context_limit:16384,recycle_at:8000,safety_margin:1000,state:{objective:request,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['pressure-fixture']}}});
 save(join(directory,'agent-result.json'),a);let validation=null;
 if(a.status==='AWAITING_APPROVAL'){
  const subject=join(directory,'validation-subject.mjs');writeFileSync(subject,a.candidate.changes[0].utf8,{flag:'wx'});
  const path=new URL(arm+'/oracle.json',prepared).pathname,cases=read(path);
  const plan={schema_version:'are.public-case-plan/v1',sources:[{path,sha256:sha(readFileSync(path))}],checks:cases.map((c,i)=>({...c,evidence:[{path,selector:'/'+i,value_sha256:sha(JSON.stringify(c))}]}))};
  validation=createContainerPublicValidator().validate({subject,plan});save(join(directory,'validation.json'),validation);need(validation.worker_cleanup_verified,'cleanup unknown');
 }
 const r={arm,status:a.status,reason_codes:a.reason_codes??[],semantics:validation?.ok??null,recycles:a.recycling?.recycles??null,archive_recovery_confirmed:a.completion_gate?.archive_recovery_confirmed??null,max_projected_tokens:a.recycling?.dispatches?.length?Math.max(...a.recycling.dispatches.map(x=>x.projected_upper_bound)):null,models:client.receipts.filter(x=>x.kind==='model').length,tokenizers:client.receipts.filter(x=>x.kind==='tokenizer').length,receipts:client.receipts,agent_result_sha256:sha(readFileSync(join(directory,'agent-result.json'))),authority_effect:'none'};
 need(r.models<=16&&r.tokenizers<=32,'cap violation');need(r.max_projected_tokens===null||r.max_projected_tokens<=16384,'hard bound violation');
 save(join(directory,'result.json'),r);save(join(directory,'completed.json'),{result_sha256:sha(readFileSync(join(directory,'result.json')))});summaries.push(r);console.log(JSON.stringify({...r,receipts:undefined}));
 if(client.receipts.some(x=>x.status!==200))break;
}
save(join(output,'result.json'),{trials:summaries,authority_effect:'none',open_questions_ref:'../README.md#open-questions'});
