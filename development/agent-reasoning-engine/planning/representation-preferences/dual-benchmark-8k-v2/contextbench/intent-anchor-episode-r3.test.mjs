import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {runIntentAnchorEpisode, hasModuleManifestStopEvidence} from "./intent-anchor-episode-r3.mjs";
import {tools, createRepositoryTools} from "../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs";
import {stable, bodyForReceipt} from "../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs";
import {retainedReasoning} from "../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/accounting-v1/accounting.mjs";

const hash = value => createHash("sha256").update(value).digest("hex");
const objective = "Parser rejects trailing commas. Documentation describes valid configuration.";

function hintOutput(base, sourceSha, query, sourcePath = "alpha.js") {
  return {schema: "are.ranked-source-hints/v1", index_digest: "c".repeat(64), query_digest: hash(stable({query})), partial_index: false, omitted_query_terms: 0, matching_windows: 1, omitted_hints: 0, unreadable_matching_lines: 0, unreadable_path_fallbacks: 0,
    hints: [{path: sourcePath, base_commit: base, content_sha256: sourceSha, start_line: 1, end_line: 1, score_units: 100}]};
}

async function fixture({sequence, failTransition = null, failRead = false, failReadPath = null, failHintAt = null, sourcePath = "alpha.js", extraFiles = [], hintPathForQuery = null, taskObjective = objective, source_neighborhood = false, search_followthrough = false, objective_search = false, api_search = false, terminal_shortlist = false, discovery_call_cap = 95, adaptive_shortlist = false, objective_anchor_gate = false, distinctive_acquisition = false, early_evidence_stop = false, conditional_evidence_stop = false, objective_identifier_search = false, uncovered_requirement_search = false, omit_reasoning_from_view = false, omit_reasoning_on_denial = false, output_cap_correction = false, non_tool_terminal_after_convergence = false, truncateAt = null, reasoningContent = undefined} = {}) {
  const root = mkdtempSync(join(tmpdir(), "intent-anchor-episode-"));
  const events = [], receipts = [], snapshots = [], prompts = [], queryChecks = [];
  let calls = 0, failedPersistence = false, hintCalls = 0;
  try {
    const git = (...args) => execFileSync("git", ["-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", ...args], {cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"]}).trim();
    git("init", "-q");
    const text = source_neighborhood || search_followthrough || objective_search || api_search || terminal_shortlist ? Array.from({length: 100}, (_, index) => `export const ${search_followthrough && index === 49 ? "dictLimit" : api_search === "r2" && index === 49 ? "PublicKey" : (objective_search || api_search) && index === 49 ? "parser" : `line_${index + 1}`} = ${index + 1};`).join("\n") + "\n" : "export const parser = true;\n";
    mkdirSync(join(root, sourcePath.split("/").slice(0, -1).join("/")), {recursive: true});
    writeFileSync(join(root, sourcePath), text);
    for (const file of extraFiles) {
      mkdirSync(join(root, file.path.split("/").slice(0, -1).join("/")), {recursive: true});
      writeFileSync(join(root, file.path), file.text);
    }
    git("add", "."); git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "fixture");
    const base = git("rev-parse", "HEAD"), sourceSha = hash(text);
    const source_hints = {
      summary: stable({base_commit: base, index_digest: "c".repeat(64), admitted_files: 1, partial_index: false}),
      expected: {index_digest: "c".repeat(64), base_commit: base, partial_index: false, files: new Map([[sourcePath, sourceSha], ...extraFiles.map(file => [file.path, hash(file.text)])])},
      query: async query => {
        hintCalls++;
        const last = [...events].reverse().find(event => event.kind === "intent-anchor-convergence-state");
        queryChecks.push(last?.transition === "query-admitted" && last.state.queries.some(item => item.normalized_query === query));
        if (hintCalls === failHintAt) throw new Error("source-index.failed");
        const hintPath = hintPathForQuery?.(query) ?? sourcePath;
        const hintSha = hintPath === sourcePath ? sourceSha : hash(extraFiles.find(file => file.path === hintPath)?.text ?? "");
        return hintOutput(base, hintSha, query, hintPath);
      }
    };
    const nativeExecute = createRepositoryTools({root, base_commit: base, record_source: source => snapshots.push(source)});
    const execute_tool = async (name, args) => (failRead || args.path === failReadPath) && name === "read_file" ? {ok: false, error: "forced-read-failure"} : nativeExecute(name, args);
    const steps = sequence ?? [
      ["rank_sources", {query: "parser trailing commas"}],
      ["rank_sources", {query: "documentation valid configuration"}],
      ["finish_issue_attempt", {}]
    ];
    const driver = {
      receipts, index_receipts: [], measurePrompt: async () => 2000,
      admitMessages: async (messages, offeredTools) => stable({messages, tools: offeredTools}),
      prepare: async ({prompt, output_cap}) => {
        prompts.push(JSON.parse(prompt));
        const profile = {model: "glm-5.3-flash", reasoning_effort: "low", output_cap};
        return {prompt, output_cap, profile, input_upper_bound: 1000, request_sha256: hash(stable(bodyForReceipt(prompt, profile)))};
      },
      dispatch: async prepared => {
        const packet = events.find(event => event.kind === "terminal-packet")?.packet;
        const index = calls++;
        const preferredNeighborhood = events.find(event => event.kind === "terminal-packet")?.neighborhood?.delivered_read_ids?.[0];
        const selectedHandle = packet?.private.bindings.find(binding => binding.read_id === preferredNeighborhood)?.handle ?? packet?.private.bindings[0]?.handle;
        const truncated = Array.isArray(truncateAt) ? truncateAt : truncateAt === null ? [] : [truncateAt];
        const [name, args] = packet ? ["submit_context_handles_v2", {summary: "Convergence-supported parser context.", context_handles: [selectedHandle]}] : steps[index - truncated.filter(value => value < index).length];
        assert.ok(name, `missing scripted step ${index}`);
        if (truncated.includes(index)) {
          receipts.push({...prepared.profile, kind: "model", dispatched: true, status: 200, automatic_retries: 0, input_tokens: 100, output_tokens: prepared.output_cap, request_sha256: prepared.request_sha256, finish_reason: "length"});
          throw new Error("glm.incomplete-output");
        }
        receipts.push({...prepared.profile, kind: "model", dispatched: true, status: 200, automatic_retries: 0, input_tokens: 100, output_tokens: 20, request_sha256: prepared.request_sha256, finish_reason: "tool_calls"});
        if (name === "__prose__") { receipts.at(-1).finish_reason = "stop"; return {final_bytes: stable({message: {role: "assistant", content: "Need a tool."}, finish_reason: "stop"})}; }
        const emittedName = name === "__malformed_apply_edits__" ? "apply_edits" : name;
        const argumentsText = name === "__malformed_apply_edits__" ? '{"edits": [' : stable(args);
        return {final_bytes: stable({message: {role: "assistant", content: null, ...(reasoningContent ? {reasoning_content: reasoningContent} : {}), tool_calls: [{id: `call-${index}`, type: "function", function: {name: emittedName, arguments: argumentsText}}]}, finish_reason: "tool_calls"})};
      }
    };
    const persist = event => {
      if (!failedPersistence && event.kind === "intent-anchor-convergence-state" && event.transition === failTransition) { failedPersistence = true; throw new Error(`fixture-persistence:${failTransition}`); }
      if (!failedPersistence && event.kind === failTransition) { failedPersistence = true; throw new Error(`fixture-persistence:${failTransition}`); }
      events.push(structuredClone(event));
    };
    const result = await runIntentAnchorEpisode({task: {problem_statement: taskObjective, instance_id: "fixture", repo_url: "https://example.invalid/repo.git", base_commit: base}, driver, tools, execute_tool,
      source_context: () => ({snapshots, repoRoot: root}), source_hints, measure_tokens: async () => 20, persist, source_neighborhood, search_followthrough, objective_search, api_search, terminal_shortlist, discovery_call_cap, adaptive_shortlist, objective_anchor_gate, distinctive_acquisition, early_evidence_stop, conditional_evidence_stop, objective_identifier_search, uncovered_requirement_search, omit_reasoning_from_view, omit_reasoning_on_denial, output_cap_correction, non_tool_terminal_after_convergence});
    return {result, events, prompts, calls, queryChecks};
  } finally { rmSync(root, {recursive: true, force: true}); }
}

test("normal path persists convergence before finish and exports only its bound base read", async () => {
  const f = await fixture();
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.result.arm, "intent-anchor-convergence-r3");
  assert.equal(f.calls, 4);
  assert.deepEqual(f.queryChecks, [true, true]);
  assert.equal(f.result.origin_bindings.length, 1);
  assert.equal(f.result.convergence_state.confirmed_base_reads.length, 1);
  assert.deepEqual(f.result.exported.prediction.traj_data.pred_files, ["alpha.js"]);
  assert.ok(f.prompts.slice(0, 2).every(prompt => !prompt.tools.some(tool => tool.function.name === "finish_issue_attempt")));
  assert.deepEqual(f.prompts[0].tools.map(tool => tool.function.name), ["rank_sources"]);
  assert.deepEqual(f.prompts[1].tools.map(tool => tool.function.name), ["rank_sources"]);
  assert.ok(f.prompts[2].tools.some(tool => tool.function.name === "finish_issue_attempt"));
  assert.equal(f.events.filter(event => event.kind === "intent-anchor-automatic-base-read").length, 1);
  const bound = f.events.find(event => event.kind === "intent-anchor-convergence-state" && event.transition === "base-origin-bound");
  assert.equal(bound.origin_bindings.length, 1);
  const terminalIndex = f.events.findIndex(event => event.kind === "terminal-packet"), terminalRequest = f.events.findIndex((event, index) => index > terminalIndex && event.kind === "request-capture");
  assert.ok(terminalIndex >= 0 && terminalRequest > terminalIndex);
  assert.equal(f.result.branches[0].receipt_indices.length, 3, "finish discovery receipt belongs to the branch");
  assert.equal(f.result.branches[0].captures.length, 3, "finish discovery capture belongs to the branch");
});

