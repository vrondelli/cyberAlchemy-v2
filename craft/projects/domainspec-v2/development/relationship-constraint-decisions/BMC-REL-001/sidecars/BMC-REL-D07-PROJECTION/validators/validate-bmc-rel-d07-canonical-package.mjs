#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const SIDE = 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D07-PROJECTION';
const paths = {
  parent: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md',
  definitions: 'projects/domainspec-v2/definitions/DEFINITIONS.md',
  index: 'projects/domainspec-v2/definitions/DEFINITIONS-INDEX.md',
  registry: 'projects/domainspec-v2/definitions/membership-kinds/membership-kinds.json',
  relationships: 'projects/domainspec-v2/definitions/relationships/relationships.yml',
  packet: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json',
  schema: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json',
  packetValidator: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs',
  contentsCandidate: `${SIDE}/candidates/BMC-REL-D07-P01-CONTENTS-DEFINITIONS-CANDIDATE.md`,
  contentsRequest: `${SIDE}/decision-gate/BMC-REL-D07-P01-CONTENTS-OPTION-ADMISSIBILITY-REQUEST.json`,
  contentsReceipt: `${SIDE}/decision-gate/BMC-REL-D07-P01-CONTENTS-OPTION-ADMISSIBILITY-RECEIPT.json`,
  contentsSelection: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-SELECTION-RECEIPT.json`,
  stagedDefinitions: `${SIDE}/staged/targets/projects/domainspec-v2/definitions/DEFINITIONS.md`,
  stagedIndex: `${SIDE}/staged/targets/projects/domainspec-v2/definitions/DEFINITIONS-INDEX.md`,
  stagedRegistry: `${SIDE}/staged/targets/projects/domainspec-v2/definitions/membership-kinds/membership-kinds.json`,
  manifest: `${SIDE}/staged/BMC-REL-D07-P01-CONTENTS-CANONICAL-PACKAGE-MANIFEST.json`,
  applyCandidate: `${SIDE}/candidates/BMC-REL-D07-P01-CONTENTS-APPLY-CANDIDATE.md`,
  applyRequest: `${SIDE}/decision-gate/BMC-REL-D07-P01-CONTENTS-APPLY-OPTION-ADMISSIBILITY-REQUEST.json`,
  applyReceipt: `${SIDE}/decision-gate/BMC-REL-D07-P01-CONTENTS-APPLY-OPTION-ADMISSIBILITY-RECEIPT.json`,
  applySelection: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-APPLY-SELECTION-RECEIPT.json`,
  atomicApply: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-ATOMIC-APPLY-RECEIPT.json`,
  defect: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-POST-APPLY-LINK-DEFECT-RECEIPT.json`,
  rollback: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-LINK-FAILURE-ROLLBACK-RECEIPT.json`,
  repairManifest: `${SIDE}/staged/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-MANIFEST.json`,
  repairReview: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-INDEPENDENT-REVIEW-BINDING.json`,
  repairRequest: `${SIDE}/decision-gate/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-OPTION-ADMISSIBILITY-REQUEST.json`,
  repairReceipt: `${SIDE}/decision-gate/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-OPTION-ADMISSIBILITY-RECEIPT.json`,
  repairValidator: `${SIDE}/validators/validate-bmc-rel-d07-link-repair-package.mjs`,
  repairSelection: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-SELECTION-RECEIPT.json`,
  repairApply: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-ATOMIC-APPLY-RECEIPT.json`,
  repairedDefinitions: `${SIDE}/staged/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR/targets/projects/domainspec-v2/definitions/DEFINITIONS.md`,
  repairedIndex: `${SIDE}/staged/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR/targets/projects/domainspec-v2/definitions/DEFINITIONS-INDEX.md`,
  repairedRegistry: `${SIDE}/staged/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR/targets/projects/domainspec-v2/definitions/membership-kinds/membership-kinds.json`,
  preparation: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-CANONICAL-PACKAGE-PREPARATION-RECEIPT.json`,
  validator: `${SIDE}/validators/validate-bmc-rel-d07-canonical-package.mjs`,
  readme: `${SIDE}/README.md`,
  decisions: `${SIDE}/decisions/BMC-REL-D07-PROJECTION-DECISIONS.md`
};

const expected = {
  [paths.relationships]: '82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1',
  [paths.packet]: 'a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0',
  [paths.schema]: 'd68616768f5018b1023481a6cb507f8fd1b4eb0df656b518bc101cd1315508e7',
  [paths.packetValidator]: '69681598b58529d64037335e6f47935cce769c79a95fc7140daa9f77dd74b975',
  [paths.contentsCandidate]: 'cd612231118dd8352bbc78921ba0d75c57284756d21fc28c008b2ecafe1c0afb',
  [paths.contentsRequest]: '8ff4bd8c5c504d968dd02bdf3ff948b119537fba448eff5c2b4444de17b4baf4',
  [paths.contentsReceipt]: '682beb6cbe08ebed7713a285efd3f37914f289db97f18f7f2b21bc763dde1df6',
  [paths.contentsSelection]: 'fa17a79ddedbd822b912a3c59eb90b79c9664b43d615009018042c7a41bc2b31',
  [paths.stagedDefinitions]: 'f075568feed8d9918762efe99bb228602da32b760ae7b023aad770187c70fb4a',
  [paths.stagedIndex]: 'd0c8032b45fb371d26b8b80eac9f9e576bec10a6ed2a63d275558212bc1a6bfb',
  [paths.stagedRegistry]: '854ff80f309e38f48f3f278d13d661983652b6809bf3f2bf0e06688b9bf37d5c',
  [paths.manifest]: 'e7b1753cb0abb0bd05d9709e309d52c2967c4ff4c5471f7a8e389bf8989f8269',
  [paths.applyCandidate]: '6331cf3056e959cd77abc7a60da2c676824548aa8c844ce72e37456a0f5c3859',
  [paths.applyRequest]: '45341c8115132667eb55c4b70c120f15c8859c11a7733120229a792c4605e0a5',
  [paths.applyReceipt]: '368748c34d35f9fdc5b7ece027342df3f594a62fdf92be4d8b2ea9c03fb2d4e4',
  [paths.applySelection]: '73b5184cf1b05b784900d876ac71b26bb3671f51c42d6229ec2fbe9c6b4c18fa',
  [paths.atomicApply]: '3d60a389966b194fbb193820d71d272bbb71a7f1d7f346f4b8b7d03c82d0282e',
  [paths.defect]: '923d54a2c2c34d5220ec985cdd5b4cffaf2b79276d8d69c507cb21537755dad6',
  [paths.rollback]: 'b71a2a7e23115e79e4213fdb5eb06f8a45eba4be17d22c30a7b51052974a2691',
  [paths.repairManifest]: 'c18bda5be46cdd9d2e366c5c12add44619f8f2fe38d93fd76f12040cd7b010dc',
  [paths.repairReview]: '0918bb72a0fd218494d715a74a26a52b6d39847bfa2133a90c72f8a51c1c0fd4',
  [paths.repairRequest]: '454b82dd478b365a066bf5fd4b1f1bfa2f62a8a536fba8c72d19cc9900185096',
  [paths.repairReceipt]: '407d8e48f0685a808cc493fa82a79263166753e2f52d5c0b5f8711ac69f199b1',
  [paths.repairSelection]: '2e2f3307442f740c0bc6199763e43c9c0ff4f1a83fe92027673f1f8700ab7a47',
  [paths.repairApply]: '9c7cfa75dc7f6cf027659e0130ba7ab62789239df8930abc8a7cd789e0dd47df',
  [paths.repairedDefinitions]: '92f31e0a888ff0e6bfadd6d0d79dbb7894b88c6ca435672ca57409989dd51bdf',
  [paths.repairedIndex]: 'd0c8032b45fb371d26b8b80eac9f9e576bec10a6ed2a63d275558212bc1a6bfb',
  [paths.repairedRegistry]: '854ff80f309e38f48f3f278d13d661983652b6809bf3f2bf0e06688b9bf37d5c'
};

const historicalPreimages = {
  [paths.definitions]: 'cdbe251015bb6387fe0283b4d058b4fa85b048b253c7e65845e43fd2170b6006',
  [paths.index]: 'ad41200bacb825bf11c009bfaef37f350beb3a307a55994ced42e194bc3fa744'
};

function assert(value, message) { if (!value) throw new Error(message); }
function file(rel) { return fs.readFileSync(path.join(ROOT, rel)); }
function text(rel) { return file(rel).toString('utf8'); }
function json(rel) { return JSON.parse(text(rel)); }
function sha(rel) { return crypto.createHash('sha256').update(file(rel)).digest('hex'); }
function canonicalDigest(value) {
  const normalized = (item) => Array.isArray(item) ? item.map(normalized) : item && typeof item === 'object'
    ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, normalized(item[key])])) : item;
  return crypto.createHash('sha256').update(JSON.stringify(normalized(value))).digest('hex');
}
function exact(actual, wanted, label) { assert(JSON.stringify(actual) === JSON.stringify(wanted), `${label} mismatch`); }

for (const [rel, digest] of Object.entries(expected)) assert(sha(rel) === digest, `bound-byte drift: ${rel}`);
const atomicApplyStatus = fs.existsSync(path.join(ROOT, paths.atomicApply))
  ? json(paths.atomicApply).status
  : null;
const applied = atomicApplyStatus === 'applied-byte-identical';
const rolledBack = atomicApplyStatus === 'rolled-back-after-acceptance-critical-link-failure';
const repairApplied = fs.existsSync(path.join(ROOT, paths.repairApply))
  && json(paths.repairApply).status === 'applied-byte-identical-canonical-validation-pass';
const canonicalApplied = applied || repairApplied;
if (repairApplied) {
  assert(sha(paths.definitions) === expected[paths.repairedDefinitions], 'repaired canonical definitions drift');
  assert(sha(paths.index) === expected[paths.repairedIndex], 'repaired canonical index drift');
  assert(fs.existsSync(path.join(ROOT, paths.registry)), 'repaired canonical membership registry missing');
  assert(sha(paths.registry) === expected[paths.repairedRegistry], 'repaired canonical registry drift');
} else if (applied) {
  assert(sha(paths.definitions) === expected[paths.stagedDefinitions], 'applied definitions postimage drift');
  assert(sha(paths.index) === expected[paths.stagedIndex], 'applied index postimage drift');
  assert(fs.existsSync(path.join(ROOT, paths.registry)), 'applied canonical membership registry missing');
  assert(sha(paths.registry) === expected[paths.stagedRegistry], 'applied registry postimage drift');
} else {
  assert(sha(paths.definitions) === historicalPreimages[paths.definitions], 'canonical definitions preimage is stale');
  assert(sha(paths.index) === historicalPreimages[paths.index], 'canonical index preimage is stale');
  assert(!fs.existsSync(path.join(ROOT, paths.registry)), 'canonical membership registry exists before apply receipt');
}

const selection = json(paths.contentsSelection);
assert(selection.decision === 'selected', 'contents selection decision drift');
assert(selection.selected_option_id === 'BMC-REL-D07-P01-CONTENTS-A-MINIMAL-TWO-KIND', 'contents selected option drift');
assert(selection.owner_response === 'A' && selection.decided_by === 'user', 'contents owner source drift');
assert(selection.decided_at === '2026-08-23T16:58:14+01:00', 'contents owner timestamp drift');
assert(selection.candidate_sha256 === expected[paths.contentsCandidate], 'contents candidate binding drift');
assert(selection.request_sha256 === expected[paths.contentsRequest], 'contents request binding drift');
assert(selection.request_digest === 'b1db2f8f3c4f5afa97e1e06ab9a19a6104fdfbf8c9d5da4de66a8eb9aff2ce47', 'contents request digest drift');
assert(selection.receipt_sha256 === expected[paths.contentsReceipt], 'contents receipt binding drift');
exact(selection.active_ids, ['classification', 'home-assignment'], 'selected active IDs');
assert(selection.canonical_authority_effect === 'none', 'selection receipt authority growth');

const manifest = json(paths.manifest);
assert(manifest.package_id === 'BMC-REL-D07-P01-CONTENTS-CANONICAL-PACKAGE', 'manifest package ID drift');
assert(manifest.definition_id === 'domainspec-v2-D30', 'manifest definition ID drift');
assert(manifest.registry_id === 'domainspec-v2.membership-kinds', 'manifest registry ID drift');
exact(manifest.active_ids, ['classification', 'home-assignment'], 'manifest active IDs');
assert(manifest.authority_effect === 'none-until-exact-owner-acceptance-and-separate-apply', 'manifest authority effect drift');
const targetExpectation = [
  [paths.definitions, paths.stagedDefinitions, 'update', historicalPreimages[paths.definitions], expected[paths.stagedDefinitions]],
  [paths.index, paths.stagedIndex, 'update', historicalPreimages[paths.index], expected[paths.stagedIndex]],
  [paths.registry, paths.stagedRegistry, 'create', null, expected[paths.stagedRegistry]]
];
assert(manifest.targets.length === targetExpectation.length, 'manifest target count drift');
for (let i = 0; i < targetExpectation.length; i += 1) {
  const [target, staged, operation, preimage, postimage] = targetExpectation[i];
  const item = manifest.targets[i];
  assert(item.path === target && item.staged_path === staged && item.operation === operation, `manifest target ${i} identity drift`);
  assert(item.preimage_sha256 === preimage && item.postimage_sha256 === postimage, `manifest target ${i} digest drift`);
}

const canonicalDefinitions = text(paths.definitions);
const stagedDefinitions = text(paths.stagedDefinitions);
const d30Marker = '## domainspec-v2-D30. Membership Kind Registry';
assert((stagedDefinitions.match(/## domainspec-v2-D30\. Membership Kind Registry/g) ?? []).length === 1, 'staged definitions must contain exactly one D30 card');
const d30 = stagedDefinitions.split(d30Marker)[1]?.split('\n## domainspec-v2-D28.')[0] ?? '';
assert((d30.match(/Formal voice:/g) ?? []).length === 3, 'D30 formal voice count drift');
assert((d30.match(/Plain-language voice:/g) ?? []).length === 3, 'D30 plain-language voice count drift');
assert((d30.match(/DomainSpec-context voice:/g) ?? []).length === 3, 'D30 DomainSpec-context voice count drift');
for (const phrase of [
  'K_active = { classification, home-assignment }',
  'Both fail closed',
  'There is no existence condition',
  'The generic prose word `membership` and the unselected `collection-membership` design label are not active IDs',
  'independent from canonical `owns`',
  'P02 typed representation and executable validation require'
]) assert(d30.includes(phrase), `D30 boundary missing: ${phrase}`);
assert(canonicalDefinitions.includes('## DS-D8 — Relationship Signature Authority'), 'canonical DS-D8 heading missing');
assert(canonicalDefinitions.includes('## domainspec-v2-D18. relationship non-collapse test'), 'canonical D18 heading missing');
if (rolledBack) {
  assert(d30.includes('](#ds-d8-relationship-catalogue-v09)'), 'historical D30 DS-D8 stale anchor evidence drift');
  assert(d30.includes('](#domainspec-v2-d18-relationship-definition-contract)'), 'historical D30 D18 stale anchor evidence drift');
  assert(!d30.includes('](#ds-d8--relationship-signature-authority)'), 'historical package silently contains repaired DS-D8 anchor');
  assert(!d30.includes('](#domainspec-v2-d18-relationship-non-collapse-test)'), 'historical package silently contains repaired D18 anchor');

  const atomicApply = json(paths.atomicApply);
  const defect = json(paths.defect);
  const rollback = json(paths.rollback);
  const repairManifest = json(paths.repairManifest);
  const repairReceipt = json(paths.repairReceipt);
  assert(atomicApply.canonical_validation.status === 'failed-governance-link-integrity', 'historical link failure status drift');
  assert(atomicApply.rollback.status === 'complete-exact-preimages-restored', 'historical rollback status drift');
  assert(defect.classification === 'governance-only-acceptance-bound-link-integrity-defect', 'historical defect classification drift');
  assert(defect.renewed_owner_acceptance_required === true, 'historical defect no longer requires renewed acceptance');
  assert(rollback.status === 'complete-exact-pre-attempt-state-restored', 'exact rollback receipt status drift');
  assert(rollback.pre_rollback_verification.all_equal_accepted_postimages === true, 'historical accepted postimage proof drift');
  assert(rollback.partial_state_observed === false, 'historical rollback reports partial state');
  assert(repairManifest.defect_receipt.sha256 === expected[paths.defect], 'fresh repair defect binding drift');
  assert(repairManifest.rollback_receipt.sha256 === expected[paths.rollback], 'fresh repair rollback binding drift');
  assert(repairManifest.repair_delta_from_prior_accepted_package.prior_definitions_sha256 === expected[paths.stagedDefinitions], 'fresh repair prior-package binding drift');
  assert(repairManifest.repair_delta_from_prior_accepted_package.other_byte_changes === 0, 'fresh repair contains unbound byte changes');
  assert(repairReceipt.requestDigest === canonicalDigest(json(paths.repairRequest)), 'fresh repair request digest mismatch');
  assert(repairReceipt.routeOutcome === 'gate' && repairReceipt.decisionGateRequired === true, 'fresh repair owner gate drift');
} else {
  assert(d30.includes('](#ds-d8--relationship-signature-authority)'), 'D30 DS-D8 link anchor drift');
  assert(d30.includes('](#domainspec-v2-d18-relationship-non-collapse-test)'), 'D30 D18 link anchor drift');
}
assert(fs.existsSync(path.join(ROOT, paths.contentsSelection)), 'D30 selection evidence target missing');
assert(fs.existsSync(path.join(ROOT, paths.registry)) === canonicalApplied, 'D30 registry link target lifecycle mismatch');
const withoutD30 = stagedDefinitions.replace(/\n## domainspec-v2-D30\. Membership Kind Registry[\s\S]*?(?=\n## domainspec-v2-D28\.)/, '');
if (repairApplied) assert(file(paths.repairedDefinitions).equals(file(paths.definitions)), 'repaired definitions are not byte-identical in canonical location');
else if (applied) assert(stagedDefinitions === canonicalDefinitions, 'applied definitions are not byte-identical to staged definitions');
else assert(withoutD30 === canonicalDefinitions, 'staged definitions contain changes beyond the exact D30 insertion');

const canonicalIndex = text(paths.index);
const stagedIndex = text(paths.stagedIndex);
const d30Row = '| `domainspec-v2-D30` | Membership Kind Registry | active | domain-vocabulary; D07 P01 contents owner-selected registry | [DEFINITIONS.md#domainspec-v2-d30](./DEFINITIONS.md) · [registry](./membership-kinds/membership-kinds.json) |';
assert((stagedIndex.match(/`domainspec-v2-D30`/g) ?? []).length === 1 && stagedIndex.includes(d30Row), 'staged index D30 row drift');
if (repairApplied) assert(file(paths.repairedIndex).equals(file(paths.index)), 'repaired index is not byte-identical in canonical location');
else if (applied) assert(stagedIndex === canonicalIndex, 'applied index is not byte-identical to staged index');
else assert(stagedIndex.replace(`${d30Row}\n`, '') === canonicalIndex, 'staged index contains changes beyond the exact D30 row');

function registryErrors(value) {
  const errors = [];
  if (value.schema_version !== '1.0.0') errors.push('schema-version');
  if (value.registry_id !== 'domainspec-v2.membership-kinds') errors.push('registry-id');
  if (value.definition_id !== 'domainspec-v2-D30') errors.push('definition-id');
  if (JSON.stringify(value.active_ids) !== JSON.stringify(['classification', 'home-assignment'])) errors.push('active-ids');
  if (new Set(value.active_ids ?? []).size !== (value.active_ids ?? []).length) errors.push('duplicate-id');
  return errors;
}
const registry = json(canonicalApplied ? paths.registry : paths.stagedRegistry);
exact(registryErrors(registry), [], 'positive registry probe');
for (const hostile of [
  { ...registry, active_ids: ['classification', 'classification'] },
  { ...registry, active_ids: ['classification', 'home-assignment', 'membership'] },
  { ...registry, active_ids: ['classification', 'home-assignment', 'collection-membership'] },
  { ...registry, registry_id: 'domainspec-v2.ownership-dimensions' }
]) assert(registryErrors(hostile).length > 0, 'hostile registry probe unexpectedly passed');

const request = json(paths.applyRequest);
const receipt = json(paths.applyReceipt);
assert(request.decisionId === 'BMC-REL-D07-P01-CONTENTS-APPLY', 'apply gate decision ID drift');
assert(receipt.requestDigest === canonicalDigest(request), 'apply request canonical digest mismatch');
assert(receipt.routeOutcome === 'gate' && receipt.decisionGateRequired, 'apply route must remain owner gate');
const admissible = [
  'BMC-REL-D07-P01-CONTENTS-APPLY-A-APPLY-EXACT-CANONICAL-PACKAGE',
  'BMC-REL-D07-P01-CONTENTS-APPLY-B-DEFER-EXACT-PACKAGE',
  'BMC-REL-D07-P01-CONTENTS-APPLY-C-STOP-PROJECTION'
].sort();
const rejected = [
  'BMC-REL-D07-P01-CONTENTS-APPLY-D-PARTIAL-PACKAGE',
  'BMC-REL-D07-P01-CONTENTS-APPLY-E-STALE-PREIMAGE',
  'BMC-REL-D07-P01-CONTENTS-APPLY-F-MODIFIED-OR-SUBSTITUTED-BYTES',
  'BMC-REL-D07-P01-CONTENTS-APPLY-G-APPLY-AND-P02'
].sort();
exact(receipt.admissibleOptionIds, admissible, 'apply admissible options');
exact(receipt.presentedOptionIds, admissible, 'apply presented options');
exact(receipt.rejectedOptions.map((item) => item.optionId).sort(), rejected, 'apply rejected options');
const action = request.candidates.find((item) => item.optionId === admissible[0]);
assert(action.hazardClass === 'authority' && action.ownerGate === 'definitions-governance:owner-acceptance', 'apply action owner gate drift');
const applyCandidate = text(paths.applyCandidate);
for (const phrase of [expected[paths.manifest], expected[paths.stagedDefinitions], expected[paths.stagedIndex], expected[paths.stagedRegistry], 'decision_effect: none']) {
  assert(applyCandidate.includes(phrase), `apply candidate binding missing: ${phrase}`);
}

const preparation = json(paths.preparation);
assert(preparation.status === 'blocked-exact-owner-acceptance-gate', 'preparation status drift');
assert(preparation.authority_effect === 'none' && preparation.decision_effect === 'none', 'preparation authority growth');
assert(preparation.owner_gate.request_digest === receipt.requestDigest && preparation.owner_gate.selected_option_id === null, 'preparation owner gate drift');
for (const artifact of preparation.artifacts) {
  assert(fs.existsSync(path.join(ROOT, artifact.path)), `preparation artifact missing: ${artifact.path}`);
  if (artifact.role !== 'package-validator') assert(sha(artifact.path) === artifact.sha256, `immutable preparation artifact digest drift: ${artifact.path}`);
}

if (applied) {
  const applySelection = json(paths.applySelection);
  assert(applySelection.decision === 'selected', 'apply selection decision drift');
  assert(applySelection.selected_option_id === 'BMC-REL-D07-P01-CONTENTS-APPLY-A-APPLY-EXACT-CANONICAL-PACKAGE', 'apply selected option drift');
  assert(applySelection.owner_response === 'A' && applySelection.decided_by === 'user', 'apply owner source drift');
  assert(applySelection.decided_at === '2026-08-23T17:41:04+01:00', 'apply owner timestamp drift');
  assert(applySelection.candidate_sha256 === expected[paths.applyCandidate], 'apply selection candidate binding drift');
  assert(applySelection.request_sha256 === expected[paths.applyRequest], 'apply selection request binding drift');
  assert(applySelection.request_digest === receipt.requestDigest, 'apply selection request digest drift');
  assert(applySelection.receipt_sha256 === expected[paths.applyReceipt], 'apply selection receipt binding drift');
  assert(applySelection.manifest_sha256 === expected[paths.manifest], 'apply selection manifest binding drift');
  const atomicApply = json(paths.atomicApply);
  assert(atomicApply.status === 'applied-byte-identical', 'atomic apply status drift');
  assert(atomicApply.authority_effect === 'canonical-domain-vocabulary-only', 'atomic apply authority effect drift');
  assert(atomicApply.owner_binding.selection_receipt_sha256 === expected[paths.applySelection], 'atomic apply selection binding drift');
  assert(atomicApply.manifest.sha256 === expected[paths.manifest], 'atomic apply manifest binding drift');
  assert(atomicApply.partial_state_observed === false, 'atomic apply reports partial state');
  for (const target of atomicApply.targets) {
    const manifestTarget = manifest.targets.find((item) => item.path === target.path);
    assert(manifestTarget, `atomic apply target absent from manifest: ${target.path}`);
    assert(target.preimage_sha256 === manifestTarget.preimage_sha256 && target.postimage_sha256 === manifestTarget.postimage_sha256, `atomic apply target binding drift: ${target.path}`);
    assert(target.staged_byte_equal === true, `atomic apply target lacks staged byte equality: ${target.path}`);
  }
}

const parent = text(paths.parent);
assert(parent.includes(repairApplied
  ? 'D07 repaired canonical vocabulary applied'
  : applied
  ? 'D07 canonical membership vocabulary applied'
  : rolledBack
    ? 'D07 definitions link repair owner gate open'
    : 'D07 projection package acceptance pending'), 'parent D07 lifecycle status missing');
assert(parent.includes('BMC-REL-D07-P01-CONTENTS-A-MINIMAL-TWO-KIND'), 'parent contents selection missing');
assert(parent.includes('bc274e58c4cb412d7bd9f865eda92920d9d92c5376e0f04385fc5953773fff6b'), 'parent apply gate digest missing');
for (const rel of [paths.readme, paths.decisions]) {
  const value = text(rel);
  assert(value.includes('BMC-REL-D07-P01-CONTENTS-A-MINIMAL-TWO-KIND'), `${rel} contents selection missing`);
  assert(value.includes('BMC-REL-D07-P01-CONTENTS-APPLY'), `${rel} apply gate missing`);
}

for (const rel of [...Object.keys(expected), paths.definitions, paths.index, ...(canonicalApplied ? [paths.registry] : []), paths.preparation, paths.validator, paths.readme, paths.decisions, paths.parent]) {
  const value = file(rel);
  assert(value.at(-1) === 0x0a, `missing final newline: ${rel}`);
  assert(!value.includes(0x0d) && !value.includes(0x09), `CR or tab found: ${rel}`);
  assert(value.toString('utf8').split('\n').every((line) => !/[ ]+$/.test(line)), `trailing whitespace: ${rel}`);
}

if (!canonicalApplied) {
  for (const forbidden of [
    `${SIDE}/candidates/BMC-REL-D07-P02-PACKET-REPRESENTATION-CANDIDATE.md`,
    `${SIDE}/decision-gate/BMC-REL-D07-P02-OPTION-ADMISSIBILITY-REQUEST.json`,
    `${SIDE}/decision-gate/BMC-REL-D07-P02-OPTION-ADMISSIBILITY-RECEIPT.json`
  ]) assert(!fs.existsSync(path.join(ROOT, forbidden)), `P02 artifact exists before accepted canonical apply: ${forbidden}`);
}

console.log(JSON.stringify({
  package_id: manifest.package_id,
  result: 'pass',
  selection: selection.selected_option_id,
  definition_id: manifest.definition_id,
  registry_id: manifest.registry_id,
  active_ids: manifest.active_ids,
  target_count: manifest.targets.length,
  request_digest: receipt.requestDigest,
  route_outcome: receipt.routeOutcome,
  positive_probes: 1,
  hostile_probes: 4,
  link_checks: 6,
  historical_link_defect_bound: rolledBack,
  canonical_authority_effect: canonicalApplied ? 'canonical-domain-vocabulary-only' : 'none',
  apply_phase: repairApplied ? 'repaired-package-applied' : applied ? 'applied' : rolledBack ? 'historical-defect-rolled-back' : 'pre-apply',
  p02_status: canonicalApplied ? 'selected-and-applied' : 'blocked'
}, null, 2));
