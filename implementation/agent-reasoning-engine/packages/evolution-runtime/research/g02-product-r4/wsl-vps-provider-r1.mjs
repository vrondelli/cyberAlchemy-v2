// Fixed private SSH invocation. No local credentials, shell input or retry.
// Open Questions: evidence/G02-WSL-VPS-PROVIDER-BINDING-R1.md.
import {spawn} from 'node:child_process';
import {validateRequest,stable,hash,MODEL} from './vps-json-provider-r1.mjs';
export const RELAY_SHA='0f5d4b71251075e6687947f1b1feea08b2cbbe04e6090235cbb010e1585745e2';
export const RELAY_PATH='/opt/are/evolution-runtime/g02-wsl-vps-provider-r1/relay.mjs';
const NODE='/opt/cyberalchemy-are-tools/node-24.10.0/node';
export function providerBody(input){
  validateRequest(input);const common={model:MODEL,messages:input.messages,tools:input.tools};
  return stable(input.operation==='tokenize'?common:{...common,stream:false,max_tokens:input.output_cap,
    thinking:{type:'enabled',clear_thinking:false},reasoning_effort:'low'});
}

export function validateReply(reply,input){
  if(reply?.schema_version!=='are.private-vps-provider-reply/v1'||reply.request_id!==input.request_id||
    reply.operation!==input.operation||reply.request_sha256!==hash(providerBody(input))||
    reply.dispatched!==true||reply.automatic_retries!==0||reply.redirects_followed!==0)
    throw Error('relay.reply-not-bound');
  return reply;
}

export async function callVpsProvider(input){
  validateRequest(input);const bytes=stable(input),started=Date.now();
  return new Promise(resolve=>{
    let finished=false,received=0;const chunks=[];
    const child=spawn('ssh',['-o','BatchMode=yes','-o','ConnectTimeout=10','-o','ServerAliveInterval=10',
      '-o','ServerAliveCountMax=2','root@187.77.163.194',NODE,RELAY_PATH,'once',RELAY_SHA],
      {stdio:['pipe','pipe','pipe']});
    const finish=(reply,uncertainty=null)=>{
      if(finished)return;finished=true;clearTimeout(timer);
      resolve(reply?{...reply,ssh_elapsed_ms:Date.now()-started}:{
        schema_version:'are.private-vps-provider-uncertain/v1',request_id:input.request_id,operation:input.operation,
        request_sha256:hash(providerBody(input)),dispatched:null,dispatch_uncertain:true,
        failure_code:uncertainty,ssh_elapsed_ms:Date.now()-started,automatic_retries:0,authority_effect:'none'});
    };
    const timer=setTimeout(()=>{child.kill('SIGTERM');finish(null,'ssh-observation-timeout');},
      input.operation==='tokenize'?50000:325000);
    child.on('error',()=>finish(null,'ssh-process-error'));
    child.stdin.on('error',()=>{});
    // Consume but never persist arbitrary SSH/remote exception text.
    child.stderr.on('data',()=>{});
    child.stdout.on('data',chunk=>{received+=chunk.length;if(received>2*1024*1024){
      child.kill('SIGTERM');finish(null,'ssh-reply-byte-cap');}else chunks.push(chunk);});
    child.on('close',code=>{
      if(finished)return;
      try{
        if(code!==0)throw Error('exit');
        const reply=validateReply(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks))),input);
        finish(reply);
      }catch{finish(null,'ssh-no-bound-reply');}
    });
    child.stdin.end(bytes);
  });
}
