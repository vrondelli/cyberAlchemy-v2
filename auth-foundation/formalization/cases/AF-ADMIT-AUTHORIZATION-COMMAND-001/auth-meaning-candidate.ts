import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { AUTH_SFOL_V4_SOURCE_PATHS, buildAuthSfolV4Correspondence } from "./domainspec-v4-correspondence.js";

type Obj = Record<string, any>;
const root = fileURLToPath(new URL("../../../", import.meta.url));
const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const fail = (reason: string): never => { throw new Error(`AUTH_MEANING_CANDIDATE:${reason}`); };
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const meaningPath = "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/BUSINESS-MEANING.v1-candidate.json";
const nodeDir = "implementation/command-boundary-source/specs/auth-command-boundary/nodes/";
const nodes = Object.freeze({
  context: ["command-boundary-context.json", "f59e12aad5efa12375cca82f56b36d73e532fb8795c7a7d4ad7e9a9ef2c9df34"],
  decision: ["command-boundary-decision.json", "ab768996fe16624e2a949b51099cd2e1b7081c994f524914d101545b7f7ff0f1"],
  auth: ["unique-trusted-authentication-evidence.json", "eada37d662b8d31737c2c00d118f629a03e250a1742bb137231bd7996e1e6608"],
  route: ["unique-complete-route-binding.json", "d6a56c77c2c00937ee6526cfe423b37fc31b4a9940795c840e276cd6b3e322b4"],
  provenance: ["candidate-command-provenance.json", "85efffc3db8d504d0433a94ba981e4a03a20738dd7fc8c152920e45ac5f5c88e"],
  aggregate: ["command-boundary-admissible.json", "91899b41f928554b796ce4446d06e7ed1836fcbcf20deac814430010a9a320ed"],
  operation: ["admit-authorization-command.json", "fbace90ffca46b51fd286d3bf733b39b803f739c69bf5d2c9a1a1daeb5df9ac1"],
} as const);
const names = ["auth", "route", "provenance"] as const;
const expectedRule = "For a representable CommandBoundaryContext evaluated normally, the boundary returns READY if and only if exactly one qualifying trusted authentication row and exactly one qualifying complete route-binding row match the request, and every candidate-command value has exact provenance from the inbound request or those same unique qualifying rows. Every other normally evaluated in-scope context returns DENY without a downstream call.";
const expectedCeiling = "Owner-reviewable draft of one command-boundary decision meaning only. Auth-local admission does not accept this DomainSpec BusinessMeaning; no v2 predecessor, v4 FormalClaim, neutral TDE set, provider observation, F5 satisfaction or runtime_guarantees_observed follows.";
const expectedCounterexample = {
  case_id: "AUTH-CB-NONQUALIFYING-PROVENANCE-REJECT",
  given: "One qualifying trusted authentication row has session S1; another matching trusted row has an empty session and is not qualifying.",
  when: "The candidate command uses the empty session from the nonqualifying row while the unique qualifying row remains S1.",
  then: "A READY decision contradicts this draft meaning.",
  why: "Command provenance must use the same unique qualifying row, not a separate row satisfying a weaker existence check.",
};

function selected(path: string, sources: ReadonlyMap<string, Buffer>, pin?: string) {
  if (isAbsolute(path) || path.includes("\\") || path.split("/").some(part => !part || part === "." || part === "..")) fail("path-scope");
  const bytes = sources.get(path);
  if (!bytes || !Buffer.isBuffer(bytes) || bytes.length < 1 || bytes.length > 2 * 1024 * 1024) fail(`missing:${path}`);
  const present = bytes as Buffer;
  const absoluteRoot = realpathSync(root);
  let target = absoluteRoot;
  for (const part of path.split("/")) {
    target = join(target, part);
    if (lstatSync(target).isSymbolicLink()) fail(`symlink:${path}`);
  }
  const rel = relative(absoluteRoot, target);
  if (rel === ".." || rel.startsWith("../") || realpathSync(target) !== target) fail(`path-scope:${path}`);
  const before = statSync(target);
  const disk = readFileSync(target);
  const after = statSync(target);
  if (!before.isFile() || before.ino !== after.ino || before.dev !== after.dev || before.mtimeMs !== after.mtimeMs || !disk.equals(present)) fail(`source-drift:${path}`);
  const digest = sha(present);
  if (pin && digest !== pin) fail(`source-pin:${path}`);
  let value: Obj;
  try { value = JSON.parse(present.toString("utf8")) as Obj; }
  catch { return fail(`json:${path}`); }
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`shape:${path}`);
  return { value: value as Obj, ref: { path, sha256: digest, size_bytes: present.length, current: true as const } };
}

export const AUTH_MEANING_SOURCE_PATHS: Readonly<Record<string, string>> = Object.freeze({
  ...AUTH_SFOL_V4_SOURCE_PATHS,
  meaning: meaningPath,
  ...Object.fromEntries(Object.entries(nodes).map(([key, [name]]) => [key, `${nodeDir}${name}`])),
});

