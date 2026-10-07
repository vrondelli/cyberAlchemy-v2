import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { buildClauseDenominator } from "../../../../craft/projects/domainspec-v2/impl/test-derivation-engine/src/sfol/denominator/index.js";
import { canonicalSfolJson, derivePureCases, digestSfolValue } from "../../../../craft/projects/domainspec-v2/impl/test-derivation-engine/src/sfol/cases/index.js";
import { decodeNodeLogicModule } from "../../../../craft/projects/domainspec-v2/impl/test-derivation-engine/src/sfol/language/decoder.js";
import { typecheckLogicModule } from "../../../../craft/projects/domainspec-v2/impl/test-derivation-engine/src/sfol/language/typecheck.js";
import { derivePureFixtures, EXHAUSTIVE_FINITE_RULESET } from "../../../../craft/projects/domainspec-v2/impl/test-derivation-engine/src/sfol/partitions/index.js";

type JsonObject = Record<string, unknown>;
type SourceRef = { path: string; sha256: string; size_bytes: number; current: true };

export const AUTH_SFOL_V4_SOURCE_PATHS = Object.freeze({
  product_decision: "implementation/decisions/command-boundary-product-ontology-admission-001.json",
  definitions: "implementation/command-boundary-definitions.json",
  capability: "implementation/command-boundary-product-capability.json",
  ontology: "implementation/command-boundary-business-ontology.json",
  sfol_decision: "formalization/decisions/AF-ADMIT-AUTHORIZATION-COMMAND-001/sfol-formal-claim-admission-001.json",
  claim: "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/FORMAL-CLAIM-SFOL.v1.json",
  module: "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/SFOL-MODULE.v1.json",
  clause_manifest: "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/SFOL-CLAUSE-ADMISSION-MANIFEST.v1.json",
  tde_cases: "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/TDE-CASES.v2.json",
  current_build: "implementation/command-boundary-runtime/.domainspec/instantiations/auth-command-boundary.admit-authorization-command.json",
});

const PINNED = Object.freeze({
  product_decision: "61bcc2b22bda6c405c17d6dfa612e77fdbaae1cc2d5b36f98f9dc53820da8b65",
  sfol_decision: "c321f051840f56a8cacd5e1b3a29efddc4708f1d438d356a0927237d33199fa5",
  clause_manifest: "f3a8c7ca8598d3eccaef749df376537c7c902c5f42bc8101694dcffdf06a5431",
  tde_cases: "5216d84f3e63fae3cf37bc0759dca2dd3aced25c9adc25905a47e875d8b2440a",
});
const CLAUSE_ID = "AUTH-CB-SFOL-READY-IFF";
const AUTH_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const MAX_SOURCE_BYTES = 2 * 1024 * 1024;
const INPUTS = ["unique_trusted_authentication_evidence", "unique_complete_route_binding", "candidate_command_provenance"] as const;

