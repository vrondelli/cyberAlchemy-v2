import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readSnapshot } from './ontology-v4-adapter.mjs';

export function previewServer(root, snapshot = readSnapshot) {
  let pending;
  return createServer(async (req, res) => {
    const host = `127.0.0.1:${res.socket.localPort}`;
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Cache-Control','no-store');
    if (req.headers.host !== host || (req.headers.origin && req.headers.origin !== `http://${host}`)) {
      res.writeHead(403);res.end('Loopback same-origin only');return;
    }
    if (req.method !== 'GET') {res.writeHead(405,{Allow:'GET'});res.end('Read-only preview');return;}
    try {
      const url = new URL(req.url, `http://${host}`);
      if (url.pathname === '/api/ontology-v4') {
        if (url.search) {res.writeHead(400);res.end('No query parameters');return;}
        pending ??= snapshot().finally(()=>{pending=undefined;});
        const body = await pending;
        res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(body));return;
      }
      const path = await realpath(resolve(root,'.'+decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)));
      if (!path.startsWith(root+sep)) throw new Error('Outside preview');
      const type = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'}[extname(path)];
      if (!type) throw new Error('Unsupported asset');
      const content = await readFile(path);
      res.writeHead(200,{'Content-Type':type});res.end(content);
    } catch {
      if (!res.headersSent) res.writeHead(req.url.startsWith('/api/') ? 503 : 404,{'Content-Type':'application/json'});
      res.end(JSON.stringify({error:'Snapshot or asset unavailable. No fallback data was substituted.'}));
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = await realpath(process.argv[2]);
  await readFile(resolve(root,'index.html'));
  const server = previewServer(root);
  server.listen(0,'127.0.0.1',()=>console.log(`http://127.0.0.1:${server.address().port}/index.html#/ontology`));
}
