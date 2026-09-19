#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const formalizationRoot = dirname(fileURLToPath(import.meta.url));
const stagedRepositoryRoot = resolve(formalizationRoot, "../../..");
const repositoryRoot = process.env.AUTH_FOUNDATION_REPOSITORY_ROOT
  ? resolve(process.env.AUTH_FOUNDATION_REPOSITORY_ROOT)
  : stagedRepositoryRoot;
const liveFormalizationRoot = resolve(
  repositoryRoot,
  "projects/auth-foundation/formalization",
);
const manifestPath = resolve(formalizationRoot, "formalization-package.json");

const checks = [];
const blockers = [];

function check(checkId, condition, detail) {
  checks.push({ check_id: checkId, status: condition ? "pass" : "block", detail });
  if (!condition) blockers.push({ check_id: checkId, detail });
}

function parseJson(path, checkId) {
  try {
    const value = JSON.parse(readFileSync(path, "utf8"));
    check(checkId, true, `${relative(repositoryRoot, path)} parsed as JSON`);
    return value;
  } catch (error) {
    check(checkId, false, `${relative(repositoryRoot, path)}: ${error.message}`);
    return null;
  }
}

function isInside(child, parent) {
  const pathFromParent = relative(parent, child);
  return pathFromParent === "" || (
    !pathFromParent.startsWith("..") && !isAbsolute(pathFromParent)
  );
}

