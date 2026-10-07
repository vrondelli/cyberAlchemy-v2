// Evaluator-free diagnostic: log only HTTP/error metadata for source-only tokenizer planning.
import {loadCohort,planIngestion,sha} from './replication-cohort-adapter-v1.mjs';
import {createGatewayExchange} from './provider-gateway-unexposed-v1.mjs';
import {stable} from '../../../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs';

const [sourcePath,indexText]=process.argv.slice(2),index=Number(indexText);
if(!sourcePath||![57,58,59].includes(index))throw Error('diagnostic.arguments');
const row=loadCohort(sourcePath).rows[index],exchange=createGatewayExchange();
let calls=0;
const meter=async request=>{
  calls++;
  const raw=stable({model:request.model,messages:request.messages});
  const response=await exchange('tokenizer',raw,sha(raw));
  if(response.status!==200){
    const error=response.payload?.error??{};
    console.log(JSON.stringify({index,question_id:row.question_id,tokenizer_call:calls,
      http_status:response.status,error_code:error.code??null,error_type:error.type??null,
      error_message_sha256:typeof error.message==='string'?sha(error.message):null,
      request_bytes:Buffer.byteLength(raw)}));
    throw Error('diagnostic.non200-tokenizer');
  }
  return {input_tokens:response.payload.usage.prompt_tokens,wire_sha256:sha(request)};
};
try{
  const result=await planIngestion(row,meter,{proposal_characters:16000});
  console.log(JSON.stringify({index,question_id:row.question_id,status:'planned',tokenizer_calls:calls,
    admitted:result.admitted,chunk_count:result.chunk_count??null}));
}catch(error){
  console.log(JSON.stringify({index,question_id:row.question_id,status:'failed',tokenizer_calls:calls,
    reason:String(error?.message??error)}));
}
