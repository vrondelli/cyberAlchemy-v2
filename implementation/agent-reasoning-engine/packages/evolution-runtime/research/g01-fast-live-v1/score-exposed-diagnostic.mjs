// Seal and natively score one already-exposed G01 development diagnostic.
// This is not a pair, campaign, holdout, or product-claim receipt.
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

const sha = value => createHash('sha256').update(value).digest('hex');
const need = (value, code) => { if (!value) throw Error(`g01-exposed-score.${code}`); };
const read = path => JSON.parse(readFileSync(path));
const save = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n', {flag: 'wx', mode: 0o600});
const f1 = score => { const {coverage, precision} = score; return coverage + precision ? 2 * coverage * precision / (coverage + precision) : 0; };

export function scoreExposedDiagnostic({freezePath, freezeSha256, previousPairRoot}) {
  need([freezePath, previousPairRoot].every(x => typeof x === 'string' && x.startsWith('/') && resolve(x) === x), 'absolute-paths');
  need(sha(readFileSync(freezePath)) === freezeSha256, 'freeze-drift');
  const freeze = read(freezePath), previousPlan = read(join(previousPairRoot, 'PAIR-PLAN.json'));
  need(freeze.claim_ceiling?.startsWith('Exposed-task mechanism diagnostic only') &&
    previousPlan.scorer?.image === 'are-contextbench-scorer:g01-r1', 'development-only-and-scorer');
  const previous = read(join(previousPairRoot, 'PAIR-RESULT.json'));
  need(previous.status === 'scored' && previous.task_sha256 === freeze.task_sha256, 'same-exposed-task');
  const out = join(freeze.output_root, 'runs', '00');
  const predictionPath = join(out, 'prediction.json'), scorePath = join(out, 'native-score.json');
  const sealPath = join(resolve(freezePath, '..'), 'PREDICTION-SEAL.json');
  const resultPath = join(resolve(freezePath, '..'), 'DIAGNOSTIC-RESULT.json');
  need(!existsSync(scorePath) && !existsSync(sealPath) && !existsSync(resultPath), 'already-scored-or-sealed');
  need(read(join(out, 'result.json')).status === 'final_context_selected', 'not-final-context');
  const predictionSha256 = sha(readFileSync(predictionPath));
  save(sealPath, {schema_version: 'are.g01-exposed-diagnostic-seal/v1', status: 'sealed-before-native-scoring',
    freeze_sha256: freezeSha256, task_sha256: freeze.task_sha256, prediction_sha256: predictionSha256,
    scoring_status_at_seal: 'not-started', claim_ceiling: freeze.claim_ceiling});
  const scorer = previousPlan.scorer;
  const args = ['run', '--rm', '--network', 'host', '-v', `${scorer.repo}:/repo:ro`, '-v', `${scorer.upstream}:/upstream:ro`,
    '-v', `${scorer.cache}:/cache`, '-v', `${out}:/work`, scorer.image, 'python',
    '/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py',
    '--upstream', '/upstream', '--gold', '/upstream/data/full.parquet', '--pred', '/work/prediction.json',
    '--cache', '/cache', '--out', '/work/native-score.json'];
  const run = spawnSync('docker', args, {encoding: 'utf8', timeout: 180000, maxBuffer: 2 * 1024 * 1024});
  need(!run.error && run.status === 0 && existsSync(scorePath), 'native-score-failed');
  need(sha(readFileSync(predictionPath)) === predictionSha256, 'prediction-drift-after-seal');
  const score = read(scorePath), result = read(join(out, 'result.json'));
  const row = {span_f1: f1(score.native.final.span), file_f1: f1(score.native.final.file),
    known_model_tokens: result.receipts.filter(x => x.kind === 'model').reduce((n, x) => n + x.input_tokens + x.output_tokens, 0),
    model_calls: result.receipts.filter(x => x.kind === 'model').length};
  const receipt = {schema_version: 'are.g01-exposed-diagnostic-result/v1', status: 'scored-development-only',
    freeze_sha256: freezeSha256, task_sha256: freeze.task_sha256,
    seal_sha256: sha(readFileSync(sealPath)), prediction_sha256: predictionSha256,
    native_score_sha256: sha(readFileSync(scorePath)), previous_pair_result_sha256: sha(readFileSync(join(previousPairRoot, 'PAIR-RESULT.json'))),
    previous_control: {span_f1: previous.control.span_f1, file_f1: previous.control.file_f1},
    previous_candidate: {span_f1: previous.candidate.span_f1, file_f1: previous.candidate.file_f1},
    diagnostic: row, claim_ceiling: freeze.claim_ceiling,
    open_questions: ['Does this mechanism improve other exposed tasks without regressions and survive a separately frozen holdout?']};
  save(resultPath, receipt);
  return {path: resultPath, sha256: sha(readFileSync(resultPath)), diagnostic: row};
}

if (process.argv[1] === import.meta.filename) {
  try { console.log(JSON.stringify(scoreExposedDiagnostic({freezePath: process.argv[2], freezeSha256: process.argv[3], previousPairRoot: process.argv[4]}))); }
  catch (error) { console.error(JSON.stringify({status: 'failed', error: String(error.message)})); process.exitCode = 2; }
}
