import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync, statSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import test from "node:test";

import {
  observeOperationBoundary,
  type OperationBoundaryObserverInput,
} from "../../adapters/typescript/operation-boundary-observer.ts";

const REPO_ROOT = resolve(process.cwd(), "../../..");
const FIXTURE_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/fixtures/operation-profile/poker-team.fixture.json";
const HOSTILES_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/fixtures/operation-profile/hostiles.json";
const PROFILE_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/profiles/typescript-operation-application-profile.json";
const APPLICABILITY_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/fixtures/operation-profile/applicability.json";

const FIXTURE_SHA256 =
  "29125586b2bf8cdb5823e6814bcb48162a5b04841b6dcc9b0799a7a2721b81c8";
const HOSTILES_SHA256 =
  "cf3c02e6d5839568fd77b8dac6ab5e2c720d227f5b8162e93d21790f16d5f090";

function bytes(ref: string): Buffer {
  return readFileSync(resolve(REPO_ROOT, ref));
}

function sha(ref: string): string {
  return createHash("sha256").update(bytes(ref)).digest("hex");
}

function json(ref: string): Record<string, unknown> {
  return JSON.parse(bytes(ref).toString("utf8")) as Record<string, unknown>;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function canonicalSha(value: unknown): string {
  return createHash("sha256").update(canonical(value), "utf8").digest("hex");
}

function exactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): void {
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort());
}

function assertSafeRegularRepoFile(ref: string): void {
  assert.equal(ref.includes("\\"), false);
  const lexical = resolve(REPO_ROOT, ref);
  const lexicalRelative = relative(REPO_ROOT, lexical);
  assert.notEqual(lexicalRelative, "");
  assert.equal(
    lexicalRelative === ".." ||
      lexicalRelative.startsWith(`..${sep}`) ||
      lexicalRelative.startsWith(sep),
    false,
  );
  assert.equal(lstatSync(lexical).isSymbolicLink(), false);
  assert.equal(statSync(lexical).isFile(), true);
  const physicalRelative = relative(realpathSync(REPO_ROOT), realpathSync(lexical));
  assert.equal(
    physicalRelative === ".." || physicalRelative.startsWith(`..${sep}`),
    false,
  );
}

function deepFreeze(value: unknown): unknown {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}

test("binds the selected Operation core, composition, instrumentation, and UnitOfWork sources", () => {
  const fixture = json(FIXTURE_REF);
  exactKeys(fixture, [
    "schema_version",
    "fixture_id",
    "profile_id",
    "subject_meta_type_id",
    "evidence_lane",
    "context_binding",
    "selected_sources",
    "integration_evidence",
    "evaluation_evidence",
    "positive_cases",
    "raw_secret_material_included",
    "raw_domain_payload_included",
    "expectations_immutable_during_evaluation",
    "portable_semantics_claimed",
    "runtime_guarantee_claimed_from_structure",
    "authority_effect",
  ]);
  assert.equal(fixture.schema_version, "ape.operation-profile-fixture/v1");
  assert.equal(fixture.subject_meta_type_id, "Operation");
  assert.equal(fixture.evidence_lane, "candidate-local-prototype");

  const sources = fixture.selected_sources as Array<Record<string, unknown>>;
  assert.deepEqual(
    sources.map((source) => source.path),
    [
      "validation/poker-team/backend/src/use-cases/player/create-player.ts",
      "validation/poker-team/backend/src/infrastructure/http/routes/player.routes.ts",
      "validation/poker-team/backend/src/infrastructure/telemetry/create-player.instrumentation.ts",
      "validation/poker-team/backend/src/domain/shared/financial-write-unit-of-work.ts",
    ],
  );
  for (const source of sources) {
    const ref = source.path as string;
    assertSafeRegularRepoFile(ref);
    assert.equal(sha(ref), source.sha256, ref);
    assert.equal(statSync(resolve(REPO_ROOT, ref)).size, source.size, ref);
  }
});

