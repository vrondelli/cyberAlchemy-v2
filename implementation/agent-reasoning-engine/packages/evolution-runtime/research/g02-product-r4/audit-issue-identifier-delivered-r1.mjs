// Independent read-only check of a sealed exposed G02 diagnostic.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {isDeepStrictEqual} from 'node:util';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = path => JSON.parse(readFileSync(path));
const need = (condition, code) => {if (!condition) throw Error(`g02-identifier-audit.${code}`);};
const f1 = metric => metric.coverage + metric.precision ?
  2 * metric.coverage * metric.precision / (metric.coverage + metric.precision) : 0;

export function audit({root, expectedPairs}) {
  need(typeof root === 'string' && root.startsWith('/') && resolve(root) === root, 'absolute-root');
  need(Number.isSafeInteger(expectedPairs) && expectedPairs > 0, 'expected-pairs');
  const sealPath = join(root, 'SEAL.json'), resultPath = join(root, 'RESULT.json');
  const seal = read(sealPath), result = read(resultPath);
  need(seal.schema_version === 'are.g02-issue-identifier-delivered-seal/v1' &&
    result.schema_version === 'are.g02-issue-identifier-delivered-result/v1' &&
    result.seal_sha256 === sha(readFileSync(sealPath)) &&
    seal.bindings.length === expectedPairs && result.rows.length === expectedPairs, 'receipt-shape');
  const rows = new Map(result.rows.map(row => [row.pair, row]));
  need(rows.size === expectedPairs, 'duplicate-result');
  let changed = 0, improvements = 0, regressions = 0;
  for (const binding of seal.bindings) {
    const row = rows.get(binding.pair);
    need(row && sha(readFileSync(binding.prediction)) === binding.prediction_sha256 &&
      sha(readFileSync(binding.task.path)) === binding.task.sha256, 'prediction-task-binding');
    for (const item of Object.values(binding.inputs))
      need(sha(readFileSync(item.path)) === item.sha256, 'input-binding');
    for (const [path, digest] of Object.entries(binding.source_hashes))
      need(sha(readFileSync(join(binding.source_root, path))) === digest, 'source-binding');
    const before = read(binding.inputs.prediction.path).traj_data;
    const after = read(binding.prediction).traj_data;
    need(isDeepStrictEqual(before.pred_files, after.pred_files) &&
      isDeepStrictEqual(before.pred_steps, after.pred_steps), 'file-step-drift');
    const additions = Object.entries(after.pred_spans).flatMap(([path, spans]) =>
      spans.slice(before.pred_spans[path]?.length ?? 0).map(span => ({path, span})));
    need(additions.length === binding.additions.length && additions.length === row.added_reads &&
      additions.every((addition, index) => addition.path === binding.additions[index].path &&
        isDeepStrictEqual(addition.span, binding.additions[index].span)), 'span-delta');
    const scorePath = join(root, binding.pair, 'native-score.json');
    const score = read(scorePath).native.final;
    need(sha(readFileSync(scorePath)) === row.score_sha256 &&
      Math.abs(f1(score.span) - row.span_f1) < 1e-12 &&
      Math.abs(f1(score.file) - row.file_f1) < 1e-12, 'native-score');
    const base = read(binding.inputs.are_score.path).native.final;
    const dsh = read(binding.inputs.dsh_score.path).native.final;
    need(Math.abs(f1(base.span) - row.base_span_f1) < 1e-12 &&
      Math.abs(f1(dsh.span) - row.dsh_span_f1) < 1e-12 &&
      Math.abs(f1(base.file) - row.base_file_f1) < 1e-12, 'predecessor-score');
    changed += additions.length;
    if (row.span_f1 > row.base_span_f1 + 1e-12) improvements++;
    if (row.span_f1 < row.base_span_f1 - 1e-12) regressions++;
  }
  return {status: 'passed', root, seal_sha256: sha(readFileSync(sealPath)),
    result_sha256: sha(readFileSync(resultPath)), pairs: expectedPairs,
    added_reads: changed, improved_pairs: improvements, regressed_pairs: regressions};
}

if (process.argv[1] === import.meta.filename) {
  try {console.log(JSON.stringify(audit({root: process.argv[2], expectedPairs: Number(process.argv[3])})));}
  catch (error) {console.error(JSON.stringify({status: 'failed', error: String(error.message)})); process.exitCode = 2;}
}
