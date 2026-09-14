// Validation-only observation of actual local module/data reads. No host hooks
// are installed. Output is a temporary input to the candidate manifest builder.
import fs from 'node:fs';
import {registerHooks, syncBuiltinESMExports} from 'node:module';
import {fileURLToPath} from 'node:url';
import {resolve, relative, isAbsolute} from 'node:path';
const root = resolve(import.meta.dirname, '../../../../..'), files = new Set();
const read = fs.readFileSync, write = fs.writeFileSync;
function observe(input) {
  if (input instanceof URL) input = fileURLToPath(input);
  if (typeof input !== 'string') return;
  const path = resolve(input), rel = relative(root, path);
  if (rel && !rel.startsWith('..') && !isAbsolute(rel) && !rel.split('/').some(p => p.startsWith('.tmp-'))) files.add(rel);
}
fs.readFileSync = function(path, ...args) {const result = read.call(this, path, ...args); observe(path); return result;};
syncBuiltinESMExports();
registerHooks({load(url, context, next) {const result = next(url, context); if (url.startsWith('file:')) observe(fileURLToPath(url)); return result;}});
process.on('exit', () => {if (process.env.ARE_REVIEW_TRACE_PATH) write(process.env.ARE_REVIEW_TRACE_PATH, JSON.stringify([...files].sort()));});
