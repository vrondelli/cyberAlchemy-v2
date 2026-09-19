// Bounded child-process supervision for populated H-L tokenizer qualification.
import {fileURLToPath} from 'node:url';
import {createGenerationProcess} from './recovery-generation-process.mjs';
const WORKER = fileURLToPath(new URL('./recent-evidence-populated-worker-r1.mjs', import.meta.url));

export async function runRecentPopulatedQualification({request, signal, deadline_ms = 1200000},
  {worker = WORKER, kill_grace_ms = 150000} = {}) {
  if (!(signal instanceof AbortSignal) || signal.aborted) throw Error('recent-populated-process.active-signal');
  if (!Number.isSafeInteger(deadline_ms) || deadline_ms < 1 || deadline_ms > 1200000)
    throw Error('recent-populated-process.deadline');
  const child = createGenerationProcess({worker, kill_grace_ms}), controller = new AbortController();
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
    if (expired || signal.aborted || !settlement?.local_settled || !settlement.process_group_absent ||
      settlement.forced || settlement.exit_code !== 0)
      failure ??= Error(expired ? 'recent-populated-process.deadline-exceeded' :
        'recent-populated-process.unsettled-or-cancelled');
    if (terminal?.schema !== 'are.recent-evidence-populated-campaign/v1' || terminal.qualified !== true ||
      terminal.model_calls !== 0 || terminal.rows?.length !== 4 || terminal.populated_requests < 4 ||
      terminal.rows.some(row => row.qualified !== true || row.result?.populated_requests < 1))
      failure ??= Error('recent-populated-process.incomplete-terminal');
    if (failure) {
      const error = new Error('recent-populated-process.failed', {cause: failure});
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
