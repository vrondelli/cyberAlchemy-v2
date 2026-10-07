#!/usr/bin/env node
// Source-only parity audit against repository-tools.mjs read_file semantics.
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve, sep} from 'node:path';

const TAIL_SHA256 = 'dd08238e038cdb7431fb8c0943a6bdf2dafeb0a6a43a91204f727448789e2c79';
const EDGE_SHA256 = '017f65598750edf88eef5ebfd0de94c76569c76613a8365d60fd2295f3e804a2';
const SNAPSHOT_SEAL_SHA256 = '45c54be416b11c5caa3668ad85855e6941ea9bcc9af8fea20fd62799d7e99ac7';
const fail = reason => { throw Error(`read-semantics.${reason}`); };
const sha = value => createHash('sha256').update(value).digest('hex');
const shaFile = path => sha(readFileSync(path));
const rows = path => readFileSync(path, 'utf8').trimEnd().split('\n').map(line => JSON.parse(line));
const args = Object.fromEntries(process.argv.slice(2).map(value => {
  const i = value.indexOf('=');
  if (i < 1) fail('arguments');
  return [value.slice(0, i), value.slice(i + 1)];
}));
if (Object.keys(args).sort().join(',') !== '--edge,--output,--snapshots,--tail') fail('argument-set');
const tailPath = resolve(args['--tail']);
const edgePath = resolve(args['--edge']);
const snapshots = resolve(args['--snapshots']);
const output = resolve(args['--output']);
if (existsSync(output) || shaFile(tailPath) !== TAIL_SHA256 ||
    shaFile(edgePath) !== EDGE_SHA256 ||
    shaFile(join(snapshots, '..', 'SOURCE-SEAL.json')) !== SNAPSHOT_SEAL_SHA256) fail('input-pin-drift');
const tail = rows(tailPath), edge = rows(edgePath);
if (tail.length !== 56 || edge.length !== 56 ||
    new Set(tail.map(row => row.id)).size !== 56 ||
    new Set(edge.map(row => row.id)).size !== 56) fail('development-denominator');
const edgeById = new Map(edge.map(row => [row.id, row]));
const names = ['are_line_tail', 'candidate_bm25', 'candidate_trace_text', 'edge_bm25', 'edge_trace_text'];
const aggregates = Object.fromEntries(names.map(name => [name, {
  packets: 0, reads: 0, content_sha_matches: 0, bytes_match: 0, end_line_match: 0,
  tool_eligible_reads: 0, crlf_reads: 0, trailing_newline_files: 0,
  simulated_bytes: 0, tool_semantics_bytes: 0, maximum_tool_packet_bytes: 0
}]));
for (const row of tail) {
  const other = edgeById.get(row.id);
  if (!other || row.repo !== 'gin-gonic/gin' || other.repo !== row.repo ||
      other.base_commit !== row.base_commit) fail('case-identity');
  const root = join(snapshots, row.base_commit);
  const variants = {...row.variants, ...other.variants};
  for (const name of names) {
    const packet = variants[name], aggregate = aggregates[name];
    if (!packet || packet.reads.length !== 3 || packet.selected_paths.length !== 3) fail('packet-shape');
    aggregate.packets++;
    let toolBytes = 0;
    for (const read of packet.reads) {
      const target = resolve(root, read.path);
      if (!target.startsWith(root + sep) || !Number.isSafeInteger(read.start_line) || read.start_line < 1) fail('unsafe-read');
      const bytes = readFileSync(target);
      const text = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true}).decode(bytes);
      const lines = text.split('\n');
      if (text.endsWith('\n')) lines.pop();
      if (read.start_line > lines.length) fail('repository.start-after-eof');
      const end = Math.min(lines.length, read.start_line + 49);
      const utf8 = lines.slice(read.start_line - 1, end).join('\n');
      const byteCount = Buffer.byteLength(utf8);
      aggregate.reads++;
      aggregate.content_sha_matches += Number(sha(utf8) === read.content_sha256);
      aggregate.bytes_match += Number(byteCount === read.bytes);
      aggregate.end_line_match += Number(end === read.end_line);
      aggregate.tool_eligible_reads += Number(bytes.length <= 2000000 && byteCount <= 32768);
      aggregate.crlf_reads += Number(utf8.includes('\r'));
      aggregate.trailing_newline_files += Number(text.endsWith('\n'));
      aggregate.simulated_bytes += read.bytes;
      aggregate.tool_semantics_bytes += byteCount;
      toolBytes += byteCount;
    }
    if (aggregate.simulated_bytes < 0 || toolBytes > 49152) fail('packet-byte-cap');
    aggregate.maximum_tool_packet_bytes = Math.max(aggregate.maximum_tool_packet_bytes, toolBytes);
  }
}
const report = {schema: 'are.arb-trace2code-gin-read-semantics-audit-r1/v1',
  posture: 'source-only parity with repository-tools read_file line/UTF-8/byte semantics; not actual pinned Git tool execution',
  tail_delivery_sha256: TAIL_SHA256, edge_delivery_sha256: EDGE_SHA256,
  snapshot_seal_sha256: SNAPSHOT_SEAL_SHA256,
  repository_tools_source: 'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs',
  cases: 56, variants: aggregates, gold_opened: false, heldout_queries_opened: false, model_calls: 0};
mkdirSync(output, {recursive: false});
const path = join(output, 'READ-SEMANTICS-AUDIT.json');
writeFileSync(path, JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify(report));
