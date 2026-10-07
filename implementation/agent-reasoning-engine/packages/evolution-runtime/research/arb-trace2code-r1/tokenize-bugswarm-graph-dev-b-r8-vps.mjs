#!/usr/bin/env node
// VPS-only same-account 8K admission for sealed source-only cohort-B packets.
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = '/opt/are-benchmark-runs/g01-bugswarm-graph-dev-b-r8';
const transportPath = '/opt/are/evolution-runtime/g01-source-combined-candidate-r8/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const secretPath = '/opt/are-keld-presentation/secrets/model_api_key';
const pins = {
  packets: '26e3b47e375bf309e1df4c92279e137f9d68b5ae9dcd5a9f5f9d9d0196527a4f',
  seal: 'da390e2ef19987f93a79f2e126498023bb1130bc1ebdf85591811da455439980',
  protocol: 'b5c2829077cd98bb4b511b758990ffb8d70652047ef77ed5aa3056fbdb0bc65c',
  transport: '5669b2c72d642e1ccf1d5bd796064c1e61d9dcad8828622f9b6f4450acdec56d'
};
const model = 'glm-5.3-flash';
const sha = data => createHash('sha256').update(data).digest('hex');
const digest = path => sha(readFileSync(path));
const path = name => join(root, name);
const need = (ok, why) => {if (!ok) throw Error(`g01-b-r8-tokenizer.${why}`);};
const save = (name, value) => writeFileSync(path(name), JSON.stringify(value, null, 2)+'\n',
  {flag:'wx', mode:0o600});

function inputs() {
  need(process.argv.length===2 && !existsSync(path('TOKENIZER-FREEZE.json')) &&
    !existsSync(path('TOKENIZER-RESULT.json')), 'usage-or-prior-run');
  need(digest(path('PACKETS-B-R8.jsonl'))===pins.packets &&
    digest(path('PACKET-SEAL-B-R8.json'))===pins.seal &&
    digest(path('G01-BUGSWARM-GRAPH-DEV-B-R8-GLM-PROTOCOL-2026-10-04.md'))===pins.protocol &&
    digest(transportPath)===pins.transport, 'input-pin-drift');
  const seal=JSON.parse(readFileSync(path('PACKET-SEAL-B-R8.json'),'utf8'));
  const packets=readFileSync(path('PACKETS-B-R8.jsonl'),'utf8').trimEnd().split('\n').map(JSON.parse);
  need(seal.cases===24 && seal.packets_sha256===pins.packets &&
    seal.maximum_candidates<=80 && seal.maximum_prompt_bytes<=24000 &&
    !seal.gold_opened && !seal.reserved_confirmation_opened && seal.model_calls===0 &&
    packets.length===24,'seal-shape');
  packets.forEach((packet,i)=>need(packet.ordinal===i+1 && packet.gold_opened===false &&
    packet.model_calls===0 && packet.exposed_development===true &&
    packet.candidate_count===packet.candidates.length && packet.candidate_count<=80 &&
    packet.candidates.every((c,j)=>c.candidate_id===j+1) &&
    new Set(packet.candidates.map(c=>c.path)).size===packet.candidate_count &&
    Buffer.byteLength(packet.prompt)<=24000,`packet:${i+1}`));
  return packets;
}

async function main() {
  const packets=inputs();
  const {postOnce,stable,MODEL}=await import(transportPath);
  need(MODEL===model,'model-drift');
  const key=readFileSync(secretPath,'utf8').trim();
  need(key.length>=8 && key.length<=8192,'secret-shape');
  save('TOKENIZER-FREEZE.json',{
    schema_version:'are.g01-bugswarm-graph-dev-b-r8-tokenizer-freeze/v1',
    posture:'source-only exposed development; no gold or generation',
    packets_sha256:pins.packets,packet_seal_sha256:pins.seal,
    protocol_sha256:pins.protocol,runner_sha256:digest(fileURLToPath(import.meta.url)),
    transport_sha256:pins.transport,model,
    endpoint:'https://api.z.ai/api/paas/v4/tokenizer',maximum_calls:24,
    maximum_prompt_plus_reserve_tokens:8192,output_reserve_tokens:512,
    total_prompt_cap_tokens:220000,automatic_retries:0,
    failure_policy:'stop-no-retry'});
  const receipts=[];
  for(const packet of packets){
    const body=stable({model,messages:[{role:'user',content:packet.prompt}]});
    const start=Date.now();let response;
    try{response=await postOnce(new URL('https://api.z.ai/api/paas/v4/tokenizer'),body,
      {apiKey:key,timeout_ms:30000,maximum_response_bytes:262144});}
    catch(error){response={status:null,payload:null,
      failure_code:String(error?.code??error?.message??'request-failed').slice(0,100)};}
    const tokens=response.payload?.usage?.prompt_tokens;
    const admitted=response.status===200 && Number.isSafeInteger(tokens) && tokens+512<=8192;
    const row={schema_version:'are.g01-bugswarm-graph-dev-b-r8-tokenizer-case/v1',
      ordinal:packet.ordinal,id:packet.id,prompt_sha256:sha(packet.prompt),
      request_sha256:sha(body),response_sha256:response.payload?sha(JSON.stringify(response.payload)):null,
      http_status:response.status,failure_code:response.failure_code??null,
      prompt_tokens:Number.isSafeInteger(tokens)?tokens:null,elapsed_ms:Date.now()-start,admitted};
    save(`TOKENIZER-${String(packet.ordinal).padStart(2,'0')}.json`,row);
    receipts.push(row);
    process.stdout.write(JSON.stringify({ordinal:row.ordinal,http_status:row.http_status,
      prompt_tokens:row.prompt_tokens,admitted})+'\n');
    if(!admitted || receipts.reduce((n,r)=>n+(r.prompt_tokens??0),0)>220000)break;
  }
  const sum=receipts.reduce((n,r)=>n+(r.prompt_tokens??0),0);
  const result={schema_version:'are.g01-bugswarm-graph-dev-b-r8-tokenizer-result/v1',
    status:receipts.length===24 && receipts.every(r=>r.admitted) && sum<=220000?'admitted':'not-admitted',
    attempts:receipts.length,admitted:receipts.filter(r=>r.admitted).length,
    summed_prompt_tokens:sum,maximum_prompt_tokens:Math.max(...receipts.map(r=>r.prompt_tokens??0)),
    packets_sha256:pins.packets};
  save('TOKENIZER-RESULT.json',result);
  process.stdout.write(JSON.stringify(result)+'\n');
  if(result.status!=='admitted')process.exitCode=2;
}

await main();
