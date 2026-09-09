// Preview of the actual Workspace component. Open questions: WORKSPACE-LAUNCH.md#open-questions
import {createServer} from 'node:http';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const [depsArg, outputArg, portArg = '18085'] = process.argv.slice(2);
const deps = resolve(depsArg), output = resolve(outputArg), port = Number(portArg);
assert.ok(Number.isInteger(port) && port >= 1024 && port <= 65535);
const here = dirname(fileURLToPath(import.meta.url)), ui = resolve(here, '../../../runtime/src/features/control-center');
const {build} = await import(pathToFileURL(resolve(deps, 'node_modules/esbuild/lib/main.js')));
mkdirSync(output, {mode: 0o700});
await build({stdin: {contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {TaskLauncher} from ${JSON.stringify(resolve(ui, 'TaskLauncher.tsx'))}; createRoot(document.getElementById('root')).render(<TaskLauncher/>);`, resolveDir: output, loader: 'tsx'},
  nodePaths: [resolve(deps, 'node_modules')], bundle: true, jsx: 'automatic', platform: 'browser', outfile: resolve(output, 'controls.js')});
writeFileSync(resolve(output, 'style.css'), readFileSync(resolve(ui, 'control-center.css')));
writeFileSync(resolve(output, 'index.html'), '<!doctype html><html><head><title>Workspace task controls</title><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body style="background:#141a16;margin:24px;font-family:system-ui"><main id="root" class="luna-workers" style="max-width:620px;margin:auto"></main><script src="/controls.js"></script></body></html>');
writeFileSync(resolve(output, 'MANIFEST.json'), JSON.stringify({files: Object.fromEntries(['index.html', 'controls.js', 'style.css'].map(name => [name, createHash('sha256').update(readFileSync(resolve(output, name))).digest('hex')])), open_questions_ref: 'workspace/plans/luna-vps/runtime/WORKSPACE-LAUNCH.md#open-questions'}, null, 2));
const server = createServer((request, response) => {
  const host = request.headers.host?.split(':')[0];
  if (!['127.0.0.1', 'localhost'].includes(host)) {response.writeHead(403); return response.end();}
  const name = {'/': 'index.html', '/controls.js': 'controls.js', '/style.css': 'style.css'}[request.url];
  if (request.method !== 'GET' || !name) {response.writeHead(404); return response.end();}
  response.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : 'text/html');
  response.setHeader('Cache-Control', 'no-store'); response.end(readFileSync(resolve(output, name)));
});
await new Promise((ok, fail) => {server.once('error', fail); server.listen(port, '127.0.0.1', ok);});
console.log(JSON.stringify({url: `http://127.0.0.1:${port}`, source_component: resolve(ui, 'TaskLauncher.tsx')}));
for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => {server.closeAllConnections(); server.close(() => process.exit(0));});
