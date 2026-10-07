// One-shot private transport metadata diagnostic on the already-exposed r11 task 4.
import {createHash} from 'node:crypto';
import {createServer, request as httpRequest} from 'node:http';
import {request as httpsRequest} from 'node:https';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = '/opt/are/evolution-runtime/g02-r11-nonjson-header-exposed-r1';
const prior = '/opt/are/evolution-runtime/g02-r11-relational-choice-exposed-r4';
const transportPath = '/opt/are/evolution-runtime/g01-source-combined-candidate-r8/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const secretPath = '/opt/are-keld-presentation/secrets/model_api_key';
const endpoint = 'https://api.z.ai/api/paas/v4/chat/completions';
const model = 'glm-5.3-flash';
const priorHashes = Object.freeze({
  packets:'8865de1df1268d3db7ffe65afbead0174a1e6d1ec4c386228b7bbe7e33752255',
  freeze:'4af2fa27087309d75957fe7163325350ab467f2c6564bae6396b4a0190b3482d',
  preflight:'e60a4bbe6af8714030db5806c00bd3c0505ec3eaca30b663346f16ac70e17cd6',
  response:'b8a0727fcbd76ca63af647dd0018bec0b24efc670570d2db08e8562bb15f58ae',
});
const sha = value => createHash('sha256').update(value).digest('hex');
const digest = path => sha(readFileSync(path));
const load = path => JSON.parse(readFileSync(path, 'utf8'));
const save = (path, value) => writeFileSync(path, `${JSON.stringify(value,null,2)}\n`, {flag:'wx',mode:0o600});
const need = (okay, reason) => {if (!okay) throw Error(`g02-r11-header-diagnostic.${reason}`);};
const self = fileURLToPath(import.meta.url);

function safeHeader(value) {
  if (typeof value !== 'string') return null;
  return value.replace(/[^\x20-\x7e]/g, '?').slice(0,128);
}

function metadataPost(url, body, key, timeoutMs = 120000) {
  return new Promise(resolve => {
    const started = Date.now();
    const hash = createHash('sha256');
    let bytes = 0, finished = false, response;
    const finish = value => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve({...value, elapsed_ms:Date.now()-started});
    };
    const headers = {'content-type':'application/json',accept:'application/json',
      'content-length':Buffer.byteLength(body)};
    if (key !== null) headers.authorization = `Bearer ${key}`;
    const req = (url.protocol === 'https:' ? httpsRequest : httpRequest)(url,
      {method:'POST',agent:false,headers}, incoming => {
        response = incoming;
        const meta = {http_status:incoming.statusCode ?? null,
          content_type:safeHeader(incoming.headers['content-type']),
          content_encoding:safeHeader(incoming.headers['content-encoding']),
          declared_content_length:safeHeader(incoming.headers['content-length'])};
        incoming.on('data', chunk => {
          bytes += chunk.length;
          if (bytes <= 262144) hash.update(chunk);
          else {incoming.destroy(); finish({...meta,received_bytes:bytes,
            body_sha256:null,failure_code:'response-too-large'});}
        });
        incoming.on('end', () => finish({...meta,received_bytes:bytes,
          body_sha256:hash.digest('hex'),failure_code:null}));
        incoming.on('error', () => finish({...meta,received_bytes:bytes,
          body_sha256:null,failure_code:'response-interrupted'}));
        incoming.on('aborted', () => finish({...meta,received_bytes:bytes,
          body_sha256:null,failure_code:'response-interrupted'}));
      });
    const timer = setTimeout(() => {
      req.destroy();
      finish({http_status:response?.statusCode ?? null,content_type:null,
        content_encoding:null,declared_content_length:null,received_bytes:bytes,
        body_sha256:null,failure_code:'deadline-exceeded'});
    },timeoutMs);
    req.on('error', () => finish({http_status:response?.statusCode ?? null,
      content_type:null,content_encoding:null,declared_content_length:null,
      received_bytes:bytes,body_sha256:null,failure_code:'request-failed'}));
    req.end(body);
  });
}

