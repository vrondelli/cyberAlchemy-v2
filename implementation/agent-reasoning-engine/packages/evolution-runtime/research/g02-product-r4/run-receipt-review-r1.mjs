// Exposed-only G02 second-agent development. No gold, DSH output, or task retuning.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const packetRoot = '/opt/are/evolution-runtime/g02-r4-reviewer-packets-r1';
const outputRoot = '/opt/are/evolution-runtime/g02-r4-reviewer-development-r1';
const packetSealSha = '11cc658044a9429d4a8a77682460336c578eb65c39db6a5cdc0192a38685682d';
const source = '/opt/are/evolution-runtime/g01-source-combined-candidate-r8';
const transportPath = `${source}/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs`;
const credentialsPath = `${source}/implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/provider-study-v1/calibrate.mjs`;
const g01PairPlan = '/opt/are/evolution-runtime/g01-product-replication-r6/go-cli-1aec1ae3/PAIR-PLAN.json';
const endpoint = 'https://api.z.ai/api/paas/v4/chat/completions';
const sha = value => createHash('sha256').update(value).digest('hex');
const fileSha = path => sha(readFileSync(path));
const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const writeNew = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n', {flag:'wx', mode:0o600});
const need = (condition, reason) => {if (!condition) throw Error(`g02-r4-reviewer.${reason}`);};
const prompt = `You are an independent source-evidence reviewer for a software issue. You see only the issue, the current selected files, and exact source ranges already delivered to the first agent at the pinned base commit. Judge whether the current selection covers the distinct responsible code paths. Return ONLY a JSON object with keys "add_read_indexes" (array of at most five delivered-read indexes not already represented) and "drop_files" (array of at most three currently selected paths). Add a read only when its displayed source directly supports a missing issue requirement or responsible code path. Drop a file only when the displayed evidence clearly does not support the issue. Otherwise leave both arrays empty. Prefer precision; do not add speculative neighbors or all reads. Never invent paths, line ranges, or read indexes. Do not mention benchmark labels or scores.`;

function verifiedPacketSeal() {
  const sealPath = join(packetRoot, 'SEAL.json');
  need(fileSha(sealPath) === packetSealSha, 'packet-seal-drift');
  const seal = readJson(sealPath);
  need(seal.schema_version === 'are.g02-reviewer-packets-seal/v1' && seal.packets?.length === 32, 'packet-seal-invalid');
  for (const row of seal.packets) need(fileSha(row.path) === row.sha256 && row.path.startsWith(`${packetRoot}/`), `packet-drift:${row.pair}`);
  return seal;
}

export function validateReview(value, packet) {
  need(value && !Array.isArray(value) && typeof value === 'object' &&
    Object.keys(value).sort().join(',') === 'add_read_indexes,drop_files', 'response-shape');
  const adds = value.add_read_indexes, drops = value.drop_files;
  need(Array.isArray(adds) && adds.length <= 5 && new Set(adds).size === adds.length &&
    adds.every(x => Number.isSafeInteger(x) && x >= 0 && packet.delivered_reads.some(h => h.index === x)), 'response-adds');
  need(Array.isArray(drops) && drops.length <= 3 && new Set(drops).size === drops.length &&
    drops.every(x => typeof x === 'string' && packet.current_selected_files.includes(x)), 'response-drops');
  return {add_read_indexes:adds, drop_files:drops};
}

function frozen() {
  const seal = verifiedPacketSeal();
  const selfSha = fileSha(new URL(import.meta.url));
  const value = {schema_version:'are.g02-r4-reviewer-development-freeze/v1', posture:'exposed-only-development',
    packet_seal_sha256:packetSealSha, reviewer_script_sha256:selfSha,
    transport_sha256:fileSha(transportPath), credentials_adapter_sha256:fileSha(credentialsPath),
    model:'glm-5.3-flash', endpoint, maximum_calls:32, maximum_output_tokens:1024, retries:0,
    model_timeout_ms:120000, prompt, prompt_sha256:sha(prompt),
    ordered_pairs:seal.packets.map(({cohort,pair,path,sha256})=>({cohort,pair,path,sha256})),
    invalid_output_policy:'preserve-original-prediction-and-count-invalid',
    claim_ceiling:'Exposed development diagnostic only; not a fresh matched holdout or superiority claim.'};
  return value;
}

function credentialPath() {
  const plan = readJson(g01PairPlan);
  const arm = readJson(plan.arms.candidate.freeze_path);
  const config = readJson(arm.config_path);
  need(config.model === 'glm-5.3-flash' && typeof config.credential_path === 'string', 'credential-binding');
  return config.credential_path;
}

