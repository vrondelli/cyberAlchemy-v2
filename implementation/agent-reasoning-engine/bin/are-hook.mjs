#!/usr/bin/env node
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {promptHook} from "../src/prompt-hook.mjs";
import {compactContextHook, loadCompactContextBinding} from "../src/compact-context-hook.mjs";
import {MAX_INPUT_BYTES} from "../src/decision-cli.mjs";

const [command, ...args] = process.argv.slice(2);
const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";
function inspectHooksFeature(output) {
  const rows = new Map();
  for (const line of output.split("\n")) {
    const fields = line.trim().split(/\s+/);
    if (!["hooks", "codex_hooks"].includes(fields[0])) continue;
    if (fields.length < 3 || !["true", "false"].includes(fields.at(-1)) || rows.has(fields[0])) return {line: null, key: null, enabled: null};
    rows.set(fields[0], {line: line.trim(), key: fields[0], enabled: fields.at(-1) === "true"});
  }
  const canonical = rows.get("hooks"), legacy = rows.get("codex_hooks");
  if (canonical && legacy && canonical.enabled !== legacy.enabled) return {line: null, key: null, enabled: null};
  return canonical ?? legacy ?? {line: null, key: null, enabled: null};
}
try {
  if (command === "config" && args.length === 0) {
    const script = fileURLToPath(import.meta.url);
    process.stdout.write(JSON.stringify({description: "ARE advisory prompt routing candidate; pinned native fixture tested; not activated",
      hooks: {UserPromptSubmit: [{hooks: [{type: "command", command: `${quote(process.execPath)} ${quote(script)} prompt`, timeout: 15}]}]}}, null, 2) + "\n");
  } else if (command === "compact-config" && args.length === 1) {
    loadCompactContextBinding(args[0]);
    const script = fileURLToPath(import.meta.url);
    process.stdout.write(JSON.stringify({description: "ARE exact-session C1 compaction recovery candidate; not installed or activated",
      hooks: {SessionStart: [{matcher: "^compact$", hooks: [{type: "command", command: `${quote(process.execPath)} ${quote(script)} compact ${quote(args[0])}`, timeout: 15, additionalContextLimit: 6000}]}]}}, null, 2) + "\n");
  } else if (command === "inspect-host" && args.length <= 1) {
    const executable = args[0] ?? "codex";
    const version = spawnSync(executable, ["--version"], {encoding: "utf8", timeout: 5000, maxBuffer: 65536});
    const features = spawnSync(executable, ["features", "list"], {encoding: "utf8", timeout: 5000, maxBuffer: 65536});
    const feature = inspectHooksFeature(features.stdout ?? "");
    const ok = version.status === 0 && features.status === 0;
    process.stdout.write(JSON.stringify({schema_version: "are.hook-host-observation/v2", command: executable,
      version: version.status === 0 ? version.stdout.trim() : null, hooks_feature: feature.line,
      hooks_feature_key: feature.key,
      readiness: !ok ? "host-unavailable" : feature.enabled === null ? "feature-unknown" : feature.enabled === false ? "feature-disabled" : "native-canary-required",
      native_delivery_verified: false, installed: null, installation_inspected: false, authority_effect: "none"}, null, 2) + "\n");
    process.exitCode = ok ? 0 : 1;
  } else if ((command === "prompt" && args.length === 0) || (command === "compact" && args.length === 1)) {
    const chunks = []; let bytes = 0;
    for await (const chunk of process.stdin) {
      bytes += chunk.length;
      if (bytes > MAX_INPUT_BYTES) throw new Error("hook.input-too-large");
      chunks.push(chunk);
    }
    let event;
    try { event = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new Error("hook.input-invalid-json"); }
    const result = command === "prompt" ? promptHook(event) : compactContextHook(event, loadCompactContextBinding(args[0]));
    process.stdout.write(JSON.stringify(result.stdout) + "\n");
    process.stderr.write(result.stderr);
    process.exitCode = result.exit_code;
  } else throw new Error("hook.usage:are hook prompt|config|compact <binding.json>|compact-config <binding.json>|inspect-host [codex-command]");
} catch (error) {
  process.stdout.write("{}\n");
  process.stderr.write((error.message?.startsWith("hook.") ? error.message : "hook.runtime-unavailable") + "\n");
  process.exitCode = 1;
}
