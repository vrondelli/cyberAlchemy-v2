#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = process.env.DOMAINSPEC_REPOSITORY_ROOT
  ? resolve(process.env.DOMAINSPEC_REPOSITORY_ROOT)
  : resolve(packageRoot, "../../../..");
const projectionPath = "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/domain-meta-types.projection.json";
const ontologyPath = "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json";
const matrixPath = resolve(packageRoot, "FORM-DECISION-MATRIX.json");
const queuePath = resolve(packageRoot, "IMPLEMENTATION-QUEUE.json");
const machinePath = resolve(packageRoot, "DECISION-STATE-MACHINE.json");
const formSchemaPath = resolve(packageRoot, "FORM-DECISION.schema.json");
const languageSchemaPath = resolve(packageRoot, "LANGUAGE-REALIZATION.schema.json");
const proofSchemaPath = resolve(packageRoot, "PROOF-CONTRACT.schema.json");
const queueSchemaPath = resolve(packageRoot, "IMPLEMENTATION-QUEUE.schema.json");
const kernelSchemaPath = resolve(packageRoot, "KERNEL-DECISION.schema.json");
const runtimePath = resolve(packageRoot, "VALIDATOR-RUNTIME.json");
const validatorPath = fileURLToPath(import.meta.url);
const packageRepositoryPrefix = "projects/domainspec-v2/development/ontology-form-decisions/";
const kernelDecisionRepositoryPath = `${packageRepositoryPrefix}decisions/W0-KERNEL-POLICY-001.json`;
const kernelRequestRepositoryPath = `${packageRepositoryPrefix}receipts/W0-OPTION-ADMISSIBILITY-REQUEST.json`;
const kernelReceiptRepositoryPath = `${packageRepositoryPrefix}receipts/W0-OPTION-ADMISSIBILITY.json`;
const decisionGatePrefilterRepositoryPath = "arcanum/arcana/decision-gate/scripts/prefilter-options.py";
const decisionGateRequestSchemaRepositoryPath = "arcanum/arcana/decision-gate/schemas/option-admissibility-request.schema.json";
const decisionGateReceiptSchemaRepositoryPath = "arcanum/arcana/decision-gate/schemas/option-admissibility-receipt.schema.json";

const expectedLanguages = ["python", "rust", "typescript"];
const errors = [];
const checks = [];
const inputPaths = new Set([
  matrixPath,
  queuePath,
  machinePath,
  formSchemaPath,
  languageSchemaPath,
  proofSchemaPath,
  queueSchemaPath,
  kernelSchemaPath,
  runtimePath,
  validatorPath
]);

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};
const stable = (values) => [...values].sort((left, right) => left.localeCompare(right));
const sameSet = (left, right) => JSON.stringify(stable(left)) === JSON.stringify(stable(right));
const record = (condition, code, detail) => {
  if (condition) {
    checks.push({ code, status: "pass", detail });
  } else {
    errors.push({ code, detail });
  }
};

const resolveRepositoryPath = (path) => {
  const candidate = resolve(repositoryRoot, path);
  if (!candidate.startsWith(`${repositoryRoot}/`)) {
    throw new Error(`path escapes repository root: ${path}`);
  }
  return candidate;
};

const resolveBoundPath = (path) => {
  if (!path.startsWith(packageRepositoryPrefix)) return resolveRepositoryPath(path);
  const candidate = resolve(packageRoot, path.slice(packageRepositoryPrefix.length));
  if (!candidate.startsWith(`${packageRoot}/`)) {
    throw new Error(`path escapes campaign package root: ${path}`);
  }
  return candidate;
};

const matrix = await readJson(matrixPath);
const queue = await readJson(queuePath);
const machine = await readJson(machinePath);
const runtime = await readJson(runtimePath);
const kernelDecisionPath = resolveBoundPath(kernelDecisionRepositoryPath);
const projection = await readJson(resolveRepositoryPath(projectionPath));
const ontology = await readJson(resolveRepositoryPath(ontologyPath));

const canonicalLoad = spawnSync(
  "python3",
  [
    "-c",
    "import json, pathlib, sys, yaml; print(json.dumps(yaml.safe_load(pathlib.Path(sys.argv[1]).read_text())))",
    resolveRepositoryPath(matrix.source_refs[0].path)
  ],
  { encoding: "utf8" }
);
record(
  canonicalLoad.status === 0,
  "CANONICAL_PARSE",
  canonicalLoad.status === 0
    ? "canonical meta-type YAML parsed with the installed safe loader"
    : `canonical YAML parse failed: ${canonicalLoad.stderr}`
);
const canonical = canonicalLoad.status === 0 ? JSON.parse(canonicalLoad.stdout) : { members: [] };

const pythonRuntime = spawnSync(
  "python3",
  [
    "-c",
    "import json, sys; from importlib.metadata import version; print(json.dumps({'python':sys.version.split()[0], 'PyYAML':version('PyYAML'), 'jsonschema':version('jsonschema')}))"
  ],
  { encoding: "utf8" }
);
const observedRuntime = pythonRuntime.status === 0 ? JSON.parse(pythonRuntime.stdout) : {};
record(process.versions.node === runtime.node, "NODE_RUNTIME", `Node runtime is pinned to ${runtime.node}`);
record(observedRuntime.python === runtime.python, "PYTHON_RUNTIME", `Python runtime is pinned to ${runtime.python}`);
record(observedRuntime.PyYAML === runtime.python_packages.PyYAML, "PYYAML_RUNTIME", `PyYAML is pinned to ${runtime.python_packages.PyYAML}`);
record(observedRuntime.jsonschema === runtime.python_packages.jsonschema, "JSONSCHEMA_RUNTIME", `jsonschema is pinned to ${runtime.python_packages.jsonschema}`);
record(runtime.network_required === false, "OFFLINE_RUNTIME", "validator runtime declares no network dependency");

