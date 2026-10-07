// Source-only pre-score audit for a live G01 span-refinement diagnostic.
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {applyLiveSpanRefinement} from '../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/orchestrate-intent-anchor-r3.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (value, code) => {if (!value) throw Error(`g01-span-live-audit.${code}`);};
const read = path => JSON.parse(readFileSync(path));

export function auditLiveSpanRefinement({freezePath, freezeSha256}) {
  need(typeof freezePath === 'string' && freezePath.startsWith('/') && resolve(freezePath) === freezePath, 'absolute-freeze');
  need(sha(readFileSync(freezePath)) === freezeSha256, 'freeze-drift');
  const freeze = read(freezePath);
  need(freeze.span_refinement_policy === 'source-only-go-selected-subspan-r1' && freeze.claim_ceiling.startsWith('Exposed-task mechanism diagnostic only'), 'policy');
  for (const binding of freeze.sources) need(sha(readFileSync(binding.path)) === binding.sha256, 'source-drift');
  const out = join(freeze.output_root, 'runs', '00');
  need(!existsSync(join(out, 'native-score.json')), 'already-scored');
  const config = read(freeze.config_path), taskRow = config.tasks.find(x => x.id === freeze.task_id);
  need(taskRow?.task_sha256 === freeze.task_sha256 && sha(readFileSync(taskRow.task_path)) === freeze.task_sha256, 'task-drift');
  const task = read(taskRow.task_path), result = read(join(out, 'result.json')), episode = read(join(out, 'episode.json'));
  need(result.status === 'final_context_selected' && stable(result.exported) === stable(episode.exported), 'original-export');
  const receiptPath = join(out, 'span-refinement.json'), receipt = read(receiptPath);
  const replay = applyLiveSpanRefinement({original: episode.exported, problem_statement: task.problem_statement,
    task_sha256: freeze.task_sha256, source_base: join(freeze.output_root, 'source', '00', 'base')});
  need(stable(receipt) === stable(replay.receipt), 'receipt-replay');
  need(stable(result.native_export) === stable(replay.exported) &&
    stable(read(join(out, 'export-evidence.json'))) === stable(replay.exported) &&
    stable(read(join(out, 'prediction.json'))) === stable(replay.exported.prediction), 'prediction-replay');
  const audit = {schema_version: 'are.g01-live-span-refinement-audit/v1', status: 'passed-pre-score',
    freeze_sha256: freezeSha256, auditor_sha256: sha(readFileSync(import.meta.filename)), original_prediction_sha256: receipt.original_prediction_sha256,
    final_prediction_sha256: receipt.final_prediction_sha256, receipt_sha256: sha(readFileSync(receiptPath)),
    prediction_sha256: sha(readFileSync(join(out, 'prediction.json'))), changed_spans: receipt.changes.length,
    claim_ceiling: 'Source-only provenance and deterministic replay only; not native quality or a superiority result.'};
  const path = join(resolve(freezePath, '..'), 'REFINEMENT-AUDIT.json');
  need(!existsSync(path), 'already-audited');
  writeFileSync(path, JSON.stringify(audit, null, 2) + '\n', {flag: 'wx', mode: 0o600});
  return {path, sha256: sha(readFileSync(path)), changed_spans: audit.changed_spans};
}

if (process.argv[1] === import.meta.filename) {
  try {console.log(JSON.stringify(auditLiveSpanRefinement({freezePath: process.argv[2], freezeSha256: process.argv[3]})));}
  catch (error) {console.error(JSON.stringify({status: 'failed', error: String(error.message)})); process.exitCode = 2;}
}
