// G02-specific remote bridge sized for the admitted 32 MiB request envelope.
import {spawn} from 'node:child_process';
import {createRemoteMountedCredentialBinding} from '../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/research/hen-10-live-contextbench-v1/remote-mounted-glm-v1.mjs';
export {createRemoteMountedCredentialBinding};

// Base64 makes the SSH envelope deterministic: a 32 MiB body is below 43 MiB.
export const G02_REMOTE_STDIN_CAP=45*1024**2;
const PROGRAM=String.raw`
const {readFile}=await import('node:fs/promises');
let input=''; for await (const chunk of process.stdin) { input+=chunk; if(Buffer.byteLength(input)>${G02_REMOTE_STDIN_CAP}) process.exit(41); }
const request=JSON.parse(input); const body=Buffer.from(request.body_base64,'base64'); if(body.length>32*1024**2) process.exit(44);
const secret=(await readFile('/run/secrets/model_api_key','utf8')).trim();
const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),request.timeout_ms);
try { const response=await fetch(request.url,{method:'POST',headers:{'content-type':'application/json',accept:'application/json',authorization:'Bearer '+secret},body,signal:controller.signal,redirect:'error'});
 const bytes=Buffer.from(await response.arrayBuffer()); if(bytes.length>request.maximum_response_bytes) process.exit(42);
 const payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)); process.stdout.write(JSON.stringify({status:response.status,payload,bytes:bytes.length}));
} catch(error) { process.stderr.write(error?.name==='AbortError'?'deadline-exceeded':'request-failed'); process.exit(43); } finally { clearTimeout(timer); }
`;
const encoded=Buffer.from(PROGRAM).toString('base64');
const command=`docker exec --user 65532:65532 -i are-keld-presentation-provider-gateway-1 /nodejs/bin/node --input-type=module -e "await eval('(async()=>{'+Buffer.from('${encoded}','base64').toString('utf8')+'})()')"`;
const failure=code=>Object.assign(Error('g02-remote-mounted-glm.'+code),{code});

export function createG02RemoteMountedPost({spawn_process=spawn}={}){
  if(typeof spawn_process!=='function')throw failure('binding-invalid');
  return async function post(url,body,{apiKey,timeout_ms,maximum_response_bytes,signal}){
    if(apiKey!=='remote-owned-marker'||Buffer.byteLength(body)>32*1024**2)throw failure('request-boundary');
    const child=spawn_process('ssh',['-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=10','root@187.77.163.194',command],{stdio:['pipe','pipe','pipe']});
    let stdout=Buffer.alloc(0),stderr=Buffer.alloc(0),settled=false,closed=false,deadline,escalation;
    const completion=new Promise((resolve,reject)=>{const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(deadline);signal?.removeEventListener('abort',abort);error?reject(error):resolve(value);};
      const terminate=code=>{child.kill('SIGTERM');escalation=setTimeout(()=>{if(!closed)child.kill('SIGKILL');},2000);escalation.unref?.();finish(failure(code));};const abort=()=>terminate('cancelled');signal?.addEventListener('abort',abort,{once:true});
      deadline=setTimeout(()=>terminate('deadline-exceeded'),timeout_ms+15000);child.on('error',()=>finish(failure('request-failed')));child.stdin.on('error',()=>finish(failure('request-failed')));
      child.stdout.on('data',chunk=>{stdout=Buffer.concat([stdout,chunk]);if(stdout.length>maximum_response_bytes+65536)child.kill('SIGTERM');});child.stderr.on('data',chunk=>{if(stderr.length<4096)stderr=Buffer.concat([stderr,chunk]).subarray(0,4096);});
      child.on('close',code=>{closed=true;clearTimeout(escalation);if(settled)return;if(code!==0)return finish(failure(stderr.toString().includes('deadline-exceeded')?'deadline-exceeded':'request-failed'));try{const value=JSON.parse(stdout);if(!Number.isInteger(value.status)||value.bytes>maximum_response_bytes||value.payload===undefined)throw Error();finish(null,value);}catch{finish(failure('response-json-invalid'));}});if(signal?.aborted)abort();});
    child.stdin.end(JSON.stringify({url:url.href,body_base64:Buffer.from(body).toString('base64'),timeout_ms,maximum_response_bytes}));return completion;
  };
}

export function createG02VpsLocalPost({spawn_process=spawn}={}){
  if(typeof spawn_process!=='function')throw failure('binding-invalid');
  return async function post(url,body,{apiKey,timeout_ms,maximum_response_bytes,signal}){
    if(apiKey!=='remote-owned-marker'||Buffer.byteLength(body)>32*1024**2)throw failure('request-boundary');
    const child=spawn_process('docker',['exec','--user','65532:65532','-i','are-keld-presentation-provider-gateway-1','/nodejs/bin/node','--input-type=module','-e',`await eval('(async()=>{'+Buffer.from('${encoded}','base64').toString('utf8')+'})()')`],{stdio:['pipe','pipe','pipe']});
    let stdout=Buffer.alloc(0),stderr=Buffer.alloc(0),settled=false,closed=false,deadline,escalation;
    const completion=new Promise((resolve,reject)=>{const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(deadline);signal?.removeEventListener('abort',abort);error?reject(error):resolve(value);};
      const terminate=code=>{child.kill('SIGTERM');escalation=setTimeout(()=>{if(!closed)child.kill('SIGKILL');},2000);escalation.unref?.();finish(failure(code));};const abort=()=>terminate('cancelled');signal?.addEventListener('abort',abort,{once:true});
      deadline=setTimeout(()=>terminate('deadline-exceeded'),timeout_ms+15000);child.on('error',()=>finish(failure('request-failed')));child.stdin.on('error',()=>finish(failure('request-failed')));
      child.stdout.on('data',chunk=>{stdout=Buffer.concat([stdout,chunk]);if(stdout.length>maximum_response_bytes+65536)child.kill('SIGTERM');});child.stderr.on('data',chunk=>{if(stderr.length<4096)stderr=Buffer.concat([stderr,chunk]).subarray(0,4096);});
      child.on('close',code=>{closed=true;clearTimeout(escalation);if(settled)return;if(code!==0)return finish(failure(stderr.toString().includes('deadline-exceeded')?'deadline-exceeded':'request-failed'));try{const value=JSON.parse(stdout);if(!Number.isInteger(value.status)||value.bytes>maximum_response_bytes||value.payload===undefined)throw Error();finish(null,value);}catch{finish(failure('response-json-invalid'));}});if(signal?.aborted)abort();});
    child.stdin.end(JSON.stringify({url:url.href,body_base64:Buffer.from(body).toString('base64'),timeout_ms,maximum_response_bytes}));return completion;
  };
}

export const G02_REMOTE_MOUNTED_BINDING=Object.freeze({host:'187.77.163.194',container:'are-keld-presentation-provider-gateway-1',user:'65532:65532',secret_path:'/run/secrets/model_api_key',secret_crosses_host_boundary:false,maximum_request_bytes:32*1024**2,maximum_stdin_bytes:G02_REMOTE_STDIN_CAP,authority_effect:'none'});
