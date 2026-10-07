// Separate transport functionality probe; the r1 campaign is immutable.
// Open Questions: evidence/G02-WSL-VPS-PROVIDER-BINDING-R1.md.
import {mkdtempSync,mkdirSync,existsSync,readFileSync,writeFileSync,rmdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createMultiplexedVpsProvider,validatePrivateControlSocket} from './wsl-vps-provider-multiplexed-r2.mjs';
import {hash} from './vps-json-provider-r1.mjs';
import {providerBody,RELAY_SHA} from './wsl-vps-provider-r1.mjs';
const root='/home/vlad_/are-benchmark-archive/g02-multiplexed-vps-provider-probe-r2-20261006';
const campaign='/home/vlad_/are-benchmark-archive/g02-native-workspace-matched-exposed-r1-20261006';
const here=dirname(fileURLToPath(import.meta.url));
if(existsSync(root))throw Error('multiplexed-probe.output-exists-no-replay');
if(!existsSync(join(campaign,'PRE-SCORE-CAMPAIGN-SEAL.json')))throw Error('multiplexed-probe.campaign-not-sealed');
const seal=JSON.parse(readFileSync(join(campaign,'PRE-SCORE-CAMPAIGN-SEAL.json')));
if(seal.results.length!==24)throw Error('multiplexed-probe.incomplete-campaign');
mkdirSync(root,{mode:0o700});
const save=(name,data)=>writeFileSync(join(root,name),JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
const temp=mkdtempSync('/tmp/are-g02-ssh-reuse-r2-'),socket=join(temp,'control.sock');
const host='root@187.77.163.194';
const common=['-o','BatchMode=yes','-o','ConnectTimeout=10','-o','ServerAliveInterval=10','-o','ServerAliveCountMax=2'];
const sourceNames=['probe-multiplexed-vps-provider-r2.mjs','wsl-vps-provider-multiplexed-r2.mjs',
 'wsl-vps-provider-r1.mjs','vps-json-provider-r1.mjs'];
const sources=Object.fromEntries(sourceNames.map(n=>[n,hash(readFileSync(join(here,n)))]));
const inputs=['tokenize','generate'].map(operation=>({operation,request_id:'multiplexed-probe-r2-'+operation,
 messages:[{role:'user',content:'Return exactly the JSON object {"ok":true} and nothing else.'}],tools:[],output_cap:512}));
save('FREEZE.json',{source_sha256:sources,relay_sha256:RELAY_SHA,
 campaign_seal_sha256:hash(readFileSync(join(campaign,'PRE-SCORE-CAMPAIGN-SEAL.json'))),
 inputs:inputs.map(input=>({input,request_sha256:hash(providerBody(input))})),
 maximum_generation_calls:1,maximum_tokenizer_calls:1,automatic_retries:0,
 control_socket:socket,credential_binding:'Fixed VPS relay only; never copied or printed.',
 benchmark_changed:false,claim_ceiling:'Provider/transport functionality only; no native quality or superiority.',
 authority_effect:'none',open_questions_owner:'G02-WSL-VPS-PROVIDER-BINDING-R1.md'});
const ssh=args=>execFileSync('ssh',[...common,...args],{stdio:['ignore','ignore','ignore'],timeout:30000});
let opened=false,error=null,close_error=null,cleanup='not-attempted',startup_ms=null;
const replies=[];
try{
 const started=performance.now();
 ssh(['-M','-N','-f','-o','ControlPersist=60','-S',socket,host]);opened=true;
 startup_ms=performance.now()-started;
 validatePrivateControlSocket(socket);
 ssh(['-S',socket,'-O','check',host]);
 const call=createMultiplexedVpsProvider({controlSocket:socket});
 for(const input of inputs){
  for(const [name,expected] of Object.entries(sources))
   if(hash(readFileSync(join(here,name)))!==expected)throw Error('multiplexed-probe.source-drift');
  save(input.operation+'-STARTED.json',{started_at:new Date().toISOString(),request_sha256:hash(providerBody(input))});
  const reply=await call(input);save(input.operation+'-REPLY.json',reply);replies.push(reply);
  if(reply.dispatch_uncertain||reply.status!==200||reply.failure_code!==null||
   !Number.isSafeInteger(reply.prompt_tokens)||reply.prompt_tokens<0||
   (input.operation==='generate'&&(!Number.isSafeInteger(reply.completion_tokens)||reply.completion_tokens<0)))
   throw Error('multiplexed-probe.provider-result-not-valid');
  if(input.operation==='generate'){
   const content=reply.public_response?.message?.content;
   let parsed;try{parsed=JSON.parse(content);}catch{throw Error('multiplexed-probe.public-json-invalid');}
   if(!parsed||parsed.ok!==true||Object.keys(parsed).join(',')!=='ok')throw Error('multiplexed-probe.public-answer-invalid');
  }
 }
}catch(e){error=String(e.message).startsWith('multiplexed-probe.')?e.message:'multiplexed-probe.setup-or-transport-failed';}
finally{
 if(opened||existsSync(socket))try{
  validatePrivateControlSocket(socket);ssh(['-S',socket,'-O','exit',host]);
 }catch{close_error='exact-owned-master-close-failed';}
 if(!close_error)try{rmdirSync(temp);cleanup='empty-owned-probe-directory-removed';}catch{cleanup='owned-probe-directory-retained';}
}
const generate=replies.filter(r=>r.operation==='generate'),known=generate.filter(r=>
 Number.isSafeInteger(r.prompt_tokens)&&Number.isSafeInteger(r.completion_tokens));
const result={status:error||close_error?'failed-no-replay':'terminal-provider-functionality-passed',
 error,close_error,cleanup,startup_ms,temporary_directory:temp,
 completed_generation_calls:generate.length,completed_tokenizer_calls:replies.filter(r=>r.operation==='tokenize').length,
 known_model_tokens:known.reduce((n,r)=>n+r.prompt_tokens+r.completion_tokens,0),
 unknown_generation_usage:generate.length-known.length,
 reply_sha256:Object.fromEntries(inputs.filter(i=>existsSync(join(root,i.operation+'-REPLY.json')))
  .map(i=>[i.operation,hash(readFileSync(join(root,i.operation+'-REPLY.json')))])),
 automatic_retries:0,benchmark_changed:false,authority_effect:'none',
 claim_ceiling:'Not a quality, cost superiority or matched model-latency result.',
 open_questions_owner:'G02-WSL-VPS-PROVIDER-BINDING-R1.md'};
save('RESULT.json',result);
console.log(JSON.stringify({root,...result}));
if(error||close_error)process.exitCode=1;
