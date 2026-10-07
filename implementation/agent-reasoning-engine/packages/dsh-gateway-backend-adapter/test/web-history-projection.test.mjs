import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {dirname, join} from "node:path";
import test from "node:test";
import {pathToFileURL} from "node:url";

import {projectDshWebHistoryEvent, projectDshWebHistoryPage,
  projectDshWebHistorySnapshot} from "../src/web-history-projection.mjs";

const require = createRequire(import.meta.url);
const dshRequire = createRequire(require.resolve("@deepseek-ai/dsh/package.json"));
const sessionControllerEntry = dshRequire.resolve("@deepseek-ai/dsh-api-session-controller");
const {assertSessionWireEvent} = await import(pathToFileURL(join(dirname(sessionControllerEntry),
  "types/client/session-wire-event.js")).href);

test("history exports only public text and preserves every durable cursor position", () => {
  const user = {type: "user/message", seq: 1, time: 10, surfaceOp: "append",
    data: {id: "user-1", role: "user", source: {kind: "user", rpcId: "user-rpc-1"},
      content: [{type: "text", text: "hello"}]}};
  const assistant = {type: "assistant/message", seq: 3, time: 12, surfaceOp: "append",
    data: {turn: 1, step: 1, stream: [{private: "stream"}], usage: {private: true},
      message: {id: "assistant-1", role: "assistant",
        source: {kind: "model", provider: "local", model: "test", replayState: "private"},
        content: [{type: "reasoning", text: "private reasoning"},
          {type: "text", text: "visible reply"}]}}};
  const hidden = {type: "request/context", seq: 2, time: 11,
    data: {secret: "private context"}};
  const page = projectDshWebHistoryPage({records: [user, hidden, assistant]
    .map((event) => ({type: "event", event})), hasMore: false});
  assert.deepEqual(page.records.map((record) => record.event.seq), [1, 2, 3]);
  assert.deepEqual(page.records[1].event, {type: "are/redacted", seq: 2,
    time: 11, data: {turn: null}, ignorable: true});
  const encoded = JSON.stringify(page);
  for (const privateText of ["private context", "private reasoning",
    "private", "replayState"]) assert.equal(encoded.includes(privateText), false);
  assert.deepEqual(page.records[2].event.data.stream, []);
  assert.equal(page.records[0].event.data.source.rpcId, "user-rpc-1");
  assert.match(encoded, /visible reply/u);
  assert.match(encoded, /hello/u);
  assert.deepEqual(projectDshWebHistoryEvent({...user, data: {...user.data,
    source: {kind: "plugin", plugin: "system"}}}),
  {type: "are/redacted", seq: 1, time: 10, data: {turn: null}, ignorable: true});
});

test("history snapshot strips workspace, projections, and assistant stream", () => {
  const snapshot = projectDshWebHistorySnapshot({type: "snapshot",
    header: {version: 3, id: "session-1", createdAt: 10, cwd: "/private/workspace",
      isSeeded: false, agentPreset: "private"}, cursor: 4, records: [], hasMore: false,
    projections: {asOfSeq: 4, values: {secret: "private"}},
    assistantStream: {activeAttempt: {stream: ["private"]}},
  }, "session-1");
  assert.deepEqual(snapshot, {type: "snapshot", header: {version: 3,
    id: "session-1", createdAt: 10, isSeeded: false}, cursor: 4, records: [],
  hasMore: false, projections: {asOfSeq: 4,
    values: {modelSelection: {next: null}}}});
  assert.throws(() => projectDshWebHistorySnapshot({...snapshot,
    header: {...snapshot.header, id: "foreign"}}, "session-1"),
  /history-snapshot-invalid/u);
  assert.deepEqual(projectDshWebHistorySnapshot({type: "snapshot",
    header: {version: 3, id: "session-1", createdAt: 10}, cursor: 0,
    records: [], hasMore: false}, "session-1", {assistantStream: true}).assistantStream,
  {revision: 0});
});

