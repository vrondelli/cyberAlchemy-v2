// No-model, no-gold capacity probe for the pinned G02 r4 base index.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {pathToFileURL} from 'node:url';

const [base, commit, budgetText] = process.argv.slice(2);
const source = '/tmp/are-g02-r4-runs/g02-cross-layer-pr4-own-expansions-preflight-r1/code/base-overlay.mjs';
const expected = '1389c7a3fbdc096463787614778c4b9087104ef252c54659d542c68874e91c89';
const digest = createHash('sha256').update(readFileSync(source)).digest('hex');
if (digest !== expected || !/^\/tmp\/are-g02-r4-runs\/g02-r5-index-probe-[a-z0-9-]+\/base$/.test(base)
    || !/^[0-9a-f]{40}$/.test(commit) || !['32', '64', '96'].includes(budgetText))
  throw Error('g02-r5-index-probe.invalid-input-or-source');
const {createRankedSourceAcquisition} = await import(pathToFileURL(source).href);
const started = performance.now();
const index = createRankedSourceAcquisition({root: base, base_commit: commit,
  problem_statement: 'source index capacity probe',
  maximum_index_bytes: Number(budgetText) * 1024 * 1024});
const value = index.query('zxqvneverappears');
console.log(JSON.stringify({budget_mib: Number(budgetText), index_source_sha256: digest,
  indexed_files: value.indexed_files, indexed_bytes: value.indexed_bytes,
  omitted_files: value.omitted_files, elapsed_ms: performance.now() - started,
  rss_bytes: process.memoryUsage().rss, heap_used_bytes: process.memoryUsage().heapUsed}));