test("opt-in non-tool stop after convergence still reaches receipt-backed terminal selection", async () => {
  const f = await fixture({sequence: [
    ["rank_sources", {query: "parser trailing commas"}],
    ["rank_sources", {query: "documentation valid configuration"}],
    ["__prose__", {}]
  ], non_tool_terminal_after_convergence: true});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.deepEqual(f.result.exported.prediction.traj_data.pred_files, ["alpha.js"]);
  assert.equal(f.events.filter(event => event.kind === "intent-anchor-converged-non-tool-terminal").length, 1);
  assert.equal(f.events.filter(event => event.kind === "intent-anchor-non-tool-correction").length, 0);
  assert.equal(f.result.branches[0].captures.length, 3);
});

test("opt-in non-tool stop before convergence still requires evidence", async () => {
  const f = await fixture({sequence: [
    ["__prose__", {}],
    ["rank_sources", {query: "parser trailing commas"}],
    ["rank_sources", {query: "documentation valid configuration"}],
    ["finish_issue_attempt", {}]
  ], non_tool_terminal_after_convergence: true});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.events.filter(event => event.kind === "intent-anchor-non-tool-correction").length, 1);
  assert.equal(f.events.filter(event => event.kind === "intent-anchor-converged-non-tool-terminal").length, 0);
});

test("shared reliability corrects one receipt-bound output-cap failure without discarding its cost", async () => {
  const f = await fixture({output_cap_correction: true, truncateAt: 0});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.calls, 5);
  assert.equal(f.events.filter(event => event.kind === "intent-anchor-output-cap-correction").length, 1);
  assert.ok(f.prompts[1].messages.some(message => message.role === "system" && message.content.includes("fixed output-token cap")));
  assert.equal(f.result.receipts.filter(receipt => receipt.kind === "model" && receipt.finish_reason === "length").length, 1);
});