function unique(values) {
  return new Set(values).size === values.length;
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function resolveJsonPointer(document, pointer) {
  if (pointer === "#") return document;
  if (typeof pointer !== "string" || !pointer.startsWith("#/")) {
    throw new Error(`invalid JSON pointer: ${String(pointer)}`);
  }
  return pointer.slice(2).split("/").reduce((cursor, token) => {
    const decoded = token.replaceAll("~1", "/").replaceAll("~0", "~");
    if (cursor === null || cursor === undefined || !(decoded in Object(cursor))) {
      throw new Error(`unresolved JSON pointer: ${pointer}`);
    }
    return cursor[decoded];
  }, document);
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function sha256Text(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function stableJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${stableJson(value[key])}`
    ).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256Stable(value) {
  return sha256Text(stableJson(value));
}

function resolveRepositoryRef(ref) {
  const stagedPath = resolve(stagedRepositoryRoot, ref);
  if (isInside(stagedPath, stagedRepositoryRoot) && existsSync(stagedPath)) {
    return stagedPath;
  }
  return resolve(repositoryRoot, ref);
}

function resolveFormalizationRef(ref) {
  const stagedPath = resolve(formalizationRoot, ref);
  if (isInside(stagedPath, formalizationRoot) && existsSync(stagedPath)) {
    return stagedPath;
  }
  return resolve(
    repositoryRoot,
    "projects/auth-foundation/formalization",
    ref,
  );
}

const ontologyPath = resolveFormalizationRef("ontology/authorization.ontology.json");

function jsonType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  return typeof value;
}

function typeMatches(value, expectedType) {
  if (expectedType === "number") return typeof value === "number";
  if (expectedType === "object") {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  return jsonType(value) === expectedType;
}

function resolveLocalRef(ref, rootSchema) {
  if (!ref.startsWith("#/")) throw new Error(`unsupported schema reference: ${ref}`);
  return ref.slice(2).split("/").reduce((cursor, token) => {
    const decoded = token.replaceAll("~1", "/").replaceAll("~0", "~");
    if (cursor === undefined || !(decoded in cursor)) {
      throw new Error(`unresolved schema reference: ${ref}`);
    }
    return cursor[decoded];
  }, rootSchema);
}

function validateSchemaInstance(instance, schema, rootSchema, instancePath = "$") {
  const errors = [];

  if (schema.$ref) {
    return validateSchemaInstance(
      instance,
      resolveLocalRef(schema.$ref, rootSchema),
      rootSchema,
      instancePath,
    );
  }

  for (const branch of schema.allOf ?? []) {
    errors.push(...validateSchemaInstance(instance, branch, rootSchema, instancePath));
  }
  if (schema.anyOf) {
    const branchErrors = schema.anyOf.map((branch) =>
      validateSchemaInstance(instance, branch, rootSchema, instancePath)
    );
    if (!branchErrors.some((items) => items.length === 0)) {
      errors.push(`${instancePath}: does not satisfy anyOf`);
    }
  }
  if (schema.oneOf) {
    const matchingBranches = schema.oneOf.filter((branch) =>
      validateSchemaInstance(instance, branch, rootSchema, instancePath).length === 0
    ).length;
    if (matchingBranches !== 1) {
      errors.push(`${instancePath}: satisfies ${matchingBranches} oneOf branches instead of one`);
    }
  }
  if (schema.not && validateSchemaInstance(instance, schema.not, rootSchema, instancePath).length === 0) {
    errors.push(`${instancePath}: satisfies forbidden not schema`);
  }
  if (schema.if) {
    const conditionMatches = validateSchemaInstance(
      instance,
      schema.if,
      rootSchema,
      instancePath,
    ).length === 0;
    if (conditionMatches && schema.then) {
      errors.push(...validateSchemaInstance(instance, schema.then, rootSchema, instancePath));
    }
    if (!conditionMatches && schema.else) {
      errors.push(...validateSchemaInstance(instance, schema.else, rootSchema, instancePath));
    }
  }

  if (Object.hasOwn(schema, "const") && !deepEqual(instance, schema.const)) {
    errors.push(`${instancePath}: expected constant ${JSON.stringify(schema.const)}`);
  }
  if (schema.enum && !schema.enum.some((value) => deepEqual(instance, value))) {
    errors.push(`${instancePath}: value is outside enum`);
  }

  if (schema.type) {
    const allowedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!allowedTypes.some((type) => typeMatches(instance, type))) {
      errors.push(`${instancePath}: expected type ${allowedTypes.join("|")}, got ${jsonType(instance)}`);
      return errors;
    }
  }

  if (typeof instance === "string") {
    if (schema.minLength !== undefined && instance.length < schema.minLength) {
      errors.push(`${instancePath}: shorter than minLength ${schema.minLength}`);
    }
    if (schema.pattern && !(new RegExp(schema.pattern)).test(instance)) {
      errors.push(`${instancePath}: does not match ${schema.pattern}`);
    }
  }

  if (typeof instance === "number" && schema.minimum !== undefined && instance < schema.minimum) {
    errors.push(`${instancePath}: lower than minimum ${schema.minimum}`);
  }

  if (Array.isArray(instance)) {
    if (schema.minItems !== undefined && instance.length < schema.minItems) {
      errors.push(`${instancePath}: has fewer than ${schema.minItems} items`);
    }
    if (schema.uniqueItems === true) {
      const identities = instance.map((value) => JSON.stringify(value));
      if (!unique(identities)) errors.push(`${instancePath}: items are not unique`);
    }
    if (schema.items) {
      instance.forEach((value, index) => {
        errors.push(...validateSchemaInstance(
          value,
          schema.items,
          rootSchema,
          `${instancePath}[${index}]`,
        ));
      });
    }
  }

  if (instance !== null && typeof instance === "object" && !Array.isArray(instance)) {
    const properties = schema.properties ?? {};
    for (const requiredProperty of schema.required ?? []) {
      if (!Object.hasOwn(instance, requiredProperty)) {
        errors.push(`${instancePath}: missing required property ${requiredProperty}`);
      }
    }
    for (const [key, value] of Object.entries(instance)) {
      if (Object.hasOwn(properties, key)) {
        errors.push(...validateSchemaInstance(
          value,
          properties[key],
          rootSchema,
          `${instancePath}.${key}`,
        ));
      } else if (schema.additionalProperties === false) {
        errors.push(`${instancePath}: unexpected property ${key}`);
      } else if (
        schema.additionalProperties &&
        typeof schema.additionalProperties === "object"
      ) {
        errors.push(...validateSchemaInstance(
          value,
          schema.additionalProperties,
          rootSchema,
          `${instancePath}.${key}`,
        ));
      }
    }
  }

  return errors;
}

function resolveSchemaPath(schemaRef) {
  return schemaRef.startsWith("projects/")
    ? resolveRepositoryRef(schemaRef)
    : resolveFormalizationRef(schemaRef);
}

function exactRefErrors(label, exactRef, requireCurrent = true) {
  const errors = [];
  if (!exactRef || typeof exactRef !== "object") {
    return [`${label}: exact reference is missing`];
  }
  const targetPath = resolveRepositoryRef(exactRef.path ?? "");
  if ((!isInside(targetPath, repositoryRoot) &&
      !isInside(targetPath, stagedRepositoryRoot)) || !existsSync(targetPath)) {
    return [`${label}: target is missing or outside repository`];
  }
  const actualDigest = sha256(targetPath);
  const actualSize = statSync(targetPath).size;
  if (requireCurrent && exactRef.current !== true) {
    errors.push(`${label}: current must be true`);
  }
  if (exactRef.sha256 !== actualDigest) {
    errors.push(`${label}: digest expected ${exactRef.sha256}, got ${actualDigest}`);
  }
  if (exactRef.size_bytes !== actualSize) {
    errors.push(`${label}: size expected ${exactRef.size_bytes}, got ${actualSize}`);
  }
  return errors;
}

const manifest = parseJson(manifestPath, "AF-V001");
const ontology = parseJson(ontologyPath, "AF-V002");

if (!manifest || !ontology) {
  process.stdout.write(`${JSON.stringify({
    schema_version: "auth-foundation.formalization-validation/v1",
    status: "block",
    authority_effect: "none",
    checks,
    blockers,
  }, null, 2)}\n`);
  process.exitCode = 1;
} else {
  const sourceIds = manifest.source_identities.map((source) => source.source_id);
  const sourceIdSet = new Set(sourceIds);
  const nodeIds = ontology.nodes.map((node) => node.concept_id);
  const nodeIdSet = new Set(nodeIds);
  const relationIds = ontology.relations.map((edge) => edge.relation_id);
  const invariantIds = ontology.invariants.map((item) => item.invariant_id);
  const residueIds = ontology.residue.map((item) => item.residue_id);

  check(
    "AF-V003",
    manifest.package_id === "auth-foundation.formalization" &&
      manifest.package_root === "projects/auth-foundation/formalization" &&
      manifest.package_owner === "projects/auth-foundation",
    "manifest identifies the bounded Auth Foundation formalization package",
  );
  check(
    "AF-V004",
    manifest.canonical_format === "application/json" &&
      manifest.human_views_are_canonical === false,
    "JSON and JSON Schema are canonical; human views are supporting only",
  );
  check(
    "AF-V005",
    manifest.ontology_type === "business-domain" &&
      manifest.branch === "business" &&
      ontology.ontology_type === "business-domain" &&
      ontology.branch === "business",
    "package and ontology use the business-domain/business route",
  );
  check(
    "AF-V006",
    manifest.authority_effect === "none" && ontology.authority_effect === "none",
    "package and ontology grant no authority",
  );
  check("AF-V007", unique(sourceIds), "source identities are unique");

  const sourceFailures = [];
  for (const source of manifest.source_identities) {
    const sourcePath = resolveRepositoryRef(source.path);
    if (!isInside(sourcePath, repositoryRoot) || !existsSync(sourcePath)) {
      sourceFailures.push(`${source.source_id}: missing or outside repository`);
      continue;
    }
    const actualSize = statSync(sourcePath).size;
    const actualDigest = sha256(sourcePath);
    if (actualSize !== source.size || actualDigest !== source.sha256) {
      sourceFailures.push(
        `${source.source_id}: expected ${source.sha256}/${source.size}, got ${actualDigest}/${actualSize}`,
      );
    }
  }
  check(
    "AF-V008",
    sourceFailures.length === 0,
    sourceFailures.length === 0
      ? `${manifest.source_identities.length} source identities match exact bytes`
      : sourceFailures.join("; "),
  );

  const artifactFailures = [];
  for (const artifact of manifest.artifacts) {
    const artifactPath = resolveFormalizationRef(artifact.path);
    if ((!isInside(artifactPath, formalizationRoot) &&
        !isInside(artifactPath, liveFormalizationRoot)) || !existsSync(artifactPath)) {
      artifactFailures.push(`${artifact.artifact_id}: missing or outside package`);
    }
    if (artifact.canonical === true && artifact.path.toLowerCase().endsWith(".md")) {
      artifactFailures.push(`${artifact.artifact_id}: Markdown cannot be canonical`);
    }
  }
  check(
    "AF-V009",
    artifactFailures.length === 0,
    artifactFailures.length === 0
      ? `${manifest.artifacts.length} declared artifacts exist within the package`
      : artifactFailures.join("; "),
  );

  const schemaFailures = [];
  const schemaBindings = [
    { ref: manifest.schema_ref, path: resolveFormalizationRef(manifest.schema_ref) },
    { ref: ontology.schema_ref, path: resolve(dirname(ontologyPath), ontology.schema_ref) },
  ];
  for (const [index, binding] of schemaBindings.entries()) {
    const schema = parseJson(binding.path, `AF-V010-${index + 1}`);
    if (!schema || schema.$schema !== "https://json-schema.org/draft/2020-12/schema") {
      schemaFailures.push(`${binding.ref}: not a Draft 2020-12 JSON Schema`);
    }
  }
  check(
    "AF-V010",
    schemaFailures.length === 0,
    schemaFailures.length === 0
      ? "both declared schemas are Draft 2020-12 JSON Schemas"
      : schemaFailures.join("; "),
  );

  check(
    "AF-V011",
    ontology.package_ref === "../formalization-package.json",
    "ontology resolves to its package manifest",
  );
  check(
    "AF-V012",
    ontology.model_origin.model_id === "cyberalchemy-v2.ontology-model" &&
      ontology.model_origin.source_refs.every((sourceRef) => sourceIdSet.has(sourceRef)),
    "CyberAlchemy-v2 model origin is explicit and source-bound",
  );
  check(
    "AF-V013",
    Array.isArray(ontology.model_delta.adopted_contract_fields) &&
      ontology.model_delta.adopted_contract_fields.length > 0 &&
      Array.isArray(ontology.model_delta.domain_extensions) &&
      ontology.model_delta.domain_extensions.length > 0 &&
      Array.isArray(ontology.model_delta.deferred_items) &&
      ontology.model_delta.deferred_items.length > 0 &&
      Array.isArray(ontology.model_delta.forbidden_inferences) &&
      ontology.model_delta.forbidden_inferences.length > 0,
    "local adoption, extensions, deferrals, and forbidden inferences are explicit",
  );
  check("AF-V014", unique(nodeIds), "concept identities are unique");
  check("AF-V015", unique(relationIds), "relation identities are unique");
  check("AF-V016", unique(invariantIds), "invariant identities are unique");
  check("AF-V017", unique(residueIds), "residue identities are unique");

  const nodeFailures = [];
  for (const node of ontology.nodes) {
    const requiredStrings = [
      node.concept_id,
      node.label,
      node.concept_role,
      node.owner_route,
      node.candidate_status,
      node.forbidden_collapse,
      node.definition?.formal,
      node.definition?.plain_language,
      node.definition?.domain_context,
      node.confidence?.evidence_confidence,
      node.confidence?.commitment_confidence,
      node.challenge_contract?.challenge_response,
      node.challenge_contract?.owner_route,
      node.challenge_contract?.resolution_gate,
      node.challenge_contract?.challenge_residue_route,
    ];
    if (!requiredStrings.every(nonEmptyString)) {
      nodeFailures.push(`${node.concept_id ?? "unknown"}: incomplete node contract`);
    }
    if (!Array.isArray(node.fields) || node.fields.some((field) =>
      !nonEmptyString(field.name) ||
      !nonEmptyString(field.type) ||
      typeof field.required !== "boolean" ||
      !nonEmptyString(field.meaning)
    )) {
      nodeFailures.push(`${node.concept_id}: invalid typed field contract`);
    }
    if (!node.source_refs.every((sourceRef) => sourceIdSet.has(sourceRef))) {
      nodeFailures.push(`${node.concept_id}: unknown source reference`);
    }
  }
  check(
    "AF-V018",
    nodeFailures.length === 0,
    nodeFailures.length === 0
      ? `${ontology.nodes.length} nodes carry the adopted contract, three voices, and valid field declarations`
      : nodeFailures.join("; "),
  );

  const relationFailures = [];
  for (const edge of ontology.relations) {
    if (!nodeIdSet.has(edge.source_concept) || !nodeIdSet.has(edge.target_concept)) {
      relationFailures.push(`${edge.relation_id}: endpoint is not a declared concept`);
    }
    if (!edge.evidence_refs.every((sourceRef) => sourceIdSet.has(sourceRef))) {
      relationFailures.push(`${edge.relation_id}: unknown evidence reference`);
    }
    if (edge.authority_effect !== "none") {
      relationFailures.push(`${edge.relation_id}: authority effect must be none`);
    }
    if (edge.value_effect === "value-constraining" && edge.cycle_policy === "cycle-permitted") {
      relationFailures.push(`${edge.relation_id}: value-constraining cycles are forbidden`);
    }
    if (!nonEmptyString(edge.forbidden_collapse)) {
      relationFailures.push(`${edge.relation_id}: forbidden collapse is missing`);
    }
  }
  check(
    "AF-V019",
    relationFailures.length === 0,
    relationFailures.length === 0
      ? `${ontology.relations.length} typed relations have closed endpoints and no authority effect`
      : relationFailures.join("; "),
  );

  check(
    "AF-V020",
    ontology.invariants.every(
      (item) => nonEmptyString(item.statement) &&
        nonEmptyString(item.formal) &&
        item.status === "candidate" &&
        nonEmptyString(item.failure_result),
    ),
    `${ontology.invariants.length} candidate invariants have formal readings and failure results`,
  );
  check(
    "AF-V021",
    ontology.residue.every(
      (item) => item.status === "open" &&
        nonEmptyString(item.description) &&
        nonEmptyString(item.owner_route) &&
        Array.isArray(item.blocks) &&
        item.blocks.length > 0,
    ),
    `${ontology.residue.length} unresolved items remain explicit and routed`,
  );
  check(
    "AF-V022",
    Array.isArray(ontology.forbidden_collapses) &&
      ontology.forbidden_collapses.length > 0 &&
      nonEmptyString(manifest.claim_ceiling),
    "security, proof, and authority non-collapse boundaries are explicit",
  );

  const localSchemaPaths = [
    "schemas/auth-formal-claim-identity-algorithm.schema.json",
    "schemas/auth-formal-claim-identity-algorithm.v2.schema.json",
    "schemas/auth-formal-claim-identity-inputs.schema.json",
    "schemas/auth-formal-claim-identity-inputs.v2.schema.json",
    "schemas/auth-lean-theorem-execution-policy.v1.schema.json",
    "schemas/auth-lean-theorem-route-admission-decision.v1.schema.json",
    "schemas/auth-formalization-authoring-trace.schema.json",
  ];
  const localSchemaFailures = [];
  for (const schemaRef of localSchemaPaths) {
    const schemaPath = resolveFormalizationRef(schemaRef);
    try {
      const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
      if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") {
        localSchemaFailures.push(`${schemaRef}: not Draft 2020-12`);
      }
    } catch (error) {
      localSchemaFailures.push(`${schemaRef}: ${error.message}`);
    }
  }
  check(
    "AF-V023",
    localSchemaFailures.length === 0,
    localSchemaFailures.length === 0
      ? `${localSchemaPaths.length} Auth-owned case schemas are Draft 2020-12 JSON Schemas`
      : localSchemaFailures.join("; "),
  );

  const schemaInstanceFailures = [];
  const schemaInstanceBindings = [
    {
      label: "formalization-package",
      instance: manifest,
      schemaPath: resolveFormalizationRef(manifest.schema_ref),
    },
    {
      label: "authorization-ontology",
      instance: ontology,
      schemaPath: resolve(dirname(ontologyPath), ontology.schema_ref),
    },
  ];
  for (const artifact of manifest.artifacts.filter((item) => item.schema_ref !== null)) {
    const artifactPath = resolveFormalizationRef(artifact.path);
    try {
      schemaInstanceBindings.push({
        label: artifact.artifact_id,
        instance: JSON.parse(readFileSync(artifactPath, "utf8")),
        schemaPath: resolveSchemaPath(artifact.schema_ref),
      });
    } catch (error) {
      schemaInstanceFailures.push(`${artifact.artifact_id}: ${error.message}`);
    }
  }
  for (const binding of schemaInstanceBindings) {
    try {
      const schema = JSON.parse(readFileSync(binding.schemaPath, "utf8"));
      const errors = validateSchemaInstance(binding.instance, schema, schema);
      schemaInstanceFailures.push(...errors.map((error) => `${binding.label}: ${error}`));
    } catch (error) {
      schemaInstanceFailures.push(`${binding.label}: schema load failed: ${error.message}`);
    }
  }
  check(
    "AF-V024",
    schemaInstanceFailures.length === 0,
    schemaInstanceFailures.length === 0
      ? `${schemaInstanceBindings.length} canonical instances satisfy their declared JSON Schemas`
      : schemaInstanceFailures.join("; "),
  );

  const caseRoot = resolve(
    formalizationRoot,
    "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001",
  );
  const casePaths = {
    authoringTrace: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/AUTHORING-TRACE.json",
    ),
    identityAlgorithm: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/IDENTITY-ALGORITHM.json",
    ),
    identityAlgorithmV2: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/IDENTITY-ALGORITHM.v2.json",
    ),
    identityAlgorithmV3: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/IDENTITY-ALGORITHM.v3.json",
    ),
    reviewedBusinessMeaning: resolveRepositoryRef(
      "projects/auth-foundation/formalization/cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/BUSINESS-MEANING.json",
    ),
    reviewedInterpretationModel: resolveRepositoryRef(
      "projects/auth-foundation/formalization/cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/INTERPRETATION-MODEL.json",
    ),
    businessMeaning: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/BUSINESS-MEANING.accepted.json",
    ),
    definitionsBusinessMeaning: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/BUSINESS-MEANING.v2-definitions-candidate.json",
    ),
    acceptedDefinitionsBusinessMeaning: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/BUSINESS-MEANING.v2-definitions-accepted.json",
    ),
    interpretationModel: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/INTERPRETATION-MODEL.accepted.json",
    ),
    interpretationModelCandidate: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/INTERPRETATION-MODEL.v3-definitions-aligned-candidate.json",
    ),
    alignedInterpretationModel: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/INTERPRETATION-MODEL.v3-definitions-aligned-accepted.json",
    ),
    evaluationSeparatedInterpretationModel: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/INTERPRETATION-MODEL.v4-evaluation-context-separated-candidate.json",
    ),
    ontologySemanticAlignment: resolveFormalizationRef(
      "ontology/authorization-semantic-alignment.v1-candidate.json",
    ),
    identityInputs: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/CLAIM-IDENTITY-INPUTS.json",
    ),
    definitionBinding: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/FORMAL-CLAIM-DEFINITION-BINDING.v1-candidate.json",
    ),
    definitionBindingV2: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/FORMAL-CLAIM-DEFINITION-BINDING.v2-lean-candidate.json",
    ),
    identityInputsV2: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/CLAIM-IDENTITY-INPUTS.v2-definitions-bound.json",
    ),
    identityInputsV3: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/CLAIM-IDENTITY-INPUTS.v3-lean-bound.json",
    ),
    formalClaimV3: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/FORMAL-CLAIM.v3-candidate.json",
    ),
    formalClaimV4: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/FORMAL-CLAIM.v4-definitions-bound-candidate.json",
    ),
    formalClaimV5: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/FORMAL-CLAIM.v5-lean-candidate.json",
    ),
    leanEnvironment: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/LEAN-ENVIRONMENT.v1-candidate.json",
    ),
    preservationBinding: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/PRESERVATION-BINDING.v1-candidate.json",
    ),
    formalClaimLeanBinding: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/FORMAL-CLAIM-LEAN-BINDING.v1-candidate.json",
    ),
    leanProviderRuntimeBinding: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/LEAN-PROVIDER-RUNTIME-BINDING.v1-candidate.json",
    ),
    theoremExecutionPolicy: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/THEOREM-EXECUTION-POLICY.v1-candidate.json",
    ),
    theoremObligationRequest: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/THEOREM-OBLIGATION-REQUEST.v1-candidate.json",
    ),
    theoremObligationRequestReady: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/THEOREM-OBLIGATION-REQUEST.v2-ready.json",
    ),
    leanCandidateValidation: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/LEAN-CANDIDATE-VALIDATION.v1.json",
    ),
    admissionReadiness: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/LEAN-CANDIDATE-ADMISSION-READINESS.v1.json",
    ),
    formalClaimEnvelope: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/FORMAL-CLAIM-CONSUMER-ENVELOPE.v1-derived.json",
    ),
    casePackage: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/CASE-PACKAGE.json",
    ),
    ownerSemanticDecision: resolveRepositoryRef(
      "projects/auth-foundation/formalization/decisions/AF-EXACT-SESSION-ROLE-PERMISSION-001/owner-semantic-decision.json",
    ),
    businessMeaningV2Decision: resolveRepositoryRef(
      "projects/auth-foundation/formalization/decisions/AF-EXACT-SESSION-ROLE-PERMISSION-001/business-meaning-v2-decision-gate.json",
    ),
    interpretationModelV3Decision: resolveRepositoryRef(
      "projects/auth-foundation/formalization/decisions/AF-EXACT-SESSION-ROLE-PERMISSION-001/interpretation-model-v3-decision-gate.json",
    ),
    profileAdmissionCandidate: resolveRepositoryRef(
      "projects/domainspec-v2/formalization/profiles/lean-dtt-auth-admission-candidate.json",
    ),
    independentLeanReview: resolveRepositoryRef(
      "projects/domainspec-v2/formalization/profiles/reviews/lean-dtt-auth-v5-independent-review.json",
    ),
    profileAdmissionDecision: resolveRepositoryRef(
      "projects/domainspec-v2/formalization/profiles/decisions/lean-dtt-auth-v5-admission.json",
    ),
    formalClaimV5Decision: resolveRepositoryRef(
      "projects/auth-foundation/formalization/decisions/AF-EXACT-SESSION-ROLE-PERMISSION-001/formal-claim-v5-lean-admission.json",
    ),
    leanTheoremRouteDecision: resolveRepositoryRef(
      "projects/auth-foundation/formalization/decisions/AF-EXACT-SESSION-ROLE-PERMISSION-001/lean-theorem-route-admission.json",
    ),
  };
  const caseValues = {};
  const caseParseFailures = [];
  for (const [name, path] of Object.entries(casePaths)) {
    try {
      caseValues[name] = JSON.parse(readFileSync(path, "utf8"));
    } catch (error) {
      caseParseFailures.push(`${name}: ${error.message}`);
    }
  }
  check(
    "AF-V025",
    caseParseFailures.length === 0,
    caseParseFailures.length === 0
      ? `${Object.keys(casePaths).length} Auth case JSON artifacts parse`
      : caseParseFailures.join("; "),
  );

  const exactReferenceFailures = [];
  if (caseParseFailures.length === 0) {
    for (const [index, artifact] of caseValues.casePackage.artifacts.entries()) {
      exactReferenceFailures.push(...exactRefErrors(
        `case.artifacts[${index}](${artifact.artifact_kind})`,
        artifact,
      ));
      const schemaPath = resolveRepositoryRef(artifact.schema_path);
      if (!isInside(schemaPath, repositoryRoot) || !existsSync(schemaPath)) {
        exactReferenceFailures.push(
          `case.artifacts[${index}](${artifact.artifact_kind}): schema path is missing`,
        );
      }
    }
    const exactRefs = [
      ["case.business_meaning_ref", caseValues.casePackage.business_semantic_acceptance.business_meaning_ref],
      ["case.business_acceptance_ref", caseValues.casePackage.business_semantic_acceptance.business_acceptance_ref],
      ["case.formal_claim_ref", caseValues.casePackage.formal_claim.claim_ref],
      ["case.formal_claim_admission_ref", caseValues.casePackage.formal_claim.admission_ref],
      ["identity.business_meaning_ref", caseValues.identityInputs.business_meaning_ref],
      ["identity.interpretation_model_ref", caseValues.identityInputs.interpretation_model_ref],
      ["identity.profile_registry_ref", caseValues.identityInputs.formal_language_profile.registry_ref],
      ["v3.identity_algorithm_ref", caseValues.formalClaimV3.claim.identity_algorithm_ref],
      ["v3.business_meaning_ref", caseValues.formalClaimV3.business_meaning_ref],
      ["v3.business_acceptance_ref", caseValues.formalClaimV3.business_acceptance_ref],
      ["v3.interpretation_model_ref", caseValues.formalClaimV3.interpretation_model_ref],
      ["v3.interpretation_acceptance_ref", caseValues.formalClaimV3.interpretation_acceptance_ref],
      ["v3.formal_language_profile_ref", caseValues.formalClaimV3.formal_language_profile_ref],
      ["v3.proposition.identity_algorithm_ref", caseValues.formalClaimV3.canonical_proposition.identity_algorithm_ref],
      ["identity-v2.business_meaning_ref", caseValues.identityInputsV2.business_meaning_ref],
      ["identity-v2.definition_binding_ref", caseValues.identityInputsV2.definition_binding_ref],
      ["identity-v2.profile_registry_ref", caseValues.identityInputsV2.formal_language_profile.registry_ref],
      ["definition-binding.definition_authority_ref", caseValues.definitionBinding.definition_authority_ref],
      ["v4.identity_algorithm_ref", caseValues.formalClaimV4.claim.identity_algorithm_ref],
      ["v4.business_meaning_ref", caseValues.formalClaimV4.business_meaning_ref],
      ["v4.business_acceptance_ref", caseValues.formalClaimV4.business_acceptance_ref],
      ["v4.definition_binding_ref", caseValues.formalClaimV4.definition_binding_ref],
      ["v4.formal_language_profile_ref", caseValues.formalClaimV4.formal_language_profile_ref],
      ["v4.proposition.identity_algorithm_ref", caseValues.formalClaimV4.canonical_proposition.identity_algorithm_ref],
      ["identity-v3.business_meaning_ref", caseValues.identityInputsV3.business_meaning_ref],
      ["identity-v3.definition_binding_ref", caseValues.identityInputsV3.definition_binding_ref],
      ["identity-v3.profile_registry_ref", caseValues.identityInputsV3.formal_language_profile.registry_ref],
      ["identity-v3.lean_source_ref", caseValues.identityInputsV3.lean_source_ref],
      ["identity-v3.lean_environment_ref", caseValues.identityInputsV3.lean_environment_ref],
      ["definition-binding-v2.predecessor_binding_ref", caseValues.definitionBindingV2.predecessor_binding_ref],
      ["definition-binding-v2.definition_authority_ref", caseValues.definitionBindingV2.definition_authority_ref],
      ["v5.identity_algorithm_ref", caseValues.formalClaimV5.claim.identity_algorithm_ref],
      ["v5.business_meaning_ref", caseValues.formalClaimV5.business_meaning_ref],
      ["v5.business_acceptance_ref", caseValues.formalClaimV5.business_acceptance_ref],
      ["v5.definition_binding_ref", caseValues.formalClaimV5.definition_binding_ref],
      ["v5.formal_language_profile_ref", caseValues.formalClaimV5.formal_language_profile_ref],
      ["v5.proposition.identity_algorithm_ref", caseValues.formalClaimV5.canonical_proposition.identity_algorithm_ref],
      ["lean-environment.toolchain_ref", caseValues.leanEnvironment.toolchain_ref],
      ["preservation.projection_ref", caseValues.preservationBinding.projection_ref, false],
      ["preservation.certificate_ref", caseValues.preservationBinding.certificate_ref, false],
      ["lean-binding.formal_claim_ref", caseValues.formalClaimLeanBinding.formal_claim_ref],
      ["lean-binding.lean_profile_ref", caseValues.formalClaimLeanBinding.lean_profile_ref],
      ["lean-binding.lean_environment_ref", caseValues.formalClaimLeanBinding.lean_environment_ref],
      ["lean-binding.lean_statement_ref", caseValues.formalClaimLeanBinding.lean_statement_ref],
      ["lean-binding.preservation_binding_ref", caseValues.formalClaimLeanBinding.preservation_binding_ref],
      ["runtime.profile_ref", caseValues.leanProviderRuntimeBinding.profile_ref],
      ["runtime.input_artifact_ref", caseValues.leanProviderRuntimeBinding.input_artifact_ref],
      ["policy.lean_profile_admission_ref", caseValues.theoremExecutionPolicy.lean_profile_admission_ref],
      ["policy.lean_environment_ref", caseValues.theoremExecutionPolicy.lean_environment_ref],
      ["theorem-request.formal_claim_lean_binding_ref", caseValues.theoremObligationRequest.formal_claim_lean_binding_ref],
      ["theorem-request.theorem_statement_ref", caseValues.theoremObligationRequest.theorem_statement_ref],
      ["theorem-request.provider_profile_ref", caseValues.theoremObligationRequest.provider_profile_ref],
      ["theorem-request.runtime_binding_ref", caseValues.theoremObligationRequest.runtime_binding_ref],
      ["theorem-request.execution_policy_ref", caseValues.theoremObligationRequest.execution_policy_ref],
      ["theorem-request-ready.formal_claim_lean_binding_ref", caseValues.theoremObligationRequestReady.formal_claim_lean_binding_ref],
      ["theorem-request-ready.theorem_statement_ref", caseValues.theoremObligationRequestReady.theorem_statement_ref],
      ["theorem-request-ready.provider_profile_ref", caseValues.theoremObligationRequestReady.provider_profile_ref],
      ["theorem-request-ready.runtime_binding_ref", caseValues.theoremObligationRequestReady.runtime_binding_ref],
      ["theorem-request-ready.execution_policy_ref", caseValues.theoremObligationRequestReady.execution_policy_ref],
      ["profile-admission.candidate_ref", caseValues.profileAdmissionDecision.candidate_ref],
      ["profile-admission.review_ref", caseValues.profileAdmissionDecision.review_ref],
      ["profile-admission.readiness_ref", caseValues.profileAdmissionDecision.readiness_ref],
      ["profile-admission.registry_ref", caseValues.profileAdmissionDecision.registry_ref],
      ["profile-admission.admissibility.request_ref", caseValues.profileAdmissionDecision.admissibility.request_ref],
      ["profile-admission.admissibility.receipt_ref", caseValues.profileAdmissionDecision.admissibility.receipt_ref],
      ["formalclaim-admission.candidate_ref", caseValues.formalClaimV5Decision.candidate_ref],
      ["formalclaim-admission.profile_admission_ref", caseValues.formalClaimV5Decision.profile_admission_ref],
      ["formalclaim-admission.review_ref", caseValues.formalClaimV5Decision.review_ref],
      ["formalclaim-admission.readiness_ref", caseValues.formalClaimV5Decision.readiness_ref],
      ["formalclaim-admission.admissibility.request_ref", caseValues.formalClaimV5Decision.admissibility.request_ref],
      ["formalclaim-admission.admissibility.receipt_ref", caseValues.formalClaimV5Decision.admissibility.receipt_ref],
      ["theorem-route-admission.binding_ref", caseValues.leanTheoremRouteDecision.formal_claim_lean_binding_ref],
      ["theorem-route-admission.runtime_ref", caseValues.leanTheoremRouteDecision.runtime_binding_ref],
      ["theorem-route-admission.policy_ref", caseValues.leanTheoremRouteDecision.execution_policy_ref],
      ["theorem-route-admission.review_ref", caseValues.leanTheoremRouteDecision.review_ref],
      ["theorem-route-admission.admissibility.request_ref", caseValues.leanTheoremRouteDecision.admissibility.request_ref],
      ["theorem-route-admission.admissibility.receipt_ref", caseValues.leanTheoremRouteDecision.admissibility.receipt_ref],
      ["envelope.formal_claim_ref", caseValues.formalClaimEnvelope.formal_claim_ref],
      ["envelope.definition_binding_ref", caseValues.formalClaimEnvelope.definition_binding_ref],
      ["envelope.definition_authority_ref", caseValues.formalClaimEnvelope.definition_authority_ref],
      ["ontology-alignment.base_ontology_ref", caseValues.ontologySemanticAlignment.base_ontology_ref],
      ["ontology-alignment.semantic_authority_ref", caseValues.ontologySemanticAlignment.semantic_authority_ref],
      ["v2-definitions.base_accepted_meaning_ref", caseValues.definitionsBusinessMeaning.base_accepted_meaning_ref],
      ["v2-definitions.definition_source_ref", caseValues.definitionsBusinessMeaning.definition_source_ref],
      ["v2-definitions.interpretation_model_ref", caseValues.definitionsBusinessMeaning.interpretation_model_ref],
      ["v2-definitions-accepted.base_accepted_meaning_ref", caseValues.acceptedDefinitionsBusinessMeaning.base_accepted_meaning_ref],
      ["v2-definitions-accepted.definition_source_ref", caseValues.acceptedDefinitionsBusinessMeaning.definition_source_ref],
      ["v2-definitions-accepted.interpretation_model_ref", caseValues.acceptedDefinitionsBusinessMeaning.interpretation_model_ref],
      ["v2-decision.candidate_ref", caseValues.businessMeaningV2Decision.candidate_ref],
      ["v2-decision.admissibility.request_ref", caseValues.businessMeaningV2Decision.admissibility.request_ref],
      ["v2-decision.admissibility.receipt_ref", caseValues.businessMeaningV2Decision.admissibility.receipt_ref],
      ["im-v3-decision.candidate_ref", caseValues.interpretationModelV3Decision.candidate_ref],
      ["im-v3-decision.semantic_authority_ref", caseValues.interpretationModelV3Decision.semantic_authority_ref],
      ["im-v3-decision.review_procedure_acceptance_ref", caseValues.interpretationModelV3Decision.review_procedure_acceptance_ref],
      ["im-v3-decision.admissibility.request_ref", caseValues.interpretationModelV3Decision.admissibility.request_ref],
      ["im-v3-decision.admissibility.receipt_ref", caseValues.interpretationModelV3Decision.admissibility.receipt_ref],
    ];
    for (const [label, exactRef, requireCurrent = true] of exactRefs) {
      exactReferenceFailures.push(...exactRefErrors(label, exactRef, requireCurrent));
    }
    for (const [index, dependency] of caseValues.admissionReadiness.selected_dependencies.entries()) {
      exactReferenceFailures.push(...exactRefErrors(
        `admission-readiness.selected_dependencies[${index}]`,
        dependency.artifact_ref,
      ));
    }
    for (const [label, exactRef] of [
      ["im-v3-decision.independent_review", caseValues.interpretationModelV3Decision.evidence.independent_review],
      ["im-v3-decision.review_validation", caseValues.interpretationModelV3Decision.evidence.review_validation],
      ["im-v3-decision.package_validation", caseValues.interpretationModelV3Decision.evidence.package_validation],
    ]) {
      exactReferenceFailures.push(...exactRefErrors(label, exactRef, false));
    }
  }
  check(
    "AF-V026",
    exactReferenceFailures.length === 0,
    exactReferenceFailures.length === 0
      ? "case package and FormalClaim bindings resolve to exact current bytes"
      : exactReferenceFailures.join("; "),
  );

  const inventoryFailures = [];
  if (caseParseFailures.length === 0) {
    const declaredCasePaths = manifest.artifacts
      .filter((artifact) => artifact.kind === "case-artifact" &&
        !artifact.path.endsWith("/CASE-PACKAGE.json"))
      .map((artifact) => `projects/auth-foundation/formalization/${artifact.path}`)
      .sort();
    const boundCasePaths = caseValues.casePackage.artifacts
      .map((artifact) => artifact.path)
      .sort();
    if (!deepEqual(declaredCasePaths, boundCasePaths)) {
      inventoryFailures.push("case artifact inventory differs from manifest inventory");
    }
    const caseManifestArtifacts = new Map(
      manifest.artifacts.map((artifact) => [
        `projects/auth-foundation/formalization/${artifact.path}`,
        artifact,
      ]),
    );
    for (const artifact of caseValues.casePackage.artifacts) {
      const declaration = caseManifestArtifacts.get(artifact.path);
      const manifestSchemaPath = declaration?.schema_ref
        ? resolveSchemaPath(declaration.schema_ref)
        : null;
      const caseSchemaPath = resolveRepositoryRef(artifact.schema_path);
      if (!declaration || manifestSchemaPath !== caseSchemaPath) {
        inventoryFailures.push(`${artifact.artifact_kind}: schema binding differs from manifest`);
      }
    }
  }
  check(
    "AF-V027",
    inventoryFailures.length === 0,
    inventoryFailures.length === 0
      ? "case package inventory closes exactly over the Auth manifest case artifacts"
      : inventoryFailures.join("; "),
  );

  const semanticFailures = [];
  let selectedProfile = null;
  if (caseParseFailures.length === 0) {
    const {
      authoringTrace,
      businessMeaning,
      definitionsBusinessMeaning,
      acceptedDefinitionsBusinessMeaning,
      interpretationModel,
      interpretationModelCandidate,
      alignedInterpretationModel,
      evaluationSeparatedInterpretationModel,
      ontologySemanticAlignment,
      identityInputs,
      identityAlgorithmV2,
      identityAlgorithmV3,
      definitionBinding,
      definitionBindingV2,
      identityInputsV2,
      identityInputsV3,
      formalClaimV3,
      formalClaimV4,
      formalClaimV5,
      leanEnvironment,
      preservationBinding,
      formalClaimLeanBinding,
      leanProviderRuntimeBinding,
      theoremExecutionPolicy,
      theoremObligationRequest,
      theoremObligationRequestReady,
      leanCandidateValidation,
      admissionReadiness,
      formalClaimEnvelope,
      casePackage,
      reviewedBusinessMeaning,
      reviewedInterpretationModel,
      ownerSemanticDecision,
      businessMeaningV2Decision,
      interpretationModelV3Decision,
      profileAdmissionCandidate,
      independentLeanReview,
      profileAdmissionDecision,
      formalClaimV5Decision,
      leanTheoremRouteDecision,
    } = caseValues;
    let profileRegistry = null;
    try {
      profileRegistry = JSON.parse(readFileSync(
        resolveRepositoryRef(identityInputsV3.formal_language_profile.registry_ref.path),
        "utf8",
      ));
    } catch (error) {
      semanticFailures.push(`profile registry: ${error.message}`);
    }
    selectedProfile = profileRegistry?.profiles?.find((profile) =>
      profile.profile_id === identityInputsV3.formal_language_profile.profile_id &&
      profile.version === identityInputsV3.formal_language_profile.version
    ) ?? null;

    const ownerDecisionRef = manifest.source_identities.find((source) =>
      source.source_id === "auth-foundation.exact-permission.owner-semantic-decision"
    );
    const ownerDecisionPath = ownerDecisionRef?.path ?? null;
    if (businessMeaning.version !== "1-accepted" ||
        businessMeaning.status !== "accepted" ||
        businessMeaning.acceptance.status !== "accepted" ||
        businessMeaning.acceptance.acceptance_ref !== ownerDecisionPath ||
        businessMeaning.acceptance.acceptance_digest !== ownerDecisionRef?.sha256) {
      semanticFailures.push("BusinessMeaning accepted postimage must bind the exact owner decision");
    }
    if (interpretationModel.version !== "2-accepted" ||
        interpretationModel.status !== "accepted" ||
        interpretationModel.acceptance.status !== "accepted" ||
        interpretationModel.acceptance.acceptance_ref !== ownerDecisionPath ||
        interpretationModel.acceptance.acceptance_digest !== ownerDecisionRef?.sha256) {
      semanticFailures.push("v1-bound predecessor InterpretationModel must preserve its exact accepted postimage and owner decision");
    }
    const interpretationModelV3DecisionRef = manifest.source_identities.find((source) =>
      source.source_id === "auth-foundation.exact-permission.interpretation-model-v3-owner-decision"
    );
    const interpretationModelV3DecisionPath = interpretationModelV3DecisionRef?.path ?? null;
    if (alignedInterpretationModel.version !== "3-definitions-aligned-accepted" ||
        alignedInterpretationModel.status !== "accepted" ||
        alignedInterpretationModel.acceptance.status !== "accepted" ||
        alignedInterpretationModel.acceptance.acceptance_ref !== interpretationModelV3DecisionPath ||
        alignedInterpretationModel.acceptance.acceptance_digest !==
          interpretationModelV3DecisionRef?.sha256 ||
        alignedInterpretationModel.authority_effect !== "none") {
      semanticFailures.push("definitions-aligned InterpretationModel accepted postimage must bind the exact v3 owner decision");
    }
    const businessFactFields = [
      "meaning_id",
      "owner",
      "domain_context",
      "rule",
      "applies_when",
      "actors",
      "inputs",
      "outcomes",
      "examples",
      "counterexamples",
      "boundaries",
      "authority_effect",
    ];
    if (!businessFactFields.every((field) =>
      deepEqual(definitionsBusinessMeaning[field], businessMeaning[field])
    )) {
      semanticFailures.push("definitions-bearing v2 candidate changes an accepted v1 business fact");
    }
    if (definitionsBusinessMeaning.schema_version !==
          "domainspec-v2.business-meaning/v2-candidate" ||
        definitionsBusinessMeaning.version !== "2-definitions-candidate" ||
        definitionsBusinessMeaning.status !== "draft" ||
        definitionsBusinessMeaning.supersedes !==
          `${businessMeaning.meaning_id}@${businessMeaning.version}` ||
        definitionsBusinessMeaning.supersession_effect !==
          "lineage-only-until-accepted" ||
        definitionsBusinessMeaning.acceptance.status !== "not-requested" ||
        definitionsBusinessMeaning.acceptance.acceptance_ref !== null ||
        definitionsBusinessMeaning.acceptance.acceptance_digest !== null ||
        definitionsBusinessMeaning.authority_effect !== "none") {
      semanticFailures.push("definitions-bearing v2 artifact must remain a no-authority draft successor, not an accepted supersession");
    }
    for (const [label, exactRef, expectedPath] of [
      ["definitions predecessor", definitionsBusinessMeaning.base_accepted_meaning_ref, casePaths.businessMeaning],
      ["definitions source", definitionsBusinessMeaning.definition_source_ref, ontologyPath],
      ["definitions interpretation", definitionsBusinessMeaning.interpretation_model_ref, casePaths.interpretationModel],
    ]) {
      const actualPath = exactRef?.path ? resolveRepositoryRef(exactRef.path) : null;
      if (actualPath !== expectedPath || exactRefErrors(label, exactRef).length > 0) {
        semanticFailures.push(`${label} does not bind the exact current source`);
      }
    }
    if (definitionsBusinessMeaning.definition_policy.canonical_location !==
          "inline-in-this-business-meaning" ||
        definitionsBusinessMeaning.definition_policy.normative_voice !== "formal" ||
        !deepEqual(
          definitionsBusinessMeaning.definition_policy.explanatory_voices,
          ["plain_language", "domain_context"],
        ) ||
        definitionsBusinessMeaning.definition_policy.conflict_rule !==
          "formal-voice-prevails") {
      semanticFailures.push("definition authority must remain inline with formal normative and the two explanatory voices non-normative");
    }
    const v2DecisionRef = manifest.source_identities.find((source) =>
      source.source_id === "auth-foundation.exact-permission.business-meaning-v2-owner-decision"
    );
    const v2DecisionPath = v2DecisionRef?.path ?? null;
    if (acceptedDefinitionsBusinessMeaning.version !== "2-definitions-accepted" ||
        acceptedDefinitionsBusinessMeaning.status !== "accepted" ||
        acceptedDefinitionsBusinessMeaning.supersession_effect !== "accepted-supersession" ||
        acceptedDefinitionsBusinessMeaning.acceptance.status !== "accepted" ||
        acceptedDefinitionsBusinessMeaning.acceptance.acceptance_ref !== v2DecisionPath ||
        acceptedDefinitionsBusinessMeaning.acceptance.acceptance_digest !== v2DecisionRef?.sha256 ||
        !acceptedDefinitionsBusinessMeaning.definitions.every((definition) =>
          definition.status === "accepted"
        )) {
      semanticFailures.push("accepted definitions-bearing BusinessMeaning must bind the exact v2 owner decision and accept every inline definition");
    }
    const normalizeV2Lifecycle = (value) => ({
      ...value,
      version: definitionsBusinessMeaning.version,
      status: definitionsBusinessMeaning.status,
      supersession_effect: definitionsBusinessMeaning.supersession_effect,
      definitions: value.definitions.map((definition) => ({
        ...definition,
        status: "candidate",
      })),
      acceptance: definitionsBusinessMeaning.acceptance,
      claim_ceiling: definitionsBusinessMeaning.claim_ceiling,
    });
    if (!deepEqual(
      normalizeV2Lifecycle(acceptedDefinitionsBusinessMeaning),
      definitionsBusinessMeaning,
    )) {
      semanticFailures.push("accepted v2 postimage changes selected semantic content beyond lifecycle annotation");
    }
    if (businessMeaningV2Decision.status !== "resolved-pass" ||
        businessMeaningV2Decision.selected_option_id !== "AF-BM2-ACCEPT" ||
        businessMeaningV2Decision.source_of_decision?.raw_response !== "A" ||
        businessMeaningV2Decision.source_of_decision?.owner_gate !==
          "projects/auth-foundation/formalization#semantic-owner" ||
        businessMeaningV2Decision.authority_effect !== "bounded-semantic-acceptance" ||
        businessMeaningV2Decision.candidate_ref.sha256 !==
          sha256(casePaths.definitionsBusinessMeaning) ||
        businessMeaningV2Decision.admissibility.route_outcome !== "gate" ||
        businessMeaningV2Decision.remaining_blockers.length !== 0) {
      semanticFailures.push("v2 decision gate does not preserve the exact owner selection and bounded semantic-acceptance ceiling");
    }
    if (interpretationModelV3Decision.status !== "resolved-pass" ||
        interpretationModelV3Decision.selected_option_id !== "AF-IM3-ACCEPT" ||
        interpretationModelV3Decision.source_of_decision?.raw_response !== "A" ||
        interpretationModelV3Decision.source_of_decision?.owner_gate !==
          "projects/auth-foundation/formalization#semantic-owner" ||
        interpretationModelV3Decision.authority_effect !== "bounded-semantic-acceptance" ||
        interpretationModelV3Decision.candidate_ref.sha256 !==
          sha256(casePaths.interpretationModelCandidate) ||
        interpretationModelV3Decision.semantic_authority_ref.sha256 !==
          sha256(casePaths.acceptedDefinitionsBusinessMeaning) ||
        interpretationModelV3Decision.evidence.independent_review.verdict !== "PASS" ||
        interpretationModelV3Decision.evidence.independent_review.findings !== 0 ||
        interpretationModelV3Decision.evidence.review_validation.status !== "pass" ||
        interpretationModelV3Decision.admissibility.route_outcome !== "gate" ||
        interpretationModelV3Decision.remaining_blockers.length !== 0) {
      semanticFailures.push("InterpretationModel v3 decision gate does not preserve the exact owner selection, passing review, and bounded semantic-acceptance ceiling");
    }
    const requiredDefinitionIds = [
      "AF-DEF-AUTHORIZATION-REQUEST",
      "AF-DEF-SESSION",
      "AF-DEF-ROLE",
      "AF-DEF-PERMISSION",
      "AF-DEF-RESOURCE",
      "AF-DEF-ACTION",
      "AF-DEF-SCOPE",
      "AF-DEF-REQUIRED-PERMISSION",
      "AF-DEF-DECISION-TIME",
      "AF-DEF-AUTHORIZATION-REVISION",
      "AF-DEF-RESOLVED-SESSION",
      "AF-DEF-RESOLVED-ACTIVE-ROLE",
      "AF-DEF-TRUSTED-SCOPE-EVIDENCE",
      "AF-DEF-COMPLETE-AUTHORITATIVE-ROLE-RELATION",
      "AF-DEF-SESSION-CURRENT",
      "AF-DEF-AUTHORIZATION-ADMISSIBLE",
      "AF-DEF-EXACT-ACTIVE-ROLE-GRANT",
      "AF-DEF-AUTHORIZATION-DECISION",
      "AF-DEF-ALLOW",
      "AF-DEF-DENY",
    ];
    const definitions = definitionsBusinessMeaning.definitions ?? [];
    const definitionIds = definitions.map((definition) => definition.definition_id);
    const definitionTerms = definitions.map((definition) => definition.term);
    if (!unique(definitionIds) || !unique(definitionTerms) ||
        !deepEqual([...definitionIds].sort(), [...requiredDefinitionIds].sort())) {
      semanticFailures.push("definitions must contain the exact critical Auth term set with unique stable IDs and terms");
    }
    const definitionIdSet = new Set(definitionIds);
    const ontologyConceptIds = new Set(ontology.nodes.map((node) => node.concept_id));
    for (const definition of definitions) {
      if (definition.status !== "candidate" ||
          !nonEmptyString(definition.formal?.definition) ||
          !nonEmptyString(definition.formal?.expression) ||
          !Array.isArray(definition.formal?.notation) ||
          definition.formal.notation.length === 0 ||
          !nonEmptyString(definition.formal?.operational_interpretation) ||
          !nonEmptyString(definition.plain_language) ||
          !nonEmptyString(definition.domain_context) ||
          !Array.isArray(definition.forbidden_collapses) ||
          definition.forbidden_collapses.length === 0) {
        semanticFailures.push(`${definition.definition_id}: definition voices or forbidden collapses are incomplete`);
      }
      for (const dependency of definition.depends_on ?? []) {
        if (!definitionIdSet.has(dependency) || dependency === definition.definition_id) {
          semanticFailures.push(`${definition.definition_id}: dependency ${dependency} is not a distinct local definition`);
        }
      }
      for (const pointer of definition.business_fact_refs ?? []) {
        try {
          resolveJsonPointer(definitionsBusinessMeaning, pointer);
        } catch (error) {
          semanticFailures.push(`${definition.definition_id}: business fact ${error.message}`);
        }
      }
      for (const pointer of definition.interpretation_refs ?? []) {
        try {
          resolveJsonPointer(alignedInterpretationModel, pointer);
        } catch (error) {
          semanticFailures.push(`${definition.definition_id}: interpretation ${error.message}`);
        }
      }
      for (const conceptRef of definition.source_concept_refs ?? []) {
        if (!ontologyConceptIds.has(conceptRef)) {
          semanticFailures.push(`${definition.definition_id}: unknown ontology source concept ${conceptRef}`);
        }
      }
    }
    const dependencyMap = new Map(definitions.map((definition) => [
      definition.definition_id,
      definition.depends_on ?? [],
    ]));
    const visiting = new Set();
    const visited = new Set();
    const visitDefinition = (definitionId) => {
      if (visiting.has(definitionId)) return false;
      if (visited.has(definitionId)) return true;
      visiting.add(definitionId);
      for (const dependency of dependencyMap.get(definitionId) ?? []) {
        if (!visitDefinition(dependency)) return false;
      }
      visiting.delete(definitionId);
      visited.add(definitionId);
      return true;
    };
    if (![...dependencyMap.keys()].every(visitDefinition)) {
      semanticFailures.push("definition dependency graph contains a cycle");
    }
    const definitionText = JSON.stringify(definitionsBusinessMeaning);
    const decisionDefinition = definitions.find((definition) =>
      definition.definition_id === "AF-DEF-AUTHORIZATION-DECISION"
    );
    const admissibilityDefinition = definitions.find((definition) =>
      definition.definition_id === "AF-DEF-AUTHORIZATION-ADMISSIBLE"
    );
    const resolvedSessionUniqueness =
      "ResolvedSession(q,s) and (forall s2: Session. ResolvedSession(q,s2) -> s2 = s)";
    if (definitionText.includes("AssignedRoles") ||
        decisionDefinition?.formal?.expression !== "AuthorizationDecision = {ALLOW, DENY}" ||
        /reason/i.test(decisionDefinition?.formal?.definition ?? "")) {
      semanticFailures.push("v2 definitions import ontology-only assignment or decision-reason semantics not present in accepted meaning");
    }
    if (admissibilityDefinition?.formal?.expression.includes("UniqueResolvedSession") ||
        !admissibilityDefinition?.formal?.expression.includes(resolvedSessionUniqueness) ||
        !admissibilityDefinition?.formal?.notation.some((entry) => entry.symbol === "s2")) {
      semanticFailures.push("AuthorizationAdmissible must expand the accepted ResolvedSession uniqueness condition without an undefined predicate");
    }
    if (casePackage.selected_layer !== "L0" ||
        casePackage.current_state !== "obligations-ready" ||
        casePackage.outcome !== "not-evaluated" ||
        casePackage.evidence_join_ref !== null ||
        casePackage.evaluation_context_ref !== null ||
        casePackage.business_semantic_acceptance.status !== "accepted" ||
        casePackage.business_semantic_acceptance.business_meaning_ref.sha256 !==
          sha256(casePaths.acceptedDefinitionsBusinessMeaning) ||
        casePackage.business_semantic_acceptance.business_acceptance_ref.sha256 !==
          sha256(casePaths.businessMeaningV2Decision) ||
        casePackage.formal_claim.status !== "admitted" ||
        casePackage.formal_claim.claim_ref.sha256 !== sha256(casePaths.formalClaimV5) ||
        casePackage.formal_claim.admission_ref.sha256 !==
          sha256(casePaths.formalClaimV5Decision)) {
      semanticFailures.push("case must expose accepted v2 meaning, the admitted v5 Lean claim, its exact owner decision, and no EvaluationContext or EVF result");
    }
    if (!casePackage.unresolved.some((item) => item.includes("FormalClaim v3 and v4 remain predecessor")) ||
        !casePackage.unresolved.some((item) => item.includes("FormalClaimLeanBinding") && item.includes("current")) ||
        !casePackage.unresolved.some((item) => item.includes("v2 theorem obligation request is ready")) ||
        !casePackage.unresolved.some((item) => item.includes("no provider execution"))) {
      semanticFailures.push("case does not expose predecessor status, current Lean binding, ready theorem request, and the no-execution boundary");
    }
    const decisionSubjects = new Map(
      (ownerSemanticDecision.accepted_subjects ?? []).map((subject) => [subject.subject_kind, subject]),
    );
    for (const [kind, expectedPath] of [
      ["business-meaning", casePaths.reviewedBusinessMeaning],
      ["interpretation-model", casePaths.reviewedInterpretationModel],
    ]) {
      const subject = decisionSubjects.get(kind);
      const actualPath = subject?.path ? resolveRepositoryRef(subject.path) : null;
      if (!subject || actualPath !== expectedPath || exactRefErrors(`owner-decision.${kind}`, subject).length > 0) {
        semanticFailures.push(`owner decision no longer resolves its exact ${kind} reviewed preimage`);
      }
    }
    if (ownerSemanticDecision.selected_option_id !== "AF-SEM-ACCEPT" ||
        ownerSemanticDecision.result !== "pass" ||
        ownerSemanticDecision.decision_source?.owner_gate !==
          "projects/auth-foundation/formalization#semantic-owner" ||
        ownerSemanticDecision.authority_effect !== "bounded-semantic-acceptance" ||
        !ownerSemanticDecision.explicit_non_scope?.includes("no FormalClaim source admission") ||
        !ownerSemanticDecision.explicit_non_scope?.includes("no TDE v2 projection or intake eligibility")) {
      semanticFailures.push("owner decision does not preserve its exact semantic-only authority ceiling");
    }
    const omitFields = (value, fields) => Object.fromEntries(
      Object.entries(value).filter(([key]) => !fields.includes(key)),
    );
    if (!deepEqual(
      omitFields(businessMeaning, ["version", "status", "acceptance", "claim_ceiling"]),
      omitFields(reviewedBusinessMeaning, ["version", "status", "acceptance", "claim_ceiling"]),
    )) {
      semanticFailures.push("accepted BusinessMeaning changes semantic content beyond lifecycle annotation");
    }
    if (!deepEqual(
      omitFields(interpretationModel, ["version", "status", "business_meaning_ref", "acceptance", "claim_ceiling"]),
      omitFields(reviewedInterpretationModel, ["version", "status", "business_meaning_ref", "acceptance", "claim_ceiling"]),
    )) {
      semanticFailures.push("v1-bound predecessor InterpretationModel changes semantic content beyond its original lifecycle annotation and meaning binding");
    }
    if (!deepEqual(
      omitFields(alignedInterpretationModel, ["version", "status", "acceptance", "claim_ceiling"]),
      omitFields(interpretationModelCandidate, ["version", "status", "acceptance", "claim_ceiling"]),
    )) {
      semanticFailures.push("accepted definitions-aligned InterpretationModel changes candidate semantic content beyond lifecycle annotation");
    }
    const expectedEvaluationSeparatedModel = structuredClone(alignedInterpretationModel);
    expectedEvaluationSeparatedModel.version = "4-evaluation-context-separated-candidate";
    expectedEvaluationSeparatedModel.status = "draft";
    expectedEvaluationSeparatedModel.currentness_rules[2] =
      "Changing this InterpretationModel creates a new EvaluationContext identity when the model is selected for evaluation. It does not create or alter FormalClaim identity.";
    expectedEvaluationSeparatedModel.acceptance = {
      status: "not-requested",
      owner_ref: "projects/auth-foundation/formalization",
      acceptance_ref: null,
      acceptance_digest: null,
    };
    expectedEvaluationSeparatedModel.claim_ceiling = evaluationSeparatedInterpretationModel.claim_ceiling;
    if (!deepEqual(evaluationSeparatedInterpretationModel, expectedEvaluationSeparatedModel) ||
        evaluationSeparatedInterpretationModel.acceptance.status !== "not-requested" ||
        !evaluationSeparatedInterpretationModel.claim_ceiling.includes("Candidate successor")) {
      semanticFailures.push("InterpretationModel v4 successor must change only evaluation-context identity semantics and remain unaccepted");
    }
    if (ontologySemanticAlignment.status !== "candidate" ||
        ontologySemanticAlignment.base_ontology_ref.sha256 !== sha256(ontologyPath) ||
        ontologySemanticAlignment.semantic_authority_ref.sha256 !==
          sha256(casePaths.acceptedDefinitionsBusinessMeaning) ||
        ontologySemanticAlignment.application_policy.base_bytes_immutable !== true ||
        ontologySemanticAlignment.application_policy.authority_source !== "semantic_authority_ref" ||
        ontologySemanticAlignment.application_policy.name_inference !== "forbidden" ||
        ontologySemanticAlignment.overrides.length !== 5 ||
        !ontologySemanticAlignment.deprecated_expressions.includes(
          "AuthorizationDecision = (result in {ALLOW, DENY}, reason)",
        )) {
      semanticFailures.push("ontology semantic alignment does not exact-bind the preserved base ontology to accepted BusinessMeaning v2");
    }
    if (!selectedProfile || selectedProfile.profile_id !== "lean-dtt" ||
        selectedProfile.provider_route !== "evf-theorem" ||
        selectedProfile.formal_claim_role !== "canonical-source") {
      semanticFailures.push("lean-dtt canonical-source profile with the EVF theorem route is not exactly selected");
    }
    const proposition = formalClaimV3.canonical_proposition;
    const preservedPropositionIdentity = {
      representation_digest: "667ce77daab7cc476221581fe3f585916c7a57a2aeeb4f30a90d85f3f60a716e",
      semantic_identity: "fol-core/1-candidate:auth-foundation.authorization-exact-session-role-permission:v2",
      semantic_identity_digest: "c83c277709fd155f42d21a7a726bc96c29304627c65b082963c7626e61987ad8",
    };
    if (proposition.representation_digest !== preservedPropositionIdentity.representation_digest ||
        proposition.semantic_identity !== preservedPropositionIdentity.semantic_identity ||
        proposition.semantic_identity_digest !== preservedPropositionIdentity.semantic_identity_digest) {
      semanticFailures.push("rebound FormalClaim does not preserve the exact pre-acceptance proposition identity");
    }
    if (stagedRepositoryRoot !== repositoryRoot) {
      try {
        const priorIdentityInputs = JSON.parse(readFileSync(resolve(
          repositoryRoot,
          "projects/auth-foundation/formalization/cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/CLAIM-IDENTITY-INPUTS.json",
        ), "utf8"));
        const priorFormalClaim = JSON.parse(readFileSync(resolve(
          repositoryRoot,
          "projects/auth-foundation/formalization/cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/FORMAL-CLAIM.v3-candidate.json",
        ), "utf8"));
        const preservedFields = [
          "representation_media_type",
          "representation",
          "representation_digest",
          "semantic_identity",
          "semantic_identity_digest",
        ];
        if (!preservedFields.every((field) =>
          deepEqual(priorFormalClaim.canonical_proposition[field], proposition[field])
        )) {
          semanticFailures.push("staged FormalClaim changes a proposition representation or semantic-identity field from its exact preimage");
        }
        if (!deepEqual(
          priorIdentityInputs.canonical_proposition,
          identityInputs.canonical_proposition,
        )) {
          semanticFailures.push("staged claim identity inputs change the canonical proposition identity from its exact preimage");
        }
      } catch (error) {
        semanticFailures.push(`pre-acceptance FormalClaim comparison failed: ${error.message}`);
      }
    }
    const predicateNames = new Set(
      interpretationModel.predicates.map((predicate) => predicate.name.split("(")[0]),
    );
    const requiredSignature = [
      "RequiredPermission",
      "DecisionTime",
      "CurrentAuthorizationRevision",
      "ResolvedSession",
      "ResolvedActiveRole",
      "Grants",
      "PermissionExactEqual",
      "SessionCurrent",
      "TrustedScopeEvidence",
      "RoleRelationComplete",
      "AuthorizationAdmissible",
      "Decision",
    ];
    if (!requiredSignature.every((name) => predicateNames.has(name))) {
      semanticFailures.push("predecessor InterpretationModel no longer closes the predecessor v3 proposition signature");
    }
    const requiredNonVacuityFragments = [
      "exists qa: AuthorizationRequest",
      "exists qn: AuthorizationRequest",
      "exists qi: AuthorizationRequest",
    ];
    if (!requiredNonVacuityFragments.every((fragment) =>
      proposition.representation.includes(fragment)
    )) {
      semanticFailures.push("canonical proposition lacks an identity-bearing ALLOW, no-match DENY, or inadmissible DENY existence constraint");
    }
    if (proposition.representation.includes("Session(q)") ||
        proposition.representation.includes("AuthorizationAdmissible(q)")) {
      semanticFailures.push("canonical proposition uses an undefined session selector or ambient admissibility predicate");
    }
    if (identityInputs.claim_version !== "3-candidate" ||
        formalClaimV3.claim.claim_version !== "3-candidate" ||
        formalClaimV3.claim.supersedes !==
          "FormalClaim:auth-foundation.exact-session-role-permission@2-candidate" ||
        !proposition.semantic_identity.endsWith(":v2")) {
      semanticFailures.push("FormalClaim artifact revision must advance while the unchanged proposition keeps semantic identity v2");
    }
    if (sha256Text(proposition.representation) !== proposition.representation_digest) {
      semanticFailures.push("canonical proposition representation digest is stale");
    }
    if (sha256Text(proposition.semantic_identity) !== proposition.semantic_identity_digest) {
      semanticFailures.push("canonical proposition semantic identity digest is stale");
    }
    if (identityInputs.canonical_proposition.representation_digest !== proposition.representation_digest ||
        identityInputs.canonical_proposition.semantic_identity !== proposition.semantic_identity ||
        identityInputs.canonical_proposition.semantic_identity_digest !== proposition.semantic_identity_digest) {
      semanticFailures.push("identity inputs and FormalClaim canonical proposition identity differ");
    }
    const identityInputsDigest = sha256(casePaths.identityInputs);
    if (formalClaimV3.claim.identity_inputs_digest !== identityInputsDigest) {
      semanticFailures.push("FormalClaim identity_inputs_digest does not bind CLAIM-IDENTITY-INPUTS exact bytes");
    }
    if (formalClaimV3.business_meaning_ref.sha256 !== sha256(casePaths.businessMeaning) ||
        formalClaimV3.interpretation_model_ref.sha256 !== sha256(casePaths.interpretationModel) ||
        formalClaimV3.formal_language_profile_ref.sha256 !==
          identityInputs.formal_language_profile.registry_ref.sha256) {
      semanticFailures.push("FormalClaim meaning, interpretation, or profile digests differ from identity inputs");
    }
    if (formalClaimV3.business_meaning_ref.sha256 ===
          sha256(casePaths.definitionsBusinessMeaning) ||
        formalClaimV3.business_meaning_ref.sha256 ===
          sha256(casePaths.acceptedDefinitionsBusinessMeaning)) {
      semanticFailures.push("existing FormalClaim must remain v1-bound and must not claim alignment with v2 meaning");
    }
    if (formalClaimV3.business_acceptance_ref.path !== ownerDecisionPath ||
        formalClaimV3.business_acceptance_ref.sha256 !== ownerDecisionRef?.sha256 ||
        formalClaimV3.interpretation_acceptance_ref.path !== ownerDecisionPath ||
        formalClaimV3.interpretation_acceptance_ref.sha256 !== ownerDecisionRef?.sha256) {
      semanticFailures.push("FormalClaim acceptance refs do not bind the immutable owner semantic decision");
    }
    if (!deepEqual(identityInputs.assumptions, interpretationModel.assumptions)) {
      semanticFailures.push("identity assumptions differ from InterpretationModel assumptions");
    }
    if (formalClaimV3.source_authority_count !== 1) {
      semanticFailures.push("FormalClaim must expose exactly one source authority");
    }
    if (formalClaimV3.tde_compatibility.current_intake_contract !== "FormalClaimSourcePayload/v2" ||
        formalClaimV3.tde_compatibility.status !== "adapter-required" ||
        formalClaimV3.tde_compatibility.v2_projection_ref !== null) {
      semanticFailures.push("pending FormalClaim admission must leave the TDE v2 adapter required and projection absent");
    }

    const hasOwn = (value, field) => Object.prototype.hasOwnProperty.call(value, field);
    if (identityAlgorithmV2.schema_version !==
          "auth-foundation.formal-claim-identity-algorithm/v2" ||
        identityAlgorithmV2.interpretation_boundary.interpretation_model_is_identity_input !== false ||
        identityAlgorithmV2.interpretation_boundary.join_stage !==
          "external-evaluation-context" ||
        identityAlgorithmV2.identity_inputs_schema_ref !==
          "projects/auth-foundation/formalization/schemas/auth-formal-claim-identity-inputs.v2.schema.json") {
      semanticFailures.push("FormalClaim identity algorithm v2 must exclude InterpretationModel and bind the v2 identity-input contract");
    }
    if (formalClaimV4.schema_version !==
          "domainspec-v2.formal-claim-source/v4-candidate" ||
        formalClaimV4.claim.claim_version !== "4-definitions-bound-candidate" ||
        formalClaimV4.claim.currentness !== "current" ||
        formalClaimV4.claim.supersedes !==
          "FormalClaim:auth-foundation.exact-session-role-permission@3-candidate" ||
        formalClaimV4.authority_effect !== "none" ||
        formalClaimV4.interpretation_boundary.interpretation_model_is_part_of_claim !== false ||
        formalClaimV4.interpretation_boundary.join_stage !==
          "external-evaluation-context" ||
        hasOwn(formalClaimV4, "interpretation_model_ref") ||
        hasOwn(formalClaimV4, "interpretation_acceptance_ref") ||
        hasOwn(identityInputsV2, "interpretation_model_ref") ||
        hasOwn(definitionBinding, "interpretation_model_ref") ||
        hasOwn(formalClaimEnvelope, "interpretation_model_ref")) {
      semanticFailures.push("FormalClaim v4 must be a no-authority definition-bound draft with InterpretationModel outside claim identity and content");
    }
    if (formalClaimV4.claim.identity_algorithm_ref.sha256 !==
          sha256(casePaths.identityAlgorithmV2) ||
        formalClaimV4.claim.identity_inputs_digest !== sha256(casePaths.identityInputsV2) ||
        formalClaimV4.business_meaning_ref.sha256 !==
          sha256(casePaths.acceptedDefinitionsBusinessMeaning) ||
        formalClaimV4.business_acceptance_ref.sha256 !==
          sha256(casePaths.businessMeaningV2Decision) ||
        formalClaimV4.definition_binding_ref.sha256 !==
          sha256(casePaths.definitionBinding) ||
        formalClaimV4.formal_language_profile_ref.sha256 !==
          identityInputsV2.formal_language_profile.registry_ref.sha256 ||
        formalClaimV4.canonical_proposition.identity_algorithm_ref.sha256 !==
          sha256(casePaths.identityAlgorithmV2)) {
      semanticFailures.push("FormalClaim v4 does not exact-bind its identity algorithm, accepted meaning, definition graph, owner decision, or profile");
    }
    if (identityInputsV2.claim_id !== formalClaimV4.claim.claim_id ||
        identityInputsV2.claim_version !== formalClaimV4.claim.claim_version ||
        identityInputsV2.business_meaning_ref.sha256 !==
          formalClaimV4.business_meaning_ref.sha256 ||
        identityInputsV2.definition_binding_ref.sha256 !==
          formalClaimV4.definition_binding_ref.sha256 ||
        !deepEqual(identityInputsV2.formal_signature, formalClaimV4.formal_signature) ||
        identityInputsV2.canonical_proposition.representation_digest !==
          formalClaimV4.canonical_proposition.representation_digest ||
        identityInputsV2.canonical_proposition.semantic_identity !==
          formalClaimV4.canonical_proposition.semantic_identity ||
        identityInputsV2.canonical_proposition.semantic_identity_digest !==
          formalClaimV4.canonical_proposition.semantic_identity_digest) {
      semanticFailures.push("v2 identity inputs and FormalClaim v4 do not describe the same claim identity");
    }
    const v4Proposition = formalClaimV4.canonical_proposition;
    if (v4Proposition.representation_digest !== proposition.representation_digest ||
        v4Proposition.semantic_identity !== proposition.semantic_identity ||
        v4Proposition.semantic_identity_digest !== proposition.semantic_identity_digest ||
        v4Proposition.representation !== proposition.representation ||
        sha256Text(v4Proposition.representation) !== v4Proposition.representation_digest ||
        sha256Text(v4Proposition.semantic_identity) !== v4Proposition.semantic_identity_digest) {
      semanticFailures.push("FormalClaim v4 must preserve and correctly digest the accepted proposition identity from v3");
    }

    if (identityAlgorithmV3.schema_version !==
          "auth-foundation.formal-claim-identity-algorithm/v3" ||
        identityAlgorithmV3.identity_inputs_schema_ref !==
          "projects/auth-foundation/formalization/schemas/auth-formal-claim-identity-inputs.v3.schema.json" ||
        identityAlgorithmV3.interpretation_boundary.interpretation_model_is_identity_input !== false ||
        identityAlgorithmV3.interpretation_boundary.join_stage !==
          "external-evaluation-context") {
      semanticFailures.push("FormalClaim identity algorithm v3 must bind the Lean identity contract and keep InterpretationModel external");
    }
    if (definitionBindingV2.claim_identity.claim_id !== formalClaimV5.claim.claim_id ||
        definitionBindingV2.claim_identity.claim_version !== formalClaimV5.claim.claim_version ||
        definitionBindingV2.predecessor_binding_ref.sha256 !==
          sha256(casePaths.definitionBinding) ||
        definitionBindingV2.definition_authority_ref.sha256 !==
          sha256(casePaths.acceptedDefinitionsBusinessMeaning) ||
        !deepEqual(definitionBindingV2.definition_closure, definitionBinding.definition_closure) ||
        !definitionBindingV2.semantic_delta.startsWith("none;") ||
        definitionBindingV2.authority_effect !== "none") {
      semanticFailures.push("Lean definition binding must be an exact no-semantic-delta rebind of the accepted v4 definition closure");
    }
    if (formalClaimV5.schema_version !==
          "domainspec-v2.formal-claim-source/v4-candidate" ||
        formalClaimV5.claim.claim_version !== "5-lean-candidate" ||
        formalClaimV5.claim.currentness !== "current" ||
        formalClaimV5.claim.supersedes !==
          "FormalClaim:auth-foundation.exact-session-role-permission@4-definitions-bound-candidate" ||
        formalClaimV5.claim.identity_algorithm_ref.sha256 !==
          sha256(casePaths.identityAlgorithmV3) ||
        formalClaimV5.claim.identity_inputs_digest !== sha256(casePaths.identityInputsV3) ||
        formalClaimV5.business_meaning_ref.sha256 !==
          sha256(casePaths.acceptedDefinitionsBusinessMeaning) ||
        formalClaimV5.business_acceptance_ref.sha256 !==
          sha256(casePaths.businessMeaningV2Decision) ||
        formalClaimV5.definition_binding_ref.sha256 !==
          sha256(casePaths.definitionBindingV2) ||
        formalClaimV5.formal_language_profile_ref.sha256 !==
          identityInputsV3.formal_language_profile.registry_ref.sha256 ||
        formalClaimV5.canonical_proposition.identity_algorithm_ref.sha256 !==
          sha256(casePaths.identityAlgorithmV3) ||
        formalClaimV5.interpretation_boundary.interpretation_model_is_part_of_claim !== false ||
        formalClaimV5.interpretation_boundary.join_stage !==
          "external-evaluation-context" ||
        formalClaimV5.authority_effect !== "none" ||
        hasOwn(formalClaimV5, "interpretation_model_ref")) {
      semanticFailures.push("FormalClaim v5 does not preserve the exact Lean identity, accepted meaning, external InterpretationModel boundary, and no-authority source contract");
    }
    if (identityInputsV3.claim_id !== formalClaimV5.claim.claim_id ||
        identityInputsV3.claim_version !== formalClaimV5.claim.claim_version ||
        identityInputsV3.business_meaning_ref.sha256 !==
          formalClaimV5.business_meaning_ref.sha256 ||
        identityInputsV3.definition_binding_ref.sha256 !==
          formalClaimV5.definition_binding_ref.sha256 ||
        identityInputsV3.formal_language_profile.profile_id !== "lean-dtt" ||
        identityInputsV3.formal_language_profile.version !== "1-candidate" ||
        !deepEqual(identityInputsV3.formal_signature, formalClaimV5.formal_signature) ||
        identityInputsV3.canonical_proposition.representation_digest !==
          formalClaimV5.canonical_proposition.representation_digest ||
        identityInputsV3.canonical_proposition.semantic_identity !==
          formalClaimV5.canonical_proposition.semantic_identity ||
        identityInputsV3.canonical_proposition.semantic_identity_digest !==
          formalClaimV5.canonical_proposition.semantic_identity_digest ||
        identityInputsV3.lean_environment_ref.sha256 !== sha256(casePaths.leanEnvironment) ||
        !deepEqual(formalClaimV5.formal_signature, formalClaimV4.formal_signature) ||
        sha256Text(formalClaimV5.canonical_proposition.representation) !==
          formalClaimV5.canonical_proposition.representation_digest ||
        sha256Text(formalClaimV5.canonical_proposition.semantic_identity) !==
          formalClaimV5.canonical_proposition.semantic_identity_digest) {
      semanticFailures.push("v3 identity inputs and FormalClaim v5 do not describe the same exact Lean claim identity and preserved signature");
    }
    if (leanEnvironment.toolchain.channel !== "leanprover/lean4:v4.32.0" ||
        leanEnvironment.toolchain.lean_version !== "4.32.0" ||
        leanEnvironment.imports.length !== 0 ||
        leanEnvironment.options.length !== 0 ||
        leanEnvironment.authority_effect !== "none" ||
        leanCandidateValidation.status !== "pass" ||
        leanCandidateValidation.blockers.length !== 0 ||
        admissionReadiness.outcome !== "ready-for-owner-decision" ||
        admissionReadiness.blockers.length !== 0 ||
        admissionReadiness.candidate_ref.sha256 !== sha256(casePaths.formalClaimV5)) {
      semanticFailures.push("Lean environment, technical validation, or admission readiness is not exact and passing");
    }
    if (!deepEqual(profileAdmissionCandidate.profile_snapshot, selectedProfile) ||
        profileAdmissionCandidate.consumer_claim_ref.sha256 !==
          sha256(casePaths.formalClaimV5) ||
        independentLeanReview.outcome !== "pass" ||
        independentLeanReview.blockers.length !== 0 ||
        !independentLeanReview.obligation_results.every((item) => item.status === "pass") ||
        !independentLeanReview.forbidden_inference_results.every((item) =>
          item.status === "pass"
        )) {
      semanticFailures.push("profile admission candidate or independent Lean semantic review is not exact and passing");
    }
    if (profileAdmissionDecision.status !== "resolved-pass" ||
        profileAdmissionDecision.selected_option_id !== "ADMIT" ||
        profileAdmissionDecision.authority_effect !== "bounded-profile-admission" ||
        profileAdmissionDecision.candidate_ref.sha256 !==
          sha256(casePaths.profileAdmissionCandidate) ||
        profileAdmissionDecision.review_ref.sha256 !==
          sha256(casePaths.independentLeanReview) ||
        profileAdmissionDecision.readiness_ref.sha256 !==
          sha256(casePaths.admissionReadiness) ||
        profileAdmissionDecision.decision_scope.profile_id !== "lean-dtt" ||
        profileAdmissionDecision.decision_scope.consumer_claim_version !==
          "5-lean-candidate") {
      semanticFailures.push("lean-dtt profile admission does not bind the exact candidate, review, readiness, and consumer scope");
    }
    if (formalClaimV5Decision.status !== "resolved-pass" ||
        formalClaimV5Decision.selected_option_id !== "ADMIT" ||
        formalClaimV5Decision.authority_effect !==
          "bounded-formal-claim-admission" ||
        formalClaimV5Decision.candidate_ref.sha256 !== sha256(casePaths.formalClaimV5) ||
        formalClaimV5Decision.profile_admission_ref.sha256 !==
          sha256(casePaths.profileAdmissionDecision) ||
        formalClaimV5Decision.review_ref.sha256 !==
          sha256(casePaths.independentLeanReview) ||
        formalClaimV5Decision.readiness_ref.sha256 !==
          sha256(casePaths.admissionReadiness) ||
        formalClaimV5Decision.decision_scope.claim_version !== "5-lean-candidate") {
      semanticFailures.push("FormalClaim v5 admission does not bind the exact candidate, profile admission, review, and readiness evidence");
    }
    const leanStatementPath = resolveRepositoryRef(
      formalClaimLeanBinding.lean_statement_ref.path,
    );
    const runtimeExecutablePath = leanProviderRuntimeBinding.command[0];
    if (preservationBinding.status !== "preserved" ||
        preservationBinding.kind !== "review-backed" ||
        preservationBinding.known_losses.length !== 0 ||
        preservationBinding.projection_ref.sha256 !== sha256(leanStatementPath) ||
        preservationBinding.certificate_ref.sha256 !== sha256(casePaths.independentLeanReview) ||
        preservationBinding.authority_effect !== "none") {
      semanticFailures.push("Lean source preservation binding is not exact, lossless, review-backed, and non-authoritative");
    }
    if (formalClaimLeanBinding.currentness !== "current" ||
        formalClaimLeanBinding.formal_claim_ref.sha256 !== sha256(casePaths.formalClaimV5) ||
        formalClaimLeanBinding.lean_profile_ref.sha256 !== sha256(casePaths.profileAdmissionDecision) ||
        formalClaimLeanBinding.lean_environment_ref.sha256 !== sha256(casePaths.leanEnvironment) ||
        formalClaimLeanBinding.lean_statement_ref.sha256 !== sha256(leanStatementPath) ||
        formalClaimLeanBinding.preservation_binding_ref.sha256 !== sha256(casePaths.preservationBinding) ||
        formalClaimLeanBinding.canonical_proposition_semantic_digest !==
          formalClaimV5.canonical_proposition.semantic_identity_digest ||
        formalClaimLeanBinding.authority_effect !== "none") {
      semanticFailures.push("FormalClaimLeanBinding does not close exactly over the admitted v5 claim, admitted profile, environment, statement, and preservation evidence");
    }
    if (leanProviderRuntimeBinding.provider_owner !== "candidate-unselected-lean-provider" ||
        leanProviderRuntimeBinding.provider_id !== "lean4-core-typechecker" ||
        leanProviderRuntimeBinding.provider_version !== "4.32.0" ||
        runtimeExecutablePath !==
          "/home/vrondelli/.elan/toolchains/leanprover--lean4---v4.32.0/bin/lean" ||
        leanProviderRuntimeBinding.provider_digest !==
          "e8baaa71855a616dc351028f3ad2200051b0671f423a1696a100e809302d5550" ||
        leanProviderRuntimeBinding.input_artifact_ref.sha256 !== sha256(casePaths.formalClaimLeanBinding) ||
        leanProviderRuntimeBinding.profile_ref.sha256 !== sha256(casePaths.profileAdmissionDecision) ||
        leanProviderRuntimeBinding.command[1] !==
          "projects/auth-foundation/formalization/cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/ExactSessionRolePermission.lean" ||
        leanProviderRuntimeBinding.network !== "forbidden" ||
        leanProviderRuntimeBinding.environment_allowlist.length !== 0 ||
        leanProviderRuntimeBinding.authority_effect !== "none") {
      semanticFailures.push("Lean runtime candidate is not exact, locally pinned, no-network, unselected, and non-authoritative");
    }
    if (theoremExecutionPolicy.owner !== "EVF" ||
        theoremExecutionPolicy.policy_state !== "candidate-awaiting-evf-admission" ||
        theoremExecutionPolicy.provider_route !== "evf-theorem" ||
        theoremExecutionPolicy.lean_profile_admission_ref.sha256 !==
          sha256(casePaths.profileAdmissionDecision) ||
        theoremExecutionPolicy.lean_environment_ref.sha256 !== sha256(casePaths.leanEnvironment) ||
        theoremExecutionPolicy.source_controls.sorry !== "forbidden" ||
        theoremExecutionPolicy.source_controls.unsafe !== "forbidden" ||
        theoremExecutionPolicy.source_controls.new_axioms !== "forbidden" ||
        theoremExecutionPolicy.execution_controls.deterministic_repetitions !== 2 ||
        theoremExecutionPolicy.network !== "forbidden" ||
        theoremExecutionPolicy.authority_effect !== "none") {
      semanticFailures.push("theorem execution policy candidate does not preserve the exact no-network, no-sorry, no-unsafe boundary admitted by the separate EVF decision");
    }
    if (theoremObligationRequest.owner !== "EVF" ||
        theoremObligationRequest.request_state !== "blocked" ||
        theoremObligationRequest.formal_claim_lean_binding_ref.sha256 !==
          sha256(casePaths.formalClaimLeanBinding) ||
        theoremObligationRequest.theorem_statement_ref.sha256 !== sha256(leanStatementPath) ||
        theoremObligationRequest.provider_profile_ref.sha256 !==
          sha256(casePaths.profileAdmissionDecision) ||
        theoremObligationRequest.runtime_binding_ref.sha256 !==
          sha256(casePaths.leanProviderRuntimeBinding) ||
        theoremObligationRequest.execution_policy_ref.sha256 !==
          sha256(casePaths.theoremExecutionPolicy) ||
        !theoremObligationRequest.residue.some((item) => item.includes("not admitted")) ||
        !theoremObligationRequest.residue.some((item) => item.includes("not selected")) ||
        theoremObligationRequest.authority_effect !== "none") {
      semanticFailures.push("theorem request must stay blocked on explicit EVF policy admission and provider selection without a proof claim");
    }
    let theoremRouteReview = null;
    try {
      theoremRouteReview = JSON.parse(readFileSync(
        resolveRepositoryRef(leanTheoremRouteDecision.review_ref.path),
        "utf8",
      ));
    } catch (error) {
      semanticFailures.push(`theorem route review is unreadable: ${error.message}`);
    }
    if (leanTheoremRouteDecision.status !== "resolved-pass" ||
        leanTheoremRouteDecision.selected_option_id !== "ADMIT" ||
        leanTheoremRouteDecision.authority_effect !== "bounded-theorem-route-admission" ||
        leanTheoremRouteDecision.formal_claim_lean_binding_ref.sha256 !==
          sha256(casePaths.formalClaimLeanBinding) ||
        leanTheoremRouteDecision.runtime_binding_ref.sha256 !==
          sha256(casePaths.leanProviderRuntimeBinding) ||
        leanTheoremRouteDecision.execution_policy_ref.sha256 !==
          sha256(casePaths.theoremExecutionPolicy) ||
        theoremRouteReview?.status !== "pass" ||
        theoremRouteReview?.counts?.blockers !== 0 ||
        leanTheoremRouteDecision.decision_scope.provider_route !== "evf-theorem" ||
        leanTheoremRouteDecision.decision_scope.provider_id !== "lean4-core-typechecker" ||
        leanTheoremRouteDecision.source_of_decision.raw_response !==
          "Run the gate if you have a next action it should be already handled") {
      semanticFailures.push("EVF theorem-route admission does not bind the exact passing review, runtime, policy, provider, and owner selection");
    }
    if (theoremObligationRequestReady.owner !== "EVF" ||
        theoremObligationRequestReady.request_state !== "ready" ||
        theoremObligationRequestReady.formal_claim_lean_binding_ref.sha256 !==
          sha256(casePaths.formalClaimLeanBinding) ||
        theoremObligationRequestReady.theorem_statement_ref.sha256 !== sha256(leanStatementPath) ||
        theoremObligationRequestReady.provider_profile_ref.sha256 !==
          sha256(casePaths.profileAdmissionDecision) ||
        theoremObligationRequestReady.runtime_binding_ref.sha256 !==
          sha256(casePaths.leanProviderRuntimeBinding) ||
        theoremObligationRequestReady.execution_policy_ref.sha256 !==
          sha256(casePaths.theoremExecutionPolicy) ||
        theoremObligationRequestReady.residue.length !== 0 ||
        theoremObligationRequestReady.authority_effect !== "none") {
      semanticFailures.push("ready theorem request does not close exactly over the admitted route without claiming execution or proof");
    }
    for (const [label, value, schemaPath] of [
      [
        "profile admission decision",
        profileAdmissionDecision,
        resolveRepositoryRef("projects/domainspec-v2/formalization/schemas/lean-profile-admission-decision.schema.json"),
      ],
      [
        "FormalClaim v5 admission decision",
        formalClaimV5Decision,
        resolveFormalizationRef("schemas/auth-formal-claim-admission-decision.v1.schema.json"),
      ],
      [
        "Lean theorem route admission decision",
        leanTheoremRouteDecision,
        resolveFormalizationRef("schemas/auth-lean-theorem-route-admission-decision.v1.schema.json"),
      ],
    ]) {
      try {
        const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
        const errors = validateSchemaInstance(value, schema, schema);
        semanticFailures.push(...errors.map((error) => `${label}: ${error}`));
      } catch (error) {
        semanticFailures.push(`${label} schema validation failed: ${error.message}`);
      }
    }
    try {
      const gateBindings = [
        ["profile", profileAdmissionDecision],
        ["FormalClaim", formalClaimV5Decision],
        ["theorem route", leanTheoremRouteDecision],
      ];
      for (const [label, decision] of gateBindings) {
        const request = JSON.parse(readFileSync(
          resolveRepositoryRef(decision.admissibility.request_ref.path),
          "utf8",
        ));
        const receipt = JSON.parse(readFileSync(
          resolveRepositoryRef(decision.admissibility.receipt_ref.path),
          "utf8",
        ));
        if (receipt.requestDigest !== sha256Stable(request) ||
            receipt.routeOutcome !== "gate" ||
            receipt.decisionGateRequired !== true ||
            !deepEqual(receipt.admissibleOptionIds, ["ADMIT", "DEFER", "REJECT", "REVISE"]) ||
            !receipt.presentedOptionIds.includes("ADMIT") ||
            receipt.rejectedOptions.length !== 0 ||
            receipt.reasons.length !== 0) {
          semanticFailures.push(`${label} option-admissibility gate is not exact and open for the selected ADMIT option`);
        }
      }
    } catch (error) {
      semanticFailures.push(`admission option-gate validation failed: ${error.message}`);
    }
    if (formalClaimV5.tde_compatibility.current_intake_contract !==
          "FormalClaimSourcePayload/v2" ||
        formalClaimV5.tde_compatibility.status !== "adapter-required" ||
        formalClaimV5.tde_compatibility.v2_projection_ref !== null) {
      semanticFailures.push("admitted FormalClaim v5 must remain adapter-required and unprojected until a separate projection decision");
    }

    const graphNodes = definitionBinding.definition_nodes ?? [];
    const graphRelations = definitionBinding.relations ?? [];
    const graphNodeIds = graphNodes.map((node) => node.definition_id);
    const graphRelationIds = graphRelations.map((relation) => relation.relation_id);
    const graphTargetIds = graphRelations.map((relation) => relation.target_definition_id);
    const acceptedDefinitionById = new Map(
      acceptedDefinitionsBusinessMeaning.definitions.map((definition) => [
        definition.definition_id,
        definition,
      ]),
    );
    if (definitionBinding.claim_identity.claim_id !== formalClaimV4.claim.claim_id ||
        definitionBinding.claim_identity.claim_version !== formalClaimV4.claim.claim_version ||
        definitionBinding.definition_authority_ref.sha256 !==
          sha256(casePaths.acceptedDefinitionsBusinessMeaning) ||
        graphNodes.length !== requiredDefinitionIds.length ||
        graphRelations.length !== requiredDefinitionIds.length ||
        !unique(graphNodeIds) ||
        !unique(graphRelationIds) ||
        !unique(graphTargetIds) ||
        !deepEqual([...graphNodeIds].sort(), [...requiredDefinitionIds].sort()) ||
        !deepEqual([...graphTargetIds].sort(), [...requiredDefinitionIds].sort()) ||
        !deepEqual(
          definitionBinding.definition_closure.definition_ids,
          [...requiredDefinitionIds].sort(),
        ) ||
        definitionBinding.resolution_policy.edge_source !==
          "explicit-author-declaration" ||
        definitionBinding.resolution_policy.name_inference !== "forbidden" ||
        definitionBinding.resolution_policy.missing_definition !== "block" ||
        definitionBinding.resolution_policy.transitive_dependencies !== "required" ||
        hasOwn(definitionBinding, "definitions") ||
        hasOwn(formalClaimV4, "definitions")) {
      semanticFailures.push("definition binding must be the complete explicit 20-node uses_definition graph with no copied bodies or name inference");
    }
    const selectedDefinitions = [];
    for (const node of graphNodes) {
      let selectedDefinition = null;
      try {
        selectedDefinition = resolveJsonPointer(
          acceptedDefinitionsBusinessMeaning,
          node.definition_pointer,
        );
      } catch (error) {
        semanticFailures.push(`${node.definition_id}: ${error.message}`);
      }
      if (!selectedDefinition ||
          selectedDefinition.definition_id !== node.definition_id ||
          selectedDefinition.status !== "accepted" ||
          node.status !== "accepted" ||
          node.definition_digest !== sha256Stable(selectedDefinition) ||
          acceptedDefinitionById.get(node.definition_id) !== selectedDefinition) {
        semanticFailures.push(`${node.definition_id}: graph node does not exact-bind its accepted definition body`);
      } else {
        selectedDefinitions.push(selectedDefinition);
      }
      const relation = graphRelations.find((item) =>
        item.target_definition_id === node.definition_id
      );
      if (!relation || relation.relation_type !== "uses_definition" ||
          relation.source_claim_id !== formalClaimV4.claim.claim_id ||
          relation.definition_pointer !== node.definition_pointer ||
          relation.binding_effect !== "semantic-dependency" ||
          relation.inference !== "explicit") {
        semanticFailures.push(`${node.definition_id}: explicit uses_definition relation is missing or inconsistent`);
      }
    }
    const graphNodeIdSet = new Set(graphNodeIds);
    for (const definition of selectedDefinitions) {
      for (const dependencyId of definition.depends_on ?? []) {
        if (!graphNodeIdSet.has(dependencyId)) {
          semanticFailures.push(`${definition.definition_id}: transitive definition dependency ${dependencyId} is absent from the claim graph`);
        }
      }
    }
    const selectedDefinitionsById = [...selectedDefinitions].sort((left, right) =>
      left.definition_id.localeCompare(right.definition_id)
    );
    if (definitionBinding.definition_closure.canonicalization !==
          "domainspec-json-keysort-v1" ||
        definitionBinding.definition_closure.digest_algorithm !== "sha256" ||
        definitionBinding.definition_closure.digest !==
          sha256Stable(selectedDefinitionsById)) {
      semanticFailures.push("definition closure digest does not deterministically bind the selected accepted definitions");
    }

    const signature = formalClaimV4.formal_signature;
    const sortNames = signature.sorts.map((symbol) => symbol.name);
    const functionNames = signature.functions.map((symbol) => symbol.name);
    const predicateNamesV4 = signature.predicates.map((symbol) => symbol.name);
    const constantNames = signature.constants.map((symbol) => symbol.name);
    const expectedSignature = {
      sorts: [
        "AuthorizationDecision",
        "AuthorizationRequest",
        "AuthorizationRevision",
        "DecisionTime",
        "Permission",
        "Role",
        "Session",
      ],
      functions: [
        "CurrentAuthorizationRevision",
        "Decision",
        "DecisionTime",
        "RequiredPermission",
      ],
      predicates: [
        "AuthorizationAdmissible",
        "Grants",
        "PermissionExactEqual",
        "ResolvedActiveRole",
      ],
      constants: ["ALLOW", "DENY"],
    };
    const allTypedSymbols = [
      ...signature.functions.flatMap((symbol) => [
        ...symbol.parameter_sorts,
        symbol.result_sort,
      ]),
      ...signature.predicates.flatMap((symbol) => symbol.parameter_sorts),
      ...signature.constants.map((symbol) => symbol.sort),
    ];
    if (!unique(sortNames) || !unique(functionNames) ||
        !unique(predicateNamesV4) || !unique(constantNames) ||
        !deepEqual([...sortNames].sort(), expectedSignature.sorts) ||
        !deepEqual([...functionNames].sort(), expectedSignature.functions) ||
        !deepEqual([...predicateNamesV4].sort(), expectedSignature.predicates) ||
        !deepEqual([...constantNames].sort(), expectedSignature.constants) ||
        !allTypedSymbols.every((sortName) => sortNames.includes(sortName)) ||
        ![...functionNames, ...predicateNamesV4, ...constantNames].every((name) =>
          v4Proposition.representation.includes(name)
        )) {
      semanticFailures.push("FormalClaim v4 formal signature is not unique, type-closed, or complete for the proposition symbols");
    }

    const expectedEnvelopeDefinitions = graphNodes.map((node) =>
      resolveJsonPointer(acceptedDefinitionsBusinessMeaning, node.definition_pointer)
    );
    if (formalClaimEnvelope.schema_version !==
          "domainspec-v2.formal-claim-envelope/v1-candidate" ||
        formalClaimEnvelope.formal_claim_ref.sha256 !== sha256(casePaths.formalClaimV4) ||
        formalClaimEnvelope.definition_binding_ref.sha256 !==
          sha256(casePaths.definitionBinding) ||
        formalClaimEnvelope.definition_authority_ref.sha256 !==
          sha256(casePaths.acceptedDefinitionsBusinessMeaning) ||
        !deepEqual(formalClaimEnvelope.definition_closure, definitionBinding.definition_closure) ||
        !deepEqual(formalClaimEnvelope.resolved_definitions, expectedEnvelopeDefinitions) ||
        formalClaimEnvelope.materialization_policy.source !== "definition_binding_ref" ||
        formalClaimEnvelope.materialization_policy.selection !==
          "explicit-uses_definition-edges" ||
        formalClaimEnvelope.materialization_policy.name_inference !== "forbidden" ||
        formalClaimEnvelope.materialization_policy.derived_not_authoritative !== true ||
        formalClaimEnvelope.reference_policy.copied_external_references !==
          "retained-as-opaque-traceability-metadata" ||
        formalClaimEnvelope.reference_policy.dereference_required_for_claim_meaning !== false ||
        formalClaimEnvelope.reference_policy.unresolved_external_references_expand_claim !== false ||
        formalClaimEnvelope.authority_effect !== "none") {
      semanticFailures.push("consumer envelope is not a deterministic non-authoritative materialization of the exact definition graph");
    }
    if (formalClaimV4.tde_compatibility.current_intake_contract !==
          "FormalClaimSourcePayload/v2" ||
        formalClaimV4.tde_compatibility.status !== "adapter-required" ||
        formalClaimV4.tde_compatibility.v2_projection_ref !== null) {
      semanticFailures.push("FormalClaim v4 must remain unprojected and adapter-required before admission");
    }
    if (existsSync(resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/FORMAL-CLAIM.v2-projection.json",
    ))) {
      semanticFailures.push("an ineligible FormalClaimSourcePayload/v2 projection exists before FormalClaim admission");
    }
    if (authoringTrace.authoring_capability !== "invoke" ||
        authoringTrace.mode !== "define" ||
        authoringTrace.authority_effect !== "none") {
      semanticFailures.push("historical authoring trace does not preserve its original no-authority route");
    }
    const forbiddenArtifact = manifest.artifacts.find((artifact) =>
      /(proof-result|theorem-evidence|provider-result|evidence-join|evf-evidence)/i.test(artifact.artifact_id)
    );
    if (forbiddenArtifact) {
      semanticFailures.push(`${forbiddenArtifact.artifact_id}: exceeds the L0 artifact ceiling`);
    }
  }
  check(
    "AF-V028",
    semanticFailures.length === 0,
    semanticFailures.length === 0
      ? "admitted v5 claim, preservation-backed Lean binding, exact bounded EVF route admission, ready theorem request, and no-execution boundaries are coherent"
      : semanticFailures.join("; "),
  );

  const caseDigests = caseParseFailures.length === 0
    ? Object.fromEntries(Object.entries(casePaths).map(([name, path]) => [
      name,
      { path: relative(repositoryRoot, path), sha256: sha256(path), size_bytes: statSync(path).size },
    ]))
    : {};

  const result = {
    schema_version: "auth-foundation.formalization-validation/v1",
    status: blockers.length === 0 ? "pass" : "block",
    authority_effect: "none",
    package_id: manifest.package_id,
    ontology_id: ontology.ontology_id,
    counts: {
      sources: manifest.source_identities.length,
      artifacts: manifest.artifacts.length,
      nodes: ontology.nodes.length,
      relations: ontology.relations.length,
      invariants: ontology.invariants.length,
      residue: ontology.residue.length,
      checks: checks.length,
      blockers: blockers.length,
    },
    checks,
    blockers,
    bound_case_artifacts: caseDigests,
    selected_formal_language_profile: selectedProfile
      ? {
        profile_id: selectedProfile.profile_id,
        version: selectedProfile.version,
        provider_route: selectedProfile.provider_route,
      }
      : null,
    claim_ceiling: manifest.claim_ceiling,
  };

  const receiptFlagIndex = process.argv.indexOf("--receipt");
  if (receiptFlagIndex !== -1) {
    const receiptArgument = process.argv[receiptFlagIndex + 1];
    if (!receiptArgument) {
      throw new Error("--receipt requires a path");
    }
    const requestedReceiptPath = isAbsolute(receiptArgument)
      ? resolve(receiptArgument)
      : resolve(repositoryRoot, receiptArgument);
    const receiptsRoot = resolve(formalizationRoot, "receipts");
    if (!isInside(requestedReceiptPath, receiptsRoot)) {
      throw new Error("receipt path must be inside formalization/receipts");
    }
    if (existsSync(requestedReceiptPath)) {
      throw new Error(`refusing to overwrite receipt: ${requestedReceiptPath}`);
    }
    mkdirSync(dirname(requestedReceiptPath), { recursive: true });
    writeFileSync(
      requestedReceiptPath,
      `${JSON.stringify({ ...result, validated_at: new Date().toISOString() }, null, 2)}\n`,
      "utf8",
    );
    result.receipt = relative(repositoryRoot, requestedReceiptPath);
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status !== "pass") process.exitCode = 1;
}
