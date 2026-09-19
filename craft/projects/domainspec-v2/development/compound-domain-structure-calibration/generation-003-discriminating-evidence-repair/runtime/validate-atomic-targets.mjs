import { createHash } from "node:crypto";

export const PARENT_RECEIPT_HANDLE = "record:sha256:6d2066bded781e8dc739eb65f09f5237b131a4c55e7a858a03de8d1f5118681a";

export const TARGET_DEFINITIONS = Object.freeze([
  definition("T-P-01", "permitted", "semantic.S.permitted.description", "The replacement preserves the declared onNext/onBack interaction contract."),
  definition("T-P-02", "permitted", "semantic.S.permitted.prediction", "The selected rendered child changes."),
  definition("T-P-03", "permitted", "semantic.S.permitted.prediction", "Route coordination remains stable."),
  definition("T-P-04", "permitted", "semantic.S.permitted.prediction", "Guard behavior remains stable."),
  definition("T-B-01", "breaking", "semantic.S.breaking.description", "The committed step bypasses or differs from the guard result."),
  definition("T-B-02", "breaking", "semantic.S.breaking.prediction", "A previously blocked or premature request reaches a different committed destination."),
]);

export const TARGET_IDS = Object.freeze(TARGET_DEFINITIONS.map((item) => item.target_id));
export const TARGET_KINDS = Object.freeze(["permitted", "breaking"]);
export const PARENT_FIELD_SELECTORS = Object.freeze([
  "semantic.S.permitted.description",
  "semantic.S.permitted.prediction",
  "semantic.S.breaking.description",
  "semantic.S.breaking.prediction",
]);

const EXPECTED_PARENT_FIELD_DIGESTS = Object.freeze({
  "semantic.S.permitted.description": "sha256:bbb27d2c56f293ed54ed0f46335d19c304cf755a1b8c704090617b9ca2ded90f",
  "semantic.S.permitted.prediction": "sha256:8cc26580cf18180d6a53ae3dfab9e310c48977d5dabc28f52a8658dfeebd605b",
  "semantic.S.breaking.description": "sha256:cf8dd6cebbca350eb1d44132db55ce7b1de4d57f6d1ac094153cb71bf2bafcf2",
  "semantic.S.breaking.prediction": "sha256:fbbb5e39d3306170465f2143b4e1deab9ea5f61db8674f980475ec707c5ea7dd",
});

export function deriveAtomicTargetSet(parentReceipt) {
  validateParent(parentReceipt);
  return {
    schema_version: "cdsc.atomic-target-set.v1",
    parent_receipt_handle: parentReceipt.record_id,
    parent_generation_id: parentReceipt.generation_id,
    targets: TARGET_DEFINITIONS.map((expected) => ({
      ...expected,
      parent_field_digest: digestText(readSelector(parentReceipt, expected.parent_field_selector)),
      target_digest: digestText(expected.canonical_proposition),
    })),
  };
}

export function validateAtomicTargetSet(targetSet, parentReceipt) {
  validateParent(parentReceipt);
  requireObject(targetSet, "atomic target set");
  assertExactKeys(targetSet, ["schema_version", "parent_receipt_handle", "parent_generation_id", "targets"], "atomic target set");
  if (targetSet.schema_version !== "cdsc.atomic-target-set.v1") throw new TypeError("atomic target schema version mismatch");
  if (targetSet.parent_receipt_handle !== parentReceipt.record_id) throw new TypeError("parent receipt handle mismatch");
  if (targetSet.parent_generation_id !== parentReceipt.generation_id) throw new TypeError("parent generation handle mismatch");
  if (!Array.isArray(targetSet.targets) || targetSet.targets.length !== TARGET_DEFINITIONS.length) throw new TypeError("atomic target set must contain exactly six targets");
  const seenIds = new Set();
  const seenPropositions = new Set();
  for (let index = 0; index < TARGET_DEFINITIONS.length; index += 1) {
    const target = targetSet.targets[index];
    const expected = TARGET_DEFINITIONS[index];
    requireObject(target, `target ${index}`);
    assertExactKeys(target, ["target_id", "kind", "parent_field_selector", "parent_field_digest", "canonical_proposition", "target_digest"], `target ${index}`);
    if (target.target_id !== expected.target_id) throw new TypeError("semantic target reordering or unknown target id");
    if (seenIds.has(target.target_id)) throw new TypeError("duplicate target id");
    if (seenPropositions.has(target.canonical_proposition)) throw new TypeError("overlapping atomic target proposition");
    seenIds.add(target.target_id);
    seenPropositions.add(target.canonical_proposition);
    if (target.kind !== expected.kind) throw new TypeError(`target kind mismatch: ${target.target_id}`);
    if (target.parent_field_selector !== expected.parent_field_selector) throw new TypeError(`target provenance mismatch: ${target.target_id}`);
    if (target.canonical_proposition !== expected.canonical_proposition) throw new TypeError(`combined or changed atomic target: ${target.target_id}`);
    const sourceText = readSelector(parentReceipt, target.parent_field_selector);
    if (digestText(sourceText) !== EXPECTED_PARENT_FIELD_DIGESTS[target.parent_field_selector]) throw new TypeError(`changed parent text: ${target.target_id}`);
    if (target.parent_field_digest !== digestText(sourceText)) throw new TypeError(`parent field digest mismatch: ${target.target_id}`);
    if (target.target_digest !== digestText(target.canonical_proposition)) throw new TypeError(`target digest mismatch: ${target.target_id}`);
  }
  return true;
}

export function digestText(value) {
  if (typeof value !== "string" || value.length === 0) throw new TypeError("digest input must be non-empty text");
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function definition(targetId, kind, parentFieldSelector, canonicalProposition) {
  return Object.freeze({ target_id: targetId, kind, parent_field_selector: parentFieldSelector, canonical_proposition: canonicalProposition });
}

function validateParent(parentReceipt) {
  requireObject(parentReceipt, "parent receipt");
  if (parentReceipt.record_id !== PARENT_RECEIPT_HANDLE) throw new TypeError("parent receipt handle mismatch");
  requireObject(parentReceipt.semantic, "parent semantic");
  requireObject(parentReceipt.semantic.S, "parent substitutions");
  for (const selector of PARENT_FIELD_SELECTORS) {
    const value = readSelector(parentReceipt, selector);
    if (typeof value !== "string" || value.length === 0) throw new TypeError(`missing parent field: ${selector}`);
  }
}

function readSelector(value, selector) {
  return selector.split(".").reduce((current, token) => current?.[token], value);
}

function assertExactKeys(value, expected, label) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) throw new TypeError(`${label} has unknown or missing field`);
}

function requireObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
}
