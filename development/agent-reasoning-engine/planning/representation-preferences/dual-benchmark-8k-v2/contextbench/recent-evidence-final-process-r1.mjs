// Bounded tokenizer-only H-L final qualification process.
// Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import {fileURLToPath} from 'node:url';
import {createGenerationProcess} from './recovery-generation-process.mjs';

const WORKER = fileURLToPath(new URL('./recent-evidence-final-worker-r1.mjs', import.meta.url));

export async function runRecentEvidenceFinalQualification({request, signal, deadline_ms = 600000}, {
  worker = WORKER, kill_grace_ms = 150000,
} = {}) {
  if (!(signal instanceof AbortSignal) || signal.aborted) throw Error('recent-final-process.active-signal');
  if (!Number.isSafeInteger(deadline_ms) || deadline_ms < 1 || deadline_ms > 600000)
    throw Error('recent-final-process.deadline');
  const child = createGenerationProcess({worker, kill_grace_ms});
  const controller = new AbortController();
  let expired = false, terminal = null, failure = null, settlement = null;
  const cancel = () => controller.abort();
  signal.addEventListener('abort', cancel, {once: true});
  if (signal.aborted) cancel();
  const timer = setTimeout(() => { expired = true; controller.abort(); }, deadline_ms);
  try {
    try { terminal = await child.generate({config: request, signal: controller.signal}); }
    catch (error) { terminal = error.result ?? null; failure = error; }
    try { settlement = await child.settle({terminal}); }
    catch (error) { failure ??= error; }
    if (expired || signal.aborted || !settlement?.local_settled ||
      !settlement.process_group_absent || settlement.forced || settlement.exit_code !== 0)
      failure ??= Error(expired ? 'recent-final-process.deadline-exceeded' :
        'recent-final-process.unsettled-or-cancelled');
    if (terminal?.schema !== 'are.recent-evidence-final-campaign/v1' || terminal.qualified !== true ||
      terminal.model_calls !== 0 || terminal.rows?.length !== 4 ||
      terminal.rows.some(row => row.qualified !== true))
      failure ??= Error('recent-final-process.incomplete-terminal');
    if (failure) {
      const error = new Error('recent-final-process.failed', {cause: failure});
      error.result = {qualified: false, status: 'incomplete', measurement_report: terminal,
        process_settlement: settlement, deadline_exceeded: expired, error: String(failure.message)};
      throw error;
    }
    return {qualified: true, measurement_report: terminal, process_settlement: settlement,
      deadline_exceeded: false};
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', cancel);
  }
}
