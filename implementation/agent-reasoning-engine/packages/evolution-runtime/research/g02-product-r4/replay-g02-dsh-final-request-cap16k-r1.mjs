// One private replay of r4's exact final DSH request with only max_tokens changed.
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const SOURCE='/opt/are/evolution-runtime/g02-r4-final-request-replay-source-r1/000140.json';
const ROOT='/opt/are/evolution-runtime/g02-r4-final-request-replay-r1';
const SOURCE_SHA='672a5de6f85ce82cdd80ba754ea17bc7cf985bf3374c22467ae8668f5bfb4ada';
const REQUEST_SHA='a8950e7e6217dfefa85d54c087ffa77b640486df897e5267c5a6c5284bf7286f';
const HELPER='/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/repo/implementation/agent-reasoning-engine/packages/evolution-runtime/research/hen-11-live-contextbench-v1/vps-local-glm-v1.mjs';
const HELPER_SHA='deafaf7bc91d5cac29c070781519a996975d6c684d2035c83d09dd2dd584194e';
const sha=x=>createHash('sha256').update(x).digest('hex');
const need=(v,r)=>{if(!v)throw Error('g02-final-request-replay.'+r);};
const url='https://api.z.ai/api/paas/v4/chat/completions';
const remote=String.raw`
const {readFile}=await import('node:fs/promises');
let input='';for await(const chunk of process.stdin){input+=chunk;if(Buffer.byteLength(input)>300000)process.exit(41)}
const request=JSON.parse(input),secret=(await readFile('/run/secrets/model_api_key','utf8')).trim();
const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),240000);
try{const response=await fetch(request.url,{method:'POST',headers:{authorization:'Bearer '+secret,'content-type':'application/json'},body:request.body,signal:controller.signal,redirect:'error'});
const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>4000000)process.exit(42);
process.stdout.write(JSON.stringify({status:response.status,bytes:bytes.toString('utf8')}));}
catch(error){process.stderr.write(error?.name==='AbortError'?'deadline-exceeded':'request-failed');process.exit(43)}
finally{clearTimeout(timer)}
`;

function summarize(text){
  const choices=[];let usage=null,chunks=0,done=false;
  for(const event of text.split(/\r?\n\r?\n/)){
    const data=event.split(/\r?\n/).filter(line=>line.startsWith('data: ')).map(line=>line.slice(6));
    for(const item of data){
      if(item==='[DONE]'){done=true;continue;}
      let row;try{row=JSON.parse(item);}catch{continue;}
      chunks++;
      if(row.usage)usage=row.usage;
      for(const choice of row.choices??[])if(choice.finish_reason)choices.push(choice.finish_reason);
    }
  }
  return {format:'sse',chunks,done,finish_reasons:choices,usage};
}

async function main(){
  need(process.argv.length===2,'arguments');
  const source=readFileSync(SOURCE);need(sha(source)===SOURCE_SHA,'source-drift');
  const record=JSON.parse(source);need(record.kind==='request'&&record.attempt===20&&
    record.request_sha256===REQUEST_SHA&&sha(record.request_bytes)===REQUEST_SHA,'request-binding');
  const original=JSON.parse(record.request_bytes);
  need(original.model==='glm-5.3-flash'&&original.max_tokens===8192&&original.stream===true&&
    original.messages?.length===56&&original.tools?.length===6,'request-shape');
  const changed={...original,max_tokens:16384};
  need(Object.keys(changed).length===Object.keys(original).length&&
    JSON.stringify({...changed,max_tokens:8192})===JSON.stringify(original),'one-field-only');
  const body=JSON.stringify(changed);
  need(sha(readFileSync(HELPER))===HELPER_SHA,'helper-drift');
  const {verifyHen11VpsTopology}=await import(pathToFileURL(HELPER).href);
  const topology=verifyHen11VpsTopology();
  mkdirSync(ROOT,{recursive:false,mode:0o700});
  const freeze={schema_version:'are.g02-dsh-final-request-replay/v1',status:'frozen-before-model-dispatch',
    posture:'previously exposed exact final DSH request; single-call cap diagnostic',
    source_sha256:SOURCE_SHA,original_request_sha256:REQUEST_SHA,replay_request_sha256:sha(body),
    exact_change:{max_tokens:[8192,16384]},model:changed.model,stream:changed.stream,
    message_count:changed.messages.length,tool_count:changed.tools.length,
    provider_host_fingerprint_sha256:topology.host_fingerprint_sha256,
    automatic_retries:0,gold_posture:'no gold or scoring',
    claim_ceiling:'One stochastic request replay, not an end-to-end control run or superiority result.'};
  const freezeBytes=Buffer.from(JSON.stringify(freeze,null,2)+'\n');
  writeFileSync(ROOT+'/FREEZE.json',freezeBytes,{flag:'wx',mode:0o600});
  const encoded=Buffer.from(remote).toString('base64');
  const child=spawnSync('docker',['exec','--user','65532:65532','-i',topology.container,
    '/nodejs/bin/node','--input-type=module','-e',
    `await eval('(async()=>{'+Buffer.from('${encoded}','base64').toString('utf8')+'})()')`],
    {input:JSON.stringify({url,body}),encoding:'utf8',timeout:250000,maxBuffer:8*1024*1024});
  const transport={exit_code:child.status,signal:child.signal,stderr_sha256:sha(child.stderr??''),
    error_code:child.error?.code??null};
  let result={schema_version:'are.g02-dsh-final-request-replay-result/v1',freeze_sha256:sha(freezeBytes),
    source_sha256:SOURCE_SHA,replay_request_sha256:sha(body),transport,
    claim_ceiling:'One exposed request replay; no paired benchmark or causal proof.'};
  if(child.status===0){
    const response=JSON.parse(child.stdout);
    const responseBytes=Buffer.from(response.bytes);
    writeFileSync(ROOT+'/RESPONSE.sse',responseBytes,{flag:'wx',mode:0o600});
    result={...result,http_status:response.status,response_sha256:sha(responseBytes),
      response_bytes:responseBytes.length,stream_summary:summarize(response.bytes)};
  }
  const resultBytes=Buffer.from(JSON.stringify(result,null,2)+'\n');
  writeFileSync(ROOT+'/RESULT.json',resultBytes,{flag:'wx',mode:0o600});
  process.stdout.write(JSON.stringify({status:child.status===0?'settled':'transport-failed',
    freeze_sha256:sha(freezeBytes),result_sha256:sha(resultBytes),http_status:result.http_status??null,
    stream_summary:result.stream_summary??null})+'\n');
  if(child.status!==0||result.http_status!==200)process.exitCode=2;
}

await main();