const schemaValidation = spawnSync(
  "python3",
  [
    "-c",
    [
      "import json, pathlib, sys",
      "from jsonschema import Draft202012Validator, RefResolver",
      "schema_path, language_path, proof_path, instance_path, queue_schema_path, queue_instance_path, kernel_schema_path, kernel_instance_path = map(pathlib.Path, sys.argv[1:])",
      "schema = json.loads(schema_path.read_text())",
      "language = json.loads(language_path.read_text())",
      "proof = json.loads(proof_path.read_text())",
      "instance = json.loads(instance_path.read_text())",
      "queue_schema = json.loads(queue_schema_path.read_text())",
      "queue_instance = json.loads(queue_instance_path.read_text())",
      "kernel_schema = json.loads(kernel_schema_path.read_text())",
      "kernel_instance = json.loads(kernel_instance_path.read_text())",
      "Draft202012Validator.check_schema(language)",
      "Draft202012Validator.check_schema(proof)",
      "Draft202012Validator.check_schema(schema)",
      "Draft202012Validator.check_schema(queue_schema)",
      "Draft202012Validator.check_schema(kernel_schema)",
      "resolver = RefResolver.from_schema(schema, store={language['$id']: language, proof['$id']: proof})",
      "errors = [('matrix', error) for error in Draft202012Validator(schema, resolver=resolver).iter_errors(instance)] + [('queue', error) for error in Draft202012Validator(queue_schema).iter_errors(queue_instance)] + [('kernel', error) for error in Draft202012Validator(kernel_schema).iter_errors(kernel_instance)]",
      "errors = sorted(errors, key=lambda item: (item[0], list(item[1].path)))",
      "print(json.dumps([{'document': document, 'path': '/'.join(map(str, error.path)), 'message': error.message} for document, error in errors]))",
      "raise SystemExit(0 if not errors else 1)"
    ].join("; "),
    formSchemaPath,
    languageSchemaPath,
    proofSchemaPath,
    matrixPath,
    queueSchemaPath,
    queuePath,
    kernelSchemaPath,
    kernelDecisionPath
  ],
  { encoding: "utf8" }
);
record(
  schemaValidation.status === 0,
  "JSON_SCHEMA",
  schemaValidation.status === 0
    ? "matrix, implementation queue, and accepted kernel decision pass the closed Draft 2020-12 schemas"
    : `schema validation failed: ${schemaValidation.stdout || schemaValidation.stderr}`
);

record(matrix.schema_version === "domainspec-ontology-form-decision-matrix/v1", "MATRIX_SCHEMA", "matrix schema version is exact");
record(matrix.ontology_type === "architecture-property", "ONTOLOGY_TYPE", "campaign selects the architecture-property ontology type");
record(matrix.authority_effect === "none" && queue.authority_effect === "none" && machine.authority_effect === "none", "AUTHORITY_CEILING", "all campaign roots preserve authority_effect none");

for (const sourceRef of matrix.source_refs) {
  const resolvedSource = resolveRepositoryPath(sourceRef.path);
  inputPaths.add(resolvedSource);
  const bytes = await readFile(resolvedSource);
  record(sha256(bytes) === sourceRef.sha256, "SOURCE_DIGEST", `${sourceRef.path} matches its retained digest`);
}
const expectedSourceOrder = [
  "projects/domainspec-v2/definitions/meta-types/meta-types.yml",
  ontologyPath,
  projectionPath,
  "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/base-domain.profile.json"
];
record(JSON.stringify(matrix.source_refs.map(({ path }) => path)) === JSON.stringify(expectedSourceOrder), "SOURCE_REF_ORDER", "canonical ontology projection and base profile source refs are complete and ordered");

const kernelBinding = matrix.campaign_kernel_binding ?? {};
const expectedKernelRefs = [
  ["admissibility_request_ref", kernelRequestRepositoryPath, "KERNEL_REQUEST_BYTES_DIGEST"],
  ["admissibility_receipt_ref", kernelReceiptRepositoryPath, "KERNEL_RECEIPT_BYTES_DIGEST"],
  ["decision_record_ref", kernelDecisionRepositoryPath, "KERNEL_DECISION_DIGEST"],
  ["prefilter_ref", decisionGatePrefilterRepositoryPath, "KERNEL_PREFILTER_DIGEST"],
  ["request_schema_ref", decisionGateRequestSchemaRepositoryPath, "KERNEL_REQUEST_SCHEMA_DIGEST"],
  ["receipt_schema_ref", decisionGateReceiptSchemaRepositoryPath, "KERNEL_RECEIPT_SCHEMA_DIGEST"]
];
const kernelInputBytes = new Map();
for (const [field, expectedPath, digestCode] of expectedKernelRefs) {
  const exactRef = kernelBinding[field];
  record(exactRef?.path === expectedPath, "KERNEL_REF_PATH", `${field} uses the exact W0 campaign path`);
  if (!exactRef?.path || !exactRef?.sha256) continue;
  try {
    const resolvedInput = resolveBoundPath(exactRef.path);
    inputPaths.add(resolvedInput);
    const bytes = await readFile(resolvedInput);
    kernelInputBytes.set(field, bytes);
    record(sha256(bytes) === exactRef.sha256, digestCode, `${field} exact bytes are current`);
  } catch (error) {
    record(false, digestCode, `${field} cannot be read: ${error.message}`);
  }
}

const parseKernelJson = (field) => {
  try {
    return JSON.parse(kernelInputBytes.get(field)?.toString("utf8") ?? "{}");
  } catch {
    return {};
  }
};
const kernelRequest = parseKernelJson("admissibility_request_ref");
const kernelReceipt = parseKernelJson("admissibility_receipt_ref");
const kernelDecision = parseKernelJson("decision_record_ref");
record(kernelBinding.decision_id === "DS-OF-W0-KERNEL-POLICY-001" && kernelBinding.selected_option_id === "W0-A-STRICT-DIGEST-BOUND", "KERNEL_SELECTION", "campaign root binds the accepted W0-A option");
record(kernelBinding.authority_effect === "none" && kernelDecision.authority_effect === "none", "KERNEL_AUTHORITY", "kernel binding and decision preserve authority_effect none");
record(kernelDecision.decision_id === kernelBinding.decision_id && kernelDecision.campaign_id === matrix.campaign_id, "KERNEL_DECISION_IDENTITY", "kernel decision identity matches the campaign root");
record(kernelDecision.status === "accepted" && kernelDecision.selected_option_id === kernelBinding.selected_option_id, "KERNEL_DECISION_SELECTION", "decision record binds the selected root option");
record(kernelDecision.decision_source?.kind === "user-message" && kernelDecision.decision_source?.exact_text === "Accept W0-A", "KERNEL_DECISION_SOURCE", "decision record retains the exact user selection");
record(kernelDecision.scope === `${packageRepositoryPrefix}**`, "KERNEL_SCOPE", "W0 acceptance remains candidate-local to the decision package");
record(canonicalJson(kernelDecision.admissibility?.request_ref) === canonicalJson(kernelBinding.admissibility_request_ref) && canonicalJson(kernelDecision.admissibility?.receipt_ref) === canonicalJson(kernelBinding.admissibility_receipt_ref), "KERNEL_ADMISSIBILITY_REFS", "decision and campaign root bind the same admissibility artifacts");
record(sha256(canonicalJson(kernelRequest)) === kernelReceipt.requestDigest && kernelReceipt.requestDigest === kernelDecision.admissibility?.request_digest, "KERNEL_REQUEST_DIGEST", "Decision Gate sorted-JSON request digest is current and distinct from record canonicalization");
record(kernelReceipt.routeOutcome === "gate" && kernelReceipt.decisionGateRequired === true && kernelReceipt.presentedOptionIds?.includes("W0-A-STRICT-DIGEST-BOUND"), "KERNEL_GATE_ROUTE", "W0-A was presented through a multi-option Decision Gate route");
record(kernelReceipt.rejectedOptions?.some(({ optionId }) => optionId === "W0-B-RELAXED-PROTOTYPE") && !kernelReceipt.rejectedOptions?.some(({ optionId }) => optionId === "W0-A-STRICT-DIGEST-BOUND"), "KERNEL_RELAXED_REJECTION", "relaxed admission is rejected while W0-A remains admissible");
const selectedKernelCandidate = kernelRequest.candidates?.find(({ optionId }) => optionId === "W0-A-STRICT-DIGEST-BOUND");
record(selectedKernelCandidate?.structuralStatus === "admissible" && selectedKernelCandidate?.optionKind === "action", "KERNEL_SELECTED_CANDIDATE", "selected W0-A request candidate is an admissible action");

