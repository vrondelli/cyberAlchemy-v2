import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {MODEL,hash,stable,postOnce} from '../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
import {submissionTool,parseSubmission} from '../../packages/coding-agent-runtime/glm-flash-v1/submission.mjs';
import {parseCredential} from '../../packages/coding-agent-runtime/glm-flash-v1/cli.mjs';
import {createSecretProviderRegistry,createSecretReference} from '../../packages/coding-agent-runtime/secret-provider.mjs';
import {createSopsAgeProcessSecretProvider} from '../../packages/coding-agent-runtime/sops-age-secret-provider.mjs';

export const base={tree_sha256:hash('synthetic-base'),files:{'subject.mjs':hash('synthetic-original')}};
const sources=['export const type = "application/json";\n','export const text = "json JSON Json \uD83D\uDE80";\n','export const path = "C:\\\\json\\\\file";\n'];
export function probes(){
 const common={model:MODEL,stream:false,max_tokens:2048,thinking:{type:'enabled',clear_thinking:false},reasoning_effort:'low',tool_choice:'auto',tools:[submissionTool(base,['subject.mjs'])]};
 const cases=[];
 for(let i=0;i<3;i++){
  const expected={schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,changes:[{operation:'replace-file',path:'subject.mjs',expected_file_sha256:base.files['subject.mjs'],utf8:sources[i]}],authority_effect:'none'};
  cases.push({id:'copy-'+i,expected,body:{...common,messages:[{role:'user',content:'Call submit_patch_candidate once with exactly this proposal, preserving every source character: '+stable(expected)}]}});
 }
 for(let i=0;i<3;i++){
  const before='export const type = "text/plain";\n',after='export const type = "application/json";\n';
  const expected={schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,changes:[{operation:'replace-file',path:'subject.mjs',expected_file_sha256:base.files['subject.mjs'],utf8:after}],authority_effect:'none'};
  cases.push({id:'edit-'+i,expected,body:{...common,messages:[{role:'user',content:'In subject.mjs replace only the string text/plain with application/json, preserving all other bytes including the trailing newline. Submit exactly one proposal using submit_patch_candidate, with all required fields. Base and file hashes: '+stable(base)+'\nOriginal source as a JSON string: '+JSON.stringify(before)}]}});
 }
 return cases;
}
export function assess(response,probe){
 if(response?.status!==200)return {passed:false,reason:'http-rejected'};
 if(response.payload.model!==MODEL||response.payload.choices?.length!==1)return {passed:false,reason:'response-invalid'};
 const choice=response.payload.choices[0],parsed=parseSubmission(choice.message,choice.finish_reason,{base,mutation_allowlist:['subject.mjs']});
 if(!parsed.ok)return {passed:false,reason:'submission-invalid',reason_codes:parsed.reason_codes};
 const {rationale,...value}=parsed.value;
 return {passed:stable(value)===stable(probe.expected),reason:stable(value)===stable(probe.expected)?'exact-proposal':'source-content-mismatch',candidate:value};
}
async function main(){
 const [credentialPath,directory,...extra]=process.argv.slice(2);
 if(!credentialPath||!directory||extra.length)throw new Error('usage: native-submission-probe.mjs credential output-directory');
 const credential=parseCredential(JSON.parse(readFileSync(credentialPath,'utf8')));
 const provider=createSopsAgeProcessSecretProvider({provider_id:credential.provider_id,...Object.fromEntries(['python_command','project_root','key_file','vault_file'].filter(k=>Object.hasOwn(credential,k)).map(k=>[k,credential[k]]))});
 const registry=createSecretProviderRegistry({providers:[provider]}),reference=createSecretReference({provider_id:credential.provider_id,locator:credential.locator});
 mkdirSync(directory,{recursive:false});
 const save=(name,value)=>writeFileSync(join(directory,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
 const schedule=probes();save('manifest.json',{model:MODEL,maximum_attempts:6,maximum_output_tokens_per_call:2048,timeout_ms_per_call:60000,automatic_retries:0,schedule,source_sha256:hash(readFileSync(new URL(import.meta.url),'utf8')),authority_effect:'none',open_questions_ref:'README.md#open-questions'});
 const results=[];
 for(const [index,probe] of schedule.entries()){
  const body=stable(probe.body),started=Date.now();let response=null,error=null,dispatched=false,active=true;
  save(`started-${index}.json`,{id:probe.id,request_sha256:hash(body),started_at:new Date().toISOString(),authority_effect:'none'});
  try{await registry.consume({secret_ref:reference,consumer_id:'glm-native-submission-probe',request_digest:hash(body),consumer:async material=>{
   if(!active||dispatched)throw new Error('duplicate-dispatch');dispatched=true;
   response=await postOnce(new URL('https://api.z.ai/api/paas/v4/chat/completions'),body,{apiKey:Buffer.from(material).toString('utf8'),timeout_ms:60000,maximum_response_bytes:262144});
  }});}catch(e){error=typeof e.code==='string'&&/^[a-z-]+$/.test(e.code)?e.code:'request-or-secret-failed';}finally{active=false;}
  const result={id:probe.id,request_sha256:hash(body),dispatched,status:response?.status??null,latency_ms:Date.now()-started,error,assessment:assess(response,probe),visible_response:{content:response?.payload?.choices?.[0]?.message?.content??null,tool_calls:response?.payload?.choices?.[0]?.message?.tool_calls??null},finish_reason:response?.payload?.choices?.[0]?.finish_reason??null,usage:response?.payload?.usage??null,automatic_retries:0,authority_effect:'none'};
  save(`result-${index}.json`,result);results.push(result);console.log(JSON.stringify({id:probe.id,status:result.status,error,assessment:result.assessment}));
 }
 save('result.json',{status:'COMPLETED',attempts:results.length,results,authority_effect:'none',open_questions_ref:'README.md#open-questions'});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(()=>{console.error('native-submission-probe-failed; inspect durable attempt records; no automatic retry');process.exitCode=1;});