test("the live Operation boundary observes the narrow outer instrumentation wrapper", () => {
  const fixture = json(FIXTURE_REF);
  const profile = json(PROFILE_REF);
  const source = (fixture.selected_sources as Array<Record<string, unknown>>)[0];
  const rmt = profile.rmt_semantic_policy as Record<string, string>;
  const result = observeOperationBoundary({
    source: {
      repoRoot: REPO_ROOT,
      sourceRef: source.path as string,
      sourceDigest: source.sha256 as string,
    },
    rmtContract: {
      sourceRef: rmt.operation_contract_ref,
      sourceDigest: rmt.operation_contract_sha256,
    },
    implementationBindingId: "APE.ImplementationBinding.operation.create-player",
    subjectId: "PokerTeam.CreatePlayer",
    outcomeId: "CreatePlayer",
    nodes: [
      {
        nodeId: "decide-limit",
        phase: "decide",
        owner: "rule",
        sourceSelector: "isAllowedLimit(input.currentLimit)",
        dependsOn: [],
        evidenceKind: "static",
      },
      {
        nodeId: "persist-player",
        phase: "acquire",
        owner: "repository",
        sourceSelector: "playerRepo.create(createInput)",
        dependsOn: ["decide-limit"],
        evidenceKind: "static",
      },
      {
        nodeId: "notify-player-created",
        phase: "in-process-notification",
        owner: "event-handler",
        sourceSelector: "await onEvent({",
        dependsOn: ["persist-player"],
        evidenceKind: "static",
      },
      {
        nodeId: "observe-create-player",
        phase: "instrumentation",
        owner: "outer-wrapper",
        sourceSelector: "observeCreatePlayerUseCase",
        dependsOn: ["notify-player-created"],
        evidenceKind: "static",
      },
    ],
    pureRuleReferences: [
      {
        ruleId: "Rule.AllowedLimit",
        sourceSelector: "isAllowedLimit(input.currentLimit)",
        rmtRelationRef: `${rmt.operation_contract_ref}#rule-relationship`,
      },
    ],
    forbiddenConcreteImportPatterns: [
      "(?:^|/)infrastructure(?:/|$)",
      "telemetry|metric|instrument",
    ],
  } satisfies OperationBoundaryObserverInput);
  assert.equal(result.result, "pass");
  assert.equal(result.diagnostic, "AOP_BOUNDARY_PASS");
  assert.equal(result.graph.at(-1)?.owner, "outer-wrapper");
});

test("binds exact immutable property-result envelopes for the Poker evaluation", () => {
  const fixture = json(FIXTURE_REF);
  const envelopes = fixture.evaluation_evidence as Array<Record<string, unknown>>;
  assert.equal(envelopes.length, 11);
  assert.equal(new Set(envelopes.map((entry) => entry.envelope_id)).size, 11);
  assert.equal(new Set(envelopes.map((entry) => entry.envelope_ref)).size, 11);
  const base = envelopes.slice(0, 10);
  assert.equal(new Set(base.map((entry) => entry.property_id)).size, 10);
  assert.deepEqual(
    base.reduce<Record<string, number>>((counts, entry) => {
      const result = entry.result as string;
      counts[result] = (counts[result] ?? 0) + 1;
      return counts;
    }, {}),
    { "owner-blocked": 3, pass: 7 },
  );
  for (const [index, envelope] of envelopes.entries()) {
    exactKeys(envelope, [
      "schema_version",
      "envelope_id",
      "envelope_ref",
      "subject_id",
      "property_id",
      "producer_id",
      "result",
      "diagnostic",
      "owner_route",
      "expected_value_sha256",
      "observed_value_sha256",
      "raw_evidence_sha256",
      "joins_sha256",
      "producer_output_sha256",
      "authority_effect",
      "envelope_sha256",
    ]);
    assert.equal(envelope.schema_version, "ape.operation-property-result-envelope/v1");
    assert.equal(envelope.subject_id, "PokerTeam.CreatePlayer");
    assert.equal(
      envelope.envelope_ref,
      `${FIXTURE_REF}#/evaluation_evidence/${index}`,
    );
    assert.equal(envelope.authority_effect, "none");
    const { envelope_sha256: envelopeSha, ...body } = envelope;
    assert.equal(canonicalSha(body), envelopeSha);
  }
  const byProperty = new Map(base.map((entry) => [entry.property_id, entry]));
  assert.deepEqual(
    ["hof-direction", "role-contract-specificity", "repository-boundary"].map(
      (suffix) => [
        byProperty.get(`APE.ImplementationProperty.operation.${suffix}`)!.result,
        byProperty.get(`APE.ImplementationProperty.operation.${suffix}`)!.diagnostic,
      ],
    ),
    [
      ["pass", "AOP_DEPENDENCY_PASS"],
      ["pass", "AOP_DEPENDENCY_PASS"],
      ["pass", "AOP_DEPENDENCY_PASS"],
    ],
  );
  assert.deepEqual(
    [
      byProperty.get("APE.ImplementationProperty.operation.cost-observation")!.result,
      byProperty.get("APE.ImplementationProperty.operation.instrumentation-placement")!.result,
    ],
    ["owner-blocked", "pass"],
  );
});

