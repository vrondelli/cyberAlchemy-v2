// Question-blind insertion probe, never a QA campaign or native V2 replication.
// Open Questions: evidence/G03-SOURCE-LINE-INSERT-PILOT-R84.json.
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmdirSync,existsSync,statfsSync} from 'node:fs';
import {join,dirname} from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {INSERT_SYSTEM,decodeAndBindLineNote,renderInsertionPacket} from './source-line-insert-note-r84.mjs';
import {providerBody} from '../g02-product-r4/wsl-vps-provider-r1.mjs';
import {createMultiplexedVpsProvider,validatePrivateControlSocket} from '../g02-product-r4/wsl-vps-provider-multiplexed-r2.mjs';
const here=dirname(fileURLToPath(import.meta.url)),archive='/home/vlad_/are-benchmark-archive',base=join(archive,'g03-source-line-insert-pilot-r84-20261006'),root=join(base,'provider-run');
const sha=x=>createHash('sha256').update(x).digest('hex'),bytes=p=>readFileSync(p),read=p=>JSON.parse(bytes(p)),need=(v,r)=>{if(!v)throw Error('semantic-insert.'+r);};
need(process.argv.length===2&&!existsSync(root),'no-arguments-no-replay');
const constructionBytes=bytes(join(base,'CONSTRUCTION-SEAL.json')),construction=JSON.parse(constructionBytes);
need(sha(constructionBytes)==='e7e6059051ebc88ceda88a4eafa78f21b20d41b408abf62e3dd84db9ae4a47aa','construction-pin');
const packetBytes=bytes(join(base,'PACKETS.json')),wire=JSON.parse(packetBytes);
need(sha(packetBytes)===construction.packets_sha256&&wire.packets.length===8&&wire.questions_answers_or_evaluators_read===false&&wire.confirmation_fields_read===false&&wire.hidden_reasoning_read===false,'source-wire');
need(sha(bytes(join(here,'prepare-source-line-insert-pilot-r84.py')))===construction.builder_sha256,'builder-drift');
for(const[p,pin]of Object.entries(construction.source_pins))need(sha(bytes(p))===pin,'source-drift');
const multiplexProbe=join(archive,'g02-multiplexed-vps-provider-probe-r2-20261006');
need(sha(bytes(join(multiplexProbe,'RESULT.json')))==='e94c0d9333e9d06fe06c3b33f764d752417d1bcbb34a9f4d79ff84dac756957b','transport-probe');
const providerDir=join(here,'../g02-product-r4'),providerFreeze=read(join(archive,'g02-wsl-vps-provider-probe-r1-20261006/FREEZE.json'));
need(sha(bytes(join(archive,'g02-wsl-vps-provider-probe-r1-20261006/RESULT.json')))==='a551d691d7fd3517132bd5ac06de542beb65df4f5071a60bf8dfc6a10da7b797','provider-probe');
for(const n of ['wsl-vps-provider-r1.mjs','vps-json-provider-r1.mjs'])need(sha(bytes(join(providerDir,n)))===providerFreeze.source_sha256[n],'provider-source');
need(sha(bytes(join(providerDir,'wsl-vps-provider-multiplexed-r2.mjs')))===read(join(multiplexProbe,'FREEZE.json')).source_sha256['wsl-vps-provider-multiplexed-r2.mjs'],'multiplex-source');
const protocolBytes=bytes(join(here,'../../evidence/G03-SOURCE-LINE-INSERT-PILOT-R84.json'));
const sourcePaths=[fileURLToPath(import.meta.url),join(here,'source-line-insert-note-r84.mjs'),join(here,'prepare-source-line-insert-pilot-r84.py'),...['wsl-vps-provider-r1.mjs','wsl-vps-provider-multiplexed-r2.mjs','vps-json-provider-r1.mjs'].map(n=>join(providerDir,n))];
const sourcePins=Object.fromEntries(sourcePaths.map(p=>[p,sha(bytes(p))]));
const requests=wire.packets.map((p,i)=>{
  need(p.outcome==='unverified'&&['enterprise','web'].includes(p.domain)&&p.sources.length===2,'packet-shape');
  for(const s of p.sources)need(sha(s.accessibility_tree)===s.source_sha256&&s.complete_projected_tree===true,'packet-source');
  return {packet:p,input:{operation:'generate',request_id:'g03-source-line-insert-r84-'+(i+1),messages:[{role:'system',content:INSERT_SYSTEM},{role:'user',content:JSON.stringify(renderInsertionPacket(p))}],tools:[],output_cap:2048}};
});
need(new Set(requests.map(r=>r.packet.trajectory_id)).size===8,'eight-unique');
mkdirSync(root,{mode:0o700});mkdirSync(join(root,'requests'),{mode:0o700});
const save=(n,v)=>writeFileSync(join(root,n),JSON.stringify(v,null,2)+'\n',{flag:'wx',mode:0o600});
const freeze={status:'frozen-before-provider',construction_sha256:sha(constructionBytes),packets_sha256:sha(packetBytes),protocol_sha256:sha(protocolBytes),source_sha256:sourcePins,ordered_requests:requests.map(r=>({trajectory_id:r.packet.trajectory_id,request_sha256:sha(providerBody(r.input))})),maximum_generation_calls:8,maximum_tokenizer_calls:8,maximum_known_generation_tokens:262144,insertion_context_cap:32768,prompt_margin:512,output_cap:2048,automatic_retries:0,questions_answers_or_evaluators_read:false,claim_ceiling:'Insertion metadata and exact quotation binding only; no answer accuracy or superiority.',authority_effect:'none',open_questions_owner:'G03-SOURCE-LINE-INSERT-PILOT-R84.json'};
save('FREEZE.json',freeze);writeFileSync(join(root,'PROTOCOL.json'),protocolBytes,{flag:'wx',mode:0o600});save('STARTED.json',{started_at:new Date().toISOString(),freeze_sha256:sha(bytes(join(root,'FREEZE.json')))});
const ssh=args=>execFileSync('ssh',['-o','BatchMode=yes','-o','ConnectTimeout=10',...args],{stdio:['ignore','ignore','ignore'],timeout:30000});
let ownedDirectory=null,socket=null,post=null,error=null,cleanupError=null,knownTokens=0,unknownUsage=0;const admissions=[],rows=[];
try{
 const fs=statfsSync(root);need(fs.bavail*fs.bsize>=8*1024**3,'wsl-reserve');
 ownedDirectory=mkdtempSync('/tmp/are-g02-ssh-reuse-r2-');socket=join(ownedDirectory,'control.sock');
 save('TRANSPORT-STARTED.json',{owned_directory:ownedDirectory,control_socket:socket,automatic_retries:0});
 ssh(['-M','-N','-f','-o','ControlPersist=60','-S',socket,'root@187.77.163.194']);validatePrivateControlSocket(socket);post=createMultiplexedVpsProvider({controlSocket:socket});
 async function call(input,name){
  for(const[p,pin]of Object.entries(sourcePins))need(sha(bytes(p))===pin,'source-drift-before-call');
  need(sha(bytes(join(here,'../../evidence/G03-SOURCE-LINE-INSERT-PILOT-R84.json')))===freeze.protocol_sha256,'protocol-drift');
  save('requests/'+name+'-STARTED.json',{input,request_sha256:sha(providerBody(input))});
  const reply=await post(input);save('requests/'+name+'-REPLY.json',reply);
  const validUsage=Number.isSafeInteger(reply.prompt_tokens)&&reply.prompt_tokens>=0&&(input.operation!=='generate'||Number.isSafeInteger(reply.completion_tokens)&&reply.completion_tokens>=0);
  if(!validUsage||reply.dispatch_uncertain){if(input.operation==='generate')unknownUsage++;throw Error('provider-unconfirmed-or-unknown-usage');}
  if(input.operation==='generate')knownTokens+=reply.prompt_tokens+reply.completion_tokens;
  need(reply.status===200&&!reply.failure_code&&!reply.dispatch_uncertain,'provider-invalid-stop-no-replay');
  need(knownTokens<=262144,'campaign-token-cap');return reply;
 }
 for(const[i,r]of requests.entries()){
  const input={...r.input,operation:'tokenize',request_id:r.input.request_id+'-tokenize'};
  const reply=await call(input,(i+1)+'-tokenize');const admitted=reply.prompt_tokens+512+2048<=32768;
  admissions.push({ordinal:i+1,trajectory_id:r.packet.trajectory_id,prompt_tokens:reply.prompt_tokens,admitted});
  need(admitted,'all8-prompt-admission-before-generation');
 }
 need(admissions.length===8,'full-source-cohort-admission');
 for(const[i,r]of requests.entries()){
  const reply=await call(r.input,(i+1)+'-generate');
  need(reply.prompt_tokens<=admissions[i].prompt_tokens+512&&reply.prompt_tokens+reply.completion_tokens<=32768,'measured-generation-bound');
  let bound=null,validationError=null;
  try{
   need(reply.public_response?.finish_reason==='stop'&&reply.public_response?.message?.role==='assistant'&&typeof reply.public_response.message.content==='string','public-note-response');
   bound=decodeAndBindLineNote(r.packet,reply.public_response.message.content);
  }catch(e){validationError=String(e.message).replace(/[^A-Za-z0-9_.:-]/g,'').slice(0,100);}
  const row={ordinal:i+1,trajectory_id:r.packet.trajectory_id,domain:r.packet.domain,valid:bound!==null,validation_error:validationError,prompt_tokens:reply.prompt_tokens,completion_tokens:reply.completion_tokens,known_tokens:reply.prompt_tokens+reply.completion_tokens,latency_ms:reply.latency_ms,metadata:bound};
  save('NOTE-'+String(i+1).padStart(2,'0')+'.json',row);rows.push(row);console.log(JSON.stringify({completed:rows.length,valid:row.valid,known_tokens:row.known_tokens}));
 }
}catch(e){error=String(e.message).replace(/[^A-Za-z0-9_.:-]/g,'').slice(0,120);}finally{
 if(socket&&existsSync(socket))try{validatePrivateControlSocket(socket);ssh(['-S',socket,'-O','exit','root@187.77.163.194']);}catch{cleanupError='exact-owned-socket-close-failed';}
 let cleanup='owned-directory-retained';if(ownedDirectory&&!cleanupError)try{rmdirSync(ownedDirectory);cleanup='empty-owned-directory-removed';}catch{}
 save('TRANSPORT-TERMINAL.json',{error:cleanupError,cleanup,owned_directory:ownedDirectory});
}
const passed=!error&&!cleanupError&&rows.length===8&&rows.every(r=>r.valid)&&unknownUsage===0;
const result={status:passed?'eight-source-line-notes-structurally-bound':'insertion-pilot-not-qualified',error,transport_error:cleanupError,freeze_sha256:sha(bytes(join(root,'FREEZE.json'))),admissions,rows,total_known_generation_tokens:knownTokens,unknown_generation_usage:unknownUsage,full_cohort_size:8,valid_notes:rows.filter(r=>r.valid).length,semantic_usefulness_verified:false,questions_answers_or_evaluators_read:false,confirmation_fields_read:false,claim_ceiling:'Structural metadata/quotation construction only, not semantic entailment, source reach, answer quality or superiority.',authority_effect:'none',open_questions_owner:'G03-SOURCE-LINE-INSERT-PILOT-R84.json'};
save('RESULT.json',result);console.log(JSON.stringify({status:result.status,error,valid_notes:result.valid_notes,total_known_generation_tokens:knownTokens,result_sha256:sha(bytes(join(root,'RESULT.json')))}));
if(error||cleanupError)process.exitCode=1;