const mappings = [
  { input: INPUTS[0], rule_id: "AUTH-CB-RULE-UNIQUE-TRUSTED-AUTHENTICATION-EVIDENCE", properties: [
    ["AUTH-CB-CONTEXT#resolved_authentication_evidence", "List<AuthenticatedSessionEvidence>", "many"],
    ["AUTH-CB-AUTHENTICATED-SESSION-EVIDENCE#trusted", "Bool", "one"],
    ["AUTH-CB-AUTHENTICATED-SESSION-EVIDENCE#evidence_ref", "String", "one"],
    ["AUTH-CB-AUTHENTICATED-SESSION-EVIDENCE#session_id", "String", "one"],
    ["AUTH-CB-BOUNDARY-REQUEST#authentication_evidence_ref", "String", "one"],
  ] },
  { input: INPUTS[1], rule_id: "AUTH-CB-RULE-UNIQUE-COMPLETE-ROUTE-BINDING", properties: [
    ["AUTH-CB-CONTEXT#resolved_route_bindings", "List<RouteAuthorizationBinding>", "many"],
    ["AUTH-CB-ROUTE-AUTHORIZATION-BINDING#complete", "Bool", "one"],
    ["AUTH-CB-ROUTE-AUTHORIZATION-BINDING#route_id", "String", "one"],
    ["AUTH-CB-ROUTE-AUTHORIZATION-BINDING#required_permission", "Permission", "one"],
    ["AUTH-CB-ROUTE-AUTHORIZATION-BINDING#scope_evidence_ref", "String", "one"],
    ["AUTH-CB-BOUNDARY-REQUEST#route_id", "String", "one"],
  ] },
  { input: INPUTS[2], rule_id: "AUTH-CB-RULE-CANDIDATE-COMMAND-PROVENANCE", properties: [
    ["AUTH-CB-CONTEXT#candidate_command", "AuthorizationCommand", "one"],
    ["AUTH-CB-AUTHORIZATION-COMMAND#request_id", "String", "one"],
    ["AUTH-CB-AUTHORIZATION-COMMAND#session_id", "String", "one"],
    ["AUTH-CB-AUTHORIZATION-COMMAND#required_permission", "Permission", "one"],
    ["AUTH-CB-AUTHORIZATION-COMMAND#scope_evidence_ref", "String", "one"],
    ["AUTH-CB-BOUNDARY-REQUEST#request_id", "String", "one"],
  ] },
] as const;

function fail(code: string, message: string): never { throw new Error(`${code}:${message}`); }
const sha = (value: Buffer | string): string => createHash("sha256").update(value).digest("hex");
const object = (value: unknown, where: string): JsonObject => {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("AUTH_V4_SHAPE", `${where} must be an object`);
  return value as JsonObject;
};
const array = (value: unknown, where: string): unknown[] => {
  if (!Array.isArray(value)) fail("AUTH_V4_SHAPE", `${where} must be an array`);
  return value as unknown[];
};
const same = (left: unknown, right: unknown): boolean => canonicalSfolJson(left) === canonicalSfolJson(right);

function bytesFor(path: string, sources: ReadonlyMap<string, Buffer>, expected?: string): { value: JsonObject; ref: SourceRef } {
  const bytes = sources.get(path);
  if (!bytes || !Buffer.isBuffer(bytes)) fail("AUTH_V4_SOURCE_MISSING", path);
  const present = bytes as Buffer;
  if (present.length < 1 || present.length > MAX_SOURCE_BYTES || isAbsolute(path) ||
      path.includes("\\") || path.split("/").some(part => !part || part === "." || part === "..")) {
    fail("AUTH_V4_SOURCE_SCOPE", path);
  }
  const root = realpathSync(AUTH_ROOT);
  let selected = root;
  for (const part of path.split("/")) {
    selected = join(selected, part);
    if (lstatSync(selected).isSymbolicLink()) fail("AUTH_V4_SOURCE_DRIFT", `symlink in ${path}`);
  }
  const rel = relative(root, selected);
  if (rel === ".." || rel.startsWith("../") || isAbsolute(rel) || realpathSync(selected) !== selected) {
    fail("AUTH_V4_SOURCE_SCOPE", path);
  }
  const before = statSync(selected);
  if (!before.isFile() || before.size !== present.length) fail("AUTH_V4_SOURCE_DRIFT", path);
  const onDisk = readFileSync(selected);
  const after = statSync(selected);
  if (before.ino !== after.ino || before.dev !== after.dev || before.mtimeMs !== after.mtimeMs ||
      !onDisk.equals(present)) fail("AUTH_V4_SOURCE_DRIFT", path);
  const actual = sha(present);
  if (expected && actual !== expected) fail("AUTH_V4_PIN_DRIFT", path);
  let parsed: unknown;
  try { parsed = JSON.parse(present.toString("utf8")); }
  catch { return fail("AUTH_V4_JSON", path); }
  return { value: object(parsed, path), ref: { path, sha256: actual, size_bytes: present.length, current: true } };
}

function pinnedArtifact(value: unknown, key: string, sources: ReadonlyMap<string, Buffer>, expectedPath: string) {
  const artifact = object(value, key);
  if (artifact.path !== expectedPath || typeof artifact.sha256 !== "string") fail("AUTH_V4_PIN", key);
  return bytesFor(expectedPath, sources, artifact.sha256 as string);
}

