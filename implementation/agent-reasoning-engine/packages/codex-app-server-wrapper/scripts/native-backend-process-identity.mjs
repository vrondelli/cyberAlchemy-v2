import {spawnSync} from "node:child_process";
import {realpathSync} from "node:fs";

function canonicalBinary(path) {
  const canonical = realpathSync(path);
  return process.platform === "win32" ? canonical.toLowerCase() : canonical;
}

export function inspectBackendProcess(pid, binary, scratch, expectedBirth = null) {
  if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error("backend-identity.invalid-pid");
  const expectedBinary = canonicalBinary(binary);
  if (process.platform !== "win32") {
    try {
      return {exact: realpathSync(`/proc/${pid}/exe`) === expectedBinary
        && realpathSync(`/proc/${pid}/cwd`) === realpathSync(scratch), birth: null};
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "ESRCH") return {exact: false, birth: null};
      throw error;
    }
  }
  const script = `$ErrorActionPreference = 'Stop'; `
    + `$p = Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}'; `
    + `if ($null -eq $p) { 'null' } else { `
    + `[pscustomobject]@{path=$p.ExecutablePath; birth=$p.CreationDate.ToUniversalTime().ToString('o')} `
    + `| ConvertTo-Json -Compress }`;
  const query = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand",
    Buffer.from(script, "utf16le").toString("base64")], {encoding: "utf8", timeout: 10000});
  if (query.error || query.status !== 0) {
    throw new Error(`backend-identity.windows-query-failed:${query.error?.code ?? query.status}`);
  }
  const processInfo = JSON.parse(query.stdout.trim());
  if (!processInfo) return {exact: false, birth: null};
  if (typeof processInfo.path !== "string" || typeof processInfo.birth !== "string") {
    throw new Error("backend-identity.windows-query-incomplete");
  }
  let actualBinary;
  try { actualBinary = canonicalBinary(processInfo.path); }
  catch (error) {
    if (error.code === "ENOENT") return {exact: false, birth: processInfo.birth};
    throw error;
  }
  return {exact: actualBinary === expectedBinary
    && (!expectedBirth || processInfo.birth === expectedBirth), birth: processInfo.birth};
}
