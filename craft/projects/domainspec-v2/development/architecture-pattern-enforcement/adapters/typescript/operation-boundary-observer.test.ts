import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  observeOperationBoundary,
  type OperationBoundaryObserverInput,
} from "./operation-boundary-observer.ts";

const REPO_ROOT = resolve(process.cwd(), "../../..");
const POKER_CREATE_PLAYER_REF =
  "validation/poker-team/backend/src/use-cases/player/create-player.ts";
const RMT_CONTRACT_REF =
  "projects/domainspec-v2/development/refinement-runs/20260814T193343Z-active-meta-type-implementations/stages/09-invoke-plan/tasks/TASK-RMT-OP.md";

function sha256(bytes: string | Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

interface Fixture {
  repoRoot: string;
  sourceRef: string;
  sourceDigest: string;
  contractRef: string;
  contractDigest: string;
  cleanup(): void;
}

const SOURCE = [
  'import { isEligible } from "./rules";',
  'import type { PlayerRepository } from "./player.repository";',
  "export const createPlayer = (repo: PlayerRepository) => async (input: Input) => {",
  "  const existing = await repo.find(input.id);",
  "  const allowed = isEligible(input, existing);",
  "  const created = Player.create(input, allowed);",
  "  await repo.save(created);",
  "  return created;",
  "};",
  "",
].join("\n");

function fixture(source = SOURCE): Fixture {
  const repoRoot = mkdtempSync(join(tmpdir(), "aop-boundary-observer-"));
  mkdirSync(join(repoRoot, "src"), { recursive: true });
  mkdirSync(join(repoRoot, "rmt"), { recursive: true });
  const sourceRef = "src/operation.ts";
  const contractRef = "rmt/operation.md";
  const contract = "# Operation contract\n\nRule relationship is reference-only.\n";
  writeFileSync(join(repoRoot, sourceRef), source, "utf8");
  writeFileSync(join(repoRoot, contractRef), contract, "utf8");
  return {
    repoRoot,
    sourceRef,
    sourceDigest: sha256(source),
    contractRef,
    contractDigest: sha256(contract),
    cleanup: () => rmSync(repoRoot, { recursive: true }),
  };
}

function inputFor(fx: Fixture): OperationBoundaryObserverInput {
  return {
    source: { repoRoot: fx.repoRoot, sourceRef: fx.sourceRef, sourceDigest: fx.sourceDigest },
    rmtContract: { sourceRef: fx.contractRef, sourceDigest: fx.contractDigest },
    implementationBindingId: "APE.ImplementationBinding.operation.create-player",
    subjectId: "Fixture.CreatePlayer",
    outcomeId: "CreatePlayer",
    nodes: [
      {
        nodeId: "acquire-player",
        phase: "acquire",
        owner: "repository",
        sourceSelector: "repo.find(input.id)",
        dependsOn: [],
        evidenceKind: "static",
      },
      {
        nodeId: "decide-eligibility",
        phase: "decide",
        owner: "rule",
        sourceSelector: "isEligible(input, existing)",
        dependsOn: ["acquire-player"],
        evidenceKind: "static",
      },
      {
        nodeId: "mutate-player",
        phase: "guarded-mutation",
        owner: "entity",
        sourceSelector: "Player.create(input, allowed)",
        dependsOn: ["decide-eligibility"],
        evidenceKind: "static",
      },
      {
        nodeId: "persist-player",
        phase: "acquire",
        owner: "repository",
        sourceSelector: "repo.save(created)",
        dependsOn: ["mutate-player"],
        evidenceKind: "static",
      },
    ],
    pureRuleReferences: [
      {
        ruleId: "Rule.IsEligible",
        sourceSelector: "isEligible(input, existing)",
        rmtRelationRef: "rmt/operation.md#rule-relationship",
      },
    ],
    forbiddenConcreteImportPatterns: ["(?:^|/)infrastructure(?:/|$)", "telemetry"],
  };
}

test("emits a deterministic architecture-only boundary graph", () => {
  const fx = fixture();
  try {
    const input = inputFor(fx);
    const first = observeOperationBoundary(input);
    const second = observeOperationBoundary(input);
    assert.deepEqual(second, first);
    assert.equal(first.result, "pass");
    assert.equal(first.diagnostic, "AOP_BOUNDARY_PASS");
    assert.equal(first.observations.length, 3);
    assert.equal(first.rmtSemanticPolicy.semanticOutcomeEvaluated, false);
    assert.equal(first.rmtSemanticPolicy.ruleOrderingPromoted, false);
    assert.equal(first.runtimeGuaranteeClaimed, false);
  } finally {
    fx.cleanup();
  }
});

test("classifies the selected Poker outer instrumentation boundary as passing architecture evidence", () => {
  const sourceDigest = sha256(readFileSync(join(REPO_ROOT, POKER_CREATE_PLAYER_REF)));
  const contractDigest = sha256(readFileSync(join(REPO_ROOT, RMT_CONTRACT_REF)));
  const result = observeOperationBoundary({
    source: { repoRoot: REPO_ROOT, sourceRef: POKER_CREATE_PLAYER_REF, sourceDigest },
    rmtContract: { sourceRef: RMT_CONTRACT_REF, sourceDigest: contractDigest },
    implementationBindingId: "APE.ImplementationBinding.operation.poker-create-player",
    subjectId: "PokerTeam.CreatePlayer",
    outcomeId: "CreatePlayer",
    nodes: [
      {
        nodeId: "persist-player",
        phase: "acquire",
        owner: "repository",
        sourceSelector: "playerRepo.create(createInput)",
        dependsOn: [],
        evidenceKind: "static",
      },
    ],
    pureRuleReferences: [],
    forbiddenConcreteImportPatterns: ["infrastructure/telemetry"],
  });
  assert.equal(result.result, "pass");
  assert.equal(result.diagnostic, "AOP_BOUNDARY_PASS");
  assert.equal(result.rmtSemanticPolicy.semanticOutcomeEvaluated, false);
});

test("rejects an RMT semantic result embedded in the architecture input", () => {
  const fx = fixture();
  try {
    const input = inputFor(fx) as OperationBoundaryObserverInput & {
      guardOrderCorrect: boolean;
    };
    input.guardOrderCorrect = true;
    const result = observeOperationBoundary(input);
    assert.equal(result.result, "fail");
    assert.equal(result.diagnostic, "AOP_BOUNDARY_RMT_SEMANTIC_DUPLICATION");
  } finally {
    fx.cleanup();
  }
});

test("rejects file-count and dependency-count responsibility proxies", () => {
  const fx = fixture();
  try {
    const input = inputFor(fx) as OperationBoundaryObserverInput & { fileCount: number };
    input.fileCount = 1;
    const result = observeOperationBoundary(input);
    assert.equal(result.result, "fail");
    assert.equal(result.diagnostic, "AOP_BOUNDARY_PROXY_METRIC");
  } finally {
    fx.cleanup();
  }
});

test("rejects business decision ownership inside a Repository", () => {
  const fx = fixture();
  try {
    const input = inputFor(fx);
    input.nodes[1].owner = "repository";
    const result = observeOperationBoundary(input);
    assert.equal(result.result, "fail");
    assert.equal(result.diagnostic, "AOP_BOUNDARY_OWNER_MISMATCH");
  } finally {
    fx.cleanup();
  }
});

test("preserves unresolved dynamic calls as unsupported", () => {
  const fx = fixture(SOURCE.replace("const existing", "const provider = await import(input.kind); const existing"));
  try {
    const result = observeOperationBoundary(inputFor(fx));
    assert.equal(result.result, "unsupported");
    assert.equal(result.diagnostic, "AOP_BOUNDARY_DYNAMIC_UNSUPPORTED");
  } finally {
    fx.cleanup();
  }
});

test("reports a missing exact selector instead of silently passing", () => {
  const fx = fixture();
  try {
    const input = inputFor(fx);
    input.nodes[0].sourceSelector = "repo.findMissing(input.id)";
    const result = observeOperationBoundary(input);
    assert.equal(result.result, "missing");
    assert.equal(result.diagnostic, "AOP_BOUNDARY_MISSING_EVIDENCE");
  } finally {
    fx.cleanup();
  }
});

test("stale RMT reference blocks without evaluating an outcome", () => {
  const fx = fixture();
  try {
    const input = inputFor(fx);
    input.rmtContract.sourceDigest = "0".repeat(64);
    const result = observeOperationBoundary(input);
    assert.equal(result.result, "block");
    assert.equal(result.diagnostic, "AOP_OBSERVER_SOURCE_STALE");
    assert.equal(result.rmtSemanticPolicy.semanticOutcomeEvaluated, false);
    assert.deepEqual(result.observations, []);
  } finally {
    fx.cleanup();
  }
});

test("rejects a concrete ORM import without converting it into a semantic result", () => {
  const fx = fixture(SOURCE.replace("./player.repository", "./infrastructure/drizzle-player.repository"));
  try {
    const result = observeOperationBoundary(inputFor(fx));
    assert.equal(result.result, "fail");
    assert.equal(result.diagnostic, "AOP_BOUNDARY_CONCRETE_PROVIDER_IMPORT");
    assert.equal(result.rmtSemanticPolicy.semanticOutcomeEvaluated, false);
  } finally {
    fx.cleanup();
  }
});
