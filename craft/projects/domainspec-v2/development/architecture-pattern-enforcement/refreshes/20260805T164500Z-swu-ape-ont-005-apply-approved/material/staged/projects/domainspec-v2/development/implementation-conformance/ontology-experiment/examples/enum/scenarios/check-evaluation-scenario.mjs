#!/usr/bin/env node

import {readFile} from "node:fs/promises";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const fixtureDirectory = dirname(fileURLToPath(import.meta.url));
const experimentRoot = resolve(
  process.env.DOMAINSPEC_ONTOLOGY_EXPERIMENT_ROOT
    ?? join(fixtureDirectory, "../../.."),
);
const casesPath = join(fixtureDirectory, "cases.json");
const expectedPath = join(fixtureDirectory, "evaluations.expected.json");
const schemaPath = join(experimentRoot, "contracts/evaluation-scenario.schema.json");
const stableIdPattern = /^[a-z][a-z0-9._-]*:[A-Za-z0-9._-]+$/;
const sha256Pattern = /^[a-f0-9]{64}$/;

const loadJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const canonical = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (isObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};
const same = (left, right) => canonical(left) === canonical(right);
const duplicateValues = (values) => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))].sort();
const addSchemaError = (errors, condition, message) => {
  if (!condition) errors.push(message);
};
const exactKeys = (value, required, label, errors) => {
  addSchemaError(errors, isObject(value), `${label} must be an object`);
  if (!isObject(value)) return;
  const actual = Object.keys(value).sort();
  const expected = [...required].sort();
  addSchemaError(errors, same(actual, expected), `${label} keys differ`);
};
const validId = (value) => typeof value === "string" && stableIdPattern.test(value);
const validSha = (value) => typeof value === "string" && sha256Pattern.test(value);
const validateDelta = (delta, label, errors) => {
  exactKeys(delta, ["added", "removed"], label, errors);
  if (!isObject(delta)) return;
  for (const key of ["added", "removed"]) {
    addSchemaError(errors, Array.isArray(delta[key]), `${label}.${key} must be an array`);
    if (Array.isArray(delta[key])) {
      addSchemaError(errors, delta[key].every((value) => typeof value === "string"), `${label}.${key} must contain strings`);
      addSchemaError(errors, duplicateValues(delta[key]).length === 0, `${label}.${key} must be unique`);
    }
  }
};
const validateHandle = (handle, idKey, label, errors) => {
  exactKeys(handle, [idKey, "sha256"], label, errors);
  if (!isObject(handle)) return;
  addSchemaError(errors, validId(handle[idKey]), `${label}.${idKey} invalid`);
  addSchemaError(errors, validSha(handle.sha256), `${label}.sha256 invalid`);
};
const validateExpectation = (handle, label, errors) => {
  exactKeys(handle, ["expectation_id", "immutable", "sha256"], label, errors);
  if (!isObject(handle)) return;
  addSchemaError(errors, validId(handle.expectation_id), `${label}.expectation_id invalid`);
  addSchemaError(errors, validSha(handle.sha256), `${label}.sha256 invalid`);
  addSchemaError(errors, handle.immutable === true, `${label}.immutable must be true`);
};

