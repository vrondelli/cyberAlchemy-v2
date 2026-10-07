#!/usr/bin/env node
import {connectGatewayRpcTransport, createAppServerRpcClient, createGatewayClientRecoveryState} from "../../agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs";
import {runCodexAppServerProposal} from "../src/codex-coding-agent.mjs";
import {inspectOwnedThreadRuntime, inspectPendingTurnHistory} from "../src/pending-turn-reconciliation.mjs";

const [statePath, fixtureRoot, profilePath, gatewaySocket, turn] = process.argv.slice(2);
const ephemeralMode = process.argv.includes("--ephemeral");
let recovery;
try {
  recovery = createGatewayClientRecoveryState({path: statePath, consumer_id: "codex:coding-proposal"});
  if (recovery.has_unresolved_turn_intent()) throw new Error("coding-agent.gateway-turn-outcome-unresolved");
  let pendingTurn = null;
  const result = await runCodexAppServerProposal({
    config: {schema_version: "are.codex-coding-agent-scope/v1", observation_allowlist: ["package.json", "range.mjs"],
      mutation_allowlist: ["range.mjs"], verification_command: [process.execPath, "--test"], maximum_steps: 1},
    repositoryRoot: fixtureRoot, codexProfile: profilePath, gatewaySocket,
    runId: `native-tui-canary-${turn}`, request: "Propose fixing sum; do not apply.", model: "are-fixture",
    durableProposalThread: !ephemeralMode,
    gatewayResumeToken: recovery.resume_token(),
    onGatewayConnected: (receipt) => recovery.bind_gateway(receipt),
    onGatewayThreadStarted: (threadId) => recovery.record_thread(threadId),
    onGatewayTurnStarting: ({thread_id, request_key, prompt_sha256}) => {
      pendingTurn = {schema_version: "are.codex-client-pending-turn/v1", thread_id, request_key,
        text_digest: prompt_sha256, created_at: new Date().toISOString()};
      recovery.record_turn_intent(pendingTurn);
    },
    onGatewayTurnCompleted: ({turn_id}) => {
      recovery.settle_turn_intent(pendingTurn, turn_id);
      pendingTurn = null;
    },
  });
  let historyObservation = null;
  if (result.status === "AWAITING_APPROVAL") {
    const accepted = recovery.last_turn_result();
    const transport = connectGatewayRpcTransport({socket_path: gatewaySocket, consumer_id: "codex:coding-proposal",
      lane: "interaction-bound", expected_backend_adapter_id: "codex-app-server/v1", resume_token: recovery.resume_token(),
      connection_token: process.env.ARE_GATEWAY_CONNECTION_TOKEN});
    const client = createAppServerRpcClient({transport});
    try {
      const receipt = await client.ready();
      recovery.bind_gateway(receipt);
      await client.initialize({clientInfo: {name: "cyberalchemy-coding-agent", title: "CyberAlchemy Coding Agent", version: "0.1.0"},
        capabilities: {experimentalApi: true}});
      if (receipt.resumed !== true) await client.notify("initialized", {});
      if (ephemeralMode) {
        let fullHistoryRejected = false;
        try { await client.request("thread/read", {threadId: accepted.thread_id, includeTurns: true}); }
        catch { fullHistoryRejected = true; }
        if (!fullHistoryRejected) throw new Error("canary.ephemeral-full-history-unexpectedly-available");
        const summary = await client.request("thread/read", {threadId: accepted.thread_id, includeTurns: false});
        historyObservation = inspectOwnedThreadRuntime({thread_id: accepted.thread_id}, summary);
      } else {
        const history = await client.request("thread/read", {threadId: accepted.thread_id, includeTurns: true});
        historyObservation = inspectPendingTurnHistory({thread_id: accepted.thread_id, text_digest: accepted.text_digest}, history);
      }
    } finally { await client.close(); }
  }
  process.stdout.write(`${JSON.stringify({status: result.status, reason_codes: result.reason_codes ?? [],
    error: result.error ?? result.live_session?.coding_result?.model_error ?? null,
    thread_policy: result.live_session?.thread_policy ?? null,
    binding_source: result.codex_binding?.source ?? null,
    token_exposed: JSON.stringify(result).includes(recovery.resume_token() ?? "\u0000"),
    history_disposition: historyObservation?.disposition ?? null,
    history_turn_status: historyObservation?.turn_status ?? null,
    history_source: historyObservation ? (ephemeralMode ? "thread/read-summary" : "thread/read") : null})}\n`);
  if (result.status !== "AWAITING_APPROVAL") process.exitCode = 1;
  if (result.status === "AWAITING_APPROVAL" && historyObservation?.disposition !== (ephemeralMode ? "host-idle-unbound" : "host-terminal")) process.exitCode = 1;
} catch (error) {
  process.stderr.write(`native-tui-worker:${error.message}\n`);
  process.exitCode = 1;
} finally {
  recovery?.close();
}
