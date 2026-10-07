// Exposed, source-only one-shot selection packets. No reference/score fields.
import {createHash} from 'node:crypto';
import {readFileSync, mkdirSync, writeFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createRepositoryTools} from '../../../../benchmarks/contextbench-v1/repository-tools.mjs';
import {attachObservationHandles, stable} from '../../../../benchmarks/contextbench-v1/delivery.mjs';

const archive = '/home/vlad_/are-benchmark-archive';
const cohort = join(archive, 'g02-product-replication-r11-20261002');
const probePath = join(archive, 'g02-r11-code-anchor-read-tool-exposed-r1-20261003/READ-TOOL-PROBE.json');
const packetsPath = join(archive, 'g02-r11-relational-choice-exposed-r5-20261003/PACKETS.json');
const output = join(archive, 'g02-r11-code-anchor-model-delivery-exposed-r1-20261003');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fileSha = path => sha(readFileSync(path));
const need = (ok, reason) => {if (!ok) throw Error(`g02-delivery-packets.${reason}`);};
need(fileSha(probePath) === '91f56656b1306fdf38960a107447a2c92511bfb0f250aa9717b18f9406af6a15', 'probe-drift');
need(fileSha(packetsPath) === '8865de1df1268d3db7ffe65afbead0174a1e6d1ec4c386228b7bbe7e33752255', 'packet-drift');
need(!existsSync(output), 'output-exists');
const probe = JSON.parse(readFileSync(probePath));
const packets = JSON.parse(readFileSync(packetsPath));
const rows = [];
for (const ordinal of [4, 8]) {
  const selected = probe.rows.find(row => row.ordinal === ordinal);
  const sourcePacket = packets.ordered_packets.find(row => row.ordinal === ordinal);
  need(selected?.admitted === true && selected.proposed_reads === 3 && sourcePacket, 'selection');
  const suffix = `pr11-mixed-${String(ordinal).padStart(2, '0')}`;
  const root = join(cohort, 'pairs', `${String(ordinal).padStart(2, '0')}-${suffix}`, 'raw');
  const binding = JSON.parse(readFileSync(join(root, 'tasks/binding.json')));
  const task = JSON.parse(readFileSync(join(root, 'tasks', binding.task_file)));
  need(task.instance_id === selected.instance_id && task.instance_id === sourcePacket.instance_id,
    'task-identity');
  const base = join(root, 'sources/session/base');
  need(execFileSync('git', ['-C', base, 'rev-parse', 'HEAD'], {encoding:'utf8'}).trim() === task.base_commit,
    'base-commit');
  const tool = createRepositoryTools({root:base, base_commit:task.base_commit});
  const eventLine = readFileSync(join(root, 'evidence/run/events.jsonl'), 'utf8').split('\n')
    .find(line => line.includes('"kind":"initial-source-packet"'));
  need(eventLine, 'prior-packet-event');
  const prior = JSON.parse(eventLine);
  need(prior.delivery_posture === 'pending-model-receipt' && prior.receipt.length >= 3,
    'prior-packet-shape');
  const reads = [];
  for (const [index, previous] of prior.receipt.entries()) {
    const args = {path:previous.path, start_line:previous.start_line,
      line_count:previous.end_line-previous.start_line+1, revision:'base'};
    const call = {id:`pilot-prior-${ordinal}-${index}-${sha(stable(args)).slice(0,16)}`,
      function:{name:'read_file',arguments:stable(args)}};
    const result = attachObservationHandles(call, await tool('read_file', args));
    need(result.ok === true && result.output.source_sha256 === previous.source_sha256 &&
      result.output.byte_count === previous.bytes && result.output.end_line === previous.end_line,
      'prior-read-drift');
    reads.push({index:reads.length,path:args.path,start_line:result.output.start_line,
      end_line:result.output.end_line,read_id:result.output.read_id,
      source_sha256:result.output.source_sha256,source:result.output.utf8,role:'prior'});
  }
  for (const [index, extra] of selected.observations.entries()) {
    need(!reads.some(read => read.path === extra.path), 'duplicate-extra');
    const args = {path:extra.path,start_line:extra.start_line,
      line_count:extra.end_line-extra.start_line+1,revision:'base'};
    const call = {id:extra.call_id,function:{name:'read_file',arguments:stable(args)}};
    const result = attachObservationHandles(call, await tool('read_file', args));
    need(result.ok === true && result.output.read_id === extra.read_id &&
      result.output.source_sha256 === extra.source_sha256 &&
      result.output.byte_count === extra.bytes, 'extra-read-drift');
    reads.push({index:reads.length,path:args.path,start_line:result.output.start_line,
      end_line:result.output.end_line,read_id:result.output.read_id,
      source_sha256:result.output.source_sha256,source:result.output.utf8,role:'extra'});
  }
  const bytes = reads.reduce((sum, read) => sum + Buffer.byteLength(read.source), 0);
  need(bytes <= 49152 && reads.length <= 12, 'packet-cap');
  rows.push({ordinal, instance_id:task.instance_id, issue:task.problem_statement,
    base_commit:task.base_commit, prior_read_count:prior.receipt.length,
    extra_read_count:selected.observations.length, source_bytes:bytes, reads});
}
const result = {schema_version:'are.g02-r11-code-anchor-model-delivery-packets/v1',
  posture:'exposed-source-only-before-model-dispatch',
  source_sha256:{read_tool_probe:fileSha(probePath),relational_packets:fileSha(packetsPath),
    builder:fileSha(fileURLToPath(import.meta.url))}, rows,
  claim_ceiling:'Source-only packet construction. No model delivery, quality score, or independent claim.',
  open_questions:['Will the provider accept and deliver both sealed requests?',
    'Will selection and native score improve after the extra reads?']};
mkdirSync(output, {mode:0o700});
writeFileSync(join(output, 'PACKETS.json'), JSON.stringify(result, null, 2)+'\n',
  {flag:'wx',mode:0o600});
process.stdout.write(JSON.stringify({output,sha256:fileSha(join(output,'PACKETS.json')),
  rows:rows.map(({ordinal,prior_read_count,extra_read_count,source_bytes}) =>
    ({ordinal,prior_read_count,extra_read_count,source_bytes}))})+'\n');
