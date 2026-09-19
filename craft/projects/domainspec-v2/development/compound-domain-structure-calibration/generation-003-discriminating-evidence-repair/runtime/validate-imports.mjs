import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const GENERATION_2_ID = "generation:sha256:24c4e0292197d0d8895bd5a668813437ba6d5c6f02cf6b549d85b2ae350ce683";
export const PROHIBITED_INFERENCES = Object.freeze([
  "candidate-promotion",
  "ds-d1-formation",
  "ds-d8-authority",
  "identity",
  "pattern-admission",
  "portability",
  "ui-status-inflation",
]);

export const ALLOWED_IMPORT_SEMANTICS = Object.freeze([
  "frozen-parent-substitution-source",
  "prior-permitted-observation",
  "prior-breaking-observation",
  "unresolved-coordinate-source",
  "evaluator-compatibility-baseline",
  "frozen-f3-result",
  "frozen-generation-run",
  "frozen-generation-provenance",
  "closed-audit-only",
  "ui-corpus-boundary-only",
  "ui-portability-limit-only",
  "ui-dossier-limit-only",
  "ui-audit-status-only",
]);

export const EXPECTED_IMPORTS = Object.freeze([
  entry("parent-f3", "compound-domain-structure-calibration", "projects/domainspec-v2/development/compound-domain-structure-calibration/evidence/generation-001/f3-savvy-page/receipt.json", "b790cf3052305757253b40c1dd9f0c8443bb434a21c0ebf248d12ddd0ea62b6d", "record:sha256:6d2066bded781e8dc739eb65f09f5237b131a4c55e7a858a03de8d1f5118681a", assertion("/status", "frozen"), "frozen-parent-substitution-source"),
  entry("m1-observation", "compound-domain-structure-calibration", "projects/domainspec-v2/development/compound-domain-structure-calibration/generation-002-evidence-repair/evidence/generation-002/m1-permitted-screen/receipt.json", "61679792f7a88b1c6e00aca88302c570f88382e97406d9fd4e4066c9aa58ed62", "record:sha256:26cbc95a46c790b819ac0c9ebbef94771eed89a5457927fa0fd0967d32ec0140", assertion("/status", "frozen"), "prior-permitted-observation"),
  entry("m2-observation", "compound-domain-structure-calibration", "projects/domainspec-v2/development/compound-domain-structure-calibration/generation-002-evidence-repair/evidence/generation-002/m2-breaking-guard/receipt.json", "89fca15c59d3ba894e31278a1efb11020819664abf2648dcb5392eaedc622a8c", "record:sha256:55f0f6a99f8df7f5d9c4bf6da8c218f9366733a300e689c24ff8a2672e4309bd", assertion("/status", "frozen"), "prior-breaking-observation"),
  entry("generation-2-overlay", "compound-domain-structure-calibration", "projects/domainspec-v2/development/compound-domain-structure-calibration/evidence/generation-002/f3-savvy-page/adjudication-overlay.json", "740a9b717413f8f8f02db0ffbb326af18ec3f77156ede9496a0ecb59e7643166", "record:sha256:668ea537da92ee33b4640fe34175aaffa1b387b0809352984b552a7530dae8b5", assertion("/status", "frozen"), "unresolved-coordinate-source"),
  entry("generation-2-projection", "compound-domain-structure-calibration", "projects/domainspec-v2/development/compound-domain-structure-calibration/evidence/generation-002/f3-savvy-page/compatibility-receipt.json", "101ad3cb031449b64ed317fa185b3368a71ade02b8033cadf15f5c8f9c15c5a0", "record:sha256:8fa5b9015945b56aa2a9cdbf47d0743281a1a299fe1f0e8751b33518cbb03ccd", assertion("/status", "frozen"), "evaluator-compatibility-baseline"),
  entry("generation-2-f3-result", "compound-domain-structure-calibration", "projects/domainspec-v2/development/compound-domain-structure-calibration/results/generation-002/f3-result.json", "40ac17d0f823c3809d5f85f4615bebcc4227dd755187c5660e6010afa4373e9f", "record:sha256:8000b77fa0a60967707f5b830b8320fe92bee9965edbb3ff21e12f834620bd1a", assertion("/status", "insufficient-evidence"), "frozen-f3-result"),
  entry("generation-2-run", "compound-domain-structure-calibration", "projects/domainspec-v2/development/compound-domain-structure-calibration/results/generation-002/run-receipt.json", "5fe3e07d41325c192555b4d23244c70599af9486cff740eaee4a46bdbcc40fae", GENERATION_2_ID, assertion("/suite_verdict", "CALIBRATION-DEFER"), "frozen-generation-run"),
  entry("generation-2-provenance", "compound-domain-structure-calibration", "projects/domainspec-v2/development/compound-domain-structure-calibration/results/generation-002/provenance-manifest.json", "5791c7b06c5973f1d98568ba7d59a5c254a76a3450e87bcd69ecfafc00b632ef", "record:sha256:d7f4353c339cb2826e29860d17367c75737ff7f96c3367f856957ff4e98f47e2", assertion("/status", "frozen"), "frozen-generation-provenance"),
  textEntry("generation-2-audit", "compound-domain-structure-calibration", "projects/domainspec-v2/development/compound-domain-structure-calibration/generation-002-evidence-repair/runs/SWU-CDSC2-007R/AUDIT.md", "0186c1e9c956b194ede590158f4f278b094732146e91d8f2e6274c6bd46f7f5d", "audit_result: PASS", "closed-audit-only"),
  entry("ui-corpus", "ui-meta-type-repair", "projects/domainspec-v2/development/ui-meta-type-repair/evidence/results/corpus/generation-002/receipts.json", "de438833b9a0bb0a87ab0de8fe259146d29a854f003e1f9fe8fb6d497d2108ce", "record:sha256:b707fc6a7309fc1904ea34f75965c14552432317e0617db6cae92390b6653432", assertion("/status", "complete"), "ui-corpus-boundary-only"),
  entry("ui-dossier-policy", "ui-meta-type-repair", "projects/domainspec-v2/development/ui-meta-type-repair/evidence/results/dossier-policy/generation-001/evaluation.json", "43f36ca61503891ab1c73bf6b0ba0a15ceb6a3f8e3b65a7801c7f85a03a46f65", "record:sha256:327c2354f02488f964f20c05e2becdf1b884d19fb830ac75c5b19cfbe2905f94", assertion("/status", "defer"), "ui-portability-limit-only"),
  entry("ui-dossier", "ui-meta-type-repair", "projects/domainspec-v2/development/ui-meta-type-repair/evidence/results/dossier/generation-002/dossier.json", "2bb1f62d6a74344685754410d0bc72bd50c20a203d3bbf81ac2ff09e813b48a9", "record:sha256:da3828d98c1444080030fffc1b4d6d8e9d3f177193645898da83974af1c2d0e8", assertion("/semantic/outcome", "DEFER"), "ui-dossier-limit-only"),
  entry("ui-integrated-audit-result", "ui-meta-type-repair", "projects/domainspec-v2/development/ui-meta-type-repair/audit/integrated-001/result.json", "f62878cbf41f01e7117c35257503c97ca566e14382919b0d3fae66234ed68337", null, assertion("/result", "pass"), "ui-audit-status-only"),
  entry("ui-integrated-audit-manifest", "ui-meta-type-repair", "projects/domainspec-v2/development/ui-meta-type-repair/audit/integrated-001/manifest.json", "6f085df29c1e9d894d396820aa17c5c93506c11d50e11ea8dbff20a820127c1d", null, assertion("/audit_id", "UIR-INTEGRATED-001"), "ui-audit-status-only"),
]);

