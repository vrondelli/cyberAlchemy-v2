// Reviewed parent boundary for tokenizer-only H-L final qualification.
// Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import {readFileSync, mkdirSync, realpathSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fileHash, verifyCandidateSources} from './candidate-only-source-freeze.mjs';
import {verifyRecentEvidenceFinalFreeze, RECENT_FINAL_STAGE_BYTES} from './recent-evidence-final-stage-r1.mjs';
import {runRecentEvidenceFinalQualification} from './recent-evidence-final-process-r1.mjs';
import {createStageOutputGuard} from './comparison-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {persistCatalogFinalOutcome} from './measured-terminal-catalog-final-parent-output-r1.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';

const need = (value, message) => { if (!value) throw Error('recent-final-command.' + message); };
const [manifest_path, manifest_sha256, review_path, review_sha256] = process.argv.slice(2);
const controller = new AbortController();
process.on('SIGTERM', () => controller.abort());
process.on('SIGINT', () => controller.abort());
let persistence, supervision, result;
try {
  need(fileHash(review_path) === review_sha256, 'review-drift');
  const review = JSON.parse(readFileSync(review_path));
  need(review.approved === true && review.tokenizer_execution_admitted === true &&
    review.manifest_sha256 === manifest_sha256, 'exact-tokenizer-review');
  const reviewFiles = review.source_bindings.map(binding => ({...binding, path: resolve(binding.path)}));
  verifyCandidateSources(reviewFiles, [fileURLToPath(import.meta.url)]);
  const args = {manifest_path, manifest_sha256};
  const freeze = verifyRecentEvidenceFinalFreeze(args);
  supervision = join(dirname(resolve(manifest_path)), 'supervision');
  need(realpathSync(dirname(supervision)) === dirname(supervision), 'canonical-parent');
  need(guardStorage({binding: freeze.request.binding, output: supervision,
    growth_reservation_bytes: 2 * RECENT_FINAL_STAGE_BYTES}).admitted === true, 'storage');
  mkdirSync(supervision, {mode: 0o700});
  const guard = createStageOutputGuard({root: supervision, maximum_bytes: RECENT_FINAL_STAGE_BYTES});
  persistence = createStagePersistence({stage_root: supervision, stage_guard: guard});
  try {
    result = await runRecentEvidenceFinalQualification({request: args, signal: controller.signal});
    verifyRecentEvidenceFinalFreeze(args);
    need(fileHash(review_path) === review_sha256, 'post-review-drift');
    verifyCandidateSources(reviewFiles, [fileURLToPath(import.meta.url)]);
    need(guardStorage({binding: freeze.request.binding, output: supervision,
      growth_reservation_bytes: RECENT_FINAL_STAGE_BYTES}).admitted === true, 'post-storage');
  } catch (error) {
    if (!error.result && result) error.result = {...result, qualified: false,
      postcheck_error: String(error.message)};
    throw error;
  }
  persistCatalogFinalOutcome({persistence, supervision, value: result});
  console.log(JSON.stringify({qualified: true, model_calls: result.measurement_report.model_calls,
    rows: result.measurement_report.rows.map(row => ({slot_id: row.slot_id,
      projected_tokens: row.result.projected_tokens,
      handles: row.result.packet.fit.rendered_handles})),
    qualification_path: join(supervision, 'RESULTS.json'),
    qualification_sha256: fileHash(join(supervision, 'RESULTS.json')),
    process_settlement: result.process_settlement}));
} catch (error) {
  const failure = {qualified: false, error: String(error.message), evidence: error.result ?? result ?? null};
  if (persistence) try {
    persistCatalogFinalOutcome({persistence, supervision, value: failure, failed: true});
  } catch (persistenceError) { failure.persistence_failure = String(persistenceError.message); }
  console.log(JSON.stringify(failure));
  process.exitCode = 2;
}
