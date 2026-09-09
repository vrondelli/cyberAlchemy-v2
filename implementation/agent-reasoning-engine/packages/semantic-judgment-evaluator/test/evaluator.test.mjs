import assert from "node:assert/strict";
import test from "node:test";
import {
  EffectDispatcherTestDouble,
  MemoryRecordStore,
  OUTCOMES,
  OUTCOME_VALUES,
  evaluateSemanticJudgment,
  executeWitness,
  historicalReplay,
} from "../index.mjs";
import { buildRequest, readFixture } from "./fixture-builder.mjs";

const refundPath = new URL(
  "../../../fixtures/evaluator-v1/refund-eligibility.json",
  import.meta.url,
);
const releasePath = new URL(
  "../../../fixtures/evaluator-v1/release-readiness.json",
  import.meta.url,
);
const refund = await readFixture(refundPath);
const release = await readFixture(releasePath);

function semantic(source, options) {
  const telemetry = {};
  const request = buildRequest(source, options);
  return {
    request,
    result: evaluateSemanticJudgment(request, telemetry),
    telemetry,
  };
}

test("outcome algebra is frozen and contains exactly eight terminal outcomes", () => {
  assert.equal(Object.isFrozen(OUTCOME_VALUES), true);
  assert.deepEqual(OUTCOME_VALUES, [
    "InvalidInput",
    "UnauthorizedCatalog",
    "OutOfDomain",
    "Ineligible.Defeated",
    "Deferred.Insufficient",
    "EscalateOwner",
    "RecommendedUnderSnapshot",
    "Invalidated",
  ]);
});

test("supported cases from separately owned families use the same evaluator", () => {
  for (const source of [refund, release]) {
    const { result, telemetry } = semantic(source);
    assert.equal(result.outcome, OUTCOMES.RECOMMENDED);
    assert.equal(result.applicability_decision.status, "applicable");
    assert.equal(telemetry.evaluator_calls, 1);
  }
});

test("one-condition semantic counterfactuals produce the required algebra", () => {
  const cases = [
    {
      name: "missing required fact",
      expected: OUTCOMES.INSUFFICIENT,
      mutateRaw(raw) {
        raw.observations = raw.observations.filter(
          (item) => item.field !== "receipt_present",
        );
      },
    },
    {
      name: "grounded defeater",
      expected: OUTCOMES.DEFEATED,
      mutateRaw(raw) {
        raw.observations.find((item) => item.field === "fraud_hold").value =
          true;
      },
    },
    {
      name: "applicable exception",
      expected: OUTCOMES.DEFEATED,
      mutateRaw(raw) {
        raw.observations.find((item) => item.field === "final_sale").value =
          true;
      },
    },
    {
      name: "required challenge timeout at equality",
      expected: OUTCOMES.INSUFFICIENT,
      mutateRaw(raw) {
        const lane = raw.challenge_closure.required_lanes[0];
        lane.status = "open";
        lane.deadline_at = refund.as_of;
      },
    },
    {
      name: "no registered rule",
      expected: OUTCOMES.OUT_OF_DOMAIN,
      mutateRaw(raw) {
        raw.catalog.rules = [];
      },
    },
    {
      name: "sealed digest mutation",
      expected: OUTCOMES.INVALID_INPUT,
      mutateSealed(request) {
        request.catalog.rules[0].conclusion = "deny";
      },
    },
    {
      name: "catalog expiry at equality",
      expected: OUTCOMES.UNAUTHORIZED_CATALOG,
      mutateSealed(request) {
        request.as_of = refund.expires_at;
      },
    },
    {
      name: "catalog revocation",
      expected: OUTCOMES.UNAUTHORIZED_CATALOG,
      mutateRaw(raw) {
        raw.catalog.revoked_at = refund.as_of;
      },
    },
    {
      name: "authority cycle",
      expected: OUTCOMES.ESCALATE_OWNER,
      mutateRaw(raw) {
        raw.authority_snapshot.authority_edges.push({
          from: refund.author_owner_ref,
          to: "root-owner@local",
        });
      },
    },
    {
      name: "self judgment",
      expected: OUTCOMES.ESCALATE_OWNER,
      mutateRaw(raw) {
        raw.authority_snapshot.owners.push(
          "semantic-judgment-evaluator@1",
        );
      },
    },
    {
      name: "duplicate admitted fact",
      expected: OUTCOMES.INVALID_INPUT,
      mutateRaw(raw) {
        const duplicate = structuredClone(raw.observations[0]);
        duplicate.observation_id = "refund-eligibility-v1:duplicate";
        raw.observations.push(duplicate);
      },
    },
    {
      name: "invalid challenge limit",
      expected: OUTCOMES.INVALID_INPUT,
      mutateRaw(raw) {
        raw.challenge_closure.required_lanes[0].attempt_limit = 0;
      },
    },
    {
      name: "unresolved owner",
      expected: OUTCOMES.ESCALATE_OWNER,
      mutateRaw(raw) {
        raw.authority_snapshot.owners = [];
      },
    },
    {
      name: "admitted material challenge defeater",
      expected: OUTCOMES.DEFEATED,
      mutateRaw(raw) {
        raw.challenge_closure.admitted_defeaters.push("challenge:defeater");
      },
    },
  ];

  for (const fixtureCase of cases) {
    const { result } = semantic(refund, fixtureCase);
    assert.equal(
      result.outcome,
      fixtureCase.expected,
      fixtureCase.name,
    );
  }
});

