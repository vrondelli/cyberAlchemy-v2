import {isAbsolute} from "node:path";
import {desktopHostProfileForInvocation} from "./desktop-host-profile.mjs";

export function classifyDesktopCliInvocation(args) {
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== "string" || arg.length === 0 || /[\0\r\n]/.test(arg))) {
    return {ok: false, reason: "desktop-shim.invalid-arguments"};
  }
  if (args.length === 1 && args[0] === "--version") return {ok: true, kind: "version", backend_args: args};
  const hostProfile = desktopHostProfileForInvocation(args);
  if (hostProfile === null) {
    return {ok: false, reason: "desktop-shim.unsupported-invocation"};
  }
  return {ok: true, kind: "app-server", backend_args: [...args], host_profile: hostProfile};
}

export function validateDesktopShimEnvironment(env, {kind = "app-server"} = {}) {
  const fields = ["ARE_DESKTOP_SHIM_CODEX_COMMAND", "ARE_DESKTOP_SHIM_CODEX_SHA256",
    "ARE_DESKTOP_SHIM_CONFIG", "ARE_DESKTOP_SHIM_REPOSITORY_ROOT"];
  for (const field of fields) {
    if (typeof env[field] !== "string" || !isAbsolute(env[field]) && field !== "ARE_DESKTOP_SHIM_CODEX_SHA256") {
      return {ok: false, reason: "desktop-shim.missing-or-relative-setting", field};
    }
  }
  if (!/^[0-9a-f]{64}$/.test(env.ARE_DESKTOP_SHIM_CODEX_SHA256)) {
    return {ok: false, reason: "desktop-shim.invalid-backend-digest"};
  }
  const mode = env.ARE_DESKTOP_SHIM_MODE;
  if (kind === "app-server" && !["direct-candidate", "managed-gateway"].includes(mode)) {
    return {ok: false, reason: "desktop-shim.mode-required", field: "ARE_DESKTOP_SHIM_MODE"};
  }
  let gateway = null;
  if (kind === "app-server" && mode === "managed-gateway") {
    if (!isAbsolute(env.ARE_DESKTOP_GATEWAY_SOCKET ?? "")
      || !isAbsolute(env.ARE_DESKTOP_GATEWAY_STATE_DIR ?? "")) {
      return {ok: false, reason: "desktop-shim.gateway-path-required"};
    }
    const token = env.ARE_DESKTOP_GATEWAY_CONNECTION_TOKEN;
    if (typeof token !== "string" || Buffer.byteLength(token) < 32
      || Buffer.byteLength(token) > 256 || /[\0\r\n]/.test(token)) {
      return {ok: false, reason: "desktop-shim.gateway-token-required"};
    }
    gateway = {socket: env.ARE_DESKTOP_GATEWAY_SOCKET,
      state_dir: env.ARE_DESKTOP_GATEWAY_STATE_DIR};
  }
  return {ok: true, backend: env.ARE_DESKTOP_SHIM_CODEX_COMMAND,
    backend_sha256: env.ARE_DESKTOP_SHIM_CODEX_SHA256,
    config: env.ARE_DESKTOP_SHIM_CONFIG,
    repository_root: env.ARE_DESKTOP_SHIM_REPOSITORY_ROOT,
    mode: kind === "app-server" ? mode : null, gateway};
}
