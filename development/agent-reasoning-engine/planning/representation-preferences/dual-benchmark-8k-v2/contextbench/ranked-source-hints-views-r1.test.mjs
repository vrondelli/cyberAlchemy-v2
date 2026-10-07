import assert from "node:assert/strict";
import test from "node:test";
import {createBoundedExchangeArchive} from "./ranked-source-hints-views-r1.mjs";
import {recoverArchivedRead} from "./bounded-archive-frontier-recovery-r1.mjs";

const exchange = () => ({messages: [{role: "system", content: "Search source."}], tools: [],
  assistant: {role: "assistant", content: "", reasoning_content: "private reasoning ".repeat(400),
    tool_calls: [{id: "search-1", type: "function", function: {name: "search", arguments: JSON.stringify({query: "name", path_prefix: "", offset: 0, limit: 30, revision: "base"})}}]},
  results: [{ok: false, error: "search-empty"}]});

test("opt-in reasoning-free view preserves raw exchange and admits only the compact replay", async () => {
  const events = [], input = exchange();
  const archive = createBoundedExchangeArchive({limit: 2000, omit_reasoning_from_view: true,
    persist: async event => events.push(event), measure: async prompt => prompt.length});
  const admitted = await archive.admit(input);
  assert.equal(admitted.status, "admitted");
  assert.equal(archive.rawExchange(admitted.archive_sha256).assistant.reasoning_content, input.assistant.reasoning_content);
  assert.equal(Object.hasOwn(admitted.view.messages[0], "reasoning_content"), false);
  assert.equal(events.find(event => event.kind === "frontier-raw-exchange").exchange.assistant.reasoning_content, input.assistant.reasoning_content);
  assert.ok(events.filter(event => event.kind === "frontier-projection-attempt").every(event =>
    !Object.hasOwn(JSON.parse(event.prompt).messages.find(message => message.role === "assistant"), "reasoning_content")));
  const replayed = await archive.admit(input);
  assert.equal(replayed.status, "admitted");
  assert.equal(replayed.replayed, true);
});

test("default view retains reasoning and rejects the same oversized exchange", async () => {
  const archive = createBoundedExchangeArchive({limit: 2000, persist: async () => {}, measure: async prompt => prompt.length});
  const denied = await archive.admit(exchange());
  assert.equal(denied.status, "denied");
  assert.equal(denied.reason, "mandatory-request-envelope-does-not-fit");
});

test("fallback view omits reasoning only after the complete original view is denied", async () => {
  const events = [], input = exchange();
  const archive = createBoundedExchangeArchive({limit: 2000, omit_reasoning_on_denial: true,
    persist: async event => events.push(event), measure: async prompt => prompt.length});
  const result = await archive.admit(input);
  assert.equal(result.status, "admitted");
  assert.equal(result.view.reasoning_view_policy, "omitted-after-denial");
  assert.equal(Object.hasOwn(result.view.messages[0], "reasoning_content"), false);
  assert.equal(archive.rawExchange(result.archive_sha256).assistant.reasoning_content, input.assistant.reasoning_content);
  const fallback = events.find(event => event.kind === "frontier-reasoning-view-fallback");
  assert.equal(fallback.original_denial_reason, "mandatory-request-envelope-does-not-fit");
  const projected = events.filter(event => event.kind === "frontier-projection-attempt");
  assert.ok(projected.some(event => JSON.parse(event.prompt).messages.some(message => message.reasoning_content)));
  assert.ok(projected.some(event => JSON.parse(event.prompt).messages.some(message => message.role === "assistant" && !Object.hasOwn(message, "reasoning_content"))));
});

test("fallback policy preserves original reasoning when it fits", async () => {
  const events = [], input = exchange();
  const archive = createBoundedExchangeArchive({limit: 8000, omit_reasoning_on_denial: true,
    persist: async event => events.push(event), measure: async prompt => prompt.length});
  const result = await archive.admit(input);
  assert.equal(result.status, "admitted");
  assert.equal(result.view.reasoning_view_policy, "original");
  assert.equal(result.view.messages[0].reasoning_content, input.assistant.reasoning_content);
  assert.equal(events.some(event => event.kind === "frontier-reasoning-view-fallback"), false);
});