const prefilterReplay = spawnSync(
  "python3",
  [
    resolveBoundPath(kernelBinding.prefilter_ref?.path ?? decisionGatePrefilterRepositoryPath),
    resolveBoundPath(kernelBinding.admissibility_request_ref?.path ?? kernelRequestRepositoryPath),
    "--request-schema",
    resolveBoundPath(kernelBinding.request_schema_ref?.path ?? decisionGateRequestSchemaRepositoryPath),
    "--receipt-schema",
    resolveBoundPath(kernelBinding.receipt_schema_ref?.path ?? decisionGateReceiptSchemaRepositoryPath)
  ],
  { encoding: "utf8" }
);
let replayedKernelReceipt = {};
try {
  replayedKernelReceipt = JSON.parse(prefilterReplay.stdout || "{}");
} catch {
  replayedKernelReceipt = {};
}
record(prefilterReplay.status === 0 && canonicalJson(replayedKernelReceipt) === canonicalJson(kernelReceipt), "KERNEL_PREFILTER_REPLAY", "canonical Decision Gate prefilter exactly reproduces the retained receipt");

const expectedClauseIds = Array.from({ length: 12 }, (_, index) => `W0-${String(index + 1).padStart(2, "0")}`);
record(kernelDecision.accepted_clauses?.length === 12 && JSON.stringify(kernelDecision.accepted_clauses.map(({ clause_id }) => clause_id)) === JSON.stringify(expectedClauseIds), "KERNEL_CLAUSES", "decision record contains the twelve ordered W0 policy clauses");
record(kernelDecision.kernel?.canonical_record_binding?.serialization === "RFC-8785-JCS" && kernelDecision.kernel?.canonical_record_binding?.digest === "SHA-256", "KERNEL_CANONICALIZATION_POLICY", "canonical record policy selects RFC 8785 JCS plus SHA-256");
record(kernelDecision.kernel?.claim_composition?.operator === "conservative-intersection" && kernelDecision.kernel?.claim_composition?.evidence_may_widen === false, "KERNEL_CLAIM_POLICY", "claim composition is conservative and cannot widen from evidence");
record(JSON.stringify(kernelDecision.kernel?.realization_admission?.languages) === JSON.stringify(["typescript", "python", "rust"]) && kernelDecision.kernel?.realization_admission?.syntax_inference === "forbidden", "KERNEL_LANGUAGE_POLICY", "all three languages require explicit non-syntactic admission");
record(JSON.stringify(kernelDecision.kernel?.contract_chain) === JSON.stringify(["CanonicalMetaTypeRecordRef/v1", "ArchitectureMappingDecision/v1", "MetaTypeRealizationDescriptor/v1", "FactoryKitPackage/v2"]), "KERNEL_CONTRACT_CHAIN", "accepted kernel binds the complete successor contract chain");
record(kernelDecision.kernel?.drift_policy?.stale_to_ready_directly === "forbidden", "KERNEL_DRIFT_POLICY", "stale decisions cannot jump directly to ready");
record(kernelDecision.kernel?.validator_runtime?.node === runtime.node && kernelDecision.kernel?.validator_runtime?.python === runtime.python && kernelDecision.kernel?.validator_runtime?.PyYAML === runtime.python_packages.PyYAML && kernelDecision.kernel?.validator_runtime?.jsonschema === runtime.python_packages.jsonschema && kernelDecision.kernel?.validator_runtime?.network_required === false, "KERNEL_RUNTIME_POLICY", "accepted W0 runtime policy matches the pinned offline validator runtime");
record(kernelDecision.non_effects?.includes("no ontology or language-profile promotion") && kernelDecision.non_effects?.includes("no meta-type implementation admission"), "KERNEL_NON_EFFECTS", "W0 acceptance explicitly excludes promotion and implementation admission");

const decisions = matrix.decisions;
const decisionIds = decisions.map(({ decision_id }) => decision_id);
const metaTypeIds = decisions.map(({ meta_type_id }) => meta_type_id);
const projectionById = new Map(projection.meta_types.map((entry) => [entry.meta_type_id, entry]));
const canonicalMembers = Array.isArray(canonical.members) ? canonical.members : [];
const uiMaturity = canonical.maturity?.ui ?? { candidate: { ids: "", terms: [] }, deferred: [] };
const candidateRange = uiMaturity.candidate.ids.match(/^DS-D1\.(\d+)\.\.(\d+)$/);
const candidateIds = candidateRange
  ? Array.from(
      { length: Number(candidateRange[2]) - Number(candidateRange[1]) + 1 },
      (_, offset) => `DS-D1.${Number(candidateRange[1]) + offset}`
    )
  : [];
