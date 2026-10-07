#!/usr/bin/env node
// Builds one isolated candidate inbox for a packaged Companion UI probe.
import {existsSync} from "node:fs";
import {dirname, isAbsolute} from "node:path";

import {emitCompletionImprovementSignals} from "../../../packages/codex-app-server-wrapper/src/evolution-signals.mjs";
import {createGatewayEvolutionSignalIntake} from "../../../packages/evolution-runtime/src/gateway-signal-intake.mjs";
import {observeGatewayEvolutionSignals} from "../../../packages/evolution-runtime/src/gateway-signal-observer.mjs";

const logPath = process.argv[2];
if (process.argv.length !== 3 || !isAbsolute(logPath ?? "") || existsSync(logPath) || !existsSync(dirname(logPath))) {
  throw new Error("Usage: create-evolution-signal-ui-fixture.mjs <new-absolute-log-under-existing-parent>");
}
const intake = createGatewayEvolutionSignalIntake({log_path: logPath});
try {
  const emitted = await emitCompletionImprovementSignals({configuration: {enabled: true, trigger: "turn/completed"},
    completion_message: {params: {turn: {status: "completed"}}}, completion_digest: "a".repeat(64),
    semantic_completion: {ok: false, disposition: "block", summary_digest: "b".repeat(64)}, ...intake});
  if (emitted.disposition !== "emitted") throw new Error("Signal fixture emission failed.");
} finally {
  intake.close();
}
const observed = observeGatewayEvolutionSignals({log_path: logPath});
if (observed.evidence_status !== "verified" || observed.candidate_count !== 1) throw new Error("Signal fixture verification failed.");
process.stdout.write(`${JSON.stringify({schema_version: "are.companion-evolution-signal-ui-fixture/v1", log_path: logPath,
  candidate_count: 1, authority_effect: "none"})}\n`);
