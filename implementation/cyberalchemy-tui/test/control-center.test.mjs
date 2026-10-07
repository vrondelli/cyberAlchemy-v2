import assert from "node:assert/strict";
import test from "node:test";
import React, {createElement as h} from "react";
import {renderToString} from "ink";

import {ControlCenterPanels, QueueFooter} from "../src/app.mjs";
import {controlCenterCounts, conversationStatus, createControlCenterState, reduceControlCenterEvent} from "../src/control-center.mjs";

test("unresolved host turn is blocked, not idle", () => {
  assert.equal(conversationStatus("uncertain"), "blocked");
});

test("demo state exposes sessions, queued work, and origin-bound attention", () => {
  const state = createControlCenterState({demo: true});
  assert.equal(state.sessions.length, 4);
  assert.equal(state.queue.length, 4);
  assert.equal(controlCenterCounts(state).pendingAttention, 3);
  assert.equal(state.attention[0].originSessionId, "definition");
  assert.equal(state.authorityEffect, "none");
});

test("attention decisions fail closed on stale digests or undeclared choices", () => {
  const state = createControlCenterState({demo: true});
  const item = state.attention[0];
  assert.equal(reduceControlCenterEvent(state, {type: "attention.decide", attentionId: item.attentionId, subjectDigest: "0".repeat(64), decision: "open"}), state);
  assert.equal(reduceControlCenterEvent(state, {type: "attention.decide", attentionId: item.attentionId, subjectDigest: item.subjectDigest, decision: "approve"}), state);
  const decided = reduceControlCenterEvent(state, {type: "attention.decide", attentionId: item.attentionId, subjectDigest: item.subjectDigest, decision: "defer"});
  assert.equal(decided.attention[0].state, "decided");
  assert.equal(decided.attention[0].decisionActor, "human");
});

test("opening attention jumps to its originating session without deciding it", () => {
  const state = createControlCenterState({demo: true});
  const opened = reduceControlCenterEvent(state, {type: "attention.open", attentionId: "definition-choice"});
  assert.equal(opened.selectedSessionId, "definition");
  assert.equal(opened.focus, "attention");
  assert.equal(opened.attention[0].state, "viewed");
  assert.equal(opened.attention[0].decision, undefined);
});

test("wide control center renders three panes and queue status", () => {
  const state = createControlCenterState({demo: true});
  const output = renderToString(h(React.Fragment, null,
    h(ControlCenterPanels, {state, columns: 140, center: h("ink-text", null, "Conversation")}),
    h(QueueFooter, {state}),
  ), {columns: 140});
  assert.match(output, /Sessions/u);
  assert.match(output, /Conversation/u);
  assert.match(output, /Attention · 3/u);
  assert.match(output, /Tests agent/u);
  assert.match(output, /3 need attention/u);
});

test("narrow control center collapses into visible tabs without hiding attention count", () => {
  const state = createControlCenterState({demo: true});
  const output = renderToString(h(ControlCenterPanels, {state, columns: 80, center: h("ink-text", null, "Conversation")}), {columns: 80});
  assert.match(output, /Sessions/u);
  assert.match(output, /Chat/u);
  assert.match(output, /Attention 3/u);
  assert.match(output, /Conversation/u);
});
