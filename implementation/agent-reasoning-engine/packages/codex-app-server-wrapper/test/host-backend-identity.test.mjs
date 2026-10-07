import assert from "node:assert/strict";
import test from "node:test";

import {validExpectedCodexVersion, verifyCodexBackendInitializeVersion} from "../src/host-backend-identity.mjs";

const expected = "codex-cli 0.155.0-alpha.16.4";

test("installed-host initialization reports the pinned version without exposing its full user agent", () => {
  const result = verifyCodexBackendInitializeVersion({result: {
    userAgent: "Codex Desktop/0.155.0-alpha.16.4 (Ubuntu 26.4.0; x86_64) xterm-256color (fixture; 0)",
  }}, expected);
  assert.equal(result.ok, true);
  assert.equal(result.observed_codex_version, expected);
  assert.equal(result.claim_ceiling, "self-reported-live-transport-version");
  assert.doesNotMatch(JSON.stringify(result), /Ubuntu|xterm|fixture/);
});

test("missing, malformed, and changed host versions fail closed", () => {
  assert.equal(verifyCodexBackendInitializeVersion({result: {}}, expected).reason, "host.initialize-version-unavailable");
  assert.equal(verifyCodexBackendInitializeVersion({result: {userAgent: "Other/0.155.0-alpha.16.4"}}, expected).reason, "host.initialize-version-unavailable");
  assert.equal(verifyCodexBackendInitializeVersion({result: {userAgent: "Codex Desktop/0.155.0-alpha.16.3 (fixture)"}}, expected).reason, "host.initialize-version-drift");
  assert.equal(verifyCodexBackendInitializeVersion({result: {userAgent: "Codex Desktop/0.155.0-alpha.16.4-extra (fixture)"}}, expected).reason, "host.initialize-version-drift");
  assert.equal(verifyCodexBackendInitializeVersion({error: {code: -1}}, expected).reason, "host.initialize-response-failed");
  assert.equal(validExpectedCodexVersion(expected), true);
  assert.equal(validExpectedCodexVersion("codex-cli 0.155.0-alpha.16.4 other"), false);
});

test("standalone host identity binds the authenticated client's exact declared name", () => {
  const response = {result: {userAgent: "cyberalchemy_are_windows/0.155.0-alpha.16.4 (Ubuntu 26.4.0; x86_64)"}};
  assert.equal(verifyCodexBackendInitializeVersion(response, expected, "cyberalchemy_are_windows").ok, true);
  assert.equal(verifyCodexBackendInitializeVersion(response, expected, "other_client").reason,
    "host.initialize-version-unavailable");
  assert.equal(verifyCodexBackendInitializeVersion(response, expected).reason,
    "host.initialize-version-unavailable");
  assert.equal(verifyCodexBackendInitializeVersion({result: {userAgent: "cyberalchemy_are_windows/0.155.0-alpha.16.3"}},
    expected, "cyberalchemy_are_windows").reason, "host.initialize-version-drift");
});
