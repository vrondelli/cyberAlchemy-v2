import {TextDecoder} from "node:util";
import {isAbsolute} from "node:path";

import {isRecord, nonEmptyString} from "./canonical.mjs";
import {createDesktopGatewayState} from "./desktop-gateway-state.mjs";
import {connectGatewayRpcTransport} from "./gateway-client.mjs";
import {gatewayClientMethodPosture} from "./host-method-policy.mjs";
import {desktopHostDeliveryPosture} from "./desktop-host-protocol.mjs";

const CODEX_ADAPTER = "codex-app-server/v1";
const DESKTOP_CONSUMPTION_METHOD = "cyberalchemy/desktopDeliveryConsumed";
const MAX_CLIENT_LINE = 128 * 1024;
const MAX_CLIENT_CHUNK = 256 * 1024;
const utf8 = new TextDecoder("utf-8", {fatal: true});

function decodeLine(bytes) {
  if (bytes.length === 0 || bytes.length > MAX_CLIENT_LINE) throw new Error("desktop-gateway.client-line-invalid");
  let message;
  try { message = JSON.parse(utf8.decode(bytes)); }
  catch { throw new Error("desktop-gateway.client-json-invalid"); }
  if (!isRecord(message)) throw new Error("desktop-gateway.client-json-invalid");
  return message;
}

function writeOutput(stream, message) {
  return new Promise((resolve, reject) => {
    if (stream.destroyed || stream.writableEnded) return reject(new Error("desktop-gateway.output-closed"));
    stream.write(`${JSON.stringify(message)}\n`, error => error ? reject(error) : resolve());
  });
}

