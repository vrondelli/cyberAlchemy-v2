import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildEnvelope, canonicalize } from "../evaluation/canonical-json.mjs";
import { evaluateFixture } from "../evaluation/evaluate-fixture.mjs";
import { evaluateSuite } from "../evaluation/evaluate-suite.mjs";
import {
  appendGeneration,
  appendGenerationFile,
  createGenerationIndex,
  generationEntryFromSuite,
  validateGenerationIndex,
} from "../evaluation/generation-index.mjs";
import {
  logicalReceiptDigest,
  validateEvaluationResult,
  validateEvidenceReceipt,
  validateSuiteResult,
} from "../evaluation/validate-input.mjs";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VALID_RECEIPT = JSON.parse(
  readFileSync(join(PACKAGE_ROOT, "fixtures/contracts/evidence-receipt-valid.json"), "utf8"),
);

function receiptFor(fixtureId = "F2", mutate = () => {}) {
  const source = structuredClone(VALID_RECEIPT);
  source.semantic.fixture_id = fixtureId;
  mutate(source);
  const envelope = buildEnvelope({
    schemaVersion: "cdsc.evidence-receipt.v1",
    contractId: "cdsc.evidence-receipt",
    status: "frozen",
    semantic: source.semantic,
    prohibitedInferences: source.prohibited_inferences,
    predecessorGenerationId: source.predecessor_generation_id,
    inputHandles: source.input_handles,
    createdAt: source.created_at,
    storagePath: source.storage_path,
  });
  envelope.reviewed_at = source.reviewed_at;
  return envelope;
}

function setResidualCandidate(receipt) {
  const invariant = receipt.semantic.Q.find((observable) => observable.observable_id === "Q-02");
  invariant.class = "invariant";
  for (const cell of receipt.semantic.sigma_matrix) {
    if (cell.observable_id === "Q-02") cell.state = "not-explained";
  }
  receipt.semantic.D = {
    ...receipt.semantic.D,
    residual_decision: "add a boundary-owned invariant test",
    deterministic: true,
    nonzero: true,
  };
}

function explainedResult(fixtureId) {
  return evaluateFixture(receiptFor(fixtureId));
}

function supportedResult(fixtureId) {
  return evaluateFixture(receiptFor(fixtureId, setResidualCandidate));
}

function rubricFailResult(fixtureId) {
  return evaluateFixture(
    receiptFor(fixtureId, (receipt) => {
      setResidualCandidate(receipt);
      receipt.semantic.D.nonzero = false;
    }),
  );
}

function insufficientResult(fixtureId) {
  return evaluateFixture(
    receiptFor(fixtureId, (receipt) => {
      receipt.semantic.sigma_matrix[0].state = "indeterminate";
    }),
  );
}

test("accepted receipt validates and evaluator never mutates it", () => {
  const receipt = receiptFor("F2");
  const before = canonicalize(receipt);
  assert.equal(validateEvidenceReceipt(receipt), true);
  const result = evaluateFixture(receipt);
  assert.equal(canonicalize(receipt), before);
  assert.equal(validateEvaluationResult(result), true);
  assert.equal(result.semantic.fixture_outcome, "EXPLAINED");
});

test("receipt validator rejects empty sets and malformed predicate coordinates", () => {
  const cases = [
    ["A must be nonempty", (receipt) => { receipt.semantic.A = []; receipt.semantic.sigma_matrix = []; }],
    ["Q must be nonempty", (receipt) => { receipt.semantic.Q = []; receipt.semantic.sigma_matrix = []; }],
    ["duplicate predicate coordinate", (receipt) => { receipt.semantic.sigma_matrix.push(structuredClone(receipt.semantic.sigma_matrix[0])); }],
    ["conflicting predicate coordinate", (receipt) => {
      const cell = structuredClone(receipt.semantic.sigma_matrix[0]);
      cell.state = "not-explained";
      receipt.semantic.sigma_matrix.push(cell);
    }],
    ["predicate matrix must be total", (receipt) => { receipt.semantic.sigma_matrix.pop(); }],
    ["unknown predicate state", (receipt) => { receipt.semantic.sigma_matrix[0].state = "maybe"; }],
  ];
  for (const [message, mutate] of cases) {
    assert.throws(() => validateEvidenceReceipt(receiptFor("F2", mutate)), new RegExp(message));
  }
});

