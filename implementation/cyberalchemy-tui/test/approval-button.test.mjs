import assert from "node:assert/strict";
import test from "node:test";
import React, {createElement as h} from "react";
import {renderToString} from "ink";

import {ActivityIndicator, ApprovalButton, Composer, DiagnosticTimeline, isComposerDisabled} from "../src/app.mjs";

test("approval button renders the exact pending digest and explicit confirmation boundary", () => {
  const digest = "e".repeat(64);
  const output = renderToString(h(ApprovalButton, {digest}), {columns: 100});
  assert.match(output, /Confirm & apply/u);
  assert.match(output, new RegExp(digest, "u"));
  assert.match(output, /Enter/u);
  assert.match(output, /No implicit approval/u);
});

test("approval button fails closed when no exact digest is available", () => {
  const output = renderToString(h(ApprovalButton, {digest: "not-a-digest"}), {columns: 80});
  assert.match(output, /Approval unavailable/u);
  assert.doesNotMatch(output, /Confirm & apply/u);
});

test("activity indicator exposes distinct running and applying phases", () => {
  const running = renderToString(h(ActivityIndicator, {phase: "working"}), {columns: 120});
  const applying = renderToString(h(ActivityIndicator, {phase: "applying"}), {columns: 120});
  assert.match(running, /Request running/u);
  assert.match(running, /waiting for the model/u);
  assert.match(applying, /Approval accepted/u);
  assert.match(applying, /sandbox verification/u);
});

test("diagnostic timeline renders bounded phase evidence", () => {
  const tree = DiagnosticTimeline({items: [{phase: "preflight", detail: "PASS", at: "now"}, {phase: "proposal", detail: "AWAITING_APPROVAL", at: "later"}]});
  const text = JSON.stringify(tree);
  assert.match(text, /preflight/u);
  assert.match(text, /AWAITING_APPROVAL/u);
});

test("continuation guidance is not rendered as composer input", () => {
  const output = renderToString(h(Composer, {value: "", prompt: "Type your next message.", disabled: false}), {columns: 80});
  assert.match(output, /Type your next message\./u);
  assert.doesNotMatch(output, />\s*What would you like to do next\?/u);
  assert.equal(isComposerDisabled("working"), true);
  assert.equal(isComposerDisabled("applying"), true);
  assert.equal(isComposerDisabled("idle"), false);
});
