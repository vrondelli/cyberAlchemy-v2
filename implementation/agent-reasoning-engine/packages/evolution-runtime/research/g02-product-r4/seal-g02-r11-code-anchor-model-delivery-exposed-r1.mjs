// Seal exposed GLM selections before evaluator-only reference access.
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {stable} from '../../../../benchmarks/contextbench-v1/delivery.mjs';

const root = '/home/vlad_/are-benchmark-archive/g02-r11-code-anchor-model-delivery-exposed-r1-20261003';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fileSha = path => sha(readFileSync(path));
const load = name => JSON.parse(readFileSync(join(root,name), 'utf8'));
const need = (ok, reason) => {if (!ok) throw Error(`g02-model-delivery-seal.${reason}`);};
const output = join(root,'SEALED-RESPONSES.json');
need(!existsSync(output), 'already-sealed');
const packets = load('PACKETS.json');
const freeze = load('FREEZE.json');
const result = load('RUN-RESULT.json');
need(fileSha(join(root,'PACKETS.json')) === freeze.packet_sha256 &&
  fileSha(join(root,'run-g02-r11-code-anchor-model-delivery-exposed-r1.mjs')) === freeze.runner_sha256 &&
  freeze.status === 'frozen-before-model-dispatch' &&
  result.status === 'completed-exposed-diagnostic' && result.completed === 2,
  'frozen-input-or-run');
const rows = [];
let totalTokens = 0;
for (const row of packets.rows) {
  need([4,8].includes(row.ordinal), 'ordinal');
  const request = load(`REQUEST-${row.ordinal}.json`);
  const started = load(`STARTED-${row.ordinal}.json`);
  const response = load(`RESPONSE-${row.ordinal}.json`);
  const token = load(`TOKENIZER-${row.ordinal}.json`);
  const requestSha = sha(stable(request));
  const body = JSON.parse(request.messages?.[1]?.content ?? 'null');
  need(requestSha === started.request_sha256 && requestSha === response.request_sha256 &&
    request.model === freeze.model && request.max_tokens === freeze.maximum_output_tokens &&
    request.messages[0].content === freeze.prompt &&
    body.instance_id === row.instance_id && body.issue === row.issue &&
    body.base_commit === row.base_commit && stable(body.reads) === stable(row.reads) &&
    response.source_read_ids.join(',') === row.reads.map(read => read.read_id).join(','),
    'request-binding');
  need(token.http_status === 200 && Number.isSafeInteger(token.prompt_tokens) &&
    token.prompt_tokens <= freeze.maximum_input_tokens &&
    response.status === 'valid' && response.http_status === 200 &&
    response.finish_reason === 'stop' && response.failure_code == null,
    'delivery-status');
  const parsed = JSON.parse(response.content);
  need(stable(parsed) === stable({selected_read_indexes:response.selected_read_indexes}) &&
    response.selected_read_indexes.length <= 8 &&
    new Set(response.selected_read_indexes).size === response.selected_read_indexes.length &&
    response.selected_read_indexes.every(index => Number.isSafeInteger(index) &&
      index >= 0 && index < row.reads.length) &&
    stable(response.selected_paths) === stable(response.selected_read_indexes.map(index => row.reads[index].path)),
    'selection-binding');
  const usage = response.usage;
  need(Number.isSafeInteger(usage.prompt_tokens) && usage.prompt_tokens > 0 &&
    Number.isSafeInteger(usage.completion_tokens) && usage.completion_tokens > 0 &&
    usage.total_tokens === usage.prompt_tokens + usage.completion_tokens,
    'usage');
  totalTokens += usage.total_tokens;
  rows.push({ordinal:row.ordinal,request_sha256:requestSha,
    request_file_sha256:fileSha(join(root,`REQUEST-${row.ordinal}.json`)),
    started_sha256:fileSha(join(root,`STARTED-${row.ordinal}.json`)),
    response_sha256:fileSha(join(root,`RESPONSE-${row.ordinal}.json`)),
    selected_read_indexes:response.selected_read_indexes,
    selected_paths:response.selected_paths,
    selected_extra_paths:response.selected_read_indexes.filter(index => row.reads[index].role === 'extra')
      .map(index => row.reads[index].path),
    known_model_tokens:usage.total_tokens,elapsed_ms:response.elapsed_ms});
}
need(rows.map(row => row.ordinal).join(',') === '4,8', 'row-order');
const seal = {schema_version:'are.g02-r11-code-anchor-model-delivery-seal/v1',
  posture:'exposed-model-outputs-sealed-before-evaluator',
  packet_sha256:fileSha(join(root,'PACKETS.json')),
  freeze_sha256:fileSha(join(root,'FREEZE.json')),
  run_result_sha256:fileSha(join(root,'RUN-RESULT.json')),
  rows,known_model_tokens_total:totalTokens,
  claim_ceiling:'One-shot exposed selection over exact ARE tool observations, not a full ARE episode, native score, independent campaign, or superiority.',
  open_questions:['Do selected paths improve exposed File-/Span-F1 when evaluated?',
    'Can an online integrated policy reproduce any gain with all-in cost?',
    'Will a fresh cohort independently validate quality and cost?']};
writeFileSync(output, JSON.stringify(seal,null,2)+'\n', {flag:'wx',mode:0o600});
process.stdout.write(JSON.stringify({seal_sha256:fileSha(output),known_model_tokens_total:totalTokens,
  rows:rows.map(row => ({ordinal:row.ordinal,selected_paths:row.selected_paths,
    selected_extra_paths:row.selected_extra_paths}))})+'\n');
