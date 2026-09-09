#!/usr/bin/env node
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {promptHook} from "../src/prompt-hook.mjs";
import {MAX_INPUT_BYTES} from "../src/decision-cli.mjs";

const [command, ...args] = process.argv.slice(2);
const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";
try {
  if (command === "config" && args.length === 0) {
    const script = fileURLToPath(import.meta.url);
    process.stdout.write(JSON.stringify({description: "ARE advisory prompt routing candidate; pinned native fixture tested; not activated",
      hooks: {UserPromptSubmit: [{hooks: [{type: "command", command: `${quote(process.execPath)} ${quote(script)} prompt`, timeout: 15}]}]}}, null, 2) + "\n");
  } else if (command === "inspect-host" && args.length <= 1) {
    const executable = args[0] ?? "codex";
    const version = spawnSync(executable, ["--version"], {encoding: "utf8", timeout: 5000, maxBuffer: 65536});
    const features = spawnSync(executable, ["features", "list"], {encoding: "utf8", timeout: 5000, maxBuffer: 65536});
    const line = features.stdout?.split("\n").find(line => /^codex_hooks\s/.test(line));
    const enabled = line ? /\s+true\s*$/.test(line) : null;
    const ok = version.status === 0 && features.status === 0;
    process.stdout.write(JSON.stringify({schema_version: "are.hook-host-observation/v1", command: executable,
      version: version.status === 0 ? version.stdout.trim() : null, hooks_feature: line?.trim() ?? null,
      readiness: !ok ? "host-unavailable" : enabled === false ? "feature-disabled" : "native-canary-required",
      native_delivery_verified: false, installed: false, authority_effect: "none"}, null, 2) + "\n");
    process.exitCode = ok ? 0 : 1;
  } else if (command === "prompt" && args.length === 0) {
    const chunks = []; let bytes = 0;
    for await (const chunk of process.stdin) {
      bytes += chunk.length;
      if (bytes > MAX_INPUT_BYTES) throw new Error("hook.input-too-large");
      chunks.push(chunk);
    }
    let event;
    try { event = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new Error("hook.input-invalid-json"); }
    const result = promptHook(event);
    process.stdout.write(JSON.stringify(result.stdout) + "\n");
    process.stderr.write(result.stderr);
    process.exitCode = result.exit_code;
  } else throw new Error("hook.usage:are hook prompt|config|inspect-host [codex-command]");
} catch (error) {
  process.stdout.write("{}\n");
  process.stderr.write((error.message?.startsWith("hook.") ? error.message : "hook.runtime-unavailable") + "\n");
  process.exitCode = 1;
}
