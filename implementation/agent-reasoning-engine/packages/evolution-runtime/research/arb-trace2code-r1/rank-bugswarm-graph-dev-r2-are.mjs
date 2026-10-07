#!/usr/bin/env node
// One-case-per-process, source-only ARE baseline for the sealed graph-dev r2 cohort.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {basename, join, resolve} from 'node:path';
import {performance} from 'node:perf_hooks';
import {createRankedSourceAcquisition} from './ranked-source-acquisition-bm25-r1.mjs';

const SOURCE_SHA = '201f4ba4d31d93dbfbff5f808307c079d46f4db2319cb40a4df08e7d0bb9bf51';
const QUERIES_SHA = '9ccaeb5a21d3391f819eddb151a38cb3d2a287562abe1850df2a4cc8ab81a561';
const RANKER_SHA = '52629ca2faddf20db18e78ea8b7debb880d0140413d42c67ec759e5f53aa5788';
const MAX_INDEX_BYTES = 128 * 1024 * 1024;
const sha = value => createHash('sha256').update(value).digest('hex');
const fileSha = path => sha(readFileSync(path));
const fail = reason => { throw Error(`bugswarm-graph-dev-are-r2.${reason}`); };
const args = Object.fromEntries(process.argv.slice(2).map(value => {
  const at = value.indexOf('=');
  if (at < 1) fail('argument');
  return [value.slice(0, at), value.slice(at + 1)];
}));
if (Object.keys(args).sort().join(',') !== '--ordinal,--output-root,--queries,--source-receipt,--source-root') fail('arguments');
const ordinal = Number(args['--ordinal']);
if (!Number.isInteger(ordinal) || ordinal < 1 || ordinal > 24) fail('ordinal');
const sourceRoot = resolve(args['--source-root']);
const sourceReceipt = resolve(args['--source-receipt']);
const queries = resolve(args['--queries']);
const outputRoot = resolve(args['--output-root']);
if (fileSha(sourceReceipt) !== SOURCE_SHA || fileSha(queries) !== QUERIES_SHA ||
    fileSha(new URL('./ranked-source-acquisition-bm25-r1.mjs', import.meta.url)) !== RANKER_SHA) fail('input-pin-drift');
const records = JSON.parse(readFileSync(sourceReceipt, 'utf8')).records;
const rows = readFileSync(queries, 'utf8').trimEnd().split('\n').map(JSON.parse);
if (records.length !== 24 || rows.length !== 24) fail('denominator');
const meta = records[ordinal - 1], row = rows[ordinal - 1];
if (meta.ordinal !== ordinal || meta.image_tag !== row.id || meta.repo !== row.repo ||
    meta.commit !== row.base_commit || sha(row.query) !== row.query_sha256 ||
    Buffer.byteLength(row.query) > 1024) fail('case-drift');
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
mkdirSync(outputRoot, {recursive: true, mode: 0o700});
const output = join(outputRoot, `ARE-RANKING-${String(ordinal).padStart(2, '0')}.json`);
const prediction = {schema_version: 'are.g01-bugswarm-graph-dev-are-ranking-r2/v1', ordinal,
  id: row.id, repo: row.repo, language: row.language, base_commit: meta.commit,
  query_sha256: row.query_sha256, candidate_count: paths.length,
  indexed_bytes: result.indexed_bytes, ranker_elapsed_ms: elapsedMs,
  ranked_files: result.ranked_files, gold_opened: false, model_calls: 0};
const encoded = JSON.stringify(prediction) + '\n';
writeFileSync(output, encoded, {flag: 'wx', mode: 0o600});
console.log(JSON.stringify({ordinal, candidate_count: paths.length, indexed_bytes: result.indexed_bytes,
  ranker_elapsed_ms: elapsedMs, ranking_sha256: sha(encoded)}));
