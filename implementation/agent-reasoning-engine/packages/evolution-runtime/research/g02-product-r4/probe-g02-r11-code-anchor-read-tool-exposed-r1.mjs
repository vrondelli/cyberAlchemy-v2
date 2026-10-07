// Source-only feasibility probe on already-exposed G02 r11 tasks. No model or gold.
import {createHash} from 'node:crypto';
import {readFileSync, mkdirSync, writeFileSync, existsSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createRepositoryTools} from '../../../../benchmarks/contextbench-v1/repository-tools.mjs';
import {attachObservationHandles, stable} from '../../../../benchmarks/contextbench-v1/delivery.mjs';

const archive = '/home/vlad_/are-benchmark-archive';
const cohort = join(archive, 'g02-product-replication-r11-20261002');
const gatePath = join(archive, 'g02-r11-code-anchor-gate-exposed-r3-20261003/SOURCE-SEAL.json');
const packetPath = join(archive, 'g02-r11-relational-choice-exposed-r5-20261003/PACKETS.json');
const definitionPath = join(cohort, 'definition/DEFINITION.json');
const output = join(archive, 'g02-r11-code-anchor-read-tool-exposed-r1-20261003');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fileSha = path => sha(readFileSync(path));
const need = (ok, reason) => { if (!ok) throw Error(`g02-read-tool.${reason}`); };
const expected = {
  gate: 'f04876f86f5951cda29c4c04f4c3c895d26eb0092f5ee57bd8febad29533e6f1',
  packets: '8865de1df1268d3db7ffe65afbead0174a1e6d1ec4c386228b7bbe7e33752255',
  definition: '0ec225f9df7cc0140dffeee53da9e57c4f2b92176b7b15c8c6fb48728bd46ddf',
};
need(fileSha(gatePath) === expected.gate && fileSha(packetPath) === expected.packets &&
  fileSha(definitionPath) === expected.definition, 'source-drift');
need(!existsSync(output), 'output-exists');
const gate = JSON.parse(readFileSync(gatePath));
const packets = JSON.parse(readFileSync(packetPath));
const definition = JSON.parse(readFileSync(definitionPath));
need(gate.rows.length === 3 && packets.ordered_packets.length === 3, 'input-shape');
const rows = [];
for (const choice of gate.rows) {
  need([4, 8, 12].includes(choice.ordinal), 'ordinal');
  const packet = packets.ordered_packets.find(row => row.ordinal === choice.ordinal);
  const pair = definition.ordered_pairs.find(row => row.ordinal === choice.ordinal);
  need(packet && pair && packet.instance_id === pair.instance_id, 'identity');
  const base = join(cohort, 'pairs', `${String(choice.ordinal).padStart(2, '0')}-${pair.suffix}`,
    'raw/sources/session/base');
  const task = JSON.parse(readFileSync(join(cohort, 'pairs',
    `${String(choice.ordinal).padStart(2, '0')}-${pair.suffix}`, 'raw/tasks',
    `${pair.instance_id}.json`)));
  need(task.instance_id === pair.instance_id && /^[a-f0-9]{40}$/.test(task.base_commit), 'task');
  need(execFileSync('git', ['-C', base, 'rev-parse', 'HEAD'], {encoding: 'utf8'}).trim() === task.base_commit,
    'checkout-drift');
  const tool = createRepositoryTools({root: base, base_commit: task.base_commit});
  let totalBytes = 0;
  const observations = [];
  for (const [index, path] of choice.selected_paths.entries()) {
    need(!packet.already_read_paths.includes(path), 'already-read');
    const candidate = packet.candidates.find(row => row.path === path);
    need(candidate && Number.isSafeInteger(candidate.code_windows?.[0]?.line), 'candidate-window');
    const args = {path, start_line: Math.max(1, candidate.code_windows[0].line - 8),
      line_count: 50, revision: 'base'};
    const call = {id: `code-anchor-r3-${choice.ordinal}-${index}-${sha(stable(args)).slice(0, 16)}`,
      type: 'function', function: {name: 'read_file', arguments: stable(args)}};
    const result = attachObservationHandles(call, await tool('read_file', args));
    need(result.ok === true && result.output.source_revision === 'base' &&
      result.output.path === path && result.output.start_line === args.start_line, 'read-failed');
    totalBytes += result.output.byte_count;
    observations.push({path, call_id: call.id, read_id: result.output.read_id,
      start_line: result.output.start_line, end_line: result.output.end_line,
      source_sha256: result.output.source_sha256, bytes: result.output.byte_count});
  }
  need(totalBytes <= 49152, 'initial-packet-byte-cap');
  rows.push({ordinal: choice.ordinal, instance_id: pair.instance_id, admitted: choice.admitted,
    proposed_reads: observations.length, observed_bytes: totalBytes, observations});
}
need(rows[0].proposed_reads === 3 && rows[1].proposed_reads === 3 &&
  rows[2].proposed_reads === 0, 'gate-projection');
const receipt = {schema_version: 'are.g02-r11-code-anchor-read-tool-probe/v1',
  posture: 'exposed-source-only-tool-observation', source_sha256: expected,
  script_sha256: fileSha(fileURLToPath(import.meta.url)), rows,
  model_calls: 0, gold_loaded: false,
  claim_ceiling: 'Exact base-revision ARE read_file tool outputs and byte caps only. No model delivery, downstream selection, native score, full cost, independent validation, or superiority.',
  open_questions: ['Can these read observations be included in successful bounded model requests?',
    'Does a full exposed ARE episode improve native quality and all-in cost?',
    'Will a fresh source- and score-blind cohort confirm the mechanism?']};
mkdirSync(output, {recursive: false, mode: 0o700});
writeFileSync(join(output, 'READ-TOOL-PROBE.json'), JSON.stringify(receipt, null, 2) + '\n', {flag: 'wx', mode: 0o600});
process.stdout.write(JSON.stringify({output, sha256: fileSha(join(output, 'READ-TOOL-PROBE.json')),
  rows: rows.map(({ordinal, proposed_reads, observed_bytes}) => ({ordinal, proposed_reads, observed_bytes}))}) + '\n');
