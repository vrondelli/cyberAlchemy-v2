import {createServer, request as httpRequest} from 'node:http';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const PRODUCTION_UPSTREAM = new URL('http://public-chat:4193');
const MAX_REQUEST_BYTES = 64 * 1024;
const UPSTREAM_TIMEOUT_MS = 65_000;
const ALLOWED_METHODS = new Set(['GET', 'HEAD', 'POST', 'OPTIONS']);
const REQUEST_HEADER_ALLOWLIST = new Set(['accept', 'accept-encoding', 'content-type', 'origin', 'referer', 'user-agent']);
const RESPONSE_HEADER_ALLOWLIST = new Set([
  'access-control-allow-headers', 'access-control-allow-methods', 'access-control-allow-origin', 'cache-control',
  'content-encoding', 'content-language', 'content-length', 'content-security-policy', 'content-type',
  'cross-origin-opener-policy', 'cross-origin-resource-policy', 'etag', 'last-modified', 'permissions-policy',
  'referrer-policy', 'vary', 'x-content-type-options', 'x-frame-options',
]);

function securityHeaders(contentType = 'text/plain; charset=utf-8') {
  return {
    'content-type': contentType,
    'content-security-policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'no-referrer',
    'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'cross-origin-opener-policy': 'same-origin',
    'cross-origin-resource-policy': 'same-origin',
  };
}

function fail(res, status, message) {
  const body = `${message}\n`;
  res.writeHead(status, {...securityHeaders(), 'content-length': Buffer.byteLength(body), 'cache-control': 'no-store'});
  res.end(body);
}

function validateListener(host, port, publicHost) {
  if (!['127.0.0.1', '0.0.0.0', '::1', '::'].includes(host) || !Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error('edge-listener-invalid');
  }
  if (typeof publicHost !== 'string' || publicHost.length < 1 || publicHost.length > 255 || /[\s/\\@]/u.test(publicHost)) {
    throw new Error('edge-public-host-invalid');
  }
}

function validateTarget(req) {
  const raw = req.url ?? '';
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\') || raw.includes('\0')) return null;
  let target;
  try { target = new URL(raw, 'http://edge.invalid'); } catch { return null; }
  if (target.origin !== 'http://edge.invalid' || target.username || target.password || target.hash) return null;
  if (req.method === 'POST' && target.pathname !== '/api/chat') return null;
  if (req.method === 'OPTIONS' && target.pathname !== '/api/chat') return null;
  return `${target.pathname}${target.search}`;
}

async function readRequestBody(req) {
  const declared = Number(req.headers['content-length'] ?? 0);
  if (!Number.isFinite(declared) || declared < 0 || declared > MAX_REQUEST_BYTES) throw new Error('request-too-large');
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_REQUEST_BYTES) throw new Error('request-too-large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size);
}

function upstreamRequestHeaders(req, publicHost, body) {
  const headers = {host: publicHost, 'content-length': String(body.length), 'x-forwarded-host': publicHost, 'x-forwarded-proto': 'http'};
  for (const [name, value] of Object.entries(req.headers)) {
    if (REQUEST_HEADER_ALLOWLIST.has(name) && value !== undefined) headers[name] = value;
  }
  return headers;
}

function downstreamResponseHeaders(headers) {
  const selected = {};
  for (const [name, value] of Object.entries(headers)) {
    if (RESPONSE_HEADER_ALLOWLIST.has(name) && value !== undefined) selected[name] = value;
  }
  return selected;
}

function proxy(upstream, req, res, target, publicHost, body) {
  return new Promise(resolvePromise => {
    const upstreamRequest = httpRequest({
      protocol: upstream.protocol,
      hostname: upstream.hostname,
      port: upstream.port,
      method: req.method,
      path: target,
      headers: upstreamRequestHeaders(req, publicHost, body),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    }, upstreamResponse => {
      res.writeHead(upstreamResponse.statusCode ?? 502, downstreamResponseHeaders(upstreamResponse.headers));
      upstreamResponse.pipe(res);
      upstreamResponse.once('end', resolvePromise);
      upstreamResponse.once('error', () => { if (!res.destroyed) res.destroy(); resolvePromise(); });
    });
    upstreamRequest.once('error', () => { if (!res.headersSent) fail(res, 502, 'Bad Gateway'); else if (!res.destroyed) res.destroy(); resolvePromise(); });
    if (body.length > 0) upstreamRequest.write(body);
    upstreamRequest.end();
  });
}

export function createEdgeServer({
  host = '127.0.0.1', port = 8080, publicHost = `127.0.0.1:${port}`, upstream = PRODUCTION_UPSTREAM,
} = {}) {
  validateListener(host, port, publicHost);
  if (!(upstream instanceof URL) || upstream.protocol !== 'http:' || upstream.username || upstream.password || upstream.pathname !== '/' || upstream.search || upstream.hash) {
    throw new Error('edge-upstream-invalid');
  }
  return createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/healthz') {
      const body = '{"status":"ready","upstream_calls":0}';
      res.writeHead(200, {...securityHeaders('application/json'), 'content-length': Buffer.byteLength(body), 'cache-control': 'no-store'});
      return res.end(body);
    }
    if (req.headers.host !== publicHost) return fail(res, 421, 'Misdirected Request');
    if (!ALLOWED_METHODS.has(req.method ?? '')) return fail(res, 405, 'Method Not Allowed');
    const target = validateTarget(req);
    if (!target) return fail(res, 400, 'Bad Request');
    try {
      const body = await readRequestBody(req);
      await proxy(upstream, req, res, target, publicHost, body);
    } catch (error) {
      if (!res.headersSent) fail(res, error?.message === 'request-too-large' ? 413 : 400, error?.message === 'request-too-large' ? 'Payload Too Large' : 'Bad Request');
      else if (!res.destroyed) res.destroy();
    }
  });
}

export function startEdgeServer(options = {}) {
  const server = createEdgeServer(options);
  server.listen(options.port ?? 8080, options.host ?? '127.0.0.1');
  return server;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    startEdgeServer({
      host: process.env.ARE_EDGE_HOST ?? '127.0.0.1',
      port: Number(process.env.ARE_EDGE_PORT ?? 8080),
      publicHost: process.env.ARE_CHAT_PUBLIC_HOST ?? '127.0.0.1:14193',
    });
  } catch {
    console.error('Public chat edge failed to start; check listener and public-host configuration.');
    process.exitCode = 1;
  }
}
