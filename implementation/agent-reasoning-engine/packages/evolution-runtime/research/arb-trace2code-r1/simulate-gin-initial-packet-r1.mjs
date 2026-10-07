#!/usr/bin/env node
// Source-only projection of G02's top-three read_file packet rule, not a live episode.
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve, sep} from 'node:path';

const CANDIDATE_SHA256 = 'b2dbdbfc3145d0d313aa9aa3bf70162e97467f7f6bf51bd286bb0a82968335b7';
const BASE_HINTS_SHA256 = '62272a5ca0cf2a3f4e7fc80c18c03b07725c882b93684ae64a5f6039bc51c92d';
const SNAPSHOT_SEAL_SHA256 = '45c54be416b11c5caa3668ad85855e6941ea9bcc9af8fea20fd62799d7e99ac7';
const generated = path => /(?:_grpc\.pb\.go|\.pb\.go|\.min\.js|\.generated\.[a-z0-9]+)$/i.test(path);
const fail = reason => { throw Error(`initial-packet-sim.${reason}`); };
const sha = value => createHash('sha256').update(value).digest('hex');
const shaFile = path => sha(readFileSync(path));
const rows = path => readFileSync(path, 'utf8').trimEnd().split('\n').map(line => JSON.parse(line));
const args = Object.fromEntries(process.argv.slice(2).map(value => {
  const i = value.indexOf('=');
  if (i < 1) fail('arguments');
  return [value.slice(0, i), value.slice(i + 1)];
}));
if (Object.keys(args).sort().join(',') !== '--baseline-hints,--candidate,--output,--snapshots') fail('argument-set');
const baselinePath = resolve(args['--baseline-hints']);
const candidatePath = resolve(args['--candidate']);
const snapshots = resolve(args['--snapshots']);
const output = resolve(args['--output']);
if (existsSync(output) || shaFile(baselinePath) !== BASE_HINTS_SHA256 ||
    shaFile(candidatePath) !== CANDIDATE_SHA256 ||
    shaFile(join(snapshots, '..', 'SOURCE-SEAL.json')) !== SNAPSHOT_SEAL_SHA256) fail('input-pin-drift');
const baseline = new Map(rows(baselinePath).map(row => [row.id, row]));
const candidate = rows(candidatePath);
if (baseline.size !== 56 || candidate.length !== 56 || new Set(candidate.map(row => row.id)).size !== 56) fail('population');

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

const results = [];
let max_bytes = {are_line_tail: 0, candidate_bm25: 0, candidate_trace_text: 0};
for (const row of candidate) {
  const old = baseline.get(row.id);
  if (!old || old.base_commit !== row.base_commit || row.repo !== 'gin-gonic/gin') fail('identity');
  const root = join(snapshots, row.base_commit);
  const variants = {
    are_line_tail: packet(old.tail_hints, root),
    candidate_bm25: packet(row.bm25_hints, root),
    candidate_trace_text: packet(row.trace_text_hints, root),
  };
  for (const [name, value] of Object.entries(variants)) max_bytes[name] = Math.max(max_bytes[name], value.delivered_bytes);
  results.push({id: row.id, repo: row.repo, base_commit: row.base_commit, variants});
}
mkdirSync(output, {recursive: false});
const path = join(output, 'DELIVERY-SIM.jsonl');
writeFileSync(path, results.map(row => JSON.stringify(row)).join('\n') + '\n', {flag: 'wx'});
const seal = {schema: 'are.arb-trace2code-gin-initial-packet-sim-r1/v1',
  posture: 'source-only ARB snapshot read simulation; not actual read_file/ARE episode or official ARB BCY',
  baseline_hints_sha256: BASE_HINTS_SHA256, candidate_sha256: CANDIDATE_SHA256,
  snapshot_seal_sha256: SNAPSHOT_SEAL_SHA256, delivery_sha256: shaFile(path),
  development_cases: results.length, max_delivered_bytes: max_bytes,
  byte_limit: 49152, read_limit_per_case: 3, gold_opened: false,
  heldout_queries_opened: false, model_calls: 0};
writeFileSync(join(output, 'SOURCE-SEAL.json'), JSON.stringify(seal, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify(seal));