test("locks the Context Builder and planned-witness inputs", () => {
  const binding = json(FIXTURE_REF).context_binding as Record<string, string>;
  for (const [refKey, shaKey] of [
    ["context_index_ref", "context_index_sha256"],
    ["planned_witnesses_ref", "planned_witnesses_sha256"],
  ]) {
    const ref = binding[refKey];
    assertSafeRegularRepoFile(ref);
    assert.equal(sha(ref), binding[shaKey]);
  }
});

test("binds candidate integration evidence without granting admission", () => {
  const integration = json(FIXTURE_REF).integration_evidence as Record<
    string,
    Record<string, unknown>
  >;
  exactKeys(integration, [
    "repository_observation",
    "persistence_candidate_record",
  ]);
  const observation = integration.repository_observation;
  const record = integration.persistence_candidate_record;
  const { observation_sha256: observationSha, ...observationBody } = observation;
  const { record_sha256: recordSha, ...recordBody } = record;
  assert.equal(canonicalSha(observationBody), observationSha);
  assert.equal(canonicalSha(recordBody), recordSha);
  assert.equal(record.payload_sha256, observationSha);
  assert.equal(record.evidence_lane, "candidate-local-fixture");
  assert.equal(record.status, "candidate");
  assert.equal(record.authority_effect, "none");
  assert.match(record.ceiling as string, /no system-integration admission/);
});

test("contains the exact positive witness classes without runtime or semantic overclaim", () => {
  const fixture = json(FIXTURE_REF);
  const positives = fixture.positive_cases as Array<Record<string, unknown>>;
  assert.deepEqual(
    positives.map((entry) => entry.case_id),
    [
      "AOP-POS-HOF-REPOSITORY",
      "AOP-POS-DIRECT-PURE-RULES",
      "AOP-POS-EVENT-HANDLER",
      "AOP-POS-UOW-STRUCTURE",
      "AOP-POS-EXPLICIT-LOOP-POLICY",
    ],
  );
  assert.equal(
    positives.find((entry) => entry.case_id === "AOP-POS-UOW-STRUCTURE")!
      .expected_status,
    "owner-blocked",
  );
  const loop = positives.find(
    (entry) => entry.case_id === "AOP-POS-EXPLICIT-LOOP-POLICY",
  )!;
  const dependency = positives.find(
    (entry) => entry.case_id === "AOP-POS-HOF-REPOSITORY",
  )!;
  assert.equal(dependency.expected_status, "pass");
  assert.deepEqual(dependency.expected_diagnostics, [
    "AOP_DEPENDENCY_PASS",
  ]);
  assert.equal(
    (dependency.normalized_facts as Record<string, unknown>)
      .composition_root_supplies_adapters,
    true,
  );
  assert.equal(loop.source_id, null);
  assert.equal(
    (loop.normalized_facts as Record<string, unknown>).mandatory_reduce,
    false,
  );
  assert.equal(fixture.portable_semantics_claimed, false);
  assert.equal(fixture.runtime_guarantee_claimed_from_structure, false);
  assert.equal(fixture.authority_effect, "none");
});

