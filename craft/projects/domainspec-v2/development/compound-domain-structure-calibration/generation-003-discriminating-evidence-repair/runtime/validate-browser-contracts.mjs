export const OBSERVABLE_FIELDS = Object.freeze([
  "rendered_child_id",
  "interaction_ports",
  "guard_allowed",
  "notice_present",
  "requested_step",
  "committed_step",
  "route_tree_state",
]);

export const MUTATION_TARGETS = Object.freeze({
  "M3-P": ["T-P-01", "T-P-02", "T-P-03", "T-P-04"],
  "M3-B": ["T-B-01", "T-B-02"],
});

export const TARGET_STATES = Object.freeze(["supported", "refuted", "indeterminate"]);

const PROTECTED_ROOTS = Object.freeze([
  "projects/domainspec-v2/development/compound-domain-structure-calibration/evidence",
  "projects/domainspec-v2/development/ui-meta-type-repair",
  "projects/savvy_legal-studio-ai/frontend/savvy-legal-studio",
]);

export function validateBrowserSourceManifest(manifest, { runtimeHandle, targetSetHandle }) {
  requireObject(manifest, "browser source manifest");
  assertExactKeys(manifest, ["schema_version", "runtime_handle", "target_set_handle", "source_files", "translations", "protected_roots"], "browser source manifest");
  if (manifest.schema_version !== "cdsc.browser-source-manifest.v1") throw new TypeError("source manifest schema version mismatch");
  assertHandles(manifest, runtimeHandle, targetSetHandle);
  if (!Array.isArray(manifest.source_files) || manifest.source_files.length === 0) throw new TypeError("source manifest requires source files");
  const seenPaths = new Set();
  for (const source of manifest.source_files) {
    requireObject(source, "source file");
    assertExactKeys(source, ["path", "ranges", "raw_sha256"], "source file");
    if (!source.path.startsWith("projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/")) throw new TypeError("source path escapes Savvy boundary");
    if (seenPaths.has(source.path)) throw new TypeError("duplicate source path");
    seenPaths.add(source.path);
    requireDigest(source.raw_sha256, "source digest");
    if (!Array.isArray(source.ranges) || source.ranges.length === 0 || source.ranges.some((range) => !Array.isArray(range) || range.length !== 2 || range[0] < 1 || range[1] < range[0])) throw new TypeError("invalid source range");
  }
  if (!Array.isArray(manifest.translations) || manifest.translations.length === 0) throw new TypeError("source manifest requires translations");
  for (const translation of manifest.translations) {
    requireObject(translation, "translation");
    assertExactKeys(translation, ["source_selector", "generated_path", "adapter_kind"], "translation");
    if (!translation.generated_path.startsWith("harness/browser-baseline/")) throw new TypeError("generated translation path escapes harness");
    if (!["behavior-copy", "runtime-adapter", "render-adapter"].includes(translation.adapter_kind)) throw new TypeError("unknown translation adapter");
  }
  if (JSON.stringify(manifest.protected_roots) !== JSON.stringify(PROTECTED_ROOTS)) throw new TypeError("protected source roots mismatch");
  return true;
}

export function validateBrowserBaselineWitness(witness, { runtimeHandle, sourceManifestHandle }) {
  requireObject(witness, "browser baseline witness");
  assertExactKeys(witness, ["schema_version", "runtime_handle", "source_manifest_handle", "vectors", "supporting_screenshots", "replay_state"], "browser baseline witness");
  if (witness.schema_version !== "cdsc.browser-baseline-witness.v1") throw new TypeError("baseline witness schema version mismatch");
  if (witness.runtime_handle !== runtimeHandle) throw new TypeError("wrong runtime handle");
  if (witness.source_manifest_handle !== sourceManifestHandle) throw new TypeError("wrong source manifest handle");
  if (!Array.isArray(witness.vectors) || witness.vectors.length === 0) throw new TypeError("baseline witness requires total vectors");
  const vectorIds = new Set();
  for (const vector of witness.vectors) {
    requireObject(vector, "baseline vector");
    assertExactKeys(vector, ["vector_id", "expected", "observed", "comparison"], "baseline vector");
    if (typeof vector.vector_id !== "string" || vector.vector_id.length === 0 || vectorIds.has(vector.vector_id)) throw new TypeError("invalid or duplicate baseline vector");
    vectorIds.add(vector.vector_id);
    validateStructuredState(vector.expected);
    validateStructuredState(vector.observed);
    if (!['match', 'different'].includes(vector.comparison)) throw new TypeError("unknown baseline comparison");
  }
  validateScreenshots(witness.supporting_screenshots);
  if (witness.replay_state !== "identical") throw new TypeError("baseline replay must be identical");
  return true;
}

