import {createHash} from "node:crypto";
import {realpathSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {basename, isAbsolute} from "node:path";

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function stable(value) { if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`; if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`; return JSON.stringify(value); }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.freeze(value); for (const child of Object.values(value)) freeze(child); return value; }
function fail(...reason_codes) { return freeze({schema_version: "are.coding-agent-sandbox-result/v1", ok: false, reason_codes: [...new Set(reason_codes)].sort(), effect_applied: false, authority_effect: "none"}); }
function redact(value, materials) { let output = String(value ?? ""); for (const material of materials) if (material) output = output.replaceAll(material, "[REDACTED]"); return output; }

export function parseSandboxConfig(input) {
  if (input === null || input === undefined) return null;
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("sandbox must be an object.");
  const allowedKeys = new Set(["type", "engine", "image", "allowed_commands", "timeout_ms", "maximum_output_bytes", "memory", "cpus", "pids_limit"]);
  if (Object.keys(input).some((key) => !allowedKeys.has(key))) throw new TypeError("sandbox contains an unsupported field.");
  if (input.type !== "container") throw new TypeError("sandbox.type must be container.");
  if (typeof input.engine !== "string" || !isAbsolute(input.engine) || !["docker", "podman"].includes(basename(input.engine))) throw new TypeError("sandbox.engine must be an absolute Docker or Podman executable path.");
  if (typeof input.image !== "string" || !/@sha256:[a-f0-9]{64}$/u.test(input.image)) throw new TypeError("sandbox.image must be digest-pinned.");
  if (!Array.isArray(input.allowed_commands) || input.allowed_commands.length === 0 || input.allowed_commands.some((command) => typeof command !== "string" || !/^[A-Za-z0-9._+-]+$/u.test(command))) throw new TypeError("sandbox.allowed_commands is invalid.");
  const integer = (value, fallback, field) => { const result = value ?? fallback; if (!Number.isSafeInteger(result) || result < 1) throw new TypeError(`${field} is invalid.`); return result; };
  const result = {
    type: "container",
    engine: input.engine,
    image: input.image,
    allowed_commands: Object.freeze([...new Set(input.allowed_commands)].sort()),
    timeout_ms: integer(input.timeout_ms, 30_000, "sandbox.timeout_ms"),
    maximum_output_bytes: integer(input.maximum_output_bytes, 131_072, "sandbox.maximum_output_bytes"),
    memory: typeof input.memory === "string" && /^[0-9]+[kmg]$/iu.test(input.memory) ? input.memory : "512m",
    cpus: typeof input.cpus === "string" && /^[0-9]+(?:\.[0-9]+)?$/u.test(input.cpus) ? input.cpus : "1",
    pids_limit: integer(input.pids_limit, 128, "sandbox.pids_limit"),
  };
  return freeze(result);
}

export function createContainerSandbox({config, repository_root, runner = spawnSync} = {}) {
  const parsed = parseSandboxConfig(config);
  if (parsed === null) throw new TypeError("An explicit sandbox configuration is required.");
  if (typeof repository_root !== "string" || !repository_root) throw new TypeError("repository_root is required.");
  if (typeof runner !== "function") throw new TypeError("runner is required.");
  const root = realpathSync(repository_root);
  if (root.includes(",") || root.includes("\n") || root.includes("\r")) throw new TypeError("repository_root cannot be represented safely as a container mount.");
  const configDigest = sha256(stable(parsed));
  return Object.freeze({
    kind: "container",
    config_digest: configDigest,
    run(command, {environment = {}} = {}) {
      if (!Array.isArray(command) || command.length === 0 || command.some((entry) => typeof entry !== "string" || entry.includes("\0"))) return fail("sandbox.command-invalid");
      if (!parsed.allowed_commands.includes(command[0])) return fail("sandbox.command-not-allowlisted");
      if (!environment || typeof environment !== "object" || Array.isArray(environment) || Object.entries(environment).some(([name, value]) => !/^[A-Z_][A-Z0-9_]{0,126}$/u.test(name) || typeof value !== "string" || !value || value.includes("\0"))) return fail("sandbox.environment-invalid");
      const environmentNames = Object.keys(environment).sort();
      const args = [
        "run", "--rm", "--pull", "never", "--network", "none", "--read-only", "--cap-drop", "ALL",
        "--security-opt", "no-new-privileges", "--pids-limit", String(parsed.pids_limit),
        "--memory", parsed.memory, "--cpus", parsed.cpus, "--user", "65534:65534",
        "--mount", `type=bind,src=${root},dst=/workspace,readonly`, "--workdir", "/workspace",
        "--tmpfs", "/tmp:rw,noexec,nosuid,nodev,size=64m", ...environmentNames.flatMap((name) => ["--env", name]), parsed.image, ...command,
      ];
      let executed;
      try { executed = runner(parsed.engine, args, {encoding: "utf8", timeout: parsed.timeout_ms, env: {LANG: "C", LC_ALL: "C", ...environment}}); }
      catch { return fail("sandbox.engine-invocation-failed"); }
      if (executed?.error?.code === "ETIMEDOUT") return fail("sandbox.command-timeout");
      if (executed?.error) return fail("sandbox.engine-unavailable");
      const redactions = Object.values(environment);
      const stdout = redact(executed?.stdout, redactions);
      const stderr = redact(executed?.stderr, redactions);
      if (Buffer.byteLength(stdout) + Buffer.byteLength(stderr) > parsed.maximum_output_bytes) return fail("sandbox.output-limit-exceeded");
      const material = {schema_version: "are.coding-agent-sandbox-result/v1", ok: executed.status === 0, reason_codes: executed.status === 0 ? [] : ["sandbox.command-failed"], engine: parsed.engine, engine_kind: basename(parsed.engine), image: parsed.image, config_digest: configDigest, command, injected_environment_names: environmentNames, observed_exit: executed.status, stdout, stderr, stdout_sha256: sha256(stdout), stderr_sha256: sha256(stderr), network: "none", source_mount: "read-only", effect_applied: false, authority_effect: "none"};
      return freeze({...material, result_digest: sha256(stable(material))});
    },
  });
}

export function runSandboxCommand({sandbox, command} = {}) {
  if (!sandbox || typeof sandbox.run !== "function") return fail("sandbox.required");
  return sandbox.run(command);
}