const GENERATION_INDEX_PATH = "projects/domainspec-v2/development/compound-domain-structure-calibration/generations/index.json";
const GENERATION_INDEX_DIGEST = "sha256:7cfdd7a6949e9899f902eda2c917769e76bcc4f682054ff2d9e351f84f8be69a";

export function validateProtectedImports(manifest, { root, allowSuccessors = false }) {
  requireObject(manifest, "protected import manifest");
  assertExactKeys(manifest, ["schema_version", "generation_tail", "imports", "prohibited_inferences"], "protected import manifest");
  if (manifest.schema_version !== "cdsc.protected-import.v1") throw new TypeError("protected import schema version mismatch");
  assertSameArray(manifest.prohibited_inferences, PROHIBITED_INFERENCES, "prohibited inferences");
  validateGenerationTail(manifest.generation_tail, root, allowSuccessors);
  if (!Array.isArray(manifest.imports) || manifest.imports.length !== EXPECTED_IMPORTS.length) throw new TypeError("protected imports must contain exactly fourteen entries");
  for (let index = 0; index < EXPECTED_IMPORTS.length; index += 1) {
    const actual = manifest.imports[index];
    const expected = EXPECTED_IMPORTS[index];
    requireObject(actual, `import ${index}`);
    assertExactKeys(actual, ["import_id", "owner", "path", "raw_sha256", "stable_handle", "expected_assertions", "allowed_semantics"], `import ${index}`);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new TypeError(`import declaration drift: ${expected.import_id}`);
    validateImportedBytes(actual, root);
  }
  validateUiLimits(manifest.imports, root);
  return true;
}

