// Exactly one tokenizer and, only if admitted, one generation functionality probe.
// Open Questions: evidence/G02-WSL-VPS-PROVIDER-BINDING-R1.md.
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {callVpsProvider,RELAY_SHA,RELAY_PATH,providerBody} from './wsl-vps-provider-r1.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const root='/home/vlad_/are-benchmark-archive/g02-wsl-vps-provider-probe-r1-20261006';
const sha=x=>createHash('sha256').update(x).digest('hex');
const save=(name,value)=>writeFileSync(join(root,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
if(existsSync(root))throw Error('probe.output-exists-no-replay');
const files=['vps-json-provider-r1.mjs','wsl-vps-provider-r1.mjs','probe-wsl-vps-provider-r1.mjs',
  'vps-json-provider-r1.test.mjs','wsl-vps-provider-r1.test.mjs'];
const captured=Object.fromEntries(files.map(f=>[f,readFileSync(join(here,f))]));
const tests=spawnSync(process.execPath,['--test',join(here,files[3]),join(here,files[4])],{encoding:'utf8',timeout:60000,maxBuffer:1024*1024});
if(tests.status!==0)throw Error('probe.local-tests-failed');
const check=spawnSync('ssh',['-o','BatchMode=yes','-o','ConnectTimeout=10','root@187.77.163.194',
  '/opt/cyberalchemy-are-tools/node-24.10.0/node',RELAY_PATH,'check'],{encoding:'utf8',timeout:30000,maxBuffer:1024*1024});
if(check.status!==0)throw Error('probe.remote-preflight-failed');
const remote=JSON.parse(check.stdout);if(remote.relay_sha256!==RELAY_SHA||remote.status!=='checked-no-provider-call')throw Error('probe.remote-drift');
const messages=[{role:'system',content:'Return only the exact JSON object requested by the user. No explanation.'},
  {role:'user',content:'Return exactly {"ok":true}.'}];
const tokenize={operation:'tokenize',request_id:'g02-provider-r1-tokenizer',messages,tools:[],output_cap:512};
const generate={...tokenize,operation:'generate',request_id:'g02-provider-r1-generation'};
mkdirSync(root,{mode:0o700});
const protocol=readFileSync(join(here,'../../evidence/G02-WSL-VPS-PROVIDER-BINDING-R1.md'));
writeFileSync(join(root,'PROTOCOL.md'),protocol,{flag:'wx',mode:0o600});
for(const f of files)writeFileSync(join(root,f),captured[f],{flag:'wx',mode:0o600});
writeFileSync(join(root,'TEST-STDOUT.txt'),tests.stdout,{flag:'wx',mode:0o600});
save('FREEZE.json',{schema_version:'are.g02-vps-provider-probe-freeze/v1',status:'frozen-before-provider',
  source_sha256:Object.fromEntries(files.map(f=>[f,sha(captured[f])])),protocol_sha256:sha(protocol),remote_check:remote,
  tokenizer:tokenize,generation:generate,maximum_generation_calls:1,maximum_tokenizer_calls:1,
  admission_limit:8192,maximum_output_tokens:512,automatic_retries:0,
  pass_rule:'Successful bound tokenizer admission and generation with complete usage and exact {ok:true} public JSON.',
  claim_ceiling:'Functionality only: no repository source, benchmark labels, native quality, or superiority.'});
for(const f of files)if(sha(readFileSync(join(here,f)))!==sha(captured[f]))throw Error('probe.source-drift');
save('STARTED-TOKENIZER.json',{request_sha256:sha(providerBody(tokenize)),started_at:new Date().toISOString()});
const t=await callVpsProvider(tokenize);save('TOKENIZER.json',t);
const admitted=t.status===200&&!t.failure_code&&Number.isSafeInteger(t.prompt_tokens)&&t.prompt_tokens+512<=8192;
let g=null,exact=false;
if(admitted){
  save('STARTED-GENERATION.json',{request_sha256:sha(providerBody(generate)),started_at:new Date().toISOString()});
  g=await callVpsProvider(generate);save('GENERATION.json',g);
  try{const obj=JSON.parse(g.public_response?.message?.content);exact=obj?.ok===true&&Object.keys(obj).join(',')==='ok';}catch{}
}
const passed=admitted&&g?.status===200&&!g.failure_code&&g.public_response?.finish_reason==='stop'&&exact&&
  Number.isSafeInteger(g.prompt_tokens)&&Number.isSafeInteger(g.completion_tokens);
save('RESULT.json',{status:passed?'functionality-passed':'functionality-failed',admitted,generation_attempted:admitted,
  tokenizer_calls:1,generation_calls:admitted?1:0,known_generation_tokens:g&&Number.isSafeInteger(g.prompt_tokens)&&Number.isSafeInteger(g.completion_tokens)
    ?g.prompt_tokens+g.completion_tokens:null,dispatch_uncertainty:t.dispatch_uncertain===true||g?.dispatch_uncertain===true,
  tokenizer_reply_sha256:sha(readFileSync(join(root,'TOKENIZER.json'))),generation_reply_sha256:g?sha(readFileSync(join(root,'GENERATION.json'))):null,
  claim_ceiling:'Transport functionality only; native source/execution parity and quality remain unproven.'});
console.log(JSON.stringify({root,status:passed?'functionality-passed':'functionality-failed',
  known_generation_tokens:g?.prompt_tokens+g?.completion_tokens,result_sha256:sha(readFileSync(join(root,'RESULT.json')))}));
