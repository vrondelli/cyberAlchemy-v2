import assert from "node:assert/strict";
import test from "node:test";
import {
  apiRequestIds,
  parseEntryLog,
  observedFunctions,
  protectedFunctions,
  verifyApiSegments,
} from "./auth-v4b-actual-entry-observation-v21.mjs";

const labels = [
  "allow", "route_missing", "duplicate_auth", "duplicate_route",
  "admission_probe", "policy_deny",
];
const caseMarker = name => `AUTH_V21_CASE:${name}:${apiRequestIds[name]}`;
const entryMarker = (name, caseName) => `AUTH_V21_ENTRY:${name}:${apiRequestIds[caseName]}`;
const parse = log => parseEntryLog(log, labels, apiRequestIds);
const goodLog = [
  caseMarker("allow"),
  entryMarker("api_worker", "allow"),
  entryMarker("ready_decision_authorize", "allow"),
  entryMarker("authorize", "allow"),
  caseMarker("route_missing"),
  entryMarker("api_worker", "route_missing"),
  caseMarker("duplicate_auth"),
  entryMarker("api_worker", "duplicate_auth"),
  caseMarker("duplicate_route"),
  entryMarker("api_worker", "duplicate_route"),
  caseMarker("admission_probe"),
  entryMarker("ready_decision_authorize", "admission_probe"),
  entryMarker("authorize", "admission_probe"),
  caseMarker("policy_deny"),
  entryMarker("api_worker", "policy_deny"),
  entryMarker("ready_decision_authorize", "policy_deny"),
  entryMarker("authorize", "policy_deny"),
  "AUTH_V21_CASE:end",
].join("\n");

test("actual-entry parser accepts only complete request-correlated selected paths", () => {
  const segments = parse(goodLog);
  verifyApiSegments(segments);
  assert.deepEqual(segments.duplicate_auth, ["api_worker"]);
  assert.equal(protectedFunctions.length, 9);
  assert.equal(observedFunctions.length, 11);
  assert.equal(new Set(Object.values(apiRequestIds)).size, labels.length);
});

test("each pre-READY case rejects all protected entries, including a foreign request", () => {
  for (const name of ["route_missing", "duplicate_auth", "duplicate_route"]) {
    for (const callable of observedFunctions.filter(item => item !== "api_worker")) {
      const hostile = goodLog.replace(
        `${caseMarker(name)}\n`,
        `${caseMarker(name)}\n${entryMarker(callable, name)}\n`,
      );
      assert.throws(() => verifyApiSegments(parse(hostile)), /pre-ready-entry/u);
    }
    const foreign = goodLog.replace(
      `${caseMarker(name)}\n`,
      `${caseMarker(name)}\n${entryMarker("authorize", "allow")}\n`,
    );
    assert.throws(() => parse(foreign), /entry-request-id/u);
  }
});

test("missing, duplicate, and out-of-order READY entries reject", () => {
  const head = `${caseMarker("allow")}\n${entryMarker("api_worker", "allow")}\n${entryMarker("ready_decision_authorize", "allow")}\n`;
  const generated = `${entryMarker("authorize", "allow")}\n`;
  assert.throws(() => verifyApiSegments(parse(goodLog.replace(head + generated, head))),
    /missing-callee-entry/u);
  assert.throws(() => verifyApiSegments(parse(goodLog.replace(head + generated,
    head + generated + generated))), /duplicate-callee-entry/u);
  assert.throws(() => verifyApiSegments(parse(goodLog.replace(
    `${entryMarker("ready_decision_authorize", "allow")}\n`, ""))),
    /missing-ready-decision-entry/u);
  assert.throws(() => verifyApiSegments(parse(goodLog.replace(head,
    head + `${entryMarker("ready_decision_authorize", "allow")}\n`))),
    /duplicate-ready-decision-entry/u);
  assert.throws(() => verifyApiSegments(parse(goodLog.replace(head + generated,
    `${caseMarker("allow")}\n${entryMarker("api_worker", "allow")}\n${generated}${entryMarker("ready_decision_authorize", "allow")}\n`))),
    /protected-entry-before-ready-decision/u);
  assert.throws(() => verifyApiSegments(parse(goodLog.replace(head,
    `${caseMarker("allow")}\n${entryMarker("api_worker", "allow")}\n${entryMarker("complete_active_roles", "allow")}\n${entryMarker("ready_decision_authorize", "allow")}\n`))),
    /protected-entry-before-ready-decision/u);
});

