import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {generateApiReference, validateAnnotationCoverage, validateManifest} from "./generate-api-reference.mjs";

const docsRoot = dirname(fileURLToPath(import.meta.url));
const surface = JSON.parse(readFileSync(resolve(docsRoot, "reference/api-surface.json"), "utf8"));

test("API reference generation is deterministic and closed", async () => {
  const first = await generateApiReference();
  const second = await generateApiReference();
  assert.equal(first, second);
  assert.match(first, /Selected packages: 16/u);
  assert.match(first, /### are\.cli-request\/v1/u);
  assert.match(first, /### reasoning-state-runtime/u);
  assert.match(first, /Fields with complete annotations: 127\/127/u);
  assert.match(first, /Generation fails if an annotation is missing/u);
  assert.match(first, /"schema_version": "are\.cli-request\/v1"/u);
  assert.match(first, /## Open Questions/u);
});

test("API annotation coverage rejects a missing selected field", () => {
  assert.throws(
    () => validateAnnotationCoverage("example/v1", {fields: []}, [{pointer: "/properties/value", required: true}]),
    /api-annotations\.coverage-count:example\/v1/u,
  );
});

test("candidate classification cannot silently claim public support before DR-04", () => {
  const promoted = structuredClone(surface);
  promoted.classification_model.public_supported_identities = ["package:codex-app-server-wrapper"];
  assert.throws(() => validateManifest(promoted), /api-surface\.public-support-requires-dr04/u);
});