const canonicalEntries = [
  ...canonicalMembers,
  ...candidateIds.map((id, index) => ({
    id,
    term: uiMaturity.candidate.terms[index],
    category: "ui",
    status: "candidate",
    criterion_schema: null
  })),
  ...(uiMaturity.deferred ?? []).map((entry) => ({
    id: entry.id,
    term: entry.term,
    category: "ui",
    status: "deferred",
    criterion_schema: null
  })),
  ...Object.entries(canonical.superseded ?? {}).map(([id, entry]) => ({
    id,
    term: entry.term,
    category: "behavioral",
    status: "superseded",
    criterion_schema: null
  }))
];
const canonicalById = new Map(canonicalEntries.map((entry) => [entry.id, entry]));
const decisionById = new Map(decisions.map((entry) => [entry.meta_type_id, entry]));
const ontologyTypeIds = new Set(ontology.concept_types.map(({ concept_id }) => concept_id));
const ontologyPropertyIds = new Set(ontology.property_definitions.map(({ property_id }) => property_id));
const ontologyRelationIds = new Set(ontology.relation_definitions.map(({ relation_id }) => relation_id));

record(decisions.length === 25, "DECISION_COUNT", "all 25 stable DomainSpec meta-type IDs are present");
record(new Set(decisionIds).size === decisions.length, "DECISION_ID_UNIQUENESS", "decision IDs are unique");
record(new Set(metaTypeIds).size === decisions.length, "META_TYPE_ID_UNIQUENESS", "meta-type IDs are unique");
record(sameSet(metaTypeIds, projection.meta_types.map(({ meta_type_id }) => meta_type_id)), "PROJECTION_COVERAGE", "matrix and source projection contain the same meta-type IDs");
record(sameSet(metaTypeIds, canonicalEntries.map(({ id }) => id)), "CANONICAL_COVERAGE", "matrix and all canonical YAML branches contain the same meta-type IDs");