const validateStructuralShape = (scenario) => {
  const errors = [];
  exactKeys(scenario, [
    "artifacts",
    "authority_effect",
    "case_result_join",
    "expectations",
    "frozen_cases",
    "mutation_lineage",
    "operation",
    "recomposition",
    "results",
    "scenario_id",
    "schema_version",
  ], "scenario", errors);
  if (!isObject(scenario)) return errors;
  addSchemaError(errors, scenario.schema_version === "evaluation-scenario.v1", "schema_version invalid");
  addSchemaError(errors, validId(scenario.scenario_id), "scenario_id invalid");
  addSchemaError(errors, scenario.authority_effect === "none", "authority_effect must be none");

  exactKeys(scenario.operation, ["operation_id", "operation_kind", "sha256"], "operation", errors);
  if (isObject(scenario.operation)) {
    addSchemaError(errors, validId(scenario.operation.operation_id), "operation.operation_id invalid");
    addSchemaError(errors, ["insert", "remove", "replace", "recompose"].includes(scenario.operation.operation_kind), "operation.operation_kind invalid");
    addSchemaError(errors, validSha(scenario.operation.sha256), "operation.sha256 invalid");
  }

  exactKeys(scenario.artifacts, ["base", "mutant"], "artifacts", errors);
  if (isObject(scenario.artifacts)) {
    validateHandle(scenario.artifacts.base, "artifact_id", "artifacts.base", errors);
    validateHandle(scenario.artifacts.mutant, "artifact_id", "artifacts.mutant", errors);
  }
  exactKeys(scenario.expectations, ["post", "pre"], "expectations", errors);
  if (isObject(scenario.expectations)) {
    validateExpectation(scenario.expectations.pre, "expectations.pre", errors);
    validateExpectation(scenario.expectations.post, "expectations.post", errors);
  }

  exactKeys(scenario.mutation_lineage, [
    "base_ref",
    "mutant_ref",
    "mutation_id",
    "operation_ref",
    "post_expectation_ref",
    "pre_expectation_ref",
  ], "mutation_lineage", errors);
  if (isObject(scenario.mutation_lineage)) {
    for (const key of Object.keys(scenario.mutation_lineage)) {
      addSchemaError(errors, validId(scenario.mutation_lineage[key]), `mutation_lineage.${key} invalid`);
    }
  }

  exactKeys(scenario.recomposition, ["partitions", "result_ref", "source_ref"], "recomposition", errors);
  if (isObject(scenario.recomposition)) {
    addSchemaError(errors, validId(scenario.recomposition.source_ref), "recomposition.source_ref invalid");
    addSchemaError(errors, validId(scenario.recomposition.result_ref), "recomposition.result_ref invalid");
    addSchemaError(errors, Array.isArray(scenario.recomposition.partitions) && scenario.recomposition.partitions.length > 0, "recomposition.partitions must be non-empty");
    for (const [index, partition] of (scenario.recomposition.partitions ?? []).entries()) {
      const label = `recomposition.partitions[${index}]`;
      exactKeys(partition, ["partition_id", "result_member_refs", "scope", "source_member_refs"], label, errors);
      if (!isObject(partition)) continue;
      addSchemaError(errors, validId(partition.partition_id), `${label}.partition_id invalid`);
      exactKeys(partition.scope, ["end", "resource_ref", "start"], `${label}.scope`, errors);
      if (isObject(partition.scope)) {
        addSchemaError(errors, validId(partition.scope.resource_ref), `${label}.scope.resource_ref invalid`);
        addSchemaError(errors, Number.isInteger(partition.scope.start) && partition.scope.start >= 0, `${label}.scope.start invalid`);
        addSchemaError(errors, Number.isInteger(partition.scope.end) && partition.scope.end > partition.scope.start, `${label}.scope.end invalid`);
      }
      for (const key of ["source_member_refs", "result_member_refs"]) {
        addSchemaError(errors, Array.isArray(partition[key]), `${label}.${key} must be an array`);
        if (Array.isArray(partition[key])) {
          addSchemaError(errors, partition[key].every(validId), `${label}.${key} contains invalid ids`);
          addSchemaError(errors, duplicateValues(partition[key]).length === 0, `${label}.${key} must be unique`);
        }
      }
    }
  }

  addSchemaError(errors, Array.isArray(scenario.frozen_cases) && scenario.frozen_cases.length > 0, "frozen_cases must be non-empty");
  for (const [index, frozenCase] of (scenario.frozen_cases ?? []).entries()) {
    const label = `frozen_cases[${index}]`;
    exactKeys(frozenCase, ["case_id", "expectation_ref", "expected_delta", "expected_diagnostic", "frozen", "input_ref"], label, errors);
    if (!isObject(frozenCase)) continue;
    for (const key of ["case_id", "input_ref", "expectation_ref"]) addSchemaError(errors, validId(frozenCase[key]), `${label}.${key} invalid`);
    addSchemaError(errors, frozenCase.expected_diagnostic === null || /^BTE_[A-Z0-9_]+$/.test(frozenCase.expected_diagnostic), `${label}.expected_diagnostic invalid`);
    addSchemaError(errors, frozenCase.frozen === true, `${label}.frozen must be true`);
    validateDelta(frozenCase.expected_delta, `${label}.expected_delta`, errors);
  }

  addSchemaError(errors, Array.isArray(scenario.results) && scenario.results.length > 0, "results must be non-empty");
  for (const [index, result] of (scenario.results ?? []).entries()) {
    const label = `results[${index}]`;
    exactKeys(result, ["expectation_ref", "input_ref", "observed_delta", "observed_diagnostic", "result_id", "scenario_ref"], label, errors);
    if (!isObject(result)) continue;
    for (const key of ["result_id", "scenario_ref", "input_ref", "expectation_ref"]) addSchemaError(errors, validId(result[key]), `${label}.${key} invalid`);
    addSchemaError(errors, result.observed_diagnostic === null || /^BTE_[A-Z0-9_]+$/.test(result.observed_diagnostic), `${label}.observed_diagnostic invalid`);
    validateDelta(result.observed_delta, `${label}.observed_delta`, errors);
  }

  addSchemaError(errors, Array.isArray(scenario.case_result_join) && scenario.case_result_join.length > 0, "case_result_join must be non-empty");
  for (const [index, joinEntry] of (scenario.case_result_join ?? []).entries()) {
    const label = `case_result_join[${index}]`;
    exactKeys(joinEntry, ["case_ref", "result_ref"], label, errors);
    if (!isObject(joinEntry)) continue;
    addSchemaError(errors, validId(joinEntry.case_ref), `${label}.case_ref invalid`);
    addSchemaError(errors, validId(joinEntry.result_ref), `${label}.result_ref invalid`);
  }
  return errors.sort();
};

