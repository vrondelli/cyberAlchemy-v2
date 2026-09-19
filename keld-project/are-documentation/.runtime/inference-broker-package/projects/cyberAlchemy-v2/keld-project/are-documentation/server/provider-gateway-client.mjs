import {request as httpRequest} from 'node:http';

const HOST = 'provider-gateway';
const PORT = 4195;
const PATH = '/v1/provider';

// This client has no URL input, proxy discovery, redirect handling, or secret.
// Docker places the broker and gateway on one dedicated internal network.
export function postProvider(body, {signal, timeoutMs = 60000, maximumResponseBytes = 262144, requestImpl = httpRequest} = {}) {
  if (typeof body !== 'string' || Buffer.byteLength(body) > 32768 ||
      !Number.isSafeInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60000 ||
      !Number.isSafeInteger(maximumResponseBytes) || maximumResponseBytes < 1 || maximumResponseBytes > 262144 ||
      typeof requestImpl !== 'function') {
    throw new Error('provider-request-invalid');
  }
  return new Promise((resolve, reject) => {
    let request, response, settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      if (error) { response?.destroy(); request?.destroy(); reject(error); }
      else resolve(value);
    };
    const fail = code => finish(new Error(code));
    const abort = () => fail('cancelled');
    const timer = setTimeout(() => fail('deadline-exceeded'), timeoutMs);
    signal?.addEventListener('abort', abort, {once: true});
    if (signal?.aborted) return abort();
    try {
      request = requestImpl({host: HOST, port: PORT, path: PATH, method: 'POST', agent: false,
        headers: {'content-type': 'application/json', accept: 'application/json', 'content-length': Buffer.byteLength(body)}}, incoming => {
        response = incoming;
        incoming.on('error', () => fail('response-interrupted'));
        incoming.on('aborted', () => fail('response-interrupted'));
        if (!/^application\/json(?:;|$)/i.test(incoming.headers['content-type'] ?? '')) return fail('provider-response-invalid');
        if (incoming.headers['content-encoding'] && incoming.headers['content-encoding'] !== 'identity') return fail('provider-response-invalid');
        const declared = incoming.headers['content-length'];
        if (declared !== undefined && (!/^\d+$/.test(declared) || Number(declared) > maximumResponseBytes)) return fail('provider-response-invalid');
        const chunks = []; let size = 0;
        incoming.on('data', chunk => { size += chunk.length; if (size > maximumResponseBytes) return fail('provider-response-invalid'); if (!settled) chunks.push(chunk); });
        incoming.on('end', () => {
          if (settled) return;
          try { finish(null, {status: incoming.statusCode, payload: JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(Buffer.concat(chunks))), bytes: size}); }
          catch { fail('provider-response-invalid'); }
        });
      });
      request.on('error', () => fail('request-failed'));
      request.end(body);
    } catch { fail('request-failed'); }
  });
}
