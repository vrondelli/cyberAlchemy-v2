import assert from "node:assert/strict";
import test from "node:test";

import {backendProcessBirthRef, backendProcessBirthSupported, classifyBackendProcessIdentity} from "../src/backend-process-birth.mjs";

test("guarded backend process birth is stable for this process and uninspectable PIDs stay unknown", {skip: !backendProcessBirthSupported()}, () => {
  const birth = backendProcessBirthRef(process.pid);
  assert.match(birth, /^[0-9a-f]{64}$/u);
  assert.equal(backendProcessBirthRef(process.pid), birth);
  assert.equal(backendProcessBirthRef(0), null);
  assert.equal(backendProcessBirthRef(2147483647), null);
  const identity = {host_name: "test-host", process_id: process.pid, birth_ref: birth};
  assert.equal(classifyBackendProcessIdentity(identity, "alive", birth), "alive");
  assert.equal(classifyBackendProcessIdentity(identity, "alive", "0".repeat(64)), "reused");
  assert.equal(classifyBackendProcessIdentity(identity, "alive", null), "unknown");
  assert.equal(classifyBackendProcessIdentity(identity, "missing", null), "missing");
  assert.equal(classifyBackendProcessIdentity({host_name: "test-host", process_id: process.pid}, "alive", birth), "alive");
});
