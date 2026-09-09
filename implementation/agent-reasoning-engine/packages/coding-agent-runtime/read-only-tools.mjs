import {createHash} from "node:crypto";
import {lstatSync, readFileSync, realpathSync} from "node:fs";
import {isAbsolute, relative, resolve, sep} from "node:path";

import {runSandboxCommand} from "./sandbox.mjs";
import {runSecretBoundSandboxCommand} from "./tool-secret-injection.mjs";

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.freeze(value); for (const child of Object.values(value)) freeze(child); return value; }
function fail(...reason_codes) { return freeze({ok: false, reason_codes: [...new Set(reason_codes)].sort(), authority_effect: "none"}); }

const BASE_TOOL_CONTRACTS = freeze({
  "list-files": {arguments: {prefix: "optional string prefix over the observation allowlist"}, example: {prefix: "src/"}},
  "read-file": {arguments: {path: "required allowlisted repository-relative file path"}, example: {path: "src/example.mjs"}},
  "search-text": {arguments: {query: "required non-empty literal string", paths: "optional array of allowlisted repository-relative file paths"}, example: {query: "export function", paths: ["src/example.mjs"]}},
  "repository-map": {arguments: {}, example: {}},
  "run-command": {arguments: {command: "required non-empty string array; command[0] must be sandbox-allowlisted", secret_binding_id: "optional exact tool-secret binding id"}, example: {command: ["node", "--test"]}},
});

function safePath(root, candidate, allowlist) {
  if (typeof candidate !== "string" || !candidate || isAbsolute(candidate) || candidate.split(/[\\/]/u).includes("..") || !allowlist.has(candidate)) throw new Error("PATH_NOT_ALLOWLISTED");
  const absolute = resolve(root, candidate);
  if (absolute !== root && !absolute.startsWith(`${root}${sep}`)) throw new Error("PATH_ESCAPE");
  let cursor = root;
  for (const segment of candidate.split(/[\\/]/u)) {
    cursor = resolve(cursor, segment);
    if (lstatSync(cursor).isSymbolicLink()) throw new Error("SYMLINK_FORBIDDEN");
  }
  if (!lstatSync(absolute).isFile()) throw new Error("REGULAR_FILE_REQUIRED");
  return absolute;
}

export function decideToolRequest({tool_name, policy = {}, unattended = true} = {}) {
  const allow = new Set(policy.allow ?? []);
  const ask = new Set(policy.ask ?? []);
  const deny = new Set(policy.deny ?? []);
  let decision = deny.has(tool_name) ? "deny" : ask.has(tool_name) ? "ask" : allow.has(tool_name) ? "allow" : "deny";
  const reason_codes = [];
  if (decision === "ask" && unattended) { decision = "deny"; reason_codes.push("tool.ask-denied-unattended"); }
  if (decision === "deny" && reason_codes.length === 0) reason_codes.push(deny.has(tool_name) ? "tool.explicitly-denied" : "tool.not-allowed");
  return freeze({schema_version: "are.coding-agent-tool-decision/v1", ok: true, tool_name, decision, reason_codes, authority_effect: "none"});
}