test("irrelevant consensus cannot change the semantic result or receipt bytes", async () => {
  const plain = buildRequest(refund);
  const noisy = buildRequest(refund, {
    mutateSealed(request) {
      request.irrelevant_agent_consensus = {
        agent_count: 100,
        agreement: "unanimous",
      };
    },
  });
  const first = await executeWitness(plain, {
    store: new MemoryRecordStore(),
    effectDispatcher: new EffectDispatcherTestDouble(),
    telemetry: {},
  });
  const second = await executeWitness(noisy, {
    store: new MemoryRecordStore(),
    effectDispatcher: new EffectDispatcherTestDouble(),
    telemetry: {},
  });
  assert.equal(first.semantic.outcome, second.semantic.outcome);
  assert.equal(
    Buffer.compare(
      first.reasoning_receipt_bytes,
      second.reasoning_receipt_bytes,
    ),
    0,
  );
});

test("unresolved conflicts escalate and acyclic precedence resolves them", () => {
  const addDenyRule = (raw) => {
    const deny = structuredClone(raw.catalog.rules[0]);
    deny.rule_id = "refund-deny-v1";
    deny.conclusion = "deny";
    raw.catalog.rules.push(deny);
  };
  const conflict = semantic(refund, { mutateRaw: addDenyRule }).result;
  assert.equal(conflict.outcome, OUTCOMES.ESCALATE_OWNER);

  const resolved = semantic(refund, {
    mutateRaw(raw) {
      addDenyRule(raw);
      raw.catalog.precedence_edges.push({
        from: "refund-standard-v1",
        to: "refund-deny-v1",
      });
    },
  }).result;
  assert.equal(resolved.outcome, OUTCOMES.RECOMMENDED);

  const cycle = semantic(refund, {
    mutateRaw(raw) {
      addDenyRule(raw);
      raw.catalog.precedence_edges.push(
        { from: "refund-standard-v1", to: "refund-deny-v1" },
        { from: "refund-deny-v1", to: "refund-standard-v1" },
      );
    },
  }).result;
  assert.equal(cycle.outcome, OUTCOMES.ESCALATE_OWNER);
});

test("current revalidation distinguishes temporal drift from historical rejection", () => {
  const { result } = semantic(refund, {
    mode: "current-revalidation",
    mutateSealed(request) {
      request.as_of = refund.expires_at;
    },
  });
  assert.equal(result.outcome, OUTCOMES.INVALIDATED);
});

test("entry non-pass decisions produce zero evaluator, gate, and effect calls", async () => {
  for (const verdict of ["block", "defer", "flag"]) {
    const telemetry = {};
    const dispatcher = new EffectDispatcherTestDouble();
    const result = await executeWitness(
      buildRequest(refund, { entryVerdict: verdict }),
      {
        store: new MemoryRecordStore(),
        effectDispatcher: dispatcher,
        telemetry,
      },
    );
    assert.equal(telemetry.evaluator_calls, 0, verdict);
    assert.equal(telemetry.effect_gate_calls, 0, verdict);
    assert.equal(telemetry.effect_attempts, 0, verdict);
    assert.equal(dispatcher.calls.length, 0, verdict);
    assert.deepEqual(result.persisted_order, ["entry-gate-decision"]);
  }
});

test("non-positive semantic results never call the effect gate or dispatcher", async () => {
  const dispatcher = new EffectDispatcherTestDouble();
  const request = buildRequest(refund, {
    mutateRaw(raw) {
      raw.observations = raw.observations.filter(
        (item) => item.field !== "receipt_present",
      );
    },
  });
  const result = await executeWitness(request, {
    store: new MemoryRecordStore(),
    effectDispatcher: dispatcher,
    telemetry: {},
  });
  assert.equal(result.semantic.outcome, OUTCOMES.INSUFFICIENT);
  assert.equal(result.telemetry.effect_gate_calls, 0);
  assert.equal(dispatcher.calls.length, 0);
});

