#!/usr/bin/env node
import {spawn} from "node:child_process";
import {resolve} from "node:path";

import {inspectProduct, materializeProductClosure, productRoot} from "../src/product.mjs";
import {inspectFrozenProductCandidate} from "../src/product-candidate.mjs";
import {readAdapterObservation} from "../packages/codex-app-server-wrapper/src/adapter-observation-client.mjs";
import {readGatewayThreadObservation} from "../packages/codex-app-server-wrapper/src/thread-observation-client.mjs";
import {readGatewayDecisionObservation} from "../packages/codex-app-server-wrapper/src/decision-observation-client.mjs";
import {readHostedRejoinObservation} from "../packages/codex-app-server-wrapper/src/hosted-rejoin-observation-client.mjs";

function usage() {
  process.stderr.write("Interaction review: are interaction demo [--json] | run --state <file> --provider <module> | inspect --state <file>\n");
  process.stderr.write("Usage: are hook prompt|config|compact <binding.json>|compact-config <binding.json>|inspect-host|native-test|native-events-test|native-gateway-test | decide route|context|effect|continue | doctor [--json] | adapter-status --json --socket <path> | thread-status --json --socket <path> [--offset <n> --snapshot-digest <hex>] | hosted-rejoin-status --json --refs <comma-separated-backend-refs> | decision-status --json --socket <path> | closure [--json] | candidate freeze | candidate inspect [--json] | test | gateway <gateway-options> | managed-session <managed-options> | dsh-web-host --home <private-dir> --workspace <dir> [--observation-socket <private-socket>] [--resume-session <native-id>]... | benchmark <benchmark-options> | improve inspect --report <file> | improve run-canary [--output <file>] | coding-agent demo [--approve] [--keep] | coding-agent live-demo [--codex-command <path>] [--model <id>] [--approve] [--keep]\n");
}

function run(script, args) {
  const child = spawn(process.execPath, [script, ...args], {stdio: "inherit"});
  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => child.kill(signal));
  child.once("exit", (code, signal) => process.exit(signal ? 1 : (code ?? 1)));
}

