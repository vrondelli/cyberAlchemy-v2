import assert from "node:assert/strict";
import test from "node:test";
import {admitToolBatch} from "./ranked-source-hints-admission-r1.mjs";
import {stable} from "../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs";

const digest = "d".repeat(64);
const compact = {archive_sha256: digest, observation_index: 0};
const output = {path: "src/example.ts", start_line: 11, end_line: 12, total_lines: 100,
  utf8: "first\nsecond", source_sha256: "a".repeat(64), source_revision: "base",
  base_commit: "b".repeat(40), byte_count: 12};
const call = args => ({id: "recover-1", type: "function",
  function: {name: "recover_archived_read", arguments: stable(args)}});
const input = (args = compact, result = {ok: true, output, archive_origin: compact}) => ({
  messages: [{role: "system", content: "Test source recovery."}], tools: [],
  assistant: {role: "assistant", tool_calls: [call(args)]}, results: [result],
  archive: async () => {}, limit: 7998});

test("compact archived read admits by origin rather than absent optional range fields", async () => {
  const r = await admitToolBatch({...input(), measure: async () => 7900});
  assert.equal(r.status, "admitted");
  assert.equal(r.outputs[0].output.path, output.path);
  await assert.rejects(admitToolBatch({...input(compact, {ok: true, output,
    archive_origin: {...compact, archive_sha256: "e".repeat(64)}}), measure: async () => 7900}),
  /recovery-origin-binding/);
});

test("full recovery still enforces its explicit range and compact deferral gets a full continuation", async () => {
  const full = {...compact, path: output.path, revision: "base", start_line: 11, line_count: 2};
  assert.equal((await admitToolBatch({...input(full), measure: async () => 7900})).status, "admitted");
  await assert.rejects(admitToolBatch({...input({...full, path: "wrong.ts"}), measure: async () => 7900}),
    /read-binding/);
  let probes = 0;
  const r = await admitToolBatch({...input(), measure: async () => probes++ === 0 ? 8100 : 7900});
  assert.equal(r.status, "admitted");
  assert.equal(r.outputs[0].output.end_line, 11);
  assert.deepEqual(r.outputs[0].deferred.resume.arguments,
    {...compact, path: output.path, revision: "base", start_line: 12, line_count: 1});
  assert.equal(r.outputs[0].deferred.archive_recovery.arguments.start_line, 12);
});
