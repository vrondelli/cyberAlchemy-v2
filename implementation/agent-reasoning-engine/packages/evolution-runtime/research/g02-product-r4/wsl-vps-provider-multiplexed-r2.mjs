// Separate research candidate, NOT used by the frozen r1 campaign.
// Open Questions: evidence/G02-WSL-VPS-PROVIDER-BINDING-R1.md.
import {spawn} from 'node:child_process';
import {lstatSync,realpathSync} from 'node:fs';
import {dirname} from 'node:path';
import {validateRequest,stable,hash} from './vps-json-provider-r1.mjs';
import {providerBody,validateReply,RELAY_SHA,RELAY_PATH} from './wsl-vps-provider-r1.mjs';
const NODE='/opt/cyberalchemy-are-tools/node-24.10.0/node';
export function validatePrivateControlSocket(socket){
 if(typeof socket!=='string'||!/^\/tmp\/are-g02-ssh-reuse-r2-[A-Za-z0-9]{6}\/control\.sock$/.test(socket))
  throw Error('multiplexed.socket-scope');
 const dir=dirname(socket),d=lstatSync(dir),s=lstatSync(socket),uid=process.getuid();
 if(!d.isDirectory()||realpathSync(dir)!==dir||d.uid!==uid||(d.mode&0o777)!==0o700||
  !s.isSocket()||s.uid!==uid||(s.mode&0o777)!==0o600)throw Error('multiplexed.socket-not-private');
 return socket;
}
// Injection is for local unit tests only, never accepted in provider input JSON.
export function createMultiplexedVpsProvider({controlSocket,spawnProcess=spawn}){
 validatePrivateControlSocket(controlSocket);
 if(typeof spawnProcess!=='function')throw Error('multiplexed.invalid-local-spawner');
 return async input=>{
  validateRequest(input);validatePrivateControlSocket(controlSocket);
  const bytes=stable(input),started=Date.now();
  return new Promise(resolve=>{
   let finished=false,received=0;const chunks=[];
   const child=spawnProcess('ssh',['-o','BatchMode=yes','-o','ConnectTimeout=10',
    '-o','ServerAliveInterval=10','-o','ServerAliveCountMax=2','-o','ControlMaster=no',
    '-o','ProxyCommand=/bin/false','-S',controlSocket,'root@187.77.163.194',NODE,RELAY_PATH,'once',RELAY_SHA],
    {stdio:['pipe','pipe','pipe']});
   const finish=(reply,uncertainty=null)=>{
    if(finished)return;finished=true;clearTimeout(timer);
    resolve(reply?{...reply,ssh_elapsed_ms:Date.now()-started,connection_reuse:true}:{
     schema_version:'are.private-vps-provider-uncertain/v1',request_id:input.request_id,operation:input.operation,
     request_sha256:hash(providerBody(input)),dispatched:null,dispatch_uncertain:true,
     failure_code:uncertainty,ssh_elapsed_ms:Date.now()-started,automatic_retries:0,authority_effect:'none'});
   };
   const timer=setTimeout(()=>{child.kill('SIGTERM');finish(null,'ssh-observation-timeout');},
    input.operation==='tokenize'?50000:325000);
   child.on('error',()=>finish(null,'ssh-process-error'));
   child.stdin.on('error',()=>{});child.stderr.on('data',()=>{});
   child.stdout.on('data',chunk=>{received+=chunk.length;if(received>2*1024*1024){
    child.kill('SIGTERM');finish(null,'ssh-reply-byte-cap');}else chunks.push(chunk);});
   child.on('close',code=>{
    if(finished)return;
    try{
     if(code!==0)throw Error('exit');
     finish(validateReply(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks))),input));
    }catch{finish(null,'ssh-no-bound-reply');}
   });
   child.stdin.end(bytes);
  });
 };
}
