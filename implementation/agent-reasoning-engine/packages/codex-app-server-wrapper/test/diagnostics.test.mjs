import assert from "node:assert/strict";
import test from "node:test";

import {classifyBackendDiagnostic} from "../index.mjs";

test("backend diagnostics redact credentials and retain only a digest of source bytes", () => {
  const diagnostic = classifyBackendDiagnostic("password=hunter2 Bearer abc.def.ghi sk-secret123456 prompt body");
  assert.equal(diagnostic.secret_values_emitted, false);
  assert.equal(diagnostic.source_digest.length, 64);
  assert.doesNotMatch(diagnostic.preview, /hunter2|abc\.def|secret123456/u);
  assert.match(diagnostic.preview, /\[REDACTED\]/u);
});

test("backend diagnostics have an explicit byte ceiling", () => {
  const diagnostic = classifyBackendDiagnostic("x".repeat(4096), {maximum_bytes: 128});
  assert.equal(Buffer.byteLength(diagnostic.preview) <= 128, true);
  assert.equal(diagnostic.truncated, true);
});
