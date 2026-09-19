import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CANONICAL = {
  schema: "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/schemas/typescript-representation-decision.schema.json",
  validator: "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/validators/validate-typescript-representation-decision.mjs",
  authorization: "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/decisions/typescript-representation.owner-authorization.json",
  ontology: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json",
  profile: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json",
  dependency: "projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ONT-006.json"
};

const FORM_DISPOSITIONS = new Map([
  ["typescript.owned-const-object-enum", ["candidate-form", "selected-for-materialization"]],
  ["typescript.native-enum", ["candidate-form", "rejected"]],
  ["typescript.standalone-literal-union", ["candidate-form", "unsupported"]],
  ["typescript.bare-const-object", ["candidate-form", "unsupported"]],
  ["typescript.arbitrary-factory", ["analysis-boundary", "unsupported"]],
  ["typescript.raw-spread-or-computed-member", ["analysis-boundary", "unsupported"]],
  ["typescript.helper-name-impersonation", ["analysis-boundary", "unsupported"]]
]);

const REQUIRED_EXPORTS = ["defineEnum", "composeEnum", "EnumValue"];

const canonical = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

const loadJson = (path) => {
  const bytes = readFileSync(path);
  return { value: JSON.parse(bytes.toString("utf8")), bytes };
};

const artifactRef = (canonicalPath, actualPath) => {
  const bytes = readFileSync(actualPath);
  return {
    path: canonicalPath,
    sha256: digest(bytes),
    size_bytes: statSync(actualPath).size
  };
};

const same = (left, right) => canonical(left) === canonical(right);

const parseArgs = (argv) => {
  const parsed = { selfTest: false };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--self-test") {
      parsed.selfTest = true;
      continue;
    }
    if (!token.startsWith("--") || index + 1 >= argv.length) {
      throw new Error(`invalid argument: ${token}`);
    }
    parsed[token.slice(2).replaceAll("-", "_")] = argv[index + 1];
    index += 1;
  }
  for (const required of ["schema", "owner_authorization", "ontology", "profile", "dependency_receipt"]) {
    if (!parsed[required]) throw new Error(`missing --${required.replaceAll("_", "-")}`);
  }
  if (!parsed.selfTest && !parsed.decision) throw new Error("missing --decision");
  return parsed;
};

const resolveRef = (schema, root) => {
  if (!schema.$ref) return schema;
  if (!schema.$ref.startsWith("#/")) throw new Error(`unsupported schema reference: ${schema.$ref}`);
  return schema.$ref.slice(2).split("/").reduce((value, token) => value[token.replaceAll("~1", "/").replaceAll("~0", "~")], root);
};

const hasType = (value, type) => {
  if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  if (type === "array") return Array.isArray(value);
  if (type === "integer") return Number.isInteger(value);
  return typeof value === type;
};

