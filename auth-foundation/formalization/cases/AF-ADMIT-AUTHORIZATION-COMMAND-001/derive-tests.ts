import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  bindingSelectorForCase,
  canonicalSfolJson,
  derivePureCases,
  digestSfolValue,
  toPureInvocation,
  type DerivedPureCase,
} from "../../../../domainspec-v2/impl/test-derivation-engine/src/sfol/cases/index.ts";
import {
  decodeLogicBindingRegistry,
  resolvePureBinding,
  SFOL_BINDING_SCHEMA_VERSION,
  type LogicBindingRegistry,
  type ResolvedPureBinding,
} from "../../../../domainspec-v2/impl/test-derivation-engine/src/sfol/bindings/index.ts";
import { buildClauseDenominator } from "../../../../domainspec-v2/impl/test-derivation-engine/src/sfol/denominator/index.ts";
import type { SemanticValue } from "../../../../domainspec-v2/impl/test-derivation-engine/src/sfol/evaluator/index.ts";
import { decodeNodeLogicModule } from "../../../../domainspec-v2/impl/test-derivation-engine/src/sfol/language/decoder.ts";
import { typecheckLogicModule, type TypedLogicModule } from "../../../../domainspec-v2/impl/test-derivation-engine/src/sfol/language/typecheck.ts";
import {
  derivePureFixtures,
  EXHAUSTIVE_FINITE_RULESET,
} from "../../../../domainspec-v2/impl/test-derivation-engine/src/sfol/partitions/index.ts";
import {
  deriveMutationAdequacy,
  SFOL_MUTATION_CATALOG_VERSION,
} from "../../../../domainspec-v2/impl/test-derivation-engine/src/sfol/mutations/index.ts";
import {
  buildPureProofReceipt,
  evaluatePureObservation,
  replayPureProofReceipt,
  type PureEvaluation,
  type PureProofReceipt,
} from "../../../../domainspec-v2/impl/test-derivation-engine/src/sfol/proof/index.ts";
import {
  runPureCase,
  type PureTargetHandle,
  type PureTargetResolver,
  type RawPureObservation,
} from "../../../../domainspec-v2/impl/test-derivation-engine/src/sfol/runners/pure/index.ts";

const root = dirname(fileURLToPath(import.meta.url));
const authRoot = resolve(root, "../../..");
const repositoryRoot = resolve(authRoot, "../..");
const modulePath = resolve(root, "SFOL-MODULE.v1.json");
const admissionManifestPath = resolve(root, "SFOL-CLAUSE-ADMISSION-MANIFEST.v1.json");
const preimageManifestPath = resolve(root, "W7-PREIMAGE-MANIFEST.v2.json");
const conformanceRoot = resolve(root, "../../../implementation/sfol-conformance");
const testPath = resolve(conformanceRoot, "tests/derived.rs");
const targetPath = resolve(root, "../../../implementation/command-boundary-runtime/src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs");
const runtimeCargoPath = resolve(conformanceRoot, "Cargo.toml");
const runtimeMainPath = resolve(conformanceRoot, "src/main.rs");
const check = process.argv.includes("--check");

