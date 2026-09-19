import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  observeOperationCost,
  type OperationCostObserverInput,
  type OwnerCostBudget,
} from "./operation-cost-observer.ts";

const REPO_ROOT = resolve(process.cwd(), "../../..");
const POKER_CREATE_PLAYER_REF =
  "validation/poker-team/backend/src/use-cases/player/create-player.ts";

function sha256(bytes: string | Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

interface Fixture {
  repoRoot: string;
  sourceRef: string;
  sourceDigest: string;
  cleanup(): void;
}

const SOURCE = [
  "export const reconcile = (repo: Repository) => async (items: Item[]) => {",
  "  const known = await repo.loadAll();",
  "  const byId = new Map(known.map((item) => [item.id, item]));",
  "  for (const item of items) {",
  "    if (!byId.has(item.id)) await repo.save(item);",
  "  }",
  "  return items;",
  "};",
  "",
].join("\n");

function fixture(source = SOURCE): Fixture {
  const repoRoot = mkdtempSync(join(tmpdir(), "aop-cost-observer-"));
  mkdirSync(join(repoRoot, "src"), { recursive: true });
  const sourceRef = "src/operation.ts";
  writeFileSync(join(repoRoot, sourceRef), source, "utf8");
  return {
    repoRoot,
    sourceRef,
    sourceDigest: sha256(source),
    cleanup: () => rmSync(repoRoot, { recursive: true }),
  };
}

function budget(overrides: Partial<OwnerCostBudget> = {}): OwnerCostBudget {
  return {
    ownerRoute: "semantic-cost+runtime",
    applicability: "Fixture.Reconcile where items.length <= 3",
    metric: "external-call-count",
    comparator: "less-than-or-equal",
    threshold: 4,
    positiveFixtureIds: ["AOP-COST-POS-001"],
    hostileFixtureIds: ["AOP-COST-HOSTILE-001"],
    suppressionPolicy: "No suppression in the fixture denominator.",
    escalationPolicy: "Route threshold changes to semantic-cost+runtime.",
    ...overrides,
  };
}

function inputFor(fx: Fixture): OperationCostObserverInput {
  return {
    source: { repoRoot: fx.repoRoot, sourceRef: fx.sourceRef, sourceDigest: fx.sourceDigest },
    implementationBindingId: "APE.ImplementationBinding.operation.reconcile",
    subjectId: "Fixture.Reconcile",
    dimensions: [{ dimensionId: "items", sourceSelector: "items: Item[]", unit: "item" }],
    expensiveOperations: [
      {
        operationId: "load-all",
        kind: "repository-call",
        sourceSelector: "repo.loadAll()",
        callsExpression: "1",
        observedCalls: 1,
      },
      {
        operationId: "save-missing",
        kind: "repository-call",
        sourceSelector: "repo.save(item)",
        callsExpression: "missing(items)",
        observedCalls: 3,
      },
    ],
    traversalPasses: [
      {
        passId: "index-known",
        dimensionId: "items",
        sourceSelector: "known.map",
        form: "map",
        awaited: false,
        preservesOrder: true,
        hasEffects: false,
        cleanup: "none",
        allocation: "cardinality-dependent",
        earlyExit: false,
        rationale: "Build one lookup before the write pass.",
      },
      {
        passId: "save-missing",
        dimensionId: "items",
        sourceSelector: "for (const item of items)",
        form: "explicit-loop",
        awaited: true,
        preservesOrder: true,
        hasEffects: true,
        cleanup: "none",
        allocation: "none",
        earlyExit: false,
        rationale: "An explicit loop preserves awaited write order.",
      },
    ],
    comparisons: [],
  };
}

test("no owner budget produces deterministic advisory evidence, never an arbitrary failure", () => {
  const fx = fixture();
  try {
    const input = inputFor(fx);
    const first = observeOperationCost(input);
    const second = observeOperationCost(input);
    assert.deepEqual(second, first);
    assert.equal(first.result, "flag");
    assert.equal(first.diagnostic, "AOP_COST_ADVISORY_NO_BUDGET");
    assert.equal(first.severity, "advisory");
    assert.equal(first.budgetThreshold, null);
    assert.equal(first.observations.length, 2);
    assert.equal(first.runtimeGuaranteeClaimed, false);
  } finally {
    fx.cleanup();
  }
});

test("a complete owner budget can pass at its exact threshold", () => {
  const fx = fixture();
  try {
    const input = inputFor(fx);
    input.ownerBudget = budget();
    const result = observeOperationCost(input);
    assert.equal(result.result, "pass");
    assert.equal(result.diagnostic, "AOP_COST_PASS");
    assert.equal(result.measuredValue, 4);
    assert.equal(result.budgetThreshold, 4);
  } finally {
    fx.cleanup();
  }
});

test("a complete owner budget fails only for its exact measured breach", () => {
  const fx = fixture();
  try {
    const input = inputFor(fx);
    input.ownerBudget = budget({ threshold: 3 });
    const result = observeOperationCost(input);
    assert.equal(result.result, "fail");
    assert.equal(result.diagnostic, "AOP_COST_BUDGET_EXCEEDED");
    assert.equal(result.measuredValue, 4);
    assert.equal(result.severity, "profile-fail");
  } finally {
    fx.cleanup();
  }
});

test("an incomplete budget remains owner-blocked", () => {
  const fx = fixture();
  try {
    const input = inputFor(fx);
    input.ownerBudget = { ownerRoute: "semantic-cost+runtime", threshold: 1 };
    const result = observeOperationCost(input);
    assert.equal(result.result, "owner-blocked");
    assert.equal(result.diagnostic, "AOP_COST_OWNER_BUDGET_INCOMPLETE");
    assert.equal(result.severity, "owner-blocked");
  } finally {
    fx.cleanup();
  }
});

test("explicit awaited loops and justified multiple passes are positive observations", () => {
  const fx = fixture();
  try {
    const input = inputFor(fx);
    input.ownerBudget = budget({ metric: "traversal-pass-count", threshold: 2 });
    const result = observeOperationCost(input);
    assert.equal(result.result, "pass");
    assert.equal(result.measuredValue, 2);
    const traversal = result.observations.find((row) =>
      row.property_id.endsWith("traversal-equivalence"),
    );
    assert.ok(traversal);
    assert.equal(traversal.observed_value.syntax_preference, "none");
  } finally {
    fx.cleanup();
  }
});

test("a traversal rewrite changing any preservation dimension fails exactly", () => {
  const fx = fixture();
  try {
    const input = inputFor(fx);
    input.comparisons = [
      {
        comparisonId: "loop-to-async-reduce",
        beforeForm: "explicit awaited loop",
        afterForm: "async reduce",
        dimensions: {
          result: true,
          order: false,
          errors: true,
          effects: true,
          consumption: true,
          termination: true,
          cleanup: true,
          allocation: true,
          earlyExit: true,
          declaredCost: true,
        },
      },
    ];
    const result = observeOperationCost(input);
    assert.equal(result.result, "fail");
    assert.equal(result.diagnostic, "AOP_COST_EQUIVALENCE_CHANGED");
  } finally {
    fx.cleanup();
  }
});

test("mandatory reduce and single-pass shortcuts fail without rewriting syntax", () => {
  const fx = fixture();
  try {
    const input = inputFor(fx) as OperationCostObserverInput & { mandatoryReduce: boolean };
    input.mandatoryReduce = true;
    const result = observeOperationCost(input);
    assert.equal(result.result, "fail");
    assert.equal(result.diagnostic, "AOP_COST_SYNTAX_SHORTCUT");
  } finally {
    fx.cleanup();
  }
});

test("Repository shape cannot be relabeled as N+1 safety", () => {
  const fx = fixture();
  try {
    const input = inputFor(fx) as OperationCostObserverInput & {
      repositoryProvesNPlusOneSafe: boolean;
    };
    input.repositoryProvesNPlusOneSafe = true;
    const result = observeOperationCost(input);
    assert.equal(result.result, "fail");
    assert.equal(result.diagnostic, "AOP_COST_REPOSITORY_NON_INFERENCE");
  } finally {
    fx.cleanup();
  }
});

test("a missing source selector remains missing rather than a zero-cost pass", () => {
  const fx = fixture();
  try {
    const input = inputFor(fx);
    input.expensiveOperations[0].sourceSelector = "repo.notPresent()";
    const result = observeOperationCost(input);
    assert.equal(result.result, "missing");
    assert.equal(result.diagnostic, "AOP_COST_MISSING_EVIDENCE");
  } finally {
    fx.cleanup();
  }
});

test("stale source blocks before cost evaluation", () => {
  const fx = fixture();
  try {
    const input = inputFor(fx);
    input.source.sourceDigest = "0".repeat(64);
    const result = observeOperationCost(input);
    assert.equal(result.result, "block");
    assert.equal(result.diagnostic, "AOP_OBSERVER_SOURCE_STALE");
    assert.deepEqual(result.observations, []);
  } finally {
    fx.cleanup();
  }
});

test("the selected Poker source produces advisory call evidence without an invented budget", () => {
  const source = readFileSync(join(REPO_ROOT, POKER_CREATE_PLAYER_REF));
  const result = observeOperationCost({
    source: {
      repoRoot: REPO_ROOT,
      sourceRef: POKER_CREATE_PLAYER_REF,
      sourceDigest: sha256(source),
    },
    implementationBindingId: "APE.ImplementationBinding.operation.poker-create-player",
    subjectId: "PokerTeam.CreatePlayer",
    dimensions: [{ dimensionId: "request", sourceSelector: "input: CreatePlayerInput", unit: "request" }],
    expensiveOperations: [
      {
        operationId: "create-player",
        kind: "repository-call",
        sourceSelector: "playerRepo.create(createInput)",
        callsExpression: "1 per request",
      },
    ],
    traversalPasses: [],
    comparisons: [],
  });
  assert.equal(result.result, "flag");
  assert.equal(result.diagnostic, "AOP_COST_ADVISORY_NO_BUDGET");
  assert.equal(result.measuredValue, null);
});
