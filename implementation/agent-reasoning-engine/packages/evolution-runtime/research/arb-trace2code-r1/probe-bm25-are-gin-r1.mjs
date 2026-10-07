#!/usr/bin/env node
// Source-only parity probe for a versioned ARE-compatible rank_sources candidate.
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {createRankedSourceAcquisition, rankSourcesTool} from './ranked-source-acquisition-bm25-r1.mjs';

const QUERY_SHA256 = '19f3aed723705229433bc13423f30ea45c6d84a23d1a481c3924371232e6253a';
const PYTHON_RANKING_SHA256 = '541791cf826edb8bb3be7e4aa71981a6f01e517abeeee8470b709c1bcf41fff5';
const SNAPSHOT_SEAL_SHA256 = '45c54be416b11c5caa3668ad85855e6941ea9bcc9af8fea20fd62799d7e99ac7';
const fail = reason => { throw Error(`bm25-probe.${reason}`); };
const digest = value => createHash('sha256').update(value).digest('hex');
const shaFile = path => digest(readFileSync(path));
const rows = path => readFileSync(path, 'utf8').trimEnd().split('\n').map(line => JSON.parse(line));
const arg = Object.fromEntries(process.argv.slice(2).map(value => {
  const i = value.indexOf('=');
  if (i < 1) fail('arguments');
  return [value.slice(0, i), value.slice(i + 1)];
}));
if (Object.keys(arg).sort().join(',') !== '--output,--python-rankings,--queries,--snapshots') fail('argument-set');
const output = resolve(arg['--output']);
const snapshots = resolve(arg['--snapshots']);
const queryPath = resolve(arg['--queries']);
const pythonPath = resolve(arg['--python-rankings']);
if (existsSync(output) || shaFile(queryPath) !== QUERY_SHA256 ||
    shaFile(pythonPath) !== PYTHON_RANKING_SHA256 ||
    shaFile(join(snapshots, '..', 'SOURCE-SEAL.json')) !== SNAPSHOT_SEAL_SHA256) fail('input-pin-drift');
if (rankSourcesTool.function.name !== 'rank_sources' || rankSourcesTool.function.parameters.properties.query.maxLength !== 1024) fail('tool-contract');
const expected = new Map(rows(pythonPath).map(row => [row.id, row]));
const inputs = rows(queryPath);
if (inputs.length !== 56 || expected.size !== 56) fail('denominator');
const instances = new Map();
const predictions = [];
let bm25FullEqual = 0, bm25Top8Equal = 0, traceTextFullEqual = 0, traceTextTop8Equal = 0;
for (const item of inputs) {
  const comparison = expected.get(item.id);
  if (!comparison || comparison.base_commit !== item.base_commit || item.repo !== 'gin-gonic/gin') fail('case-identity');
  if (!instances.has(item.base_commit)) {
    const root = join(snapshots, item.base_commit);
    instances.set(item.base_commit, {
      bm25: createRankedSourceAcquisition({root, base_commit: item.base_commit,
        problem_statement: item.query.failure_excerpt, allow_projection: true, mode: 'bm25'}),
      trace_text: createRankedSourceAcquisition({root, base_commit: item.base_commit,
        problem_statement: item.query.failure_excerpt, allow_projection: true, mode: 'trace-text'})
    });
  }
  const bytes = Buffer.from(item.query.failure_excerpt);
  const query = (bytes.length > 1024 ? bytes.subarray(bytes.length - 1024) : bytes)
    .toString('utf8').replaceAll('\uFFFD', '').trim();
  if (!query || Buffer.byteLength(query) > 1024 || digest(query) !== comparison.query_sha256) fail('query-window-drift');
  const instance = instances.get(item.base_commit);
  const bm25 = instance.bm25.rankAll(query);
  const trace_text = instance.trace_text.rankAll(query);
  if (bm25.partial_index || trace_text.partial_index || bm25.indexed_files !== comparison.candidate_count ||
      bm25.ranked_files.length !== comparison.candidate_count ||
      trace_text.ranked_files.length !== comparison.candidate_count) fail('candidate-coverage');
  const expectedSet = new Set(comparison.baseline_ranked_files);
  for (const candidate of [bm25, trace_text]) {
    if (new Set(candidate.ranked_files).size !== expectedSet.size ||
        candidate.ranked_files.some(path => !expectedSet.has(path)) ||
        candidate.top.length !== 8 || candidate.top.some((hint, i) =>
          hint.path !== candidate.ranked_files[i] || hint.start_line < 1 || hint.end_line < hint.start_line)) fail('rank-contract');
  }
  if (JSON.stringify(bm25.ranked_files) === JSON.stringify(comparison.baseline_ranked_files)) bm25FullEqual++;
  if (JSON.stringify(bm25.ranked_files.slice(0, 8)) === JSON.stringify(comparison.baseline_ranked_files.slice(0, 8))) bm25Top8Equal++;
  if (JSON.stringify(trace_text.ranked_files) === JSON.stringify(comparison.trace_aware_ranked_files)) traceTextFullEqual++;
  if (JSON.stringify(trace_text.ranked_files.slice(0, 8)) === JSON.stringify(comparison.trace_aware_ranked_files.slice(0, 8))) traceTextTop8Equal++;
  predictions.push({id: item.id, repo: item.repo, base_commit: item.base_commit,
    candidate_count: bm25.indexed_files, query_sha256: comparison.query_sha256,
    bm25_ranked_files: bm25.ranked_files, bm25_hints: bm25.top,
    trace_text_ranked_files: trace_text.ranked_files, trace_text_hints: trace_text.top});
}
mkdirSync(output, {recursive: false});
const predictionPath = join(output, 'CANDIDATE-RANKINGS.jsonl');
writeFileSync(predictionPath, predictions.map(row => JSON.stringify(row)).join('\n') + '\n', {flag: 'wx'});
const receipt = {schema: 'are.arb-trace2code-gin-bm25-adapter-probe-r1/v1',
  posture: 'source-only exposed development on ARB snapshots; not exact pinned Git or model episode',
  query_sha256: QUERY_SHA256, python_ranking_sha256: PYTHON_RANKING_SHA256,
  snapshot_seal_sha256: SNAPSHOT_SEAL_SHA256,
  prediction_sha256: shaFile(predictionPath), development_cases: predictions.length,
  snapshots: instances.size, bm25_full_parity: bm25FullEqual, bm25_top8_parity: bm25Top8Equal,
  trace_text_full_parity: traceTextFullEqual, trace_text_top8_parity: traceTextTop8Equal,
  gold_opened: false, holdout_queries_opened: false, model_calls: 0};
writeFileSync(join(output, 'SOURCE-SEAL.json'), JSON.stringify(receipt, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify(receipt));