test("reasoning fallback reuses the irreducible output projection within the shared probe cap", async () => {
  const events = [], input = exchange();
  input.assistant.tool_calls = ["a", "b"].map(id => ({id, type: "function", function: {
    name: "read_file", arguments: JSON.stringify({path: "a.py", start_line: 1, line_count: 8, revision: "base"})}}));
  input.results = input.assistant.tool_calls.map(() => ({ok: true, output: {
    path: "a.py", start_line: 1, end_line: 8, total_lines: 8,
    utf8: Array.from({length: 8}, (_, i) => `line ${i} ${"x".repeat(100)}`).join("\n"),
    source_sha256: "a".repeat(64), source_revision: "base", base_commit: "b".repeat(40)}}));
  const archive = createBoundedExchangeArchive({limit: 8000, maximum_probes: 16,
    omit_reasoning_on_denial: true, persist: async event => events.push(event),
    measure: async prompt => JSON.parse(prompt).messages.some(message => message.reasoning_content) ? 9000 : 2000});
  const admitted = await archive.admit(input);
  assert.equal(admitted.status, "admitted");
  assert.equal(admitted.view.reasoning_view_policy, "omitted-after-denial");
  const fallback = events.find(event => event.kind === "frontier-reasoning-view-fallback");
  assert.deepEqual(fallback.original_attempts.at(-1).kept_units, [0, 0]);
  const projections = events.filter(event => event.kind === "frontier-projection-attempt");
  assert.ok(projections.length <= 16);
  const fallbackPrompt = JSON.parse(projections.at(-1).prompt);
  assert.ok(fallbackPrompt.messages.filter(message => message.role === "tool")
    .every(message => JSON.parse(message.content).error === "output-deferred-by-aggregate-request-limit"));
  assert.equal(archive.rawExchange(admitted.archive_sha256).results[0].output.utf8, input.results[0].output.utf8);
});

test("zero-delivery search metadata is compact but every archived observation remains recoverable", async () => {
  const input = exchange(), events = [];
  input.assistant.tool_calls = ["a", "b"].map(id => ({id, type: "function", function: {
    name: "search", arguments: JSON.stringify({query: "match", path_prefix: "", offset: 0, limit: 30, revision: "base"})}}));
  input.results = input.assistant.tool_calls.map(() => ({ok: true, output: {
    observations: Array.from({length: 30}, (_, i) => ({path: `src/file-${i}.py`,
      start_line: 1, end_line: 1, total_lines: 1, utf8: `match ${i} ${"x".repeat(150)}`,
      source_sha256: "a".repeat(64), source_revision: "base", base_commit: "b".repeat(40)})),
    total: 30, next_offset: null, skipped: []}}));
  const archive = createBoundedExchangeArchive({limit: 8000, maximum_probes: 16,
    omit_reasoning_on_denial: true, persist: async event => events.push(event),
    measure: async prompt => JSON.parse(prompt).messages.some(message => message.reasoning_content)
      ? 9000 : Math.ceil(Buffer.byteLength(prompt) / 2)});
  const admitted = await archive.admit(input);
  assert.equal(admitted.status, "admitted");
  assert.ok(admitted.probes <= 16);
  assert.equal(admitted.view.reasoning_view_policy, "omitted-after-denial");
  const deferred = admitted.view.messages.slice(1).map(message => JSON.parse(message.content));
  for (const output of deferred) {
    assert.equal(output.ok, false);
    assert.equal(output.deferred.archive_recovery.observation_index_range[1], 29);
    assert.equal(Object.hasOwn(output.deferred.archive_recovery, "observations"), false);
    const recovered = recoverArchivedRead({archive, args: {
      archive_sha256: output.deferred.archive_sha256, observation_index: 29}});
    assert.equal(recovered.ok, true);
    assert.equal(recovered.output.path, "src/file-29.py");
    assert.equal(recovered.output.utf8, input.results[0].output.observations[29].utf8);
  }
  assert.equal(events.filter(event => event.kind === "frontier-raw-exchange").length, 1);
});