const validateSchema = (value, inputSchema, root, location = "$", errors = []) => {
  const schema = resolveRef(inputSchema, root);
  if (Object.hasOwn(schema, "const") && !same(value, schema.const)) errors.push(`${location}: const mismatch`);
  if (schema.enum && !schema.enum.some((candidate) => same(value, candidate))) errors.push(`${location}: value outside enum`);
  if (schema.type && !hasType(value, schema.type)) {
    errors.push(`${location}: expected ${schema.type}`);
    return errors;
  }
  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${location}: shorter than minLength`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${location}: pattern mismatch`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${location}: too few items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${location}: too many items`);
    if (schema.prefixItems) {
      schema.prefixItems.forEach((child, index) => {
        if (index < value.length) validateSchema(value[index], child, root, `${location}/${index}`, errors);
      });
    }
    const start = schema.prefixItems?.length ?? 0;
    if (schema.items === false && value.length > start) errors.push(`${location}: additional items forbidden`);
    if (schema.items && typeof schema.items === "object") {
      for (let index = start; index < value.length; index += 1) {
        validateSchema(value[index], schema.items, root, `${location}/${index}`, errors);
      }
    }
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const key of schema.required ?? []) {
      if (!Object.hasOwn(value, key)) errors.push(`${location}/${key}: required property missing`);
    }
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
      if (Object.hasOwn(value, key)) validateSchema(value[key], child, root, `${location}/${key}`, errors);
    }
    if (schema.additionalProperties === false) {
      const admitted = new Set(Object.keys(schema.properties ?? {}));
      for (const key of Object.keys(value)) {
        if (!admitted.has(key)) errors.push(`${location}/${key}: additional property forbidden`);
      }
    }
  }
  return errors;
};

const verifyRef = (label, declared, expected) => {
  const errors = [];
  if (!same(declared, expected)) errors.push(`${label}: stale or mismatched artifact reference`);
  return errors;
};

const verifyAuthorization = ({ authorization, refs }) => {
  const errors = [];
  if (authorization.schema_version !== "ape.enum.typescript-representation-owner-authorization.v1") errors.push("authorization: unexpected schema_version");
  if (authorization.authorization_id !== "APE-ENUM-TS-REPRESENTATION-AUTH-001") errors.push("authorization: unexpected authorization_id");
  if (authorization.decision_id !== "APE-ENUM-TS-REPRESENTATION-001") errors.push("authorization: unexpected decision_id");
  if (authorization.swu_id !== "SWU-APE-ENUM-TS-001") errors.push("authorization: unexpected swu_id");
  if (authorization.result !== "authorized") errors.push("authorization: result must be authorized");
  if (authorization.owner?.owner_role !== "typescript-architecture-profile-owner") errors.push("authorization: wrong owner role");
  if (authorization.selection?.protocol_id !== "typescript.owned-const-object-enum/v1") errors.push("authorization: wrong protocol");
  if (!same(authorization.selection?.required_exports, REQUIRED_EXPORTS)) errors.push("authorization: wrong required exports");
  if (authorization.selection?.selection_state !== "selected-for-materialization") errors.push("authorization: wrong selection state");
  if (authorization.profile_activation !== "not-authorized") errors.push("authorization: profile activation must remain unauthorized");
  if (authorization.authority_effect !== "none") errors.push("authorization: authority effect must remain none");
  for (const [key, ref] of Object.entries(refs)) errors.push(...verifyRef(`authorization.bindings.${key}`, authorization.bindings?.[key], ref));
  return errors;
};

const verifyDecision = ({ decision, schema, authorization, refs, profile, dependency, ontology }) => {
  const errors = validateSchema(decision, schema, schema);
  errors.push(...verifyAuthorization({ authorization, refs: {
    ontology: refs.ontology,
    profile: refs.profile,
    dependency_receipt: refs.dependency_receipt,
    schema: refs.schema,
    validator: refs.validator
  }}));

  for (const [key, ref] of Object.entries(refs)) errors.push(...verifyRef(`decision.bindings.${key}`, decision.bindings?.[key], ref));
  errors.push(...verifyRef("decision.owner.authorization_ref", decision.owner?.authorization_ref, refs.owner_authorization));

  const seen = new Set();
  for (const item of decision.representation_decisions ?? []) {
    if (seen.has(item.form_id)) errors.push(`representation_decisions: duplicate form_id ${item.form_id}`);
    seen.add(item.form_id);
    const expected = FORM_DISPOSITIONS.get(item.form_id);
    if (!expected) {
      errors.push(`representation_decisions: unknown form_id ${item.form_id}`);
    } else if (item.category !== expected[0] || item.disposition !== expected[1]) {
      errors.push(`representation_decisions: wrong disposition for ${item.form_id}`);
    }
  }
  for (const formId of FORM_DISPOSITIONS.keys()) {
    if (!seen.has(formId)) errors.push(`representation_decisions: missing form_id ${formId}`);
  }

  const overlay = (profile.representation_overlays ?? []).find((item) => item.contract_id === "enum.profile-representation");
  const candidates = overlay?.candidate_protocols ?? [];
  if (candidates.length !== 1) errors.push("profile: expected exactly one candidate protocol");
  const candidate = candidates[0];
  if (candidate?.protocol_id !== decision.selected_protocol?.protocol_id) errors.push("profile: selected protocol mismatch");
  if (!same(candidate?.runtime_provider?.required_exports, REQUIRED_EXPORTS)) errors.push("profile: required export mismatch");
  if (candidate?.status !== "unmaterialized") errors.push("profile: candidate must remain unmaterialized");
  if ((overlay?.admitted_forms ?? []).length !== 0) errors.push("profile: admitted forms must remain empty before TS-001B");
  if (candidate?.runtime_provider?.provider_sha256 !== null) errors.push("profile: provider digest must remain absent before TS-001A");

  if (dependency.schema_version !== "ape.swu-receipt.v1" || dependency.swu_id !== "SWU-APE-ONT-006" || dependency.result !== "pass") {
    errors.push("dependency receipt: ONT-006 is not a current passing receipt");
  }
  if (dependency.typescript_candidate_protocol?.protocol_id !== decision.selected_protocol?.protocol_id) {
    errors.push("dependency receipt: candidate protocol mismatch");
  }
  if (dependency.continuation?.next_candidate !== "SWU-APE-ENUM-TS-001") errors.push("dependency receipt: TS-001 is not the declared successor");
  if (ontology.authority_effect !== "none") errors.push("ontology: authority_effect must remain none");
  if (decision.profile_activation !== "deferred-to-SWU-APE-ENUM-TS-001B") errors.push("decision: profile activation escaped TS-001B");
  if (decision.provider_status !== "unmaterialized-until-SWU-APE-ENUM-TS-001A") errors.push("decision: provider status escaped TS-001A");
  return [...new Set(errors)].sort();
};

const buildDecision = ({ refs, authorization }) => ({
  schema_version: "ape.enum.typescript-representation-decision.v1",
  decision_id: "APE-ENUM-TS-REPRESENTATION-001",
  swu_id: "SWU-APE-ENUM-TS-001",
  language: "typescript",
  canonical_concept_ref: "DS-D1.3 Enum",
  evidence_date: "2026-08-05",
  owner: {
    owner_id: authorization.owner.owner_id,
    owner_role: "typescript-architecture-profile-owner",
    authorization_ref: refs.owner_authorization
  },
  bindings: refs,
  selected_protocol: {
    protocol_id: "typescript.owned-const-object-enum/v1",
    form_id: "typescript.owned-const-object-enum",
    selection_state: "selected-for-materialization",
    module_path: "projects/domainspec-v2/impl/architecture-conformance/typescript/runtime/enum/index.ts",
    required_exports: REQUIRED_EXPORTS
  },
  representation_decisions: [...FORM_DISPOSITIONS.entries()].map(([form_id, [category, disposition]]) => ({
    form_id,
    category,
    disposition,
    reason: `Contract fixture disposition for ${form_id}.`
  })),
  provider_status: "unmaterialized-until-SWU-APE-ENUM-TS-001A",
  profile_activation: "deferred-to-SWU-APE-ENUM-TS-001B",
  claim_ceiling: "Representation selection only; no provider proof, profile activation, adapter evidence, promotion, publication, deployment, or release.",
  authority_effect: "none",
  handoff: {
    next_swu: "SWU-APE-ENUM-TS-001A",
    allowed_effect: "runtime-provider-materialization-only"
  }
});

const clone = (value) => JSON.parse(JSON.stringify(value));

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  const schema = loadJson(args.schema).value;
  const authorization = loadJson(args.owner_authorization).value;
  const ontology = loadJson(args.ontology).value;
  const profile = loadJson(args.profile).value;
  const dependency = loadJson(args.dependency_receipt).value;
  const refs = {
    ontology: artifactRef(CANONICAL.ontology, args.ontology),
    profile: artifactRef(CANONICAL.profile, args.profile),
    dependency_receipt: artifactRef(CANONICAL.dependency, args.dependency_receipt),
    schema: artifactRef(CANONICAL.schema, args.schema),
    validator: artifactRef(CANONICAL.validator, fileURLToPath(import.meta.url)),
    owner_authorization: artifactRef(CANONICAL.authorization, args.owner_authorization)
  };

  if (args.selfTest) {
    const base = buildDecision({ refs, authorization });
    const cases = [
      ["baseline-valid", base, true],
      ["stale-ontology-digest", Object.assign(clone(base), { bindings: { ...clone(base.bindings), ontology: { ...clone(base.bindings.ontology), sha256: "0".repeat(64) } } }), false],
      ["missing-disposition", Object.assign(clone(base), { representation_decisions: clone(base.representation_decisions).slice(0, -1) }), false],
      ["duplicate-disposition", Object.assign(clone(base), { representation_decisions: [...clone(base.representation_decisions).slice(0, -1), clone(base.representation_decisions)[0]] }), false],
      ["wrong-protocol", Object.assign(clone(base), { selected_protocol: { ...clone(base.selected_protocol), protocol_id: "typescript.fake/v1" } }), false],
      ["extra-field", Object.assign(clone(base), { unexpected: true }), false],
      ["fake-authorization-binding", Object.assign(clone(base), { owner: { ...clone(base.owner), authorization_ref: { ...clone(base.owner.authorization_ref), sha256: "f".repeat(64) } } }), false],
      ["accidental-profile-activation", Object.assign(clone(base), { profile_activation: "active" }), false]
    ];
    const results = cases.map(([case_id, decision, expectedPass]) => {
      const errors = verifyDecision({ decision, schema, authorization, refs, profile, dependency, ontology });
      const observedPass = errors.length === 0;
      return { case_id, expected: expectedPass ? "pass" : "block", observed: observedPass ? "pass" : "block", error_count: errors.length };
    });
    const failed = results.filter((result) => result.expected !== result.observed);
    process.stdout.write(`${JSON.stringify({ schema_version: "ape.enum.typescript-representation-validator-self-test.v1", result: failed.length === 0 ? "pass" : "block", case_count: results.length, results })}\n`);
    if (failed.length > 0) process.exitCode = 1;
    return;
  }

  const decision = loadJson(args.decision).value;
  const errors = verifyDecision({ decision, schema, authorization, refs, profile, dependency, ontology });
  const output = {
    schema_version: "ape.enum.typescript-representation-validation.v1",
    decision_id: decision.decision_id ?? null,
    result: errors.length === 0 ? "pass" : "block",
    decision_sha256: digest(readFileSync(args.decision)),
    protocol_id: decision.selected_protocol?.protocol_id ?? null,
    disposition_count: decision.representation_decisions?.length ?? 0,
    errors
  };
  process.stdout.write(`${JSON.stringify(output)}\n`);
  if (errors.length > 0) process.exitCode = 1;
};

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