/** Semantic guard exposed for separating mutation tests; source-currentness is checked by the builder. */
export function validateAuthMeaningDraft(m: Obj): void {
  const keys = ["schema_version", "meaning_id", "version", "owner", "status", "supersedes", "domain_context", "rule", "applies_when", "actors", "inputs", "outcomes", "examples", "counterexamples", "boundaries", "acceptance", "claim_ceiling", "authority_effect"];
  if (!m || typeof m !== "object" || Array.isArray(m) || !equal(Object.keys(m).sort(), [...keys].sort())) fail("meaning-schema-keys");
  for (const key of ["domain_context", "claim_ceiling"]) if (typeof m[key] !== "string" || !m[key].trim()) fail(`meaning-schema:${key}`);
  for (const key of ["applies_when", "actors", "inputs", "outcomes", "boundaries"]) {
    const rows = m[key];
    if (!Array.isArray(rows) || !rows.every((row: unknown) => typeof row === "string" && Boolean(row.trim())) || new Set(rows).size !== rows.length) fail(`meaning-schema:${key}`);
  }
  for (const key of ["examples", "counterexamples"]) {
    const rows = m[key];
    if (!Array.isArray(rows) || rows.length < 1 || rows.some((row: unknown) => !row || typeof row !== "object" || Array.isArray(row) ||
        !equal(Object.keys(row).sort(), ["case_id", "given", "when", "then", "why"].sort()) ||
        Object.values(row).some(value => typeof value !== "string" || !value.trim()))) fail(`meaning-schema:${key}`);
  }
  if (m.schema_version !== "domainspec-v2.business-meaning/v1-candidate" || m.meaning_id !== "BusinessMeaning:auth-foundation.admit-authorization-command-boundary" || m.version !== "1-candidate" || m.owner !== "projects/auth-foundation/formalization" || m.status !== "draft" || m.supersedes !== null || m.rule !== expectedRule || m.claim_ceiling !== expectedCeiling || m.authority_effect !== "none" ||
      !equal(m.acceptance, { status: "not-requested", owner_ref: m.owner, acceptance_ref: null, acceptance_digest: null })) fail("meaning-subject-or-acceptance");
  if (!Array.isArray(m.examples) || !Array.isArray(m.counterexamples) || m.examples.length < 2 || m.counterexamples.length < 4 ||
      !equal(m.examples.map((row: Obj) => row.case_id), ["AUTH-CB-READY-111", "AUTH-CB-DENY-AMBIGUOUS-AUTH"]) ||
      !equal(m.counterexamples.map((row: Obj) => row.case_id), ["AUTH-CB-ALWAYS-READY-REJECT", "AUTH-CB-ALWAYS-DENY-REJECT", "AUTH-CB-DUPLICATE-COLLAPSE-REJECT", "AUTH-CB-NONQUALIFYING-PROVENANCE-REJECT"]) ||
      !equal(m.counterexamples[3], expectedCounterexample) ||
      !Array.isArray(m.boundaries) || !m.boundaries.some((s: string) => s.includes("downstream authorization")) ||
      !m.boundaries.some((s: string) => s.includes("exceptions, nontermination")) ||
      !m.boundaries.some((s: string) => s.includes("known counterexample"))) fail("meaning-scope");
}

/** Structural review independent of the production whole-file pins. */
export function validateAuthMeaningTypedNodes(rows: Record<keyof typeof nodes, Obj>): void {
  const bound = rows;
  const context = bound.context.body?.typed_contract;
  const decision = bound.decision.body?.typed_contract;
  if (context?.ontology_node !== "AUTH-CB-CONTEXT" || !equal(context.properties?.filter((p: Obj) => p.cardinality === "many").map((p: Obj) => p.name),
    ["resolved_authentication_evidence", "resolved_route_bindings"]) ||
    context.properties?.filter((p: Obj) => p.cardinality === "many").some((p: Obj) => p.type?.kind !== "list") ||
    decision?.ontology_node !== "AUTH-CB-DECISION" || !equal(decision.variants?.map((v: Obj) => v.name), ["Ready", "Deny"])) fail("typed-context-or-decision");
  const expectedSelectors = ["unique-trusted-authentication-evidence", "unique-complete-route-binding", "candidate-command-provenance"];
  const expectedRuleIds = ["AUTH-CB-RULE-UNIQUE-TRUSTED-AUTHENTICATION-EVIDENCE", "AUTH-CB-RULE-UNIQUE-COMPLETE-ROUTE-BINDING", "AUTH-CB-RULE-CANDIDATE-COMMAND-PROVENANCE"];
  for (const [index, name] of names.entries()) {
    const row = bound[name];
    if (row.kind !== "Rule" || row.node_id !== expectedSelectors[index] || row.body?.typed_contract?.ontology_rule !== expectedRuleIds[index] ||
        row.body?.typed_contract?.parameters?.[0]?.type?.selector !== "auth-command-boundary:command-boundary-context" ||
        !["exactly_one", "all"].includes(row.body?.typed_contract?.expression?.op)) fail(`typed-leaf:${name}`);
  }
  const aggregate = bound.aggregate.body?.typed_contract;
  if (aggregate?.ontology_rule !== "AUTH-CB-RULE-ADMISSIBLE" || aggregate.expression?.op !== "all" ||
      !equal(aggregate.expression?.terms?.map((term: Obj) => [term.op, term.selector]),
        expectedSelectors.map(selector => ["rule_ref", `auth-command-boundary:${selector}`]))) fail("typed-aggregate");
  const operation = bound.operation.body?.typed_contract;
  if (bound.operation.kind !== "Operation" || operation?.ontology_operation !== "AUTH-CB-OP-ADMIT-AUTHORIZATION-COMMAND" ||
      operation.guard !== "auth-command-boundary:command-boundary-admissible" || operation.output?.selector !== "auth-command-boundary:command-boundary-decision" ||
      operation.success_result?.variant !== "Ready" || operation.failure_result?.variant !== "Deny" ||
      !equal(operation.writes, []) || !equal(operation.effects, []) || operation.failure_continuation !== "return-deny-without-downstream-call") fail("typed-operation");
}