function ensureCampaignIdle() {
  const state = execFileSync('systemctl', ['show','are-g01-r6-campaign.service','-p','ActiveState','--value'], {encoding:'utf8'}).trim();
  need(state !== 'active', 'g01-capacity-busy');
}

async function run() {
  ensureCampaignIdle();
  const freezePath = join(outputRoot, 'FREEZE.json');
  const expected = frozen();
  need(fileSha(freezePath) === sha(JSON.stringify(expected, null, 2) + '\n'), 'freeze-drift');
  const {credentials} = await import(credentialsPath);
  const {postOnce, stable, MODEL} = await import(transportPath);
  need(MODEL === expected.model, 'model-drift');
  const {registry, reference} = credentials(credentialPath());
  let completed = 0;
  for (const binding of expected.ordered_pairs) {
    const packet = readJson(binding.path);
    const itemRoot = join(outputRoot, `${binding.cohort}-${binding.pair}`);
    need(!existsSync(itemRoot), `prior-attempt:${binding.pair}`);
    mkdirSync(itemRoot, {mode:0o700});
    const body = stable({model:MODEL, messages:[{role:'system',content:prompt},
      {role:'user',content:JSON.stringify(packet)}], tools:[], stream:false, max_tokens:1024,
      thinking:{type:'enabled',clear_thinking:false}, reasoning_effort:'low'});
    need(Buffer.byteLength(body) <= 262144, 'request-too-large');
    const requestSha = sha(body);
    writeNew(join(itemRoot,'STARTED.json'), {pair:binding.pair, packet_sha256:binding.sha256,
      request_sha256:requestSha, started_at:new Date().toISOString()});
    const started = Date.now();
    let response, failure = null;
    try {
      await registry.consume({secret_ref:reference, consumer_id:'glm-flash-transport', request_digest:requestSha,
        consumer:async material=>{response = await postOnce(new URL(endpoint), body,
          {apiKey:Buffer.from(material).toString('utf8'), timeout_ms:120000, maximum_response_bytes:262144});}});
    } catch (error) {failure = error.code ?? 'transport-or-credential-failed';}
    const payload = response?.payload;
    const choice = payload?.choices?.[0];
    const content = choice?.message?.content;
    let review = null, validationError = null;
    if (!failure && response?.status === 200 && choice?.finish_reason === 'stop' && typeof content === 'string') {
      try {review = validateReview(JSON.parse(content), packet);}
      catch (error) {validationError = String(error.message).slice(0,160);}
    }
    const result = {schema_version:'are.g02-r4-reviewer-development-response/v1',
      pair:binding.pair, cohort:binding.cohort, packet_sha256:binding.sha256, request_sha256:requestSha,
      status:review?'valid':'invalid', http_status:response?.status??null,
      provider_code:String(payload?.error?.code??payload?.code??''), finish_reason:choice?.finish_reason??null,
      failure_code:failure, validation_error:validationError, elapsed_ms:Date.now()-started,
      response_bytes:response?.bytes??0, usage:payload?.usage??null,
      content:typeof content==='string'?content:null, review};
    writeNew(join(itemRoot,'RESPONSE.json'), result);
    completed++;
    process.stdout.write(`${JSON.stringify({completed, pair:binding.pair, status:result.status, usage:result.usage?{prompt_tokens:result.usage.prompt_tokens,completion_tokens:result.usage.completion_tokens}:null})}\n`);
  }
  writeNew(join(outputRoot,'RUN-RESULT.json'), {schema_version:'are.g02-r4-reviewer-development-run/v1',
    status:'completed-exposed-diagnostic', completed, expected:expected.ordered_pairs.length,
    response_paths:expected.ordered_pairs.map(x=>join(outputRoot,`${x.cohort}-${x.pair}`,'RESPONSE.json')),
    claim_ceiling:expected.claim_ceiling});
}

if (process.argv[2] === 'freeze') {
  need(!existsSync(outputRoot), 'output-root-exists');
  const value = frozen();
  mkdirSync(outputRoot, {mode:0o700});
  const path = join(outputRoot,'FREEZE.json');
  writeNew(path, value);
  process.stdout.write(`${JSON.stringify({status:'frozen-no-model', path, sha256:fileSha(path), pairs:value.ordered_pairs.length})}\n`);
} else if (process.argv[2] === 'run') {
  await run();
} else if (process.argv[2] !== undefined) throw Error('usage: run-receipt-review-r1.mjs freeze|run');
