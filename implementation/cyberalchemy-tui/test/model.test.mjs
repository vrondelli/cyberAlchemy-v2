import assert from "node:assert/strict";
import test from "node:test";

import {initialShellState, isTerminalConversationPhase, reduceShellEvent} from "../src/model.mjs";
import {ONTOLOGY_RELATIONS, renderRelationLine} from "../src/ontology-view.mjs";

test("shell overlays never change the active capability", () => {
  const initial = initialShellState();
  const opened = reduceShellEvent(initial, {type: "overlay.open", overlay: "context"});
  assert.equal(opened.capabilityId, "define");
  assert.equal(opened.overlay, "context");
  assert.equal(reduceShellEvent(opened, {type: "overlay.close"}).capabilityId, "define");
});

test("planned capabilities cannot be activated", () => {
  const initial = initialShellState();
  assert.equal(reduceShellEvent(initial, {type: "capability.open", capabilityId: "research"}), initial);
});

test("implement capability is available without changing authority", () => {
  const opened = reduceShellEvent(initialShellState(), {type: "capability.open", capabilityId: "implement"});
  assert.equal(opened.capabilityId, "implement");
  assert.equal(opened.overlay, null);
});

test("ontology relation projection uses the compact word relation word form", () => {
  assert.equal(renderRelationLine(ONTOLOGY_RELATIONS[0]), "CyberAlchemy -serves→ Human Participant");
});

test("completed, blocked, and cancelled controller phases expose a terminal exit state", () => {
  assert.equal(isTerminalConversationPhase("completed"), true);
  assert.equal(isTerminalConversationPhase("error"), true);
  assert.equal(isTerminalConversationPhase("stopped"), true);
  assert.equal(isTerminalConversationPhase("working"), false);
  assert.equal(isTerminalConversationPhase("waiting"), false);
});
