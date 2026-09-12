import {reasoningEvidence,retainedReasoning} from '../accounting-v1/accounting.mjs';
// Isolated pressure guard; upstream transport otherwise unchanged. Open questions: PLAN.md.
import {secretResolutionFailure} from '../../../packages/coding-agent-runtime/secret-provider.mjs';
import {createHash, randomUUID} from 'node:crypto';
import {existsSync, lstatSync, readFileSync, openSync, writeFileSync, fsyncSync, closeSync, renameSync, realpathSync} from 'node:fs';
import {join} from 'node:path';
import {request as httpRequest} from 'node:http';
import {request as httpsRequest} from 'node:https';
import {createStatelessRecyclingTransport, createBoundedRecoveryRecyclingTransport} from '../../../packages/coding-agent-runtime/context-recycling.mjs';
import {projectSecretReference} from '../../../packages/coding-agent-runtime/secret-provider.mjs';

export const MODEL = 'glm-5.3-flash';
export const stable = value => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
export const hash = value => createHash('sha256').update(typeof value === 'string' ? value : stable(value)).digest('hex');
const integer = value => Number.isSafeInteger(value) && value >= 0;
export class GlmError extends Error {
  constructor(code, receipt = null) { super(`glm.${code}`); this.code = code; this.receipt = receipt; }
}
export const need = (ok, code) => { if (!ok) throw new GlmError(code); };

function endpoint(value) {
  let url; try { url = new URL(value); } catch { throw new GlmError('endpoint-invalid'); }
  need(!url.username && !url.password && !url.search && !url.hash, 'endpoint-invalid');
  need(url.origin === 'https://api.z.ai' || (url.protocol === 'http:' && ['127.0.0.1', '[::1]'].includes(url.hostname)), 'endpoint-forbidden');
  return url;
}

// No redirects, pooling or implicit retry. Deadline covers the entire response.
export function postOnce(url, body, {apiKey, timeout_ms, maximum_response_bytes, signal}) {
  return new Promise((resolve, reject) => {
    let req, response, settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true; clearTimeout(timer); signal?.removeEventListener('abort', abort);
      if (error) { response?.destroy(); req?.destroy(); reject(error); } else resolve(value);
    };
    const fail = code => finish(new GlmError(code));
    const abort = () => fail('cancelled');
    const timer = setTimeout(() => fail('deadline-exceeded'), timeout_ms);
    signal?.addEventListener('abort', abort, {once: true});
    if (signal?.aborted) return abort();
    const headers = {'content-type': 'application/json', accept: 'application/json', 'content-length': Buffer.byteLength(body)};
    if (apiKey !== null) headers.authorization = `Bearer ${apiKey}`;
    try {
      req = (url.protocol === 'https:' ? httpsRequest : httpRequest)(url, {method: 'POST', agent: false, headers}, incoming => {
        response = incoming;
        incoming.on('error', () => fail('response-interrupted'));
        incoming.on('aborted', () => fail('response-interrupted'));
        if (!/^application\/json(?:;|$)/i.test(incoming.headers['content-type'] ?? '')) return fail('content-type-invalid');
        if (incoming.headers['content-encoding'] && incoming.headers['content-encoding'] !== 'identity') return fail('encoding-unsupported');
        const declared = incoming.headers['content-length'];
        if (declared !== undefined && (!/^\d+$/.test(declared) || Number(declared) > maximum_response_bytes)) return fail('response-too-large');
        const chunks = []; let size = 0;
        incoming.on('data', chunk => {
          size += chunk.length;
          if (size > maximum_response_bytes) return fail('response-too-large');
          if (!settled) chunks.push(chunk);
        });
        incoming.on('end', () => {
          if (settled) return;
          try {
            const payload = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(Buffer.concat(chunks)));
            finish(null, {status: incoming.statusCode, payload, bytes: size});
          } catch { fail('response-json-invalid'); }
        });
      });
      req.on('error', () => fail('request-failed'));
      req.end(body);
    } catch { fail('request-failed'); }
  });
}

