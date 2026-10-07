import {spawnSync} from "node:child_process";
import {readFileSync} from "node:fs";

import {digestValue} from "./canonical.mjs";

const DIGEST = /^[0-9a-f]{64}$/u;

export function backendProcessBirthSupported() {
  return process.platform === "linux" || process.platform === "win32";
}

export function backendProcessBirthRef(pid) {
  if (!Number.isSafeInteger(pid) || pid < 1) return null;
  try {
    if (process.platform === "linux") {
      const bootId = readFileSync("/proc/sys/kernel/random/boot_id", "utf8").trim();
      const stat = readFileSync(`/proc/${pid}/stat`, "utf8");
      const endOfCommand = stat.lastIndexOf(")");
      const fields = endOfCommand < 0 ? [] : stat.slice(endOfCommand + 1).trim().split(/\s+/u);
      const startTicks = fields[19]; // /proc stat field 22, counting from field 3 after comm.
      if (!/^[0-9a-f-]{36}$/u.test(bootId) || !/^\d+$/u.test(startTicks ?? "")) return null;
      return digestValue({platform: "linux", boot_id: bootId, process_start_ticks: startTicks});
    }
    if (process.platform === "win32") {
      const script = `$ErrorActionPreference = 'Stop'; `
        + `$p = Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}'; `
        + `if ($null -eq $p) { 'null' } else { $p.CreationDate.ToUniversalTime().ToString('o') }`;
      const query = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand",
        Buffer.from(script, "utf16le").toString("base64")],
      {encoding: "utf8", windowsHide: true, timeout: 10_000, maxBuffer: 4096});
      if (query.error || query.status !== 0) return null;
      const birth = query.stdout.trim();
      if (!/^\d{4}-\d{2}-\d{2}T/u.test(birth)) return null;
      return digestValue({platform: "win32", process_birth_utc: birth});
    }
  } catch { /* An uninspectable birth must never authorize a replacement. */ }
  return null;
}

export function classifyBackendProcessIdentity(identity, processState, observedBirthRef) {
  if (processState !== "alive") return processState;
  if (!identity?.birth_ref) return "alive"; // Legacy records remain conservative.
  if (!DIGEST.test(observedBirthRef ?? "")) return "unknown";
  return identity.birth_ref === observedBirthRef ? "alive" : "reused";
}
