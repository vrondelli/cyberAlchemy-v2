#!/usr/bin/env node
// One exposed ARB case: execute actual ARE read_file on a pinned Git checkout.
// This is deterministic tool-path replay, not a model-driven ARE episode.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {createRepositoryTools} from '../../../../benchmarks/contextbench-v1/repository-tools.mjs';

const archive = '/home/vlad_/are-benchmark-archive/arb-v2-trace2code-20261004';
const id = 'e843a55e790138194506b76a';
const repo = 'gin-gonic/gin';
const commit = 'a4ac275e079d46d493965491d686bfe72d121e85';
const input = {
  rankings: [join(archive, 'exposed-rerank-pilot-r1/SEALED-RANKINGS.jsonl'), '315dfa2e006900e5e2d5cf700d3ebac8bded6ff0c60d5d59faeaff682c721512'],
  packets: [join(archive, 'exposed-rerank-pilot-r1/PACKETS.jsonl'), 'd0ef532a085fbb00333c2083b025a079bbbb84d1c9dd3f2d25377bb11537dce7'],
  queries: [join(archive, 'query-only-dev-r1/DEV-QUERIES.jsonl'), '19f3aed723705229433bc13423f30ea45c6d84a23d1a481c3924371232e6253a'],
  source_audit: [join(archive, 'source-only-r1/SOURCE-CORPUS-AUDIT.json'), '1e46c4e41b4f8aa31b8a39c401addcb7b3203a3a95da9a43b12d26304065c77f'],
  chunks: [join(archive, `source-only-r1/corpus/v2_trace2code/gin-gonic__gin/${commit}.chunks.jsonl`), 'be89724490441e11556c9b27056e2b2e9e5878e690b6d6db226aebef76a59d45'],
};
const sha = value => createHash('sha256').update(value).digest('hex');
const fileSha = path => sha(readFileSync(path));
const need = (condition, why) => { if (!condition) throw Error(`exact-read.${why}`); };
const rows = path => readFileSync(path, 'utf8').trimEnd().split('\n').map(JSON.parse);
const findOne = (path, caseId) => {
  const selected = rows(path).filter(row => row.id === caseId);
  need(selected.length === 1, `case-count:${path}`);
  return selected[0];
};
const terms = value => new Set((value.toLowerCase().match(/[a-z_][a-z_0-9]{2,}/g) ?? [])
  .filter(token => !new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'file', 'error', 'test']).has(token)));
const edge = value => {
  const data = Buffer.from(value);
  if (data.length <= 1024) return value.trim();
  return `${data.subarray(0, 509).toString('utf8').replace(/\ufffd/g, '')}\n...\n${data.subarray(-509).toString('utf8').replace(/\ufffd/g, '')}`.trim();
};

async function main() {
  need(process.argv.length === 4, 'args: checkout output-dir');
  const checkout = resolve(process.argv[2]), output = resolve(process.argv[3]);
  need(!existsSync(output), 'output-exists');
  for (const [path, expected] of Object.values(input)) need(fileSha(path) === expected, `input-drift:${path}`);
  const head = execFileSync('git', ['-C', checkout, 'rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
  need(head === commit, 'head-drift');
  need(execFileSync('git', ['-C', checkout, 'status', '--porcelain=v1'], {encoding: 'utf8'}).trim() === '', 'checkout-dirty');
  const ranking = findOne(input.rankings[0], id);
  const packet = findOne(input.packets[0], id);
  const query = findOne(input.queries[0], id);
  for (const value of [ranking, packet, query]) need(value.repo === repo && value.base_commit === commit, 'identity-drift');
  need(sha(edge(query.query.failure_excerpt)) === packet.query_sha256, 'query-drift');
  const byPath = new Map();
  for (const chunk of rows(input.chunks[0])) {
    if (!byPath.has(chunk.path)) byPath.set(chunk.path, []);
    byPath.get(chunk.path).push(chunk);
  }
  const qterms = terms(edge(query.query.failure_excerpt));
  const observed = [];
  const execute = createRepositoryTools({root: checkout, base_commit: commit,
    record_source: value => observed.push({path: value.path, source_sha256: value.source_sha256})});
  const arms = {glm_rerank: ranking.proposal_ranked_files.slice(0, 3),
    are: ranking.are_ranked_files.slice(0, 3)};
  need(arms.glm_rerank.length === 3 && arms.are.length === 3, 'ranking-shape');
  const results = [];
  for (const [arm, paths] of Object.entries(arms)) {
    let total = 0;
    const reads = [];
    for (const path of paths) {
      const options = byPath.get(path) ?? [];
      need(options.length > 0, `missing-chunks:${path}`);
      const best = options.map(chunk => ({chunk,
        overlap: [...qterms].filter(token => terms(chunk.text ?? '').has(token)).length}))
        .sort((a, b) => b.overlap - a.overlap || Number(b.chunk.kind !== 'file') - Number(a.chunk.kind !== 'file') ||
          (a.chunk.start_line ?? 0) - (b.chunk.start_line ?? 0))[0].chunk;
      need(Number.isSafeInteger(best.start_line) && best.start_line >= 1, `chunk-line:${path}`);
      const response = await execute('read_file', {path, start_line: best.start_line,
        line_count: 50, revision: 'base'});
      need(response.ok, `read-failed:${path}:${response.error ?? 'validation'}`);
      const value = response.output;
      need(value.path === path && value.base_commit === commit && value.source_revision === 'base' &&
        value.byte_count === Buffer.byteLength(value.utf8), `read-mismatch:${path}`);
      total += value.byte_count;
      reads.push({...value, selected_chunk_kind: best.kind, selected_chunk_start_line: best.start_line,
        selected_chunk_end_line: best.end_line});
    }
    results.push({arm, selected_paths: paths, total_read_bytes: total, reads});
  }
  need(observed.length === 6, 'observation-count');
  mkdirSync(output, {recursive: false, mode: 0o700});
  const data = {schema: 'are.arb-exposed-exact-git-read-replay-r1/v1', id, repo, base_commit: commit,
    posture: 'exposed deterministic actual read_file replay; no GLM, gold, or full ARE episode',
    query_sha256: packet.query_sha256, input_sha256: Object.fromEntries(Object.entries(input).map(([key, [, digest]]) => [key, digest])),
    arms: results, tool_observations: observed};
  const dataPath = join(output, 'READ-REPLAY.json');
  writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n', {flag: 'wx', mode: 0o600});
  const receipt = {schema: 'are.arb-exposed-exact-git-read-replay-seal-r1/v1', id, repo,
    base_commit: commit, read_replay_sha256: fileSha(dataPath), gold_opened: false,
    model_calls: 0, actual_read_file_calls: observed.length,
    arms: Object.fromEntries(results.map(row => [row.arm, {selected_paths: row.selected_paths,
      total_read_bytes: row.total_read_bytes}]))};
  writeFileSync(join(output, 'SOURCE-SEAL.json'), JSON.stringify(receipt, null, 2) + '\n', {flag: 'wx', mode: 0o600});
  process.stdout.write(JSON.stringify(receipt) + '\n');
}

await main();
