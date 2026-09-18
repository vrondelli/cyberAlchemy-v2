import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {resolve, sep} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {chatMiddleware} from './http.mjs';
import {createBrokerModel} from './broker-client.mjs';

const MIME = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'], ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'], ['.svg', 'image/svg+xml'], ['.png', 'image/png'], ['.webp', 'image/webp'],
  ['.woff2', 'font/woff2'], ['.ico', 'image/x-icon'],
]);
const CSP = "default-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data:; connect-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'";

function extension(path) {
  const index = path.lastIndexOf('.');
  return index < 0 ? '' : path.slice(index);
}

function securityHeaders(contentType) {
  return {'content-type': contentType, 'content-security-policy': CSP, 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY',
    'referrer-policy': 'no-referrer', 'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'cross-origin-opener-policy': 'same-origin', 'cross-origin-resource-policy': 'same-origin'};
}

export function createChatServer({
  host = '127.0.0.1', port = 4193, publicOrigin = `http://127.0.0.1:${port}`,
  publicRoot = fileURLToPath(new URL('../dist/', import.meta.url)), model = createBrokerModel(), configurationError = false,
} = {}) {
  if (!['127.0.0.1', '0.0.0.0', '::1', '::'].includes(host) || !Number.isSafeInteger(port) || port < 1 || port > 65535) throw new Error('chat-listener-invalid');
  let origin;
  try {origin = new URL(publicOrigin);} catch {throw new Error('chat-origin-invalid');}
  if (origin.origin !== publicOrigin || !['http:', 'https:'].includes(origin.protocol)) throw new Error('chat-origin-invalid');
  const root = resolve(publicRoot);
  const middleware = chatMiddleware({model, configurationError, port, allowedOrigins: [origin.origin]});
  const server = createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/healthz') {
      const body = '{"status":"ready","provider_calls":0}';
      res.writeHead(200, {...securityHeaders('application/json'), 'content-length': Buffer.byteLength(body), 'cache-control': 'no-store'});
      return res.end(body);
    }
    if (req.headers.host !== origin.host) {res.writeHead(421, securityHeaders('text/plain; charset=utf-8')); return res.end('Misdirected Request');}
    await middleware(req, res, async () => {
      if (!['GET', 'HEAD'].includes(req.method ?? '')) {res.writeHead(405, securityHeaders('text/plain; charset=utf-8')); return res.end('Method Not Allowed');}
      let pathname;
      try {pathname = decodeURIComponent(new URL(req.url ?? '/', origin).pathname);} catch {res.writeHead(400, securityHeaders('text/plain; charset=utf-8')); return res.end('Bad Request');}
      if (pathname.includes('\0') || pathname.includes('\\')) {res.writeHead(400, securityHeaders('text/plain; charset=utf-8')); return res.end('Bad Request');}
      const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      const target = resolve(root, relativePath);
      if (target !== root && !target.startsWith(root + sep)) {res.writeHead(404, securityHeaders('text/plain; charset=utf-8')); return res.end('Not Found');}
      try {
        const details = await stat(target);
        if (!details.isFile()) throw new Error('not-file');
        const body = await readFile(target);
        const cache = relativePath === 'index.html' ? 'no-store' : 'public, max-age=31536000, immutable';
        res.writeHead(200, {...securityHeaders(MIME.get(extension(target)) ?? 'application/octet-stream'), 'content-length': body.length, 'cache-control': cache});
        return res.end(req.method === 'HEAD' ? undefined : body);
      } catch {res.writeHead(404, securityHeaders('text/plain; charset=utf-8')); return res.end('Not Found');}
    });
  });
  server.once('close', middleware.close);
  return server;
}

export function startChatServer(options = {}) {
  const server = createChatServer(options);
  server.listen(options.port ?? 4193, options.host ?? '127.0.0.1');
  return server;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const port = Number(process.env.ARE_CHAT_PORT ?? 4193);
    startChatServer({host: process.env.ARE_CHAT_HOST ?? '127.0.0.1', port, publicOrigin: process.env.ARE_CHAT_PUBLIC_ORIGIN ?? `http://127.0.0.1:${port}`});
  } catch {console.error('Public chat failed to start; check listener, origin, broker, and packaged assets.'); process.exitCode = 1;}
}