export function createGlmClient({api_key_ref, secret_registry,
  chat_endpoint = 'https://api.z.ai/api/paas/v4/chat/completions',
  tokenizer_endpoint = 'https://api.z.ai/api/paas/v4/tokenizer',
  maximum_output_tokens = 2048, maximum_requests = 12, timeout_ms = 30000,
  maximum_request_bytes = 131072, maximum_response_bytes = 262144,
  maximum_model_retries = 0, native_submission = false, model_timeout_ms = timeout_ms, final_timeout_ms = model_timeout_ms, request_budget = 'standard-v1', token_margin = 256, reasoning_effort = 'low', final_reasoning_effort = reasoning_effort, signal} = {}) {
  const chat = endpoint(chat_endpoint), tokenizer = endpoint(tokenizer_endpoint);
  need(chat.pathname.endsWith('/chat/completions') && tokenizer.pathname.endsWith('/tokenizer') && chat.origin === tokenizer.origin, 'endpoint-pair-invalid');
  for (const n of [maximum_output_tokens, maximum_requests, timeout_ms, maximum_request_bytes, maximum_response_bytes, token_margin]) need(integer(n) && n > 0, 'limits-invalid');
  need(integer(maximum_model_retries)&&maximum_model_retries<=2,'model-retry-budget-invalid');
  need(['standard-v1','paging-v1','diagnostic-v1','diagnostic-latency-v1','holdout-window-v1','contextbench-budget-v1','contextbench-deferral-v1'].includes(request_budget),'request-budget-invalid');
  need(maximum_output_tokens <= 2048 && maximum_requests <= (['contextbench-budget-v1','contextbench-deferral-v1'].includes(request_budget)?96:['diagnostic-v1','diagnostic-latency-v1','holdout-window-v1'].includes(request_budget)?24:request_budget==='paging-v1'?16:12) && timeout_ms <= 30000, 'limits-exceed-candidate');
  need(maximum_request_bytes <= (['holdout-window-v1','contextbench-budget-v1','contextbench-deferral-v1'].includes(request_budget)?262144:131072) && maximum_response_bytes <= 262144 && token_margin <= 4096, 'limits-exceed-candidate');
  need(['low', 'high', 'max'].includes(reasoning_effort), 'reasoning-effort-invalid');
  const timeoutCeiling=['contextbench-budget-v1','contextbench-deferral-v1'].includes(request_budget)?300000:['diagnostic-latency-v1','holdout-window-v1'].includes(request_budget)?120000:60000;
  need(integer(model_timeout_ms)&&model_timeout_ms>=timeout_ms&&model_timeout_ms<=timeoutCeiling,'model-timeout-invalid');
  need(integer(final_timeout_ms)&&final_timeout_ms>=model_timeout_ms&&final_timeout_ms<=timeoutCeiling,'final-timeout-invalid');
  need(typeof native_submission==='boolean','native-submission-invalid');
  need(['low','high','max'].includes(final_reasoning_effort),'final-reasoning-effort-invalid');
  const authenticated = api_key_ref !== undefined || secret_registry !== undefined;
  need(chat.protocol === 'http:' || authenticated, 'credentials-required');
  need(!authenticated || (api_key_ref && typeof secret_registry?.consume === 'function'), 'credentials-incomplete');
  const reference = authenticated ? projectSecretReference(api_key_ref) : null;
  const maximum_tokenizer_requests = request_budget === 'contextbench-deferral-v1' ? 3 * (maximum_requests + 1) : maximum_requests * 2;
  const identity = hash({version: 1, accounting_policy: 'retained-reasoning-v1', model: MODEL, chat: chat.href, tokenizer: tokenizer.href, maximum_output_tokens,
    maximum_requests, timeout_ms, maximum_request_bytes, maximum_response_bytes, token_margin, reasoning_effort, reference,...(maximum_model_retries?{maximum_model_retries}:{}),...(model_timeout_ms!==timeout_ms?{model_timeout_ms}:{}),...(final_reasoning_effort!==reasoning_effort?{final_reasoning_effort}:{}),...(native_submission?{native_submission}:{}),...(final_timeout_ms!==timeout_ms?{final_timeout_ms}:{}),...(request_budget==='contextbench-deferral-v1'?{request_budget,maximum_tokenizer_requests}:{}),...(['paging-v1','diagnostic-v1','diagnostic-latency-v1','holdout-window-v1'].includes(request_budget)?{request_budget}:{})});
  const measurements = new Map();
  const receipts = [];
  let modelCalls = 0, tokenizerCalls = 0, modelRequests = 0, retryCalls = 0, activeAttempt = 0;
  const logicalReceipts = () => maximum_model_retries ? receipts.filter(r => r.kind !== 'model' || r.attempt_index === 1 || !receipts.some(other => other.kind === 'model' && other.model_request_sequence === r.model_request_sequence && other.attempt_index === 1)) : receipts;
  const transientReceipt = r => r?.kind==='model' && r.dispatched===true && !r.secret_resolution_failure &&
    (['deadline-exceeded','request-failed','response-interrupted'].includes(r.failure_code) ||
      ([500,502,503,504].includes(r.status)&&[null,'500'].includes(r.provider_code)));
  function checkRecoveryAccounting(items) {
    let logical = 0, retries = 0, previous;
    for (const r of items) if(r.kind === 'model') {
      if(r.attempt_index === 0) { logical++; need(r.model_request_sequence === logical, 'ledger-retry-integrity'); }
      else {
        need(r.attempt_index === 1 && previous?.attempt_index === 0 && previous.retryable === true && transientReceipt(previous)
          && r.model_request_sequence === logical && r.request_sha256 === previous.request_sha256, 'ledger-retry-integrity'); retries++;
      }
      need(r.automatic_retries === r.attempt_index, 'ledger-retry-integrity'); previous = r;
    }
    need(logical <= maximum_requests && retries <= maximum_model_retries, 'ledger-retry-integrity');
    return {logical,retries};
  }
  let ledger = null;
  function persistLedger(phase) {
    if (!ledger) return;
    const value = {version: 1, binding: ledger.binding, identity, phase,
      model_calls: modelCalls, tokenizer_calls: tokenizerCalls,...(maximum_model_retries?{model_requests:modelRequests}:{}), receipts};
    const temporary = `${ledger.path}.${randomUUID()}.tmp`;
    const fd = openSync(temporary, 'wx', 0o600);
    try { writeFileSync(fd, stable({...value, ledger_digest: hash(value)})); fsyncSync(fd); }
    finally { closeSync(fd); }
    renameSync(temporary, ledger.path);
    const directory = openSync(ledger.root, 'r');
    try { fsyncSync(directory); } finally { closeSync(directory); }
    ledger.phase = phase;
  }
  // Called only by the agent while holding the recycler's exclusive writer lock.
  // This auxiliary ledger binds attempt accounting to the same exact run scope.
  function bindRunLedger({directory, binding, require_existing = false}) {
    need(typeof binding === 'string' && /^[a-f0-9]{64}$/.test(binding), 'ledger-binding-invalid');
    const root = realpathSync(directory), path = join(root, 'glm-transport-ledger.json');
    need(!ledger || (ledger.path === path && ledger.binding === binding), 'ledger-rebind-forbidden');
    need(existsSync(join(root, 'writer.lock')), 'ledger-lock-required');
    if (existsSync(path)) {
      need(lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink(), 'ledger-file-invalid');
      let value;
      try { value = JSON.parse(readFileSync(path, 'utf8')); } catch { throw new GlmError('ledger-integrity'); }
      const {ledger_digest, ...body} = value;
      need(hash(body) === ledger_digest && body.version === 1, 'ledger-integrity');
      need(body.binding === binding && body.identity === identity, 'ledger-binding-drift');
      need(body.phase === 'idle', 'ledger-uncertain-or-failed');
      need(integer(body.model_calls) && body.model_calls <= maximum_requests + maximum_model_retries &&
        integer(body.tokenizer_calls) && body.tokenizer_calls <= maximum_tokenizer_requests &&
        Array.isArray(body.receipts) && body.receipts.length === body.model_calls + body.tokenizer_calls &&
        body.receipts.filter(r => r.kind === 'model').length === body.model_calls &&
        body.receipts.filter(r => r.kind === 'tokenizer').length === body.tokenizer_calls, 'ledger-integrity');
      need((modelCalls === 0 && tokenizerCalls === 0 && receipts.length === 0) ||
        (modelCalls === body.model_calls && tokenizerCalls === body.tokenizer_calls && stable(receipts) === stable(body.receipts)), 'ledger-client-already-used');
      if(maximum_model_retries) { const counted=checkRecoveryAccounting(body.receipts); need(body.model_requests===counted.logical&&body.model_calls===counted.logical+counted.retries,'ledger-retry-integrity'); modelRequests=counted.logical; retryCalls=counted.retries; }
      else modelRequests=body.model_calls;
      modelCalls = body.model_calls; tokenizerCalls = body.tokenizer_calls;
      receipts.splice(0, receipts.length, ...body.receipts);
      ledger = {root, path, binding, phase: 'idle'};
    } else {
      need(!require_existing, 'ledger-missing');
      need(modelCalls === 0 && tokenizerCalls === 0 && receipts.length === 0, 'ledger-client-already-used');
      ledger = {root, path, binding, phase: 'idle'};
      persistLedger('idle');
    }
  }
  function reserveAttempt(kind) {
    need(!ledger || ledger.phase === 'idle', 'ledger-uncertain-or-failed');
    if (kind === 'model') { modelCalls++; modelRequests++; activeAttempt=0; } else tokenizerCalls++;
    // A crash from this point poisons resume, including tokenizer-only attempts.
    if (ledger) ledger.phase = `${kind}-pending`;
    persistLedger(`${kind}-pending`);
  }
  async function attempted(kind, operation) {
    reserveAttempt(kind);
    try {
      const result = await operation();
      persistLedger('idle');
      return result;
    } catch (error) {
      const receipt=error?.receipt;
      const accountedIncomplete=kind==='model'&&error instanceof GlmError&&error.code==='incomplete-output'&&receipt===receipts.at(-1)&&
        receipt.kind==='model'&&receipt.dispatched===true&&receipt.status===200&&receipt.finish_reason==='length'&&
        integer(receipt.input_tokens)&&integer(receipt.output_tokens)&&receipt.output_tokens<=maximum_output_tokens&&!receipt.failure_code;
      if (ledger) ledger.phase = accountedIncomplete?'idle':'failed';
      persistLedger(accountedIncomplete?'idle':'failed');
      throw error;
    }
  }
  async function send(url, object, kind) {
    const selectedTimeout = kind==='model'&&Array.isArray(object.tools)&&(object.tools.length===0||(native_submission&&object.tools.length===1&&object.tools[0]?.function?.name==='submit_patch_candidate'))?final_timeout_ms:kind==='model'?model_timeout_ms:timeout_ms;
    const body = stable(object);
    need(Buffer.byteLength(body) <= maximum_request_bytes, 'request-too-large');
    let response, failure, resolutionFailure, sent = false, dispatched = false, active = true;
    const started = Date.now();
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, {once: true});
    if(signal?.aborted)controller.abort();
    const invoke = async material => {
      need(active && !sent, 'duplicate-credential-dispatch'); sent = true; dispatched = !controller.signal.aborted;
      try {
        response = await postOnce(url, body, {apiKey: material === null ? null : Buffer.from(material).toString('utf8'), timeout_ms:selectedTimeout, maximum_response_bytes, signal: controller.signal});
      } catch (error) { failure = error; }
    };
    try {
      if (authenticated) await secret_registry.consume({secret_ref: api_key_ref, consumer_id: 'glm-flash-transport', request_digest: hash(body), consumer: invoke});
      else await invoke(null);
    } catch (error) { if (!failure) { resolutionFailure = secretResolutionFailure(error); failure = new GlmError('secret-resolution-failed'); } }
    finally { active = false; controller.abort(); signal?.removeEventListener('abort', abort); }
    const code = response?.payload?.error?.code ?? response?.payload?.code;
    const providerCode = /^\d{3,6}$/.test(String(code)) ? String(code) : null;
    const receipt = {kind, model: MODEL, request_sha256: hash(body), status: response?.status ?? null,
      ...(resolutionFailure ? {secret_resolution_failure: resolutionFailure} : {}),
      latency_ms: Date.now() - started, timeout_ms:selectedTimeout, response_bytes: response?.bytes ?? 0, provider_code: providerCode,
      ...(kind==='model'?{reasoning_effort:object.reasoning_effort}:{}),...(kind==='model'&&maximum_model_retries?{model_request_sequence:modelRequests,attempt_index:activeAttempt}:{}),dispatched, automatic_retries: kind==='model'?activeAttempt:0, redirects_followed: 0, authority_effect: 'none'};
    receipts.push(receipt);
    if (failure) { receipt.failure_code=failure instanceof GlmError ? failure.code : 'request-failed'; throw new GlmError(receipt.failure_code, receipt); }
    need(response, 'response-missing');
    if (response.status !== 200) {
      const category = providerCode === '1113' ? 'billing-unavailable' : [401,403].includes(response.status) ? 'authentication-or-permission' : response.status === 429 ? 'rate-limited' : 'http-error';
      throw new GlmError(category, receipt);
    }
    return {payload: response.payload, receipt};
  }
  function bodyFor(prompt) {
    const value = JSON.parse(prompt);
    need(value && Array.isArray(value.messages) && value.messages.length > 0 && Array.isArray(value.tools), 'wire-input-invalid');
    need(Object.keys(value).every(k => ['messages','tools'].includes(k)), 'wire-input-invalid');
    return {...value, model: MODEL, stream: false, max_tokens: maximum_output_tokens,
      thinking: {type: 'enabled', clear_thinking: false}, reasoning_effort:native_submission&&value.tools.length===1&&value.tools[0]?.function?.name==='submit_patch_candidate'?final_reasoning_effort:reasoning_effort};
  }
  const createTransport = maximum_model_retries ? options => createBoundedRecoveryRecyclingTransport({...options,request_bounded:options.request_once}) : createStatelessRecyclingTransport;
  const transport = createTransport({adapter_id: `glm-flash:${identity}`, source_ref: `glm-flash-v1:${identity}`, maximum_output_tokens,
    async measure_request({prompt}) {
      const body = bodyFor(prompt), key = hash(body);
      const retained=retainedReasoning(body.messages,receipts);
      need(Buffer.byteLength(stable(body)) <= maximum_request_bytes, 'request-too-large');
      if (!measurements.has(key)) {
        need(tokenizerCalls < maximum_tokenizer_requests, 'tokenizer-limit');
        await attempted('tokenizer', async () => {
          const {payload, receipt} = await send(tokenizer, {model: MODEL, messages: body.messages, tools: body.tools}, 'tokenizer');
          const count = payload?.usage?.prompt_tokens;
          need(integer(count), 'tokenizer-count-invalid');
          receipt.input_tokens = count;
          receipt.retained_reasoning_reservation=retained.tokens;receipt.retained_reasoning_occurrences=retained.message_occurrences;
          measurements.set(key, count + token_margin + retained.tokens);
        });
      }
      return measurements.get(key);
    },
    async request_once({prompt, dispatch}) {
      // No synthetic padding in the holdout matrix; engine admission enforces the selected threshold.
      need(dispatch.sequence <= maximum_requests && modelRequests < maximum_requests && modelCalls < maximum_requests+maximum_model_retries, 'model-request-limit');
      const body = bodyFor(prompt), key = hash(body);
      need(measurements.get(key) === dispatch.input_upper_bound, 'measurement-binding-invalid');
      return attempted('model', async () => {
      const firstReceiptIndex=receipts.length;
      let response;
      try { response=await send(chat, body, 'model'); }
      catch(error) {
        const r=error?.receipt;
        const transient=error instanceof GlmError && transientReceipt(r);
        if(!transient||retryCalls>=maximum_model_retries||signal?.aborted)throw error;
        r.retryable=true;
        // Remain pending throughout backoff: a crash can never resume this retry.
        persistLedger('model-pending');
        await new Promise((resolve,reject)=>{
          const abort=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);reject(new GlmError('cancelled'));};
          const timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve();},1000);
          signal?.addEventListener('abort',abort,{once:true}); if(signal?.aborted)abort();
        });
        need(!signal?.aborted,'cancelled');
        need(modelCalls<maximum_requests+maximum_model_retries&&retryCalls<maximum_model_retries,'model-request-limit');
        retryCalls++;modelCalls++;activeAttempt=1;persistLedger('model-pending');
        response=await send(chat, body, 'model');
      }
      const {payload,receipt}=response;
      need(payload?.model === MODEL, 'model-mismatch');
      need(Array.isArray(payload.choices) && payload.choices.length === 1, 'choice-invalid');
      const usage = payload.usage;
      need(integer(usage?.prompt_tokens) && integer(usage?.completion_tokens), 'usage-invalid');
      const reasoning = usage.completion_tokens_details?.reasoning_tokens ?? null;
      const cached = usage.prompt_tokens_details?.cached_tokens ?? null;
      need((reasoning === null || (integer(reasoning) && reasoning <= usage.completion_tokens)) && (cached === null || (integer(cached) && cached <= usage.prompt_tokens)), 'usage-details-invalid');
      Object.assign(receipt, {input_tokens: usage.prompt_tokens, output_tokens: usage.completion_tokens, reasoning_tokens: reasoning, cached_tokens: cached,
        reserved_input_tokens: dispatch.input_upper_bound, output_cap: maximum_output_tokens, finish_reason: payload.choices[0].finish_reason});
      need(usage.prompt_tokens <= dispatch.input_upper_bound, 'input-reservation-exceeded');
      need(usage.completion_tokens <= maximum_output_tokens, 'output-cap-exceeded');
      const {message, finish_reason} = payload.choices[0];
      need(message?.role === 'assistant' && !message.function_call, 'message-invalid');
      need(message.reasoning_content === undefined || typeof message.reasoning_content === 'string', 'reasoning-invalid');
      if (finish_reason === 'length') throw new GlmError('incomplete-output', receipt);
      need(['stop','tool_calls'].includes(finish_reason), 'finish-reason-unsupported');
      if (finish_reason === 'tool_calls') need(Array.isArray(message.tool_calls) && message.tool_calls.length > 0 && message.tool_calls.length <= 8, 'tool-calls-invalid');
      else need(!message.tool_calls && typeof message.content === 'string' && message.content.length > 0, 'final-text-invalid');
      const evidence=reasoningEvidence(message,receipt);if(evidence)receipt.retained_reasoning=evidence;
      return {final_bytes: stable({message, finish_reason}), receipt,...(maximum_model_retries?{attempt_receipts:receipts.slice(firstReceiptIndex)}:{})};
      });
    }});
  return Object.freeze({transport, identity, maximum_requests, maximum_tokenizer_requests, maximum_model_retries, get logical_receipts(){return logicalReceipts();}, request_budget, native_submission, final_reasoning_effort, model_timeout_ms, final_timeout_ms, token_margin, receipts, model: MODEL, bindRunLedger});
}
