import {spawn} from "node:child_process";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import {dirname, join} from "node:path";
import {StringDecoder} from "node:string_decoder";
import {fileURLToPath} from "node:url";

const require = createRequire(import.meta.url);
const DEFAULT_MAX_OUTPUT_BYTES = 1024 * 1024;
const DEFAULT_TURN_TIMEOUT_MS = 120_000;
const READ_ONLY_PATCH = fileURLToPath(new URL("../config/read-only.patch.yml", import.meta.url));
const PROVIDER_PATCH_IDS = new Set(["agent-default-model", "llm-pi-ai"]);

function validateProviderPatch(path) {
  if (!path) return;
  const source = readFileSync(path, "utf8");
  const ids = [...source.matchAll(/^-\s+id:\s*([^\s#]+)\s*$/gmu)].map((match) => match[1]);
  if (ids.length === 0) throw new Error("DSH provider patch must declare at least one plugin id.");
  const forbidden = ids.filter((id) => !PROVIDER_PATCH_IDS.has(id));
  if (forbidden.length > 0) throw new Error(`DSH provider patch crosses the closed adapter boundary: ${forbidden.join(",")}`);
}

function childEnvironment(extra = {}) {
  const baseline = ["PATH", "Path", "SystemRoot", "WINDIR", "TEMP", "TMP", "TMPDIR", "LANG", "LC_ALL", "SSL_CERT_FILE", "SSL_CERT_DIR", "HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY", "DSH_HOME"];
  const passthrough = String(process.env.ARE_DSH_PASSTHROUGH_ENV ?? "").split(",").map((key) => key.trim()).filter(Boolean);
  const keys = [...new Set([...baseline, ...passthrough])];
  return {...Object.fromEntries(keys.filter((key) => typeof process.env[key] === "string").map((key) => [key, process.env[key]])), ...extra};
}

export function resolveBundledDshEntry() {
  return join(dirname(require.resolve("@deepseek-ai/dsh/package.json")), "lib", "bin.js");
}

function appendBounded(current, chunk, maximum, label) {
  const next = Buffer.concat([current, Buffer.from(chunk)]);
  if (next.byteLength > maximum) throw new Error(`DSH ${label} exceeded ${maximum} bytes.`);
  return next;
}

export function createDshRunner(options = {}) {
  const spawnImpl = options.spawn_impl ?? spawn;
  const entry = options.dsh_entry ?? process.env.ARE_DSH_ENTRY ?? resolveBundledDshEntry();
  const patchPath = options.patch_path ?? process.env.ARE_DSH_PATCH_PATH;
  const maxOutputBytes = options.max_output_bytes ?? DEFAULT_MAX_OUTPUT_BYTES;
  const killGraceMs = options.kill_grace_ms ?? 2000;
  const turnTimeoutMs = options.turn_timeout_ms ?? Number(process.env.ARE_DSH_TURN_TIMEOUT_MS ?? DEFAULT_TURN_TIMEOUT_MS);
  if (!Number.isSafeInteger(maxOutputBytes) || maxOutputBytes < 1) throw new TypeError("max_output_bytes must be a positive safe integer.");
  if (!Number.isSafeInteger(turnTimeoutMs) || turnTimeoutMs < 1) throw new TypeError("turn_timeout_ms must be a positive safe integer.");
  validateProviderPatch(patchPath);
  const capabilityAttestation = Object.freeze({
    schema_version: "are.dsh-capability-attestation/v1",
    profile: "headless",
    permission_mode: "read-only",
    telemetry: "disabled",
    provider_patch_ids: patchPath ? [...readFileSync(patchPath, "utf8").matchAll(/^-\s+id:\s*([^\s#]+)\s*$/gmu)].map((match) => match[1]).sort() : [],
    launcher_enforced: true,
    effective_runtime_tools: "not_evaluable",
    disposition: "launcher-constrained-runtime-unverified",
    residue: ["The DSH public launcher does not expose a machine-readable effective tool registry; zero-tool runtime attestation remains not_evaluable."],
    authority_effect: "none",
  });

  function run({prompt, cwd, signal, on_delta}) {
    if (typeof prompt !== "string" || prompt.trim() === "") throw new TypeError("A non-empty DSH prompt is required.");
    const args = [entry, "--profile", "headless", ...(patchPath ? ["--patch", patchPath] : []), "--patch", READ_ONLY_PATCH, prompt];
    const child = spawnImpl(process.execPath, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32",
      env: childEnvironment({
        ...options.env,
        DSH_PERMISSION_MODE: "read-only",
        DSH_TELEMETRY_DISABLED: "1",
      }),
    });
    let stdout = Buffer.alloc(0);
    let stderr = Buffer.alloc(0);
    let settled = false;
    let killTimer = null;
    let captureError = null;
    let timedOut = false;
    const decoder = new StringDecoder("utf8");
    let streamPending = "";

    const streamChunk = (chunk, final = false) => {
      if (typeof on_delta !== "function") return;
      streamPending += chunk;
      const emitLength = final ? streamPending.replace(/\r?\n$/u, "").length : Math.max(0, streamPending.length - 2);
      if (emitLength === 0) return;
      const delta = streamPending.slice(0, emitLength);
      streamPending = streamPending.slice(emitLength);
      if (delta !== "") on_delta(delta);
    };

    const abort = () => {
      if (settled || child.exitCode !== null) return;
      try {
        if (process.platform !== "win32" && Number.isSafeInteger(child.pid)) process.kill(-child.pid, "SIGTERM");
        else child.kill("SIGTERM");
      } catch { child.kill("SIGTERM"); }
      killTimer = setTimeout(() => {
        if (settled || child.exitCode !== null) return;
        try {
          if (process.platform !== "win32" && Number.isSafeInteger(child.pid)) process.kill(-child.pid, "SIGKILL");
          else child.kill("SIGKILL");
        } catch { child.kill("SIGKILL"); }
      }, killGraceMs);
      killTimer.unref?.();
    };
    signal?.addEventListener("abort", abort, {once: true});
    const deadline = setTimeout(() => {
      timedOut = true;
      abort();
    }, turnTimeoutMs);
    deadline.unref?.();

    const completion = new Promise((resolveValue) => {
      child.stdout.on("data", (chunk) => {
        if (captureError) return;
        try {
          stdout = appendBounded(stdout, chunk, maxOutputBytes, "stdout");
          streamChunk(decoder.write(chunk));
        }
        catch (error) { captureError = error; abort(); }
      });
      child.stderr.on("data", (chunk) => {
        if (captureError) return;
        try { stderr = appendBounded(stderr, chunk, maxOutputBytes, "stderr"); }
        catch (error) { captureError = error; abort(); }
      });
      child.once("error", (error) => { captureError = error; });
      child.once("close", (code, childSignal) => {
        settled = true;
        clearTimeout(deadline);
        if (killTimer) clearTimeout(killTimer);
        signal?.removeEventListener("abort", abort);
        streamChunk(decoder.end(), true);
        const text = stdout.toString("utf8").replace(/\r?\n$/, "");
        const diagnostic = stderr.toString("utf8").trim();
        if (timedOut) return resolveValue({status: "failed", text, diagnostic: `DSH turn exceeded ${turnTimeoutMs} ms.`, code, signal: childSignal, reason: "turn-timeout"});
        if (signal?.aborted) return resolveValue({status: "interrupted", text, diagnostic, code, signal: childSignal});
        if (captureError) return resolveValue({status: "failed", text, diagnostic: captureError.message, code, signal: childSignal});
        if (code === 0) return resolveValue({status: "completed", text, diagnostic, code, signal: childSignal});
        resolveValue({status: "failed", text, diagnostic, code, signal: childSignal});
      });
    });
    return Object.freeze({child, completion, interrupt: abort});
  }

  return Object.freeze({run, dsh_entry: entry, patch_path: patchPath ?? null, read_only_patch: READ_ONLY_PATCH, turn_timeout_ms: turnTimeoutMs, capability_attestation: capabilityAttestation});
}