for (const decision of decisions) {
  const source = projectionById.get(decision.meta_type_id);
  const canonicalEntry = canonicalById.get(decision.meta_type_id);
  record(Boolean(source), "SOURCE_ENTRY", `${decision.meta_type_id} resolves to one source projection entry`);
  if (!source) continue;

  record(Boolean(canonicalEntry), "CANONICAL_ENTRY", `${decision.meta_type_id} resolves to one canonical YAML record`);
  if (canonicalEntry) {
    record(decision.label === canonicalEntry.term && decision.category === canonicalEntry.category && decision.definition_maturity === canonicalEntry.status, "CANONICAL_IDENTITY", `${decision.meta_type_id} label category and maturity match canonical YAML`);
    record(decision.canonical_ref.criterion_path === (canonicalEntry.criterion_schema ?? null), "CANONICAL_CRITERION", `${decision.meta_type_id} criterion path matches canonical YAML`);
  }

  record(decision.label === source.label && decision.category === source.category, "SOURCE_IDENTITY", `${decision.meta_type_id} label and category match source projection`);
  record(decision.definition_maturity === source.maturity && decision.source_mapping_status === source.mapping_status, "SOURCE_STATUS", `${decision.meta_type_id} maturity and mapping status match source projection`);
  record(decision.canonical_ref.source_path === matrix.source_refs[0].path && decision.canonical_ref.source_sha256 === matrix.source_refs[0].sha256, "CANONICAL_SOURCE", `${decision.meta_type_id} references the retained canonical source`);
  record(decision.canonical_ref.record_selector === `id=${decision.meta_type_id}`, "RECORD_SELECTOR", `${decision.meta_type_id} uses its stable record selector`);
  record(decision.authority_effect === "none" && decision.proof_requirements.authority_effect === "none", "DECISION_AUTHORITY", `${decision.meta_type_id} preserves the authority ceiling`);

  if (decision.architecture_mapping_decision_ref !== null) {
    try {
      const mappingPath = resolveBoundPath(decision.architecture_mapping_decision_ref.path);
      inputPaths.add(mappingPath);
      const mappingBytes = await readFile(mappingPath);
      record(sha256(mappingBytes) === decision.architecture_mapping_decision_ref.sha256, "MAPPING_DECISION_DIGEST", `${decision.meta_type_id} exact architecture mapping decision bytes are current`);
      const mapping = JSON.parse(mappingBytes.toString("utf8"));
      record(mapping.schema_version === "ArchitectureMappingDecision/v1" && mapping.meta_type_id === decision.meta_type_id && mapping.campaign_id === matrix.campaign_id, "MAPPING_DECISION_IDENTITY", `${decision.meta_type_id} mapping identity matches its campaign card`);
      record(mapping.authority_effect === "none", "MAPPING_DECISION_AUTHORITY", `${decision.meta_type_id} mapping decision preserves authority_effect none`);
      record(mapping.matrix_transition?.target_state === decision.decision_state && mapping.matrix_transition?.architecture_form_status === decision.architecture_form.decision_status, "MAPPING_DECISION_TRANSITION", `${decision.meta_type_id} retained decision transition matches the matrix frontier`);
      record(canonicalJson(mapping.portable_architecture?.portable_invariants) === canonicalJson(decision.architecture_form.portable_invariants), "MAPPING_DECISION_INVARIANTS", `${decision.meta_type_id} matrix invariants exactly match the accepted mapping`);
      record(canonicalJson(mapping.proof_contract?.positive_obligations) === canonicalJson(decision.proof_requirements.positive_obligations) && canonicalJson(mapping.proof_contract?.negative_controls) === canonicalJson(decision.proof_requirements.negative_controls) && mapping.proof_contract?.claim_ceiling === decision.proof_requirements.claim_ceiling, "MAPPING_DECISION_PROOF", `${decision.meta_type_id} proof obligations and claim ceiling exactly match the accepted mapping`);
      record(mapping.language_target_realizations?.length === 3 && mapping.language_target_realizations.every(({ language, form_id }) => decision.language_realizations.find((entry) => entry.language === language)?.candidate_forms.includes(form_id)), "MAPPING_DECISION_LANGUAGE_TARGETS", `${decision.meta_type_id} accepted language targets remain declared matrix candidates`);

      const mappingRequestRef = mapping.admissibility?.request_ref;
      const mappingReceiptRef = mapping.admissibility?.receipt_ref;
      let mappingRequest = {};
      let mappingReceipt = {};
      for (const [label, exactRef, code] of [
        ["request", mappingRequestRef, "MAPPING_REQUEST_DIGEST"],
        ["receipt", mappingReceiptRef, "MAPPING_RECEIPT_DIGEST"]
      ]) {
        if (!exactRef?.path || !exactRef?.sha256) {
          record(false, code, `${decision.meta_type_id} mapping ${label} reference is incomplete`);
          continue;
        }
        const resolvedRef = resolveBoundPath(exactRef.path);
        inputPaths.add(resolvedRef);
        const bytes = await readFile(resolvedRef);
        record(sha256(bytes) === exactRef.sha256, code, `${decision.meta_type_id} mapping ${label} exact bytes are current`);
        if (label === "request") mappingRequest = JSON.parse(bytes.toString("utf8"));
        if (label === "receipt") mappingReceipt = JSON.parse(bytes.toString("utf8"));
      }
      record(sha256(canonicalJson(mappingRequest)) === mappingReceipt.requestDigest && mappingReceipt.requestDigest === mapping.admissibility?.request_digest, "MAPPING_ADMISSIBILITY_REQUEST", `${decision.meta_type_id} Decision Gate request digest is current`);
      record(mappingReceipt.routeOutcome === "gate" && mappingReceipt.decisionGateRequired === true && mappingReceipt.presentedOptionIds?.includes(mapping.selected_option_id), "MAPPING_ADMISSIBILITY_GATE", `${decision.meta_type_id} selected option was presented through a gate route`);
      const mappingPrefilterReplay = spawnSync(
        "python3",
        [
          resolveRepositoryPath(decisionGatePrefilterRepositoryPath),
          resolveBoundPath(mappingRequestRef.path),
          "--request-schema",
          resolveRepositoryPath(decisionGateRequestSchemaRepositoryPath),
          "--receipt-schema",
          resolveRepositoryPath(decisionGateReceiptSchemaRepositoryPath)
        ],
        { encoding: "utf8" }
      );
      let replayedMappingReceipt = {};
      try {
        replayedMappingReceipt = JSON.parse(mappingPrefilterReplay.stdout || "{}");
      } catch {
        replayedMappingReceipt = {};
      }
      record(mappingPrefilterReplay.status === 0 && canonicalJson(replayedMappingReceipt) === canonicalJson(mappingReceipt), "MAPPING_PREFILTER_REPLAY", `${decision.meta_type_id} canonical prefilter reproduces its retained receipt`);

      if (decision.meta_type_id === "DS-D1.1") {
        record(decision.architecture_mapping_decision_ref.path === `${packageRepositoryPrefix}decisions/W1-ENTITY-001.json` && mapping.selected_option_id === "W1-ENTITY-A-VALIDATED-EXTENSIBLE-FACTORY", "ENTITY_MAPPING_SELECTION", "Entity binds the approved validated extensible factory option");
        record(mapping.decision_source?.kind === "user-message" && mapping.decision_source?.exact_text === "approved", "ENTITY_DECISION_SOURCE", "Entity mapping retains the exact user approval");
        record(mapping.portable_architecture?.type_id === "architecture.EntityImplementation" && mapping.portable_architecture?.factory_provider_type_id === "architecture.EntityFactoryProvider", "ENTITY_ARCHITECTURE_TYPES", "Entity mapping distinguishes the canonical implementation from its factory provider role");
        record(mapping.validator_contract?.binding_time === "factory-definition" && mapping.validator_contract?.per_creation_arbitrary_validator === "forbidden", "ENTITY_VALIDATOR_CONTRACT", "Entity validators are owner-bound at factory definition time");
        record(mapping.factory_extension_contract?.mode === "additive-only" && mapping.factory_extension_contract?.may_not?.includes("remove or replace base validators") && mapping.factory_extension_contract?.may_not?.includes("replace identity semantics"), "ENTITY_EXTENSION_CONTRACT", "Entity factory extension cannot weaken base validation or identity");
        record(mapping.portable_architecture?.relation_contracts?.find(({ relation_id }) => relation_id === "architecture.extends_factory")?.cycle_policy === "acyclic", "ENTITY_EXTENSION_CYCLE", "Entity factory extension graph is acyclic");
        record(mapping.matrix_transition?.implementation_ready === false && mapping.non_effects?.includes("no Value Object or Enum decision"), "ENTITY_DECISION_SCOPE", "Entity approval neither admits implementation nor decides the other W1 types");
      }
      if (decision.meta_type_id === "DS-D1.2") {
        record(decision.architecture_mapping_decision_ref.path === `${packageRepositoryPrefix}decisions/W1-VALUE-OBJECT-001.json` && mapping.selected_option_id === "W1-VALUE-A-OWNED-VALUE-PROTOCOL", "VALUE_MAPPING_SELECTION", "Value Object binds the approved owned value protocol option");
        record(mapping.decision_source?.kind === "user-message" && mapping.decision_source?.exact_text === "approved", "VALUE_DECISION_SOURCE", "Value Object mapping retains the exact user approval");
        record(mapping.decision_source?.scope_evidence === "immediate-conversation-context-only" && mapping.decision_source?.independent_scope_proof === false, "VALUE_DECISION_SOURCE_BOUNDARY", "Value Object mapping does not overclaim independent transcript-bound approval proof");
        record(mapping.portable_architecture?.type_id === "architecture.ValueObjectImplementation" && mapping.portable_architecture?.factory_provider_type_id === "architecture.ValueObjectFactoryProvider", "VALUE_ARCHITECTURE_TYPES", "Value Object distinguishes the canonical implementation from its factory provider role");
        record(mapping.validator_contract?.binding_time === "factory-definition" && mapping.validator_contract?.per_creation_arbitrary_validator === "forbidden", "VALUE_VALIDATOR_CONTRACT", "Value Object validators are owner-bound at factory definition time");
        record(mapping.factory_extension_contract?.mode === "additive-validation-only" && mapping.factory_extension_contract?.may_not?.includes("add remove or reorder declared tuple fields") && mapping.factory_extension_contract?.may_not?.includes("replace equality or hashing"), "VALUE_EXTENSION_CONTRACT", "Value Object factory extension cannot change tuple semantics");
        record(mapping.equality_hash_contract?.equality_basis === "every declared field in canonical tuple order after normalization" && mapping.equality_hash_contract?.hash_basis === "the same normalized complete tuple used by equality" && mapping.equality_hash_contract?.reference_identity === "forbidden", "VALUE_EQUALITY_HASH_CONTRACT", "Value Object equality and hashing share the complete normalized tuple");
        record(mapping.equality_hash_contract?.component_domain?.status === "unresolved-for-profile-admission" && mapping.equality_hash_contract?.component_domain?.admission_rule === "every component type must have an exact language-profile-owned equality and hash protocol" && mapping.remaining_blockers?.includes("close the recursively equality-compatible and hashable component domain in each language profile"), "VALUE_COMPONENT_DOMAIN", "Value Object hashability remains fail-closed until each language profile admits an exact component domain");
        record(mapping.equality_hash_contract?.nested_values === "delegate equality and hashing to each nested Value Object owned protocol" && mapping.portable_architecture?.portable_invariants?.includes("nested Value Objects compose through their owned equality and hash protocols"), "VALUE_NESTED_CONTRACT", "Nested Value Objects use owned value protocols rather than reference equality");
        record(mapping.matrix_transition?.implementation_ready === false && mapping.non_effects?.includes("no Enum decision"), "VALUE_DECISION_SCOPE", "Value Object approval neither admits implementation nor decides Enum");
      }
      if (decision.meta_type_id === "DS-D1.3") {
        const enumTargets = new Map((mapping.language_target_realizations ?? []).map((target) => [target.language, target]));
        record(decision.architecture_mapping_decision_ref.path === `${packageRepositoryPrefix}decisions/W1-ENUM-001.json` && mapping.selected_option_id === "W1-ENUM-A-NOMINAL-BOUNDARY", "ENUM_MAPPING_SELECTION", "Enum binds the selected nominal-boundary option");
        record(mapping.decision_source?.kind === "user-message" && mapping.decision_source?.exact_text === "1", "ENUM_DECISION_SOURCE", "Enum mapping retains the exact numbered selection");
        record(mapping.decision_source?.scope_evidence === "immediate-conversation-context-only" && mapping.decision_source?.independent_scope_proof === false, "ENUM_DECISION_SOURCE_BOUNDARY", "Enum mapping does not overclaim independent transcript-bound selection proof");
        record(mapping.portable_architecture?.type_id === "architecture.EnumImplementation" && mapping.portable_architecture?.forbidden_collapses?.includes("architecture.EnumImplementation is an implementation architecture type and not the canonical DomainSpec Enum definition"), "ENUM_ARCHITECTURE_IDENTITY", "Enum preserves implementation architecture identity without collapsing canonical DomainSpec authority");
        record(mapping.composition_contract?.resolution_stage === "before-language-native-type-generation" && mapping.composition_contract?.duplicate_keys === "block" && mapping.composition_contract?.duplicate_values === "block" && mapping.composition_contract?.cycles === "block" && mapping.composition_contract?.repeated_contributions === "block" && mapping.composition_contract?.new_canonical_members === "forbidden", "ENUM_COMPOSITION_CONTRACT", "Enum composition closes and validates the finite set before native generation");
        const composedFrom = mapping.portable_architecture?.relation_contracts?.find(({ relation_id }) => relation_id === "architecture.composed_from");
        record(canonicalJson(composedFrom?.source_types) === canonicalJson(["architecture.EnumImplementation", "architecture.EnumRepresentationUnit"]) && canonicalJson(composedFrom?.target_types) === canonicalJson(["architecture.EnumRepresentationUnit"]) && composedFrom?.cycle_policy === "acyclic", "ENUM_RELATION_MODEL", "Enum composition projects through the existing representation-unit provenance endpoints");
        record(mapping.wire_contract?.member_to_wire === "explicit total one-to-one adapter" && mapping.wire_contract?.wire_to_member === "explicit fallible adapter" && mapping.wire_contract?.unknown_wire_value === "structured failure" && mapping.wire_contract?.aliases === "forbidden" && mapping.wire_contract?.domain_wire_equality_collapse === "forbidden", "ENUM_WIRE_CONTRACT", "Enum wire conversion is explicit bijective emission and fallible parsing without identity collapse");
        record(enumTargets.get("typescript")?.form_id === "typescript.owned-const-object-enum" && enumTargets.get("typescript")?.profile_status === "selected-existing-profile-and-provider" && enumTargets.get("python")?.form_id === "python.enum-class" && enumTargets.get("python")?.protocol_id === "python.nominal-enum-explicit-wire/v1" && enumTargets.get("rust")?.form_id === "rust.native-enum" && enumTargets.get("rust")?.protocol_id === "rust.nominal-enum-explicit-wire/v1", "ENUM_LANGUAGE_TARGETS", "Enum targets the existing TypeScript provider Python nominal Enum and Rust native Enum");
        record(mapping.matrix_transition?.implementation_ready === false && mapping.non_effects?.includes("no W2 behavioral-form decision"), "ENUM_DECISION_SCOPE", "Enum selection closes W1 design without admitting implementation or deciding W2");
      }
    } catch (error) {
      record(false, "MAPPING_DECISION_READ", `${decision.meta_type_id} mapping decision cannot be validated: ${error.message}`);
    }
  }

  const languages = decision.language_realizations.map(({ language }) => language);
  record(languages.length === 3 && new Set(languages).size === 3 && sameSet(languages, expectedLanguages), "LANGUAGE_TOTALITY", `${decision.meta_type_id} has exactly one TypeScript, Python, and Rust realization decision`);

  for (const realization of decision.language_realizations) {
    const resolvedProfile = resolveRepositoryPath(realization.profile_ref);
    inputPaths.add(resolvedProfile);
    const profileBytes = await readFile(resolvedProfile);
    const profile = JSON.parse(profileBytes.toString("utf8"));
    record(sha256(profileBytes) === realization.profile_sha256, "PROFILE_DIGEST", `${decision.meta_type_id}/${realization.language} profile digest is current`);
    if (realization.decision_status === "selected") {
      record(realization.selected_form !== null && realization.candidate_forms.includes(realization.selected_form), "SELECTED_FORM", `${decision.meta_type_id}/${realization.language} selected form belongs to its candidates`);
      record(realization.decision_ref !== null, "SELECTED_FORM_DECISION", `${decision.meta_type_id}/${realization.language} selected form has an exact decision reference`);
      if (realization.decision_ref) {
        const resolvedDecision = resolveRepositoryPath(realization.decision_ref.path);
        inputPaths.add(resolvedDecision);
        const decisionBytes = await readFile(resolvedDecision);
        record(sha256(decisionBytes) === realization.decision_ref.sha256, "FORM_DECISION_DIGEST", `${decision.meta_type_id}/${realization.language} decision digest is current`);
      }
      const overlay = (profile.representation_overlays ?? []).find(({ admitted_forms = [] }) => admitted_forms.includes(realization.selected_form));
      record(Boolean(overlay), "SELECTED_FORM_PROFILE_ADMISSION", `${decision.meta_type_id}/${realization.language} selected form is admitted by its exact profile`);
      const protocol = (overlay?.candidate_protocols ?? []).find(({ form_id }) => form_id === realization.selected_form);
      if (protocol?.runtime_provider) {
        const resolvedProvider = resolveRepositoryPath(protocol.runtime_provider.module_path);
        inputPaths.add(resolvedProvider);
        const providerBytes = await readFile(resolvedProvider);
        record(sha256(providerBytes) === protocol.runtime_provider.provider_sha256, "RUNTIME_PROVIDER_DIGEST", `${decision.meta_type_id}/${realization.language} selected runtime provider digest is current`);
      }
    } else {
      record(realization.selected_form === null && realization.decision_ref === null, "UNSELECTED_FORM", `${decision.meta_type_id}/${realization.language} does not impersonate a selected form`);
    }
  }

  for (const propertyId of decision.architecture_form.required_property_ids) {
    record(ontologyPropertyIds.has(propertyId), "PROPERTY_REF", `${decision.meta_type_id} property ${propertyId} exists in the candidate ontology`);
  }
  for (const relationId of decision.architecture_form.allowed_relation_ids) {
    record(ontologyRelationIds.has(relationId), "RELATION_REF", `${decision.meta_type_id} relation ${relationId} exists in the candidate ontology`);
  }

  if (source.mapping_status === "candidate-mapped") {
    record(decision.architecture_form.type_id === source.architecture_type_id, "MAPPED_TYPE_IDENTITY", `${decision.meta_type_id} preserves the projected candidate architecture identity`);
    record(ontologyTypeIds.has(decision.architecture_form.type_id), "MAPPED_TYPE_EXISTS", `${decision.meta_type_id} candidate architecture type exists in the ontology`);
  }

  if (decision.outcome === "implement") {
    record(decision.definition_maturity === "active", "IMPLEMENT_MATURITY", `${decision.meta_type_id} implementation outcome requires active definition maturity`);
    record(decision.architecture_form.type_id !== null && decision.architecture_form.portable_invariants.length > 0, "PORTABLE_FORM", `${decision.meta_type_id} has a proposed portable form and invariants`);
    record(decision.proof_requirements.positive_obligations.length > 0 && decision.proof_requirements.negative_controls.length > 0, "PROOF_TOTALITY", `${decision.meta_type_id} has positive obligations and negative controls`);
    record(decision.proof_requirements.required_observation_stages.length > 0 && decision.proof_requirements.required_evidence_classes.length > 0, "EVIDENCE_TOTALITY", `${decision.meta_type_id} has observation stages and evidence classes`);
    try {
      const resolvedCriterion = resolveRepositoryPath(`projects/domainspec-v2/${decision.canonical_ref.criterion_path}`);
      inputPaths.add(resolvedCriterion);
      const criterion = await readFile(resolvedCriterion);
      record(criterion.length > 0, "CRITERION_EXISTS", `${decision.meta_type_id} criterion schema exists and is non-empty`);
      record(sha256(criterion) === decision.canonical_ref.criterion_sha256, "CRITERION_DIGEST", `${decision.meta_type_id} criterion schema digest is current`);
    } catch (error) {
      record(false, "CRITERION_EXISTS", `${decision.meta_type_id} criterion schema is unavailable: ${error.message}`);
    }
  }

  const requiresRelationProof = decision.architecture_form.allowed_relation_ids.some((relationId) => relationId !== "architecture.depends_on") || decision.architecture_form.missing_relation_decisions.length > 0;
  if (decision.outcome === "implement" && requiresRelationProof) {
    record(decision.proof_requirements.required_evidence_classes.includes("relation-test"), "RELATION_PROOF", `${decision.meta_type_id} relation-bearing form requires relation-test evidence`);
  }

  if (decision.definition_maturity === "candidate") {
    record(decision.decision_state === "wait-for-definition" && decision.outcome === "wait-for-definition", "CANDIDATE_EXCLUSION", `${decision.meta_type_id} waits for definition admission`);
  }
  if (decision.definition_maturity === "deferred") {
    record(decision.decision_state === "deferred" && decision.outcome === "deferred", "DEFERRED_EXCLUSION", `${decision.meta_type_id} remains deferred`);
  }
  if (decision.definition_maturity === "superseded") {
    record(decision.decision_state === "superseded" && decision.outcome === "superseded", "SUPERSEDED_EXCLUSION", `${decision.meta_type_id} remains superseded`);
  }

  if (decision.decision_state === "implementation-ready") {
    record(decision.blocking_decisions.length === 0, "READY_BLOCKERS", `${decision.meta_type_id} ready decision has no blockers`);
    record(decision.canonical_ref.selected_record_sha256 !== null, "READY_RECORD_DIGEST", `${decision.meta_type_id} ready decision has a selected-record digest`);
    record(decision.architecture_form.decision_status === "owner-decided", "READY_ARCHITECTURE_DECISION", `${decision.meta_type_id} ready architecture form is owner-decided`);
    record(decision.language_realizations.every(({ decision_status }) => decision_status === "selected"), "READY_LANGUAGE_DECISIONS", `${decision.meta_type_id} ready decision has all language forms selected`);
    record(decision.architecture_mapping_decision_ref !== null, "READY_MAPPING_REF", `${decision.meta_type_id} ready decision has an exact architecture mapping decision`);
    record(decision.realization_descriptor_ref !== null, "READY_DESCRIPTOR_REF", `${decision.meta_type_id} ready decision has an exact realization descriptor`);
    record(decision.factory_kit_ref !== null, "READY_KIT_REF", `${decision.meta_type_id} ready decision has an exact factory kit`);
  }

  const progressOrder = [
    "inventoried",
    "definition-ready",
    "architecture-form-proposed",
    "language-forms-proposed",
    "tension-reviewed",
    "owner-decided",
    "descriptor-complete",
    "implementation-ready",
    "implemented",
    "proved"
  ];
  const progress = progressOrder.indexOf(decision.decision_state);
  if (progress >= progressOrder.indexOf("owner-decided")) {
    record(decision.architecture_mapping_decision_ref !== null, "OWNER_DECISION_REF", `${decision.meta_type_id} owner-decided state requires exact mapping bytes`);
    record(decision.architecture_form.decision_status === "owner-decided", "OWNER_DECISION_STATUS", `${decision.meta_type_id} owner-decided state requires an owner-decided architecture form`);
  }
  if (progress >= progressOrder.indexOf("descriptor-complete")) {
    record(decision.realization_descriptor_ref !== null, "DESCRIPTOR_REF", `${decision.meta_type_id} descriptor-complete state requires exact descriptor bytes`);
  }
  if (progress >= progressOrder.indexOf("implementation-ready")) {
    record(decision.factory_kit_ref !== null, "FACTORY_KIT_REF", `${decision.meta_type_id} implementation-ready state requires exact kit bytes`);
  }
}

