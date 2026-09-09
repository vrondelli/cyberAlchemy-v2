// Fixed tokenizer-only controller; no retries. Open questions: README.md.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {credentials} from '../calibrate.mjs';
import {postOnce,stable} from '../../../../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const root=new URL('./',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(readFileSync(new URL(p,root))),binding=read('binding.json'),manifest=read('prepared.json');
for(const s of [...binding.sources,...manifest.sources])if(sha(readFileSync(new URL(s.path,root)))!==s.sha256)throw Error('source drift');
if(manifest.rows.length!==12||manifest.maximum_tokenizer_attempts!==12||manifest.model_attempts!==0)throw Error('attempt cap invalid');
for(const row of manifest.rows)if(sha(row.raw)!==row.sha256||stable(JSON.parse(row.raw))!==row.raw||Buffer.byteLength(row.raw)>126976)throw Error('request integrity');
const credential=credentials(process.argv[2]),out=new URL('live/',root);mkdirSync(out);
const save=(p,v)=>writeFileSync(new URL(p,out),JSON.stringify(v,null,2)+'\n',{flag:'wx'}),receipts=[];
try {
 for(const [index,row] of manifest.rows.entries()) {
  const r={index,id:row.id,request_sha256:row.sha256,dispatched:false,status:null,input_tokens:null,automatic_retries:0,model_attempts:0};
  writeFileSync(new URL(`request-${index}.json`,out),row.raw,{flag:'wx'});save(`started-${index}.json`,r);receipts.push(r);const start=Date.now();
  try {
   let response;await credential.registry.consume({secret_ref:credential.reference,consumer_id:'glm-flash-transport',request_digest:row.sha256,consumer:async material=>{
    if(r.dispatched)throw Error('duplicate dispatch');r.dispatched=true;save(`dispatch-${index}.json`,{index,request_sha256:row.sha256});
    response=await postOnce(new URL('https://api.z.ai/api/paas/v4/tokenizer'),row.raw,{apiKey:Buffer.from(material).toString('utf8'),timeout_ms:30000,maximum_response_bytes:65536});
   }});
   r.status=response.status;r.input_tokens=response.payload?.usage?.prompt_tokens??null;
   save(`response-${index}.json`,{status:response.status,payload:response.payload});
   if(r.status!==200||!Number.isSafeInteger(r.input_tokens)||r.input_tokens<0)throw Error('invalid tokenizer result');
  } catch(e) {r.failure_code=typeof e.code==='string'?e.code:'tokenizer-failed';throw e;}
  finally {r.elapsed_ms=Date.now()-start;save(`receipt-${index}.json`,r);}
  console.log(JSON.stringify({id:r.id,input_tokens:r.input_tokens}));
 }
 save('result.json',{receipts,tokenizer_attempts:receipts.length,model_attempts:0,authority_effect:'none',open_questions_ref:'../README.md'});
} catch(e) {save('stop.json',{reason:typeof e.code==='string'?e.code:'tokenizer-study-failed',tokenizer_attempts:receipts.length,model_attempts:0});throw e;}
