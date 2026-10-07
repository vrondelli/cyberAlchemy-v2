// No-model index inside the 1 GiB benchmark image after offline source checkout.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {pathToFileURL} from 'node:url';

const [root, commit] = process.argv.slice(2);
const source = '/probe/base-overlay.mjs';
const expected = '1389c7a3fbdc096463787614778c4b9087104ef252c54659d542c68874e91c89';
const digest = createHash('sha256').update(readFileSync(source)).digest('hex');
if (root !== '/out/are' || !/^[0-9a-f]{40}$/.test(commit) || digest !== expected)
  throw Error('g02-r7-container-index.invalid-input-or-source');
const {createRankedSourceAcquisition} = await import(pathToFileURL(source).href);
const start = performance.now();
const index = createRankedSourceAcquisition({root, base_commit: commit,
  problem_statement: 'source index capacity probe', maximum_index_bytes: 64 * 1024 * 1024});
const value = index.query('zxqvneverappears');
console.log(JSON.stringify({budget_mib: 64, index_source_sha256: digest,
  indexed_files: value.indexed_files, indexed_bytes: value.indexed_bytes,
  elapsed_ms: performance.now() - start,
  rss_bytes: process.memoryUsage().rss,
  heap_used_bytes: process.memoryUsage().heapUsed}));
