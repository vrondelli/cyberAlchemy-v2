// Explicit live benchmark only. Emits evidence to stdout; never auto-runs in tests.
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {assessRequirementChange, assessRequirementPatch, materializeRequirementSnapshot, REQUIREMENT_PATCH_INSTRUCTION, digestIntentMaterial} from "../index.mjs";
import {createAppServerRpcClient, spawnAppServerRpcTransport} from "../../codex-app-server-wrapper/src/rpc-client.mjs";
import {registerRequirementBenchmarkCompletion} from "../../evolution-runtime/src/benchmark-registration.mjs";

if (process.argv[2] !== "--live") throw Error("Explicit --live is required; this benchmark makes 16 model calls.");
const manifestUrl = new URL("../../codex-app-server-wrapper/test/evidence/requirement-latency-001.manifest.json", import.meta.url);
const m = JSON.parse(readFileSync(manifestUrl, "utf8"));
const out = {schema_version: "are.requirement-latency-result/v1", manifest_digest: digestIntentMaterial(m),
  node_version: process.version, binary_version: execFileSync("codex", ["--version"], {encoding: "utf8"}).trim(),
  model: m.model, requested_effort: m.effort, started_at: new Date().toISOString(), source_digests: {}, runs: [], authority_effect: "none"};
for (const f of ["src/requirement-change.mjs", "src/requirement-patch.mjs", "src/canonical.mjs", "scripts/benchmark-requirement-latency.mjs"])
  out.source_digests[f] = createHash("sha256").update(readFileSync(new URL("../" + f, import.meta.url))).digest("hex");
let client, current;
const norm = a => a.map(x => x.trim().toLowerCase()).sort();
const percentile = (a, q) => [...a].sort((x,y) => x-y)[Math.ceil(a.length*q)-1];
try {
  if (out.binary_version !== m.binary_version || process.version !== "v26.8.1") throw Error("Runtime version mismatch");
  client = createAppServerRpcClient({transport: spawnAppServerRpcTransport({command: "codex", args: ["app-server", "--stdio"]}),
    thread_start_timeout_ms: 180000, completion_timeout_ms: 60000});
  client.events.on("notification", n => {
    if (!current) return;
    if (n.method === "item/started" && !["userMessage", "agentMessage", "reasoning"].includes(n.params?.item?.type)) current.tool_events++;
    if (n.method === "thread/tokenUsage/updated") current.token_usage = n.params?.tokenUsage ?? null;
    if (n.method === "item/agentMessage/delta" && current.first_text_ms === null) current.first_text_ms = performance.now() - current.turn_start;
  });
  await client.initialize({clientInfo: {name: "are-requirement-latency", version: "0.1.0"}, capabilities: {experimentalApi: true}});
  await client.notify("initialized");
  const models = await client.request("model/list", {});
  const model = models.data.find(x => x.id === m.model || x.model === m.model);
  if (!model?.supportedReasoningEfforts?.some(x => x.reasoningEffort === m.effort)) throw Error("Required model/effort unavailable");
  out.model_capability = model;
  for (const entry of m.schedule) {
    const c = m.cases.find(x => x.id === entry.id);
    const prompt = "Classify only; no tools or files. " + (entry.variant === "full" ? m.full_instruction : REQUIREMENT_PATCH_INSTRUCTION)
      + " Input: " + JSON.stringify({objective: c.objective, requirements: c.requirements, request: c.request});
    current = {...entry, prompt, input_bytes: Buffer.byteLength(prompt), tool_events: 0, first_text_ms: null, token_usage: null};
    out.runs.push(current);
    const start = performance.now();
    const thread = await client.startThread({cwd: "/tmp", model: m.model, approvalPolicy: "never", sandbox: "read-only", ephemeral: true,
      config: {"features.shell_tool": false, "model_reasoning_effort": m.effort}, baseInstructions: "Classify supplied data only. Return JSON. No tools."});
    current.startup_ms = performance.now()-start;
    current.thread_id = thread.thread.id; current.observed_model = thread.model;
    current.thread_effort = thread.reasoningEffort ?? null;
    if (thread.model !== m.model) throw Error("Observed model mismatch");
    current.turn_start = performance.now();
    const turn = await client.runTurn({threadId: thread.thread.id, model: m.model, effort: m.effort,
      input: [{type: "text", text: prompt}], approvalPolicy: "never", sandboxPolicy: {type: "readOnly"}});
    current.elapsed_ms = performance.now()-current.turn_start; delete current.turn_start;
    current.turn_id = turn.started.turn.id; current.completion_status = turn.completed.turn.status;
    current.raw_output = turn.text; current.output_bytes = Buffer.byteLength(turn.text);
    try {
      const p = JSON.parse(turn.text.replace(/^\s*```(?:json)?\s*/, "").replace(/\s*```\s*$/, ""));
      const snapshot = materializeRequirementSnapshot({consumer_ref: "latency-benchmark", scope_ref: "case:"+c.id, objective_id: "objective:"+c.id,
        objective_state_digest: digestIntentMaterial({objective: c.objective, requirements: c.requirements}), requirements: c.requirements, source_refs: ["manifest:"+out.manifest_digest]});
      const input = {snapshot, request: c.request, request_ref: "case:"+c.id};
      const assessment = entry.variant === "full" ? assessRequirementChange({...input, transition: p.transition, delta: p.requirement_delta}) : assessRequirementPatch({...input, patch: p});
      current.assessment = assessment;
      current.label_matched = p.transition === c.expected;
      current.requirements_matched = assessment.ok && JSON.stringify(norm(assessment.value.resulting_requirements)) === JSON.stringify(norm(c.resulting_requirements));
      current.passed = current.label_matched && current.requirements_matched && current.tool_events === 0 && current.completion_status === "completed";
    } catch(e) {current.error = e.message; current.passed = false;}
    console.log("PROGRESS " + JSON.stringify({completed: out.runs.length, ...entry, passed: current.passed, elapsed_ms: current.elapsed_ms}));
    current = null;
  }
  out.summary = {};
  for (const variant of ["full", "compact"]) {
    const rows = out.runs.filter(x => x.variant === variant), times = rows.map(x => x.elapsed_ms);
    out.summary[variant] = {total: rows.length, passed: rows.filter(x => x.passed).length, p50_ms: percentile(times,.5), p95_ms: percentile(times,.95),
      output_bytes: rows.reduce((n,r) => n+r.output_bytes,0), under_1000ms: rows.filter(x => x.elapsed_ms<=1000).length};
  }
  const {full, compact} = out.summary;
  out.relative_p95_reduction = 1-compact.p95_ms/full.p95_ms;
  out.gates = {quality: compact.passed === m.gates.quality_matches && full.passed === m.gates.quality_matches,
    relative_latency: out.relative_p95_reduction >= m.gates.relative_p95_reduction, wrapper_deadline: compact.p95_ms <= m.gates.wrapper_p95_ms};
  out.status = "completed";
} catch(e) {out.status = "blocked"; out.error = e.message;}
finally {await client?.close();}
out.finished_at = new Date().toISOString();
console.log("RESULT " + JSON.stringify(out));
try {
  console.log("REGISTRATION " + JSON.stringify(registerRequirementBenchmarkCompletion(m, out)));
} catch(error) {
  console.error("REGISTRATION_FAILED " + error.message);
  process.exitCode = 1;
}
if (out.status !== "completed") process.exitCode = 1;