const [command, ...args] = process.argv.slice(2);
if (command === "interaction") {
  run(resolve(productRoot, "packages/codex-app-server-wrapper/bin/are-interaction.mjs"), args);
} else if (command === "decide") {
  run(resolve(productRoot, "bin/are-decide.mjs"), args);
} else if (command === "hook" && args[0] === "native-gateway-test" && args.length === 2) {
  run(resolve(productRoot, "scripts/test-native-prompt-hook.mjs"), [args[1], "--gateway"]);
} else if (command === "hook" && args[0] === "native-events-test" && args.length === 2) {
  run(resolve(productRoot, "scripts/test-native-prompt-hook.mjs"), [args[1], "--events"]);
} else if (command === "hook" && args[0] === "native-test") {
  run(resolve(productRoot, "scripts/test-native-prompt-hook.mjs"), args.slice(1));
} else if (command === "hook") {
  run(resolve(productRoot, "bin/are-hook.mjs"), args);
} else if (command === "doctor") {
  const health = inspectProduct({require_exact_runtime: true});
  if (args.includes("--json")) process.stdout.write(`${JSON.stringify(health, null, 2)}\n`);
  else process.stdout.write(`ARE ${health.product_version}: ${health.status}\n${health.reason_codes.join("\n")}\n`);
  process.exitCode = health.status === "PASS" ? 0 : 1;
} else if (command === "adapter-status") {
  const socketIndex = args.indexOf("--socket");
  if (args.length !== 3 || !args.includes("--json") || socketIndex < 0 || !args[socketIndex + 1] || !process.env.ARE_ADAPTER_OBSERVATION_TOKEN) {
    usage();
    process.exitCode = 2;
  } else {
    try {
      const observation = await readAdapterObservation({socket_path: args[socketIndex + 1], token: process.env.ARE_ADAPTER_OBSERVATION_TOKEN});
      process.stdout.write(`${JSON.stringify(observation)}\n`);
    } catch (error) {
      process.stderr.write(`${error instanceof Error ? error.message : "adapter.observation-failed"}\n`);
      process.exitCode = 1;
    }
  }
} else if (command === "thread-status") {
  const socketIndex = args.indexOf("--socket");
  const offsetIndex = args.indexOf("--offset");
  const digestIndex = args.indexOf("--snapshot-digest");
  const paged = offsetIndex >= 0 && digestIndex >= 0 && args.length === 7;
  const offset = paged ? Number(args[offsetIndex + 1]) : 0;
  const snapshotDigest = paged ? args[digestIndex + 1] : null;
  if ((!paged && args.length !== 3) || !args.includes("--json") || socketIndex < 0 || !args[socketIndex + 1]
    || !process.env.ARE_ADAPTER_OBSERVATION_TOKEN || (offsetIndex >= 0 || digestIndex >= 0) && !paged
    || !Number.isSafeInteger(offset) || offset < 0 || offset % 32 !== 0
    || (paged && !/^[0-9a-f]{64}$/.test(snapshotDigest))) {
    usage();
    process.exitCode = 2;
  } else {
    try {
      const observation = await readGatewayThreadObservation({socket_path: args[socketIndex + 1], token: process.env.ARE_ADAPTER_OBSERVATION_TOKEN,
        page_offset: offset, expected_snapshot_digest: snapshotDigest});
      process.stdout.write(`${JSON.stringify(observation)}\n`);
    } catch (error) {
      process.stderr.write(`${error instanceof Error ? error.message : "thread.observation-failed"}\n`);
      process.exitCode = 1;
    }
  }
} else if (command === "decision-status") {
  const socketIndex = args.indexOf("--socket");
  if (args.length !== 3 || !args.includes("--json") || socketIndex < 0 || !args[socketIndex + 1] || !process.env.ARE_ADAPTER_OBSERVATION_TOKEN) {
    usage();
    process.exitCode = 2;
  } else {
    try {
      const observation = await readGatewayDecisionObservation({socket_path: args[socketIndex + 1], token: process.env.ARE_ADAPTER_OBSERVATION_TOKEN});
      process.stdout.write(`${JSON.stringify(observation)}\n`);
    } catch (error) {
      process.stderr.write(`${error instanceof Error ? error.message : "decision.observation-failed"}\n`);
      process.exitCode = 1;
    }
  }
} else if (command === "hosted-rejoin-status") {
  if (args.length !== 3 || args[0] !== "--json" || args[1] !== "--refs"
    || !process.env.ARE_COMPANION_HOSTED_REJOIN_URL
    || !process.env.ARE_HOSTED_REJOIN_OBSERVATION_TOKEN) {
    usage();
    process.exitCode = 2;
  } else {
    try {
      const observation = await readHostedRejoinObservation({
        url: process.env.ARE_COMPANION_HOSTED_REJOIN_URL,
        token: process.env.ARE_HOSTED_REJOIN_OBSERVATION_TOKEN,
        refs: args[2] ? args[2].split(",") : [],
      });
      process.stdout.write(`${JSON.stringify(observation)}\n`);
    } catch (error) {
      process.stderr.write(`${error instanceof Error ? error.message : "hosted-rejoin.observation-failed"}\n`);
      process.exitCode = 1;
    }
  }
} else if (command === "closure") {
  const closure = materializeProductClosure();
  process.stdout.write(args.includes("--json") ? `${JSON.stringify(closure, null, 2)}\n` : `${closure.closure_digest}  ${closure.files.length} files\n`);
} else if (command === "test") {
  run(resolve(productRoot, "scripts/test-all.mjs"), args);
} else if (command === "candidate" && args[0] === "freeze") {
  run(resolve(productRoot, "scripts/freeze-tested-product-candidate.mjs"), args.slice(1));
} else if (command === "candidate" && args[0] === "inspect") {
  const inspection = inspectFrozenProductCandidate();
  if (args.includes("--json")) process.stdout.write(`${JSON.stringify(inspection, null, 2)}\n`);
  else process.stdout.write(`ARE ${inspection.candidate?.candidate_id ?? "candidate"}: ${inspection.status}\n${inspection.reason_codes.join("\n")}\n`);
  process.exitCode = inspection.status === "PASS" ? 0 : 1;
} else if (command === "gateway") {
  run(resolve(productRoot, "packages/codex-app-server-wrapper/bin/are-codex-gateway.mjs"), args);
} else if (command === "managed-session") {
  run(resolve(productRoot, "packages/codex-app-server-wrapper/bin/are-managed-session.mjs"), args);
} else if (command === "dsh-web-host") {
  run(resolve(productRoot, "packages/dsh-gateway-backend-adapter/bin/are-dsh-web-host.mjs"), args);
} else if (command === "benchmark") {
  run(resolve(productRoot, "benchmarks/real-reasoning-v1/bin/benchmark.mjs"), args);
} else if (command === "improve") {
  run(resolve(productRoot, "benchmarks/real-reasoning-v1/bin/improve.mjs"), args);
} else if (command === "coding-agent" && args[0] === "demo") {
  run(resolve(productRoot, "packages/coding-agent-runtime/bin/demo.mjs"), args.slice(1));
} else if (command === "coding-agent" && args[0] === "live-demo") {
  run(resolve(productRoot, "packages/coding-agent-runtime/bin/live-demo.mjs"), args.slice(1));
} else {
  usage();
  process.exitCode = 2;
}
