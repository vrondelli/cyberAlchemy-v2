#!/usr/bin/env node
// VPS-only tokenizer and one-shot GLM selector. No evaluator input.
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = '/opt/are-benchmark-runs/g01-bugswarm-graph-dev-r4-union-selector';
const transportPath = '/opt/are/evolution-runtime/g01-source-combined-candidate-r8/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const secretPath = '/opt/are-keld-presentation/secrets/model_api_key';
const pins = {
  packets:'2eab7cd9858421eaca78f6e13c7f6209eec29adf1e6224b5a0e0701b3728d33f',
  seal:'cce178545b3e511f6fbbdc14efcddf9a043603fc82b7be680d09072e97f10c32',
  protocol:'cd593460d9168adec84a77aca67f036db7f4264e76b271fc50b705f2e2980475',
  transport:'5669b2c72d642e1ccf1d5bd796064c1e61d9dcad8828622f9b6f4450acdec56d'
};
const model = 'glm-5.3-flash';
const sha = data => createHash('sha256').update(data).digest('hex');
const digest = path => sha(readFileSync(path));
const need = (ok, code) => {if (!ok) throw Error(`g01-r4.${code}`);};
const save = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n',
  {flag:'wx', mode:0o600});
const path = name => join(root, name);

function inputs() {
  need(digest(path('PACKETS.jsonl')) === pins.packets &&
    digest(path('PACKET-SEAL.json')) === pins.seal &&
    digest(path('G01-BUGSWARM-GRAPH-DEV-R4-UNION-SELECTOR-PROTOCOL-2026-10-04.md')) === pins.protocol &&
    digest(transportPath) === pins.transport, 'input-pin-drift');
  const seal = JSON.parse(readFileSync(path('PACKET-SEAL.json'), 'utf8'));
  const rows = readFileSync(path('PACKETS.jsonl'), 'utf8').trimEnd().split('\n').map(JSON.parse);
  need(seal.cases === 24 && seal.packets_sha256 === pins.packets &&
    seal.maximum_candidates <= 60 && seal.maximum_prompt_bytes <= 20000 &&
    !seal.gold_opened && !seal.reserved_confirmation_opened && seal.model_calls === 0 &&
    rows.length === 24, 'seal-shape');
  rows.forEach((r, i) => need(r.ordinal === i+1 && r.gold_opened === false &&
    r.model_calls === 0 && r.exposed_development === true &&
    r.candidates.length === r.candidate_count && r.candidate_count <= 60 &&
    r.candidates.every((c, j) => c.candidate_id === j+1) &&
    new Set(r.candidates.map(c => c.path)).size === r.candidate_count &&
    Buffer.byteLength(r.prompt) <= 20000, `packet:${i+1}`));
  return rows;
}

function key() {
  const value = readFileSync(secretPath, 'utf8').trim();
  need(value.length >= 8 && value.length <= 8192, 'secret-shape');
  return value;
}

async function tokenize(rows, postOnce, stable) {
  need(!existsSync(path('TOKENIZER-FREEZE.json')) && !existsSync(path('TOKENIZER-RESULT.json')),
    'tokenizer-prior-run');
  save(path('TOKENIZER-FREEZE.json'), {schema_version:'are.g01-graph-dev-r4-tokenizer-freeze/v1',
    posture:'exposed development; no gold or generation', packets_sha256:pins.packets,
    seal_sha256:pins.seal, protocol_sha256:pins.protocol,
    runner_sha256:digest(fileURLToPath(import.meta.url)), transport_sha256:pins.transport,
    model, endpoint:'https://api.z.ai/api/paas/v4/tokenizer', maximum_calls:24,
    maximum_prompt_plus_reserve_tokens:8192, output_reserve_tokens:512,
    prompt_cost_cap_tokens:130000, automatic_retries:0,
    failure_policy:'stop-no-retry'});
  const receipts = [];
  const apiKey = key();
  for (const packet of rows) {
    const body = stable({model, messages:[{role:'user', content:packet.prompt}]});
    const start = Date.now();
    let response;
    try {response = await postOnce(new URL('https://api.z.ai/api/paas/v4/tokenizer'), body,
      {apiKey, timeout_ms:30000, maximum_response_bytes:262144});}
    catch (error) {response = {status:null, payload:null,
      failure_code:String(error?.code ?? error?.message ?? 'request-failed').slice(0,100)};}
    const tokens = response.payload?.usage?.prompt_tokens;
    const admitted = response.status === 200 && Number.isSafeInteger(tokens) &&
      tokens + 512 <= 8192;
    const receipt = {ordinal:packet.ordinal, id:packet.id, prompt_sha256:sha(packet.prompt),
      request_sha256:sha(body), response_sha256:response.payload ?
        sha(JSON.stringify(response.payload)) : null, http_status:response.status,
      failure_code:response.failure_code ?? null, prompt_tokens:Number.isSafeInteger(tokens)?tokens:null,
      elapsed_ms:Date.now()-start, admitted};
    save(path(`TOKENIZER-${String(packet.ordinal).padStart(2,'0')}.json`), receipt);
    receipts.push(receipt);
    process.stdout.write(JSON.stringify({ordinal:receipt.ordinal, http_status:receipt.http_status,
      prompt_tokens:receipt.prompt_tokens, admitted})+'\n');
    if (!admitted || receipts.reduce((sum, r) => sum + (r.prompt_tokens ?? 0), 0) > 130000) break;
  }
  const sum = receipts.reduce((n,r) => n + (r.prompt_tokens ?? 0),0);
  const result = {schema_version:'are.g01-graph-dev-r4-tokenizer-result/v1',
    status:receipts.length === 24 && receipts.every(r=>r.admitted) && sum <= 130000 ?
      'admitted':'not-admitted', attempts:receipts.length,
    admitted:receipts.filter(r=>r.admitted).length, summed_prompt_tokens:sum,
    maximum_prompt_tokens:Math.max(...receipts.map(r=>r.prompt_tokens??0)),
    packets_sha256:pins.packets};
  save(path('TOKENIZER-RESULT.json'),result);
  process.stdout.write(JSON.stringify(result)+'\n');
  if (result.status !== 'admitted') process.exitCode=2;
}

