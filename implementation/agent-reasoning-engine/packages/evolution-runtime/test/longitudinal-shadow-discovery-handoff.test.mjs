import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtempSync, readFileSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawnSync} from "node:child_process";
import test from "node:test";

import {canonicalJson, canonicalizeJson} from "../../intent-route-resolver/index.mjs";

const digest = (value) => createHash("sha256").update(canonicalJson(canonicalizeJson(value))).digest("hex");
const bytesDigest = (value) => createHash("sha256").update(value).digest("hex");

function fixture(root, userText = "Please keep this concise.") {
  const rows = [
    {timestamp: "2026-09-01T00:00:00Z", type: "response_item", payload: {type: "message", role: "user", content: [{type: "input_text", text: userText}]}},
    {timestamp: "2026-09-01T00:00:01Z", type: "response_item", payload: {type: "reasoning", summary: [{text: "never include this"}]}},
    {timestamp: "2026-09-01T00:00:02Z", type: "response_item", payload: {type: "function_call_output", output: "never include this either"}},
    {timestamp: "2026-09-01T00:00:03Z", type: "response_item", payload: {type: "message", role: "assistant", content: [{type: "output_text", text: "Understood."}]}},
  ];
  const source = `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;
  writeFileSync(join(root, "session.jsonl"), source);
  const session = {
    session_ref: "session:test",
    source_id: "test",
    source_locator: "session.jsonl",
    source_sha256: bytesDigest(source),
    first_timestamp: "2026-09-01T00:00:00Z",
    turns: [{turn_ref: "turn:test", sequence: 1, started_at: "2026-09-01T00:00:00Z", completed_at: "2026-09-01T00:00:03Z", user_record_ordinal: 1, assistant_record_ordinal: 4, user_message_digest: digest(userText), assistant_message_digest: digest("Understood."), language_hint: "en", correction_signals: [], sensitive_signal: false}],
  };
  const material = {schema_version: "are.interaction-learning-ingestion/v1", cycle_kind: "interaction-learning", cohort_policy: "test", source_inventory: [], selected_session_count: 1, evaluation_task_count: 1, durable_content_policy: "metadata-digests-and-structural-signals-only", excluded_content: ["message_text"], sessions: [session], authority_effect: "none"};
  const ingestion = {...material, manifest_digest: digest(material)};
  const ingestionPath = join(root, "ingestion.json");
  writeFileSync(ingestionPath, JSON.stringify(ingestion));
  return {ingestionPath, session};
}

function run(root, fixtureValue, outputName = "handoff.json") {
  const request = {schema_version: "are.longitudinal-shadow-discovery-handoff-request/v1", ingestion_path: fixtureValue.ingestionPath, output_path: join(root, outputName), source_roots: {test: root}, session_refs: [fixtureValue.session.session_ref]};
  const result = spawnSync(process.execPath, [new URL("../bin/longitudinal-shadow-discovery-handoff.mjs", import.meta.url).pathname], {input: JSON.stringify(request), encoding: "utf8"});
  return {status: result.status, response: JSON.parse(result.stdout)};
}

test("handoff includes only selected messages and excludes reasoning and tool output", (t) => {
  const root = mkdtempSync(join(tmpdir(), "are-lpc-handoff-test-"));
  t.after(() => import("node:fs").then((fs) => fs.rmSync(root, {recursive: true, force: true})));
  const source = fixture(root);
  const result = run(root, source);
  assert.equal(result.status, 0);
  assert.equal(result.response.turn_count, 1);
  const handoff = readFileSync(join(root, "handoff.json"), "utf8");
  assert.match(handoff, /Please keep this concise/);
  assert.doesNotMatch(handoff, /never include this/);
});

test("sensitive selected messages are omitted instead of entering the handoff", (t) => {
  const root = mkdtempSync(join(tmpdir(), "are-lpc-handoff-test-"));
  t.after(() => import("node:fs").then((fs) => fs.rmSync(root, {recursive: true, force: true})));
  const source = fixture(root, "api_key=example-secret-value");
  const result = run(root, source);
  assert.equal(result.status, 0);
  assert.equal(result.response.sensitive_omission_count, 1);
  const handoff = readFileSync(join(root, "handoff.json"), "utf8");
  assert.doesNotMatch(handoff, /example-secret-value/);
});

test("source drift fails before a handoff is created", (t) => {
  const root = mkdtempSync(join(tmpdir(), "are-lpc-handoff-test-"));
  t.after(() => import("node:fs").then((fs) => fs.rmSync(root, {recursive: true, force: true})));
  const source = fixture(root);
  writeFileSync(join(root, "session.jsonl"), `${readFileSync(join(root, "session.jsonl"), "utf8")}\n`);
  const result = run(root, source);
  assert.equal(result.status, 2);
  assert.deepEqual(result.response.reason_codes, ["longitudinal-shadow-discovery-handoff.session:test:source-drift"]);
});
