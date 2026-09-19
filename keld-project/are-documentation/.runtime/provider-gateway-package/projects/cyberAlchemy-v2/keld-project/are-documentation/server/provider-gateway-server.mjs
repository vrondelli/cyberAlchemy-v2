import {createServer} from 'node:http';
import {lstatSync, readFileSync} from 'node:fs';
import {isAbsolute, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {validateProviderRequest} from './model-protocol.mjs';
import {postProvider} from './provider-transport.mjs';

const json = (res, status, value) => {
  const body = JSON.stringify(value);
  res.writeHead(status, {'content-type': 'application/json', 'content-length': Buffer.byteLength(body), 'cache-control': 'no-store', 'x-content-type-options': 'nosniff'});
  res.end(body);
};

export function readCredential(path) {
  if (typeof path !== 'string' || !isAbsolute(path) || path.includes('\0')) throw new Error('credential-path-invalid');
  const details = lstatSync(path);
  if (!details.isFile() || details.isSymbolicLink() || details.size < 1 || details.size > 4096) throw new Error('credential-file-invalid');
  const bytes = readFileSync(path);
  try {
    let text = new TextDecoder('utf-8', {fatal: true}).decode(bytes);
    if (text.endsWith('\n')) text = text.slice(0, -1);
    if (!text || /[\u0000-\u0020\u007f]/.test(text)) throw new Error('credential-material-invalid');
    return text;
  } finally { bytes.fill(0); }
}

export function createProviderGatewayHandler({apiKey, post = postProvider} = {}) {
  if (typeof apiKey !== 'string' || !apiKey || /[\u0000-\u0020\u007f]/.test(apiKey) || typeof post !== 'function') throw new Error('provider-gateway-config-invalid');
  return async (req, res) => {
    if (req.method === 'GET' && req.url === '/healthz') return json(res, 200, {status: 'ready', provider_calls: 0});
    if (req.method !== 'POST' || req.url !== '/v1/provider') return json(res, 404, {error: 'not-found'});
    if (req.headers['content-type'] !== 'application/json') return json(res, 415, {error: 'json-required'});
    const controller = new AbortController();
    req.once('aborted', () => controller.abort());
    let body;
    try {
      let size = 0; const chunks = [];
      for await (const chunk of req) { size += chunk.length; if (size > 32768) throw new Error('provider-request-too-large'); chunks.push(chunk); }
      body = JSON.stringify(validateProviderRequest(JSON.parse(Buffer.concat(chunks).toString('utf8'))));
    } catch (error) {
      return json(res, error?.message === 'provider-request-too-large' ? 413 : 400, {error: 'provider-request-invalid'});
    }
    try {
      const result = await post(body, {apiKey, signal: controller.signal});
      if (!result || !Number.isInteger(result.status) || result.status < 200 || result.status > 599 || !Object.hasOwn(result, 'payload')) {
        throw new Error('provider-response-invalid');
      }
      return json(res, result.status, result.payload);
    } catch (error) {
      const code = /^(?:deadline-exceeded|request-failed|response-interrupted|cancelled|provider-(?:address-forbidden|dns-invalid|response-invalid))$/.test(error?.message)
        ? error.message : 'provider-unavailable';
      return json(res, 502, {error: code});
    }
  };
}

export function startProviderGateway({host = '127.0.0.1', port = 4195,
  credentialPath = process.env.ARE_GLM_API_KEY_FILE ?? '/run/secrets/model_api_key', post = postProvider} = {}) {
  if (!['127.0.0.1', '0.0.0.0', '::1', '::'].includes(host) || !Number.isSafeInteger(port) || port < 1024 || port > 65535) throw new Error('provider-gateway-listener-invalid');
  const server = createServer(createProviderGatewayHandler({apiKey: readCredential(credentialPath), post}));
  server.listen(port, host);
  return server;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try { startProviderGateway({host: process.env.ARE_PROVIDER_GATEWAY_HOST ?? '127.0.0.1', port: Number(process.env.ARE_PROVIDER_GATEWAY_PORT ?? 4195)}); }
  catch { console.error('Provider gateway failed to start; check dedicated credential and network configuration.'); process.exitCode = 1; }
}
