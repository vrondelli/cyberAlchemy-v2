import {request as httpsRequest} from 'node:https';
import {lookup as dnsLookup} from 'node:dns/promises';
import {BlockList, isIP} from 'node:net';

const HOST = 'api.z.ai';
const PATH = '/api/paas/v4/chat/completions';
const blocked4 = new BlockList();
const blocked6 = new BlockList();
for (const [address, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24],
  ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16],
  ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
  ['224.0.0.0', 4], ['240.0.0.0', 4],
]) blocked4.addSubnet(address, prefix, 'ipv4');
for (const [address, prefix] of [
  ['::', 128], ['::1', 128], ['::ffff:0:0', 96], ['64:ff9b::', 96],
  ['64:ff9b:1::', 48], ['100::', 64], ['2001::', 32], ['2001:2::', 48],
  ['2001:10::', 28], ['2001:20::', 28], ['2001:db8::', 32], ['2002::', 16],
  ['fc00::', 7], ['fe80::', 10], ['fec0::', 10], ['ff00::', 8],
]) blocked6.addSubnet(address, prefix, 'ipv6');

export async function resolveProviderAddresses(resolver = dnsLookup) {
  let answers;
  try { answers = await resolver(HOST, {all: true, verbatim: true}); }
  catch { throw new Error('provider-dns-invalid'); }
  if (!Array.isArray(answers) || answers.length < 1 || answers.length > 32) throw new Error('provider-dns-invalid');
  const unique = new Map();
  for (const answer of answers) {
    if (!answer || typeof answer !== 'object' || ![4, 6].includes(answer.family) || isIP(answer.address) !== answer.family) throw new Error('provider-dns-invalid');
    const type = answer.family === 4 ? 'ipv4' : 'ipv6';
    if ((answer.family === 4 ? blocked4 : blocked6).check(answer.address, type)) throw new Error('provider-address-forbidden');
    unique.set(`${answer.family}:${answer.address}`, {address: answer.address, family: answer.family});
  }
  return [...unique.values()];
}

// One fixed HTTPS destination, no redirects, no proxy discovery and no URL
// argument. Network policy remains an independent deployment obligation.
export async function postProvider(body, {apiKey, signal, timeoutMs = 60000, maximumResponseBytes = 262144, resolver = dnsLookup}) {
  if (typeof body !== 'string' || Buffer.byteLength(body) > 32768 || typeof apiKey !== 'string' || !apiKey ||
      !Number.isSafeInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60000 ||
      !Number.isSafeInteger(maximumResponseBytes) || maximumResponseBytes < 1 || maximumResponseBytes > 262144) throw new Error('provider-request-invalid');
  const addresses = await resolveProviderAddresses(resolver);
  let selected = 0;
  const lookup = (hostname, options, callback) => {
    if (hostname !== HOST) return callback(new Error('provider-address-forbidden'));
    if (options?.all) return callback(null, addresses);
    const answer = addresses[selected++ % addresses.length];
    callback(null, answer.address, answer.family);
  };
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
      request = httpsRequest({protocol: 'https:', hostname: HOST, servername: HOST, port: 443, path: PATH, method: 'POST', agent: false,
        lookup, autoSelectFamily: true, autoSelectFamilyAttemptTimeout: 250, rejectUnauthorized: true,
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