test("fixture outcome decision table is total and ordered", () => {
  const cases = [
    ["all explained", () => receiptFor("F1"), "EXPLAINED"],
    ["mixed coverage remains explained", () => receiptFor("F1", (receipt) => {
      receipt.semantic.sigma_matrix.find((cell) => cell.explanation_id === "A-01" && cell.observable_id === "Q-02").state = "not-explained";
      receipt.semantic.sigma_matrix.find((cell) => cell.explanation_id === "A-02" && cell.observable_id === "Q-02").state = "explained";
    }), "EXPLAINED"],
    ["supported residue", () => receiptFor("F1", setResidualCandidate), "RESIDUAL-SUPPORTED"],
    ["no residual invariant", () => receiptFor("F1", (receipt) => {
      setResidualCandidate(receipt);
      receipt.semantic.Q.find((observable) => observable.observable_id === "Q-02").class = "lifecycle";
    }), "RUBRIC-FAIL"],
    ["permitted substitution refuted", () => receiptFor("F1", (receipt) => {
      setResidualCandidate(receipt);
      receipt.semantic.S.permitted.observation_state = "refuted";
    }), "RUBRIC-FAIL"],
    ["breaking consequence refuted", () => receiptFor("F1", (receipt) => {
      setResidualCandidate(receipt);
      receipt.semantic.S.breaking.observation_state = "refuted";
    }), "RUBRIC-FAIL"],
    ["zero usefulness", () => receiptFor("F1", (receipt) => {
      setResidualCandidate(receipt);
      receipt.semantic.D.nonzero = false;
    }), "RUBRIC-FAIL"],
    ["nondeterministic usefulness", () => receiptFor("F1", (receipt) => {
      setResidualCandidate(receipt);
      receipt.semantic.D.deterministic = false;
    }), "RUBRIC-FAIL"],
    ["indeterminate predicate", () => receiptFor("F1", (receipt) => {
      receipt.semantic.sigma_matrix[0].state = "indeterminate";
    }), "INSUFFICIENT-EVIDENCE"],
    ["indeterminate substitution", () => receiptFor("F1", (receipt) => {
      setResidualCandidate(receipt);
      receipt.semantic.S.breaking.observation_state = "indeterminate";
    }), "INSUFFICIENT-EVIDENCE"],
    ["disputed reviewer", () => receiptFor("F1", (receipt) => {
      receipt.semantic.reviewers[0].state = "disputed";
    }), "INSUFFICIENT-EVIDENCE"],
    ["missing uncertainty", () => receiptFor("F1", (receipt) => {
      receipt.semantic.U[0].state = "missing";
    }), "INSUFFICIENT-EVIDENCE"],
  ];
  for (const [name, build, expected] of cases) {
    const result = evaluateFixture(build());
    assert.equal(result.semantic.fixture_outcome, expected, name);
    assert.equal(validateEvaluationResult(result), true, name);
  }
});

test("empty residue wins EXPLAINED even when usefulness is zero", () => {
  const result = evaluateFixture(
    receiptFor("F1", (receipt) => {
      receipt.semantic.D.deterministic = false;
      receipt.semantic.D.nonzero = false;
    }),
  );
  assert.equal(result.semantic.fixture_outcome, "EXPLAINED");
});

test("logical result semantics ignore receipt array order", () => {
  const left = receiptFor("F3", setResidualCandidate);
  const right = receiptFor("F3", (receipt) => {
    setResidualCandidate(receipt);
    receipt.semantic.A.reverse();
    receipt.semantic.Q.reverse();
    receipt.semantic.sigma_matrix.reverse();
    receipt.semantic.G.members.reverse();
  });
  assert.equal(logicalReceiptDigest(left), logicalReceiptDigest(right));
  const leftResult = evaluateFixture(left);
  const rightResult = evaluateFixture(right);
  assert.deepEqual(leftResult.semantic, rightResult.semantic);
  assert.equal(leftResult.content_digest, rightResult.content_digest);
});