test("shared reliability bounds two consecutive output-cap corrections and retains both failed receipts", async () => {
  const f = await fixture({output_cap_correction: true, truncateAt: [0, 1]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.calls, 6);
  assert.deepEqual(f.events.filter(event => event.kind === "intent-anchor-output-cap-correction").map(event => [event.correction, event.maximum]), [[1, 2], [2, 2]]);
  assert.ok(f.prompts[2].messages.some(message => message.role === "system" && message.content.includes("Two responses hit")));
  assert.equal(f.result.receipts.filter(receipt => receipt.kind === "model" && receipt.finish_reason === "length").length, 2);
});

test("shared reliability stops after a third consecutive output-cap failure without hiding cost", async () => {
  const f = await fixture({output_cap_correction: true, truncateAt: [0, 1, 2]});
  assert.equal(f.result.status, "run_error");
  assert.equal(f.result.error, "glm.incomplete-output");
  assert.equal(f.calls, 3);
  assert.equal(f.events.filter(event => event.kind === "intent-anchor-output-cap-correction").length, 2);
  assert.equal(f.result.receipts.filter(receipt => receipt.kind === "model" && receipt.finish_reason === "length").length, 3);
});

test("opt-in neighborhood read is delivered in a measured request and can be selected by receipt-backed handle", async () => {
  const f = await fixture({sourcePath: "src/alpha.js", source_neighborhood: true, sequence: [
    ["rank_sources", {query: "parser trailing commas"}],
    ["rank_sources", {query: "documentation valid configuration"}],
    ["read_file", {path: "src/alpha.js", revision: "base", start_line: 50, line_count: 1}],
    ["finish_issue_attempt", {}]
  ]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.result.arm, "intent-anchor-source-neighborhood-r1");
  const acquired = f.events.filter(event => event.kind === "source-neighborhood-acquisition");
  assert.equal(acquired.length, 1);
  assert.deepEqual([acquired[0].output.output.start_line, acquired[0].output.output.end_line], [34, 66]);
  const terminal = f.events.find(event => event.kind === "terminal-packet");
  assert.equal(terminal.neighborhood.delivered_read_ids.length, 1);
  assert.ok(terminal.packet.private.bindings.some(binding => binding.read_id === terminal.neighborhood.delivered_read_ids[0]));
  assert.ok(f.prompts.some(prompt => prompt.messages.some(message => message.role === "tool" && message.content.includes("line_50"))));
  assert.deepEqual(f.result.exported.prediction.traj_data.pred_spans["src/alpha.js"], [{start: 34, end: 66}]);
  assert.ok(f.events.filter(event => event.kind === "request-capture").every(event => event.capture.prompt_sha256));
});

test("opt-in search follow-through reads a source hit and delivers its receipt-backed selection", async () => {
  const f = await fixture({sourcePath: "src/component/alpha.js", search_followthrough: true, sequence: [
    ["rank_sources", {query: "parser trailing commas"}],
    ["rank_sources", {query: "documentation valid configuration"}],
    ["search", {query: "dictLimit", path_prefix: "src/component", revision: "base", offset: 0, limit: 20}],
    ["finish_issue_attempt", {}]
  ]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.result.arm, "intent-anchor-search-followthrough-r1");
  const acquired = f.events.filter(event => event.kind === "search-followthrough-acquisition");
  assert.equal(acquired.length, 1);
  assert.deepEqual([acquired[0].output.output.start_line, acquired[0].output.output.end_line], [34, 66]);
  const terminal = f.events.find(event => event.kind === "terminal-packet");
  assert.equal(terminal.neighborhood.delivered_read_ids.length, 1);
  assert.ok(f.prompts.some(prompt => prompt.messages.some(message => message.role === "tool" && message.content.includes("dictLimit"))));
  assert.deepEqual(f.result.exported.prediction.traj_data.pred_spans["src/component/alpha.js"], [{start: 34, end: 66}]);
});

test("opt-in objective search follows task term and exports only the delivered source range", async () => {
  const f = await fixture({sourcePath: "src/component/alpha.js", objective_search: true, sequence: [
    ["rank_sources", {query: "parser trailing commas"}],
    ["rank_sources", {query: "documentation valid configuration"}],
    ["search", {query: "parser", path_prefix: "src/component", revision: "base", offset: 0, limit: 20}],
    ["finish_issue_attempt", {}]
  ]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.result.arm, "intent-anchor-objective-search-r1");
  const acquired = f.events.filter(event => event.kind === "objective-search-acquisition");
  assert.equal(acquired.length, 1);
  assert.deepEqual([acquired[0].output.output.start_line, acquired[0].output.output.end_line], [34, 66]);
  const terminal = f.events.find(event => event.kind === "terminal-packet");
  assert.equal(terminal.neighborhood.delivered_read_ids.length, 1);
  assert.deepEqual(f.result.exported.prediction.traj_data.pred_spans["src/component/alpha.js"], [{start: 34, end: 66}]);
});

test("opt-in API search delivers a task-grounded source range from a one-segment prefix", async () => {
  const f = await fixture({sourcePath: "src/component/alpha.js", api_search: true, sequence: [
    ["rank_sources", {query: "parser trailing commas"}],
    ["rank_sources", {query: "documentation valid configuration"}],
    ["search", {query: "parser", path_prefix: "src", revision: "base", offset: 0, limit: 20}],
    ["finish_issue_attempt", {}]
  ]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.result.arm, "intent-anchor-api-search-r1");
  assert.equal(f.events.filter(event => event.kind === "api-search-acquisition").length, 1);
  const terminal = f.events.find(event => event.kind === "terminal-packet");
  assert.equal(terminal.neighborhood.delivered_read_ids.length, 1);
  assert.deepEqual(f.result.exported.prediction.traj_data.pred_spans["src/component/alpha.js"], [{start: 34, end: 66}]);
});

test("API search r2 delivers a compound-identifier neighborhood under pkg", async () => {
  const f = await fixture({sourcePath: "pkg/cmd/secret/set/http.js", taskObjective: "Use the correct public key for environment secrets.", api_search: "r2", sequence: [
    ["rank_sources", {query: "correct public key"}],
    ["rank_sources", {query: "environment secrets"}],
    ["search", {query: "PublicKey", path_prefix: "pkg/cmd/secret", revision: "base", offset: 0, limit: 20}],
    ["finish_issue_attempt", {}]
  ]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.result.arm, "intent-anchor-api-search-r2");
  assert.equal(f.events.filter(event => event.kind === "api-search-acquisition").length, 1);
  assert.equal(f.events.find(event => event.kind === "terminal-packet").neighborhood.delivered_read_ids.length, 1);
  assert.deepEqual(f.result.exported.prediction.traj_data.pred_spans["pkg/cmd/secret/set/http.js"], [{start: 34, end: 66}]);
});

test("API search r3 pages past a test filename and delivers a distinct implementation read", async () => {
  const f = await fixture({sourcePath: "internal/config/config_type.js", extraFiles: [{path: "internal/config/config_file.test.js", text: "export const parser = true;\n"}], api_search: "r3", sequence: [
    ["rank_sources", {query: "parser trailing commas"}],
    ["rank_sources", {query: "documentation valid configuration"}],
    ["search", {query: "parser", path_prefix: "internal/config", revision: "base", offset: 0, limit: 1}],
    ["finish_issue_attempt", {}]
  ]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.result.arm, "intent-anchor-api-search-r3");
  assert.equal(f.events.filter(event => event.kind === "api-search-page").length, 1);
  const acquired = f.events.filter(event => event.kind === "api-search-acquisition");
  assert.deepEqual(acquired.map(event => event.call.function.name), ["read_file"]);
  assert.equal(JSON.parse(acquired[0].call.function.arguments).path, "internal/config/config_type.js");
  assert.equal(f.events.find(event => event.kind === "terminal-packet").neighborhood.delivered_read_ids.length, 1);
});

test("terminal shortlist offers delivered wide source reads while excluding test-file ranges", async () => {
  const testText = Array.from({length: 50}, (_, index) => `export const parserTest_${index} = true;`).join("\n") + "\n";
  const f = await fixture({sourcePath: "src/component/alpha.js", extraFiles: [{path: "src/component/alpha.test.js", text: testText}], terminal_shortlist: true, sequence: [
    ["rank_sources", {query: "parser trailing commas"}],
    ["rank_sources", {query: "documentation valid configuration"}],
    ["read_file", {path: "src/component/alpha.test.js", revision: "base", start_line: 1, line_count: 40}],
    ["read_file", {path: "src/component/alpha.js", revision: "base", start_line: 1, line_count: 40}],
    ["finish_issue_attempt", {}]
  ]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.result.arm, "intent-anchor-terminal-shortlist-r1");
  const packet = f.events.find(event => event.kind === "terminal-packet");
  assert.deepEqual(packet.packet.private.bindings.map(binding => binding.path), ["src/component/alpha.js"]);
  assert.deepEqual(f.result.exported.prediction.traj_data.pred_spans["src/component/alpha.js"], [{start: 1, end: 40}]);
});

test("cap-12 shortlist stops discovery at twelve model calls and still selects receipt-bound source", async () => {
  const reads = Array.from({length: 16}, () => ["read_file", {path: "src/component/alpha.js", revision: "base", start_line: 1, line_count: 40}]);
  const f = await fixture({sourcePath: "src/component/alpha.js", terminal_shortlist: true, discovery_call_cap: 12, sequence: [
    ["rank_sources", {query: "parser trailing commas"}],
    ["rank_sources", {query: "documentation valid configuration"}],
    ...reads
  ]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.result.arm, "intent-anchor-terminal-shortlist-cap12-r1");
  assert.equal(f.result.branches[0].receipt_indices.length, 12);
  assert.equal(f.result.receipts.filter(receipt => receipt.kind === "model").length, 13);
  assert.deepEqual(f.result.exported.prediction.traj_data.pred_spans["src/component/alpha.js"], [{start: 1, end: 40}]);
});

test("adaptive shortlist stops at twelve only after four delivered wide source ranges", async () => {
  const positions = [1, 21, 41, 61, 1, 21, 41, 61, 1, 21, 41, 61, 1];
  const f = await fixture({sourcePath: "src/component/alpha.js", terminal_shortlist: true, adaptive_shortlist: true, discovery_call_cap: 24, sequence: [
    ["rank_sources", {query: "parser trailing commas"}], ["rank_sources", {query: "documentation valid configuration"}],
    ...positions.map(start_line => ["read_file", {path: "src/component/alpha.js", revision: "base", start_line, line_count: 30}])
  ]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.result.arm, "intent-anchor-terminal-shortlist-adaptive-r1");
  assert.equal(f.result.branches[0].receipt_indices.length, 12);
  assert.ok(f.events.some(event => event.kind === "adaptive-shortlist-stop-check" && event.stop === true && event.delivered_wide_ranges >= 4));
});

test("adaptive shortlist continues sparse evidence to its 24-call ceiling", async () => {
  const reads = Array.from({length: 25}, () => ["read_file", {path: "src/component/alpha.js", revision: "base", start_line: 1, line_count: 40}]);
  const f = await fixture({sourcePath: "src/component/alpha.js", terminal_shortlist: true, adaptive_shortlist: true, discovery_call_cap: 24, sequence: [
    ["rank_sources", {query: "parser trailing commas"}], ["rank_sources", {query: "documentation valid configuration"}], ...reads
  ]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.result.arm, "intent-anchor-terminal-shortlist-adaptive-r1");
  assert.equal(f.result.branches[0].receipt_indices.length, 24);
  assert.equal(f.result.receipts.filter(receipt => receipt.kind === "model").length, 25);
  assert.ok(f.events.some(event => event.kind === "adaptive-shortlist-stop-check" && event.stop === false));
});

test("module manifest stop evidence requires both a module-rename objective and a wide root go.mod read", () => {
  const read = {path: "go.mod", start_line: 1, end_line: 40};
  assert.equal(hasModuleManifestStopEvidence('Rename the module to "github.com/cli/cli/v2"', [read]), true);
  assert.equal(hasModuleManifestStopEvidence("Fix CLI browse command", [read]), false);
  assert.equal(hasModuleManifestStopEvidence('Rename the module to ""', [read]), false);
  assert.equal(hasModuleManifestStopEvidence("Rename the module to github.com/cli/cli/v2", [{...read, path: "src/go.mod"}]), false);
  assert.equal(hasModuleManifestStopEvidence("Rename the module to github.com/cli/cli/v2", [{...read, end_line: 7}]), false);
});

test("adaptive shortlist stops a sparse Go module rename at the first check", async () => {
  const reads = Array.from({length: 25}, () => ["read_file", {path: "go.mod", revision: "base", start_line: 1, line_count: 40}]);
  const f = await fixture({sourcePath: "go.mod", taskObjective: 'Rename the module to "github.com/cli/cli/v2". Documentation describes valid configuration.', terminal_shortlist: true, adaptive_shortlist: true, discovery_call_cap: 24,
    sequence: [["rank_sources", {query: "rename module"}], ["rank_sources", {query: "documentation valid configuration"}], ...reads]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.result.branches[0].receipt_indices.length, 12);
  assert.ok(f.events.some(event => event.kind === "adaptive-shortlist-stop-check" && event.stop === true && event.module_manifest_evidence === true && event.delivered_wide_ranges < 4));
  assert.deepEqual(f.result.exported.prediction.traj_data.pred_files, ["go.mod"]);
});

test("objective shortlist prioritizes a substantive source hint before early finish", async () => {
  const source = "pkg/cmd/gpg-key/add.go", substantive = "pkg/cmd/codespace/rebuild.go";
  const text = Array.from({length: 100}, (_, index) => `export const line_${index + 1} = ${index + 1};`).join("\n") + "\n";
  const f = await fixture({sourcePath: source, extraFiles: [{path: substantive, text}], hintPathForQuery: query => query.includes("codespace") ? substantive : source,
    taskObjective: "Add cs rebuild command\n\n<!-- Thank you for contributing! -->\n\nFixes #6380\n\nAdds a new codespace rebuild command that rebuilds a codespace.",
    terminal_shortlist: true, adaptive_shortlist: true, objective_anchor_gate: true, discovery_call_cap: 24,
    sequence: [["rank_sources", {query: "add rebuild command"}], ["rank_sources", {query: "codespace rebuild"}], ["finish_issue_attempt", {}]]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.result.arm, "intent-anchor-terminal-shortlist-objective-r1");
  assert.equal(f.events.find(event => event.kind === "intent-anchor-automatic-base-read")?.call?.function?.arguments.includes(substantive), true);
  assert.deepEqual(f.result.exported.prediction.traj_data.pred_files, [substantive]);
});

test("distinctive acquisition delivers a source read discovered through tests and code-style spelling", async () => {
  const statement = "fix: improve parsing of `:nth-of-type(xn+b)`\n\nThis change improves CSS nth-of-type parsing.";
  const implementation = "packages/svelte/src/compiler/phases/1-parse/read/style.js";
  const source = Array.from({length: 80}, (_, index) => `export const ${index === 30 ? "Nth" : `line_${index}`} = ${index};`).join("\n") + "\n";
  const f = await fixture({sourcePath: "docs/style.js", taskObjective: statement, terminal_shortlist: true, adaptive_shortlist: true, objective_anchor_gate: true, distinctive_acquisition: true, discovery_call_cap: 24,
    extraFiles: [{path: "packages/svelte/tests/parser-modern/samples/css-nth-syntax/input.svelte", text: ":nth-of-type(xn+b)"}, {path: implementation, text: source}],
    sequence: [["rank_sources", {query: "fix improve parsing"}], ["rank_sources", {query: "css nth type"}], ["read_file", {path: "docs/style.js", revision: "base", start_line: 1, line_count: 1}], ["read_file", {path: "docs/style.js", revision: "base", start_line: 2, line_count: 1}], ["finish_issue_attempt", {}]]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.result.arm, "intent-anchor-terminal-shortlist-distinctive-r1");
  assert.ok(f.events.some(event => event.kind === "distinctive-source-search" && event.args.query === "Nth" && event.args.path_prefix === "packages/svelte/src"));
  const read = f.events.find(event => event.kind === "distinctive-source-acquisition" && JSON.parse(event.call.function.arguments).path === implementation);
  assert.ok(read?.output?.ok);
  assert.ok(f.events.some(event => event.kind === "neighborhood-view-admission" && event.delivered_read_ids.includes(read.output.output.read_id)));
  assert.ok(f.result.source_shortlist?.eligible_read_ids?.includes(read.output.output.read_id));
});

test("distinctive acquisition delivers a receipt-backed Java source read", async () => {
  const implementation = "packages/example/src/main/java/example/NthParser.java";
  const source = Array.from({length: 80}, (_, index) => `class NthParser { int Nth${index} = ${index}; }`).join("\n") + "\n";
  const f = await fixture({sourcePath: "docs/style.js", taskObjective: "fix: improve parsing of `:nth-of-type(xn+b)`\n\nThis changes Java nth-of-type parsing.",
    terminal_shortlist: true, adaptive_shortlist: true, objective_anchor_gate: true, distinctive_acquisition: true, discovery_call_cap: 24,
    extraFiles: [{path: "packages/example/tests/parser/input.txt", text: ":nth-of-type(xn+b)"}, {path: implementation, text: source}],
    sequence: [["rank_sources", {query: "fix improve parsing"}], ["rank_sources", {query: "css nth type"}],
      ["read_file", {path: "docs/style.js", revision: "base", start_line: 1, line_count: 1}],
      ["read_file", {path: "docs/style.js", revision: "base", start_line: 2, line_count: 1}], ["finish_issue_attempt", {}]]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  const read = f.events.find(event => event.kind === "distinctive-source-acquisition" && JSON.parse(event.call.function.arguments).path === implementation);
  assert.ok(read?.output?.ok);
  assert.ok(f.events.some(event => event.kind === "neighborhood-view-admission" && event.delivered_read_ids.includes(read.output.output.read_id)));
  assert.ok(f.result.source_shortlist?.eligible_read_ids?.includes(read.output.output.read_id));
});

test("distinctive arm can finish from delivered source when the substantive-hint base read is unavailable", async () => {
  const statement = "fix: improve parsing of `:nth-of-type(xn+b)`\n\nThis change improves CSS nth-of-type parsing.";
  const implementation = "packages/svelte/src/compiler/phases/1-parse/read/style.js";
  const source = Array.from({length: 80}, (_, index) => `export const ${index === 30 ? "Nth" : `line_${index}`} = ${index};`).join("\n") + "\n";
  const f = await fixture({sourcePath: "docs/style.js", failReadPath: "docs/style.js", taskObjective: statement, terminal_shortlist: true, adaptive_shortlist: true, objective_anchor_gate: true, distinctive_acquisition: true, discovery_call_cap: 24,
    extraFiles: [{path: "packages/svelte/tests/parser-modern/samples/css-nth-syntax/input.svelte", text: ":nth-of-type(xn+b)"}, {path: implementation, text: source}],
    sequence: [["rank_sources", {query: "fix improve parsing"}], ["rank_sources", {query: "css nth type"}], ["read_file", {path: "docs/style.js", revision: "base", start_line: 1, line_count: 1}], ["read_file", {path: "docs/style.js", revision: "base", start_line: 2, line_count: 1}], ["finish_issue_attempt", {}], ["finish_issue_attempt", {}]]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.ok(f.events.some(event => event.kind === "distinctive-source-acquisition" && JSON.parse(event.call.function.arguments).path === implementation));
  assert.ok(f.prompts.at(-2).tools.some(tool => tool.function.name === "finish_issue_attempt"));
});

test("distinctive early arm stops as soon as four wide source ranges are receipt-delivered after call six", async () => {
  const positions = [1, 21, 41, 61, 1, 21, 41, 61, 1, 21, 41, 61];
  const f = await fixture({sourcePath: "src/component/alpha.js", terminal_shortlist: true, adaptive_shortlist: true, objective_anchor_gate: true, distinctive_acquisition: true, early_evidence_stop: true, discovery_call_cap: 24,
    sequence: [["rank_sources", {query: "parser trailing commas"}], ["rank_sources", {query: "documentation valid configuration"}],
      ...positions.map(start_line => ["read_file", {path: "src/component/alpha.js", revision: "base", start_line, line_count: 30}])]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.result.arm, "intent-anchor-terminal-shortlist-distinctive-early-r1");
  assert.ok(f.result.branches[0].captures.length < 12);
  assert.ok(f.events.some(event => event.kind === "adaptive-shortlist-stop-check" && event.stop === true && event.first_check_model_calls === 6 && event.delivered_wide_ranges >= 4));
});

test("distinctive early arm preserves the 24-call cap when source evidence stays sparse", async () => {
  const reads = Array.from({length: 25}, () => ["read_file", {path: "src/component/alpha.js", revision: "base", start_line: 1, line_count: 40}]);
  const f = await fixture({sourcePath: "src/component/alpha.js", terminal_shortlist: true, adaptive_shortlist: true, objective_anchor_gate: true, distinctive_acquisition: true, early_evidence_stop: true, discovery_call_cap: 24,
    sequence: [["rank_sources", {query: "parser trailing commas"}], ["rank_sources", {query: "documentation valid configuration"}], ...reads]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.result.branches[0].captures.length, 24);
  assert.ok(f.events.some(event => event.kind === "adaptive-shortlist-stop-check" && event.first_check_model_calls === 6 && event.stop === false));
});

test("conditional stop checks early when no runtime acquisition was needed", async () => {
  const positions = [1, 21, 41, 61, 1, 21, 41, 61, 1, 21, 41, 61];
  const f = await fixture({sourcePath: "src/component/alpha.js", terminal_shortlist: true, adaptive_shortlist: true, objective_anchor_gate: true, distinctive_acquisition: true, conditional_evidence_stop: true, discovery_call_cap: 24,
    sequence: [["rank_sources", {query: "parser trailing commas"}], ["rank_sources", {query: "documentation valid configuration"}],
      ...positions.map(start_line => ["read_file", {path: "src/component/alpha.js", revision: "base", start_line, line_count: 30}])]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.result.arm, "intent-anchor-terminal-shortlist-distinctive-conditional-r1");
  assert.ok(f.result.branches[0].captures.length < 12);
  assert.ok(f.events.some(event => event.kind === "adaptive-shortlist-stop-check" && event.stop === true && event.first_check_model_calls === 6 && event.distinctive_acquisition_at === null));
});

test("conditional stop reserves follow-up calls after runtime acquisition", async () => {
  const statement = "fix: improve parsing of `:nth-of-type(xn+b)`\n\nThis change improves CSS nth-of-type parsing.";
  const implementation = "packages/svelte/src/compiler/phases/1-parse/read/style.js";
  const source = Array.from({length: 100}, (_, index) => `export const ${index === 30 ? "Nth" : `line_${index}`} = ${index};`).join("\n") + "\n";
  const reads = Array.from({length: 25}, (_, index) => ["read_file", {path: implementation, revision: "base", start_line: [1, 21, 41, 61][index % 4], line_count: 30}]);
  const f = await fixture({sourcePath: "docs/style.js", taskObjective: statement, terminal_shortlist: true, adaptive_shortlist: true, objective_anchor_gate: true, distinctive_acquisition: true, conditional_evidence_stop: true, discovery_call_cap: 24,
    extraFiles: [{path: "packages/svelte/tests/parser-modern/samples/css-nth-syntax/input.svelte", text: ":nth-of-type(xn+b)"}, {path: implementation, text: source}],
    sequence: [["rank_sources", {query: "fix improve parsing"}], ["rank_sources", {query: "css nth type"}], ["read_file", {path: "docs/style.js", revision: "base", start_line: 1, line_count: 1}], ["read_file", {path: "docs/style.js", revision: "base", start_line: 2, line_count: 1}], ...reads]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  const checks = f.events.filter(event => event.kind === "adaptive-shortlist-stop-check");
  assert.ok(checks.length > 0);
  assert.equal(checks[0].first_check_model_calls, 12);
  assert.equal(checks[0].distinctive_acquisition_at, 4);
  assert.ok(checks[0].model_calls >= 12);
});

test("identifier arm acquires an acronym-matched core source before site source", async () => {
  const statement = "SVG elements in <slot> not rendered as SVG elements\n\nSVG elements inside slot should render.";
  const core = "src/compiler/compile/nodes/Element.ts";
  const source = Array.from({length: 80}, (_, index) => `export const ${index === 30 ? "SVG" : `line_${index}`} = ${index};`).join("\n") + "\n";
  const f = await fixture({sourcePath: "docs/style.js", taskObjective: statement, terminal_shortlist: true, adaptive_shortlist: true, objective_anchor_gate: true, distinctive_acquisition: true, objective_identifier_search: true, discovery_call_cap: 24,
    extraFiles: [{path: "site/src/routes/example.ts", text: source}, {path: core, text: source}, {path: "src/runtime/internal/dom.ts", text: source}],
    sequence: [["rank_sources", {query: "SVG elements"}], ["rank_sources", {query: "slot rendered"}], ["read_file", {path: "docs/style.js", revision: "base", start_line: 1, line_count: 1}], ["read_file", {path: "docs/style.js", revision: "base", start_line: 2, line_count: 1}], ["finish_issue_attempt", {}]]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.result.arm, "intent-anchor-terminal-shortlist-distinctive-identifier-r1");
  assert.equal(f.events.find(event => event.kind === "distinctive-source-plan")?.queries[0], "SVG");
  assert.equal(JSON.parse(f.events.find(event => event.kind === "distinctive-source-acquisition")?.call.function.arguments).path, core);
});

test("uncovered-requirement arm follows rare source term after wide reads and binds delivery", async () => {
  const statement = "Allow custom precision in error reports for floating-point numbers";
  const precisionSource = "include/internal/catch_tostring.cpp";
  const f = await fixture({sourcePath: "src/matchers.cpp", taskObjective: statement, terminal_shortlist: true, adaptive_shortlist: true,
    objective_anchor_gate: true, distinctive_acquisition: true, objective_identifier_search: true, uncovered_requirement_search: true, discovery_call_cap: 24,
    extraFiles: [{path: precisionSource, text: Array.from({length: 100}, (_, i) => i === 70 ? "int precision = 6;" : `int line_${i} = ${i};`).join("\n") + "\n"},
      {path: "src/custom.cpp", text: Array.from({length: 30}, (_, i) => `int custom_${i} = ${i};`).join("\n") + "\n"},
      {path: "tests/floating.cpp", text: "floating-point case\n"}],
    sequence: [["rank_sources", {query: "custom precision"}], ["rank_sources", {query: "floating point numbers"}],
      ["read_file", {path: "src/matchers.cpp", revision: "base", start_line: 1, line_count: 20}],
      ["read_file", {path: "src/matchers.cpp", revision: "base", start_line: 30, line_count: 20}], ["finish_issue_attempt", {}]]});
  assert.equal(f.result.status, "final_context_selected", `${f.result.error}; calls=${f.calls}; plan=${JSON.stringify(f.events.find(e => e.kind === "distinctive-source-plan"))}; anchors=${JSON.stringify(f.result.convergence_state.anchors)}; queries=${JSON.stringify(f.result.convergence_state.queries)}; acquisitions=${f.events.filter(e => e.kind === "uncovered-requirement-acquisition").map(e => e.query).join(",")}`);
  assert.equal(f.result.arm, "intent-anchor-terminal-shortlist-uncovered-requirement-r1");
  const acquisitions = f.events.filter(event => event.kind === "uncovered-requirement-acquisition");
  assert.equal(acquisitions[0]?.query, "precision");
  assert.equal(JSON.parse(acquisitions[0].call.function.arguments).path, precisionSource);
  assert.ok(f.events.some(event => event.kind === "neighborhood-view-admission" && event.delivered_read_ids.length > 0));
});

test("reasoning-view arm keeps raw reasoning but omits it from archived model-facing views", async () => {
  const statement = "SVG elements in <slot> not rendered as SVG elements\n\nSVG elements inside slot should render.";
  const source = Array.from({length: 80}, (_, index) => `export const ${index === 30 ? "SVG" : `line_${index}`} = ${index};`).join("\n") + "\n";
  const f = await fixture({sourcePath: "docs/style.js", taskObjective: statement, terminal_shortlist: true, adaptive_shortlist: true,
    objective_anchor_gate: true, distinctive_acquisition: true, objective_identifier_search: true,
    omit_reasoning_from_view: true, reasoningContent: "reasoning ".repeat(500), discovery_call_cap: 24,
    extraFiles: [{path: "site/src/routes/example.ts", text: source}, {path: "src/compiler/compile/nodes/Element.ts", text: source}, {path: "src/runtime/internal/dom.ts", text: source}],
    sequence: [["rank_sources", {query: "SVG elements"}], ["rank_sources", {query: "slot rendered"}], ["read_file", {path: "docs/style.js", revision: "base", start_line: 1, line_count: 1}], ["read_file", {path: "docs/style.js", revision: "base", start_line: 2, line_count: 1}], ["finish_issue_attempt", {}]]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.result.arm, "intent-anchor-terminal-shortlist-distinctive-reasoning-view-r1");
  assert.ok(f.events.some(event => event.kind === "frontier-raw-exchange" && event.exchange.assistant.reasoning_content?.length > 1000));
  assert.ok(f.events.filter(event => event.kind === "frontier-stable-view").every(event =>
    !Object.hasOwn(event.messages[0], "reasoning_content")));
});

test("reasoning-fallback arm preserves ordinary historical reasoning when it fits", async () => {
  const statement = "SVG elements in <slot> not rendered as SVG elements\n\nSVG elements inside slot should render.";
  const source = Array.from({length: 80}, (_, index) => `export const ${index === 30 ? "SVG" : `line_${index}`} = ${index};`).join("\n") + "\n";
  const f = await fixture({sourcePath: "docs/style.js", taskObjective: statement, terminal_shortlist: true, adaptive_shortlist: true,
    objective_anchor_gate: true, distinctive_acquisition: true, objective_identifier_search: true,
    omit_reasoning_on_denial: true, reasoningContent: "short reasoning", discovery_call_cap: 24,
    extraFiles: [{path: "site/src/routes/example.ts", text: source}, {path: "src/compiler/compile/nodes/Element.ts", text: source}, {path: "src/runtime/internal/dom.ts", text: source}],
    sequence: [["rank_sources", {query: "SVG elements"}], ["rank_sources", {query: "slot rendered"}], ["read_file", {path: "docs/style.js", revision: "base", start_line: 1, line_count: 1}], ["read_file", {path: "docs/style.js", revision: "base", start_line: 2, line_count: 1}], ["finish_issue_attempt", {}]]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.result.arm, "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1");
  assert.ok(f.events.some(event => event.kind === "frontier-stable-view" && event.reasoning_view_policy === "original" && event.messages[0].reasoning_content === "short reasoning"));
  assert.equal(f.events.some(event => event.kind === "frontier-reasoning-view-fallback"), false);
});

test("premature finish is rejected before terminal construction", async () => {
  const f = await fixture({sequence: Array.from({length: 9}, () => ["finish_issue_attempt", {}])});
  assert.equal(f.result.status, "run_error");
  assert.match(f.result.error, /premature-finish/);
  assert.equal(f.events.filter(event => event.kind === "premature-finish-correction").length, 8);
  assert.equal(f.events.some(event => event.kind === "terminal-packet"), false);
  assert.equal(f.prompts[0].tools.some(tool => tool.function.name === "finish_issue_attempt"), false);
});

test("prose-only model response receives a bounded staged-tool correction", async () => {
  const f = await fixture({sequence: [["__prose__", {}], ["rank_sources", {query: "parser trailing commas"}], ["rank_sources", {query: "documentation valid configuration"}], ["finish_issue_attempt", {}]]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.events.filter(event => event.kind === "intent-anchor-non-tool-correction").length, 1);
  assert.match(f.prompts[1].messages.find(message => message.content?.startsWith("Correction 1:"))?.content ?? "", /Respond only by calling/);
});

test("malformed tool arguments reject the full batch without effects and allow a valid retry", async () => {
  const f = await fixture({sequence: [
    ["rank_sources", {query: "parser trailing commas"}],
    ["rank_sources", {query: "documentation valid configuration"}],
    ["__malformed_apply_edits__", {}],
    ["finish_issue_attempt", {}]
  ], reasoningContent: "receipt-bound private reasoning"});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  const corrections = f.events.filter(event => event.kind === "intent-anchor-tool-argument-correction");
  assert.equal(corrections.length, 1);
  assert.equal(corrections[0].original_assistant.reasoning_content, "receipt-bound private reasoning");
  assert.equal(corrections[0].reasoning_view, "omitted-after-runtime-rewrite");
  assert.notEqual(corrections[0].original_assistant_sha256, corrections[0].corrected_assistant_sha256);
  const corrected = f.events.find(event => event.kind === "frontier-raw-exchange" && event.exchange.assistant.content?.startsWith("Runtime correction:"));
  assert.ok(corrected);
  assert.equal(Object.hasOwn(corrected.exchange.assistant, "reasoning_content"), false);
  const originalReceipt = {kind: "model", status: 200, output_tokens: 5, reasoning_tokens: 5,
    retained_reasoning: {message_sha256: hash(stable(corrections[0].original_assistant)), token_reservation: 5}};
  assert.equal(retainedReasoning([corrections[0].original_assistant], [originalReceipt]).tokens, 5);
  assert.equal(retainedReasoning([corrected.exchange.assistant], [originalReceipt]).tokens, 0);
  assert.equal(f.events.some(event => event.kind === "source-tool-result" && event.call.function.name === "apply_edits"), false);
  assert.ok(f.prompts.some(prompt => prompt.messages.some(message => message.role === "system" && message.content.includes("Tool-argument correction 1"))));
});

test("source-index query failure is a no-effect tool result and later evidence can converge", async () => {
  const f = await fixture({failHintAt: 2});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.events.filter(event => event.kind === "intent-anchor-source-index-failure").length, 1);
});

test("unsuccessful automatic base reads never confirm convergence", async () => {
  const prefix = [["rank_sources", {query: "parser trailing commas"}], ["rank_sources", {query: "documentation valid configuration"}]];
  const failed = await fixture({sequence: prefix, failRead: true});
  assert.equal(failed.result.status, "run_error"); assert.equal(failed.result.convergence_state.confirmed_base_reads.length, 0); assert.equal(failed.result.origin_bindings.length, 0);
  assert.match(failed.result.error, /automatic-base-read-exhausted/);
});

test("repeated exact base read retains the first native origin binding only", async () => {
  const f = await fixture({sequence: [
    ["rank_sources", {query: "parser trailing commas"}], ["rank_sources", {query: "documentation valid configuration"}],
    ["read_file", {path: "alpha.js", revision: "base", start_line: 1, line_count: 1}],
    ["finish_issue_attempt", {}]
  ]});
  assert.equal(f.result.status, "final_context_selected", f.result.error);
  assert.equal(f.result.origin_bindings.length, 1);
  const bound = f.events.find(event => event.kind === "intent-anchor-convergence-state" && event.transition === "base-origin-bound"), duplicate = f.events.find(event => event.kind === "intent-anchor-convergence-state" && event.transition === "duplicate-base-origin-ignored");
  assert.equal(duplicate.origin_bindings.length, 1);
  assert.equal(duplicate.origin_bindings[0].native_read_id, bound.origin_bindings[0].native_read_id);
});

test("persistence failures stop before the next effect and do not promote unpersisted state", async () => {
  const init = await fixture({failTransition: "initialized"});
  assert.equal(init.result.status, "run_error"); assert.equal(init.calls, 0);
  const base = await fixture({failTransition: "base-origin-bound"});
  assert.equal(base.result.status, "run_error"); assert.equal(base.calls, 2);
  assert.equal(base.result.convergence_state.confirmed_base_reads.length, 0); assert.equal(base.result.origin_bindings.length, 0);
  const terminal = await fixture({failTransition: "terminal-packet"});
  assert.equal(terminal.result.status, "run_error"); assert.equal(terminal.calls, 3);
  assert.equal(terminal.events.some(event => event.kind === "terminal-packet"), false);
  assert.equal(terminal.result.exported, undefined);
});