test("worker handoff requires exactly one correctly ordered same-request entry", () => {
  const worker = entryMarker("api_worker", "allow");
  assert.throws(() => verifyApiSegments(parse(goodLog.replace(`${worker}\n`, ""))),
    /worker-entry-count:allow/u);
  assert.throws(() => verifyApiSegments(parse(goodLog.replace(`${worker}\n`, `${worker}\n${worker}\n`))),
    /worker-entry-count:allow/u);
  assert.throws(() => parse(goodLog.replace(worker, entryMarker("api_worker", "route_missing"))),
    /entry-request-id/u);
  assert.throws(() => verifyApiSegments(parse(goodLog.replace(
    `${worker}\n${entryMarker("ready_decision_authorize", "allow")}`,
    `${entryMarker("ready_decision_authorize", "allow")}\n${worker}`))),
    /worker-after-ready:allow/u);
  assert.throws(() => verifyApiSegments(parse(goodLog.replace(
    `${caseMarker("admission_probe")}\n`,
    `${caseMarker("admission_probe")}\n${entryMarker("api_worker", "admission_probe")}\n`))),
    /worker-entry-count:admission_probe/u);
  for (const name of ["route_missing", "duplicate_auth", "duplicate_route"]) {
    const marker = entryMarker("api_worker", name);
    assert.throws(() => verifyApiSegments(parse(goodLog.replace(`${marker}\n`, ""))),
      /worker-entry-count/u);
    assert.throws(() => verifyApiSegments(parse(goodLog.replace(`${marker}\n`, `${marker}\n${marker}\n`))),
      /worker-entry-count/u);
  }
});

test("case IDs and entry IDs reject cross-request, late, and malformed evidence", () => {
  assert.throws(() => parse(goodLog.replace(caseMarker("allow"),
    `AUTH_V21_CASE:allow:${apiRequestIds.route_missing}`)), /case-request-id/u);
  assert.throws(() => parse(goodLog.replace(entryMarker("authorize", "allow"),
    entryMarker("authorize", "route_missing"))), /entry-request-id/u);
  assert.throws(() => parse(goodLog.replace("AUTH_V21_CASE:end", "")),
    /incomplete-case-markers/u);
  assert.throws(() => parse(`${entryMarker("authorize", "allow")}\n${goodLog}`),
    /unassigned-entry/u);
  assert.throws(() => parse(`${goodLog}\n${entryMarker("authorize", "allow")}`),
    /unassigned-entry/u);
  assert.throws(() => parse(goodLog.replace(caseMarker("duplicate_auth"), caseMarker("route_missing"))),
    /case-order/u);
  assert.throws(() => parse(goodLog.replace(entryMarker("authorize", "allow"),
    `AUTH_V21_ENTRY:unknown:${apiRequestIds.allow}`)), /unknown-entry/u);
  assert.throws(() => parse(goodLog.replace(entryMarker("authorize", "allow"),
    `AUTH_V21_ENTRY:authorize-garbage:${apiRequestIds.allow}`)), /malformed-marker/u);
  assert.throws(() => parse(goodLog.replace("AUTH_V21_CASE:end",
    `AUTH_V21_CASE:end ${entryMarker("authorize", "allow")}`)), /multiple-markers-on-line/u);
  assert.throws(() => parse(goodLog.replace("AUTH_V21_CASE:end",
    `AUTH_V21_CASE:end:${apiRequestIds.allow}`)), /end-with-request-id/u);
});
