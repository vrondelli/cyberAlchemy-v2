#!/usr/bin/env node
import {mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";

import {parseAgentEvent} from "../agent-events.mjs";
import {createReadOnlyToolRuntime} from "../read-only-tools.mjs";

function percentile(values, p) { return values[Math.min(values.length - 1, Math.ceil(values.length * p) - 1)]; }
function stats(samples) { const sorted = [...samples].sort((a, b) => a - b); return {iterations: sorted.length, p50_us: percentile(sorted, 0.5), p95_us: percentile(sorted, 0.95), p99_us: percentile(sorted, 0.99)}; }
function measure(iterations, operation) { const values = []; for (let index = 0; index < iterations; index += 1) { const start = process.hrtime.bigint(); operation(); values.push(Number(process.hrtime.bigint() - start) / 1000); } return stats(values); }

const root = mkdtempSync(resolve(tmpdir(), "are-integrated-benchmark-"));
try {
  writeFileSync(resolve(root, "fixture.txt"), "alpha\nbeta\ngamma\n");
  const runtime = createReadOnlyToolRuntime({repository_root: root, observation_allowlist: ["fixture.txt"]});
  const raw = JSON.stringify({schema_version: "are.coding-agent-event/v1", event_id: "benchmark", kind: "tool-request", tool: {name: "read-file", arguments: {path: "fixture.txt"}}, authority_effect: "none"});
  const result = {
    schema_version: "are.coding-agent-integrated-benchmark/v1",
    status: "MEASURED",
    event_parse: measure(2000, () => parseAgentEvent(raw)),
    read_file: measure(1000, () => runtime.invoke("read-file", {path: "fixture.txt"})),
    search_text: measure(1000, () => runtime.invoke("search-text", {query: "beta"})),
    synthetic_fixture: true,
    network_calls: 0,
    authority_effect: "none",
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} finally { rmSync(root, {recursive: true, force: true}); }
