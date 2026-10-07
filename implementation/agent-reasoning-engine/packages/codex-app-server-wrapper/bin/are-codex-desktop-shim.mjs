#!/usr/bin/env node
import {spawn} from "node:child_process";
import {access, open, realpath, stat} from "node:fs/promises";
import {constants} from "node:fs";
import {isAbsolute} from "node:path";
import {fileURLToPath} from "node:url";
import {classifyDesktopCliInvocation, validateDesktopShimEnvironment} from "../src/desktop-cli-shim.mjs";
import {sha256PinnedBackend} from "../src/pinned-backend-digest.mjs";

async function launchTrace(stage, kind, childPid = null) {
  const path = process.env.ARE_DESKTOP_SHIM_TRACE_PATH;
  if (path === undefined) return;
  if (!isAbsolute(path)) throw new Error("desktop-shim.trace-path-not-absolute");
  const handle = await open(path, constants.O_APPEND | constants.O_WRONLY | constants.O_NOFOLLOW);
  try {
    const info = await handle.stat();
    if (!info.isFile() || (info.mode & 0o077) !== 0
      || typeof process.getuid === "function" && info.uid !== process.getuid()) {
      throw new Error("desktop-shim.trace-file-not-private");
    }
    await handle.writeFile(`${JSON.stringify({schema_version: "are.desktop-shim-launch-trace/v1",
      stage, kind, pid: process.pid, parent_pid: process.ppid,
      ...(Number.isSafeInteger(childPid) && childPid > 0 ? {child_pid: childPid} : {}),
      at_ms: Date.now()})}\n`);
    await handle.sync();
  } finally { await handle.close(); }
}

async function main() {
  const invocation = classifyDesktopCliInvocation(process.argv.slice(2));
  await launchTrace("received", invocation.ok ? invocation.kind : "rejected");
  if (!invocation.ok) throw new Error(invocation.reason);
  const settings = validateDesktopShimEnvironment(process.env, {kind: invocation.kind});
  if (!settings.ok) throw new Error(`${settings.reason}:${settings.field ?? ""}`);
  const backend = await realpath(settings.backend);
  const [backendInfo, shimInfo] = await Promise.all([stat(backend), stat(fileURLToPath(import.meta.url))]);
  if (backendInfo.dev === shimInfo.dev && backendInfo.ino === shimInfo.ino) throw new Error("desktop-shim.recursive-backend");
  if (!backendInfo.isFile()) throw new Error("desktop-shim.backend-not-file");
  await access(backend, constants.X_OK);
  if (await sha256PinnedBackend(backend) !== settings.backend_sha256) throw new Error("desktop-shim.backend-digest-drift");
  if (invocation.kind === "app-server") {
    const configInfo = await stat(settings.config).catch(() => null);
    if (!configInfo?.isFile()) throw new Error("desktop-shim.config-unreadable");
    await access(settings.config, constants.R_OK).catch(() => { throw new Error("desktop-shim.config-unreadable"); });
    const rootInfo = await stat(settings.repository_root).catch(() => null);
    if (!rootInfo?.isDirectory()) throw new Error("desktop-shim.repository-root-unreadable");
    await access(settings.repository_root, constants.R_OK | constants.X_OK).catch(() => {
      throw new Error("desktop-shim.repository-root-unreadable");
    });
  }

  const args = invocation.kind === "version" ? ["--version"] : settings.mode === "managed-gateway" ? [
    fileURLToPath(new URL("./are-codex-desktop-gateway-client.mjs", import.meta.url)),
  ] : [
    fileURLToPath(new URL("./are-codex-app-server.mjs", import.meta.url)),
    "--config", settings.config,
    "--repository-root", settings.repository_root,
    "--codex-command", backend,
    ...invocation.backend_args.flatMap((arg) => ["--codex-arg", arg]),
  ];
  const command = invocation.kind === "version" ? backend : process.execPath;
  const child = spawn(command, args, {stdio: "inherit", env: invocation.kind === "app-server"
    && settings.mode === "managed-gateway" ? {...process.env,
      ARE_DESKTOP_HOST_PROFILE: invocation.host_profile} : process.env});
  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => child.kill(signal));
  child.once("error", (error) => {
    process.stderr.write(`desktop-shim.launch-failed:${error.code ?? "unknown"}\n`);
    process.exitCode = 4;
  });
  child.once("exit", (code, signal) => {
    process.exitCode = code ?? (signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 4);
  });
  try { await launchTrace("spawned", invocation.kind, child.pid); }
  catch (error) { child.kill("SIGTERM"); throw error; }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 2;
});
