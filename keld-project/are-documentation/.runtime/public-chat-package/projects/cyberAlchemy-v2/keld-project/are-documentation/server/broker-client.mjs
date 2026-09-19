import {MODEL, validateBrokerReply, validateModelRequest} from './model-protocol.mjs';

export {MODEL};
const DEFAULT_ENDPOINT = process.env.ARE_INFERENCE_BROKER_ENDPOINT ?? 'http://127.0.0.1:4194/v1/generate';
const DEFAULT_ALLOWED_ORIGINS = new Set(['http://127.0.0.1:4194', 'http://[::1]:4194', 'http://inference-broker:4194']);
const admittedBrokerErrors = new Set(['broker-concurrency-limit', 'broker-hourly-limit', 'broker-token-limit', 'broker-hourly-spend-limit', 'broker-monthly-spend-limit', 'broker-quota-unavailable']);

function admittedEndpoint(value, allowedOrigins) {
  let endpoint;
  try {endpoint = new URL(value);} catch {throw new Error('broker-endpoint-invalid');}
  if (!allowedOrigins.has(endpoint.origin) || endpoint.pathname !== '/v1/generate' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
    throw new Error('broker-endpoint-forbidden');
  }
  return endpoint.href;
}

async function boundedJson(response, maximumBytes = 300000) {
  const declared = response.headers.get('content-length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > maximumBytes)) throw new Error('broker-response-too-large');
  if (!/^application\/json(?:;|$)/i.test(response.headers.get('content-type') ?? '')) throw new Error('broker-content-type-invalid');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('broker-response-invalid');
  const chunks = []; let size = 0;
  for (;;) {
    const {done, value} = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maximumBytes) {await reader.cancel(); throw new Error('broker-response-too-large');}
    chunks.push(value);
  }
  const joined = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) {joined.set(chunk, offset); offset += chunk.byteLength;}
  try {return JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(joined));}
  catch {throw new Error('broker-response-invalid');}
}

export function createBrokerModel({
  endpoint = DEFAULT_ENDPOINT,
  allowedOrigins = DEFAULT_ALLOWED_ORIGINS,
  fetchImpl = globalThis.fetch,
  timeoutMs = 65000,
} = {}) {
  if (!(allowedOrigins instanceof Set) || typeof fetchImpl !== 'function' || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 70000) throw new Error('broker-client-config-invalid');
  const target = admittedEndpoint(endpoint, allowedOrigins);
  return async input => {
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !['messages', 'json', 'signal'].includes(key))) throw new Error('broker-request-invalid');
    const request = validateModelRequest({messages: input?.messages, json: input?.json ?? false});
    const controller = new AbortController();
    const abort = () => controller.abort();
    input?.signal?.addEventListener('abort', abort, {once: true});
    const timer = setTimeout(abort, timeoutMs);
    try {
      if (input?.signal?.aborted) controller.abort();
      const response = await fetchImpl(target, {method: 'POST', redirect: 'error', signal: controller.signal,
        headers: {'content-type': 'application/json', accept: 'application/json'}, body: JSON.stringify(request)});
      if (response.status !== 200) {
        try {
          const failure = await boundedJson(response, 4096);
          if (failure && typeof failure === 'object' && admittedBrokerErrors.has(failure.error)) throw new Error(failure.error);
        } catch (error) {if (admittedBrokerErrors.has(error?.message)) throw error;}
        throw new Error(`broker-http-${response.status}`);
      }
      return validateBrokerReply(await boundedJson(response));
    } catch (error) {
      if (controller.signal.aborted) throw new Error(input?.signal?.aborted ? 'cancelled' : 'deadline-exceeded');
      throw error;
    } finally {
      clearTimeout(timer); input?.signal?.removeEventListener('abort', abort);
    }
  };
}