test("volatile metadata does not affect fixture result", () => {
  const left = receiptFor("F2");
  const right = structuredClone(left);
  right.created_at = "2030-01-01T00:00:00Z";
  right.reviewed_at = "2030-01-02T00:00:00Z";
  right.storage_path = "another/location.json";
  assert.deepEqual(evaluateFixture(left), evaluateFixture(right));
});

test("suite decision table enforces completeness, F2 control, rubric failure, and replay", () => {
  const explained = [explainedResult("F1"), explainedResult("F2"), explainedResult("F3")];
  const cases = [
    ["not run defers", explained, "not-run", "CALIBRATION-DEFER"],
    ["insufficient fixture defers", [insufficientResult("F1"), explainedResult("F2"), explainedResult("F3")], "identical", "CALIBRATION-DEFER"],
    ["F2 residual support fails", [explainedResult("F1"), supportedResult("F2"), explainedResult("F3")], "identical", "CALIBRATION-FAIL"],
    ["rubric failure fails", [rubricFailResult("F1"), explainedResult("F2"), explainedResult("F3")], "identical", "CALIBRATION-FAIL"],
    ["replay drift fails", explained, "drift", "CALIBRATION-FAIL"],
    ["F1/F3 may support residue", [supportedResult("F1"), explainedResult("F2"), supportedResult("F3")], "identical", "CALIBRATION-PASS"],
  ];
  for (const [name, results, replayState, expected] of cases) {
    const suite = evaluateSuite(results, { replayState });
    assert.equal(suite.semantic.suite_verdict, expected, name);
    assert.equal(validateSuiteResult(suite), true, name);
  }
});

test("suite output ignores fixture result input order", () => {
  const results = [supportedResult("F1"), explainedResult("F2"), explainedResult("F3")];
  assert.deepEqual(
    evaluateSuite(results, { replayState: "identical" }),
    evaluateSuite([...results].reverse(), { replayState: "identical" }),
  );
});

test("generation index appends without rewriting prior entries", () => {
  const results = [explainedResult("F1"), explainedResult("F2"), explainedResult("F3")];
  const suite = evaluateSuite(results, { replayState: "identical" });
  const first = generationEntryFromSuite(suite, results);
  const empty = createGenerationIndex();
  const one = appendGeneration(empty, first);
  assert.deepEqual(empty, createGenerationIndex());
  assert.equal(one.entries.length, 1);
  assert.throws(() => appendGeneration(one, first), /duplicate generation id/);

  const second = {
    ...first,
    generation_id: `generation:sha256:${"b".repeat(64)}`,
    predecessor_generation_id: first.generation_id,
  };
  const two = appendGeneration(one, second);
  assert.equal(two.entries.length, 2);
  assert.deepEqual(two.entries[0], first);
  assert.equal(validateGenerationIndex(two), true);
  assert.throws(
    () => appendGeneration(one, { ...second, predecessor_generation_id: null }),
    /predecessor conflict/,
  );
});

test("atomic generation file append rejects conflict without changing the file", () => {
  const directory = mkdtempSync(join(tmpdir(), "cdsc-generation-"));
  const path = join(directory, "index.json");
  try {
    const results = [explainedResult("F1"), explainedResult("F2"), explainedResult("F3")];
    const suite = evaluateSuite(results, { replayState: "identical" });
    const first = generationEntryFromSuite(suite, results);
    appendGenerationFile(path, first);
    const before = readFileSync(path, "utf8");
    assert.throws(
      () => appendGenerationFile(path, {
        ...first,
        generation_id: `generation:sha256:${"c".repeat(64)}`,
        predecessor_generation_id: null,
      }),
      /predecessor conflict/,
    );
    assert.equal(readFileSync(path, "utf8"), before);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