export function validateBrowserObservationReceipt(receipt, { runtimeHandle, sourceManifestHandle, baselineWitnessHandle, targetSetHandle }) {
  requireObject(receipt, "browser observation receipt");
  assertExactKeys(receipt, ["schema_version", "mutation_id", "runtime_handle", "source_manifest_handle", "baseline_witness_handle", "target_set_handle", "vector_results", "target_observations", "supporting_screenshots", "uncertainty"], "browser observation receipt");
  if (receipt.schema_version !== "cdsc.browser-observation-receipt.v1") throw new TypeError("observation schema version mismatch");
  const expectedTargets = MUTATION_TARGETS[receipt.mutation_id];
  if (!expectedTargets) throw new TypeError("unknown browser mutation");
  if (receipt.runtime_handle !== runtimeHandle) throw new TypeError("wrong runtime handle");
  if (receipt.source_manifest_handle !== sourceManifestHandle || receipt.baseline_witness_handle !== baselineWitnessHandle || receipt.target_set_handle !== targetSetHandle) throw new TypeError("observation input handle mismatch");
  if (!Array.isArray(receipt.vector_results) || receipt.vector_results.length === 0) throw new TypeError("screenshot-only evidence is invalid");
  for (const vector of receipt.vector_results) {
    requireObject(vector, "observation vector");
    assertExactKeys(vector, ["vector_id", "baseline", "mutant", "comparison"], "observation vector");
    if (typeof vector.vector_id !== "string" || vector.vector_id.length === 0) throw new TypeError("partial observation vector");
    validateStructuredState(vector.baseline);
    validateStructuredState(vector.mutant);
    if (!['match', 'different'].includes(vector.comparison)) throw new TypeError("unknown observation comparison");
  }
  if (!Array.isArray(receipt.target_observations) || receipt.target_observations.length !== expectedTargets.length) throw new TypeError("target observations are incomplete");
  for (let index = 0; index < expectedTargets.length; index += 1) {
    const observation = receipt.target_observations[index];
    requireObject(observation, "target observation");
    assertExactKeys(observation, ["target_id", "state", "evidence_fields"], "target observation");
    if (observation.target_id !== expectedTargets[index]) throw new TypeError("target observation order or identity mismatch");
    if (!TARGET_STATES.includes(observation.state)) throw new TypeError("unknown target observation state");
    if (!Array.isArray(observation.evidence_fields) || observation.evidence_fields.length === 0 || observation.evidence_fields.some((field) => !OBSERVABLE_FIELDS.includes(field))) throw new TypeError("unknown observable or empty evidence fields");
  }
  validateScreenshots(receipt.supporting_screenshots);
  if (!Array.isArray(receipt.uncertainty)) throw new TypeError("observation uncertainty must be an array");
  return true;
}

export function validateBrowserEditDiff(diff) {
  requireObject(diff, "browser edit diff");
  assertExactKeys(diff, ["schema_version", "mutation_id", "allowed_edit_surface", "changed_paths", "before_sha256", "after_sha256", "protected_roots_unchanged"], "browser edit diff");
  if (diff.schema_version !== "cdsc.browser-edit-diff.v1" || !MUTATION_TARGETS[diff.mutation_id]) throw new TypeError("edit diff schema or mutation mismatch");
  if (!Array.isArray(diff.allowed_edit_surface) || diff.allowed_edit_surface.length === 0 || !Array.isArray(diff.changed_paths) || diff.changed_paths.length === 0) throw new TypeError("edit diff requires declared paths");
  const allowed = new Set(diff.allowed_edit_surface);
  for (const path of [...diff.allowed_edit_surface, ...diff.changed_paths]) if (!path.startsWith("harness/browser-baseline/") || path.includes("..")) throw new TypeError("edit path escapes generated harness");
  if (diff.changed_paths.some((path) => !allowed.has(path))) throw new TypeError("edit leak outside allowed surface");
  requireDigest(diff.before_sha256, "before digest");
  requireDigest(diff.after_sha256, "after digest");
  if (diff.before_sha256 === diff.after_sha256) throw new TypeError("mutation edit must change bytes");
  if (diff.protected_roots_unchanged !== true) throw new TypeError("protected roots changed");
  return true;
}

export function validateStructuredState(state) {
  requireObject(state, "structured browser state");
  assertExactKeys(state, OBSERVABLE_FIELDS, "structured browser state");
  if (!Array.isArray(state.interaction_ports) || state.interaction_ports.some((port) => !["onNext", "onBack"].includes(port))) throw new TypeError("unknown interaction port");
  if (![true, false, null].includes(state.guard_allowed)) throw new TypeError("invalid guard state");
  if (typeof state.notice_present !== "boolean") throw new TypeError("invalid notice state");
  if (typeof state.committed_step !== "string" || state.committed_step.length === 0) throw new TypeError("partial structured browser state");
  if (!['mounted', 'unmounted'].includes(state.route_tree_state)) throw new TypeError("unknown route-tree state");
  return true;
}

function assertHandles(manifest, runtimeHandle, targetSetHandle) {
  if (manifest.runtime_handle !== runtimeHandle) throw new TypeError("wrong runtime handle");
  if (manifest.target_set_handle !== targetSetHandle) throw new TypeError("wrong target-set handle");
}

function validateScreenshots(values) {
  if (!Array.isArray(values)) throw new TypeError("supporting screenshots must be an array");
  for (const value of values) requireDigest(value, "supporting screenshot digest");
}

function requireDigest(value, label) {
  if (typeof value !== "string" || !/^sha256:[a-f0-9]{64}$/.test(value)) throw new TypeError(`${label} must be a SHA-256 digest`);
}

function assertExactKeys(value, expected, label) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) throw new TypeError(`${label} has unknown or missing field`);
}

function requireObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}
