import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonicalRoot = path.resolve(root, "../system-integration/contracts");
const mirrored = [
  "provider-pack-selection-v1.schema.json",
  "integration-generation-source-v2.schema.json",
  "application-integration-binding-v1.schema.json",
  "compiled-application-graph-v1.schema.json",
  "persistence-composition-v2.schema.json",
  "messaging-composition-v2.schema.json",
  "external-api-composition-v2.schema.json",
  "integration-observation-v1.schema.json",
  "integration-kernel-v2.schema.json",
];

const results = mirrored.map(name => {
  const sourceBytes = fs.readFileSync(path.join(canonicalRoot, name));
  const packagedBytes = fs.readFileSync(path.join(root, "contracts", name));
  assert.deepEqual(packagedBytes, sourceBytes, `packaged schema drifted from its canonical source:${name}`);
  JSON.parse(packagedBytes.toString("utf8"));
  return { schema: `contracts/${name}`, bytes: packagedBytes.length, authority: `system-integration/contracts/${name}` };
});

const wholeApplicationPath = path.join(root, "contracts/whole-application-plan-v1.schema.json");
const wholeApplicationBytes = fs.readFileSync(wholeApplicationPath);
const wholeApplication = JSON.parse(wholeApplicationBytes.toString("utf8"));
assert.equal(wholeApplication.$schema, "https://json-schema.org/draft/2020-12/schema");
assert.equal(wholeApplication.$id, "https://domainspec.dev/contracts/whole-application-plan-v1.schema.json");
assert.equal(wholeApplication.properties?.schema_version?.const, "domainspec.whole-application-plan/v1-candidate");
assert.equal(wholeApplication.properties?.runtime_guarantees_observed?.const, false);
assert.equal(wholeApplication.properties?.claim_ceiling?.const, "formation-and-static-compilation-only");
assert.equal(wholeApplication.properties?.authority_effect?.const, "none");
assert.equal(wholeApplication.additionalProperties, false);
results.push({ schema: "contracts/whole-application-plan-v1.schema.json", bytes: wholeApplicationBytes.length, authority: "cli/src/generation/whole-application-v1.ts" });

const runtimeEvidencePath = path.join(root, "contracts/provider-application-runtime-evidence-v1.schema.json");
const runtimeEvidenceBytes = fs.readFileSync(runtimeEvidencePath);
const runtimeEvidence = JSON.parse(runtimeEvidenceBytes.toString("utf8"));
assert.equal(runtimeEvidence.$schema, "https://json-schema.org/draft/2020-12/schema");
assert.equal(runtimeEvidence.$id, "https://domainspec.dev/contracts/provider-application-runtime-evidence-v1.schema.json");
assert.equal(runtimeEvidence.properties?.schema_version?.const, "domainspec.provider-application-runtime-evidence/v1-candidate");
assert.equal(runtimeEvidence.properties?.production_runtime_guarantees_observed?.const, false);
assert.equal(runtimeEvidence.properties?.authority_effect?.const, "none");
assert.equal(runtimeEvidence.additionalProperties, false);
results.push({ schema: "contracts/provider-application-runtime-evidence-v1.schema.json", bytes: runtimeEvidenceBytes.length, authority: "cli/src/generation/provider-application-runtime-evidence-v1.ts" });

const packagedSchemaNames = results.map(row => path.basename(row.schema));
const resolvedReferences = [];
const visitReferences = (value, owner) => {
  if (Array.isArray(value)) return value.forEach(child => visitReferences(child, owner));
  if (value === null || typeof value !== "object") return;
  if (typeof value.$ref === "string" && !value.$ref.startsWith("#") && !/^[a-z]+:/i.test(value.$ref)) {
    const referenced = value.$ref.split("#", 1)[0];
    assert.equal(fs.existsSync(path.join(root, "contracts", referenced)), true, `unresolved packaged schema reference:${owner}:${value.$ref}`);
    resolvedReferences.push({ owner, reference: value.$ref });
  }
  for (const child of Object.values(value)) visitReferences(child, owner);
};
for (const name of packagedSchemaNames) visitReferences(JSON.parse(fs.readFileSync(path.join(root, "contracts", name), "utf8")), name);

process.stdout.write(`${JSON.stringify({ result: "pass", schemas: results, resolved_references: resolvedReferences })}\n`);