/** A current, non-admitted meaning trace. It does not turn Auth admission into DomainSpec acceptance. */
export function buildAuthMeaningCandidate(sources: ReadonlyMap<string, Buffer>) {
  const allowed: string[] = Object.values(AUTH_MEANING_SOURCE_PATHS);
  if (sources.size !== allowed.length || [...sources.keys()].some(path => !allowed.includes(path))) fail("source-domain");
  const authSources = new Map(Object.values(AUTH_SFOL_V4_SOURCE_PATHS).map(path => [path, sources.get(path)!]));
  const correspondence = buildAuthSfolV4Correspondence(authSources);
  if (correspondence.status !== "blocked-for-v4-admission" || correspondence.neutral_set_eligible !== false) fail("correspondence-ceiling");
  const meaning = selected(meaningPath, sources);
  const m = meaning.value;
  validateAuthMeaningDraft(m);
  const bound = Object.fromEntries(Object.entries(nodes).map(([key, [name, pin]]) =>
    [key, selected(`${nodeDir}${name}`, sources, pin)])) as Record<keyof typeof nodes, ReturnType<typeof selected>>;
  validateAuthMeaningTypedNodes(Object.fromEntries(Object.entries(bound).map(([name, row]) => [name, row.value])) as Record<keyof typeof nodes, Obj>);
  const expectedRuleIds = ["AUTH-CB-RULE-UNIQUE-TRUSTED-AUTHENTICATION-EVIDENCE", "AUTH-CB-RULE-UNIQUE-COMPLETE-ROUTE-BINDING", "AUTH-CB-RULE-CANDIDATE-COMMAND-PROVENANCE"];
  const operation = bound.operation.value.body?.typed_contract;
  const authQualified = bound.auth.value.body?.typed_contract?.expression?.where?.terms;
  const provenanceEvidence = bound.provenance.value.body?.typed_contract?.expression?.terms?.find((term: Obj) => term.op === "exists" && term.binding === "evidence")?.where?.terms;
  if (!Array.isArray(authQualified) || !Array.isArray(provenanceEvidence) ||
      !authQualified.some((term: Obj) => JSON.stringify(term).includes("AUTH-CB-AUTHENTICATED-SESSION-EVIDENCE#session_id") && JSON.stringify(term).includes('"value":""')) ||
      provenanceEvidence.some((term: Obj) => JSON.stringify(term).includes("AUTH-CB-AUTHENTICATED-SESSION-EVIDENCE#session_id") && JSON.stringify(term).includes('"value":""'))) fail("known-counterexample-shape-changed");
  return {
    schema_version: "auth-foundation.domainspec-meaning-source-trace/v1-candidate",
    meaning_ref: meaning.ref,
    source_refs: Object.fromEntries(Object.entries(bound).map(([name, row]) => [name, row.ref])),
    auth_correspondence_report_sha256: correspondence.report_sha256,
    auth_correspondence_source_refs: correspondence.source_refs,
    product_decision_ref: correspondence.source_refs.find(row => row.path === AUTH_SFOL_V4_SOURCE_PATHS.product_decision),
    sfol_decision_ref: correspondence.source_refs.find(row => row.path === AUTH_SFOL_V4_SOURCE_PATHS.sfol_decision),
    selected_rule_ids: expectedRuleIds,
    selected_operation_id: operation.ontology_operation,
    semantic_equivalence: "contradicted-by-current-typed-source",
    known_counterexample: "A unique qualifying authentication row has session S1; a second matching trusted row has an empty session and is nonqualifying. The typed provenance exists-clause may match the second row for a candidate with an empty session, so all typed Rules can be true while same-unique-row provenance is false.",
    domainspec_business_meaning_status: "draft-not-accepted",
    v2_meaning_emitted: false,
    v4_formal_claim_emitted: false,
    neutral_set_eligible: false,
    can_satisfy_obligation: false,
    authority_effect: "none",
  } as const;
}

export function currentAuthMeaningSources(): Map<string, Buffer> {
  return new Map(Object.values(AUTH_MEANING_SOURCE_PATHS).map(path => [path, readFileSync(join(root, path))]));
}
