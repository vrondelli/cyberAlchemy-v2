#!/usr/bin/env node
// Frozen source-only ARE trace-text rankings for 24 BugsInPy cases.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {performance} from 'node:perf_hooks';
import {createRankedSourceAcquisition} from './ranked-source-acquisition-bm25-r1.mjs';

const QUERY_SHA256 = 'bb35ea15fa9498511e329cd298084c4db7f31a636ca071ef4bb6d142f9b327f2';
const PROJECTION_SHA256 = 'd5e909aa9d2250e437bc5f9ad8b6c0845204ad9bbe86c1e465b2dccbe8fc350e';
const RANKER_SHA256 = '52629ca2faddf20db18e78ea8b7debb880d0140413d42c67ec759e5f53aa5788';
const sha = value => createHash('sha256').update(value).digest('hex');
const fileSha = path => sha(readFileSync(path));
const fail = reason => { throw Error(`bugsinpy-are-rank.${reason}`); };
const args = Object.fromEntries(process.argv.slice(2).map(value => {
  const i = value.indexOf('=');
  if (i < 1) fail('argument');
  return [value.slice(0, i), value.slice(i + 1)];
}));
if (Object.keys(args).sort().join(',') !== '--output,--projection,--queries') fail('arguments');
const output = resolve(args['--output']);
const projection = resolve(args['--projection']);
const queries = resolve(args['--queries']);
const projectionReceipt = join(projection, 'SOURCE-PROJECTION-RECEIPT.json');
const rankerCode = new URL('./ranked-source-acquisition-bm25-r1.mjs', import.meta.url);
if (fileSha(projectionReceipt) !== PROJECTION_SHA256 || fileSha(queries) !== QUERY_SHA256 ||
    fileSha(rankerCode) !== RANKER_SHA256) fail('input-drift');
const records = JSON.parse(readFileSync(projectionReceipt, 'utf8')).records;
const byCase = new Map(records.map(row => [row.case, row]));
const rows = readFileSync(queries, 'utf8').trimEnd().split('\n').map(line => JSON.parse(line));
if (rows.length !== 24 || byCase.size !== 24 || new Set(rows.map(row => row.id)).size !== 24) fail('denominator');

function verifyTree(root, expected) {
  const paths = execFileSync('git', ['ls-files', '-z'], {cwd: root, timeout: 30000})
    .toString('utf8').split('\0').filter(Boolean).sort();
  if (paths.length !== expected.projected_files) fail('file-count');
  const digest = createHash('sha256');
  let bytes = 0;
  for (const path of paths) {
    const content = readFileSync(join(root, path));
    bytes += content.length;
    digest.update(Buffer.from(path + '\0'));
    digest.update(createHash('sha256').update(content).digest());
  }
  if (bytes !== expected.projected_bytes || digest.digest('hex') !== expected.projected_tree_sha256) fail('tree-drift');
  return paths;
}

const predictions = [];
for (const row of rows) {
  const meta = byCase.get(row.id);
  if (!meta || row.base_commit !== meta.commit || row.repo !== meta.repo || row.bugid !== meta.bugid ||
      sha(row.query) !== row.query_sha256 || Buffer.byteLength(row.query) > 1024) fail('case-drift');
  const root = resolve(meta.root);
  if (!root.startsWith(projection + '/')) fail('source-root');
  const paths = verifyTree(root, meta);
  const started = performance.now();
  const ranker = createRankedSourceAcquisition({root, base_commit: meta.commit,
    problem_statement: row.query, allow_projection: true, mode: 'trace-text',
    maximum_index_bytes: 64 * 1024 * 1024});
  const result = ranker.rankAll(row.query);
  const elapsedMs = Math.round(performance.now() - started);
  if (result.partial_index || result.indexed_files !== paths.length ||
      result.ranked_files.length !== paths.length ||
      new Set(result.ranked_files).size !== paths.length ||
      result.ranked_files.some(path => !paths.includes(path))) fail(`coverage:${row.id}`);
  predictions.push({id: row.id, repo: row.repo, bugid: row.bugid, base_commit: meta.commit,
    query_sha256: row.query_sha256, candidate_count: paths.length,
    indexed_bytes: result.indexed_bytes, ranker_elapsed_ms: elapsedMs,
    ranked_files: result.ranked_files});
  console.log(JSON.stringify({case: row.id, files: paths.length, ranker_elapsed_ms: elapsedMs}));
}
mkdirSync(output);
const path = join(output, 'ARE-RANKINGS.jsonl');
writeFileSync(path, predictions.map(row => JSON.stringify(row)).join('\n') + '\n', {flag: 'wx'});
const seal = {schema: 'are.g01-bugsinpy-are-rankings-r1/v1', cases: predictions.length,
  query_sha256: QUERY_SHA256, source_projection_sha256: PROJECTION_SHA256,
  ranker_code_sha256: RANKER_SHA256, prediction_sha256: fileSha(path),
  indexed_files_total: predictions.reduce((sum, row) => sum + row.candidate_count, 0),
  ranker_elapsed_ms_total: predictions.reduce((sum, row) => sum + row.ranker_elapsed_ms, 0),
  gold_opened: false, model_calls: 0};
writeFileSync(join(output, 'SOURCE-SEAL.json'), JSON.stringify(seal, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify(seal));
