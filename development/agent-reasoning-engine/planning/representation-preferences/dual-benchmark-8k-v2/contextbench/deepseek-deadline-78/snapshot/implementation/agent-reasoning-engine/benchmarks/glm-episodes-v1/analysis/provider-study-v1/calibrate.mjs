// Synthetic real-tokenizer calibration. Open questions: README.md#open-questions.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {parseCredential} from '../../../../packages/coding-agent-runtime/glm-flash-v1/cli.mjs';
import {createSecretProviderRegistry,createSecretReference} from '../../../../packages/coding-agent-runtime/secret-provider.mjs';
import {createSopsAgeProcessSecretProvider} from '../../../../packages/coding-agent-runtime/sops-age-secret-provider.mjs';
import {postOnce,stable,MODEL} from '../../../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
import {cards,decorateRequest} from '../controlled-study-v1/treatments.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
export function credentials(path){const c=parseCredential(JSON.parse(readFileSync(path))),provider=createSopsAgeProcessSecretProvider(c);return {registry:createSecretProviderRegistry({providers:[provider]}),reference:createSecretReference({provider_id:c.provider_id,locator:c.locator})};}
async function main(credential,out){
 mkdirSync(out);const {registry,reference}=credentials(credential),receipts=[],calibrations=[];
 const measure=async(body,label)=>{
  if(receipts.length>=64)throw Error('calibration call cap');const raw=stable({model:MODEL,messages:body.messages,tools:body.tools}),index=receipts.length;
  const record={index,label,request_sha256:sha(raw),status:'started',authority_effect:'none'};receipts.push(record);writeFileSync(join(out,`request-${index}.json`),raw,{flag:'wx'});writeFileSync(join(out,`started-${index}.json`),JSON.stringify(record),{flag:'wx'});
  const start=Date.now();let response;
  try{await registry.consume({secret_ref:reference,consumer_id:'glm-flash-transport',request_digest:sha(raw),consumer:async material=>{response=await postOnce(new URL('https://api.z.ai/api/paas/v4/tokenizer'),raw,{apiKey:Buffer.from(material).toString('utf8'),timeout_ms:30000,maximum_response_bytes:65536});}});
   record.status=response.status;record.elapsed_ms=Date.now()-start;record.tokens=response.payload?.usage?.prompt_tokens;
   if(record.status!==200||!Number.isSafeInteger(record.tokens))throw Error('tokenizer response invalid');
  }catch(e){record.failure=e.code??'tokenizer-or-credential-failure';throw Error(record.failure);}
  finally{writeFileSync(join(out,`receipt-${index}.json`),JSON.stringify(record,null,2)+'\n',{flag:'wx'});}
  console.log(JSON.stringify({index,label,tokens:record.tokens}));return record.tokens;
 };
 for(const [family,fixture] of [['archive','archive-start-v1'],['retention','retention-empty-v1']]){
  const file=new URL(`../study-runner-v1/evidence-v2/${fixture}-baseline.json`,import.meta.url),captureBytes=readFileSync(file),capture=JSON.parse(captureBytes);
  const base=JSON.parse(capture.captures.filter(c=>c.kind==='model').at(-1).raw),boundary=decorateRequest(base,{arm:'boundary-card',family}),target=await measure(boundary,family+'/boundary');
  const neutral=decorateRequest(base,{arm:'neutral-card',family}),original=neutral.messages.at(-1).content;let text=original,count=await measure(neutral,family+'/neutral-0'),matched=count===target;
  // Fixed, non-task-specific suffix vocabulary; no oracle content or answer hints.
  const tried=new Set([text]);
  for(let i=0;!matched&&i<28;i++){
   const deficit=target-count;
   if(deficit<0){text='Review the proposal carefully.';}else{text+=' Review'.repeat(Math.max(1,deficit));}
   if(tried.has(text))text+='.';tried.add(text);neutral.messages.at(-1).content=text;
   count=await measure(neutral,family+'/neutral-'+(i+1));matched=count===target;
  }
  if(!matched)throw Error('exact token match not reached');
  calibrations.push({family,fixture,source_capture_sha256:sha(captureBytes),boundary_instruction:cards['boundary-card'].instructions[family],neutral_instruction:text,full_request_tokens:target,matched:true,limitations:'Exact equality for the captured representative final prompt only; live per-request counts must be verified.'});
 }
 writeFileSync(join(out,'result.json'),JSON.stringify({schema_version:'are.glm-token-calibration/v1',model:MODEL,endpoint:'https://api.z.ai/api/paas/v4/tokenizer',calibrations,receipts,maximum_calls:64,model_calls:0,sources:['calibrate.mjs','../controlled-study-v1/treatments.mjs'].map(p=>({path:p,sha256:sha(readFileSync(new URL(p,import.meta.url)))})),authority_effect:'none',open_questions_ref:'../README.md#open-questions'},null,2)+'\n');
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){if(process.argv.length!==4)throw Error('credential path and new output directory required');await main(process.argv[2],resolve(process.argv[3]));}
