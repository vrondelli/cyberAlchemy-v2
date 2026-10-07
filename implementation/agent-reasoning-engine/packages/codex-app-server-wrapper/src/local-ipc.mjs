import {resolve} from "node:path";

const WINDOWS_PIPE_PREFIX = "\\\\.\\pipe\\";

export function resolveGatewayIpcPath(value, platform = process.platform) {
  if (typeof value !== "string" || value.length === 0) throw new TypeError("A local gateway IPC path is required.");
  if (platform === "win32") {
    if (!value.startsWith(WINDOWS_PIPE_PREFIX)) throw new TypeError("A Windows gateway endpoint must be a local named pipe.");
    const name = value.slice(WINDOWS_PIPE_PREFIX.length);
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(name) || name.includes("..")) {
      throw new TypeError("The Windows named-pipe name is invalid.");
    }
    return value;
  }
  if (value.includes("\0")) throw new TypeError("The gateway IPC path is invalid.");
  return resolve(value);
}
