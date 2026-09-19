import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDirectory = dirname(fileURLToPath(import.meta.url));
const experimentRoot = resolve(
  process.env.DOMAINSPEC_PROFILE_EXPERIMENT_ROOT
    ?? join(fixtureDirectory, "../../.."),
);
const profileDirectory = join(experimentRoot, "profiles");
const casesPath = join(fixtureDirectory, "cases.json");
const expectedPath = join(fixtureDirectory, "evaluations.expected.json");

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
    fail(overlay.selection_mode === "external-owner-decision", `${language} overlay must remain owner-routed`);
    fail(overlay.owner_route === `${language}-architecture-profile-owner`, `${language} owner route mismatch`);
    fail((overlay.admitted_forms ?? []).length === 0, `${language} must not admit a concrete representation in W0`);
    fail((overlay.rejected_forms ?? []).length === 0, `${language} must not reject a concrete representation in W0`);
    fail((overlay.unsupported_forms ?? []).length === 0, `${language} must not classify concrete forms in W0`);
    fail((overlay.representation_constraints ?? []).length === 0, `${language} must not activate representation constraints in W0`);
  }

  const typescriptOverlay = profiles
    .get("architecture.typescript-strict")
    .representation_overlays[0];
  const candidateProtocols = typescriptOverlay.candidate_protocols ?? [];
  fail(candidateProtocols.length === 1, "TypeScript must declare exactly one unmaterialized candidate protocol");
  const candidate = candidateProtocols[0];
  fail(candidate.protocol_id === "typescript.owned-const-object-enum/v1", "unexpected TypeScript candidate protocol id");
  fail(candidate.form_id === "typescript.owned-const-object-enum", "unexpected TypeScript candidate form id");
  fail(candidate.status === "unmaterialized", "TypeScript candidate protocol must remain unmaterialized in ONT-006");
  fail(candidate.runtime_provider.provider_sha256 === null, "unmaterialized TypeScript provider must not claim a digest");
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

const actualDocument = {
  schema_version: "domainspec-enum-profile-evaluations/v1",
  evaluations: casesDocument.cases.map(evaluateCase),
};

if (canonical(actualDocument) !== canonical(expectedDocument)) {
  process.stderr.write("Enum profile evaluations did not match the exact fixture.\n");
  process.stderr.write(`${JSON.stringify(actualDocument, null, 2)}\n`);
  process.exit(1);
}

process.stdout.write(`${JSON.stringify(actualDocument, null, 2)}\n`);
