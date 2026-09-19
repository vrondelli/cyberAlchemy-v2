#!/usr/bin/env node

import {createHash} from "node:crypto";
import {existsSync, lstatSync, readFileSync, realpathSync} from "node:fs";
import {dirname, resolve, sep} from "node:path";
import {fileURLToPath} from "node:url";

const experimentRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(experimentRoot, "../../../../..");
const relativePaths = Object.freeze({
  ontology: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json",
  projection: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/domain-meta-types.projection.json",
  typescriptProfile: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json",
  pythonProfile: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/python-strict.profile.json",
  rustProfile: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/rust-strict.profile.json",
  decision: "projects/domainspec-v2/development/ontology-form-decisions/decisions/W1-ENUM-001.json",
  dependency: "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-FND-005.json",
  catalogue: "projects/domainspec-v2/development/remaining-meta-types/admissions/enum/owner-member-wire-catalogue.json",
  descriptor: "projects/domainspec-v2/development/remaining-meta-types/admissions/enum/cross-language-realization-descriptor.json",
  admission: "projects/domainspec-v2/development/remaining-meta-types/admissions/enum/protocol-admission.json",
  reasoning: "projects/domainspec-v2/development/remaining-meta-types/admissions/enum/CROSS-LANGUAGE-ENUM-REASONING.md",
  acceptanceCase: "projects/domainspec-v2/impl/architecture-conformance/acceptance/enum-regression/shipment-priority/case.json",
  typescriptRuntime: "projects/domainspec-v2/impl/architecture-conformance/typescript/runtime/enum/index.ts",
  typescriptFixtureProvider: "projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/typescript-enum-shipment-priority-v1.ts",
});

const expectedHashes = Object.freeze({
  decision: "9305a39bc8965f7f2c0562dc2c3d224cc445ebaa27a0a51fd29f51a70f86447f",
  dependency: "4881e94697b24606eb6153dcc6ed9f02ad854516a386fd511ca987ea70278c85",
  catalogue: "f0c8d1003e046b420d6aa0875caadea16ca7420c97c6932d53b81820c1ec8fd3",
  descriptor: "055f33857c71ec606ad1a516e5b174e7bc94a385ff48b45354ac219c210fa61e",
  reasoning: "ee4d31b0713bd1b2adbbeed2a92969b4bcbd858a684fd00913bbadc5f02bd77c",
  ontology: "7d5da05c702cd6cc81aee1dc5b6d7c137c2ca078cb647b3f612685d74e9820db",
  projection: "768bdbab346c57bfe76b60e9623b5b21532500a61ff65ef80af1d87e9d7f3ee2",
  pythonProfile: "5cffd60ebb2d74e65063d2f39216ecadfa189053daa4acfe1c8f2b464691c8ea",
  rustProfile: "66f4a42f39542989fa9e432f59938ae23791804f986cb4d0e7c50934547f0c87",
  typescriptProfile: "b0057fb291825f3043c68aad9221d55ace7344c8380fdf9039a4ca9e8dffa23f",
  acceptanceCase: "b2170067a51973c01353d7dac7dac145da10ff1bcdcb6761578286dbf26a2c2a",
  typescriptRuntime: "378e09358713b431e4a24e664e484feae0122462e47aabfa653ae21a17315fcc",
  typescriptFixtureProvider: "a1864cee49a89bbf9b172e1e2a3fd0d1f2226fa8c12491c6eb00d2faa06950db",
});

