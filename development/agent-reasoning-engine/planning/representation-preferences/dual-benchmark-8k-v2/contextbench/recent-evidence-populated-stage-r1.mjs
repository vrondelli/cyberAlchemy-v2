// Exact tokenizer-only populated-ledger stage.
// Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import {readFileSync, realpathSync, readdirSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {verifyCandidateSources, fileHash} from './candidate-only-source-freeze.mjs';
import {loadRecentPopulatedDonor} from './recent-evidence-populated-donor-r1.mjs';
import {qualifyRecentPopulatedCampaign} from './recent-evidence-populated-campaign-r1.mjs';
import {verifyRecentEvidenceSchedule} from './recent-evidence-schedule-r1.mjs';
import {createStageOutputGuard} from './comparison-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';

const need = (value, message) => { if (!value) throw Error('recent-populated-stage.' + message); };
export const POPULATED_STAGE_BYTES = 96 * 1024 ** 2;
export const POPULATED_STAGE_ENTRIES = ['recent-evidence-populated-stage-r1.mjs',
  'recent-evidence-populated-worker-r1.mjs', 'recent-evidence-populated-process-r1.mjs',
  'recent-evidence-populated-campaign-r1.mjs', 'recent-evidence-populated-qualification-r1.mjs',
  'recent-evidence-populated-donor-r1.mjs'];

export function verifyRecentPopulatedFreeze({manifest_path, manifest_sha256}) {
  need(fileHash(manifest_path) === manifest_sha256, 'manifest-drift');
  const freeze = JSON.parse(readFileSync(manifest_path));
  need(freeze.schema === 'are.recent-evidence-populated-stage-freeze/v1', 'schema');
  const root = import.meta.dirname;
  const entries = POPULATED_STAGE_ENTRIES.map(name => join(root, name));
  entries.push(process.execPath, freeze.request.sources.config_path, freeze.request.sources.cohort_path,
    freeze.request.credential_path, freeze.request.binding.provenance.path);
  verifyCandidateSources(freeze.files, entries);
  const pins = new Map(freeze.files.map(binding => [binding.path, binding.sha256]));
  verifyRecentEvidenceSchedule({schedule: freeze.request.schedule, ...freeze.request.sources});
  need(freeze.request.schedule.fresh_control_runs === false && freeze.request.schedule.assigned_outcomes === 4 &&
    freeze.request.schedule.slots.every(slot => slot.arm === 'recent-evidence-ledger'), 'candidate-only');
  const donors = freeze.request.schedule.slots.map(slot => loadRecentPopulatedDonor({
    stage: freeze.request.donor_stage, review_sha256: freeze.request.donor_review_sha256,
    sequence: slot.sequence, candidate_slot: slot}));
  for (const donor of donors) for (const binding of donor.source_bindings)
    need(pins.get(binding.path) === binding.sha256, 'donor-binding');
  need(Array.isArray(freeze.reviews) && freeze.reviews.length >= 4, 'reviews');
  for (const path of freeze.reviews) {
    need(pins.has(resolve(path)), 'review-binding');
    const review = JSON.parse(readFileSync(path));
    need(review.approved === true && review.findings.length === 0, 'construction-review');
    for (const binding of review.source_bindings)
      need(pins.get(resolve(binding.path)) === binding.sha256, 'review-source-binding');
  }
  need(freeze.maximum_bytes === POPULATED_STAGE_BYTES, 'output-bound');
  return freeze;
}

export async function runRecentPopulatedStage(args, {host_guard = guardStorage} = {}) {
  const freeze = verifyRecentPopulatedFreeze(args), request = freeze.request, root = resolve(request.out);
  need(realpathSync(root) === root && readdirSync(root).length === 0, 'fresh-root');
  const guard = createStageOutputGuard({root, maximum_bytes: POPULATED_STAGE_BYTES});
  const persistence = createStagePersistence({stage_root: root, stage_guard: guard});
  const before_measure = () => {
    const state = guard.snapshot();
    need(!state.poisoned, 'poisoned-storage');
    need(host_guard({binding: request.binding, output: root,
      growth_reservation_bytes: Math.max(0, POPULATED_STAGE_BYTES - state.bytes)}).admitted === true, 'host-storage');
    return true;
  };
  before_measure();
  let report;
  try {
    report = await qualifyRecentPopulatedCampaign({...request, persistence, signal: args.signal, before_measure});
    verifyRecentPopulatedFreeze(args);
    before_measure();
    return report;
  } catch (error) {
    if (!error.result && report) error.result = {...report, qualified: false, postcheck_error: String(error.message)};
    throw error;
  }
}