const readyIds = queue.ready.map(({ meta_type_id }) => meta_type_id);
const blockedIds = queue.blocked.map(({ meta_type_id }) => meta_type_id);
const excludedIds = queue.excluded.map(({ meta_type_id }) => meta_type_id);
const allQueueIds = [...readyIds, ...blockedIds, ...excludedIds];
record(allQueueIds.length === 25 && new Set(allQueueIds).size === 25 && sameSet(allQueueIds, metaTypeIds), "QUEUE_PARTITION", "ready, blocked, and excluded queues partition all 25 meta-types exactly once");
record(sameSet(readyIds, decisions.filter(({ decision_state }) => decision_state === "implementation-ready").map(({ meta_type_id }) => meta_type_id)), "READY_QUEUE", "ready queue exactly matches implementation-ready decisions");
record(sameSet(blockedIds, decisions.filter(({ outcome, decision_state }) => outcome === "implement" && decision_state !== "implementation-ready").map(({ meta_type_id }) => meta_type_id)), "BLOCKED_QUEUE", "blocked queue exactly matches active non-ready implementation decisions");
record(sameSet(excludedIds, decisions.filter(({ outcome }) => outcome !== "implement").map(({ meta_type_id }) => meta_type_id)), "EXCLUDED_QUEUE", "excluded queue exactly matches non-implementation outcomes");