const validateScenario = (scenario) => {
  const diagnostics = [];
  const structuralErrors = validateStructuralShape(scenario);
  if (structuralErrors.length > 0) diagnostics.push("APE_SCENARIO_SCHEMA_INVALID");
  if (!isObject(scenario)) return [...new Set(diagnostics)].sort();

  const {artifacts, expectations, mutation_lineage: lineage, operation, recomposition} = scenario;
  if (isObject(artifacts) && isObject(expectations) && isObject(lineage) && isObject(operation)) {
    const lineageMatches = lineage.operation_ref === operation.operation_id
      && lineage.base_ref === artifacts.base?.artifact_id
      && lineage.mutant_ref === artifacts.mutant?.artifact_id
      && lineage.pre_expectation_ref === expectations.pre?.expectation_id
      && lineage.post_expectation_ref === expectations.post?.expectation_id;
    if (!lineageMatches) diagnostics.push("APE_SCENARIO_LINEAGE_INVALID");
    if (expectations.pre?.expectation_id !== expectations.post?.expectation_id
      || expectations.pre?.sha256 !== expectations.post?.sha256
      || expectations.pre?.immutable !== true
      || expectations.post?.immutable !== true) {
      diagnostics.push("BTE_EXPECTATION_REWRITTEN");
    }
  }

  const partitions = Array.isArray(recomposition?.partitions) ? recomposition.partitions : [];
  for (let leftIndex = 0; leftIndex < partitions.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < partitions.length; rightIndex += 1) {
      const left = partitions[leftIndex].scope;
      const right = partitions[rightIndex].scope;
      if (left?.resource_ref === right?.resource_ref && left.start < right.end && right.start < left.end) {
        diagnostics.push("BTE_RECOMPOSITION_OVERLAP");
      }
    }
  }

  const frozenCases = Array.isArray(scenario.frozen_cases) ? scenario.frozen_cases : [];
  const results = Array.isArray(scenario.results) ? scenario.results : [];
  const joins = Array.isArray(scenario.case_result_join) ? scenario.case_result_join : [];
  const caseById = new Map(frozenCases.map((item) => [item.case_id, item]));
  const resultById = new Map(results.map((item) => [item.result_id, item]));
  const caseJoinCounts = new Map(frozenCases.map((item) => [item.case_id, 0]));
  const resultJoinCounts = new Map(results.map((item) => [item.result_id, 0]));
  for (const joinEntry of joins) {
    if (caseJoinCounts.has(joinEntry.case_ref)) caseJoinCounts.set(joinEntry.case_ref, caseJoinCounts.get(joinEntry.case_ref) + 1);
    else diagnostics.push("BTE_RECOMPOSITION_EXTRA");
    if (resultJoinCounts.has(joinEntry.result_ref)) resultJoinCounts.set(joinEntry.result_ref, resultJoinCounts.get(joinEntry.result_ref) + 1);
    else diagnostics.push("BTE_RECOMPOSITION_EXTRA");
    const frozenCase = caseById.get(joinEntry.case_ref);
    const result = resultById.get(joinEntry.result_ref);
    if (frozenCase && result) {
      if (result.scenario_ref !== scenario.scenario_id
        || result.input_ref !== frozenCase.input_ref
        || result.expectation_ref !== frozenCase.expectation_ref) {
        diagnostics.push("APE_SCENARIO_JOIN_MISMATCH");
      }
      if (result.observed_diagnostic !== frozenCase.expected_diagnostic
        || !same(result.observed_delta, frozenCase.expected_delta)) {
        diagnostics.push("APE_SCENARIO_RESULT_MISMATCH");
      }
    }
  }
  if ([...caseJoinCounts.values()].some((count) => count === 0)
    || [...resultJoinCounts.values()].some((count) => count === 0)) {
    diagnostics.push("BTE_RECOMPOSITION_MISSING");
  }
  if ([...caseJoinCounts.values()].some((count) => count > 1)
    || [...resultJoinCounts.values()].some((count) => count > 1)) {
    diagnostics.push("BTE_RECOMPOSITION_EXTRA");
  }
  if (duplicateValues(frozenCases.map(({case_id}) => case_id)).length > 0
    || duplicateValues(results.map(({result_id}) => result_id)).length > 0
    || duplicateValues(partitions.map(({partition_id}) => partition_id)).length > 0) {
    diagnostics.push("APE_SCENARIO_SCHEMA_INVALID");
  }
  return [...new Set(diagnostics)].sort();
};

