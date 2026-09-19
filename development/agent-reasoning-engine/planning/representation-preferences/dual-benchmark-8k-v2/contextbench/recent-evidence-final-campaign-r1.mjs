// Four-task representative H-L final-request qualification; tokenizer only.
// Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import {join} from 'node:path';
import {loadRecentFinalDonor} from './recent-evidence-final-donor-r1.mjs';
import {qualifyRecentEvidenceFinalRequest} from './recent-evidence-final-qualification-r1.mjs';
import {comparisonLiveClientFactory} from './recent-evidence-live-client-r1.mjs';
import {verifyRecentEvidenceSchedule} from './recent-evidence-schedule-r1.mjs';

const need = (value, message) => { if (!value) throw Error('recent-final-campaign.' + message); };

export async function qualifyRecentEvidenceFinalCampaign(request, {
  load = loadRecentFinalDonor,
  qualify = qualifyRecentEvidenceFinalRequest,
  create_factory = comparisonLiveClientFactory,
  verify_schedule = verifyRecentEvidenceSchedule,
} = {}) {
  const {schedule, sources, donor_stage, donor_review_sha256, out, persistence, signal,
    credential_path, before_measure} = request;
  verify_schedule({schedule, ...sources});
  need(schedule.slots.length === 4 && schedule.fresh_control_runs === false &&
    schedule.slots.every(slot => slot.arm === 'recent-evidence-ledger'), 'candidate-only');
  need(signal instanceof AbortSignal && !signal.aborted && typeof before_measure === 'function', 'admission');
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal.addEventListener('abort', cancel, {once: true});
  const rows = schedule.slots.map(slot => ({slot_id: slot.slot_id, status: 'not-started',
    qualified: false, model_calls: 0}));
  const donors = [];
  let next = 0;
  const donorArgs = slot => ({stage: donor_stage, review_sha256: donor_review_sha256,
    sequence: slot.sequence, candidate_slot: slot});
  const check = async () => {
    need(!controller.signal.aborted, 'cancelled');
    need(await before_measure() === true, 'storage-or-source-admission');
    return true;
  };
  async function worker() {
    while (next < 4 && !controller.signal.aborted) {
      const index = next++;
      const slot = schedule.slots[index];
      const donor = donors[index];
      let result;
      try {
        await check();
        const factory = create_factory({credential_path, signal: controller.signal, persistence,
          before_dispatch: check});
        result = await qualify({...donor, cell: slot.cell, out: join(out, String(index).padStart(2, '0')),
          persistence, signal: controller.signal, create_client: factory.create_client,
          measure_index_tokens: factory.measure_index_tokens, before_measure: check});
        need(result.qualified === true && result.model_calls === 0, 'qualification-failed');
        await check();
        need(load(donorArgs(slot)).donor_sha256 === donor.donor_sha256, 'donor-drift');
        rows[index] = {slot_id: slot.slot_id, status: 'qualified', qualified: true, model_calls: 0,
          donor_sha256: donor.donor_sha256, source_bindings: donor.source_bindings, result};
      } catch (error) {
        const evidence = error.result ?? result;
        rows[index] = {slot_id: slot.slot_id, status: 'failed', qualified: false,
          model_calls: evidence?.model_calls ?? 0, donor_sha256: donor.donor_sha256,
          source_bindings: donor.source_bindings, result: evidence ?? null, error: String(error.message)};
        controller.abort();
      }
    }
  }
  try {
    for (const slot of schedule.slots) {
      await check();
      donors.push(load(donorArgs(slot)));
    }
    await Promise.all([worker(), worker()]);
    const report = {schema: 'are.recent-evidence-final-campaign/v1',
      schedule_sha256: schedule.schedule_sha256, donor_review_sha256,
      qualified: rows.every(row => row.qualified),
      model_calls: rows.reduce((total, row) => total + row.model_calls, 0), workers: 2, rows,
      live_generation_admitted: false};
    try { persistence.writeJson(join(out, 'RESULTS.json'), report, {final: true}); }
    catch (error) { error.result = {...report, qualified: false, persistence_failure: String(error.message)}; throw error; }
    return report;
  } finally {
    signal.removeEventListener('abort', cancel);
  }
}
