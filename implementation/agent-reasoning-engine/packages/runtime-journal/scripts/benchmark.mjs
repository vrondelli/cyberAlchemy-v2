import {performance} from "node:perf_hooks";
import {createInMemoryRuntimeJournal, replayRuntimeJournal} from "../index.mjs";

function percentile(values, fraction) {
  return [...values].sort((a, b) => a - b)[Math.ceil(values.length * fraction) - 1];
}

const journal = createInMemoryRuntimeJournal({journal_id: "benchmark", max_events: 10000, max_closed_turns: 10000});
const appendTimes = [];
for (let index = 0; index < 1000; index += 1) {
  const started = performance.now();
  journal.append({event_kind: index % 10 === 9 ? "turn-closed" : "lifecycle-observed", thread_id: "benchmark", turn_id: `turn-${Math.floor(index / 10)}`, idempotency_key: `benchmark:${index}`});
  appendTimes.push(performance.now() - started);
}
const cut = journal.cut({thread_id: "benchmark"}).value;
const replayTimes = [];
for (let index = 0; index < 100; index += 1) {
  const started = performance.now();
  replayRuntimeJournal(cut);
  replayTimes.push(performance.now() - started);
}
const result = {
  schema_version: "are.runtime-journal-benchmark/v1",
  node_version: process.version,
  event_count: cut.events.length,
  append_p95_ms: percentile(appendTimes, 0.95),
  replay_p95_ms: percentile(replayTimes, 0.95),
  append_target_ms: 5,
  replay_target_ms: 25,
  authority_effect: "none",
  claim_limit: "Local warm timing for this host and current bytes only.",
};
result.target_met = result.append_p95_ms <= result.append_target_ms && result.replay_p95_ms <= result.replay_target_ms;
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = result.target_met ? 0 : 1;
