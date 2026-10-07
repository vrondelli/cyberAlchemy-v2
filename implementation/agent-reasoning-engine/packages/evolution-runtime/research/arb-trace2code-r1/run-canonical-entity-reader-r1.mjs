// VPS-only. Open Questions: G01-CANONICAL-ENTITY-READER-R1.md.
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {decodeCandidateIds} from './decoder.mjs';
const root='/opt/are-benchmark-runs/g01-canonical-entity-reader-r1';
const transport='/opt/are/evolution-runtime/g01-source-combined-candidate-r8/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const secret='/opt/are-keld-presentation/secrets/model_api_key';
const sha=b=>createHash('sha256').update(b).digest('hex');
const digest=p=>sha(readFileSync(p));
const need=(v,m)=>{if(!v)throw Error(m);};
const save=(p,x)=>writeFileSync(p,JSON.stringify(x,null,2)+'\n',{flag:'wx',mode:0o600});
const mode=process.argv[2];need(['tokenize','generate'].includes(mode)&&process.argv.length===3,'mode');
const seal=JSON.parse(readFileSync(join(root,'PACKET-SEAL.json')));
const admission=JSON.parse(readFileSync(join(root,'RUNNER-ADMISSION.json')));
for(const [name,hash] of Object.entries(admission.artifacts))need(digest(join(root,name))===hash,'admission drift '+name);
need(digest(fileURLToPath(import.meta.url))===admission.runner_sha256,'runner drift');
need(digest(transport)==='5669b2c72d642e1ccf1d5bd796064c1e61d9dcad8828622f9b6f4450acdec56d','transport drift');
need(digest(join(root,'PACKETS.jsonl'))===seal.packets_sha256&&digest(join(root,'PROTOCOL.md'))===seal.protocol_sha256,'packet/protocol drift');
const packets=readFileSync(join(root,'PACKETS.jsonl'),'utf8').trimEnd().split('\n').map(JSON.parse);
need(packets.length===124&&packets.every((p,i)=>p.ordinal===i+1&&sha(p.prompt)===p.prompt_sha256),'denominator');
const {postOnce,stable,MODEL}=await import(transport);need(MODEL==='glm-5.3-flash','model');
const key=readFileSync(secret,'utf8').trim();need(key.length>=8,'credential');
const prefix=mode==='tokenize'?'TOKENIZER':'GENERATION';
const resultPath=join(root,prefix+'-RESULT.json');need(!existsSync(resultPath),'already terminal');
const freeze={packets_sha256:seal.packets_sha256,protocol_sha256:seal.protocol_sha256,runner_sha256:admission.runner_sha256,
 admission_sha256:digest(join(root,'RUNNER-ADMISSION.json')),mode,model:MODEL,packets:124,output_cap:512,automatic_retries:0,posture:'exposed matched development'};
const fp=join(root,prefix+'-FREEZE.json');
if(existsSync(fp))need(JSON.stringify(JSON.parse(readFileSync(fp)))===JSON.stringify(freeze),'freeze drift');else save(fp,freeze);
if(mode==='generate'){
 const tokens=JSON.parse(readFileSync(join(root,'TOKENIZER-RESULT.json')));
 need(tokens.completed===124&&tokens.valid===124&&tokens.packets_sha256===seal.packets_sha256,'tokenizer admission');
}
const rows=[];
for(const p of packets){
 const path=join(root,prefix+'-'+String(p.ordinal).padStart(3,'0')+'.json');let row;
 if(existsSync(path)){
  row=JSON.parse(readFileSync(path));need(row.case_id===p.case_id&&row.arm===p.arm&&row.prompt_sha256===p.prompt_sha256,'response drift');
 }else{
  const body=stable({model:MODEL,messages:[{role:'user',content:p.prompt}],...(mode==='generate'?{stream:false,max_tokens:512,reasoning_effort:'low'}:{})});
  const started=Date.now();let response;
  try{response=await postOnce(new URL('https://api.z.ai/api/paas/v4/'+(mode==='tokenize'?'tokenizer':'chat/completions')),body,
   {apiKey:key,timeout_ms:120000,maximum_response_bytes:262144});}
  catch(e){response={status:null,failure_code:String(e.code??'transport-failed')};}
  const choice=response.payload?.choices?.[0],usage=response.payload?.usage;let ids=null;
  if(mode==='generate'&&response.status===200&&choice?.finish_reason==='stop'){
   try{ids=decodeCandidateIds(choice.message.content,p.candidates.length);}catch{}
  }
  const tokens=usage?.prompt_tokens;
  row={ordinal:p.ordinal,case_id:p.case_id,arm:p.arm,prompt_sha256:p.prompt_sha256,http_status:response.status,
   failure_code:response.failure_code??null,elapsed_ms:Date.now()-started,finish_reason:choice?.finish_reason??null,
   valid:mode==='tokenize'?response.status===200&&Number.isInteger(tokens)&&tokens+512<=8192:ids!==null,
   prompt_tokens:tokens??null,completion_tokens:usage?.completion_tokens??0,selected_ids:ids,
   content:mode==='generate'?choice?.message?.content??null:null};save(path,row);
 }
 rows.push(row);console.log(JSON.stringify({mode,ordinal:p.ordinal,arm:p.arm,valid:row.valid,http_status:row.http_status,prompt_tokens:row.prompt_tokens}));
 if(row.http_status!==200||row.failure_code)break;
}
const result={mode,completed:rows.length,valid:rows.filter(r=>r.valid).length,packets_sha256:seal.packets_sha256,
 prompt_tokens:rows.reduce((s,r)=>s+(r.prompt_tokens??0),0),completion_tokens:rows.reduce((s,r)=>s+(r.completion_tokens??0),0),
 elapsed_ms:rows.reduce((s,r)=>s+r.elapsed_ms,0),posture:'exposed development, no gold consumed by runner'};
if(mode==='generate')result.predictions=rows.map((r,i)=>({case_id:r.case_id,arm:r.arm,valid:r.valid,
 ranked_files:r.valid?r.selected_ids.map(id=>packets[i].candidates[id-1].path):[]}));
save(resultPath,result);console.log(JSON.stringify({mode,completed:result.completed,valid:result.valid}));
if(result.completed!==124||result.valid!==124)process.exitCode=2;
