import assert from "node:assert/strict";
import test from "node:test";
import {requirementPostureView} from "../client/requirement-posture.js";

test("hosted requirement posture shows only manager-verified enabled and disabled states", () => {
  assert.deepEqual(requirementPostureView({status: "enabled", source: "managed-gateway-startup"}), {
    status: "enabled", open: true,
    text: "Requirement tracking is on for this managed session. A new objective needs an explicit list; continuations retain the current list.",
  });
  assert.equal(requirementPostureView({status: "disabled", source: "managed-gateway-startup"}).status, "disabled");
  assert.equal(requirementPostureView({status: "enabled", source: "unverified"}).status, "unverified");
  assert.equal(requirementPostureView(null).status, "unverified");
});
