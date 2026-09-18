import {request as httpsRequest} from 'node:https';

const HOST = 'api.z.ai';
const PATH = '/api/paas/v4/chat/completions';

// One fixed HTTPS destination, no redirects, no proxy discovery and no URL
// argument. Network policy remains an independent deployment obligation.
export function postProvider(body, {apiKey, signal, timeoutMs = 60000, maximumResponseBytes = 262144}) {
  if (typeof body !== 'string' || Buffer.byteLength(body) > 32768 || typeof apiKey !== 'string' || !apiKey ||
      !Number.isSafeInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60000 ||
      !Number.isSafeInteger(maximumResponseBytes) || maximumResponseBytes < 1 || maximumResponseBytes > 262144) throw new Error('provider-request-invalid');
  return new Promise((resolve, reject) => {
    let request, response, settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true; clearTimeout(timer); signal?.removeEventListener('abort', abort);
      if (error) {response?.destroy(); request?.destroy(); reject(error);} else resolve(value);
    };
    const fail = code => finish(new Error(code));
    const abort = () => fail('cancelled');
    const timer = setTimeout(() => fail('deadline-exceeded'), timeoutMs);
    signal?.addEventListener('abort', abort, {once: true});
    if (signal?.aborted) return abort();
    try {
      request = httpsRequest({protocol: 'https:', hostname: HOST, port: 443, path: PATH, method: 'POST', agent: false,
        headers: {'content-type': 'application/json', accept: 'application/json', authorization: `Bearer ${apiKey}`, 'content-length': Buffer.byteLength(body)}}, incoming => {
        response = incoming;
        incoming.on('error', () => fail('response-interrupted'));
        incoming.on('aborted', () => fail('response-interrupted'));
        if (!/^application\/json(?:;|$)/i.test(incoming.headers['content-type'] ?? '')) return fail('provider-response-invalid');
        if (incoming.headers['content-encoding'] && incoming.headers['content-encoding'] !== 'identity') return fail('provider-response-invalid');
        const declared = incoming.headers['content-length'];
        if (declared !== undefined && (!/^\d+$/.test(declared) || Number(declared) > maximumResponseBytes)) return fail('provider-response-invalid');
        const chunks = []; let size = 0;
        incoming.on('data', chunk => {size += chunk.length; if (size > maximumResponseBytes) return fail('provider-response-invalid'); if (!settled) chunks.push(chunk);});
        incoming.on('end', () => {
          if (settled) return;
          try {finish(null, {status: incoming.statusCode, payload: JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(Buffer.concat(chunks))), bytes: size});}
          catch {fail('provider-response-invalid');}
        });
      });
      request.on('error', () => fail('request-failed'));
      request.end(body);
    } catch {fail('request-failed');}
  });
}
