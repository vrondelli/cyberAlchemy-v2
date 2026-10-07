#!/usr/bin/env node
// Source-only projected packet delivery for the sealed edge-window rankings.
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve, sep} from 'node:path';
import {createRankedSourceAcquisition} from './ranked-source-acquisition-bm25-r1.mjs';

const QUERY_SHA256 = '19f3aed723705229433bc13423f30ea45c6d84a23d1a481c3924371232e6253a';
const EDGE_SHA256 = '1e6d8d4170163318b05a693950db6609c21f7aef2d11911747e4f29c0cc30bcd';
const SNAPSHOT_SEAL_SHA256 = '45c54be416b11c5caa3668ad85855e6941ea9bcc9af8fea20fd62799d7e99ac7';
const generated = path => /(?:_grpc\.pb\.go|\.pb\.go|\.min\.js|\.generated\.[a-z0-9]+)$/i.test(path);
const fail = reason => { throw Error(`edge-packet.${reason}`); };
const sha = value => createHash('sha256').update(value).digest('hex');
const shaFile = path => sha(readFileSync(path));
const rows = path => readFileSync(path, 'utf8').trimEnd().split('\n').map(line => JSON.parse(line));
const args = Object.fromEntries(process.argv.slice(2).map(value => {
  const i = value.indexOf('=');
  if (i < 1) fail('arguments');
  return [value.slice(0, i), value.slice(i + 1)];
}));
if (Object.keys(args).sort().join(',') !== '--edge,--output,--queries,--snapshots') fail('argument-set');
const queryPath = resolve(args['--queries']);
const edgePath = resolve(args['--edge']);
const snapshots = resolve(args['--snapshots']);
const output = resolve(args['--output']);
if (existsSync(output) || shaFile(queryPath) !== QUERY_SHA256 ||
    shaFile(edgePath) !== EDGE_SHA256 ||
    shaFile(join(snapshots, '..', 'SOURCE-SEAL.json')) !== SNAPSHOT_SEAL_SHA256) fail('input-pin-drift');

function edgeWindow(value) {
  const bytes = Buffer.from(value, 'utf8');
  if (bytes.length <= 1024) return value.trim();
  return `${bytes.subarray(0, 509).toString('utf8').replaceAll('\uFFFD', '')}\n...\n` +
    bytes.subarray(bytes.length - 509).toString('utf8').replaceAll('\uFFFD', '').trimEnd();
}

function packet(hints, root) {
  const selected = [];
  const seen = new Set();
  for (const hint of hints) {
    if (selected.length >= 3) break;
    if (!hint || typeof hint.path !== 'string' || generated(hint.path) || seen.has(hint.path)) continue;
    if (!Number.isSafeInteger(hint.start_line) || hint.start_line < 1) fail('bad-hint');
    selected.push(hint);
    seen.add(hint.path);
  }
  const reads = [];
  let delivered_bytes = 0;
  for (const hint of selected) {
    const target = resolve(root, hint.path);
    if (!target.startsWith(root + sep)) fail('path-escape');
    const lines = readFileSync(target, 'utf8').split(/\r?\n/);
    const start_line = Math.max(1, hint.start_line - 8);
    if (start_line > lines.length) fail('range-outside-file');
    const end_line = Math.min(lines.length, start_line + 49);
    const source = lines.slice(start_line - 1, end_line).join('\n');
    const bytes = Buffer.byteLength(source);
    delivered_bytes += bytes;
    reads.push({path: hint.path, start_line, end_line, bytes, content_sha256: sha(source)});
  }
  if (delivered_bytes > 49152) fail('packet-byte-limit');
  return {selected_paths: selected.map(hint => hint.path), delivered_bytes, reads};
}

const edge = new Map(rows(edgePath).map(row => [row.id, row]));
const queries = rows(queryPath);
if (edge.size !== 56 || queries.length !== 56) fail('denominator');
const out = [];
const max_bytes = {edge_bm25: 0, edge_trace_text: 0};
for (const item of queries) {
  const expected = edge.get(item.id);
  if (!expected || expected.base_commit !== item.base_commit || item.repo !== 'gin-gonic/gin') fail('identity');
  const query = edgeWindow(item.query.failure_excerpt).trim();
  if (!query || Buffer.byteLength(query) > 1024 || sha(query) !== expected.query_sha256) fail('query-window-drift');
  const root = join(snapshots, item.base_commit);
  const variants = {};
  for (const [mode, name] of [['bm25', 'edge_bm25'], ['trace-text', 'edge_trace_text']]) {
    const ranker = createRankedSourceAcquisition({root, base_commit: item.base_commit,
      problem_statement: item.query.failure_excerpt, allow_projection: true, mode});
    const ranking = ranker.rankAll(query);
    if (ranking.partial_index || ranking.indexed_files !== expected.candidate_count ||
        JSON.stringify(ranking.ranked_files) !== JSON.stringify(expected[name])) fail('ranking-drift');
    variants[name] = packet(ranking.top, root);
    max_bytes[name] = Math.max(max_bytes[name], variants[name].delivered_bytes);
  }
  out.push({id: item.id, repo: item.repo, base_commit: item.base_commit, variants});
}
mkdirSync(output, {recursive: false});
const path = join(output, 'EDGE-DELIVERY-SIM.jsonl');
writeFileSync(path, out.map(row => JSON.stringify(row)).join('\n') + '\n', {flag: 'wx'});
const seal = {schema: 'are.arb-trace2code-gin-edge-packet-sim-r1/v1',
  posture: 'source-only ARB snapshot read simulation; not live read_file/ARE or official ARB BCY',
  query_sha256: QUERY_SHA256, edge_rankings_sha256: EDGE_SHA256,
  snapshot_seal_sha256: SNAPSHOT_SEAL_SHA256, delivery_sha256: shaFile(path),
  development_cases: out.length, max_delivered_bytes: max_bytes,
  read_limit_per_case: 3, byte_limit: 49152, gold_opened: false,
  heldout_queries_opened: false, model_calls: 0};
writeFileSync(join(output, 'SOURCE-SEAL.json'), JSON.stringify(seal, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify(seal));