const artifactPaths = {
  cases: resolve(root, "TDE-CASES.v2.json"),
  bindings: resolve(root, "TDE-BINDINGS.v2.json"),
  observations: resolve(root, "TDE-OBSERVATIONS.v2.json"),
  evaluations: resolve(root, "TDE-EVALUATIONS.v2.json"),
  proof: resolve(root, "TDE-PROOF-RECEIPT.v2.json"),
  mutations: resolve(root, "TDE-MUTATION-EVIDENCE.v2.json"),
  evidence: resolve(root, "TDE-EVIDENCE.v2.json"),
} as const;

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function json(path: string): any {
  return JSON.parse(readFileSync(path, "utf8"));
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function verifyPreimages(): void {
  const manifest = json(preimageManifestPath) as {
    immutable_predecessors: { path: string; sha256: string }[];
    selected_implementation_dependencies: { path: string; sha256: string }[];
  };
  for (const entry of [
    ...manifest.immutable_predecessors,
    ...manifest.selected_implementation_dependencies,
  ]) {
    const path = resolve(authRoot, entry.path);
    if (!existsSync(path) || sha256(readFileSync(path)) !== entry.sha256) {
      throw new Error(`TDE_SELECTED_PREIMAGE_DRIFT:${entry.path}`);
    }
  }
}

function requireBoolean(inputs: Readonly<Record<string, SemanticValue>>, name: string): boolean {
  const value = inputs[name];
  if (value?.tag !== "boolean") throw new Error(`TDE_BOOLEAN_INPUT_REQUIRED:${name}`);
  return value.value;
}

function caseBooleans(derived: DerivedPureCase) {
  return {
    auth: requireBoolean(derived.inputs, "unique_trusted_authentication_evidence"),
    route: requireBoolean(derived.inputs, "unique_complete_route_binding"),
    provenance: requireBoolean(derived.inputs, "candidate_command_provenance"),
  };
}

function renderTests(cases: readonly DerivedPureCase[]): string {
  const trueDigest = digestSfolValue({ tag: "boolean", value: true });
  const rendered = cases.map((derived) => {
    const values = caseBooleans(derived);
    const bits = `${Number(values.auth)}${Number(values.route)}${Number(values.provenance)}`;
    const expected = derived.expected_digest === trueDigest
      ? "CommandBoundaryDecision::Ready"
      : "CommandBoundaryDecision::Deny";
    const mutations = [
      values.auth ? "" : "context.resolved_authentication_evidence.push(context.resolved_authentication_evidence[0].clone());",
      values.route ? "" : "context.resolved_route_bindings.push(context.resolved_route_bindings[0].clone());",
      values.provenance ? "" : 'context.candidate_command.session_id = "wrong-session".to_owned();',
    ].filter(Boolean).join("\n    ");
    const binding = mutations.length === 0 ? "let context" : "let mut context";
    return `#[test]\nfn sfol_${bits}() {\n    ${binding} = base_context();\n    ${mutations}\n    assert_eq!(unique_trusted_authentication_evidence(&context), ${values.auth});\n    assert_eq!(unique_complete_route_binding(&context), ${values.route});\n    assert_eq!(candidate_command_provenance(&context), ${values.provenance});\n    assert_eq!(admit_authorization_command(&context), ${expected});\n}`;
  }).join("\n\n");
  return `// Generated from the admitted DS-SFOL clause through the finite partition engine.\n// Expected decisions come from SFOL evaluation. Do not edit by hand.\nuse auth_command_boundary_kernel::{\n    admit_authorization_command, candidate_command_provenance,\n    unique_complete_route_binding, unique_trusted_authentication_evidence,\n    AuthenticatedSessionEvidence, AuthorizationCommand, BoundaryRequest,\n    CommandBoundaryContext, CommandBoundaryDecision, Permission, RouteAuthorizationBinding,\n};\n\nfn permission() -> Permission {\n    Permission { resource: "document".to_owned(), action: "read".to_owned(), scope: "tenant-1".to_owned() }\n}\n\nfn base_context() -> CommandBoundaryContext {\n    CommandBoundaryContext {\n        request: BoundaryRequest { request_id: "request-1".to_owned(), authentication_evidence_ref: "auth-1".to_owned(), route_id: "route-1".to_owned() },\n        resolved_authentication_evidence: vec![AuthenticatedSessionEvidence { evidence_ref: "auth-1".to_owned(), session_id: "session-1".to_owned(), trusted: true }],\n        resolved_route_bindings: vec![RouteAuthorizationBinding { route_id: "route-1".to_owned(), required_permission: permission(), scope_evidence_ref: "scope-1".to_owned(), complete: true }],\n        candidate_command: AuthorizationCommand { request_id: "request-1".to_owned(), session_id: "session-1".to_owned(), required_permission: permission(), scope_evidence_ref: "scope-1".to_owned() },\n    }\n}\n\n${rendered}\n`;
}

function buildBindingRegistry(cases: readonly DerivedPureCase[], targetDigest: string, runtimeDigest: string): LogicBindingRegistry {
  const raw = {
    schema_version: SFOL_BINDING_SCHEMA_VERSION,
    registry_id: "auth.command-boundary.sfol-rust.v2",
    bindings: cases.map((derived) => ({
      binding_id: `auth.command-boundary.rust.${sha256(derived.case_id)}`,
      selector: bindingSelectorForCase(derived),
      target: {
        adapter_kind: "pure-function",
        module: "auth-foundation-sfol-conformance",
        symbol: "observe_ready",
        target_digest: targetDigest,
        runtime_digest: runtimeDigest,
      },
      argument_map: [
        { parameter: "unique_trusted_authentication_evidence", input_name: "unique_trusted_authentication_evidence" },
        { parameter: "unique_complete_route_binding", input_name: "unique_complete_route_binding" },
        { parameter: "candidate_command_provenance", input_name: "candidate_command_provenance" },
      ],
      observation_map: { kind: "return" },
    })),
  };
  const decoded = decodeLogicBindingRegistry(raw);
  if (!decoded.ok) throw new Error(JSON.stringify(decoded.diagnostics));
  return decoded.value;
}

function resolveBindings(cases: readonly DerivedPureCase[], registry: LogicBindingRegistry): readonly ResolvedPureBinding[] {
  return cases.map((derived) => {
    const result = resolvePureBinding({
      selector: bindingSelectorForCase(derived),
      adapter_kind: "pure-function",
    }, registry);
    if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
    return result.value;
  });
}

function rustTarget(targetDigest: string, runtimeDigest: string): PureTargetHandle {
  return {
    target_digest: targetDigest,
    runtime_digest: runtimeDigest,
    invoke: (...arguments_: SemanticValue[]) => {
      if (arguments_.length !== 3 || arguments_.some((value) => value.tag !== "boolean")) {
        throw new Error("Auth SFOL Rust target requires three Boolean arguments");
      }
      const output = execFileSync("cargo", [
        "run", "--quiet", "--",
        ...arguments_.map((value) => value.tag === "boolean" ? String(value.value) : "invalid"),
      ], { cwd: conformanceRoot, encoding: "utf8" }).trim();
      if (output !== "true" && output !== "false") throw new Error(`unexpected Rust observation ${output}`);
      return { tag: "boolean", value: output === "true" };
    },
  };
}

function toolDigest(): string {
  const paths = [
    "projects/domainspec-v2/impl/test-derivation-engine/src/sfol/partitions/index.ts",
    "projects/domainspec-v2/impl/test-derivation-engine/src/sfol/mutations/index.ts",
    "projects/domainspec-v2/impl/test-derivation-engine/src/sfol/cases/index.ts",
    "projects/domainspec-v2/impl/test-derivation-engine/src/sfol/bindings/index.ts",
    "projects/domainspec-v2/impl/test-derivation-engine/src/sfol/runners/pure/index.ts",
    "projects/domainspec-v2/impl/test-derivation-engine/src/sfol/proof/index.ts",
    "projects/auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/derive-tests.ts",
  ];
  return digestSfolValue(paths.map((path) => ({
    path,
    sha256: sha256(readFileSync(resolve(repositoryRoot, path))),
  })));
}

interface ProofRun {
  readonly observations: readonly RawPureObservation[];
  readonly evaluations: readonly PureEvaluation[];
  readonly proof: PureProofReceipt;
}

function executeProof(
  cases: readonly DerivedPureCase[],
  bindings: readonly ResolvedPureBinding[],
  target: PureTargetHandle,
  typed: TypedLogicModule,
  denominator: ReturnType<typeof buildClauseDenominator>,
  typedArtifactDigest: string,
  currentToolDigest: string,
): ProofRun {
  const resolver: PureTargetResolver = {
    resolve(module, symbol) {
      return module === "auth-foundation-sfol-conformance" && symbol === "observe_ready" ? target : null;
    },
  };
  const observations = cases.map((derived, index) =>
    runPureCase(toPureInvocation(derived), bindings[index]!, resolver));
  const evaluations = cases.map((derived, index) =>
    evaluatePureObservation(typed, derived, bindings[index]!, observations[index]!));
  if (evaluations.some(({ status }) => status !== "pass")) {
    throw new Error(`TDE_SFOL_EVALUATION_NONPASS:${JSON.stringify(evaluations)}`);
  }
  const caseIds = cases.map(({ case_id }) => case_id);
  const proof = buildPureProofReceipt({
    denominator,
    typed_artifact_digest: typedArtifactDigest,
    upstream_case_sets: {
      C_spec: caseIds,
      C_projected: caseIds,
      C_validated: caseIds,
      C_typed: caseIds,
    },
    cases,
    bindings,
    observations,
    evaluations,
    tool_digest: currentToolDigest,
  });
  if (!proof.ok) throw new Error(JSON.stringify(proof.diagnostics));
  return { observations, evaluations, proof: proof.value };
}

verifyPreimages();
const decoded = decodeNodeLogicModule(json(modulePath));
if (!decoded.ok) throw new Error(JSON.stringify(decoded.diagnostics));
const typedResult = typecheckLogicModule(decoded.value);
if (!typedResult.ok) throw new Error(JSON.stringify(typedResult.diagnostics));
const typed = typedResult.value;
const clause = typed.source.clauses.find((item) => item.clause_id === "AUTH-CB-SFOL-READY-IFF");
if (!clause) throw new Error("AUTH_CB_SFOL_CLAUSE_MISSING");

const moduleDigest = digestSfolValue(typed.source);
const clauseDigest = digestSfolValue(clause);
const typedArtifactDigest = digestSfolValue(typed);
const denominator = buildClauseDenominator(json(admissionManifestPath));
const partitioned = derivePureFixtures({
  typed,
  typed_module_digest: moduleDigest,
  typed_clause_digests: { [clause.clause_id]: clauseDigest },
  denominator,
  ruleset: { ...EXHAUSTIVE_FINITE_RULESET, max_cases: 8 },
});
if (!partitioned.ok) throw new Error(JSON.stringify(partitioned.diagnostics));
const derived = derivePureCases({
  typed,
  typed_module_digest: moduleDigest,
  typed_clause_digests: { [clause.clause_id]: clauseDigest },
  denominator,
  fixtures: partitioned.value,
});
if (!derived.ok) throw new Error(JSON.stringify(derived.diagnostics));
if (derived.value.length !== 8) throw new Error(`TDE_AUTH_EXACT_CASE_COUNT:${derived.value.length}`);
const mutation = deriveMutationAdequacy({
  typed,
  clause_id: clause.clause_id,
  fixtures: partitioned.value,
  catalog_version: SFOL_MUTATION_CATALOG_VERSION,
  evaluation_domain: {
    kind: "exhaustive-finite",
    domain_digest: partitioned.domain_digest,
  },
});
if (!mutation.ok) throw new Error(JSON.stringify(mutation.diagnostics));
const repeatedMutation = deriveMutationAdequacy({
  typed,
  clause_id: clause.clause_id,
  fixtures: partitioned.value,
  catalog_version: SFOL_MUTATION_CATALOG_VERSION,
  evaluation_domain: {
    kind: "exhaustive-finite",
    domain_digest: partitioned.domain_digest,
  },
});
if (!repeatedMutation.ok || canonicalSfolJson(mutation.value) !== canonicalSfolJson(repeatedMutation.value)) {
  throw new Error("TDE_MUTATION_NONDETERMINISTIC");
}
if (mutation.value.mutant_count !== 4 || mutation.value.killed_count !== 4) {
  throw new Error(`TDE_MUTATION_CLOSURE:${canonicalSfolJson(mutation.value)}`);
}

const generatedTest = execFileSync("rustfmt", ["--edition", "2024", "--emit", "stdout"], {
  input: renderTests(derived.value),
  encoding: "utf8",
});
const targetDigest = sha256(readFileSync(targetPath));
const runtimeDigest = digestSfolValue({
  cargo_toml_sha256: sha256(readFileSync(runtimeCargoPath)),
  main_rs_sha256: sha256(readFileSync(runtimeMainPath)),
});
const registry = buildBindingRegistry(derived.value, targetDigest, runtimeDigest);
const bindings = resolveBindings(derived.value, registry);
const target = rustTarget(targetDigest, runtimeDigest);
const currentToolDigest = toolDigest();
const first = executeProof(derived.value, bindings, target, typed, denominator, typedArtifactDigest, currentToolDigest);
const second = executeProof(derived.value, bindings, target, typed, denominator, typedArtifactDigest, currentToolDigest);
if (canonicalSfolJson(first) !== canonicalSfolJson(second)) throw new Error("TDE_TWO_RUN_NONDETERMINISTIC");

const caseIds = derived.value.map(({ case_id }) => case_id);
const proofInput = {
  denominator,
  typed_artifact_digest: typedArtifactDigest,
  upstream_case_sets: { C_spec: caseIds, C_projected: caseIds, C_validated: caseIds, C_typed: caseIds },
  cases: derived.value,
  bindings,
  observations: first.observations,
  evaluations: first.evaluations,
  tool_digest: currentToolDigest,
};
const replay = replayPureProofReceipt(first.proof, proofInput, {
  receipt_digest: first.proof.receipt_digest,
  denominator_digest: denominator.digest,
  typed_artifact_digest: typedArtifactDigest,
  tool_digest: currentToolDigest,
});
if (!replay.ok) throw new Error(JSON.stringify(replay.diagnostics));

const casesDocument = {
  schema_version: "auth-foundation.tde-sfol-cases/v2",
  ruleset: { ...EXHAUSTIVE_FINITE_RULESET, max_cases: 8, digest: partitioned.ruleset_digest },
  domain_digest: partitioned.domain_digest,
  denominator_digest: denominator.digest,
  cases: derived.value,
};
const bindingsDocument = {
  schema_version: "auth-foundation.tde-sfol-bindings/v2",
  registry,
  resolved_binding_keys: bindings.map(({ resolution_key }) => resolution_key),
};
const observationsDocument = {
  schema_version: "auth-foundation.tde-sfol-observations/v2",
  observations: first.observations,
};
const evaluationsDocument = {
  schema_version: "auth-foundation.tde-sfol-evaluations/v2",
  evaluations: first.evaluations,
};
const serialized = {
  cases: stableJson(casesDocument),
  bindings: stableJson(bindingsDocument),
  observations: stableJson(observationsDocument),
  evaluations: stableJson(evaluationsDocument),
  proof: stableJson(first.proof),
  mutations: stableJson(mutation.value),
};
const trueDigest = digestSfolValue({ tag: "boolean", value: true });
const falseDigest = digestSfolValue({ tag: "boolean", value: false });
const evidence = stableJson({
  schema_version: "auth-foundation.tde-sfol-evidence/v2",
  receipt_id: "AUTH-TDE-SFOL-COMMAND-BOUNDARY-TEST-CLOSURE-002",
  predecessor_receipt_id: "AUTH-TDE-SFOL-COMMAND-BOUNDARY-001",
  exact_sources: {
    admitted_module_sha256: sha256(readFileSync(modulePath)),
    typed_module_digest: moduleDigest,
    typed_artifact_digest: typedArtifactDigest,
    clause_id: clause.clause_id,
    clause_digest: clauseDigest,
    denominator_digest: denominator.digest,
    tool_digest: currentToolDigest,
    rust_target_digest: targetDigest,
    rust_runtime_digest: runtimeDigest,
  },
  closure: {
    valuation_count: derived.value.length,
    expected_ready: derived.value.filter(({ expected_digest }) => expected_digest === trueDigest).length,
    expected_deny: derived.value.filter(({ expected_digest }) => expected_digest === falseDigest).length,
    proof_receipt_digest: first.proof.receipt_digest,
    replay_digest: replay.value.replay_digest,
    stage_sets_equal: true,
    mutation_receipt_digest: mutation.value.receipt_digest,
    mutant_count: mutation.value.mutant_count,
    killed_mutant_count: mutation.value.killed_count,
    surviving_supported_mutant_count: mutation.value.surviving_supported_count,
  },
  artifacts: {
    cases_sha256: sha256(serialized.cases),
    bindings_sha256: sha256(serialized.bindings),
    observations_sha256: sha256(serialized.observations),
    evaluations_sha256: sha256(serialized.evaluations),
    proof_sha256: sha256(serialized.proof),
    mutations_sha256: sha256(serialized.mutations),
    generated_test_sha256: sha256(generatedTest),
  },
  determinism: { complete_runs: 2, byte_identical: true },
  result: "PASS",
  authority_effect: "none",
  external_effect: "none",
  claim_limit: "Bounded local SFOL-to-Rust test closure only; the Lean claim and historical v1 evidence remain unchanged, and production security is not established.",
});

function materialize(path: string, value: string): void {
  if (check) {
    if (!existsSync(path) || readFileSync(path, "utf8") !== value) throw new Error(`TDE_DERIVED_DRIFT:${path}`);
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
}

materialize(testPath, generatedTest);
materialize(artifactPaths.cases, serialized.cases);
materialize(artifactPaths.bindings, serialized.bindings);
materialize(artifactPaths.observations, serialized.observations);
materialize(artifactPaths.evaluations, serialized.evaluations);
materialize(artifactPaths.proof, serialized.proof);
materialize(artifactPaths.mutations, serialized.mutations);
materialize(artifactPaths.evidence, evidence);
process.stdout.write(`${JSON.stringify({
  result: "pass",
  cases: derived.value.length,
  proof_receipt_digest: first.proof.receipt_digest,
  evidence_sha256: sha256(evidence),
})}\n`);
