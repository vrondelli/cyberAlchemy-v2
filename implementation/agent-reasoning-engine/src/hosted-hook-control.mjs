import {constants, closeSync, fstatSync, fsyncSync, linkSync, lstatSync, openSync, readFileSync, realpathSync, unlinkSync, writeSync} from "node:fs";
import {randomBytes} from "node:crypto";
import {EventEmitter} from "node:events";
import {hostname} from "node:os";
import {basename, dirname, isAbsolute, relative, resolve, sep} from "node:path";

import {createHookEventSession} from "./hook-event-session.mjs";
import {startHookCallbackBridge} from "./hook-callback-bridge.mjs";

const CONNECTION_SCHEMA = "are.hosted-hook-connection/v1";
const MAX_CONNECTION_BYTES = 4096;

function sameFile(path, identity) {
  const current = lstatSync(path);
  return current.isFile() && !current.isSymbolicLink()
    && current.dev === identity.dev && current.ino === identity.ino;
}

function reclaimTerminatedConnection(path) {
  let identity, bytes;
  try {
    identity = lstatSync(path);
    if (!identity.isFile() || identity.isSymbolicLink() || identity.size > MAX_CONNECTION_BYTES) return false;
    bytes = readFileSync(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
  let connection;
  try { connection = JSON.parse(bytes); } catch { return false; }
  const owner = connection?.owner_process;
  if (connection?.schema_version !== CONNECTION_SCHEMA || typeof connection.url !== "string"
    || !/^http:\/\/127\.0\.0\.1:\d+\/hook-events$/.test(connection.url)
    || !/^[0-9a-f]{64}$/.test(connection.token ?? "")
    || owner?.platform !== process.platform || owner.hostname !== hostname()
    || !Number.isSafeInteger(owner.pid) || owner.pid <= 0) return false;
  try {
    process.kill(owner.pid, 0);
    return false;
  } catch (error) {
    if (error.code !== "ESRCH") return false;
  }
  try {
    if (!sameFile(path, identity) || readFileSync(path, "utf8") !== bytes) return false;
    unlinkSync(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function privateParent(path) {
  if (typeof path !== "string" || !isAbsolute(path)) throw new TypeError("hosted-hooks.connection-path-required");
  const parent = dirname(path);
  const stat = lstatSync(parent);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("hosted-hooks.connection-parent-unsafe");
  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData) throw new Error("hosted-hooks.connection-parent-unsafe");
    const root = realpathSync(localAppData).toLowerCase();
    const actual = realpathSync(parent).toLowerCase();
    const remainder = relative(root, actual);
    if (remainder === "" || remainder === ".." || remainder.startsWith(`..${sep}`) || isAbsolute(remainder)) {
      throw new Error("hosted-hooks.connection-parent-unsafe");
    }
  } else if ((stat.mode & 0o077) !== 0 || stat.uid !== process.getuid()) {
    throw new Error("hosted-hooks.connection-parent-unsafe");
  }
  return resolve(path);
}

// Hook transports may reuse the same private connection-file location. This
// validates the location, not the caller's authority or the file's contents.
export function validateHostedHookConnectionPath(path) {
  return privateParent(path);
}

// Called only after a managed hosted client has exited. The connection is
// removed solely when its recorded local owner is dead and its exact bytes and
// file identity have not changed; a live or foreign binding is preserved.
export function reclaimTerminatedHostedHookConnection(connectionPath) {
  return reclaimTerminatedConnection(privateParent(connectionPath));
}

export async function startHostedHookControl({rpc_client: rpc, connection_path: connectionPath, owns_session: ownsSession} = {}) {
  if (typeof rpc?.events?.on !== "function" || typeof rpc?.events?.off !== "function"
    || typeof rpc?.inspect !== "function") throw new TypeError("hosted-hooks.rpc-client-required");
  if (typeof ownsSession !== "function") throw new TypeError("hosted-hooks.session-owner-required");
  const path = privateParent(connectionPath);
  const hooks = createHookEventSession({enforce_supported_tool_blocks: true});
  const events = new EventEmitter();
  let live = true, closed = false, bridge = null, bytes = null, identity = null;
  const ownedFile = () => sameFile(path, identity);
  const onNotification = message => {
    if (live && message?.method === "turn/completed" && ownsSession(message.params?.threadId)) {
      events.emit("hook-observation", hooks.observe(message), message);
    }
  };
  const onFailure = () => { live = false; hooks.clear(); };
  rpc.events.on("notification", onNotification);
  rpc.events.on("failure", onFailure);
  try {
    bridge = await startHookCallbackBridge({client: {observeHook: event => {
      const state = rpc.inspect();
      if (!live || state.closed || state.failure || state.transport?.failed || state.transport?.closing
        || state.transport?.connected === false) {
        return {ok: false, kind: "block", stdout: {}, reason_codes: ["hosted-hooks.gateway-unavailable"], authority_effect: "none"};
      }
      if (!ownsSession(event?.session_id)) {
        return {ok: false, kind: "block", stdout: {}, reason_codes: ["hosted-hooks.session-unowned"], authority_effect: "none"};
      }
      return hooks.observe(event);
    }}});
    bytes = `${JSON.stringify({...bridge.connection, schema_version: CONNECTION_SCHEMA,
      owner_process: {platform: process.platform, hostname: hostname(), pid: process.pid}})}\n`;
    if (Buffer.byteLength(bytes) > MAX_CONNECTION_BYTES) throw new Error("hosted-hooks.connection-too-large");
    reclaimTerminatedConnection(path);
    const temporaryPath = resolve(dirname(path), `.${basename(path)}.${randomBytes(12).toString("hex")}.tmp`);
    const descriptor = openSync(temporaryPath,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0), 0o600);
    try {
      identity = fstatSync(descriptor);
      const content = Buffer.from(bytes);
      for (let offset = 0; offset < content.length;) {
        const written = writeSync(descriptor, content, offset, content.length - offset);
        if (written <= 0) throw new Error("hosted-hooks.connection-write-failed");
        offset += written;
      }
      fsyncSync(descriptor);
    } finally { closeSync(descriptor); }
    try { linkSync(temporaryPath, path); }
    finally {
      try { if (sameFile(temporaryPath, identity)) unlinkSync(temporaryPath); }
      catch (error) { if (error.code !== "ENOENT") throw error; }
    }
  } catch (error) {
    live = false;
    rpc.events.off("notification", onNotification);
    rpc.events.off("failure", onFailure);
    await bridge?.close();
    if (identity) {
      try { if (ownedFile()) unlinkSync(path); }
      catch (cleanupError) { if (cleanupError.code !== "ENOENT") throw cleanupError; }
    }
    throw error;
  }
  return Object.freeze({connection_path: path, events, authority_effect: "none",
    inspect: () => ({live, retained_turns: hooks.size(), authority_effect: "none"}),
    close: async () => {
      if (closed) return;
      closed = true;
      live = false;
      rpc.events.off("notification", onNotification);
      rpc.events.off("failure", onFailure);
      hooks.clear();
      events.removeAllListeners();
      await bridge.close();
      try {
        if (ownedFile() && readFileSync(path, "utf8") === bytes) unlinkSync(path);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    },
  });
}