test("freezes the authoritative one-primary-cause hostile catalogue", () => {
  const catalogue = json(HOSTILES_REF);
  exactKeys(catalogue, [
    "schema_version",
    "catalogue_id",
    "profile_id",
    "fixture_id",
    "subject_meta_type_id",
    "hostiles",
    "expected_hostile_count",
    "one_primary_cause_per_hostile",
    "expectations_immutable_during_evaluation",
    "authority_effect",
  ]);
  const hostiles = catalogue.hostiles as Array<Record<string, unknown>>;
  const expected = [
    ["AOP-H01-CONCRETE-PROVIDER-INWARD", "AOP_DEPENDENCY_CONCRETE_PROVIDER_IMPORT"],
    ["AOP-H02-GENERIC-PORT", "AOP_DEPENDENCY_GENERIC_CONTRACT"],
    ["AOP-H03-OPTIONAL-UNIT-OF-WORK", "AOP_TRANSACTION_OPTIONAL_BYPASS"],
    ["AOP-H04-PUBLISH-NAME-DELIVERY", "AOP_EVENT_STAGE_INFERENCE"],
    ["AOP-H05-REPOSITORY-NPLUS1-PROOF", "AOP_COST_REPOSITORY_NON_INFERENCE"],
    ["AOP-H06-MANDATORY-REDUCE", "AOP_COST_SYNTAX_SHORTCUT"],
    ["AOP-H07-DYNAMIC-FALSE-PASS", "AOP_DEPENDENCY_DYNAMIC_UNSUPPORTED"],
    ["AOP-H08-DUPLICATE-PERSISTENCE-JOIN", "AOP_PERSISTENCE_DUPLICATE_JOIN"],
    ["AOP-H09-CROSS-CONCERN-JOIN", "AOP_PERSISTENCE_CROSS_INFERENCE"],
    ["AOP-H10-TELEMETRY-CORRECTNESS", "AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT"],
    ["AOP-H11-STRUCTURE-PROVES-COMMIT", "AOP_TRANSACTION_RUNTIME_EVIDENCE_REQUIRED"],
  ];
  assert.deepEqual(
    hostiles.map((entry) => [entry.hostile_id, entry.expected_diagnostic]),
    expected,
  );
  assert.equal(catalogue.expected_hostile_count, expected.length);
  assert.equal(catalogue.one_primary_cause_per_hostile, true);
  assert.equal(new Set(hostiles.map((entry) => entry.hostile_id)).size, hostiles.length);
  assert.equal(new Set(hostiles.map((entry) => entry.mutation_kind)).size, hostiles.length);
  for (const hostile of hostiles) {
    assert.equal(typeof hostile.primary_cause, "string");
    assert.ok((hostile.primary_cause as string).length > 0);
    assert.equal(hostile.expectation_locked, true);
  }
});

test("every fixture property belongs to the exact profile denominator", () => {
  const profile = json(PROFILE_REF);
  const denominator = new Set(
    (profile.property_denominator as Record<string, unknown>)
      .ordered_property_ids as string[],
  );
  const fixture = json(FIXTURE_REF);
  const hostiles = json(HOSTILES_REF).hostiles as Array<Record<string, unknown>>;
  for (const positive of fixture.positive_cases as Array<Record<string, unknown>>) {
    for (const propertyId of positive.property_ids as string[]) {
      assert.equal(denominator.has(propertyId), true, propertyId);
    }
  }
  for (const hostile of hostiles) {
    assert.equal(denominator.has(hostile.property_id as string), true);
  }
  const applicability = json(APPLICABILITY_REF);
  for (const applicabilityCase of applicability.cases as Array<Record<string, unknown>>) {
    const rows = applicabilityCase.applicability_results as Array<Record<string, unknown>>;
    assert.equal(rows.length, denominator.size);
    assert.deepEqual(new Set(rows.map((row) => row.property_id)), denominator);
  }
});

test("contains no Workflow result, raw secret, raw domain payload, or authority claim", () => {
  const fixture = json(FIXTURE_REF);
  const catalogue = json(HOSTILES_REF);
  assert.equal(fixture.raw_secret_material_included, false);
  assert.equal(fixture.raw_domain_payload_included, false);
  assert.equal(fixture.authority_effect, "none");
  assert.equal(catalogue.authority_effect, "none");
  assert.equal(JSON.stringify([fixture, catalogue]).includes('"subject_meta_type_id":"Workflow"'), false);
  const prohibitedKeys = new Set([
    "password",
    "access_token",
    "refresh_token",
    "private_key",
    "provider_payload",
    "domain_payload",
    "profile_admission",
    "promotion_record",
  ]);
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (value === null || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      assert.equal(prohibitedKeys.has(key), false, key);
      visit(child);
    }
  };
  visit(fixture);
  visit(catalogue);
});

test("fixture expectations are byte-locked and immutable during evaluation", () => {
  assert.equal(sha(FIXTURE_REF), FIXTURE_SHA256);
  assert.equal(sha(HOSTILES_REF), HOSTILES_SHA256);
  const frozen = deepFreeze(json(HOSTILES_REF)) as Record<string, unknown>;
  const first = (frozen.hostiles as Array<Record<string, unknown>>)[0];
  try {
    first.expected_diagnostic = "rewritten-after-execution";
  } catch (error) {
    assert.equal(error instanceof TypeError, true);
  }
  assert.equal(
    first.expected_diagnostic,
    "AOP_DEPENDENCY_CONCRETE_PROVIDER_IMPORT",
  );
  assert.equal(sha(FIXTURE_REF), FIXTURE_SHA256);
  assert.equal(sha(HOSTILES_REF), HOSTILES_SHA256);
});
