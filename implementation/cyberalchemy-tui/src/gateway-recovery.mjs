import {createHash} from "node:crypto";
import {lstatSync, mkdirSync} from "node:fs";
import {homedir} from "node:os";
import {join, resolve} from "node:path";

export function defaultGatewaySocket() {
  const runtimeRoot = process.env.XDG_RUNTIME_DIR || `/run/user/${typeof process.getuid === "function" ? process.getuid() : 1000}`;
  return resolve(runtimeRoot, "are-codex/gateway.sock");
}

function requireOwnedDirectory(path, privateMode) {
  const stat = lstatSync(path);
  if (!stat.isDirectory() || (typeof process.getuid === "function" && stat.uid !== process.getuid())
    || (stat.mode & (privateMode ? 0o077 : 0o022)) !== 0) {
    throw new Error("coding-agent.gateway-recovery-directory-unsafe");
  }
}

function ensurePrivateChild(path) {
  try { mkdirSync(path, {mode: 0o700}); }
  catch (error) { if (error?.code !== "EEXIST") throw error; }
  requireOwnedDirectory(path, true);
}

export function createTuiGatewayRecoveryPath({socket_path, state_home = process.env.XDG_STATE_HOME ?? join(homedir(), ".local", "state")} = {}) {
  if (process.platform === "win32") throw new Error("coding-agent.gateway-recovery-native-windows-store-unavailable");
  if (typeof socket_path !== "string" || !socket_path.trim()) throw new TypeError("Gateway socket path is required.");
  const root = resolve(state_home);
  mkdirSync(root, {recursive: true, mode: 0o700});
  requireOwnedDirectory(root, false);
  const application = resolve(root, "cyberalchemy");
  ensurePrivateChild(application);
  const directory = resolve(application, "tui-gateway");
  ensurePrivateChild(directory);
  const socketDigest = createHash("sha256").update(resolve(socket_path)).digest("hex");
  return resolve(directory, `coding-proposal-${socketDigest}.json`);
}
