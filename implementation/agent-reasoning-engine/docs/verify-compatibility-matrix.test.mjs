import assert from "node:assert/strict";
import {existsSync, readFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {validateCompatibilityMatrix} from "./verify-compatibility-matrix.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const matrix = JSON.parse(readFileSync(resolve(root, "implementation/agent-reasoning-engine/docs/compatibility-matrix.json"), "utf8"));
const candidate = JSON.parse(readFileSync(resolve(root, "implementation/agent-reasoning-engine/evidence/product-candidate.018.json"), "utf8"));
const validate = value => validateCompatibilityMatrix(value, {candidate, pathExists: ref => existsSync(resolve(root, ref))});

test("compatibility matrix covers current artifact, config, protocol, schema, state, journal and credential boundaries", () => {
  const result = validate(matrix);
  assert.equal(result.boundary_count, 10);
  assert.deepEqual(result.categories, ["artifact", "configuration", "credential", "journal", "protocol", "schema", "state"]);
  assert.equal(result.upgrade_posture, "NO_SUPPORTED_PATH");
});

test("compatibility matrix rejects missing categories and sources", () => {
  const category = structuredClone(matrix);
  category.boundaries = category.boundaries.filter(item => item.category !== "journal");
  assert.throws(() => validate(category), /compatibility\.category-coverage-mismatch/u);

  const source = structuredClone(matrix);
  source.boundaries[0].reader_refs = ["missing/release-reader.mjs"];
  assert.throws(() => validate(source), /compatibility\.source-missing:product-source-artifact/u);
});

test("compatibility matrix cannot claim a supported upgrade without a version pair", () => {
  const unsupported = structuredClone(matrix);
  unsupported.upgrade_posture = "SUPPORTED";
  assert.throws(() => validate(unsupported), /compatibility\.supported-path-missing-pair/u);
});
