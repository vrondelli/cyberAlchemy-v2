#!/usr/bin/env node
// Sealed source-only transfer of the unchanged ARE candidate to non-Gin ARB queries.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, isAbsolute, join, resolve, sep} from 'node:path';
import {createRankedSourceAcquisition, rankSourcesTool} from './ranked-source-acquisition-bm25-r1.mjs';

const SOURCE_AUDIT_SHA256 = '1e46c4e41b4f8aa31b8a39c401addcb7b3203a3a95da9a43b12d26304065c77f';
const CANDIDATE_SHA256 = '52629ca2faddf20db18e78ea8b7debb880d0140413d42c67ec759e5f53aa5788';
const fail = reason => { throw Error(`nongin-transfer.${reason}`); };
const sha = value => createHash('sha256').update(value).digest('hex');
const shaFile = path => sha(readFileSync(path));
const rows = path => readFileSync(path, 'utf8').trimEnd().split('\n').map(line => JSON.parse(line));
const args = Object.fromEntries(process.argv.slice(2).map(value => {
  const i = value.indexOf('=');
  if (i < 1) fail('arguments');
  return [value.slice(0, i), value.slice(i + 1)];
}));
if (Object.keys(args).sort().join(',') !== '--output,--queries,--source') fail('argument-set');
const output = resolve(args['--output']);
const source = resolve(args['--source']);
const queries = resolve(args['--queries']);
const querySeal = JSON.parse(readFileSync(join(dirname(queries), 'QUERY-SEAL.json'), 'utf8'));
if (existsSync(output) || shaFile(join(source, 'SOURCE-CORPUS-AUDIT.json')) !== SOURCE_AUDIT_SHA256 ||
    shaFile(new URL('./ranked-source-acquisition-bm25-r1.mjs', import.meta.url)) !== CANDIDATE_SHA256 ||
    querySeal.schema !== 'are.arb-trace2code-nongin-query-projection-r1/v1' ||
    querySeal.query_projection_sha256 !== shaFile(queries) || querySeal.case_count !== 45 ||
    rankSourcesTool.function.parameters.properties.query.maxLength !== 1024) fail('input-pin-drift');

function safeRelative(path) {
  if (typeof path !== 'string' || !path || isAbsolute(path) || path.includes('\\') ||
      path.split('/').some(part => !part || part === '.' || part === '..' || part === '.git')) fail('unsafe-path');
  return path;
}
function materialize(manifest, root) {
  const relative = manifest.chunks_path.replace(/^data\//, '');
  if (relative === manifest.chunks_path || !relative.startsWith('corpus/v2_trace2code/')) fail('manifest-path');
  let files = 0;
  for (const chunk of rows(join(source, relative))) {
    if (chunk.repo !== manifest.repo || chunk.base_commit !== manifest.base_commit) fail('chunk-identity');
    if (chunk.kind !== 'file') continue;
    const target = resolve(root, safeRelative(chunk.path));
    if (!target.startsWith(root + sep) || existsSync(target)) fail('duplicate-or-escaped-file');
    mkdirSync(dirname(target), {recursive: true});
    writeFileSync(target, chunk.text, {flag: 'wx'});
    if (!lstatSync(target).isFile()) fail('not-file');
    files++;
  }
  if (files !== manifest.file_count) fail('file-count');
  execFileSync('git', ['init', '-q', root], {timeout: 30000});
  execFileSync('git', ['add', '-f', '-A'], {cwd: root, timeout: 30000});
  const tracked = execFileSync('git', ['ls-files', '-z'], {cwd: root, timeout: 30000})
    .toString().split('\0').filter(Boolean);
  if (tracked.length !== files) fail('git-index-count');
}
function edgeWindow(value) {
  const bytes = Buffer.from(value, 'utf8');
  if (bytes.length <= 1024) return value.trim();
  const head = bytes.subarray(0, 509).toString('utf8').replaceAll('\uFFFD', '');
  const tail = bytes.subarray(bytes.length - 509).toString('utf8').replaceAll('\uFFFD', '');
  return `${head}\n...\n${tail}`.trim();
}

const manifest = new Map(rows(join(source, 'corpus/v2_trace2code/corpus_manifest.jsonl'))
  .map(row => [`${row.repo}@${row.base_commit}`, row]));
const input = rows(queries);
if (input.length !== 45 || new Set(input.map(row => row.id)).size !== 45 ||
    input.some(row => row.repo === 'gin-gonic/gin')) fail('cohort');
mkdirSync(output, {recursive: false});
const work = join(output, 'source-snapshots');
mkdirSync(work);
const snapshots = new Map();
const predictions = [];
let partialCases = 0;
for (const item of input) {
  const key = `${item.repo}@${item.base_commit}`;
  const entry = manifest.get(key);
  if (!entry) fail('missing-snapshot');
  if (!snapshots.has(key)) {
    const root = join(work, item.base_commit);
    if (existsSync(root)) fail('commit-collision');
    mkdirSync(root);
    materialize(entry, root);
    snapshots.set(key, root);
  }
  const root = snapshots.get(key);
  const query = edgeWindow(item.query.failure_excerpt);
  if (!query || Buffer.byteLength(query) > 1024) fail('query-window');
  const arm = {};
  for (const mode of ['bm25', 'trace-text']) {
    const ranker = createRankedSourceAcquisition({root, base_commit: item.base_commit,
      problem_statement: item.query.failure_excerpt, allow_projection: true, mode});
    const ranking = ranker.rankAll(query);
    arm[mode] = ranking;
  }
  const partial = Object.values(arm).some(result => result.partial_index ||
    result.indexed_files !== entry.file_count || result.ranked_files.length !== entry.file_count);
  if (partial) partialCases++;
  if (!partial) {
    for (const result of Object.values(arm)) {
      if (new Set(result.ranked_files).size !== entry.file_count) fail('duplicate-ranking-path');
    }
  }
  predictions.push({id: item.id, repo: item.repo, base_commit: item.base_commit,
    candidate_count: entry.file_count, query_sha256: sha(query), query_bytes: Buffer.byteLength(query),
    status: partial ? 'coverage_failed' : 'ranked_all_files',
    bm25_indexed_files: arm.bm25.indexed_files, trace_text_indexed_files: arm['trace-text'].indexed_files,
    bm25_omitted_files: arm.bm25.omitted_files, trace_text_omitted_files: arm['trace-text'].omitted_files,
    bm25_ranked_files: partial ? null : arm.bm25.ranked_files,
    trace_text_ranked_files: partial ? null : arm['trace-text'].ranked_files});
}
const predictionPath = join(output, 'ARE-RANKINGS.jsonl');
writeFileSync(predictionPath, predictions.map(row => JSON.stringify(row)).join('\n') + '\n', {flag: 'wx'});
const seal = {schema: 'are.arb-trace2code-nongin-are-transfer-r1/v1',
  posture: 'source-only non-Gin confirmation with unchanged Gin-developed ARE candidate; not live ARE or exact Git',
  source_audit_sha256: SOURCE_AUDIT_SHA256, query_projection_sha256: shaFile(queries),
  candidate_source_sha256: CANDIDATE_SHA256, prediction_sha256: shaFile(predictionPath),
  cases: predictions.length, snapshots: snapshots.size, coverage_failed_cases: partialCases,
  gold_opened: false, model_calls: 0};
writeFileSync(join(output, 'SOURCE-SEAL.json'), JSON.stringify(seal, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify(seal));
