// No replay. Existing VPS relay; never reads local/provider secrets or hidden reasoning.
// Open Questions: evidence/G01-RUNTIME-LINKED-READER-R1.json.
import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync,mkdirSync,mkdtempSync,rmdirSync} from 'node:fs';
import {dirname,join} from 'node:path';import {fileURLToPath} from 'node:url';
import {createReceipt} from './atomic-campaign-receipt-r1.mjs';
import {tokenizerAdmission,publicSelection,fullPredictions} from './runtime-linked-reader-policy-r1.mjs';
import {providerBody} from '../g02-product-r4/wsl-vps-provider-r1.mjs';
import {createMultiplexedVpsProvider,validatePrivateControlSocket} from '../g02-product-r4/wsl-vps-provider-multiplexed-r2.mjs';
const here=dirname(fileURLToPath(import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(readFileSync(p)),digest=p=>sha(readFileSync(p));
const need=(v,m)=>{if(!v)throw Error('runtime-reader.'+m);};
const [mode,root]=process.argv.slice(2);
need(process.argv.length===4&&['tokenize','generate'].includes(mode)&&
 /^\/home\/vlad_\/are-benchmark-archive\/g01-runtime-linked-reader-r1b?-20261007$/.test(root),'exact-mode-root');
const seal=read(join(root,'PACKET-SEAL.json')),audit=read(join(root,'AUDIT.json'));
if(root.endsWith('reader-r1-20261007'))need(digest(join(root,'PACKET-SEAL.json'))==='260c34eee3f64db23243671ddd813acc7422518aa90e35c6e71f8ab40a6820bc'&&
 digest(join(root,'AUDIT.json'))==='a82ef095e544a7b6fe09818f2b391b9e353091110218a6c1e113b02047ad6cff','original-packet-audit-pins');
for(const[path,pin]of Object.entries(seal.input_pins??{}))need(digest(path)===pin,'source-input-drift');
for(const[name,pin]of Object.entries(seal.source_sha256??{}))need(digest(join(here,name))===pin,'packet-builder-drift');
need(digest(join(root,'PACKETS.jsonl'))===seal.packets_sha256&&digest(join(root,'PROTOCOL.json'))===seal.protocol_sha256,'packet-protocol');
need(audit.status==='all16-source-observation-audit-passed'&&audit.packet_seal_sha256===digest(join(root,'PACKET-SEAL.json')),'source-audit');
const packets=readFileSync(join(root,'PACKETS.jsonl'),'utf8').trimEnd().split('\n').map(JSON.parse);
need(packets.length===32&&packets.every((p,i)=>p.ordinal===i+1&&sha(p.prompt)===p.prompt_sha256),'full32-packets');
const sourcePaths=[fileURLToPath(import.meta.url),...['runtime-linked-reader-policy-r1.mjs','runtime-linked-reader-policy-r1.test.mjs',
 'candidate-id-decoder-r1.mjs','atomic-campaign-receipt-r1.mjs','score-runtime-linked-reader-r1.py','test_score_runtime_linked_reader_r1.py'].map(n=>join(here,n)),
 ...['wsl-vps-provider-r1.mjs','vps-json-provider-r1.mjs','wsl-vps-provider-multiplexed-r2.mjs'].map(n=>join(here,'../g02-product-r4',n)),
 join(here,'../../evidence/G01-RUNTIME-LINKED-READER-R1-PROVIDER.json')];
const sourcePins=Object.fromEntries(sourcePaths.map(p=>[p,digest(p)]));
const fixedProviderPins={'wsl-vps-provider-r1.mjs':'3699584b3c4dec8371c1876f8015968bca0276458eecc12818f24fb2c6f7951f',
 'vps-json-provider-r1.mjs':'0f5d4b71251075e6687947f1b1feea08b2cbbe04e6090235cbb010e1585745e2',
 'wsl-vps-provider-multiplexed-r2.mjs':'2851989ab6e6a32496480be0516944842ba7a19abaedd3aed78b418376515fb4'};
for(const[n,pin]of Object.entries(fixedProviderPins))need(digest(join(here,'../g02-product-r4',n))===pin,'provider-drift');
let tokenResult=null;
if(mode==='generate'){
 tokenResult=read(join(root,'tokenize-run/RESULT.json'));const tokenFreeze=read(join(root,'tokenize-run/FREEZE.json'));
 need(tokenResult.admitted===true&&tokenResult.completed===32&&tokenResult.valid===32&&tokenResult.packets_sha256===seal.packets_sha256,'all32-tokenizer-admission');
 need(tokenResult.freeze_sha256===digest(join(root,'tokenize-run/FREEZE.json'))&&tokenFreeze.packet_seal_sha256===digest(join(root,'PACKET-SEAL.json')),'tokenizer-freeze');
 for(const[p,pin]of Object.entries(tokenFreeze.source_sha256))need(digest(p)===pin,'source-drift-since-tokenizer');
 for(const r of tokenResult.rows){
  const reply=read(join(root,'tokenize-run',`REPLY-${String(r.ordinal).padStart(2,'0')}.json`));
  need(digest(join(root,'tokenize-run',`REPLY-${String(r.ordinal).padStart(2,'0')}.json`))===r.reply_sha256&&tokenizerAdmission(reply),'tokenizer-reply');
 }
}
const run=join(root,mode+'-run');need(!existsSync(run),'existing-run-no-replay');mkdirSync(run,{mode:0o700});
const save=(n,x)=>createReceipt(join(run,n),x);
const campaign=root.split('/').at(-1);
const inputs=packets.map(p=>({operation:mode,request_id:`${campaign}-${mode}-${p.ordinal}`,
 messages:[{role:'user',content:p.prompt}],tools:[],output_cap:512}));
const freeze={status:'frozen-before-provider',model:'glm-5.3-flash',reasoning_effort:'low',output_cap:512,window:8192,
 packet_seal_sha256:digest(join(root,'PACKET-SEAL.json')),audit_sha256:digest(join(root,'AUDIT.json')),
 packets_sha256:seal.packets_sha256,protocol_sha256:seal.protocol_sha256,source_sha256:sourcePins,
 ordered_requests:inputs.map((input,i)=>({ordinal:i+1,request_sha256:sha(providerBody(input))})),
 maximum_calls:32,automatic_retries:0,gold_opened:false,hidden_reasoning_processed:false,
 claim_ceiling:'Exposed equal-observation development, not independent confirmation or superiority',
 authority_effect:'none',open_questions_owner:'G01-RUNTIME-LINKED-READER-R1.json'};
save('FREEZE.json',freeze);save('STARTED.json',{started_at:new Date().toISOString(),pid:process.pid,freeze_sha256:digest(join(run,'FREEZE.json'))});
let owned=null,socket=null,post=null,error=null,cleanupError=null;const rows=[];
const ssh=args=>execFileSync('ssh',['-o','BatchMode=yes','-o','ConnectTimeout=10',...args],{stdio:['ignore','ignore','ignore'],timeout:30000});
try{
 owned=mkdtempSync('/tmp/are-g02-ssh-reuse-r2-');socket=join(owned,'control.sock');
 save('TRANSPORT-STARTED.json',{owned_directory:owned,control_socket:socket});
 ssh(['-M','-N','-f','-o','ControlPersist=60','-S',socket,'root@187.77.163.194']);
 validatePrivateControlSocket(socket);post=createMultiplexedVpsProvider({controlSocket:socket});
 for(const[p,input]of packets.map((p,i)=>[p,inputs[i]])){
  for(const[path,pin]of Object.entries(sourcePins))need(digest(path)===pin,'source-drift-before-call');
  need(digest(join(root,'PACKETS.jsonl'))===seal.packets_sha256&&digest(join(root,'PROTOCOL.json'))===seal.protocol_sha256,'packet-drift-before-call');
  const suffix=String(p.ordinal).padStart(2,'0');
  save('REQUEST-'+suffix+'.json',{input,request_sha256:sha(providerBody(input)),prompt_sha256:p.prompt_sha256});
  const reply=await post(input);save('REPLY-'+suffix+'.json',reply);
  const ids=mode==='generate'?publicSelection(reply,p.candidates.length):null;
  const row={ordinal:p.ordinal,case_id:p.case_id,arm:p.arm,prompt_sha256:p.prompt_sha256,
   valid:mode==='tokenize'?tokenizerAdmission(reply):ids!==null,selected_ids:ids,
   prompt_tokens:reply.prompt_tokens??null,completion_tokens:reply.completion_tokens??null,
   latency_ms:reply.latency_ms??null,ssh_elapsed_ms:reply.ssh_elapsed_ms??null,
   reply_sha256:digest(join(run,'REPLY-'+suffix+'.json'))};
  rows.push(row);save('ROW-'+suffix+'.json',row);
  console.log(JSON.stringify({mode,completed:rows.length,case_id:p.case_id,arm:p.arm,valid:row.valid,prompt_tokens:row.prompt_tokens}));
  if(reply.status!==200||reply.failure_code||reply.dispatch_uncertain||reply.dispatched!==true){error='provider-unconfirmed-stop-no-replay';break;}
 }
}catch{error='runner-or-transport-failed-no-replay';}finally{
 if(socket&&existsSync(socket))try{validatePrivateControlSocket(socket);ssh(['-S',socket,'-O','exit','root@187.77.163.194']);}catch{cleanupError='owned-socket-close-failed';}
 let cleanup='owned-directory-retained';if(owned&&!cleanupError)try{rmdirSync(owned);cleanup='empty-owned-directory-removed';}catch{}
 save('TRANSPORT-TERMINAL.json',{error:cleanupError,cleanup,owned_directory:owned});
}
const result={status:mode==='tokenize'?'terminal-tokenizer-admission':'terminal-matched-generation',mode,
 completed:rows.length,valid:rows.filter(r=>r.valid).length,expected:32,
 admitted:mode==='tokenize'&&!error&&!cleanupError&&rows.length===32&&rows.every(r=>r.valid),
 error,transport_error:cleanupError,rows,packets_sha256:seal.packets_sha256,freeze_sha256:digest(join(run,'FREEZE.json')),
 known_prompt_tokens:rows.reduce((s,r)=>s+(Number.isSafeInteger(r.prompt_tokens)?r.prompt_tokens:0),0),
 known_completion_tokens:rows.reduce((s,r)=>s+(Number.isSafeInteger(r.completion_tokens)?r.completion_tokens:0),0),
 unknown_usage_rows:rows.filter(r=>!Number.isSafeInteger(r.prompt_tokens)||(mode==='generate'&&!Number.isSafeInteger(r.completion_tokens))).length,
 latency_ms:rows.reduce((s,r)=>s+(r.latency_ms??0),0),ssh_elapsed_ms:rows.reduce((s,r)=>s+(r.ssh_elapsed_ms??0),0),
 provider_calls:rows.length,authority_effect:'none',open_questions_owner:'G01-RUNTIME-LINKED-READER-R1.json'};
if(mode==='generate')result.predictions=fullPredictions(packets,rows);
save('RESULT.json',result);
if(mode==='generate')save('PREDICTION-SEAL.json',{status:'all32-predictions-sealed-before-labels',gold_opened:false,
 result_sha256:digest(join(run,'RESULT.json')),packets_sha256:seal.packets_sha256,
 predictions_sha256:sha(JSON.stringify(result.predictions)),responses:rows.map(r=>({ordinal:r.ordinal,sha256:r.reply_sha256})),
 full_case_denominator:16,full_prediction_denominator:32,authority_effect:'none'});
console.log(JSON.stringify({mode,completed:result.completed,valid:result.valid,admitted:result.admitted,error,result_sha256:digest(join(run,'RESULT.json'))}));
if(error||cleanupError||result.valid!==32)process.exitCode=2;
