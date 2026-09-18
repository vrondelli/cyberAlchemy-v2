import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createModel} from './glm.mjs';
import {validateBrokerReply, validateModelRequest} from './model-protocol.mjs';
import {createDurableBrokerQuota} from './broker-quota.mjs';

const json = (res, status, value) => {
  const body = JSON.stringify(value);
  res.writeHead(status, {'content-type': 'application/json', 'content-length': Buffer.byteLength(body), 'cache-control': 'no-store', 'x-content-type-options': 'nosniff'});
  res.end(body);
};

export function createBrokerHandler({model, quota}) {
  if (typeof model !== 'function') throw new Error('broker-model-required');
  if (!quota || typeof quota.acquire !== 'function') throw new Error('broker-quota-required');
  return async (req, res) => {
    if (req.method === 'GET' && req.url === '/healthz') return json(res, 200, {status: 'ready', provider_calls: 0});
    if (req.method !== 'POST' || req.url !== '/v1/generate') return json(res, 404, {error: 'not-found'});
    if (req.headers['content-type'] !== 'application/json') return json(res, 415, {error: 'json-required'});
    const controller = new AbortController();
    req.once('aborted', () => controller.abort());
    let value;
    try {
      let size = 0; const chunks = [];
      for await (const chunk of req) {size += chunk.length; if (size > 32768) throw new Error('broker-request-too-large'); chunks.push(chunk);}
      value = validateModelRequest(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    } catch (error) {
      return json(res, error?.message === 'broker-request-too-large' ? 413 : 400, {error: 'broker-request-invalid'});
    }
    let lease;
    try {lease = await quota.acquire();}
    catch (error) {
      if (/^broker-(?:concurrency|hourly|token)-limit$/.test(error?.message)) return json(res, 429, {error: error.message});
      return json(res, 503, {error: 'broker-quota-unavailable'});
    }
    try {
      const reply = validateBrokerReply(await model({...value, signal: controller.signal}));
      await lease.complete(reply.receipt.input_tokens + reply.receipt.output_tokens);
      return json(res, 200, reply);
    }
    catch (error) {
      let failure = error;
      if (!/^broker-quota-/.test(failure?.message)) {
        try {await lease.complete();} catch {failure = new Error('broker-quota-unavailable');}
      }
      if (failure?.message === 'broker-quota-unavailable') return json(res, 503, {error: 'broker-quota-unavailable'});
      const code = /^(?:provider-(?:output-limit|response-invalid|usage-invalid|http-[0-9]{3})|deadline-exceeded|request-failed|response-interrupted|cancelled)$/.test(failure?.message) ? failure.message : 'provider-unavailable';
      return json(res, 502, {error: code});
    }
  };
}

export function startBroker({host = '127.0.0.1', port = 4194, model = createModel(), quota = createDurableBrokerQuota()} = {}) {
  if (!['127.0.0.1', '0.0.0.0', '::1', '::'].includes(host) || !Number.isSafeInteger(port) || port < 1024 || port > 65535) throw new Error('broker-listener-invalid');
  const server = createServer(createBrokerHandler({model, quota}));
  server.listen(port, host);
  return server;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {startBroker({host: process.env.ARE_BROKER_HOST ?? '127.0.0.1', port: Number(process.env.ARE_BROKER_PORT ?? 4194)});}
  catch {console.error('Inference broker failed to start; check credential-reference configuration.'); process.exitCode = 1;}
}