for (const entry of queue.blocked) {
  const decision = decisionById.get(entry.meta_type_id);
  record(decision?.decision_state === entry.decision_state, "QUEUE_STATE", `${entry.meta_type_id} blocked queue state matches its decision card`);
}
for (const entry of queue.ready) {
  const decision = decisionById.get(entry.meta_type_id);
  const exactRefs = [entry.architecture_mapping_decision_ref, entry.realization_descriptor_ref, entry.factory_kit_ref, entry.proof_contract_schema_ref, entry.validation_receipt_ref];
  if (!decision || exactRefs.some((exactRef) => !exactRef?.path || !exactRef?.sha256)) {
    record(false, "READY_QUEUE_SHAPE", `${entry.meta_type_id ?? "unknown"} ready queue entry is incomplete`);
    continue;
  }
  record(decision?.decision_id === entry.decision_id, "READY_QUEUE_DECISION", `${entry.meta_type_id} ready queue binds the exact decision card`);
  record(JSON.stringify(decision?.architecture_mapping_decision_ref) === JSON.stringify(entry.architecture_mapping_decision_ref), "READY_QUEUE_MAPPING", `${entry.meta_type_id} ready queue mapping ref matches its decision card`);
  record(JSON.stringify(decision?.realization_descriptor_ref) === JSON.stringify(entry.realization_descriptor_ref), "READY_QUEUE_DESCRIPTOR", `${entry.meta_type_id} ready queue descriptor ref matches its decision card`);
  record(JSON.stringify(decision?.factory_kit_ref) === JSON.stringify(entry.factory_kit_ref), "READY_QUEUE_KIT", `${entry.meta_type_id} ready queue kit ref matches its decision card`);
  record(!entry.validation_receipt_ref.path.endsWith("/receipts/current-validation.json"), "READY_RECEIPT_ACYCLIC", `${entry.meta_type_id} ready entry references a pre-queue readiness receipt, not the queue-binding campaign receipt`);
  for (const exactRef of exactRefs) {
    const resolvedRef = resolveRepositoryPath(exactRef.path);
    inputPaths.add(resolvedRef);
    const bytes = await readFile(resolvedRef);
    record(sha256(bytes) === exactRef.sha256, "READY_QUEUE_DIGEST", `${entry.meta_type_id} ready queue input ${exactRef.path} is current`);
  }
}
for (const entry of queue.excluded) {
  const decision = decisionById.get(entry.meta_type_id);
  record(decision?.outcome === entry.outcome, "QUEUE_OUTCOME", `${entry.meta_type_id} excluded queue outcome matches its decision card`);
}