const absolute = (relativePath) => resolve(repositoryRoot, relativePath);
const readText = (relativePath) => readFileSync(absolute(relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const sha256 = (relativePath) => createHash("sha256").update(readFileSync(absolute(relativePath))).digest("hex");
const clone = (value) => structuredClone(value);
const error = (errors, code, message) => errors.push({code, message});
const exactArray = (actual, expected) => Array.isArray(actual)
  && actual.length === expected.length
  && actual.every((value, index) => value === expected[index]);
const overlay = (profile) => profile?.representation_overlays?.find(
  (candidate) => candidate.contract_id === "enum.profile-representation",
);
const protocol = (profile, protocolId) => overlay(profile)?.candidate_protocols?.find(
  (candidate) => candidate.protocol_id === protocolId,
);
const languageBinding = (descriptor, language) => descriptor?.language_bindings?.find(
  (candidate) => candidate.language === language,
);
const selectedProtocol = (admission, language) => admission?.selected_protocols?.find(
  (candidate) => candidate.language === language,
);

const loadBundle = () => Object.freeze({
  ontology: readJson(relativePaths.ontology),
  projection: readJson(relativePaths.projection),
  typescriptProfile: readJson(relativePaths.typescriptProfile),
  pythonProfile: readJson(relativePaths.pythonProfile),
  rustProfile: readJson(relativePaths.rustProfile),
  decision: readJson(relativePaths.decision),
  dependency: readJson(relativePaths.dependency),
  catalogue: readJson(relativePaths.catalogue),
  descriptor: readJson(relativePaths.descriptor),
  admission: readJson(relativePaths.admission),
  acceptanceCase: readJson(relativePaths.acceptanceCase),
  reasoning: readText(relativePaths.reasoning),
});

const validateReference = (errors, reference, label) => {
  if (!reference || typeof reference.path !== "string" || typeof reference.sha256 !== "string") {
    error(errors, "MISSING_DIGEST_BINDING", `${label} lacks a path and SHA-256 binding`);
    return;
  }
  const target = absolute(reference.path);
  if (!target.startsWith(`${repositoryRoot}${sep}`) || !existsSync(target)) {
    error(errors, "MISSING_DIGEST_TARGET", `${label} is missing or escapes the repository: ${reference.path}`);
    return;
  }
  if (!lstatSync(target).isFile() || lstatSync(target).isSymbolicLink() || realpathSync(target) !== target) {
    error(errors, "UNSAFE_DIGEST_TARGET", `${label} is not one direct regular file: ${reference.path}`);
    return;
  }
  const actual = sha256(reference.path);
  if (actual !== reference.sha256) {
    error(errors, "STALE_DIGEST", `${label} digest drift: expected ${reference.sha256}, observed ${actual}`);
  }
};

const validateBundle = (bundle) => {
  const errors = [];
  const {
    ontology, projection, typescriptProfile, pythonProfile, rustProfile,
    decision, dependency, catalogue, descriptor, admission, acceptanceCase, reasoning,
  } = bundle;

  if (admission?.schema_version !== "domainspec.enum-protocol-admission/v1"
    || admission?.admission_status !== "candidate-protocol-only"
    || admission?.result !== "pass"
    || admission?.authority_effect !== "none") {
    error(errors, "ADMISSION_BOUNDARY_DRIFT", "admission must remain a passing candidate-protocol-only, no-authority record");
  }
  if (decision?.decision_id !== "DS-OF-W1-ENUM-001"
    || decision?.selected_option_id !== "W1-ENUM-A-NOMINAL-BOUNDARY") {
    error(errors, "DECISION_SELECTION_DRIFT", "the accepted W1 Enum nominal-boundary decision is not selected");
  }
  if (dependency?.result !== "pass" || dependency?.swu_id !== "RMT-FND-005") {
    error(errors, "DEPENDENCY_NOT_PASSING", "RMT-FND-005 must be the passing dependency");
  }
  validateReference(errors, admission?.dependency_ref, "dependency receipt");
  validateReference(errors, admission?.decision_ref, "W1 Enum decision");
  for (const reference of admission?.material_refs ?? []) {
    validateReference(errors, reference, `material ref ${reference.role ?? "unknown"}`);
  }
  const requiredMaterialRefs = new Map([
    ["owner-catalogue", [relativePaths.catalogue, expectedHashes.catalogue]],
    ["cross-language-descriptor", [relativePaths.descriptor, expectedHashes.descriptor]],
    ["cross-language-reasoning", [relativePaths.reasoning, expectedHashes.reasoning]],
    ["ontology", [relativePaths.ontology, expectedHashes.ontology]],
    ["meta-type-projection", [relativePaths.projection, expectedHashes.projection]],
    ["python-profile", [relativePaths.pythonProfile, expectedHashes.pythonProfile]],
    ["rust-profile", [relativePaths.rustProfile, expectedHashes.rustProfile]],
  ]);
  for (const [role, [path, digest]] of requiredMaterialRefs) {
    const reference = admission?.material_refs?.find((candidate) => candidate.role === role);
    if (reference?.path !== path || reference?.sha256 !== digest) {
      error(errors, "MATERIAL_BINDING_DRIFT", `${role} is not bound to the admitted path and digest`);
    }
  }

  if (catalogue?.schema_version !== "domainspec.enum-owner-member-wire-catalogue/v1"
    || catalogue?.authorship !== "owner-authored-admission-input"
    || catalogue?.derivation_policy !== "runtime-and-generated-members-forbidden-as-authority"
    || catalogue?.canonical_product_authority !== false) {
    error(errors, "IMPLEMENTATION_DEFINED_CATALOGUE", "the member-wire catalogue must remain owner-authored candidate-fixture input, never runtime or generated authority");
  }
  if (catalogue?.authority_effect !== "none") {
    error(errors, "CATALOGUE_AUTHORITY_DRIFT", "the candidate catalogue must have no authority effect");
  }
  for (const reference of catalogue?.source_refs ?? []) validateReference(errors, reference, `catalogue source ${reference.role ?? "unknown"}`);
  const members = catalogue?.members ?? [];
  const memberIds = members.map((member) => member.member_id);
  const memberKeys = members.map((member) => member.member_key);
  const wireValues = members.map((member) => member.wire_value);
  if (new Set(memberIds).size !== memberIds.length) error(errors, "DUPLICATE_MEMBER_ID", "catalogue member identifiers must be unique");
  if (new Set(memberKeys).size !== memberKeys.length) error(errors, "DUPLICATE_MEMBER_KEY", "catalogue member keys must be unique");
  if (new Set(wireValues).size !== wireValues.length) error(errors, "DUPLICATE_WIRE_VALUE", "catalogue wire values must be unique");
  if (members.length === 0 || members.some((member) => !member.member_id || !member.member_key || !member.wire_value)) {
    error(errors, "INCOMPLETE_OWNER_CATALOGUE", "catalogue members must be non-empty complete triples");
  }
  const caseMemberNames = acceptanceCase?.binding?.member_names ?? {};
  const expectedMembers = (acceptanceCase?.definition?.members ?? []).map((member) => ({
    member_id: member.member_id,
    member_key: caseMemberNames[member.member_id],
    wire_value: member.semantic_value,
  }));
  if (JSON.stringify(members) !== JSON.stringify(expectedMembers)
    || catalogue?.concept_id !== acceptanceCase?.definition?.concept_id) {
    error(errors, "CANDIDATE_FIXTURE_JOIN_DRIFT", "owner catalogue no longer matches the selected shipment-priority candidate fixture");
  }
  const wireContract = catalogue?.wire_contract;
  if (wireContract?.member_to_wire !== "explicit-total-one-to-one"
    || wireContract?.wire_to_member !== "explicit-fallible"
    || wireContract?.unknown_wire_value !== "structured-failure"
    || wireContract?.aliases !== "forbidden"
    || wireContract?.domain_wire_equality_collapse !== "forbidden") {
    error(errors, "PORTABLE_WIRE_CONTRACT_DRIFT", "owner catalogue must retain the explicit total emit and fallible parse boundary");
  }

  if (descriptor?.schema_version !== "domainspec.enum-cross-language-realization-descriptor/v1"
    || descriptor?.descriptor_status !== "candidate-protocol-only"
    || descriptor?.meta_type_ref !== "DS-D1.3"
    || descriptor?.architecture_type_ref !== "architecture.EnumImplementation"
    || descriptor?.authority_effect !== "none") {
    error(errors, "DESCRIPTOR_BOUNDARY_DRIFT", "cross-language descriptor candidate boundary drifted");
  }
  for (const [label, reference] of Object.entries(descriptor?.binding ?? {})) {
    if (label.endsWith("_ref")) validateReference(errors, reference, `descriptor ${label}`);
  }
  if (descriptor?.owner_catalogue?.authorship !== "owner-authored-admission-input"
    || descriptor?.owner_catalogue?.runtime_or_generated_derivation !== "forbidden"
    || descriptor?.owner_catalogue?.member_count !== members.length
    || !exactArray(descriptor?.owner_catalogue?.member_ids, memberIds)
    || !exactArray(descriptor?.owner_catalogue?.member_keys, memberKeys)
    || !exactArray(descriptor?.owner_catalogue?.wire_values, wireValues)) {
    error(errors, "DESCRIPTOR_CATALOGUE_DRIFT", "descriptor does not preserve the owner-authored catalogue exactly");
  }

  const sourceRefs = new Map(ontology?.source_refs?.map((source) => [source.source_id, source]));
  const decisionSource = sourceRefs.get("domainspec.enum-form-decision");
  const catalogueSource = sourceRefs.get("domainspec.enum-owner-catalogue");
  if (decisionSource?.path !== relativePaths.decision || decisionSource?.sha256 !== expectedHashes.decision
    || catalogueSource?.path !== relativePaths.catalogue || catalogueSource?.sha256 !== expectedHashes.catalogue) {
    error(errors, "ONTOLOGY_SOURCE_BINDING_DRIFT", "ontology does not bind the accepted Enum decision and owner catalogue exactly");
  }
  const enumPropertyIds = new Set(ontology?.property_definitions?.map((property) => property.property_id));
  for (const propertyId of [
    "binding.expected_enum_values", "binding.expected_enum_catalogue_ref", "enum.implemented_values",
    "enum.implemented_members", "enum.composition_kind", "enum.native_form", "enum.alias_policy",
    "enum.native_extension_policy", "enum.domain_wire_equality_collapse", "enum.wire_emit_total",
    "enum.wire_parse_fallible", "enum.equality_hash_contract", "enum.exhaustiveness",
  ]) {
    if (!enumPropertyIds.has(propertyId)) error(errors, "ONTOLOGY_ENUM_PROPERTY_MISSING", `ontology lacks ${propertyId}`);
  }
  const enumConcept = ontology?.concept_types?.find((concept) => concept.concept_id === "architecture.EnumImplementation");
  if (enumConcept?.canonical_meta_type_ref !== "DS-D1.3"
    || !enumConcept?.source_refs?.includes("domainspec.enum-owner-catalogue")) {
    error(errors, "ONTOLOGY_ENUM_BINDING_DRIFT", "EnumImplementation must remain candidate-bound to DS-D1.3 and the owner catalogue");
  }
  const enumProjection = projection?.meta_types?.find((metaType) => metaType.meta_type_id === "DS-D1.3");
  if (enumProjection?.mapping_status !== "candidate-mapped"
    || enumProjection?.architecture_type_id !== "architecture.EnumImplementation") {
    error(errors, "PROJECTION_ENUM_BINDING_DRIFT", "DS-D1.3 projection must remain candidate-mapped to EnumImplementation");
  }
  const projectedProtocols = new Map(enumProjection?.candidate_language_protocols?.map((item) => [item.language, item]));
  const expectedProjectionProtocols = {
    typescript: ["typescript.owned-const-object-enum/v1", "selected-existing-profile-and-provider"],
    python: ["python.nominal-enum-explicit-wire/v1", "admitted-candidate-protocol"],
    rust: ["rust.nominal-enum-explicit-wire/v1", "admitted-candidate-protocol"],
  };
  for (const [language, [protocolId, status]] of Object.entries(expectedProjectionProtocols)) {
    const projected = projectedProtocols.get(language);
    if (projected?.protocol_id !== protocolId || projected?.protocol_status !== status) {
      error(errors, "PROJECTION_PROTOCOL_DRIFT", `${language} projected Enum protocol drifted`);
    }
  }

  const pythonOverlay = overlay(pythonProfile);
  const pythonProtocol = protocol(pythonProfile, "python.nominal-enum-explicit-wire/v1");
  if (pythonOverlay?.selection_mode !== "owner-decision-and-catalogue-digest"
    || !exactArray(pythonOverlay?.admitted_forms, ["python.enum-class"])
    || pythonOverlay?.admission_status !== "candidate-protocol-only"
    || pythonProtocol?.form_id !== "python.enum-class"
    || pythonProtocol?.status !== "admitted-candidate-protocol"
    || pythonProtocol?.implementation_status !== "provider-absent") {
    error(errors, "PROFILE_SELECTION_MISMATCH", "Python profile must select only the candidate nominal enum.Enum protocol without a provider");
  }
  if (pythonProtocol?.runtime_provider !== undefined) {
    error(errors, "PREMATURE_PROVIDER_BINDING", "RMT-ENUM-001 may not bind a Python runtime provider");
  }
  if (pythonProtocol?.native_contract?.base_type !== "enum.Enum"
    || pythonProtocol?.native_contract?.str_mixin !== "forbidden"
    || pythonOverlay?.rejected_forms?.includes("python.str-enum-class") !== true) {
    error(errors, "PYTHON_STR_ENUM_FORBIDDEN", "Python Enum protocol must use enum.Enum without a str mixin");
  }
  if (pythonProtocol?.native_contract?.aliases !== "forbidden") {
    error(errors, "PYTHON_ALIAS_FORBIDDEN", "Python aliases must be forbidden");
  }
  if (pythonProtocol?.native_contract?.member_raw_string_equality !== "forbidden") {
    error(errors, "PYTHON_RAW_STRING_EQUALITY_FORBIDDEN", "Python Enum members must not compare equal to raw wire strings");
  }
  if (pythonProtocol?.native_contract?.runtime_extension !== "forbidden") {
    error(errors, "NATIVE_EXTENSION_FORBIDDEN", "Python runtime member extension must be forbidden");
  }
  if (pythonProtocol?.wire_contract?.emit !== "explicit-total"
    || pythonProtocol?.wire_contract?.parse !== "explicit-fallible"
    || pythonProtocol?.wire_contract?.unknown_wire_value !== "structured-failure") {
    error(errors, "UNKNOWN_WIRE_MUST_FAIL", "Python wire parsing must be explicit, fallible, and reject unknown values");
  }

  const rustOverlay = overlay(rustProfile);
  const rustProtocol = protocol(rustProfile, "rust.nominal-enum-explicit-wire/v1");
  if (rustOverlay?.selection_mode !== "owner-decision-and-catalogue-digest"
    || !exactArray(rustOverlay?.admitted_forms, ["rust.native-enum"])
    || rustOverlay?.admission_status !== "candidate-protocol-only"
    || rustProtocol?.form_id !== "rust.native-enum"
    || rustProtocol?.status !== "admitted-candidate-protocol"
    || rustProtocol?.implementation_status !== "provider-absent") {
    error(errors, "PROFILE_SELECTION_MISMATCH", "Rust profile must select only the candidate native unit-variant protocol without a provider");
  }
  if (rustProtocol?.runtime_provider !== undefined) {
    error(errors, "PREMATURE_PROVIDER_BINDING", "RMT-ENUM-001 may not bind a Rust runtime provider");
  }
  const requiredTraits = rustProtocol?.native_contract?.required_traits;
  if (rustProtocol?.native_contract?.variant_kind !== "unit-only"
    || !exactArray(requiredTraits, ["Copy", "Clone", "PartialEq", "Eq", "Hash"])) {
    error(errors, "RUST_NATIVE_CONTRACT_DRIFT", "Rust Enum must remain a unit-variant Copy Clone PartialEq Eq Hash form");
  }
  if (rustProtocol?.wire_contract?.emit !== "explicit-total"
    || rustProtocol?.wire_contract?.parse !== "explicit-fallible"
    || rustProtocol?.wire_contract?.unknown_wire_value !== "structured-failure") {
    error(errors, "RUST_FALLIBLE_PARSE_REQUIRED", "Rust requires explicit total emission and fallible unknown-wire parsing");
  }
  if (rustProtocol?.native_contract?.exhaustive_matching !== "required") {
    error(errors, "RUST_EXHAUSTIVENESS_REQUIRED", "Rust exhaustive matching evidence is required");
  }
  if (rustProtocol?.native_contract?.runtime_extension !== "forbidden") {
    error(errors, "NATIVE_EXTENSION_FORBIDDEN", "Rust native member extension must be forbidden");
  }

  const typescriptOverlay = overlay(typescriptProfile);
  const typescriptProtocol = protocol(typescriptProfile, "typescript.owned-const-object-enum/v1");
  const typescriptIdentity = admission?.typescript_unchanged_identity;
  if (sha256(relativePaths.typescriptProfile) !== expectedHashes.typescriptProfile
    || typescriptIdentity?.before_sha256 !== expectedHashes.typescriptProfile
    || typescriptIdentity?.after_sha256 !== expectedHashes.typescriptProfile
    || typescriptOverlay?.selection_mode !== "owner-decision-and-provider-digest"
    || !exactArray(typescriptOverlay?.admitted_forms, ["typescript.owned-const-object-enum"])
    || typescriptProtocol?.status !== "active"
    || typescriptProtocol?.runtime_provider?.module_path !== relativePaths.typescriptRuntime
    || typescriptProtocol?.runtime_provider?.provider_sha256 !== expectedHashes.typescriptRuntime) {
    error(errors, "TYPESCRIPT_STATUS_DRIFT", "the selected TypeScript profile, active protocol, provider path, and provider digest must remain byte-identical");
  }
  if (sha256(relativePaths.typescriptRuntime) !== expectedHashes.typescriptRuntime
    || sha256(relativePaths.typescriptFixtureProvider) !== expectedHashes.typescriptFixtureProvider) {
    error(errors, "TYPESCRIPT_PROVIDER_DRIFT", "the locked TypeScript Enum providers changed");
  }
  if (languageBinding(descriptor, "typescript")?.implementation_change !== "none"
    || selectedProtocol(admission, "typescript")?.implementation_status !== "unchanged") {
    error(errors, "TYPESCRIPT_CHANGE_CLAIM_DRIFT", "descriptor and admission must state that TypeScript is reused unchanged");
  }

  for (const [profile, activationLabel] of [[pythonProfile, "Python"], [rustProfile, "Rust"]]) {
    const activation = overlay(profile)?.activation_binding;
    validateReference(errors, activation?.decision_ref, `${activationLabel} profile decision`);
    validateReference(errors, activation?.catalogue_ref, `${activationLabel} profile catalogue`);
  }
  if (selectedProtocol(admission, "python")?.implementation_status !== "provider-absent"
    || selectedProtocol(admission, "rust")?.implementation_status !== "provider-absent"
    || admission?.implementation_effects?.python_provider_created !== false
    || admission?.implementation_effects?.rust_provider_created !== false
    || admission?.implementation_effects?.parity_proven !== false) {
    error(errors, "IMPLEMENTATION_CLAIM_INFLATION", "protocol admission cannot claim Python/Rust providers or parity proof");
  }
  for (const phrase of [
    "reusing the existing TypeScript Enum implementation unchanged",
    "Python and Rust provide independent ways to challenge that promise",
    "Runtime or generated members may be checked against it, but may never define it",
  ]) {
    if (!reasoning.includes(phrase)) error(errors, "REASONING_EXPLANATION_DRIFT", `Markdown explanation is missing: ${phrase}`);
  }
  if (admission?.successor?.swu_id !== "RMT-ENUM-002" || admission?.successor?.state !== "not-executed") {
    error(errors, "SUCCESSOR_BOUNDARY_DRIFT", "RMT-ENUM-002 must remain named and unexecuted");
  }
  return errors;
};

const hostileCases = Object.freeze([
  {
    id: "stale-digest",
    expectedCode: "STALE_DIGEST",
    mutate: (bundle) => { bundle.admission.material_refs[0].sha256 = "0".repeat(64); },
  },
  {
    id: "duplicate-member-key",
    expectedCode: "DUPLICATE_MEMBER_KEY",
    mutate: (bundle) => { bundle.catalogue.members[1].member_key = bundle.catalogue.members[0].member_key; },
  },
  {
    id: "duplicate-wire-value",
    expectedCode: "DUPLICATE_WIRE_VALUE",
    mutate: (bundle) => { bundle.catalogue.members[1].wire_value = bundle.catalogue.members[0].wire_value; },
  },
  {
    id: "implementation-defined-catalogue",
    expectedCode: "IMPLEMENTATION_DEFINED_CATALOGUE",
    mutate: (bundle) => { bundle.catalogue.authorship = "runtime-derived"; },
  },
  {
    id: "python-str-enum",
    expectedCode: "PYTHON_STR_ENUM_FORBIDDEN",
    mutate: (bundle) => { protocol(bundle.pythonProfile, "python.nominal-enum-explicit-wire/v1").native_contract.str_mixin = "required"; },
  },
  {
    id: "python-alias",
    expectedCode: "PYTHON_ALIAS_FORBIDDEN",
    mutate: (bundle) => { protocol(bundle.pythonProfile, "python.nominal-enum-explicit-wire/v1").native_contract.aliases = "allowed"; },
  },
  {
    id: "python-raw-string-equality",
    expectedCode: "PYTHON_RAW_STRING_EQUALITY_FORBIDDEN",
    mutate: (bundle) => { protocol(bundle.pythonProfile, "python.nominal-enum-explicit-wire/v1").native_contract.member_raw_string_equality = "allowed"; },
  },
  {
    id: "unknown-wire-constructs-member",
    expectedCode: "UNKNOWN_WIRE_MUST_FAIL",
    mutate: (bundle) => { protocol(bundle.pythonProfile, "python.nominal-enum-explicit-wire/v1").wire_contract.unknown_wire_value = "construct-member"; },
  },
  {
    id: "rust-infallible-parse",
    expectedCode: "RUST_FALLIBLE_PARSE_REQUIRED",
    mutate: (bundle) => { protocol(bundle.rustProfile, "rust.nominal-enum-explicit-wire/v1").wire_contract.parse = "infallible"; },
  },
  {
    id: "rust-missing-exhaustiveness",
    expectedCode: "RUST_EXHAUSTIVENESS_REQUIRED",
    mutate: (bundle) => { protocol(bundle.rustProfile, "rust.nominal-enum-explicit-wire/v1").native_contract.exhaustive_matching = "optional"; },
  },
  {
    id: "wrong-profile-selection",
    expectedCode: "PROFILE_SELECTION_MISMATCH",
    mutate: (bundle) => { overlay(bundle.pythonProfile).admitted_forms = ["python.str-enum-class"]; },
  },
  {
    id: "typescript-status-drift",
    expectedCode: "TYPESCRIPT_STATUS_DRIFT",
    mutate: (bundle) => { protocol(bundle.typescriptProfile, "typescript.owned-const-object-enum/v1").status = "candidate"; },
  },
]);

const bundle = loadBundle();
const errors = validateBundle(bundle);
const hostileValidations = [];
if (errors.length === 0) {
  for (const hostileCase of hostileCases) {
    const hostileBundle = clone(bundle);
    hostileCase.mutate(hostileBundle);
    const hostileErrors = validateBundle(hostileBundle);
    const killed = hostileErrors.some((candidate) => candidate.code === hostileCase.expectedCode);
    hostileValidations.push({
      case_id: hostileCase.id,
      expected_code: hostileCase.expectedCode,
      result: killed ? "killed" : "survived",
    });
    if (!killed) error(errors, "VALIDATOR_HOSTILE_GAP", `${hostileCase.id} survived without ${hostileCase.expectedCode}`);
  }
}

const result = {
  schema_version: "domainspec.rmt-enum-admission-validation/v1",
  swu_id: "RMT-ENUM-001",
  verdict: errors.length === 0 ? "pass" : "fail",
  checks: [
    "passing RMT-FND-005 dependency and accepted W1 nominal-boundary decision",
    "content-addressed candidate ontology, projection, profiles, catalogue, descriptor, and Markdown",
    "owner-authored catalogue distinct from runtime and generated member evidence",
    "exact Python enum.Enum nominal protocol without str mixin, aliases, raw-string equality, extension, or unknown-wire construction",
    "exact Rust unit-variant Eq/Hash protocol with total emit, fallible parse, and exhaustiveness requirement",
    "byte-identical active TypeScript profile and provider identity",
    `${hostileValidations.filter((item) => item.result === "killed").length}/${hostileCases.length} admission-level hostile mutations killed`,
  ],
  hostile_validations: hostileValidations,
  errors,
  implementation_status: {
    typescript: "reused-unchanged",
    python: "protocol-only-provider-absent",
    rust: "protocol-only-provider-absent",
    parity: "not-proven",
  },
  claim_ceiling: "candidate-only ontology/profile/protocol/descriptor/catalogue admission; admission-level sensitivity is not native provider behavior, cross-language parity, ontology promotion, release, deployment, or production proof",
  authority_effect: "none",
};

console.log(JSON.stringify(result, null, 2));
if (errors.length > 0) process.exitCode = 1;