function validateGenerationTail(tail, root, allowSuccessors) {
  requireObject(tail, "generation tail");
  assertExactKeys(tail, ["path", "raw_sha256", "entry_count", "generation_id"], "generation tail");
  const expected = { path: GENERATION_INDEX_PATH, raw_sha256: GENERATION_INDEX_DIGEST, entry_count: 2, generation_id: GENERATION_2_ID };
  if (JSON.stringify(tail) !== JSON.stringify(expected)) throw new TypeError("wrong predecessor generation tail");
  const bytes = readFileSync(resolve(root, tail.path));
  const index = JSON.parse(bytes);
  if (!allowSuccessors) {
    if (sha256(bytes) !== tail.raw_sha256) throw new TypeError("generation index protected file drift");
    if (index.entries.length !== 2 || index.entries.at(-1).generation_id !== GENERATION_2_ID) throw new TypeError("wrong predecessor generation tail");
    return;
  }
  if (index.entries.length < 2 || index.entries[1].generation_id !== GENERATION_2_ID) throw new TypeError("wrong predecessor generation prefix");
  const prefixBytes = Buffer.from(`${JSON.stringify({ schema_version: index.schema_version, entries: index.entries.slice(0, 2) }, null, 2)}\n`);
  if (sha256(prefixBytes) !== tail.raw_sha256) throw new TypeError("generation index protected prefix drift");
}

function validateImportedBytes(entryValue, root) {
  const bytes = readFileSync(resolve(root, entryValue.path));
  if (sha256(bytes) !== entryValue.raw_sha256) throw new TypeError(`protected file drift: ${entryValue.import_id}`);
  const text = bytes.toString("utf8");
  if (entryValue.stable_handle !== null && !text.includes(entryValue.stable_handle)) throw new TypeError(`stable handle mismatch: ${entryValue.import_id}`);
  let json;
  for (const item of entryValue.expected_assertions) {
    if (item.kind === "text-contains") {
      if (!text.includes(item.equals)) throw new TypeError(`expected status mismatch: ${entryValue.import_id}`);
      continue;
    }
    json ??= JSON.parse(text);
    if (!Object.is(readPointer(json, item.selector), item.equals)) throw new TypeError(`expected status mismatch: ${entryValue.import_id}`);
  }
}

function validateUiLimits(imports, root) {
  const byId = new Map(imports.map((item) => [item.import_id, item]));
  const policy = readJson(root, byId.get("ui-dossier-policy").path);
  const dossier = readJson(root, byId.get("ui-dossier").path);
  const audit = readJson(root, byId.get("ui-integrated-audit-result").path);
  if (policy.status !== "defer" || policy.semantic.overall_state !== "missing") throw new TypeError("UI status inflation: policy must remain defer/missing");
  if (dossier.status !== "defer" || dossier.semantic.outcome !== "DEFER") throw new TypeError("UI status inflation: dossier must remain DEFER");
  const portability = dossier.semantic.conjuncts.find((item) => item.id === "corpus-bound-portability");
  const positive = dossier.semantic.conjuncts.find((item) => item.id === "independent-positive");
  if (portability?.state !== "missing" || positive?.state !== "missing") throw new TypeError("UI status inflation: missing evidence changed");
  if (audit.result !== "pass" || audit.checks.authority_effect_none !== "pass") throw new TypeError("UI audit boundary mismatch");
}

function entry(importId, owner, path, digest, stableHandle, expectedAssertion, allowedSemantics) {
  return Object.freeze({ import_id: importId, owner, path, raw_sha256: `sha256:${digest}`, stable_handle: stableHandle, expected_assertions: [expectedAssertion], allowed_semantics: allowedSemantics });
}

function textEntry(importId, owner, path, digest, expectedText, allowedSemantics) {
  return entry(importId, owner, path, digest, null, { kind: "text-contains", selector: "text", equals: expectedText }, allowedSemantics);
}

function assertion(selector, equals) {
  return { kind: "json-pointer-equals", selector, equals };
}

function readJson(root, path) {
  return JSON.parse(readFileSync(resolve(root, path), "utf8"));
}

function readPointer(value, pointer) {
  return pointer.split("/").slice(1).reduce((current, token) => current?.[token.replaceAll("~1", "/").replaceAll("~0", "~")], value);
}

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function assertSameArray(actual, expected, label) {
  if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected)) throw new TypeError(`${label} mismatch`);
}

function assertExactKeys(value, expected, label) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) throw new TypeError(`${label} has unknown or missing field`);
}

function requireObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
}