const stateIds = new Set(machine.states.map(({ id }) => id));
const transitionKeys = new Set(machine.transitions.map(({ from, to }) => `${from}->${to}`));
record(new Set(machine.states.map(({ id }) => id)).size === machine.states.length, "STATE_UNIQUENESS", "state IDs are unique");
record(machine.transitions.every(({ from, to }) => stateIds.has(from) && stateIds.has(to)), "TRANSITION_CLOSURE", "all transitions reference declared states");
record(decisions.every(({ decision_state }) => stateIds.has(decision_state)), "DECISION_STATE_CLOSURE", "all decision cards use declared states");
for (const decision of decisions) {
  record(decision.state_history[0] === machine.initial_state, "STATE_HISTORY_INITIAL", `${decision.meta_type_id} history starts at the machine initial state`);
  record(decision.state_history.at(-1) === decision.decision_state, "STATE_HISTORY_CURRENT", `${decision.meta_type_id} history ends at its current state`);
  const transitions = decision.state_history.slice(1).map((state, index) => `${decision.state_history[index]}->${state}`);
  record(transitions.every((transition) => transitionKeys.has(transition)), "STATE_HISTORY_LEGAL", `${decision.meta_type_id} history uses only declared transitions`);
}

const inputInventory = await Promise.all(
  stable(inputPaths).map(async (path) => ({
    path: relative(repositoryRoot, path).replaceAll("\\", "/"),
    sha256: sha256(await readFile(path))
  }))
);

const receipt = {
  schema_version: "domainspec-ontology-form-decision-validation/v1",
  campaign_id: matrix.campaign_id,
  status: errors.length === 0 ? "pass" : "block",
  counts: {
    decisions: decisions.length,
    ready: readyIds.length,
    blocked: blockedIds.length,
    excluded: excludedIds.length,
    checks_passed: checks.length,
    errors: errors.length
  },
  input_inventory: inputInventory,
  checks,
  errors,
  next_action: errors.length === 0
    ? "Run decision waves; implementation remains blocked until a card reaches implementation-ready."
    : "Repair validation errors before any owner decision or implementation admission.",
  authority_effect: "none"
};

const receiptArgument = process.argv.indexOf("--write-receipt");
if (receiptArgument >= 0) {
  const target = process.argv[receiptArgument + 1];
  if (!target) throw new Error("--write-receipt requires a path");
  await writeFile(resolve(packageRoot, target), `${JSON.stringify(receipt, null, 2)}\n`);
}

process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
process.exitCode = errors.length === 0 ? 0 : 1;
