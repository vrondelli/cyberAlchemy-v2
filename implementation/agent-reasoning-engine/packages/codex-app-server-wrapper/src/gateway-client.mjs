import {EventEmitter} from "node:events";
import {createConnection} from "node:net";
import {PassThrough} from "node:stream";
import {StringDecoder} from "node:string_decoder";
import {isGatewaySessionFaultReason} from "./gateway-fault-contract.mjs";

import {
  ACKNOWLEDGED_CONTINUITY_MODE,
  GATEWAY_ACK_SCHEMA,
  GATEWAY_CONNECT_SCHEMA,
  GATEWAY_CONNECTED_SCHEMA,
  GATEWAY_DELIVERY_SCHEMA,
} from "./gateway.mjs";

const FAULT_DIGEST = /^[0-9a-f]{64}$/;
const MAX_DELIVERY_LINE = 256 * 1024;
const MAX_BUFFERED_DELIVERY_BYTES = 4 * 1024 * 1024;

export function connectGatewayRpcTransport(options = {}) {
  if (options.expected_backend_adapter_id !== undefined
    && (typeof options.expected_backend_adapter_id !== "string" || !options.expected_backend_adapter_id.trim()
      || options.expected_backend_adapter_id.length > 256)) {
    throw new TypeError("A valid expected backend adapter ID is required.");
  }
  if (options.expected_desktop_backend_binding !== undefined
    && (!options.expected_desktop_backend_binding
      || !/^[0-9a-f]{64}$/.test(options.expected_desktop_backend_binding.binary_sha256 ?? "")
      || !["desktop-wsl-base/v1", "desktop-wsl-app-tools/v1"].includes(options.expected_desktop_backend_binding.host_profile))) {
    throw new TypeError("A valid expected desktop backend binding is required.");
  }
  if (options.delivery_handler !== undefined && typeof options.delivery_handler !== "function") {
    throw new TypeError("A gateway delivery handler must be a function.");
  }
  if (options.connection_handler !== undefined && typeof options.connection_handler !== "function") {
    throw new TypeError("A gateway connection handler must be a function.");
  }
  const connectImpl = options.connect_impl ?? createConnection;
  const socket = connectImpl(options.socket_path);
  const input = new PassThrough();
  const output = new PassThrough();
  const failure = new EventEmitter();
  let buffer = "";
  // Socket chunks are byte boundaries, not UTF-8 character boundaries.
  // One decoder spans the handshake and all subsequent delivery frames.
  const serverDecoder = new StringDecoder("utf8");
  let connected = false;
  let closing = false;
  let closePromise = null;
  let failed = false;
  let failureError = null;
  let receipt = null;
  let lastAcknowledgedSequence = options.last_acked_sequence ?? 0;
  let lastReceivedSequence = lastAcknowledgedSequence;
  let deliveryChain = Promise.resolve();
  let deliveryPending = false;
  const acknowledgedContinuity = options.continuity !== false;
  let resolveReady;
  let rejectReady;
  const ready = new Promise((resolveValue, reject) => {
    resolveReady = resolveValue;
    rejectReady = reject;
  });

  function fail(code, detail, authenticatedFault = null) {
    if (closing || failed) return;
    failed = true;
    failureError = new Error(`${code}${detail ? `:${detail}` : ""}`);
    failureError.code = code;
    if (authenticatedFault) {
      failureError.fault_digest = authenticatedFault.fault_digest;
      failureError.fault_reason_code = authenticatedFault.fault_reason_code;
    }
    if (!connected) rejectReady(failureError);
    else failure.emit("failure", failureError);
    input.pause();
    if (!socket.destroyed) socket.destroy();
  }

  socket.on("connect", () => {
    const continuity = acknowledgedContinuity ? {
      mode: ACKNOWLEDGED_CONTINUITY_MODE,
      ...(options.resume_token ? {resume_token: options.resume_token} : {}),
      last_acked_sequence: lastAcknowledgedSequence,
      request_aliases: options.request_aliases ?? [],
    } : undefined;
    socket.write(`${JSON.stringify({schema_version: GATEWAY_CONNECT_SCHEMA, consumer_id: options.consumer_id, lane: options.lane,
      ...(options.expected_backend_adapter_id ? {expected_backend_adapter_id: options.expected_backend_adapter_id} : {}),
      ...(options.connection_token ? {connection_token: options.connection_token} : {}), ...(continuity ? {continuity} : {})})}\n`);
  });
  input.on("data", (data) => {
    if (!socket.destroyed && !socket.write(data)) input.pause();
  });
  socket.on("drain", () => {
    if (!closing && !failed) input.resume();
  });
  input.on("end", () => {
    if (!socket.destroyed) socket.end();
  });

  function consumeServerBytes(data) {
    if (closing || failed) return;
    buffer += serverDecoder.write(data);
    if (Buffer.byteLength(buffer, "utf8") > MAX_BUFFERED_DELIVERY_BYTES) {
      return fail("gateway.delivery-buffer-too-large");
    }
    if (deliveryPending) return;
    let index;
    while ((index = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 1);
      if (!line.trim()) continue;
      if (Buffer.byteLength(line, "utf8") > MAX_DELIVERY_LINE) return fail("gateway.delivery-line-too-large");
      let frame;
      try { frame = JSON.parse(line); } catch { return fail("gateway.invalid-delivery-json"); }
      if (!acknowledgedContinuity) {
        output.write(`${line}\n`);
        continue;
      }
      if (frame.schema_version !== GATEWAY_DELIVERY_SCHEMA || !Number.isSafeInteger(frame.sequence) || frame.sequence <= 0 || !Object.hasOwn(frame, "message")) {
        return fail("gateway.invalid-delivery-envelope");
      }
      if (frame.sequence <= lastAcknowledgedSequence) {
        socket.write(`${JSON.stringify({schema_version: GATEWAY_ACK_SCHEMA, through_sequence: lastAcknowledgedSequence})}\n`);
        continue;
      }
      if (frame.sequence !== lastReceivedSequence + 1) return fail("gateway.delivery-sequence-gap", `${lastReceivedSequence}->${frame.sequence}`);
      lastReceivedSequence = frame.sequence;
      const acknowledgeDelivery = () => {
        if (closing || failed) return;
        lastAcknowledgedSequence = Math.max(lastAcknowledgedSequence, frame.sequence);
        if (!socket.destroyed) socket.write(`${JSON.stringify({schema_version: GATEWAY_ACK_SCHEMA, through_sequence: lastAcknowledgedSequence})}\n`);
      };
      if (options.delivery_handler) {
        // A durable downstream client can withhold the gateway ACK until its
        // own ordered delivery boundary confirms this exact frame. Pause the
        // socket and leave any same-chunk frames in the bounded input buffer.
        deliveryPending = true;
        socket.pause();
        deliveryChain = deliveryChain.then(async () => {
          if (closing || failed) return;
          if (await options.delivery_handler({sequence: frame.sequence, message: frame.message,
            request_key: frame.request_key ?? null}) !== true) {
            fail("gateway.delivery-handler-rejected");
            return;
          }
          acknowledgeDelivery();
        }).then(() => {
          if (closing || failed) return;
          deliveryPending = false;
          consumeServerBytes(Buffer.alloc(0));
          if (!deliveryPending && !closing && !failed) socket.resume();
        }).catch(error => fail(/^desktop-gateway\.[a-z0-9-]+$/.test(error?.message ?? "")
          ? error.message : "gateway.delivery-handler-failed"));
        return;
      } else output.write(`${JSON.stringify(frame.message)}\n`, acknowledgeDelivery);
    }
    if (Buffer.byteLength(buffer, "utf8") > MAX_DELIVERY_LINE) fail("gateway.delivery-line-too-large");
  }
  const onHandshakeData = (chunk) => {
    buffer += serverDecoder.write(chunk);
    const index = buffer.indexOf("\n");
    if ((index >= 0 && Buffer.byteLength(buffer.slice(0, index), "utf8") > 16384)
      || (index < 0 && Buffer.byteLength(buffer, "utf8") > 16384)) return fail("gateway.handshake-too-large");
    if (index < 0) return;
    socket.off("data", onHandshakeData);
    try { receipt = JSON.parse(buffer.slice(0, index)); } catch { receipt = null; }
    if (!receipt || receipt.schema_version !== GATEWAY_CONNECTED_SCHEMA || receipt.ok !== true) {
      if (receipt?.schema_version === GATEWAY_CONNECTED_SCHEMA && receipt.reason === "gateway.session-faulted") {
        if (!acknowledgedContinuity || typeof options.resume_token !== "string" || !options.resume_token
          || !FAULT_DIGEST.test(receipt.fault_digest ?? "") || !isGatewaySessionFaultReason(receipt.fault_reason_code)) {
          return fail("gateway.invalid-connect-receipt");
        }
        return fail(receipt.reason, undefined, {fault_digest: receipt.fault_digest,
          fault_reason_code: receipt.fault_reason_code});
      }
      if (receipt?.schema_version === GATEWAY_CONNECTED_SCHEMA && receipt.reason === "gateway.history-audit-incomplete") {
        if (!acknowledgedContinuity || typeof options.resume_token !== "string" || !options.resume_token
          || Object.hasOwn(receipt, "fault_digest") || Object.hasOwn(receipt, "fault_reason_code")) {
          return fail("gateway.invalid-connect-receipt");
        }
        return fail(receipt.reason);
      }
      return fail(receipt?.reason ?? "gateway.invalid-connect-receipt", receipt?.detail);
    }
    if (receipt.consumer_id !== options.consumer_id || receipt.lane !== options.lane
      || (options.expected_backend_adapter_id && receipt.backend_adapter_id !== options.expected_backend_adapter_id)) {
      return fail("gateway.connect-binding-mismatch");
    }
    if (options.expected_desktop_backend_binding
      && (receipt.desktop_backend_binding?.binary_sha256 !== options.expected_desktop_backend_binding.binary_sha256
        || receipt.desktop_backend_binding?.host_profile !== options.expected_desktop_backend_binding.host_profile)) {
      return fail("gateway.desktop-backend-binding-mismatch");
    }
    if (acknowledgedContinuity && receipt.resumed === true) {
      const acknowledged = receipt.continuity?.acknowledged_through;
      if (!Number.isSafeInteger(acknowledged) || acknowledged < lastAcknowledgedSequence) {
        return fail("gateway.invalid-resume-watermark");
      }
      // A fresh transport has no local sequence history. The authenticated
      // gateway receipt is the baseline for deliveries already acknowledged
      // by the prior transport, even when the caller did not persist a cursor.
      lastAcknowledgedSequence = acknowledged;
      lastReceivedSequence = acknowledged;
    }
    if (options.connection_handler) {
      let accepted;
      try { accepted = options.connection_handler(receipt); }
      catch { return fail("gateway.connection-handler-failed"); }
      if (accepted !== true) return fail("gateway.connection-handler-rejected");
    }
    connected = true;
    const remainder = buffer.slice(index + 1);
    buffer = "";
    if (remainder) consumeServerBytes(remainder);
    socket.on("data", consumeServerBytes);
    resolveReady(receipt);
  };
  socket.on("data", onHandshakeData);
  socket.on("error", (error) => {
    if (!closing) fail("gateway.connection-failed", error.message);
  });
  socket.on("close", () => {
    output.end();
    if (!closing) fail("gateway.connection-closed");
  });

  function close() {
    if (closePromise) return closePromise;
    closing = true;
    input.pause();
    closePromise = new Promise(resolveClose => {
      if (socket.closed) return resolveClose();
      const timer = setTimeout(() => socket.destroy(), 1000);
      socket.once("close", () => { clearTimeout(timer); resolveClose(); });
      if (!socket.destroyed) socket.end();
    });
    return closePromise;
  }

  return Object.freeze({
    kind: "persistent-gateway",
    socket,
    input,
    output,
    failure,
    ready,
    get_failure: () => failureError,
    close,
    inspect: () => ({kind: "persistent-gateway", connected, closing, failed, receipt, continuity_mode: acknowledgedContinuity ? ACKNOWLEDGED_CONTINUITY_MODE : null, resume_token: receipt?.continuity?.resume_token ?? null, resume_token_digest: receipt?.continuity?.resume_token_digest ?? null, last_acked_sequence: lastAcknowledgedSequence, authority_effect: "none"}),
  });
}

export function runGatewayClientProxy(options = {}) {
  const clientInput = options.client_input ?? process.stdin;
  const clientOutput = options.client_output ?? process.stdout;
  const clientError = options.client_error ?? process.stderr;
  clientInput.pause?.();
  // This compatibility proxy deliberately retains unacknowledged sessions.
  // Reuse the validated receipt and JSON-lines transport without changing its
  // restart semantics or presenting it as an activated-session client.
  const transport = connectGatewayRpcTransport({...options, continuity: false});
  transport.failure.on("failure", (error) => clientError.write(`ARE gateway transport failed: ${error.code}\n`));
  transport.ready.then(() => {
    transport.output.pipe(clientOutput);
    clientInput.pipe(transport.input);
    clientInput.resume?.();
  }).catch((error) => clientError.write(`ARE gateway connection failed: ${error.code ?? "gateway.invalid-connect-receipt"}\n`));
  return transport.socket;
}