const assertCurrentSources = (sources: ReadonlyMap<string, Buffer>, before: ReadonlyMap<string, Buffer>): void => {
  if (sources.size !== before.size || [...before].some(([path, bytes]) => !sources.get(path)?.equals(bytes))) {
    fail("AUTH_V4_SOURCE_MUTATED", "source map or Buffer changed during correspondence");
  }
};

/** Exact Auth-level correspondence only. It does not produce a v4 claim or TDE-neutral set. */
export function buildAuthSfolV4Correspondence(sources: ReadonlyMap<string, Buffer>) {
  const allowed: string[] = Object.values(AUTH_SFOL_V4_SOURCE_PATHS);
  if ([...sources.keys()].some(path => !allowed.includes(path))) fail("AUTH_V4_SOURCE_SCOPE", "unexpected source path");
  const before = new Map([...sources].map(([path, bytes]) => [path, Buffer.from(bytes)]));
  const product = bytesFor(AUTH_SFOL_V4_SOURCE_PATHS.product_decision, sources, PINNED.product_decision);
  const sfol = bytesFor(AUTH_SFOL_V4_SOURCE_PATHS.sfol_decision, sources, PINNED.sfol_decision);
  const manifest = bytesFor(AUTH_SFOL_V4_SOURCE_PATHS.clause_manifest, sources, PINNED.clause_manifest);
  const caseSet = bytesFor(AUTH_SFOL_V4_SOURCE_PATHS.tde_cases, sources, PINNED.tde_cases);
  const productArtifacts = object(product.value.admitted_artifacts, "product/admitted_artifacts");
  const sfolArtifacts = object(sfol.value.admitted_artifacts, "sfol/admitted_artifacts");
  if (product.value.decision_id !== "AUTH-DECISION-COMMAND-BOUNDARY-PRODUCT-ONTOLOGY-ADMISSION-001" ||
      sfol.value.decision_id !== "AUTH-DECISION-SFOL-FORMAL-CLAIM-ADMISSION-001" ||
      object(sfol.value.meaning_predecessor, "sfol/meaning_predecessor").decision_sha256 !== product.ref.sha256 ||
      !array(sfol.value.consumer_authorization, "sfol/consumer_authorization").includes("DomainSpec TDE local derivation")) {
    fail("AUTH_V4_DECISION", "admission identities or predecessor pin differ");
  }
  const definitions = pinnedArtifact(productArtifacts.definitions, "product/definitions", sources, AUTH_SFOL_V4_SOURCE_PATHS.definitions);
  const capability = pinnedArtifact(productArtifacts.product_capability, "product/product_capability", sources, AUTH_SFOL_V4_SOURCE_PATHS.capability);
  const ontology = pinnedArtifact(productArtifacts.business_ontology, "product/business_ontology", sources, AUTH_SFOL_V4_SOURCE_PATHS.ontology);
  const claim = pinnedArtifact(sfolArtifacts.formal_claim, "sfol/formal_claim", sources, AUTH_SFOL_V4_SOURCE_PATHS.claim);
  const module = pinnedArtifact(sfolArtifacts.sfol_module, "sfol/sfol_module", sources, AUTH_SFOL_V4_SOURCE_PATHS.module);
  const definitionIds = array(definitions.value.definitions, "definitions/definitions")
    .map((row, index) => object(row, `definitions/${index}`).definition_id);
  if (!same(definitionIds, object(productArtifacts.definitions, "product/definitions").definition_ids) ||
      !same(definitionIds, object(ontology.value.definition_source, "ontology/definition_source").definition_ids) ||
      object(ontology.value.definition_source, "ontology/definition_source").sha256 !== definitions.ref.sha256 ||
      capability.value.capability_id !== object(productArtifacts.product_capability, "product/product_capability").capability_id ||
      ontology.value.ontology_id !== object(productArtifacts.business_ontology, "product/business_ontology").ontology_id ||
      ontology.value.capability_ref !== capability.value.capability_id) {
    fail("AUTH_V4_PRODUCT_BINDING", "admitted Auth definitions, capability or ontology differ");
  }
  if (claim.value.formal_claim_id !== object(sfolArtifacts.formal_claim, "sfol/formal_claim").formal_claim_id ||
      claim.value.subject_operation !== "AUTH-CB-OP-ADMIT-AUTHORIZATION-COMMAND" ||
      object(claim.value.meaning_predecessor, "claim/meaning_predecessor").decision_id !== product.value.decision_id ||
      object(claim.value.meaning_predecessor, "claim/meaning_predecessor").ontology_id !== ontology.value.ontology_id ||
      object(claim.value.formalism, "claim/formalism").language_version !== "domainspec-sfol/v1" ||
      object(claim.value.formalism, "claim/formalism").clause_id !== CLAUSE_ID ||
      object(claim.value.formalism, "claim/formalism").module_path !== module.ref.path ||
      module.value.language_version !== "domainspec-sfol/v1") {
    fail("AUTH_V4_PROFILE", "Auth SFOL claim/module identity or domainspec-sfol/v1 profile differs; smt-sfol substitution forbidden");
  }
  const rules = array(ontology.value.rules, "ontology/rules").map((row, index) => object(row, `ontology/rules/${index}`));
  const properties = array(ontology.value.properties, "ontology/properties").map((row, index) => object(row, `ontology/properties/${index}`));
  const operations = array(ontology.value.operations, "ontology/operations").map((row, index) => object(row, `ontology/operations/${index}`));
  const operation = operations.find(row => row.operation_id === claim.value.subject_operation);
  if (!operation || !same(operation.rule_refs, claim.value.ontology_rule_refs) ||
      !same(claim.value.ontology_rule_refs, [...mappings.map(row => row.rule_id), "AUTH-CB-RULE-ADMISSIBLE"])) {
    fail("AUTH_V4_RULES", "claim operation or ontology rule IDs differ");
  }
  const candidates = mappings.map(mapping => {
    if (rules.filter(row => row.rule_id === mapping.rule_id).length !== 1) fail("AUTH_V4_RULES", mapping.rule_id);
    const property_refs = mapping.properties.map(([property_id, type, cardinality]) => {
      const matches = properties.filter(row => row.property_id === property_id);
      if (matches.length !== 1 || matches[0]!.type !== type || matches[0]!.cardinality !== cardinality) {
        fail("AUTH_V4_PROPERTY", property_id);
      }
      return { property_id, type, cardinality };
    });
    return { boolean_input: mapping.input, candidate_rule_id: mapping.rule_id, property_refs,
      id_and_type_check: "present", semantic_equivalence: "unverified" };
  });
  if (rules.filter(row => row.rule_id === "AUTH-CB-RULE-ADMISSIBLE").length !== 1) fail("AUTH_V4_RULES", "admissible rule absent");

  const decoded = decodeNodeLogicModule(module.value);
  if (!decoded.ok) fail("AUTH_V4_SFOL_DECODE", JSON.stringify(decoded.diagnostics));
  const typedResult = typecheckLogicModule(decoded.value);
  if (!typedResult.ok) fail("AUTH_V4_SFOL_TYPE", JSON.stringify(typedResult.diagnostics));
  const typed = typedResult.value;
  const clauses = typed.source.clauses;
  if (clauses.length !== 1 || clauses[0]?.clause_id !== CLAUSE_ID || clauses[0].kind !== "predicate" ||
      clauses[0].status !== "admitted" || clauses[0].inputs.length !== 3 ||
      !same(clauses[0].inputs.map(row => row.name), INPUTS) ||
      clauses[0].inputs.some(row => row.sort.tag !== "primitive" || row.sort.name !== "boolean") ||
      clauses[0].result_sort.tag !== "primitive" || clauses[0].result_sort.name !== "boolean" ||
      clauses[0].expression.tag !== "boolean" || clauses[0].expression.operator !== "and" ||
      !same(clauses[0].expression.operands.map(row => row.tag === "variable" ? row.name : null), INPUTS)) {
    fail("AUTH_V4_CLAUSE", "expected exactly one admitted typed three-Boolean AND clause");
  }
  const clause = clauses[0];
  const moduleDigest = digestSfolValue(typed.source);
  const clauseDigest = digestSfolValue(clause);
  const proofContext = object(manifest.value.proof_context, "manifest/proof_context");
  if (proofContext.profile_id !== "domainspec-sfol" || proofContext.profile_version !== "domainspec-sfol/v1") {
    fail("AUTH_V4_PROFILE", "smt-sfol or other profile cannot substitute for Auth finite Boolean SFOL");
  }
  const admittedClauses = array(manifest.value.clauses, "manifest/clauses").map((row, index) => object(row, `manifest/clauses/${index}`));
  if (admittedClauses.length !== 1 || admittedClauses[0]!.clause_id !== CLAUSE_ID ||
      admittedClauses[0]!.clause_digest !== clauseDigest || admittedClauses[0]!.module_digest !== moduleDigest ||
      admittedClauses[0]!.node_digest !== module.ref.sha256 || admittedClauses[0]!.status !== "admitted" ||
      !same(object(admittedClauses[0]!.proof_context, "manifest/clauses/0/proof_context"),
        Object.fromEntries(["graph_digest", "manifest_digest", "build_digest", "source_set_digest",
          "profile_id", "profile_version", "profile_digest"].map(key => [key, proofContext[key]]))) ||
      !same(manifest.value.clause_membership, [CLAUSE_ID])) {
    fail("AUTH_V4_MANIFEST", "admitted clause manifest differs from selected SFOL source");
  }
  const denominator = buildClauseDenominator(manifest.value);
  const partitioned = derivePureFixtures({ typed, typed_module_digest: moduleDigest,
    typed_clause_digests: { [CLAUSE_ID]: clauseDigest }, denominator,
    ruleset: { ...EXHAUSTIVE_FINITE_RULESET, max_cases: 8 } });
  if (!partitioned.ok) fail("AUTH_V4_TDE_PARTITION", JSON.stringify(partitioned.diagnostics));
  const derived = derivePureCases({ typed, typed_module_digest: moduleDigest,
    typed_clause_digests: { [CLAUSE_ID]: clauseDigest }, denominator, fixtures: partitioned.value });
  if (!derived.ok) fail("AUTH_V4_TDE_CASES", JSON.stringify(derived.diagnostics));
  if (caseSet.value.schema_version !== "auth-foundation.tde-sfol-cases/v2" ||
      !same(caseSet.value.ruleset, { ...EXHAUSTIVE_FINITE_RULESET, max_cases: 8, digest: partitioned.ruleset_digest }) ||
      caseSet.value.domain_digest !== partitioned.domain_digest ||
      caseSet.value.denominator_digest !== denominator.digest ||
      !same(caseSet.value.cases, derived.value)) {
    fail("AUTH_V4_TDE_DRIFT", "selected TDE case IDs, digests or oracle values differ from current derivation");
  }
  const trueDigest = digestSfolValue({ tag: "boolean", value: true });
  const falseDigest = digestSfolValue({ tag: "boolean", value: false });
  if (derived.value.length !== 8 || new Set(derived.value.map(row => row.case_id)).size !== 8 ||
      new Set(derived.value.map(row => row.case_digest)).size !== 8) fail("AUTH_V4_TDE_DOMAIN", "eight unique cases required");
  const valuations = derived.value.map(row => {
    const flags = INPUTS.map(name => row.inputs[name]);
    if (flags.some(value => value?.tag !== "boolean")) fail("AUTH_V4_TDE_DOMAIN", `non-Boolean input in ${row.case_id}`);
    const bits = flags.map(value => value?.tag === "boolean" ? Number(value.value) : -1).join("");
    const expected = bits === "111" ? trueDigest : falseDigest;
    if (row.expected_digest !== expected) fail("AUTH_V4_TDE_ORACLE", row.case_id);
    return { case_id: row.case_id, case_digest: row.case_digest, fixture_digest: row.fixture_digest,
      valuation: bits, expected_boolean: bits === "111", expected_digest: row.expected_digest };
  });
  if (!same([...new Set(valuations.map(row => row.valuation))].sort(), ["000", "001", "010", "011", "100", "101", "110", "111"]) ||
      valuations.filter(row => row.expected_boolean).length !== 1) fail("AUTH_V4_TDE_DOMAIN", "full finite valuation domain required");
  const currentBuild = sources.has(AUTH_SFOL_V4_SOURCE_PATHS.current_build)
    ? bytesFor(AUTH_SFOL_V4_SOURCE_PATHS.current_build, sources) : null;
  assertCurrentSources(sources, before);
  const selectedSourceRefs = [product.ref, definitions.ref, capability.ref, ontology.ref, sfol.ref,
    claim.ref, module.ref, manifest.ref, caseSet.ref, ...(currentBuild ? [currentBuild.ref] : [])]
    .sort((left, right) => left.path.localeCompare(right.path));
  const body = {
    schema_version: "auth-foundation.sfol-domainspec-v4-correspondence/v1-candidate" as const,
    subject_operation: claim.value.subject_operation, auth_formal_claim_id: claim.value.formal_claim_id,
    auth_product_meaning_status: "admitted-exact-by-owner-decision" as const,
    auth_sfol_status: "admitted-exact-by-separate-owner-decision" as const,
    source_refs: selectedSourceRefs, clause_id: CLAUSE_ID, clause_digest: clauseDigest,
    typed_module_digest: moduleDigest, auth_profile: { id: "domainspec-sfol", version: "domainspec-sfol/v1" },
    predicate: { operator: "and" as const, inputs: [...INPUTS], output_sort: "boolean" as const },
    candidate_correspondences: candidates, semantic_equivalence: "unverified" as const,
    tde_case_set_ref: caseSet.ref, tde_case_count: valuations.length, valuations,
    abstract_result_map: { true: "READY", false: "DENY", preservation_status: "unverified" as const },
    losses: [
      "Boolean flags do not preserve multiplicity of authentication or route-binding resolver lists",
      "Boolean flags omit concrete request, session, route, permission and scope-evidence identities",
      "Boolean flags omit exact trusted provenance and command construction witnesses",
      "The eight abstract valuations are not shown reachable from concrete command-boundary contexts",
      "Boolean result to READY/DENY preservation is not established by this correspondence",
    ],
    proof_context: { source_manifest_selection: "missing" as const,
      historical_build_sha256: proofContext.build_digest,
      current_build_sha256: currentBuild?.ref.sha256 ?? null,
      build_currentness: currentBuild && currentBuild.ref.sha256 === proofContext.build_digest ? "matching" as const : "drift-or-missing" as const },
    missing_v4_gates: [
      "accepted DomainSpec BusinessMeaning v2 for this Auth subject",
      "subject-bound v4 acceptance and definition graph",
      "v4 formal profile and claim identity selection",
      "checked projection and bidirectional preservation of concrete Auth semantics",
      "current source manifest and build proof context",
      "TDE-neutral set derivation and executable oracle under accepted v4 meaning",
    ],
    status: "blocked-for-v4-admission" as const, neutral_set_eligible: false as const,
    v4_formal_claim_emitted: false as const, tde_payload_emitted: false as const,
    evf_pass_emitted: false as const, authority_effect: "none" as const,
    claim_ceiling: "Exact Auth-level source/case correspondence and explicit abstraction losses only; no DomainSpec v4 admission or neutral TDE evidence",
  };
  return { ...body, report_sha256: sha(canonicalSfolJson(body)) };
}

export function assertAuthSfolV4CorrespondenceCurrent(sources: ReadonlyMap<string, Buffer>, candidate: unknown): void {
  if (!same(candidate, buildAuthSfolV4Correspondence(sources))) {
    fail("AUTH_V4_REPORT_STALE", "correspondence differs from exact selected sources or current rules");
  }
}
