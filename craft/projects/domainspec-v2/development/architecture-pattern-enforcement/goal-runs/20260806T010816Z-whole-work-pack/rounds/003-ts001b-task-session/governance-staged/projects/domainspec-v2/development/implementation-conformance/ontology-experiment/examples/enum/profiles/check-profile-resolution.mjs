import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDirectory = dirname(fileURLToPath(import.meta.url));
const experimentRoot = resolve(
  process.env.DOMAINSPEC_PROFILE_EXPERIMENT_ROOT
    ?? join(fixtureDirectory, "../../.."),
);
const profileDirectory = join(experimentRoot, "profiles");
const repositoryRoot = resolve(experimentRoot, "../../../../..");
const casesPath = join(fixtureDirectory, "cases.json");
const expectedPath = join(fixtureDirectory, "evaluations.expected.json");
const activationCasesPath = join(fixtureDirectory, "activation-cases.json");
const activationExpectedPath = join(fixtureDirectory, "activation-evaluations.expected.json");
const decisionPath = join(
  repositoryRoot,
  "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/decisions/typescript-representation.json",
);
const providerReceiptPath = join(
  repositoryRoot,
  "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ENUM-TS-001A.json",
);
const providerPath = join(
  repositoryRoot,
  "projects/domainspec-v2/impl/architecture-conformance/typescript/runtime/enum/index.ts",
);

const stable = (value) => {
  if (Array.isArray(value)) {
    return value.map(stable);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, stable(nested)]),
    );
  }
  return value;
};

const canonical = (value) => JSON.stringify(stable(value));
const uniqueSorted = (values) => [...new Set(values)].sort();

const loadJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const digest = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");

const profileFiles = [
  "base-domain.profile.json",
  "typescript-strict.profile.json",
  "python-strict.profile.json",
  "rust-strict.profile.json",
];

const realProfiles = await Promise.all(
  profileFiles.map(async (name) => ({
    name,
    profile: await loadJson(join(profileDirectory, name)),
  })),
);
const casesDocument = await loadJson(casesPath);
const expectedDocument = await loadJson(expectedPath);
const activationCasesDocument = await loadJson(activationCasesPath);
const activationExpectedDocument = await loadJson(activationExpectedPath);
const decisionDocument = await loadJson(decisionPath);
const providerReceiptDocument = await loadJson(providerReceiptPath);

const idByFile = new Map(realProfiles.map(({ name, profile }) => [name, profile.profile_id]));
const profiles = new Map();