export function createReadOnlyToolRuntime({repository_root, observation_allowlist = [], maximum_result_bytes = 65_536, repository_map = null, sandbox = null, secret_bindings = [], secret_registry = null} = {}) {
  if (typeof repository_root !== "string" || !repository_root) throw new TypeError("repository_root is required.");
  if (!Number.isSafeInteger(maximum_result_bytes) || maximum_result_bytes < 1) throw new TypeError("maximum_result_bytes must be positive.");
  const root = realpathSync(repository_root);
  const allowlist = new Set([...new Set(observation_allowlist)].sort());
  const secretBindings = new Map(secret_bindings.map((binding) => [binding.binding_id, binding]));
  if (secretBindings.size !== secret_bindings.length) throw new TypeError("secret_bindings contains duplicate ids.");
  for (const path of allowlist) safePath(root, path, allowlist);

  function receipt(tool_name, arguments_, output) {
    const bytes = Buffer.from(JSON.stringify(output));
    if (bytes.length > maximum_result_bytes) return fail("tool.result-limit-exceeded");
    return freeze({ok: true, schema_version: "are.coding-agent-tool-result/v1", tool_name, arguments: arguments_, output, output_sha256: sha256(bytes), output_bytes: bytes.length, effect_calls: 0, authority_effect: "none"});
  }

  const toolNames = ["list-files", "read-file", "search-text", ...(repository_map ? ["repository-map"] : []), ...(sandbox ? ["run-command"] : [])];
  const toolContracts = Object.fromEntries(toolNames.map((name) => [name, BASE_TOOL_CONTRACTS[name]]));
  return Object.freeze({
    repository_root: root,
    tool_names: Object.freeze(toolNames),
    tool_contracts: freeze(toolContracts),
    invoke(tool_name, arguments_ = {}) {
      if (!arguments_ || typeof arguments_ !== "object" || Array.isArray(arguments_)) return fail("tool.arguments-invalid");
      try {
        if (tool_name === "list-files") {
          if (Object.keys(arguments_).some((key) => key !== "prefix")) return fail("tool.arguments-unknown");
          const prefix = typeof arguments_.prefix === "string" ? arguments_.prefix : "";
          return receipt(tool_name, arguments_, [...allowlist].filter((path) => path.startsWith(prefix)).sort());
        }
        if (tool_name === "read-file") {
          if (Object.keys(arguments_).some((key) => key !== "path") || typeof arguments_.path !== "string") return fail("tool.arguments-invalid");
          const absolute = safePath(root, arguments_.path, allowlist);
          const bytes = readFileSync(absolute);
          const utf8 = new TextDecoder("utf-8", {fatal: true}).decode(bytes);
          return receipt(tool_name, arguments_, {path: relative(root, absolute), utf8, sha256: sha256(bytes), byte_count: bytes.length});
        }
        if (tool_name === "search-text") {
          if (Object.keys(arguments_).some((key) => !["query", "paths"].includes(key)) || typeof arguments_.query !== "string" || !arguments_.query) return fail("tool.arguments-invalid");
          const paths = arguments_.paths === undefined ? [...allowlist] : arguments_.paths;
          if (!Array.isArray(paths) || paths.some((path) => typeof path !== "string")) return fail("tool.arguments-invalid");
          const matches = [];
          for (const path of [...new Set(paths)].sort()) {
            const absolute = safePath(root, path, allowlist);
            const source = new TextDecoder("utf-8", {fatal: true}).decode(readFileSync(absolute));
            source.split("\n").forEach((line, index) => { if (line.includes(arguments_.query)) matches.push({path, line_number: index + 1, line}); });
          }
          return receipt(tool_name, arguments_, matches);
        }
        if (tool_name === "repository-map") {
          if (Object.keys(arguments_).length !== 0) return fail("tool.arguments-unknown");
          if (!repository_map) return fail("tool.repository-map-unavailable");
          return receipt(tool_name, arguments_, repository_map);
        }
        if (tool_name === "run-command") {
          if (Object.keys(arguments_).some((key) => !["command", "secret_binding_id"].includes(key)) || !Array.isArray(arguments_.command) || arguments_.command.length === 0 || arguments_.command.some((entry) => typeof entry !== "string" || entry.includes("\0")) || (arguments_.secret_binding_id !== undefined && typeof arguments_.secret_binding_id !== "string")) return fail("tool.arguments-invalid");
          const finalize = (executed) => executed.ok || executed.reason_codes?.includes("sandbox.command-failed") ? receipt(tool_name, arguments_, executed) : executed;
          if (arguments_.secret_binding_id !== undefined) {
            const binding = secretBindings.get(arguments_.secret_binding_id);
            if (!binding || !secret_registry) return fail("tool.secret-binding-unavailable");
            return runSecretBoundSandboxCommand({binding, secret_registry, sandbox, command: arguments_.command}).then(finalize);
          }
          return finalize(runSandboxCommand({sandbox, command: arguments_.command}));
        }
        return fail("tool.unknown");
      } catch (error) {
        return fail(`tool.invocation-blocked:${error.code ?? error.message}`);
      }
    },
  });
}
