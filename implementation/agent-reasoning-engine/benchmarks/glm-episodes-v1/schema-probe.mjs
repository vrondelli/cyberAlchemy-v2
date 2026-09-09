import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {MODEL,hash,stable,postOnce} from '../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
import {parseCredential} from '../../packages/coding-agent-runtime/glm-flash-v1/cli.mjs';
import {createSecretProviderRegistry,createSecretReference} from '../../packages/coding-agent-runtime/secret-provider.mjs';
import {createSopsAgeProcessSecretProvider} from '../../packages/coding-agent-runtime/sops-age-secret-provider.mjs';

export const expected={schema_version:'are.schema-probe/v1',authority_effect:'none',description:'application/json; json JSON Json',utf8:'export const type = "application/json";\n'};
export function probes(){
 const common={model:MODEL,stream:false,max_tokens:2048,thinking:{type:'enabled',clear_thinking:false},reasoning_effort:'low'};
 const copy=[{role:'user',content:'Return ONLY this JSON object, preserving every key and string exactly: '+stable(expected)}];
 const schema={type:'object',properties:Object.fromEntries(Object.entries(expected).map(([k,v])=>[k,{type:'string',enum:[v]}])),required:Object.keys(expected),additionalProperties:false};
 return [
  {id:'text-copy',body:{...common,messages:copy}},
  {id:'json-object-copy',body:{...common,messages:copy,response_format:{type:'json_object'}}},
  {id:'json-schema-enforcement',body:{...common,messages:[{role:'user',content:'Return ONLY this JSON object: {"unexpected":true}'}],response_format:{type:'json_schema',json_schema:{name:'are_probe',strict:true,schema}}}}
 ];
}
export function assess(response){
 const choice=response?.payload?.choices?.[0],text=choice?.message?.content;
 if(response?.status!==200)return {passed:false,reason:'http-rejected'};
 if(response.payload.model!==MODEL)return {passed:false,reason:'model-mismatch'};
 if(choice?.finish_reason!=='stop'||typeof text!=='string')return {passed:false,reason:'incomplete-or-nontext'};
 let value;try{value=JSON.parse(text);}catch{return {passed:false,reason:'invalid-json'};}
 return {passed:stable(value)===stable(expected),reason:stable(value)===stable(expected)?'exact-object':'schema-or-content-mismatch',observed:value};
}
async function main(){
 const [credentialPath,directory,...extra]=process.argv.slice(2);
 if(!credentialPath||!directory||extra.length)throw new Error('usage: schema-probe.mjs credential output-directory');
 const credential=parseCredential(JSON.parse(readFileSync(credentialPath,'utf8')));
 const provider=createSopsAgeProcessSecretProvider({provider_id:credential.provider_id,...Object.fromEntries(['python_command','project_root','key_file','vault_file'].filter(k=>Object.hasOwn(credential,k)).map(k=>[k,credential[k]]))});
 const registry=createSecretProviderRegistry({providers:[provider]}),reference=createSecretReference({provider_id:credential.provider_id,locator:credential.locator});
 mkdirSync(directory,{recursive:false});
 const save=(name,value)=>writeFileSync(join(directory,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
 const schedule=probes();save('manifest.json',{model:MODEL,maximum_attempts:3,maximum_output_tokens_per_call:2048,timeout_ms_per_call:60000,automatic_retries:0,schedule,source_sha256:hash(readFileSync(new URL(import.meta.url),'utf8')),authority_effect:'none',open_questions_ref:'README.md#open-questions'});
 const results=[];
 for(const [index,probe] of schedule.entries()){
  const body=stable(probe.body),started=Date.now();let response=null,error=null,dispatched=false,active=true;
  save(`started-${index}.json`,{id:probe.id,request_sha256:hash(body),started_at:new Date().toISOString(),authority_effect:'none'});
  try{await registry.consume({secret_ref:reference,consumer_id:'glm-schema-probe',request_digest:hash(body),consumer:async material=>{
   if(!active||dispatched)throw new Error('duplicate-dispatch');dispatched=true;
   response=await postOnce(new URL('https://api.z.ai/api/paas/v4/chat/completions'),body,{apiKey:Buffer.from(material).toString('utf8'),timeout_ms:60000,maximum_response_bytes:262144});
  }});}catch(e){error=typeof e.code==='string'&&/^[a-z-]+$/.test(e.code)?e.code:'request-or-secret-failed';}finally{active=false;}
  const result={id:probe.id,request_sha256:hash(body),dispatched,status:response?.status??null,latency_ms:Date.now()-started,error,assessment:assess(response),visible_response:response?.payload?.choices?.[0]?.message?.content??null,finish_reason:response?.payload?.choices?.[0]?.finish_reason??null,usage:response?.payload?.usage??null,automatic_retries:0,authority_effect:'none'};
  save(`result-${index}.json`,result);results.push(result);console.log(JSON.stringify({id:probe.id,status:result.status,error,assessment:result.assessment}));
 }
 save('result.json',{status:'COMPLETED',attempts:results.length,results,authority_effect:'none',open_questions_ref:'README.md#open-questions'});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(()=>{console.error('schema-probe-failed; inspect durable attempt records; no automatic retry');process.exitCode=1;});
