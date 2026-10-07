// Private campaign process: one bounded stdin request, one fixed provider call.
// Open Questions: evidence/G02-WSL-VPS-PROVIDER-BINDING-R1.md.
import {createHash} from 'node:crypto';
import {readFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
export const MODEL='glm-5.3-flash';
export const MAX_INPUT=32*1024*1024;
export const TRANSPORT='/opt/are/evolution-runtime/g01-source-combined-candidate-r8/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
export const TRANSPORT_SHA='5669b2c72d642e1ccf1d5bd796064c1e61d9dcad8828622f9b6f4450acdec56d';
const SECRET='/opt/are-keld-presentation/secrets/model_api_key';
export const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
export const hash=x=>createHash('sha256').update(typeof x==='string'||x instanceof Uint8Array?x:stable(x)).digest('hex');
const need=(v,code)=>{if(!v){const e=Error(code);e.code=code;throw e;}};
const uint=x=>Number.isSafeInteger(x)&&x>=0;
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
const keys=(x,allowed,required=[])=>object(x)&&Object.keys(x).every(k=>allowed.includes(k))&&required.every(k=>Object.hasOwn(x,k));

export function validateRequest(input){
  need(keys(input,['operation','request_id','messages','tools','output_cap'],['operation','request_id','messages','tools','output_cap']),'input-shape');
  need(['tokenize','generate'].includes(input.operation)&&typeof input.request_id==='string'&&/^[a-zA-Z0-9_.-]{1,100}$/.test(input.request_id),'operation-or-id');
  need(uint(input.output_cap)&&input.output_cap>=1&&input.output_cap<=8192,'output-cap');
  need(Array.isArray(input.messages)&&input.messages.length>=1&&input.messages.length<=1024,'messages');
  for(const m of input.messages){
    need(keys(m,['role','content','tool_calls','tool_call_id'],['role'])&&['system','user','assistant','tool'].includes(m.role),'message-shape');
    need(m.content===undefined||m.content===null||typeof m.content==='string','content-shape');
    need(m.tool_call_id===undefined||typeof m.tool_call_id==='string','tool-call-id');
    if(m.tool_calls!==undefined){
      need(m.role==='assistant'&&Array.isArray(m.tool_calls)&&m.tool_calls.length<=32,'tool-calls');
      for(const c of m.tool_calls)need(keys(c,['id','type','function'],['id','type','function'])&&
        typeof c.id==='string'&&c.type==='function'&&keys(c.function,['name','arguments'],['name','arguments'])&&
        typeof c.function.name==='string'&&typeof c.function.arguments==='string','tool-call-shape');
    }
  }
  need(Array.isArray(input.tools)&&input.tools.length<=64,'tools');
  for(const t of input.tools)need(keys(t,['type','function'],['type','function'])&&t.type==='function'&&
    keys(t.function,['name','description','parameters','strict'],['name','parameters'])&&
    typeof t.function.name==='string'&&object(t.function.parameters)&&
    (t.function.description===undefined||typeof t.function.description==='string')&&
    (t.function.strict===undefined||typeof t.function.strict==='boolean'),'tool-schema');
  need(Buffer.byteLength(stable(input))<=MAX_INPUT,'input-byte-cap');
  return input;
}

export function publicResponse(payload){
  const c=payload?.choices?.[0],m=c?.message;
  if(!object(m))return null;
  const result={role:m.role,content:typeof m.content==='string'?m.content:null};
  if(Array.isArray(m.tool_calls))result.tool_calls=m.tool_calls.map(c=>({id:c.id,type:c.type,
    function:{name:c.function?.name,arguments:c.function?.arguments}}));
  return {finish_reason:typeof c.finish_reason==='string'?c.finish_reason:null,message:result};
}

export async function executeRequest(input,{postOnce,apiKey}){
  validateRequest(input);need(typeof postOnce==='function'&&typeof apiKey==='string','dependencies');
  const common={model:MODEL,messages:input.messages,tools:input.tools};
  const body=stable(input.operation==='tokenize'?common:{...common,stream:false,max_tokens:input.output_cap,
    thinking:{type:'enabled',clear_thinking:false},reasoning_effort:'low'});
  need(Buffer.byteLength(body)<=MAX_INPUT,'request-byte-cap');
  const endpoint=input.operation==='tokenize'?'tokenizer':'chat/completions';
  const started=Date.now();let response=null,failure=null;
  try{response=await postOnce(new URL('https://api.z.ai/api/paas/v4/'+endpoint),body,
    {apiKey,timeout_ms:input.operation==='tokenize'?30000:300000,maximum_response_bytes:1024*1024});}
  catch(e){failure=['deadline-exceeded','request-failed','response-interrupted','response-too-large','content-type-invalid',
    'encoding-unsupported','response-json-invalid','cancelled'].includes(e?.code)?e.code:'request-failed';}
  const usage=response?.payload?.usage;
  const code=String(response?.payload?.error?.code??response?.payload?.code??'');
  const reply={schema_version:'are.private-vps-provider-reply/v1',request_id:input.request_id,operation:input.operation,
    request_sha256:hash(body),dispatched:true,status:response?.status??null,latency_ms:Date.now()-started,
    failure_code:failure,provider_code:/^\d{3,6}$/.test(code)?code:null,response_bytes:response?.bytes??0,
    prompt_tokens:uint(usage?.prompt_tokens)?usage.prompt_tokens:null,
    completion_tokens:uint(usage?.completion_tokens)?usage.completion_tokens:null,
    public_response:input.operation==='generate'&&response?.status===200?publicResponse(response.payload):null,
    automatic_retries:0,redirects_followed:0,authority_effect:'none'};
  // No error prose, headers, hidden reasoning, provider metadata or credential output.
  return JSON.parse(stable(reply).replaceAll(apiKey,'[REDACTED]'));
}

async function main(){
  need(hash(readFileSync(TRANSPORT))===TRANSPORT_SHA,'transport-drift');
  const mode=process.argv[2];
  if(mode==='check'&&process.argv.length===3){
    need(statSync(SECRET).isFile()&&statSync(SECRET).size>0,'credential-missing');
    console.log(stable({status:'checked-no-provider-call',transport_sha256:TRANSPORT_SHA,
      relay_sha256:hash(readFileSync(process.argv[1])),model:MODEL,node:process.version}));return;
  }
  need(mode==='once'&&process.argv.length===4&&hash(readFileSync(process.argv[1]))===process.argv[3],'relay-drift-or-mode');
  let size=0;const chunks=[];
  for await(const b of process.stdin){size+=b.length;need(size<=MAX_INPUT,'input-byte-cap');chunks.push(b);}
  const input=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));validateRequest(input);
  const key=readFileSync(SECRET,'utf8').trim();need(key.length>=8&&key.length<=8192,'credential-shape');
  const {postOnce,MODEL:transportModel}=await import(pathToFileURL(TRANSPORT));need(transportModel===MODEL,'model-drift');
  console.log(stable(await executeRequest(input,{postOnce,apiKey:key})));
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{await main();}catch{
    // Parsing/credential exceptions must not echo input or arbitrary exception text.
    console.log(stable({schema_version:'are.private-vps-provider-reply/v1',status:null,
      dispatched:false,failure_code:'relay-validation-or-setup-failed',authority_effect:'none'}));process.exitCode=2;
  }
}
