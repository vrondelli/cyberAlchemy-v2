// Source-only rewindow of sealed extra paths for an access-control issue.
import {createHash} from 'node:crypto';
import {readFileSync, mkdirSync, writeFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createRepositoryTools} from '../../../../benchmarks/contextbench-v1/repository-tools.mjs';
import {attachObservationHandles, stable} from '../../../../benchmarks/contextbench-v1/delivery.mjs';

const archive = '/home/vlad_/are-benchmark-archive';
const priorPath = join(archive,'g02-r11-code-anchor-model-delivery-exposed-r1-20261003/PACKETS.json');
const priorSha = 'b74d133cd59e8c38cbe19a6c99aba1c09e0f298455398529f6cdef31dc1107e5';
const root = join(archive,'g02-r11-task8-access-window-exposed-r2-20261003');
const base = join(archive,'g02-product-replication-r11-20261002/pairs/08-pr11-mixed-08/raw/sources/session/base');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fileSha = path => sha(readFileSync(path));
const need = (ok, reason) => {if (!ok) throw Error(`g02-access-window.${reason}`);};
need(fileSha(priorPath) === priorSha && !existsSync(root), 'input-or-output');
const prior = JSON.parse(readFileSync(priorPath));
const task = prior.rows.find(row => row.ordinal === 8);
need(task && task.extra_read_count === 3 && /#define private public/.test(task.issue) &&
  /JSON_PRIVATE_UNLESS_TESTED/.test(task.issue) &&
  execFileSync('git',['-C',base,'rev-parse','HEAD'],{encoding:'utf8'}).trim() === task.base_commit,
  'task-scope');
const tool = createRepositoryTools({root:base,base_commit:task.base_commit});
const reads = task.reads.filter(read => read.role === 'prior');
const changes = [];
for (const old of task.reads.filter(read => read.role === 'extra')) {
  const raw = readFileSync(join(base,old.path),'utf8');
  const lines = raw.split('\n');
  const accessIndex = lines.findIndex(line => /^\s*private\s*:/.test(line));
  need(accessIndex >= 0, 'missing-access-section');
  const args = {path:old.path,start_line:Math.max(1,accessIndex + 1 - 15),
    line_count:50,revision:'base'};
  const call = {id:`access-window-r2-8-${reads.length}-${sha(stable(args)).slice(0,16)}`,
    function:{name:'read_file',arguments:stable(args)}};
  const result = attachObservationHandles(call,await tool('read_file',args));
  need(result.ok === true && result.output.source_sha256 === old.source_sha256 &&
    result.output.utf8.includes('private:'), 'read-drift');
  reads.push({index:reads.length,path:old.path,start_line:result.output.start_line,
    end_line:result.output.end_line,read_id:result.output.read_id,
    source_sha256:result.output.source_sha256,source:result.output.utf8,role:'extra'});
  changes.push({path:old.path,old_start_line:old.start_line,new_start_line:result.output.start_line,
    access_line:accessIndex+1,new_bytes:result.output.byte_count});
}
const bytes = reads.reduce((sum,read)=>sum+Buffer.byteLength(read.source),0);
need(reads.length === 9 && bytes <= 49152 && reads.every((read,index)=>read.index===index),
  'packet-cap');
const packet = {schema_version:'are.g02-r11-task8-access-window-exposed-r2/v1',
  posture:'exposed-source-only-before-model-dispatch',
  source_sha256:{prior_packets:priorSha,builder:fileSha(fileURLToPath(import.meta.url))},
  rule:'When the issue explicitly proposes replacing private/public access syntax, keep the sealed candidate paths and rewindow each at its first exact private: access section (15 preceding lines, 50-line read).',
  ordinal:8,instance_id:task.instance_id,base_commit:task.base_commit,issue:task.issue,
  prior_read_count:task.prior_read_count,extra_read_count:3,source_bytes:bytes,changes,reads,
  model_calls:0,gold_loaded:false,
  claim_ceiling:'Source-only exposed window test; no model delivery, quality score, or independent claim.',
  open_questions:['Does this expose more issue-relevant code to the model?',
    'Will the model select the omitted useful path without extra false positives?']};
mkdirSync(root,{mode:0o700});
writeFileSync(join(root,'PACKET.json'),JSON.stringify(packet,null,2)+'\n',{flag:'wx',mode:0o600});
process.stdout.write(JSON.stringify({packet_sha256:fileSha(join(root,'PACKET.json')),
  source_bytes:bytes,changes})+'\n');
