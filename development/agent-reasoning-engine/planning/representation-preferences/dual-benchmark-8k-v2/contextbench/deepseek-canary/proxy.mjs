// Bounded compatibility recorder, not a production benchmark accounting adapter.
import {createServer} from 'node:http';
import {readFileSync,openSync,writeSync,fsyncSync,closeSync} from 'node:fs';
import {createHash} from 'node:crypto';
const live=process.env.CANARY_MODE==='live',root='/evidence';
const key=live?readFileSync('/run/secrets/model_api_key','utf8').trim():null;
let calls=0,known=0,poisoned=false,busy=false;
function save(name,value){const fd=openSync(`${root}/${name}.json`,'wx',0o600);try{writeSync(fd,JSON.stringify(value,null,2)+'\n');fsyncSync(fd);}finally{closeSync(fd);}}
function reply(res,status,value){res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(value));}
async function post(path,body){const response=await fetch('https://api.z.ai/api/paas/v4/'+path,{method:'POST',headers:{authorization:'Bearer '+key,'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(120000)});const bytes=await response.text();if(Buffer.byteLength(bytes)>2097152)throw Error('response-size');return {status:response.status,bytes};}
createServer(async(req,res)=>{
 if(req.url==='/healthz')return reply(res,200,{ready:true,mode:live?'live':'mock',calls,known,poisoned});
 if(req.method!=='POST'||req.url!=='/v1/chat/completions')return reply(res,404,{error:'route'});
 if(busy||poisoned||calls>=4||known+8000>32000)return reply(res,429,{error:'canary-limit-or-unresolved'});
 busy=true;const id=String(calls++).padStart(2,'0');let attempted=false;
 try{
  const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>262144)throw Error('request-size');chunks.push(c);}
  const body=JSON.parse(Buffer.concat(chunks));
  save(id+'-request',{body,sha256:createHash('sha256').update(JSON.stringify(body)).digest('hex')});
  const cap=body.max_tokens??body.max_completion_tokens;
  if(body.model!=='glm-5.3-flash'||!Number.isSafeInteger(cap)||cap<1||cap>1024)throw Error('model-or-output-cap');
  if(!live){
   const tools=body.tools??[],read=tools.find(t=>/read/i.test(t.function?.name??''));
   save(id+'-mock-observation',{tool_names:tools.map(t=>t.function?.name),read_schema:read??null,request_bytes:size});
   const content='CANARY_MOCK_OK';
   const data={id:'mock-'+id,object:'chat.completion.chunk',model:body.model,choices:[{index:0,delta:{role:'assistant',content},finish_reason:'stop'}],usage:{prompt_tokens:100,completion_tokens:10,total_tokens:110}};
   res.writeHead(200,{'content-type':'text/event-stream'});res.end('data: '+JSON.stringify(data)+'\n\ndata: [DONE]\n\n');return;
  }
  save(id+'-tokenizer-intent',{model:body.model});
  const measured=await post('tokenizer',{model:body.model,messages:body.messages,tools:body.tools});save(id+'-tokenizer-response',measured);
  const input=JSON.parse(measured.bytes)?.usage?.prompt_tokens;
  if(measured.status!==200||!Number.isSafeInteger(input)||input<0)throw Error('tokenizer-invalid');
  if(input+512+cap>8000){save(id+'-admission',{admitted:false,input,margin:512,cap,limit:8000});return reply(res,400,{error:{message:'canary-8k-admission-denied',type:'invalid_request_error'}});}
  save(id+'-model-intent',{input,margin:512,cap,reservation:input+512+cap});attempted=true;
  const response=await post('chat/completions',body);save(id+'-model-response',response);
  let usage=null;
  if(body.stream){for(const line of response.bytes.split('\n'))if(line.startsWith('data: ')){try{const d=JSON.parse(line.slice(6));if(d.usage)usage=d.usage;}catch{}}}
  else usage=JSON.parse(response.bytes).usage;
  const valid=response.status===200&&Number.isSafeInteger(usage?.prompt_tokens)&&usage.prompt_tokens>=0&&Number.isSafeInteger(usage?.completion_tokens)&&usage.completion_tokens>=0;
  if(valid)known+=usage.prompt_tokens+usage.completion_tokens;
  poisoned=!valid||usage.prompt_tokens>input+512||usage.completion_tokens>cap;
  save(id+'-receipt',{status:response.status,usage,known,unknown:!valid,poisoned});
  res.writeHead(response.status,{'content-type':body.stream?'text/event-stream':'application/json'});res.end(response.bytes);
 }catch(error){poisoned=true;try{save(id+'-failure',{message:String(error.message),attempted,unknown_usage:attempted});}catch{}reply(res,502,{error:{message:'canary-failure',type:'canary_error'}});}
 finally{busy=false;}
}).listen(8080,'0.0.0.0');
