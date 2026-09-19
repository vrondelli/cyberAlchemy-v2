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

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function sha256Text(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
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

function exactRefErrors(label, exactRef) {
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
  if (exactRef.current !== true) errors.push(`${label}: current must be true`);
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
    "schemas/auth-formal-claim-identity-inputs.schema.json",
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
    reviewedBusinessMeaning: resolveRepositoryRef(
      "projects/auth-foundation/formalization/cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/BUSINESS-MEANING.json",
    ),
    reviewedInterpretationModel: resolveRepositoryRef(
      "projects/auth-foundation/formalization/cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/INTERPRETATION-MODEL.json",
    ),
    businessMeaning: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/BUSINESS-MEANING.accepted.json",
    ),
    interpretationModel: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/INTERPRETATION-MODEL.accepted.json",
    ),
    identityInputs: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/CLAIM-IDENTITY-INPUTS.json",
    ),
    formalClaimV3: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/FORMAL-CLAIM.v3-candidate.json",
    ),
    casePackage: resolveFormalizationRef(
      "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/CASE-PACKAGE.json",
    ),
    ownerSemanticDecision: resolveRepositoryRef(
      "projects/auth-foundation/formalization/decisions/AF-EXACT-SESSION-ROLE-PERMISSION-001/owner-semantic-decision.json",
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
      ["case.business_meaning_ref", caseValues.casePackage.semantic_acceptance.business_meaning_ref],
      ["case.business_acceptance_ref", caseValues.casePackage.semantic_acceptance.business_acceptance_ref],
      ["case.interpretation_model_ref", caseValues.casePackage.semantic_acceptance.interpretation_model_ref],
      ["case.interpretation_acceptance_ref", caseValues.casePackage.semantic_acceptance.interpretation_acceptance_ref],
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
    ];
    for (const [label, exactRef] of exactRefs) {
      exactReferenceFailures.push(...exactRefErrors(label, exactRef));
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
      interpretationModel,
      identityInputs,
      formalClaimV3,
      casePackage,
      reviewedBusinessMeaning,
      reviewedInterpretationModel,
      ownerSemanticDecision,
    } = caseValues;
    let profileRegistry = null;
    try {
      profileRegistry = JSON.parse(readFileSync(
        resolveRepositoryRef(identityInputs.formal_language_profile.registry_ref.path),
        "utf8",
      ));
    } catch (error) {
      semanticFailures.push(`profile registry: ${error.message}`);
    }
    selectedProfile = profileRegistry?.profiles?.find((profile) =>
      profile.profile_id === identityInputs.formal_language_profile.profile_id &&
      profile.version === identityInputs.formal_language_profile.version
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
      semanticFailures.push("InterpretationModel accepted postimage must bind the exact owner decision");
    }
    if (casePackage.selected_layer !== "L0" ||
        casePackage.current_state !== "claim-draft" ||
        casePackage.outcome !== "not-evaluated" ||
        casePackage.evidence_join_ref !== null ||
        casePackage.semantic_acceptance.business_status !== "accepted" ||
        casePackage.semantic_acceptance.interpretation_status !== "accepted") {
      semanticFailures.push("case must remain an unevaluated L0 claim draft with accepted semantics and no FormalClaim admission");
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
      semanticFailures.push("accepted InterpretationModel changes semantic content beyond lifecycle annotation and accepted meaning binding");
    }
    if (!selectedProfile || selectedProfile.provider_route !== "none" ||
        selectedProfile.formal_claim_role !== "canonical-source") {
      semanticFailures.push("fol-core canonical-source profile with no provider route is not exactly selected");
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
      semanticFailures.push("InterpretationModel does not close the canonical proposition signature");
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
      /(obligation|proof|provider-result|evidence-join|evf)/i.test(artifact.artifact_id)
    );
    if (forbiddenArtifact) {
      semanticFailures.push(`${forbiddenArtifact.artifact_id}: exceeds the L0 artifact ceiling`);
    }
  }
  check(
    "AF-V028",
    semanticFailures.length === 0,
    semanticFailures.length === 0
      ? "owner-accepted L0 semantics, preserved preimages, rebound FormalClaim candidate, profile, adapter, and authority boundaries are coherent"
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