const [schema, fixtures, expected] = await Promise.all([
  loadJson(schemaPath),
  loadJson(casesPath),
  loadJson(expectedPath),
]);
if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema"
  || schema.$id !== "https://domainspec.local/contracts/evaluation-scenario.schema.json"
  || schema.properties?.authority_effect?.const !== "none") {
  throw new Error("evaluation scenario schema identity or authority boundary invalid");
}
if (fixtures.authority_effect !== "none") throw new Error("fixture authority_effect must be none");
if (duplicateValues(fixtures.cases.map(({case_id}) => case_id)).length > 0) throw new Error("duplicate fixture case ids");

const actual = {
  schema_version: "evaluation-scenario-evaluations.v1",
  cases: fixtures.cases.map((fixture) => {
    const diagnostics = validateScenario(fixture.scenario);
    return {
      case_id: fixture.case_id,
      verdict: diagnostics.length === 0 ? "pass" : "fail",
      diagnostics,
    };
  }),
  represented_bte_blockers: [
    "BTE_RECOMPOSITION_OVERLAP",
    "BTE_EXPECTATION_REWRITTEN",
    "BTE_RECOMPOSITION_MISSING",
  ],
  total_join_enforced: true,
  authority_effect: "none",
};

for (const fixture of fixtures.cases) {
  const observed = actual.cases.find(({case_id}) => case_id === fixture.case_id);
  if (observed.verdict !== fixture.expected.verdict || !same(observed.diagnostics, fixture.expected.diagnostics)) {
    throw new Error(`${fixture.case_id} differs from its inline expectation`);
  }
}
if (!same(actual, expected)) throw new Error("evaluation scenario matrix differs from expected output");
process.stdout.write(`${JSON.stringify(actual, null, 2)}\n`);
