#!/usr/bin/env node
// Source-only ARE baseline on the pinned second development cohort, one case/process.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {basename, join, resolve} from 'node:path';
import {performance} from 'node:perf_hooks';
import {createRankedSourceAcquisition} from './ranked-source-acquisition-bm25-r1.mjs';

const BASE = '/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-b-r2';
const SOURCE = `${BASE}/code-only/SOURCE-PROJECTION-RECEIPT.json`;
const QUERIES = `${BASE}/code-only/QUERIES-B-R3.jsonl`;
const OUTPUT = `${BASE}/code-only/are-rankings`;
const SOURCE_SHA = 'ac0e840cad602ac5b5f80ba7579389ab95cc6efdb4ae682c1744103b29db5d92';
const QUERIES_SHA = '696c742d96c69f7260f94a70d5159620c3bef8bb82e0d34b44beaddc31cdfe8b';
const RANKER_SHA = '52629ca2faddf20db18e78ea8b7debb880d0140413d42c67ec759e5f53aa5788';
const MAX_INDEX_BYTES = 128 * 1024 * 1024;
const sha = value => createHash('sha256').update(value).digest('hex');
const fileSha = path => sha(readFileSync(path));
const fail = reason => { throw Error(`bugswarm-graph-dev-b-are-r3.${reason}`); };
if (process.argv.length !== 3) fail('arguments');
const ordinal = Number(process.argv[2]);
if (!Number.isInteger(ordinal) || ordinal < 1 || ordinal > 24) fail('ordinal');
if (fileSha(SOURCE) !== SOURCE_SHA || fileSha(QUERIES) !== QUERIES_SHA ||
    fileSha(new URL('./ranked-source-acquisition-bm25-r1.mjs', import.meta.url)) !== RANKER_SHA) fail('input-pin-drift');
const records = JSON.parse(readFileSync(SOURCE, 'utf8')).records;
const rows = readFileSync(QUERIES, 'utf8').trimEnd().split('\n').map(JSON.parse);
if (records.length !== 24 || rows.length !== 24) fail('denominator');
const meta = records[ordinal - 1], row = rows[ordinal - 1];
if (meta.ordinal !== ordinal || meta.image_tag !== row.id || meta.repo !== row.repo ||
    meta.commit !== row.base_commit || sha(row.query) !== row.query_sha256 ||
    Buffer.byteLength(row.query) > 1024) fail('case-drift');
const sourceRoot = resolve(`${BASE}/code-only`);
const root = join(sourceRoot, basename(meta.root));
if (!root.startsWith(sourceRoot + '/')) fail('source-root');
const paths = execFileSync('git', ['ls-files', '-z'], {cwd: root, timeout: 30000, maxBuffer: 16 * 1024 * 1024})
  .toString('utf8').split('\0').filter(Boolean).sort();
if (paths.length !== meta.projected_files) fail('file-count');
const tree = createHash('sha256');
let bytes = 0;
for (const path of paths) {
  const content = readFileSync(join(root, path));
  bytes += content.length;
  tree.update(Buffer.from(path + '\0'));
  tree.update(createHash('sha256').update(content).digest());
}
if (bytes !== meta.projected_bytes || tree.digest('hex') !== meta.projected_tree_sha256) fail('tree-drift');
const started = performance.now();
const ranker = createRankedSourceAcquisition({root, base_commit: meta.commit,
  problem_statement: row.query, allow_projection: true, mode: 'trace-text',
  maximum_index_bytes: MAX_INDEX_BYTES});
const result = ranker.rankAll(row.query);
const elapsedMs = Math.round(performance.now() - started);
const pathSet = new Set(paths);
if (result.partial_index || result.indexed_files !== paths.length ||
    result.ranked_files.length !== paths.length ||
    new Set(result.ranked_files).size !== paths.length ||
    result.ranked_files.some(path => !pathSet.has(path))) fail('coverage');
mkdirSync(OUTPUT, {recursive: true, mode: 0o700});
const output = join(OUTPUT, `ARE-RANKING-${String(ordinal).padStart(2, '0')}.json`);
const prediction = {schema_version: 'are.g01-bugswarm-graph-dev-b-are-ranking-r3/v1', ordinal,
  id: row.id, repo: row.repo, language: row.language, base_commit: meta.commit,
  query_sha256: row.query_sha256, candidate_count: paths.length,
  indexed_bytes: result.indexed_bytes, ranker_elapsed_ms: elapsedMs,
  ranked_files: result.ranked_files, gold_opened: false, model_calls: 0};
const encoded = JSON.stringify(prediction) + '\n';
writeFileSync(output, encoded, {flag: 'wx', mode: 0o600});
console.log(JSON.stringify({ordinal, candidate_count: paths.length, indexed_bytes: result.indexed_bytes,
  ranker_elapsed_ms: elapsedMs, ranking_sha256: sha(encoded)}));
