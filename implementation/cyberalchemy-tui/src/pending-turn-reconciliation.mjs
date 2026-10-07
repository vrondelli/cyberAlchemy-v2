import {createHash} from "node:crypto";
import {resolve} from "node:path";

import {connectGatewayRpcTransport, createAppServerRpcClient} from "../../agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs";
import {defaultGatewaySocket} from "./gateway-recovery.mjs";

const TERMINAL = new Set(["completed", "failed", "interrupted"]);

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function unverified(reason) {
  return Object.freeze({schema_version: "are.tui-pending-turn-observation/v1", disposition: "unverified",
    reason_codes: Object.freeze([reason]), turn_status: null, turn_id_digest: null, authority_effect: "none"});
}

function soleUserText(turn) {
  if (!Array.isArray(turn?.items)) return null;
  const messages = turn.items.filter((item) => item?.type === "userMessage");
  if (messages.length !== 1 || !Array.isArray(messages[0]?.content) || messages[0].content.length !== 1) return null;
  const part = messages[0].content[0];
  return part?.type === "text" && typeof part.text === "string" ? part.text : null;
}

export function inspectPendingTurnHistory(intent, response) {
  if (!intent || typeof intent.thread_id !== "string" || !/^[0-9a-f]{64}$/u.test(intent.text_digest ?? "")) {
    return unverified("history.intent-invalid");
  }
  const thread = response?.thread;
  if (!thread || thread.id !== intent.thread_id || !Array.isArray(thread.turns)) return unverified("history.thread-unbound");
  const matches = thread.turns.filter((turn) => {
    const text = soleUserText(turn);
    return text !== null && sha256(text) === intent.text_digest;
  });
  if (matches.length !== 1) return unverified(matches.length === 0 ? "history.prompt-not-found" : "history.prompt-ambiguous");
  const turn = matches[0];
  if (typeof turn.id !== "string" || !turn.id || (turn.threadId && turn.threadId !== intent.thread_id)) {
    return unverified("history.turn-identity-invalid");
  }
  const status = turn.status === "inProgress" || turn.status === "in_progress" ? "inProgress"
    : TERMINAL.has(turn.status) ? turn.status : null;
  if (!status) return unverified("history.turn-status-unknown");
  return Object.freeze({schema_version: "are.tui-pending-turn-observation/v1",
    disposition: status === "inProgress" ? "host-active" : "host-terminal",
    reason_codes: Object.freeze([]), turn_status: status, turn_id_digest: sha256(turn.id), authority_effect: "none"});
}

export function inspectOwnedThreadRuntime(intent, response) {
  if (!intent || response?.thread?.id !== intent.thread_id) return unverified("history.thread-unbound");
  const type = response.thread.status?.type;
  if (type === "notLoaded") return unverified("history.thread-not-loaded");
  if (type !== "active" && type !== "idle") return unverified("history.runtime-status-unknown");
  return Object.freeze({schema_version: "are.tui-pending-turn-observation/v1",
    disposition: type === "active" ? "host-active-unbound" : "host-idle-unbound",
    reason_codes: Object.freeze(["history.full-turns-unavailable"]), turn_status: null,
    turn_id_digest: null, authority_effect: "none"});
}

export async function observePendingGatewayTurn(options, dependencies = {}) {
  const recovery = options.recoveryState;
  if (!recovery?.has_unresolved_turn_intent?.()) return unverified("history.no-pending-intent");
  const connect = dependencies.connectGateway ?? connectGatewayRpcTransport;
  const createClient = dependencies.createClient ?? ((transport) => createAppServerRpcClient({transport}));
  const transport = connect({socket_path: resolve(options.gatewaySocket ?? defaultGatewaySocket()),
    consumer_id: "codex:coding-proposal", lane: "interaction-bound",
    expected_backend_adapter_id: "codex-app-server/v1",
    connection_token: options.connectionToken ?? process.env.ARE_GATEWAY_CONNECTION_TOKEN,
    resume_token: recovery.resume_token()});
  const client = createClient(transport);
  options.onClient?.(client);
  try {
    const receipt = await client.ready();
    recovery.bind_gateway(receipt);
    const intent = recovery.pending_turn_intent();
    if (!intent || !recovery.thread_ids().includes(intent.thread_id)) return unverified("history.intent-unowned");
    await client.initialize({clientInfo: {name: "cyberalchemy-coding-agent", title: "CyberAlchemy Coding Agent", version: "0.1.0"},
      capabilities: {experimentalApi: true}});
    if (receipt.resumed !== true) await client.notify("initialized", {});
    try {
      const response = await client.request("thread/read", {threadId: intent.thread_id, includeTurns: true});
      return inspectPendingTurnHistory(intent, response);
    } catch {
      const summary = await client.request("thread/read", {threadId: intent.thread_id, includeTurns: false});
      return inspectOwnedThreadRuntime(intent, summary);
    }
  } finally {
    try { await client.close(); }
    finally { options.onClient?.(null); }
  }
}
