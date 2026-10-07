// Read-only post-score check; never creates or changes a benchmark receipt.
import {createHash} from 'node:crypto';
import {readFileSync, statSync} from 'node:fs';
import {join, resolve} from 'node:path';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = path => JSON.parse(readFileSync(path));
const need = (value, code) => {if (!value) throw Error(`g01-span-postscore-audit.${code}`);};
const f1 = x => x.coverage + x.precision ? 2 * x.coverage * x.precision / (x.coverage + x.precision) : 0;

export function auditExposedSpanResult({root, freezeSha256, predecessorPairRoot}) {
  need([root, predecessorPairRoot].every(x => typeof x === 'string' && x.startsWith('/') && resolve(x) === x), 'absolute-roots');
  const freezePath = join(root, 'CANDIDATE-FREEZE.json'), freeze = read(freezePath);
  need(sha(readFileSync(freezePath)) === freezeSha256 && freeze.span_refinement_policy === 'source-only-go-selected-subspan-r1', 'freeze');
  for (const source of freeze.sources) need(sha(readFileSync(source.path)) === source.sha256, 'source-drift');
  const priorPath = join(predecessorPairRoot, 'PAIR-RESULT.json'), prior = read(priorPath);
  need(prior.status === 'scored' && prior.task_sha256 === freeze.task_sha256, 'predecessor');
  const out = join(freeze.output_root, 'runs', '00'), predictionPath = join(out, 'prediction.json'), scorePath = join(out, 'native-score.json');
  const auditPath = join(root, 'REFINEMENT-AUDIT.json'), audit = read(auditPath), sealPath = join(root, 'PREDICTION-SEAL.json'), seal = read(sealPath), resultPath = join(root, 'DIAGNOSTIC-RESULT.json'), result = read(resultPath);
  need(audit.status === 'passed-pre-score' && audit.freeze_sha256 === freezeSha256 && audit.prediction_sha256 === sha(readFileSync(predictionPath)) &&
    seal.status === 'sealed-before-native-scoring' && seal.prediction_sha256 === audit.prediction_sha256 &&
    result.freeze_sha256 === freezeSha256 && result.seal_sha256 === sha(readFileSync(sealPath)) &&
    result.prediction_sha256 === seal.prediction_sha256 && result.native_score_sha256 === sha(readFileSync(scorePath)) &&
    result.previous_pair_result_sha256 === sha(readFileSync(priorPath)), 'receipt-binding');
  need(statSync(auditPath).mtimeMs <= statSync(sealPath).mtimeMs && statSync(sealPath).mtimeMs <= statSync(scorePath).mtimeMs, 'score-order');
  const score = read(scorePath), run = read(join(out, 'result.json'));
  need(run.status === 'final_context_selected' && Math.abs(f1(score.native.final.span) - result.diagnostic.span_f1) < 1e-12 &&
    Math.abs(f1(score.native.final.file) - result.diagnostic.file_f1) < 1e-12, 'metric-recompute');
  const models = run.receipts.filter(x => x.kind === 'model');
  need(models.length === result.diagnostic.model_calls && models.every(x => Number.isSafeInteger(x.input_tokens) && Number.isSafeInteger(x.output_tokens)) &&
    models.reduce((n, x) => n + x.input_tokens + x.output_tokens, 0) === result.diagnostic.known_model_tokens, 'usage-recompute');
  return {status: 'passed',root,freeze_sha256: freezeSha256,pre_score_audit_sha256: sha(readFileSync(auditPath)),
    diagnostic_result_sha256: sha(readFileSync(resultPath)),changed_spans: audit.changed_spans,
    span_f1: result.diagnostic.span_f1,file_f1: result.diagnostic.file_f1,known_model_tokens: result.diagnostic.known_model_tokens};
}

if (process.argv[1] === import.meta.filename) {
  try {console.log(JSON.stringify(auditExposedSpanResult({root: process.argv[2], freezeSha256: process.argv[3], predecessorPairRoot: process.argv[4]})));}
  catch (error) {console.error(JSON.stringify({status: 'failed', error: String(error.message)})); process.exitCode = 2;}
}