test("unknown content cannot become visible through a text-only history page", () => {
  const event = {type: "assistant/message", seq: 0, time: 1, surfaceOp: "append",
    data: {turn: 1, step: 1, message: {id: "assistant-1", role: "assistant",
      source: {kind: "model", provider: "local", model: "test"},
      content: [{type: "tool-call", arguments: "private"}]}}};
  assert.equal(projectDshWebHistoryEvent(event).type, "are/redacted");
  assert.throws(() => projectDshWebHistoryEvent({...event, seq: -1}),
    /history-event-invalid/u);
});

test("malformed public identifiers and turn boundaries remain redacted", () => {
  const assistant = {type: "assistant/message", seq: 1, time: 10,
    surfaceOp: "append", data: {turn: 1, step: 1, message: {
      id: "reply-1", role: "assistant", source: {kind: "model",
        provider: "local", model: "test"}, content: [{type: "text", text: "visible"}]}}};
  const project = (event) => projectDshWebHistoryEvent(event).type;
  assert.equal(project({...assistant, data: {...assistant.data, turn: -1}}), "are/redacted");
  assert.equal(project({...assistant, data: {...assistant.data, step: -1}}), "are/redacted");
  for (const model of ["", "secret\nheader", "m".repeat(257)]) {
    assert.equal(project({...assistant, data: {...assistant.data, message: {
      ...assistant.data.message, source: {...assistant.data.message.source, model}}}}),
    "are/redacted");
  }
  assert.equal(project({...assistant, data: {...assistant.data, message: {
    ...assistant.data.message, source: {...assistant.data.message.source,
      provider: "provider\u0000private"}}}}), "are/redacted");
  assert.equal(project({...assistant, data: {...assistant.data, message: {
    ...assistant.data.message, id: "reply\nprivate"}}}), "are/redacted");
  assert.equal(project({type: "turn/end", seq: 2, time: 11,
    data: {turn: 1, reason: {kind: "unrecognized-private-reason"}}}), "are/redacted");
});

test("pinned DSH client event validator accepts redacted and visible history events", () => {
  const redacted = projectDshWebHistoryEvent({type: "request/context", seq: 0,
    time: 10, data: {secret: "hidden"}});
  const assistant = projectDshWebHistoryEvent({type: "assistant/message", seq: 1,
    time: 11, surfaceOp: "append", data: {turn: 1, step: 1,
      message: {id: "reply-1", role: "assistant", source: {kind: "model",
        provider: "local", model: "test"}, content: [{type: "text", text: "visible"}]}}});
  const opening = projectDshWebHistorySnapshot({type: "snapshot", header: {
    version: 3, id: "session-1", createdAt: 1}, cursor: 0,
  records: [{type: "event", event: redacted}], hasMore: false}, "session-1",
  {assistantStream: true});
  for (const record of opening.records) assert.doesNotThrow(() => assertSessionWireEvent(record.event));
  assert.doesNotThrow(() => assertSessionWireEvent(assistant));
  assert.deepEqual(opening.assistantStream, {revision: 0});
  assert.equal(assistant.data.message.content[0].text, "visible");
});

test("history retains minimal turn boundaries for live DSH assembly without failure details", () => {
  const input = [
    {type: "turn/start", seq: 0, time: 10, data: {turn: 1, private: "secret"}},
    {type: "step/start", seq: 1, time: 11, data: {turn: 1, step: 1, private: "secret"}},
    {type: "step/end", seq: 2, time: 12, data: {turn: 1, step: 1, private: "secret"}},
    {type: "turn/end", seq: 3, time: 13, data: {turn: 1,
      reason: {kind: "error", error: {code: "PRIVATE", message: "secret"}}}},
  ];
  const projected = input.map(projectDshWebHistoryEvent);
  assert.deepEqual(projected.map(event => event.type), input.map(event => event.type));
  assert.deepEqual(projected.map(event => event.data), [{turn: 1}, {turn: 1, step: 1},
    {turn: 1, step: 1}, {turn: 1, reason: {kind: "error",
      error: {code: "ARE_REDACTED", message: "Failure details redacted"}}}]);
  for (const event of projected) assert.doesNotThrow(() => assertSessionWireEvent(event));
  assert.equal(JSON.stringify(projected).includes("secret"), false);
});