for (const { profile } of realProfiles) {
  const normalizedParents = (profile.extends ?? []).map((parent) => {
    const filename = parent.replace(/^\.\//, "");
    return idByFile.get(filename) ?? parent;
  });
  profiles.set(profile.profile_id, { ...profile, extends: normalizedParents });
}
for (const profile of casesDocument.synthetic_profiles ?? []) {
  profiles.set(profile.profile_id, profile);
}

const fail = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const validateRealMechanism = () => {
  const base = profiles.get("architecture.base-domain");
  const contracts = base.representation_contracts ?? [];
  fail(contracts.length === 1, "base profile must define exactly one representation contract");
  const contract = contracts[0];
  fail(contract.contract_id === "enum.profile-representation", "unexpected Enum contract id");
  fail(contract.meaning_scope === "profile-local", "representation meaning must remain profile-local");
  fail(contract.canonical_effect === "none", "representation contract must have no canonical effect");
  fail(contract.selection_mode === "external-owner-decision", "base selection must remain owner-routed");
  fail(contract.missing_decision_outcome === "unselected", "missing decisions must remain typed as unselected");
  fail(contract.language_mismatch_outcome === "unsupported", "language mismatch must remain typed as unsupported");
  fail(contract.conflict_policy === "block", "representation conflict policy must block");

  const enumConstraintIds = uniqueSorted(
    (base.constraints ?? [])
      .filter((constraint) => (constraint.applies_to ?? []).includes("architecture.EnumImplementation"))
      .map((constraint) => constraint.constraint_id),
  );
  fail(
    canonical(uniqueSorted(contract.portable_constraint_ids ?? [])) === canonical(enumConstraintIds),
    "representation contract must name every portable Enum constraint exactly once",
  );

  for (const language of ["typescript", "python", "rust"]) {
    const profile = profiles.get(`architecture.${language}-strict`);
    const overlays = profile.representation_overlays ?? [];
    fail(overlays.length === 1, `${language} profile must define exactly one representation overlay`);
    const overlay = overlays[0];
    fail(overlay.contract_id === contract.contract_id, `${language} overlay contract mismatch`);
    fail(overlay.language === language, `${language} overlay language mismatch`);
    const expectedSelectionMode = language === "typescript"
      ? "owner-decision-and-provider-digest"
      : "external-owner-decision";
    fail(overlay.selection_mode === expectedSelectionMode, `${language} overlay selection mode mismatch`);
    fail(overlay.owner_route === `${language}-architecture-profile-owner`, `${language} owner route mismatch`);
    const admittedCount = language === "typescript" ? 1 : 0;
    const unsupportedCount = language === "typescript" ? 7 : 0;
    const representationConstraintCount = language === "typescript" ? 2 : 0;
    fail((overlay.admitted_forms ?? []).length === admittedCount, `${language} admitted form count mismatch`);
    fail((overlay.rejected_forms ?? []).length === 0, `${language} must not reject a concrete representation in W0`);
    fail((overlay.unsupported_forms ?? []).length === unsupportedCount, `${language} unsupported form count mismatch`);
    fail((overlay.representation_constraints ?? []).length === representationConstraintCount, `${language} representation constraint count mismatch`);
  }

  const typescriptOverlay = profiles
    .get("architecture.typescript-strict")
    .representation_overlays[0];
  const candidateProtocols = typescriptOverlay.candidate_protocols ?? [];
  fail(candidateProtocols.length === 1, "TypeScript must declare exactly one candidate protocol");
  const candidate = candidateProtocols[0];
  fail(candidate.protocol_id === "typescript.owned-const-object-enum/v1", "unexpected TypeScript candidate protocol id");
  fail(candidate.form_id === "typescript.owned-const-object-enum", "unexpected TypeScript candidate form id");
  fail(candidate.status === "active", "TypeScript candidate protocol must be active after TS001B");
  fail(candidate.runtime_provider.provider_sha256 === "378e09358713b431e4a24e664e484feae0122462e47aabfa653ae21a17315fcc", "TypeScript provider digest mismatch");
  fail(candidate.runtime_provider.digest_policy === "required-before-profile-activation", "TypeScript provider digest gate missing");
  fail(
    canonical(candidate.runtime_provider.required_exports) === canonical(["defineEnum", "composeEnum", "EnumValue"]),
    "TypeScript candidate must bind the exact three-symbol protocol",
  );
  fail(candidate.composition_contract.identity === "provider-symbol-identity", "composition must use provider symbol identity");
  fail(candidate.composition_contract.arguments === "named-bound-protocol-symbols-only", "composition arguments must be named bound protocol symbols");
  fail(candidate.composition_contract.order_semantics === "none", "composition order must not become Enum meaning");
  fail(candidate.member_contract.runtime_freeze === "required", "candidate runtime freeze proof must be required");
};

const conflict = (code, details) => {
  const error = new Error(code);
  error.code = code;
  error.details = details;
  throw error;
};

const protocolId = "typescript.owned-const-object-enum/v1";
const formId = "typescript.owned-const-object-enum";
const providerModulePath = "projects/domainspec-v2/impl/architecture-conformance/typescript/runtime/enum/index.ts";
const decisionRefPath = "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/decisions/typescript-representation.json";
const providerReceiptRefPath = "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ENUM-TS-001A.json";
const clone = (value) => JSON.parse(JSON.stringify(value));

const liveEvidence = {
  decision_sha256: await digest(decisionPath),
  provider_receipt_sha256: await digest(providerReceiptPath),
  provider_sha256: await digest(providerPath),
};

const validateActivationBinding = (overlay) => {
  const binding = overlay.activation_binding;
  const candidate = (overlay.candidate_protocols ?? [])[0];
  if (binding?.decision_ref?.path === undefined || binding.decision_ref.sha256 === undefined) {
    conflict("PROFILE_DECISION_REF_MISSING", {});
  }
  if (
    binding.decision_ref.path !== decisionRefPath
    || binding.decision_ref.sha256 !== liveEvidence.decision_sha256
  ) {
    conflict("PROFILE_DECISION_DIGEST_STALE", {path: binding.decision_ref.path});
  }
  if (
    binding?.provider_receipt_ref?.path === undefined
    || binding.provider_receipt_ref.sha256 === undefined
  ) {
    conflict("PROFILE_PROVIDER_RECEIPT_REF_MISSING", {});
  }
  if (
    binding.provider_receipt_ref.path !== providerReceiptRefPath
    || binding.provider_receipt_ref.sha256 !== liveEvidence.provider_receipt_sha256
  ) {
    conflict("PROFILE_PROVIDER_RECEIPT_DIGEST_STALE", {path: binding.provider_receipt_ref.path});
  }
  if (candidate?.runtime_provider?.provider_sha256 == null) {
    conflict("PROFILE_PROVIDER_DIGEST_MISSING", {});
  }
  if (candidate.runtime_provider.provider_sha256 !== liveEvidence.provider_sha256) {
    conflict("PROFILE_PROVIDER_DIGEST_STALE", {});
  }
  if (candidate.runtime_provider.module_path !== providerModulePath) {
    conflict("PROFILE_PROVIDER_PATH_MISMATCH", {path: candidate.runtime_provider.module_path});
  }
  if (
    binding.protocol_id !== protocolId
    || candidate.protocol_id !== protocolId
    || decisionDocument.selected_protocol?.protocol_id !== protocolId
    || providerReceiptDocument.acceptance_accounting?.protocol_id !== protocolId
  ) {
    conflict("PROFILE_PROTOCOL_MISMATCH", {});
  }
  if (
    decisionDocument.selected_protocol?.module_path !== providerModulePath
    || providerReceiptDocument.acceptance_accounting?.provider_source?.path !== providerModulePath
    || providerReceiptDocument.acceptance_accounting?.provider_source?.sha256 !== liveEvidence.provider_sha256
  ) {
    conflict("PROFILE_PROVIDER_PATH_MISMATCH", {});
  }
  return candidate;
};

const mutateOverlay = (source, mutation) => {
  const overlay = clone(source);
  const candidate = overlay.candidate_protocols[0];
  if (mutation === "missing-decision-ref") delete overlay.activation_binding.decision_ref;
  if (mutation === "stale-decision-digest") overlay.activation_binding.decision_ref.sha256 = "0".repeat(64);
  if (mutation === "missing-provider-receipt-ref") delete overlay.activation_binding.provider_receipt_ref;
  if (mutation === "stale-provider-receipt-digest") overlay.activation_binding.provider_receipt_ref.sha256 = "0".repeat(64);
  if (mutation === "missing-provider-digest") candidate.runtime_provider.provider_sha256 = null;
  if (mutation === "stale-provider-digest") candidate.runtime_provider.provider_sha256 = "0".repeat(64);
  if (mutation === "wrong-provider-path") candidate.runtime_provider.module_path = "fixture/wrong-provider.ts";
  if (mutation === "wrong-protocol") overlay.activation_binding.protocol_id = "fixture.wrong/v1";
  return overlay;
};

const evaluateActivationCase = (testCase, sourceOverlay) => {
  try {
    const overlay = mutateOverlay(sourceOverlay, testCase.mutation);
    const candidate = validateActivationBinding(overlay);
    if (testCase.operation === "validate-binding") {
      return {case_id: testCase.case_id, status: "ok", outcome: "binding-valid"};
    }
    const admitted = (overlay.admitted_forms ?? []).includes(testCase.requested_form);
    if (admitted) {
      return {
        case_id: testCase.case_id,
        status: "ok",
        outcome: "selected",
        selected_form: testCase.requested_form,
        protocol_id: candidate.protocol_id,
      };
    }
    return {
      case_id: testCase.case_id,
      status: "ok",
      outcome: "unsupported",
      selected_form: null,
      protocol_id: null,
    };
  } catch (error) {
    return {
      case_id: testCase.case_id,
      status: "blocked",
      error_code: error.code ?? "PROFILE_ACTIVATION_INTERNAL_ERROR",
    };
  }
};

const mergeByKey = (target, values, keyOf, conflictCode) => {
  for (const value of values) {
    const key = keyOf(value);
    const prior = target.get(key);
    if (prior !== undefined && canonical(prior) !== canonical(value)) {
      conflict(conflictCode, { key });
    }
    target.set(key, prior ?? value);
  }
};

const resolveProfile = (profileId, trail = []) => {
  const profile = profiles.get(profileId);
  if (profile === undefined) {
    conflict("PROFILE_PARENT_NOT_FOUND", { profile_id: profileId });
  }
  const cycleAt = trail.indexOf(profileId);
  if (cycleAt !== -1) {
    conflict("PROFILE_INHERITANCE_CYCLE", { cycle: [...trail.slice(cycleAt), profileId] });
  }

  const constraints = new Map();
  const contracts = new Map();
  const overlays = new Map();
  const languages = new Set();

  for (const parentId of profile.extends ?? []) {
    const parent = resolveProfile(parentId, [...trail, profileId]);
    mergeByKey(constraints, parent.constraints, (item) => item.constraint_id, "PROFILE_CONSTRAINT_CONFLICT");
    mergeByKey(contracts, parent.contracts, (item) => item.contract_id, "REPRESENTATION_CONTRACT_CONFLICT");
    mergeByKey(
      overlays,
      parent.overlays,
      (item) => `${item.contract_id}:${item.language}`,
      "REPRESENTATION_DECISION_CONFLICT",
    );
    for (const language of parent.languages) {
      languages.add(language);
    }
  }

  if (profile.language !== undefined && profile.language !== "portable") {
    languages.add(profile.language);
  }
  if (languages.size > 1) {
    conflict("PROFILE_LANGUAGE_PARENT_CONFLICT", { languages: uniqueSorted([...languages]) });
  }

  mergeByKey(constraints, profile.constraints ?? [], (item) => item.constraint_id, "PROFILE_CONSTRAINT_CONFLICT");
  mergeByKey(contracts, profile.representation_contracts ?? [], (item) => item.contract_id, "REPRESENTATION_CONTRACT_CONFLICT");
  mergeByKey(
    overlays,
    profile.representation_overlays ?? [],
    (item) => `${item.contract_id}:${item.language}`,
    "REPRESENTATION_DECISION_CONFLICT",
  );

  return {
    constraints: [...constraints.values()],
    contracts: [...contracts.values()],
    overlays: [...overlays.values()],
    languages: [...languages],
  };
};

const evaluateCase = (testCase) => {
  try {
    const resolved = resolveProfile(testCase.profile_id);
    const contract = resolved.contracts.find((candidate) =>
      (candidate.applies_to ?? []).includes(testCase.target_type));
    const portableIds = contract === undefined
      ? []
      : uniqueSorted(
        resolved.constraints
          .filter((constraint) =>
            (contract.portable_constraint_ids ?? []).includes(constraint.constraint_id)
            && (constraint.applies_to ?? []).includes(testCase.target_type))
          .map((constraint) => constraint.constraint_id),
      );

    if (contract === undefined) {
      return {
        case_id: testCase.case_id,
        status: "ok",
        outcome: "not-applicable",
        owner_route: null,
        selected_form: null,
        resolved_constraint_count: resolved.constraints.length,
        active_portable_constraint_ids: [],
        active_representation_constraint_ids: [],
      };
    }

    const activeLanguage = resolved.languages[0] ?? null;
    const languageOverlay = resolved.overlays.find((candidate) =>
      candidate.contract_id === contract.contract_id
      && candidate.language === testCase.requested_language);
    const activeOverlay = resolved.overlays.find((candidate) =>
      candidate.contract_id === contract.contract_id
      && candidate.language === activeLanguage);

    if (activeLanguage !== null && activeLanguage !== testCase.requested_language) {
      return {
        case_id: testCase.case_id,
        status: "ok",
        outcome: contract.language_mismatch_outcome,
        owner_route: activeOverlay?.owner_route ?? contract.owner_route,
        selected_form: null,
        resolved_constraint_count: resolved.constraints.length,
        active_portable_constraint_ids: portableIds,
        active_representation_constraint_ids: [],
      };
    }

    if (testCase.requested_form === undefined) {
      return {
        case_id: testCase.case_id,
        status: "ok",
        outcome: languageOverlay?.missing_decision_outcome ?? contract.missing_decision_outcome,
        owner_route: languageOverlay?.owner_route ?? contract.owner_route,
        selected_form: null,
        resolved_constraint_count: resolved.constraints.length,
        active_portable_constraint_ids: portableIds,
        active_representation_constraint_ids: [],
      };
    }

    const admitted = (languageOverlay?.admitted_forms ?? []).includes(testCase.requested_form);
    if (!admitted) {
      return {
        case_id: testCase.case_id,
        status: "ok",
        outcome: "unsupported",
        owner_route: languageOverlay?.owner_route ?? contract.owner_route,
        selected_form: null,
        resolved_constraint_count: resolved.constraints.length,
        active_portable_constraint_ids: portableIds,
        active_representation_constraint_ids: [],
      };
    }

    return {
      case_id: testCase.case_id,
      status: "ok",
      outcome: "selected",
      owner_route: languageOverlay.owner_route,
      selected_form: testCase.requested_form,
      resolved_constraint_count: resolved.constraints.length,
      active_portable_constraint_ids: portableIds,
      active_representation_constraint_ids: uniqueSorted(
        (languageOverlay.representation_constraints ?? []).map((constraint) => constraint.constraint_id),
      ),
    };
  } catch (error) {
    return {
      case_id: testCase.case_id,
      status: "blocked",
      error_code: error.code ?? "PROFILE_RESOLUTION_INTERNAL_ERROR",
      details: stable(error.details ?? {}),
    };
  }
};

validateRealMechanism();

const typescriptOverlay = profiles
  .get("architecture.typescript-strict")
  .representation_overlays[0];
validateActivationBinding(typescriptOverlay);

const actualDocument = {
  schema_version: "domainspec-enum-profile-evaluations/v1",
  evaluations: casesDocument.cases.map(evaluateCase),
};
const activationActualDocument = {
  schema_version: "domainspec-typescript-enum-profile-activation-evaluations/v1",
  evaluations: activationCasesDocument.cases.map((testCase) =>
    evaluateActivationCase(testCase, typescriptOverlay)),
};

if (canonical(actualDocument) !== canonical(expectedDocument)) {
  process.stderr.write("Enum profile evaluations did not match the exact fixture.\n");
  process.stderr.write(`${JSON.stringify(actualDocument, null, 2)}\n`);
  process.exit(1);
}
if (canonical(activationActualDocument) !== canonical(activationExpectedDocument)) {
  process.stderr.write("TypeScript Enum profile activation evaluations did not match the exact fixture.\n");
  process.stderr.write(`${JSON.stringify(activationActualDocument, null, 2)}\n`);
  process.exit(1);
}

process.stdout.write(`${JSON.stringify({
  schema_version: "domainspec-enum-profile-validation/v1",
  profile_evaluations: actualDocument.evaluations,
  activation_evaluations: activationActualDocument.evaluations,
}, null, 2)}\n`);