function parse(content, count) {
  const value=JSON.parse(content);
  need(value && typeof value==='object' && !Array.isArray(value) &&
    Object.keys(value).join(',')==='candidate_ids' && Array.isArray(value.candidate_ids) &&
    value.candidate_ids.length <= 8 &&
    value.candidate_ids.every(n=>Number.isSafeInteger(n)&&n>=1&&n<=count) &&
    new Set(value.candidate_ids).size===value.candidate_ids.length, 'response-shape');
  return value.candidate_ids;
}

async function generate(rows, postOnce, stable) {
  need(!existsSync(path('GENERATION-FREEZE.json')) && !existsSync(path('GENERATION-RESULT.json')),
    'generation-prior-run');
  const token = JSON.parse(readFileSync(path('TOKENIZER-RESULT.json'),'utf8'));
  need(token.status==='admitted' && token.attempts===24 &&
    token.summed_prompt_tokens<=130000, 'tokenizer-not-admitted');
  rows.forEach((r,i)=>{const receipt=JSON.parse(readFileSync(path(`TOKENIZER-${String(i+1).padStart(2,'0')}.json`),'utf8'));
    need(receipt.id===r.id && receipt.admitted && receipt.prompt_sha256===sha(r.prompt),'tokenizer-case-drift');});
  save(path('GENERATION-FREEZE.json'), {schema_version:'are.g01-graph-dev-r4-generation-freeze/v1',
    posture:'exposed development; no gold', packets_sha256:pins.packets,
    tokenizer_result_sha256:digest(path('TOKENIZER-RESULT.json')),
    protocol_sha256:pins.protocol, runner_sha256:digest(fileURLToPath(import.meta.url)),
    transport_sha256:pins.transport, model,
    endpoint:'https://api.z.ai/api/paas/v4/chat/completions',
    maximum_calls:24, maximum_output_tokens:512, reasoning_effort:'low',
    automatic_retries:0, invalid_policy:'count-invalid-no-retry',
    transport_failure_policy:'stop-no-retry'});
  const apiKey=key(); let valid=0,attempts=0;
  for(const packet of rows){
    const body=stable({model,messages:[{role:'user',content:packet.prompt}],
      stream:false,max_tokens:512,reasoning_effort:'low'});
    const start=Date.now();let response;
    try{response=await postOnce(new URL('https://api.z.ai/api/paas/v4/chat/completions'),body,
      {apiKey,timeout_ms:120000,maximum_response_bytes:262144});}
    catch(error){response={status:null,payload:null,
      failure_code:String(error?.code??error?.message??'request-failed').slice(0,100)};}
    const choice=response.payload?.choices?.[0];let selected=null,invalid=null;
    if(response.status===200 && choice?.finish_reason==='stop' &&
       typeof choice?.message?.content==='string'){
      try{selected=parse(choice.message.content,packet.candidate_count);}
      catch(error){invalid=String(error.message).slice(0,160);}
    }else invalid='provider-status-finish-or-content';
    const receipt={schema_version:'are.g01-graph-dev-r4-response/v1',
      ordinal:packet.ordinal,id:packet.id,request_sha256:sha(body),
      prompt_sha256:sha(packet.prompt),status:selected===null?'invalid':'valid',
      http_status:response.status,failure_code:response.failure_code??null,
      elapsed_ms:Date.now()-start,finish_reason:choice?.finish_reason??null,
      validation_error:invalid,selected_ids:selected,provider_payload:response.payload??null};
    save(path(`GENERATION-${String(packet.ordinal).padStart(2,'0')}.json`),receipt);
    attempts++;if(selected!==null)valid++;
    process.stdout.write(JSON.stringify({ordinal:packet.ordinal,status:receipt.status,
      http_status:receipt.http_status,selected_count:selected?.length??null,
      prompt_tokens:response.payload?.usage?.prompt_tokens??null,
      completion_tokens:response.payload?.usage?.completion_tokens??null})+'\n');
    if(response.status!==200 || response.failure_code)break;
  }
  const result={schema_version:'are.g01-graph-dev-r4-generation-result/v1',
    status:attempts===24&&valid===24?'completed-valid':'terminal-incomplete-or-invalid',
    attempts,valid,maximum_calls:24,automatic_retries:0,packets_sha256:pins.packets};
  save(path('GENERATION-RESULT.json'),result);
  process.stdout.write(JSON.stringify(result)+'\n');
  if(result.status!=='completed-valid')process.exitCode=2;
}

const mode=process.argv[2];
need(['tokenize','generate'].includes(mode)&&process.argv.length===3,'usage');
const rows=inputs();
const {postOnce,stable,MODEL}=await import(transportPath);
need(MODEL===model,'transport-model-drift');
if(mode==='tokenize')await tokenize(rows,postOnce,stable);
else await generate(rows,postOnce,stable);
