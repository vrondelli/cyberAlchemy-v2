import { buildEnvelope, sortedUniqueStrings } from "./canonical-json.mjs";
import {
  REQUIRED_PROHIBITIONS,
  statusForSuiteVerdict,
  validateEvaluationResult,
  validateSuiteResult,
} from "./validate-input.mjs";

export function evaluateSuite(fixtureResults, { replayState }) {
  if (!Array.isArray(fixtureResults) || fixtureResults.length !== 3) {
    throw new TypeError("suite requires exactly three fixture results");
  }
  if (!["not-run", "identical", "drift"].includes(replayState)) throw new TypeError("unknown replay state");

  const byFixture = new Map();
  for (const result of fixtureResults) {
    validateEvaluationResult(result);
    const fixtureId = result.semantic.fixture_id;
    if (byFixture.has(fixtureId)) throw new TypeError("duplicate fixture result");
    byFixture.set(fixtureId, result);
  }
  for (const fixtureId of ["F1", "F2", "F3"]) {
    if (!byFixture.has(fixtureId)) throw new TypeError(`missing fixture result: ${fixtureId}`);
  }

  const outcomes = Object.fromEntries(
    [...byFixture.entries()].map(([fixtureId, result]) => [fixtureId, result.semantic.fixture_outcome]),
  );
  const verdict = classifySuite(outcomes, replayState);
  const handles = sortedUniqueStrings(
    [...byFixture.values()].map((result) => result.record_id),
    "fixture result handles",
  );
  const prohibitions = sortedUniqueStrings(
    [...new Set([...REQUIRED_PROHIBITIONS, ...fixtureResults.flatMap((result) => result.prohibited_inferences)])],
    "prohibited inferences",
  );
  const semantic = {
    fixture_result_handles: handles,
    control_fixture_id: "F2",
    replay_state: replayState,
    suite_verdict: verdict,
    next_route: nextRouteForVerdict(verdict),
  };
  const result = buildEnvelope({
    schemaVersion: "cdsc.suite-result.v1",
    contractId: "cdsc.suite-result",
    status: statusForSuiteVerdict(verdict),
    semantic,
    prohibitedInferences: prohibitions,
    inputHandles: handles,
  });
  validateSuiteResult(result);
  return result;
}

export function classifySuite(outcomes, replayState) {
  const values = [outcomes.F1, outcomes.F2, outcomes.F3];
  if (values.some((outcome) => outcome === undefined)) throw new TypeError("suite outcomes must include F1, F2, and F3");
  if (values.some((outcome) => outcome === "INSUFFICIENT-EVIDENCE") || replayState === "not-run") {
    return "CALIBRATION-DEFER";
  }
  if (
    outcomes.F2 !== "EXPLAINED" ||
    values.some((outcome) => outcome === "RUBRIC-FAIL") ||
    replayState === "drift"
  ) {
    return "CALIBRATION-FAIL";
  }
  return "CALIBRATION-PASS";
}

function nextRouteForVerdict(verdict) {
  return {
    "CALIBRATION-DEFER": "evidence-repair",
    "CALIBRATION-FAIL": "method-review",
    "CALIBRATION-PASS": "bounded-follow-up-research",
  }[verdict];
}
