// Reviewed parent boundary; tokenizer requests only.
// Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import {readFileSync, mkdirSync, realpathSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fileHash, verifyCandidateSources} from './candidate-only-source-freeze.mjs';
import {verifyRecentPopulatedFreeze, POPULATED_STAGE_BYTES} from './recent-evidence-populated-stage-r3.mjs';
import {runRecentPopulatedQualification} from './recent-evidence-populated-process-r3.mjs';
import {createStageOutputGuard} from './comparison-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {persistCatalogFinalOutcome} from './measured-terminal-catalog-final-parent-output-r1.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';

const need = (value, message) => { if (!value) throw Error('recent-populated-command.' + message); };
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
  const args = {manifest_path, manifest_sha256}, freeze = verifyRecentPopulatedFreeze(args);
  supervision = join(dirname(resolve(manifest_path)), 'supervision');
  need(realpathSync(dirname(supervision)) === dirname(supervision), 'canonical-parent');
  need(guardStorage({binding: freeze.request.binding, output: supervision,
    growth_reservation_bytes: 2 * POPULATED_STAGE_BYTES}).admitted === true, 'storage');
  mkdirSync(supervision, {mode: 0o700});
  const guard = createStageOutputGuard({root: supervision, maximum_bytes: POPULATED_STAGE_BYTES});
  persistence = createStagePersistence({stage_root: supervision, stage_guard: guard});
  try {
    result = await runRecentPopulatedQualification({request: args, signal: controller.signal});
    verifyRecentPopulatedFreeze(args);
    need(fileHash(review_path) === review_sha256, 'post-review-drift');
    verifyCandidateSources(reviewFiles, [fileURLToPath(import.meta.url)]);
    need(guardStorage({binding: freeze.request.binding, output: supervision,
      growth_reservation_bytes: POPULATED_STAGE_BYTES}).admitted === true, 'post-storage');
  } catch (error) {
    if (!error.result && result) error.result = {...result, qualified: false, postcheck_error: String(error.message)};
    throw error;
  }
  persistCatalogFinalOutcome({persistence, supervision, value: result});
  console.log(JSON.stringify({qualified: true, model_calls: result.measurement_report.model_calls,
    requests_measured: result.measurement_report.requests_measured,
    populated_requests: result.measurement_report.populated_requests,
    maximum_envelope_tokens: result.measurement_report.maximum_envelope_tokens,
    rows: result.measurement_report.rows.map(row => ({slot_id: row.slot_id,
      requests_measured: row.result.requests_measured, populated_requests: row.result.populated_requests,
      maximum_envelope_tokens: row.result.maximum_envelope_tokens})),
    qualification_path: join(supervision, 'RESULTS.json'),
    qualification_sha256: fileHash(join(supervision, 'RESULTS.json')),
    process_settlement: result.process_settlement}));
} catch (error) {
  const failure = {qualified: false, error: String(error.message), evidence: error.result ?? result ?? null};
  if (persistence) try { persistCatalogFinalOutcome({persistence, supervision, value: failure, failed: true}); }
  catch (persistError) { failure.persistence_failure = String(persistError.message); }
  console.log(JSON.stringify(failure));
  process.exitCode = 2;
}
