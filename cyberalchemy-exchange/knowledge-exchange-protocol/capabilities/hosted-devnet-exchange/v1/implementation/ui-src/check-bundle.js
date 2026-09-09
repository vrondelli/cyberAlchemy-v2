import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { build } from "esbuild";

const result = await build({
  entryPoints: [new URL("./app.js", import.meta.url).pathname],
  bundle: true,
  minify: true,
  format: "iife",
  globalName: "KepExchange",
  write: false,
});
const current = await readFile(new URL("../static/assets/app.js", import.meta.url));
assert.deepEqual(
  current,
  Buffer.from(result.outputFiles[0].contents),
  "static/assets/app.js is stale; run npm run build:ui",
);
console.log("PASS browser bundle matches the exact UI source");

const files = await build({entryPoints:[new URL('./file-console.js',import.meta.url).pathname],bundle:true,minify:true,format:'iife',write:false});
assert.deepEqual(await readFile(new URL('../static/assets/files.js',import.meta.url)),Buffer.from(files.outputFiles[0].contents),'static/assets/files.js is stale; run npm run build:files');
console.log('PASS file console bundle matches its source');

const consoleBundle = await build({entryPoints:[new URL('./console-experience.js',import.meta.url).pathname],bundle:true,minify:true,format:'iife',write:false});
assert.deepEqual(await readFile(new URL('../static/assets/console-experience.js',import.meta.url)),Buffer.from(consoleBundle.outputFiles[0].contents),'console bundle is stale; run npm run build:console');
console.log('PASS connected console bundle matches its source');
