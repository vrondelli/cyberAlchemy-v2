#!/usr/bin/env node
// Exposed development only. Open Questions: G01-DEFECTS4J-32-R2-RESULT.md.
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {basename, join, resolve} from 'node:path';
import {createRankedSourceAcquisition} from './ranked-source-acquisition-java-r1.mjs';

export function productionPath(path) {
  return path.endsWith('.java') && !/(^|\/)(test|tests|testing|testsrc)(\/|$)/i.test(path) &&
    !/^(Test.+|.+Tests?|.+TestCase)\.java$/.test(basename(path));
}
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function main() {
  const [packetRoot, trees, outputArg] = process.argv.slice(2);
  if (!packetRoot || !trees || !outputArg) throw Error('args: packet-root tree-root output');
  const output = resolve(outputArg);
  if (existsSync(output)) throw Error('output exists');
  const packetsBytes = readFileSync(join(packetRoot, 'PACKETS.jsonl'));
  const packets = packetsBytes.toString().trimEnd().split('\n').map(JSON.parse);
  if (sha(packetsBytes) !== '0534479f06f4a6c3b4855cf083f193114ae607e5c9eeaa1d7de458506a54a68a' || packets.length !== 32)
    throw Error('r2 packet drift');
  const cases = [];
  for (const p of packets) {
    const start = p.prompt.indexOf('Failure:\n') + 'Failure:\n'.length;
    const end = p.prompt.indexOf('\nCandidates:\n', start);
    if (start < 'Failure:\n'.length || end < start) throw Error('query delimiter');
    const query = p.prompt.slice(start, end);
    const engine = createRankedSourceAcquisition({root: join(trees, `${p.case_id}-checkout`),
      base_commit: p.buggy_revision, problem_statement: query, maximum_index_bytes: 256*1024*1024,
      mode: 'trace-text', allow_projection: false});
    const ranking = engine.rankAll(query);
    if (ranking.partial_index) throw Error('partial Java index');
    const production = ranking.ranked_files.filter(productionPath);
    const original = p.candidates.map(c => c.path);
    const union = [...new Set([...production.slice(0, 10), ...p.arm_ranked_files.repomap.slice(0, 10),
      ...p.arm_ranked_files.stack.slice(0, 8)])].sort();
    cases.push({case_id: p.case_id, original_candidates: original,
      production_are_top20: production.slice(0, 20), candidates: union,
      indexed_files: ranking.indexed_files, production_files: production.length});
    process.stdout.write(JSON.stringify({case_id: p.case_id, candidate_count: union.length})+'\n');
  }
  // Source-only seal is separate from later post-gold scoring.
  writeFileSync(output, JSON.stringify({schema:'are.defects4j-production-candidate-screen/v1',
    posture:'exposed development, source-only candidate generation; no model calls or quality claim',
    packets_sha256:sha(packetsBytes), implementation_sha256:sha(readFileSync(new URL(import.meta.url))),
    policy:'ARE full ranking filtered to production paths, take 10; retain original RepoMap top10 and stack8',
    cases}, null, 2)+'\n', {flag:'wx',mode:0o600});
}
if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) main();
