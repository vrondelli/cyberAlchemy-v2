import {closeSync, fstatSync, openSync, writeSync, fsyncSync, constants} from "node:fs";
import {isAbsolute} from "node:path";

// C0 diagnostic only: no JSON-RPC IDs, parameters, thread names, or prompt text.
export function createDesktopMethodTrace(path) {
  if (path === undefined) return null;
  if (!isAbsolute(path)) throw new Error("desktop-gateway.trace-path-not-absolute");
  return method => {
    if (!["initialize", "thread/start"].includes(method)) {
      throw new Error("desktop-gateway.trace-method-unsupported");
    }
    const fd = openSync(path, constants.O_APPEND | constants.O_WRONLY | constants.O_NOFOLLOW);
    try {
      const info = fstatSync(fd);
      if (!info.isFile() || (info.mode & 0o077) !== 0
        || typeof process.getuid === "function" && info.uid !== process.getuid()) {
        throw new Error("desktop-gateway.trace-file-not-private");
      }
      const record = {schema_version: "are.desktop-gateway-method-trace/v1",
        stage: "forwarded-to-gateway-transport", method, pid: process.pid,
        parent_pid: process.ppid, at_ms: Date.now()};
      writeSync(fd, `${JSON.stringify(record)}\n`);
      fsyncSync(fd);
    } finally { closeSync(fd); }
  };
}
