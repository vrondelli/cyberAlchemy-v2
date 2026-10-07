#!/usr/bin/env node
// Source-only 1024-byte first-plus-last query experiment on exposed Gin cases.
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {createRankedSourceAcquisition} from './ranked-source-acquisition-bm25-r1.mjs';

const QUERY_SHA256 = '19f3aed723705229433bc13423f30ea45c6d84a23d1a481c3924371232e6253a';
const CANDIDATE_SHA256 = 'b2dbdbfc3145d0d313aa9aa3bf70162e97467f7f6bf51bd286bb0a82968335b7';
const SNAPSHOT_SEAL_SHA256 = '45c54be416b11c5caa3668ad85855e6941ea9bcc9af8fea20fd62799d7e99ac7';
const fail = reason => { throw Error(`edge-window.${reason}`); };
const sha = value => createHash('sha256').update(value).digest('hex');
const shaFile = path => sha(readFileSync(path));
const rows = path => readFileSync(path, 'utf8').trimEnd().split('\n').map(line => JSON.parse(line));
const args = Object.fromEntries(process.argv.slice(2).map(value => {
  const i = value.indexOf('=');
  if (i < 1) fail('arguments');
  return [value.slice(0, i), value.slice(i + 1)];
}));
if (Object.keys(args).sort().join(',') !== '--candidate,--output,--queries,--snapshots') fail('argument-set');
const queryPath = resolve(args['--queries']);
const candidatePath = resolve(args['--candidate']);
const snapshots = resolve(args['--snapshots']);
const output = resolve(args['--output']);
if (existsSync(output) || shaFile(queryPath) !== QUERY_SHA256 ||
    shaFile(candidatePath) !== CANDIDATE_SHA256 ||
    shaFile(join(snapshots, '..', 'SOURCE-SEAL.json')) !== SNAPSHOT_SEAL_SHA256) fail('input-pin-drift');

function edgeWindow(value) {
  const bytes = Buffer.from(value, 'utf8');
  if (bytes.length <= 1024) return value.trim();
  // Fixed before this experiment's evaluator pass: 509 + 5 + 509 = 1023 bytes.
  const head = bytes.subarray(0, 509).toString('utf8').replaceAll('\uFFFD', '');
  const tail = bytes.subarray(bytes.length - 509).toString('utf8').replaceAll('\uFFFD', '');
  return `${head}\n...\n${tail}`.trim();
}

const prior = new Map(rows(candidatePath).map(row => [row.id, row]));
const inputs = rows(queryPath);
if (prior.size !== 56 || inputs.length !== 56) fail('denominator');
const out = [];
let changedWindows = 0;
for (const item of inputs) {
  const old = prior.get(item.id);
  if (!old || old.base_commit !== item.base_commit || item.repo !== 'gin-gonic/gin') fail('identity');
  const query = edgeWindow(item.query.failure_excerpt);
  if (!query || Buffer.byteLength(query) > 1024) fail('query-budget');
  if (Buffer.byteLength(item.query.failure_excerpt) > 1024) changedWindows++;
  const root = join(snapshots, item.base_commit);
  const results = {};
  for (const mode of ['bm25', 'trace-text']) {
    const ranker = createRankedSourceAcquisition({root, base_commit: item.base_commit,
      problem_statement: item.query.failure_excerpt, allow_projection: true, mode});
    const ranking = ranker.rankAll(query);
    if (ranking.partial_index || ranking.indexed_files !== old.candidate_count ||
        ranking.ranked_files.length !== old.candidate_count ||
        new Set(ranking.ranked_files).size !== old.candidate_count) fail('candidate-coverage');
    const previous = mode === 'bm25' ? old.bm25_ranked_files : old.trace_text_ranked_files;
    if (ranking.ranked_files.some(path => !previous.includes(path))) fail('candidate-set-drift');
    results[mode === 'bm25' ? 'edge_bm25' : 'edge_trace_text'] = ranking.ranked_files;
  }
  out.push({id: item.id, repo: item.repo, base_commit: item.base_commit,
    candidate_count: old.candidate_count, query_sha256: sha(query),
    query_bytes: Buffer.byteLength(query), ...results});
}
if (out.length !== 56 || changedWindows !== 28) fail('window-population');
mkdirSync(output, {recursive: false});
const path = join(output, 'EDGE-RANKINGS.jsonl');
writeFileSync(path, out.map(row => JSON.stringify(row)).join('\n') + '\n', {flag: 'wx'});
const seal = {schema: 'are.arb-trace2code-gin-edge-window-r1/v1',
  posture: 'source-only exposed Gin development; fixed first-plus-last 1024-byte failure-excerpt window',
  query_sha256: QUERY_SHA256, candidate_sha256: CANDIDATE_SHA256,
  snapshot_seal_sha256: SNAPSHOT_SEAL_SHA256, prediction_sha256: shaFile(path),
  development_cases: out.length, changed_windows: changedWindows,
  gold_opened: false, heldout_queries_opened: false, model_calls: 0};
writeFileSync(join(output, 'SOURCE-SEAL.json'), JSON.stringify(seal, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify(seal));
