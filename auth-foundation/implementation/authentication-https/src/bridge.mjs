import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
export const binary=process.env.AUTH_PROTO_BRIDGE || resolve('.runtime/auth-prototype-bridge');
export function authorize(payload,kind,policy=resolve('.runtime/policy.json')) {
 return new Promise(resolveDecision=>{
  const child=spawn(binary,[policy],{stdio:['pipe','pipe','pipe']});
  let out='',done=false;
  const finish=value=>{if(!done){done=true;clearTimeout(timer);resolveDecision(value);}};
  const timer=setTimeout(()=>{child.kill('SIGKILL');finish(false)},2000);
  child.on('error',()=>finish(false));child.stdin.on('error',()=>finish(false));
  child.stdout.on('data',chunk=>{out+=chunk;if(out.length>1024){child.kill('SIGKILL');finish(false)}});
  child.on('close',code=>{try{finish(code===0&&JSON.parse(out).decision==='ALLOW')}catch{finish(false)}});
  child.stdin.end(JSON.stringify({issuer:payload.iss,subject:payload.sub,client:payload.azp,expires_at:payload.exp,kind}));
 });
}
