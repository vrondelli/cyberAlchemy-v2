import test from "node:test";
import assert from "node:assert/strict";
import {createHookEventSession} from "../src/hook-event-session.mjs";
import {checkoutRoot} from "../src/prompt-hook.mjs";
import {decide} from "../src/decision-cli.mjs";

const common = {session_id: "session-a", turn_id: "turn-a", cwd: checkoutRoot};
const prompt = extra => ({...common, hook_event_name: "UserPromptSubmit", prompt: "Explain the repository routing architecture", ...extra});
const tool = extra => ({...common, hook_event_name: "PreToolUse", tool_name: "Bash", tool_use_id: "tool-a", tool_input: {command: "printf fixture"}, ...extra});
const stop = extra => ({...common, hook_event_name: "Stop", stop_hook_active: false, last_assistant_message: "fixture complete", ...extra});
const done = (status = "completed", session = "session-a", turn = "turn-a") => ({method: "turn/completed", params: {threadId: session, turn: {id: turn, status, items: []}}});

test("tool and terminal evidence share the originating prompt binding", () => {
  const session = createHookEventSession(); const binding = session.observe(prompt());
  const effect = session.observe(tool());
  assert.equal(effect.kind, "gate");
  assert.equal(effect.binding_digest, binding.binding_digest);
  assert.equal(effect.stdout.hookSpecificOutput.permissionDecision, undefined);
  const observedStop = session.observe(stop());
  assert.equal(observedStop.kind, "observed");
  assert.equal(observedStop.completion_scope, "none-await-native-terminal");
  const completion = session.observe(done());
  assert.equal(completion.kind, "complete");
  assert.equal(completion.binding_digest, binding.binding_digest);
  assert.equal(completion.completion_scope, "native-turn-only");
});

test("events cannot attach to an absent or different session or turn", () => {
  const session = createHookEventSession();
  assert.equal(session.observe(tool()).ok, false);
  session.observe(prompt());
  assert.equal(session.observe(tool({session_id: "other"})).ok, false);
  assert.equal(session.observe(tool({turn_id: "other"})).ok, false);
  assert.equal(session.observe(tool({cwd: "/tmp"})).ok, false);
  assert.equal(session.observe(done("completed", "other")).ok, false);
});

test("interleaved sessions and turns retain separate bindings", () => {
  const session = createHookEventSession();
  const a = session.observe(prompt());
  const b = session.observe(prompt({session_id: "b"}));
  assert.notEqual(a.binding_digest, b.binding_digest);
  assert.equal(session.observe(tool({session_id: "b"})).binding_digest, b.binding_digest);
  assert.equal(session.observe(tool()).binding_digest, a.binding_digest);
  assert.equal(session.observe(done()).kind, "complete");
  assert.equal(session.observe(done("completed", "b")).binding_digest, b.binding_digest);
});

test("exact retries replay, changed prompts invalidate the turn", () => {
  const session = createHookEventSession(); session.observe(prompt());
  assert.equal(session.observe(prompt()).replayed, true);
  session.observe(tool()); assert.equal(session.observe(tool()).replayed, true);
  assert.equal(session.observe(prompt({prompt: "Implement a different objective"})).ok, false);
  assert.equal(session.observe(tool({tool_use_id: "another"})).reason_codes[0], "events.turn-invalidated");
  assert.equal(session.observe(done()).ok, false);
});

test("changed arguments under a tool ID invalidate later completion", () => {
  const session = createHookEventSession(); session.observe(prompt()); session.observe(tool());
  assert.equal(session.observe(tool({tool_input: {command: "changed"}})).reason_codes[0], "events.tool-revision-conflict");
  assert.equal(session.observe(done()).ok, false);
});

test("Stop cannot certify completion and may precede more tools", () => {
  const calls = [];
  const session = createHookEventSession({decide: (operation, input) => {calls.push(operation);return decide(operation,input);}});
  session.observe(prompt());session.observe(stop());
  assert.equal(calls.includes("continue"), false);
  assert.equal(session.observe(tool()).kind, "gate");
  assert.equal(session.observe(stop()).replayed, true);
  assert.equal(session.observe(done()).kind, "complete");
  assert.equal(calls.includes("continue"), true);
});

test("failed or interrupted native turns never become successful continuation", () => {
  for (const status of ["failed", "interrupted"]) {
    const session=createHookEventSession();session.observe(prompt());session.observe(stop());
    const completion=session.observe(done(status));
    assert.equal(completion.kind,"block");
    assert.equal(session.observe(tool()).ok,false);
  }
});

test("completion retries are historical and conflicting statuses are rejected", () => {
  const session=createHookEventSession();session.observe(prompt());session.observe(done());
  assert.equal(session.observe(done()).replayed,true);
  assert.equal(session.observe(done("failed")).reason_codes[0],"events.completion-conflict");
  assert.equal(session.observe(prompt()).ok,false);
});

test("source failure on a later effect cannot reuse prior eligibility", () => {
  let drift=false;
  const session=createHookEventSession({decide:(operation,input)=>drift?{ok:false,kind:"block",reason_codes:["profile.provenance-drift:fixture"]}:decide(operation,input)});
  session.observe(prompt());session.observe(tool());drift=true;
  const output=session.observe(tool());assert.equal(output.ok,false);assert.equal(output.kind,"block");
  assert.equal(session.observe(done()).kind,"block");
});

test("bounded storage and reset fail explicitly without silent eviction", () => {
  const session=createHookEventSession({max_turns:1,max_tools_per_turn:1});session.observe(prompt());
  assert.equal(session.observe(prompt({turn_id:"other"})).reason_codes[0],"events.turn-limit");
  session.observe(tool());assert.equal(session.observe(tool({tool_use_id:"other"})).reason_codes[0],"events.tool-limit");
  session.clear();assert.equal(session.size(),0);assert.equal(session.observe(done()).ok,false);
});

test("malformed proposals and native nonterminal status are rejected", () => {
  const session=createHookEventSession();session.observe(prompt());
  for(const value of [null,{},tool({tool_use_id:""}),tool({objective_kind:"implement"}),stop({stop_hook_active:"false"}),done("inProgress")]) assert.equal(session.observe(value).ok,false);
});

test("explicit release frees completed bindings without evicting active turns", () => {
  const session = createHookEventSession({max_turns: 1}); session.observe(prompt());
  assert.equal(session.releaseCompleted("session-a", "turn-a"), false);
  session.observe(done());
  assert.equal(session.releaseCompleted("session-a", "turn-a"), true);
  assert.equal(session.observe(done()).ok, false);
  assert.equal(session.observe(prompt({turn_id: "new-turn"})).ok, true);
});

test("malformed steering cannot leave the previous prompt binding usable", () => {
  const session = createHookEventSession(); session.observe(prompt());
  assert.equal(session.observe(prompt({prompt: "changed", unexpected: true})).ok, false);
  assert.equal(session.observe(tool()).reason_codes[0], "events.turn-invalidated");
});