// The candidate client has one acknowledged gateway writer. It does not
// represent an already-running Codex desktop task or claim a safe UI replay.
export function createDesktopGatewayJsonlClient({socket_path: socketPath,
  state_dir: stateDir, consumer_id: consumerId, connection_token: connectionToken,
  desktop_backend_binding: backendBinding,
  allow_desktop_consumption_receipts: allowConsumptionReceipts = false,
  trace_method: traceMethod = null,
  client_input: clientInput = process.stdin, client_output: clientOutput = process.stdout} = {}) {
  if (!nonEmptyString(socketPath) || !isAbsolute(socketPath) || !nonEmptyString(consumerId)
    || !nonEmptyString(connectionToken) || Buffer.byteLength(connectionToken) < 32
    || Buffer.byteLength(connectionToken) > 256 || /[\0\r\n]/.test(connectionToken)
    || !isRecord(backendBinding) || !/^[0-9a-f]{64}$/.test(backendBinding.binary_sha256 ?? "")
    || !["desktop-wsl-base/v1", "desktop-wsl-app-tools/v1"].includes(backendBinding.host_profile)
    || typeof allowConsumptionReceipts !== "boolean"
    || traceMethod !== null && typeof traceMethod !== "function") {
    throw new TypeError("An exact gateway socket, consumer ID and strong connection token are required.");
  }
  const state = createDesktopGatewayState({state_dir: stateDir, consumer_id: consumerId,
    backend_adapter_id: CODEX_ADAPTER, desktop_backend_binding: backendBinding});
  // Without a desktop-level receipt, a previous stdout write can be unknown.
  // D2/D3 must reconcile it; this D1 client never silently replays or skips it.
  if (state.inspect().requires_client_reconciliation) {
    state.close();
    throw new Error("desktop-gateway.unreconciled-client-state");
  }
  try { state.begin_client_connection(); }
  catch (error) { state.close(); throw error; }
  const continuity = state.connect_options();
  let inputBuffer = Buffer.alloc(0);
  let inputEnded = false;
  let stopping = false;
  let gatewayInputBackpressured = false;
  const queuedRequests = [];
  let inFlightRequestKey = null;
  let settleDone;
  let rejectDone;
  const done = new Promise((resolve, reject) => { settleDone = resolve; rejectDone = reject; });
  clientInput.pause?.();
  let transport;
  try {
    transport = connectGatewayRpcTransport({socket_path: socketPath,
      consumer_id: consumerId, lane: "interaction-bound", expected_backend_adapter_id: CODEX_ADAPTER,
      expected_desktop_backend_binding: backendBinding,
      connection_token: connectionToken, ...continuity,
      connection_handler: receipt => { state.bind_gateway(receipt); return true; },
      delivery_handler: async delivery => {
        const message = delivery.message;
        const posture = desktopHostDeliveryPosture(message);
        if (posture.kind === "rejected" || posture.kind === "sideband") {
          throw new Error(posture.reason ?? "desktop-gateway.server-notification-unsupported");
        }
        state.record_delivery(delivery);
        await writeOutput(clientOutput, message);
        if (delivery.request_key === inFlightRequestKey
          && !Object.hasOwn(message, "method") && Object.hasOwn(message, "id")) {
          inFlightRequestKey = null;
          // The transport writes the gateway ACK after this handler returns.
          setImmediate(flushQueuedRequest);
        }
        maybeFinishInput();
        return true;
      }});
  } catch (error) {
    state.close();
    throw error;
  }

  function stop(error = null) {
    if (stopping) return;
    stopping = true;
    clientInput.pause?.();
    void transport.close().finally(() => {
      try { state.close(); }
      catch (closeError) { if (!error) error = closeError; }
      if (error) rejectDone(error);
      else settleDone();
    });
  }

  function maybeFinishInput() {
    if (!inputEnded || stopping || gatewayInputBackpressured) return;
    if (inputBuffer.length > 0) return stop(new Error("desktop-gateway.client-line-truncated"));
    if (state.inspect().pending_intent_count === 0) setImmediate(() => stop());
  }

  function writeGatewayMessage(message) {
    const accepted = transport.input.write(`${JSON.stringify(message)}\n`);
    if (!accepted && !gatewayInputBackpressured) {
      gatewayInputBackpressured = true;
      clientInput.pause?.();
      transport.input.once("drain", () => {
        if (stopping) return;
        gatewayInputBackpressured = false;
        try {
          drainBufferedInput();
          flushQueuedRequest();
          maybeFinishInput();
        } catch (error) { stop(error); }
        if (!stopping && !gatewayInputBackpressured) clientInput.resume?.();
      });
    }
    return accepted;
  }

  function flushQueuedRequest() {
    if (stopping || gatewayInputBackpressured || inFlightRequestKey !== null || queuedRequests.length === 0) return;
    const prepared = queuedRequests.shift();
    inFlightRequestKey = prepared.request_key;
    try {
      writeGatewayMessage(prepared.gateway_message);
      if (["initialize", "thread/start"].includes(prepared.method)) {
        traceMethod?.(prepared.method);
      }
    }
    catch (error) { stop(error); }
  }

  function sendClientMessage(message) {
    if (message.method === DESKTOP_CONSUMPTION_METHOD) {
      if (!allowConsumptionReceipts || message.jsonrpc !== "2.0"
        || Object.keys(message).sort().join(",") !== "jsonrpc,method,params"
        || !isRecord(message.params)
        || Object.keys(message.params).sort().join(",") !== "messageDigest,throughSequence") {
        throw new Error("desktop-gateway.consumption-receipt-invalid");
      }
      state.record_desktop_consumption({through_sequence: message.params.throughSequence,
        message_digest: message.params.messageDigest});
      return;
    }
    const posture = gatewayClientMethodPosture(message);
    if (posture.kind === "rejected") throw new Error("desktop-gateway.client-method-unsupported");
    if (typeof message.method !== "string") {
      state.record_server_response(message);
      writeGatewayMessage(message);
      return;
    }
    if (Object.hasOwn(message, "id")) {
      const prepared = state.record_intent(message);
      queuedRequests.push({...prepared, method: message.method});
      flushQueuedRequest();
    } else {
      // Only initialization is currently a non-request client notification.
      if (message.method !== "initialized") throw new Error("desktop-gateway.client-notification-unsupported");
      writeGatewayMessage(message);
    }
  }

  function drainBufferedInput() {
    let index;
    while (!stopping && !gatewayInputBackpressured && (index = inputBuffer.indexOf(0x0a)) >= 0) {
      const line = inputBuffer.subarray(0, index);
      inputBuffer = inputBuffer.subarray(index + 1);
      sendClientMessage(decodeLine(line));
    }
    if (!gatewayInputBackpressured && inputBuffer.length > MAX_CLIENT_LINE) {
      throw new Error("desktop-gateway.client-line-too-large");
    }
  }

  function onInput(chunk) {
    if (stopping) return;
    try {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      if (bytes.length > MAX_CLIENT_CHUNK) throw new Error("desktop-gateway.client-chunk-too-large");
      if (inputBuffer.length + bytes.length > MAX_CLIENT_CHUNK) {
        throw new Error("desktop-gateway.client-buffer-too-large");
      }
      inputBuffer = Buffer.concat([inputBuffer, bytes]);
      drainBufferedInput();
    } catch (error) { stop(error); }
  }

  transport.failure.on("failure", error => stop(error));
  transport.ready.then(() => {
    if (stopping) return;
    clientInput.on("data", onInput);
    clientInput.once("end", () => {
      inputEnded = true;
      try { drainBufferedInput(); maybeFinishInput(); }
      catch (error) { stop(error); }
    });
    clientInput.once("error", () => stop(new Error("desktop-gateway.input-failed")));
    clientOutput.once("error", () => stop(new Error("desktop-gateway.output-failed")));
    clientInput.resume?.();
  }).catch(error => stop(error));
  return Object.freeze({ready: transport.ready, done, close: () => stop(),
    inspect: () => {
      const observed = transport.inspect();
      return {...state.inspect(), transport: {connected: observed.connected,
        closing: observed.closing, failed: observed.failed,
        continuity_mode: observed.continuity_mode,
        last_acked_sequence: observed.last_acked_sequence}};
    }});
}
