// Reviewed historical discovery traces for tokenizer-only H-L qualification.
// Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {lstatSync, readFileSync, readdirSync, realpathSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {restoreRankedContext} from './ranked-read-prediction-r1.mjs';
import {restoreRankedReadEvidenceMap} from './ranked-read-evidence-r1.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const need = (value, message) => { if (!value) throw Error('recent-populated-donor.' + message); };

export function loadRecentPopulatedDonor({stage, review_sha256, sequence, candidate_slot}) {
  need(Number.isSafeInteger(sequence) && sequence >= 0 && sequence < 4, 'sequence');
  need(/^[a-f0-9]{64}$/.test(review_sha256), 'review-pin');
  const bindings = [];
  let bytes = 0;
  const canonical = value => {
    const path = resolve(value);
    need(realpathSync(path) === path, 'canonical-path');
    return path;
  };
  stage = canonical(stage);
  const read = (path, pin) => {
    path = canonical(path);
    const stat = lstatSync(path);
    need(stat.isFile() && stat.size <= 160 * 1024 ** 2 - bytes, 'read-limit');
    need(typeof pin === 'string' && /^[a-f0-9]{64}$/.test(pin), 'missing-file-pin');
    const data = readFileSync(path);
    bytes += data.length;
    need(data.length === stat.size && bytes <= 160 * 1024 ** 2 && hash(data) === pin, 'file-drift');
    bindings.push({path, sha256: pin});
    return data;
  };
  const review = JSON.parse(read(join(stage, 'RESULT-REVIEW-R1.json'), review_sha256));
  need(review.approved === true && review.result_integrity_approved === true && review.findings.length === 0,
    'review-not-approved');
  const pins = new Map();
  for (const binding of review.source_bindings) {
    const path = resolve(binding.path);
    need(!pins.has(path) || pins.get(path) === binding.sha256, 'conflicting-pin');
    pins.set(path, binding.sha256);
  }
  const pinned = path => read(path, pins.get(resolve(path)));
  const freeze = JSON.parse(pinned(join(stage, 'FREEZE.json')));
  const historical_slot = freeze.request.schedule.slots[sequence];
  need(historical_slot?.sequence === sequence && historical_slot.arm === 'schema-agreement', 'historical-slot');
  need(candidate_slot?.arm === 'recent-evidence-ledger' && candidate_slot.sequence === sequence &&
    candidate_slot.task_id === historical_slot.task_id && candidate_slot.task_sha256 === historical_slot.task_sha256 &&
    candidate_slot.instance_id === historical_slot.instance_id && candidate_slot.base_commit === historical_slot.base_commit,
  'candidate-task-binding');
  const task = JSON.parse(read(historical_slot.task_path, historical_slot.task_sha256));
  need(task.instance_id === historical_slot.instance_id && task.base_commit === historical_slot.base_commit, 'task-identity');
  const ordinal = String(sequence).padStart(2, '0');
  const run = canonical(join(stage, 'runs_root', ordinal));
  const repoRoot = canonical(join(stage, 'source_root', ordinal, 'base'));
  const result = JSON.parse(pinned(join(run, 'result.json')));
  const eventBytes = pinned(join(run, 'events.jsonl'));
  const lines = eventBytes.toString('utf8').split('\n');
  if (lines.at(-1) === '') lines.pop();
  need(lines.length > 0 && lines.length <= 100000 && lines.every(Boolean), 'journal-shape');
  const events = lines.map(JSON.parse);
  const source_index = JSON.parse(pinned(join(run, 'source-index.json')));
  const names = readdirSync(canonical(join(run, 'snapshots'))).sort();
  need(names.length <= 4096 && names.every(name => /^[a-f0-9]{64}\.json$/.test(name)), 'snapshot-names');
  const snapshots = names.map(name => JSON.parse(pinned(join(run, 'snapshots', name))));
  const context = restoreRankedContext({source_index, snapshots, task});
  const ranked_evidence = restoreRankedReadEvidenceMap(result.branches[0].ranked_evidence_records, context);
  const git = args => execFileSync('git', ['--no-optional-locks', '-c', 'core.hooksPath=/dev/null',
    '-c', 'core.fsmonitor=false', ...args], {cwd: repoRoot, encoding: 'utf8', timeout: 120000,
    maxBuffer: 1048576, env: {...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_NO_LAZY_FETCH: '1', GIT_ALLOW_PROTOCOL: '', GIT_TERMINAL_PROMPT: '0'}}).trim();
  need(git(['rev-parse', 'HEAD']) === task.base_commit && git(['status', '--porcelain']) === '', 'source-drift');
  need(Array.isArray(result.receipts) && result.receipts.some(receipt => receipt.kind === 'model'), 'historical-receipts');
  const material = {task, events, receipts: result.receipts, snapshots, ranked_evidence, repoRoot,
    historical_schedule_sha256: freeze.request.schedule.schedule_sha256, source_bindings: bindings};
  return {...material, donor_sha256: hash(stable({...material, ranked_evidence: [...ranked_evidence.entries()]})),
    scope: 'Reviewed historical discovery captures and confirmed source snapshots; no gold, scorer, or new model generation.'};
}