test("effect-gate non-pass retains recommendation with zero effect attempts", async () => {
  for (const verdict of ["block", "defer", "flag"]) {
    const dispatcher = new EffectDispatcherTestDouble();
    const result = await executeWitness(
      buildRequest(refund, { effectVerdict: verdict }),
      {
        store: new MemoryRecordStore(),
        effectDispatcher: dispatcher,
        telemetry: {},
      },
    );
    assert.equal(result.semantic.outcome, OUTCOMES.RECOMMENDED);
    assert.equal(result.effect_gate_decision.verdict, verdict);
    assert.equal(dispatcher.calls.length, 0);
    assert.equal(result.telemetry.effect_attempts, 0);
  }
});

test("only positive plus exact gate pass yields one idempotent test attempt", async () => {
  const dispatcher = new EffectDispatcherTestDouble();
  const first = await executeWitness(buildRequest(refund), {
    store: new MemoryRecordStore(),
    effectDispatcher: dispatcher,
    telemetry: {},
  });
  const second = await executeWitness(buildRequest(refund), {
    store: new MemoryRecordStore(),
    effectDispatcher: dispatcher,
    telemetry: {},
  });
  assert.equal(first.effect_attempt.status, "TestEffectRecorded");
  assert.equal(first.effect_attempt.new_attempt, true);
  assert.equal(second.effect_attempt.status, "TestEffectRecorded");
  assert.equal(second.effect_attempt.new_attempt, false);
  assert.equal(dispatcher.calls.length, 1);
});

test("same idempotency key with changed content yields conflict, not a new marker", async () => {
  const dispatcher = new EffectDispatcherTestDouble();
  await executeWitness(buildRequest(refund), {
    store: new MemoryRecordStore(),
    effectDispatcher: dispatcher,
    telemetry: {},
  });
  const changed = await executeWitness(
    buildRequest(refund, {
      mutateRaw(raw) {
        raw.observations.find(
          (item) => item.field === "purchase_amount",
        ).value = 70;
      },
    }),
    {
      store: new MemoryRecordStore(),
      effectDispatcher: dispatcher,
      telemetry: {},
    },
  );
  assert.equal(changed.effect_attempt.status, "IdempotencyConflict");
  assert.equal(changed.effect_attempt.new_attempt, false);
  assert.equal(dispatcher.calls.length, 1);
});

test("receipt persistence failure closes incomplete before effect evaluation", async () => {
  const dispatcher = new EffectDispatcherTestDouble();
  const result = await executeWitness(buildRequest(refund), {
    store: new MemoryRecordStore({ failAt: "reasoning-receipt" }),
    effectDispatcher: dispatcher,
    telemetry: {},
  });
  assert.equal(result.run_status, "incomplete");
  assert.equal(result.telemetry.evaluator_calls, 1);
  assert.equal(result.telemetry.effect_gate_calls, 0);
  assert.equal(dispatcher.calls.length, 0);
  assert.deepEqual(result.persisted_order, ["entry-gate-decision"]);
});

test("persisted order places entry before receipt and receipt before effect gate", async () => {
  const result = await executeWitness(buildRequest(refund), {
    store: new MemoryRecordStore(),
    effectDispatcher: new EffectDispatcherTestDouble(),
    telemetry: {},
  });
  assert.deepEqual(result.persisted_order, [
    "entry-gate-decision",
    "reasoning-receipt",
    "effect-envelope",
    "effect-gate-decision",
  ]);
});

test("historical replay is byte-identical with zero provider, gate, and effect calls", async () => {
  const request = buildRequest(refund);
  const executed = await executeWitness(request, {
    store: new MemoryRecordStore(),
    effectDispatcher: new EffectDispatcherTestDouble(),
    telemetry: {},
  });
  const replayed = historicalReplay(
    request,
    executed.reasoning_receipt_bytes,
  );
  assert.equal(replayed.matches_exact_bytes, true);
  assert.equal(
    replayed.expected_exact_bytes_digest,
    replayed.replay_exact_bytes_digest,
  );
  assert.equal(replayed.telemetry.provider_calls, 0);
  assert.equal(replayed.telemetry.effect_gate_calls, 0);
  assert.equal(replayed.telemetry.effect_attempts, 0);
});
