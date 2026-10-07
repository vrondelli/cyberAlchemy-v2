import {realpathSync, statSync} from "node:fs";
import {isAbsolute, relative, sep} from "node:path";

import {freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";

const MAX_ARG_BYTES = 4096;
const MAX_COMMAND_BYTES = 16384;
const MAX_ARG_COUNT = 64;
const COMMAND_TIMEOUT_MS = 30000;
const OUTPUT_BYTES_CAP = 32768;

function inside(root, candidate) {
  const path = relative(root, candidate);
  return path === "" || (path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}

// Materialize only the pinned App Server's buffered, non-interactive command
// shape. Callers must still verify approval, journal an intent, and recheck
// the active turn immediately before dispatching the returned request.
export function materializeHostedCommandExec({request, repository_root: repositoryRoot} = {}) {
  if (!isRecord(request) || request.kind !== "command" || !isRecord(request.proposal)
    || typeof repositoryRoot !== "string" || !isAbsolute(repositoryRoot)) {
    return {ok: false, reason_codes: ["hosted-effect.command-input-invalid"]};
  }
  let root, cwd;
  try {
    if (request.proposal.cwd !== undefined && (typeof request.proposal.cwd !== "string"
      || !isAbsolute(request.proposal.cwd))) throw new Error("cwd-not-absolute");
    root = realpathSync(repositoryRoot);
    cwd = realpathSync(request.proposal.cwd ?? root);
    if (!statSync(root).isDirectory() || !statSync(cwd).isDirectory()) throw new Error("not-directory");
  } catch { return {ok: false, reason_codes: ["hosted-effect.command-cwd-invalid"]}; }
  const proposal = request.proposal;
  if (!inside(root, cwd) || Object.keys(proposal).some(key => !["command", "cwd"].includes(key))
    || !Array.isArray(proposal.command) || proposal.command.length < 1
    || proposal.command.length > MAX_ARG_COUNT || proposal.command.some(arg =>
      !nonEmptyString(arg) || arg.includes("\0") || Buffer.byteLength(arg, "utf8") > MAX_ARG_BYTES)
    || Buffer.byteLength(JSON.stringify(proposal.command), "utf8") > MAX_COMMAND_BYTES) {
    return {ok: false, reason_codes: ["hosted-effect.command-proposal-invalid"]};
  }
  return freezeResult({ok: true, schema_version: "are.hosted-command-exec/v1",
    host_method: "command/exec",
    params: {command: proposal.command, cwd,
      sandboxPolicy: {type: "workspaceWrite", writableRoots: [root],
        excludeSlashTmp: true, excludeTmpdirEnvVar: true, networkAccess: false},
      timeoutMs: COMMAND_TIMEOUT_MS,
      // The pinned native Windows App Server rejects a custom outputBytesCap
      // under its Windows sandbox. The wrapper still truncates the returned
      // stdout/stderr to 8 KiB each before delivering the result to the client.
      ...(process.platform === "win32" ? {} : {outputBytesCap: OUTPUT_BYTES_CAP}),
      tty: false, streamStdin: false, streamStdoutStderr: false},
    authority_effect: "none"});
}
