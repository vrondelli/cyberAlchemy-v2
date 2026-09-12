// Existing GLM transport plus a separately bounded, tokenizer-only index measurer.
// Open questions: README.md. Construction creates no network requests by itself.
import {createHash} from 'node:crypto';
import {createGlmClient,postOnce,MODEL,stable} from '../external-context-v1/holdout-v1/transport.mjs';
import {credentials} from '../glm-episodes-v1/analysis/provider-study-v1/calibrate.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');

export function createIndexTokenizer({registry,reference,maximum_calls,record=()=>{},signal,post=postOnce}){
  if(!Number.isSafeInteger(maximum_calls)||maximum_calls<1||maximum_calls>512)throw Error('index-tokenizer.invalid-call-limit');
  const receipts=[],cache=new Map();
  return {receipts,async measure(text){
    const raw=stable({model:MODEL,messages:[{role:'user',content:text}],tools:[]}),key=hash(raw);
    if(cache.has(key))return cache.get(key);
    if(receipts.length>=maximum_calls)throw Error('index-tokenizer.call-limit');
    const receipt={kind:'index-tokenizer',request_sha256:key,status:'started',dispatched:false};
    receipts.push(receipt);await record({...receipt});
    try{
      let response;
      await registry.consume({secret_ref:reference,consumer_id:'glm-flash-transport',request_digest:key,consumer:async material=>{
        receipt.dispatched=true;await record({...receipt});
        response=await post(new URL('https://api.z.ai/api/paas/v4/tokenizer'),raw,{apiKey:Buffer.from(material).toString('utf8'),timeout_ms:30000,maximum_response_bytes:65536,signal});
      }});
      receipt.status=response.status;receipt.tokens=response.payload?.usage?.prompt_tokens;
      if(receipt.status!==200||!Number.isSafeInteger(receipt.tokens)||receipt.tokens<0)throw Error('index-tokenizer.invalid-response');
      cache.set(key,receipt.tokens);return receipt.tokens;
    }catch(e){receipt.failure_code=e.code??'index-tokenizer-failed';throw Error(receipt.failure_code);}
    finally{await record({...receipt});}
  }};
}

export function liveClientFactory({credential_path,signal}){
  // Resolve credential reference/configuration only. Secret bytes remain with the provider.
  const {registry,reference}=credentials(credential_path);
  return {
    create_client:({cell,record_event=()=>{}})=>{
      const profile=cell.provider_profile;
      if(!profile||!Number.isSafeInteger(profile.index_tokenizer_maximum_calls))throw Error('live-client.profile-required');
      const client=createGlmClient({api_key_ref:reference,secret_registry:registry,maximum_requests:cell.limits.maximum_calls,
        maximum_output_tokens:cell.limits.output_cap,maximum_model_retries:0,
        request_budget:cell.limits.finalization_reserve_tokens>0?'contextbench-budget-v1':'holdout-window-v1',
        maximum_request_bytes:262144,token_margin:profile.token_margin,reasoning_effort:profile.reasoning_effort,
        model_timeout_ms:profile.model_timeout_ms,signal});
      const index=createIndexTokenizer({registry,reference,maximum_calls:profile.index_tokenizer_maximum_calls,
        record:receipt=>record_event({kind:'index-tokenizer',receipt}),signal});
      return {...client,index_receipts:index.receipts,measure_index:index.measure};
    },
    measure_index_tokens:(text,client)=>client.measure_index(text)
  };
}