async function binding() {
  for (const [name,expected] of Object.entries(priorHashes)) {
    const file = {packets:'PACKETS.json',freeze:'FREEZE.json',
      preflight:'PREFLIGHT.json',response:'RESPONSE-4.json'}[name];
    need(digest(join(prior,file))===expected,`prior-${name}-drift`);
  }
  const preflight=load(join(prior,'PREFLIGHT.json'));
  const failed=load(join(prior,'RESPONSE-4.json'));
  need(preflight.status==='ready' && failed.ordinal===4 &&
    failed.failure_code==='content-type-invalid' && failed.status==='invalid',
    'prior-status-drift');
  const frozen=load(join(prior,'FREEZE.json'));
  const packet=load(join(prior,'PACKETS.json')).ordered_packets[0];
  need(packet.ordinal===4 && frozen.model===model && frozen.generation_endpoint===endpoint,
    'prior-request-drift');
  const {stable,MODEL}=await import(transportPath);
  need(MODEL===model,'model-drift');
  const body=stable({model,messages:[{role:'system',content:frozen.prompt},
    {role:'user',content:JSON.stringify(packet)}],tools:[],stream:false,
    max_tokens:1024,thinking:{type:'enabled',clear_thinking:false},
    reasoning_effort:'medium'});
  const started=load(join(prior,'STARTED-4.json'));
  need(sha(body)===started.request_sha256 && sha(body)===failed.request_sha256,
    'request-hash-drift');
  need(Buffer.byteLength(body)<=131072,'request-too-large');
  return {body,request_sha256:sha(body),request_bytes:Buffer.byteLength(body)};
}

function freezeValue(bound) {
  return {schema_version:'g02.r11-nonjson-header-diagnostic-freeze/v1',
    posture:'already-exposed-transport-diagnostic-only',
    prior_r4_hashes:priorHashes,script_sha256:digest(self),
    transport_sha256:digest(transportPath),request_sha256:bound.request_sha256,
    request_bytes:bound.request_bytes,model,endpoint,maximum_provider_calls:1,
    automatic_retries:0,timeout_ms:120000,maximum_response_bytes:262144,
    output_policy:'only HTTP status, bounded content-type/encoding/length, byte count and body SHA-256; no response text or provider answer persisted',
    claim_ceiling:'Transport diagnosis only; no chooser result, native score, or superiority.'};
}

async function main() {
  const mode=process.argv[2];
  if (mode==='selftest') {
    const server=createServer((req,res) => {req.resume();req.on('end',() => {
      res.writeHead(403,{'content-type':'text/html','content-length':'9'});res.end('sensitive');
    });});
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    try {
      const result=await metadataPost(new URL(`http://127.0.0.1:${server.address().port}/`),'{}',null,3000);
      need(result.http_status===403 && result.content_type==='text/html' &&
        result.received_bytes===9 && result.body_sha256===sha('sensitive') &&
        !('body' in result),'selftest-failed');
      process.stdout.write(`${JSON.stringify({status:'selftest-passed'})}\n`);
    } finally {server.close();}
    return;
  }
  need(['check','freeze','run'].includes(mode) && process.argv.length===3,'usage');
  const bound=await binding();
  const fixed=freezeValue(bound);
  if (mode==='check') {
    process.stdout.write(`${JSON.stringify({status:'check-passed-no-write',
      request_sha256:bound.request_sha256,request_bytes:bound.request_bytes})}\n`);
  } else if (mode==='freeze') {
    need(!existsSync(join(root,'FREEZE.json')),'already-frozen');
    save(join(root,'FREEZE.json'),fixed);
    process.stdout.write(`${JSON.stringify({status:'frozen-no-call',sha256:digest(join(root,'FREEZE.json'))})}\n`);
  } else {
    need(digest(join(root,'FREEZE.json'))===sha(`${JSON.stringify(fixed,null,2)}\n`),'freeze-drift');
    need(!existsSync(join(root,'STARTED.json')) && !existsSync(join(root,'RESULT.json')),'already-attempted');
    const key=readFileSync(secretPath,'utf8').trim();
    need(key.length>=8 && key.length<=8192,'secret-shape');
    save(join(root,'STARTED.json'),{schema_version:'g02.r11-nonjson-header-started/v1',
      request_sha256:bound.request_sha256,started_at:new Date().toISOString()});
    const result=await metadataPost(new URL(endpoint),bound.body,key);
    save(join(root,'RESULT.json'),{schema_version:'g02.r11-nonjson-header-result/v1',
      posture:'transport-metadata-only',request_sha256:bound.request_sha256,
      ...result,provider_usage:'unknown',model_output_preserved:false,
      claim_ceiling:fixed.claim_ceiling});
    process.stdout.write(`${JSON.stringify({http_status:result.http_status,
      content_type:result.content_type,received_bytes:result.received_bytes,
      failure_code:result.failure_code})}\n`);
  }
}

await main();
