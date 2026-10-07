import {EventEmitter} from "node:events";
import {connectGatewayRpcTransport} from "../packages/codex-app-server-wrapper/src/gateway-client.mjs";
import {createAppServerRpcClient} from "../packages/codex-app-server-wrapper/src/rpc-client.mjs";
import {digestValue} from "../packages/codex-app-server-wrapper/src/canonical.mjs";
import {createHookEventSession} from "./hook-event-session.mjs";

const label = value => typeof value === "string" && value.trim().length > 0 && value.length <= 256;
export const HOST_HOOK_DECISION_BINDING_VERSION = 1;

// A single host process owns this object. Reconnect never redispatches a request.
export function createGatewaySessionClient(options = {}) {
  if (!label(options.consumer_id) || !label(options.lane) || typeof options.socket_path !== "string" || !options.socket_path.startsWith("/")) throw new TypeError("gateway-client.identity-required");
  const limit = options.max_requests ?? 256;
  const timeout = options.connect_timeout_ms ?? 10000;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 256 || !Number.isSafeInteger(timeout) || timeout < 1) throw new TypeError("gateway-client.invalid-limits");
  const events = new EventEmitter();
  if (options.hook_decide !== undefined && typeof options.hook_decide !== 'function') throw new TypeError('gateway-client.hook-decide-invalid');
  if (options.enforce_supported_tool_blocks !== undefined
    && typeof options.enforce_supported_tool_blocks !== "boolean") throw new TypeError("gateway-client.tool-block-mode-invalid");
  const hooks = createHookEventSession({...(options.hook_decide ? {decide: options.hook_decide} : {}),
    enforce_supported_tool_blocks: options.enforce_supported_tool_blocks === true});
  const requests = new Map();
  let transport = null, rpc = null, connecting = null, token = null, sequence = 0;
  let connected = false, disposed = false, generation = 0;
  const inspect = () => Object.freeze({consumer_id: options.consumer_id, lane: options.lane,
    connected, disposed, generation, retained_requests: requests.size, retained_turns: hooks.size(),
    resumable: Boolean(token), authority_effect: "none"});

  function rememberTransport() {
    const state = transport?.inspect();
    if (state?.resume_token) token = state.resume_token;
    if (state) sequence = state.last_acked_sequence;
  }

  async function disconnect() {
    if (connecting) throw new Error("gateway-client.connection-in-progress");
    connected = false;
    rememberTransport();
    await rpc?.close();
    await transport?.close();
    rememberTransport();
  }

  function connect() {
    if (disposed) return Promise.reject(new Error("gateway-client.disposed"));
    if (connecting) return connecting;
    if (connected) return Promise.resolve(inspect());
    connecting = (async () => {
      rememberTransport();
      await rpc?.close();
      await transport?.close();
      transport = connectGatewayRpcTransport({socket_path: options.socket_path,
        consumer_id: options.consumer_id, lane: options.lane,
        ...(token ? {resume_token: token} : {}), last_acked_sequence: sequence});
      rpc = createAppServerRpcClient({transport, request_timeout_ms: options.request_timeout_ms ?? 30000,
        approval_handler: options.approval_handler});
      rpc.events.on("notification", message => {
        if (message.method === "turn/completed") events.emit("hook-observation", hooks.observe(message), message);
        events.emit("notification", message);
      });
      rpc.events.on("failure", () => { connected = false; rememberTransport(); });
      let timer;
      try {
        const receipt = await Promise.race([rpc.ready(), new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error("gateway-client.connect-timeout")), timeout);
        })]);
        if (receipt.consumer_id !== options.consumer_id || receipt.lane !== options.lane || !label(receipt.continuity?.resume_token)) throw new Error("gateway-client.receipt-mismatch");
        rememberTransport();
        connected = true;
        generation += 1;
        return inspect();
      } catch (error) {
        await rpc.close();
        await transport.close();
        throw error;
      } finally { clearTimeout(timer); }
    })().finally(() => { connecting = null; });
    return connecting;
  }

  async function request(key, method, params = {}) {
    if (!connected || disposed) throw new Error("gateway-client.not-connected");
    if (!label(key) || !label(method)) throw new TypeError("gateway-client.request-identity-required");
    const encoded = JSON.stringify({method, params});
    if (Buffer.byteLength(encoded) > 1024 * 1024) throw new Error("gateway-client.request-too-large");
    const material = JSON.parse(encoded), digest = digestValue(material), prior = requests.get(key);
    if (prior && prior.digest !== digest) throw new Error("gateway-client.request-binding-conflict");
    if (prior?.pending) throw new Error("gateway-client.request-in-flight");
    if (!prior && requests.size >= limit) throw new Error("gateway-client.request-limit");
    const entry = prior ?? {digest, pending: false};
    requests.set(key, entry);
    entry.pending = true;
    try { return await rpc.request(method, material.params, {idempotency_key: key}); }
    finally { entry.pending = false; }
  }

  async function close() {
    if (connecting) throw new Error("gateway-client.connection-in-progress");
    disposed = true;
    await disconnect();
    hooks.clear();
    requests.clear();
    token = null;
    events.removeAllListeners();
  }

  return Object.freeze({connect, disconnect, request, close, inspect, events,
    notify: async (method, params = {}) => {
      if (!connected || disposed) throw new Error("gateway-client.not-connected");
      return rpc.notify(method, params);
    },
    observeHook: event => {
      if (disposed) throw new Error("gateway-client.disposed");
      if (event?.method) throw new Error("gateway-client.native-notification-required");
      return hooks.observe(event);
    },
    releaseCompleted: (sessionId, turnId) => hooks.releaseCompleted(sessionId, turnId),
  });
}
