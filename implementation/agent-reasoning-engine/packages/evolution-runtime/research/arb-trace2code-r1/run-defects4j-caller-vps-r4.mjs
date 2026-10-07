#!/usr/bin/env node
// VPS-only prospective runner. Open Questions: G01-DEFECTS4J-CALLER-R4-PROTOCOL.md.
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {decodeCandidateIds} from './decoder.mjs';
const root='/opt/are-benchmark-runs/g01-defects4j-caller-r4';
const transport='/opt/are/evolution-runtime/g01-source-combined-candidate-r8/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const secret='/opt/are-keld-presentation/secrets/model_api_key';
const model='glm-5.3-flash', endpoint='https://api.z.ai/api/paas/v4/';
const sha=x=>createHash('sha256').update(x).digest('hex');
const fileSha=p=>sha(readFileSync(p));
const need=(v,m)=>{if(!v)throw Error(m);};
const save=(p,x)=>writeFileSync(p,JSON.stringify(x,null,2)+'\n',{flag:'wx',mode:0o600});
const packetsSha='9cf325c8e3cf2c805214e8f48572e20432860d4ab65f17576ecb7cae91ca99dd';
const protocolSha='cb3d0cde7f3aa5b2bfcb2034bceb1248116348ba3d017be7d91d1ae66ec2588a';
const mode=process.argv[2];
need(['tokenize','generate'].includes(mode)&&process.argv.length===3,'mode');
need(fileSha(join(root,'PACKETS.jsonl'))===packetsSha,'packet drift');
need(fileSha(join(root,'PROTOCOL.md'))===protocolSha,'protocol drift');
need(fileSha(transport)==='5669b2c72d642e1ccf1d5bd796064c1e61d9dcad8828622f9b6f4450acdec56d','transport drift');
need(fileSha(join(root,'decoder.mjs'))==='94a56fc5b208b12716283ae0be94377a4fbccd9e250b6fff8d853db577e41aca','decoder drift');
const packets=readFileSync(join(root,'PACKETS.jsonl'),'utf8').trimEnd().split('\n').map(JSON.parse);
need(packets.length===30&&packets.every((p,i)=>p.ordinal===i+1&&sha(p.prompt)===p.prompt_sha256),'denominator');
const {postOnce,stable,MODEL}=await import(transport);need(MODEL===model,'model');
const key=readFileSync(secret,'utf8').trim();need(key.length>=8,'credential');
const prefix=mode==='tokenize'?'TOKENIZER':'GENERATION';
const resultPath=join(root,prefix+'-RESULT.json');need(!existsSync(resultPath),'already terminal');
const freezePath=join(root,prefix+'-FREEZE.json');
if(!existsSync(freezePath))save(freezePath,{packets_sha256:packetsSha,protocol_sha256:protocolSha,runner_sha256:fileSha(fileURLToPath(import.meta.url)),
  mode,model,cases:30,output_cap:512,automatic_retries:0,gold_opened:false});
else need(JSON.parse(readFileSync(freezePath)).packets_sha256===packetsSha,'freeze drift');
if(mode==='generate'){
  const tokenResult=JSON.parse(readFileSync(join(root,'TOKENIZER-RESULT.json')));
  need(tokenResult.completed===30&&tokenResult.valid===30,'tokenizer admission');
}
let completed=0,valid=0,promptTokens=0,completionTokens=0;
const predictions=[];
for(const p of packets){
  const path=join(root,prefix+'-'+String(p.ordinal).padStart(2,'0')+'.json');
  let row;
  if(existsSync(path)){
    row=JSON.parse(readFileSync(path));need(row.prompt_sha256===p.prompt_sha256,'existing response drift');
  }else{
    const body=stable({model,messages:[{role:'user',content:p.prompt}],...(mode==='generate'?{stream:false,max_tokens:512,reasoning_effort:'low'}:{})});
    const start=Date.now();let response;
    try{response=await postOnce(new URL(endpoint+(mode==='tokenize'?'tokenizer':'chat/completions')),body,
      {apiKey:key,timeout_ms:120000,maximum_response_bytes:262144});}
    catch(e){response={status:null,failure_code:String(e.code??'transport-failed')};}
    const choice=response.payload?.choices?.[0];const usage=response.payload?.usage;
    let ids=null,error=null;
    if(mode==='generate'&&response.status===200&&choice?.finish_reason==='stop'){
      try{ids=decodeCandidateIds(choice.message.content,p.candidates.length);}
      catch{ids=null;error='invalid-json-or-ids';}
    }
    const tokens=usage?.prompt_tokens;
    row={ordinal:p.ordinal,case_id:p.case_id,prompt_sha256:p.prompt_sha256,http_status:response.status,
      failure_code:response.failure_code??null,elapsed_ms:Date.now()-start,finish_reason:choice?.finish_reason??null,
      valid:mode==='tokenize'?response.status===200&&Number.isInteger(tokens)&&tokens+512<=8192:ids!==null,
      prompt_tokens:tokens??null,completion_tokens:usage?.completion_tokens??0,
      selected_ids:ids,validation_error:error,content:mode==='generate'?choice?.message?.content??null:null};
    save(path,row);
  }
  completed++;valid+=Number(row.valid);promptTokens+=row.prompt_tokens??0;completionTokens+=row.completion_tokens??0;
  if(mode==='generate')predictions.push({case_id:p.case_id,ranked_files:row.valid?row.selected_ids.map(id=>p.candidates[id-1].path):[],valid:row.valid});
  process.stdout.write(JSON.stringify({mode,ordinal:p.ordinal,valid:row.valid,http_status:row.http_status,prompt_tokens:row.prompt_tokens})+'\n');
  if(row.http_status!==200||row.failure_code)break;
}
const result={mode,completed,valid,prompt_tokens:promptTokens,completion_tokens:completionTokens,
  packets_sha256:packetsSha,gold_opened:false,predictions:mode==='generate'?predictions:undefined};
save(resultPath,result);process.stdout.write(JSON.stringify({mode,completed,valid,prompt_tokens:promptTokens,completion_tokens:completionTokens})+'\n');
if(completed!==30||valid!==30)process.exitCode=2;

