#!/usr/bin/env node

import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const packageRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(packageRoot, "../../../..");
const temporaryRoot = await mkdtemp(resolve(tmpdir(), "domainspec-form-decisions-"));

const cases = [
  {
    id: "enum-owner-scope-proof-inflation",
    expected: "ENUM_DECISION_SOURCE_BOUNDARY",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "decisions/W1-ENUM-001.json");
      const decision = JSON.parse(await readFile(path, "utf8"));
      decision.decision_source.independent_scope_proof = true;
      await writeFile(path, `${JSON.stringify(decision, null, 2)}\n`);
    }
  },
  {
    id: "enum-canonical-architecture-collapse",
    expected: "ENUM_ARCHITECTURE_IDENTITY",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "decisions/W1-ENUM-001.json");
      const decision = JSON.parse(await readFile(path, "utf8"));
      decision.portable_architecture.type_id = "architecture.Enum";
      await writeFile(path, `${JSON.stringify(decision, null, 2)}\n`);
    }
  },
  {
    id: "enum-runtime-composition",
    expected: "ENUM_COMPOSITION_CONTRACT",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "decisions/W1-ENUM-001.json");
      const decision = JSON.parse(await readFile(path, "utf8"));
      decision.composition_contract.resolution_stage = "runtime-open-extension";
      await writeFile(path, `${JSON.stringify(decision, null, 2)}\n`);
    }
  },
  {
    id: "enum-duplicate-value-admitted",
    expected: "ENUM_COMPOSITION_CONTRACT",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "decisions/W1-ENUM-001.json");
      const decision = JSON.parse(await readFile(path, "utf8"));
      decision.composition_contract.duplicate_values = "allow";
      await writeFile(path, `${JSON.stringify(decision, null, 2)}\n`);
    }
  },
  {
    id: "enum-composition-endpoint-collapse",
    expected: "ENUM_RELATION_MODEL",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "decisions/W1-ENUM-001.json");
      const decision = JSON.parse(await readFile(path, "utf8"));
      const relation = decision.portable_architecture.relation_contracts.find(({ relation_id }) => relation_id === "architecture.composed_from");
      relation.target_types = ["architecture.EnumImplementation"];
      await writeFile(path, `${JSON.stringify(decision, null, 2)}\n`);
    }
  },
  {
    id: "enum-unknown-wire-admitted",
    expected: "ENUM_WIRE_CONTRACT",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "decisions/W1-ENUM-001.json");
      const decision = JSON.parse(await readFile(path, "utf8"));
      decision.wire_contract.unknown_wire_value = "construct-member";
      await writeFile(path, `${JSON.stringify(decision, null, 2)}\n`);
    }
  },
  {
    id: "enum-python-string-boundary",
    expected: "ENUM_LANGUAGE_TARGETS",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "decisions/W1-ENUM-001.json");
      const decision = JSON.parse(await readFile(path, "utf8"));
      const python = decision.language_target_realizations.find(({ language }) => language === "python");
      python.form_id = "python.str-enum-class";
      await writeFile(path, `${JSON.stringify(decision, null, 2)}\n`);
    }
  },
  {
    id: "value-object-owner-scope-proof-inflation",
    expected: "VALUE_DECISION_SOURCE_BOUNDARY",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "decisions/W1-VALUE-OBJECT-001.json");
      const decision = JSON.parse(await readFile(path, "utf8"));
      decision.decision_source.independent_scope_proof = true;
      await writeFile(path, `${JSON.stringify(decision, null, 2)}\n`);
    }
  },
  {
    id: "value-object-per-call-validator-bypass",
    expected: "VALUE_VALIDATOR_CONTRACT",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "decisions/W1-VALUE-OBJECT-001.json");
      const decision = JSON.parse(await readFile(path, "utf8"));
      decision.validator_contract.per_creation_arbitrary_validator = "allowed";
      await writeFile(path, `${JSON.stringify(decision, null, 2)}\n`);
    }
  },
  {
    id: "value-object-partial-tuple-equality",
    expected: "VALUE_EQUALITY_HASH_CONTRACT",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "decisions/W1-VALUE-OBJECT-001.json");
      const decision = JSON.parse(await readFile(path, "utf8"));
      decision.equality_hash_contract.equality_basis = "selected fields only";
      await writeFile(path, `${JSON.stringify(decision, null, 2)}\n`);
    }
  },
  {
    id: "value-object-extension-replaces-equality",
    expected: "VALUE_EXTENSION_CONTRACT",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "decisions/W1-VALUE-OBJECT-001.json");
      const decision = JSON.parse(await readFile(path, "utf8"));
      decision.factory_extension_contract.may_not = decision.factory_extension_contract.may_not.filter((value) => value !== "replace equality or hashing");
      await writeFile(path, `${JSON.stringify(decision, null, 2)}\n`);
    }
  },
  {
    id: "value-object-nested-reference-equality",
    expected: "VALUE_NESTED_CONTRACT",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "decisions/W1-VALUE-OBJECT-001.json");
      const decision = JSON.parse(await readFile(path, "utf8"));
      decision.equality_hash_contract.nested_values = "use host object equality";
      await writeFile(path, `${JSON.stringify(decision, null, 2)}\n`);
    }
  },
  {
    id: "value-object-unowned-component-domain",
    expected: "VALUE_COMPONENT_DOMAIN",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "decisions/W1-VALUE-OBJECT-001.json");
      const decision = JSON.parse(await readFile(path, "utf8"));
      decision.equality_hash_contract.component_domain.status = "ambient-language-behavior-accepted";
      await writeFile(path, `${JSON.stringify(decision, null, 2)}\n`);
    }
  },
  {
    id: "entity-mapping-decision-byte-drift",
    expected: "MAPPING_DECISION_DIGEST",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "decisions/W1-ENTITY-001.json");
      const decision = JSON.parse(await readFile(path, "utf8"));
      decision.selected_option_label = `${decision.selected_option_label} drift`;
      await writeFile(path, `${JSON.stringify(decision, null, 2)}\n`);
    }
  },
  {
    id: "entity-per-call-validator-bypass",
    expected: "ENTITY_VALIDATOR_CONTRACT",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "decisions/W1-ENTITY-001.json");
      const decision = JSON.parse(await readFile(path, "utf8"));
      decision.validator_contract.per_creation_arbitrary_validator = "allowed";
      await writeFile(path, `${JSON.stringify(decision, null, 2)}\n`);
    }
  },
  {
    id: "entity-factory-extension-override",
    expected: "ENTITY_EXTENSION_CONTRACT",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "decisions/W1-ENTITY-001.json");
      const decision = JSON.parse(await readFile(path, "utf8"));
      decision.factory_extension_contract.mode = "override";
      await writeFile(path, `${JSON.stringify(decision, null, 2)}\n`);
    }
  },
  {
    id: "entity-decision-gate-request-drift",
    expected: "MAPPING_PREFILTER_REPLAY",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "receipts/W1-ENTITY-OPTION-ADMISSIBILITY-REQUEST.json");
      const request = JSON.parse(await readFile(path, "utf8"));
      request.candidates[0].label = `${request.candidates[0].label} drift`;
      await writeFile(path, `${JSON.stringify(request, null, 2)}\n`);
    }
  },
  {
    id: "kernel-decision-byte-drift",
    expected: "KERNEL_DECISION_DIGEST",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "decisions/W0-KERNEL-POLICY-001.json");
      const decision = JSON.parse(await readFile(path, "utf8"));
      decision.selected_option_label = `${decision.selected_option_label} drift`;
      await writeFile(path, `${JSON.stringify(decision, null, 2)}\n`);
    }
  },
  {
    id: "kernel-request-receipt-replay-drift",
    expected: "KERNEL_PREFILTER_REPLAY",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "receipts/W0-OPTION-ADMISSIBILITY-REQUEST.json");
      const request = JSON.parse(await readFile(path, "utf8"));
      request.candidates[0].label = `${request.candidates[0].label} drift`;
      await writeFile(path, `${JSON.stringify(request, null, 2)}\n`);
    }
  },
  {
    id: "kernel-receipt-route-collapse",
    expected: "KERNEL_GATE_ROUTE",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "receipts/W0-OPTION-ADMISSIBILITY.json");
      const receipt = JSON.parse(await readFile(path, "utf8"));
      receipt.routeOutcome = "direct";
      receipt.decisionGateRequired = false;
      receipt.presentedOptionIds = [];
      receipt.directOptionId = "W0-A-STRICT-DIGEST-BOUND";
      await writeFile(path, `${JSON.stringify(receipt, null, 2)}\n`);
    }
  },
  {
    id: "kernel-root-selection-mismatch",
    expected: "KERNEL_SELECTION",
    mutate: ({ matrix }) => {
      matrix.campaign_kernel_binding.selected_option_id = "W0-C-DEFER";
    }
  },
  {
    id: "kernel-clause-omission",
    expected: "KERNEL_CLAUSES",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "decisions/W0-KERNEL-POLICY-001.json");
      const decision = JSON.parse(await readFile(path, "utf8"));
      decision.accepted_clauses.pop();
      await writeFile(path, `${JSON.stringify(decision, null, 2)}\n`);
    }
  },
  {
    id: "kernel-authority-widening",
    expected: "KERNEL_AUTHORITY",
    mutate: async ({ caseRoot }) => {
      const path = resolve(caseRoot, "decisions/W0-KERNEL-POLICY-001.json");
      const decision = JSON.parse(await readFile(path, "utf8"));
      decision.authority_effect = "promotion";
      await writeFile(path, `${JSON.stringify(decision, null, 2)}\n`);
    }
  },
  {
    id: "owner-decided-without-mapping-bytes",
    expected: "OWNER_DECISION_REF",
    mutate: ({ matrix }) => {
      const decision = matrix.decisions.find(({ meta_type_id }) => meta_type_id === "DS-D1.4");
      decision.decision_state = "owner-decided";
      decision.state_history = ["inventoried", "definition-ready", "architecture-form-proposed", "language-forms-proposed", "tension-reviewed", "owner-decided"];
      decision.architecture_form.decision_status = "owner-decided";
      decision.architecture_mapping_decision_ref = null;
    }
  },
  {
    id: "criterion-content-drift",
    expected: "CRITERION_DIGEST",
    mutate: ({ matrix }) => {
      matrix.decisions[0].canonical_ref.criterion_sha256 = "0".repeat(64);
    }
  },
  {
    id: "illegal-state-jump",
    expected: "STATE_HISTORY_LEGAL",
    mutate: ({ matrix }) => {
      matrix.decisions[0].state_history = ["inventoried", "architecture-form-proposed"];
    }
  },
  {
    id: "relation-form-without-relation-proof",
    expected: "RELATION_PROOF",
    mutate: ({ matrix }) => {
      const decision = matrix.decisions.find(({ meta_type_id }) => meta_type_id === "DS-D1.8");
      decision.proof_requirements.required_evidence_classes = decision.proof_requirements.required_evidence_classes.filter((value) => value !== "relation-test");
    }
  },
  {
    id: "reordered-canonical-source",
    expected: "SOURCE_REF_ORDER",
    mutate: ({ matrix }) => {
      [matrix.source_refs[0], matrix.source_refs[1]] = [matrix.source_refs[1], matrix.source_refs[0]];
    }
  },
  {
    id: "w0-acceptance-cannot-admit-ready-entry",
    expected: "JSON_SCHEMA",
    mutate: ({ queue }) => {
      queue.blocked = queue.blocked.filter(({ meta_type_id }) => meta_type_id !== "DS-D1.1");
      queue.ready.push({ meta_type_id: "DS-D1.1" });
    }
  }
];

const results = [];
try {
  for (const testCase of cases) {
    const caseRoot = resolve(temporaryRoot, testCase.id);
    await cp(packageRoot, caseRoot, { recursive: true });
    const matrixPath = resolve(caseRoot, "FORM-DECISION-MATRIX.json");
    const queuePath = resolve(caseRoot, "IMPLEMENTATION-QUEUE.json");
    const matrix = JSON.parse(await readFile(matrixPath, "utf8"));
    const queue = JSON.parse(await readFile(queuePath, "utf8"));
    await testCase.mutate({ matrix, queue, caseRoot });
    await writeFile(matrixPath, `${JSON.stringify(matrix, null, 2)}\n`);
    await writeFile(queuePath, `${JSON.stringify(queue, null, 2)}\n`);
    const run = spawnSync(process.execPath, [resolve(caseRoot, "validate-form-decisions.mjs")], {
      cwd: repositoryRoot,
      encoding: "utf8",
      env: { ...process.env, DOMAINSPEC_REPOSITORY_ROOT: repositoryRoot }
    });
    const receipt = JSON.parse(run.stdout);
    const observedCodes = receipt.errors.map(({ code }) => code);
    const pass = run.status !== 0 && receipt.status === "block" && observedCodes.includes(testCase.expected);
    results.push({ id: testCase.id, expected_code: testCase.expected, observed_codes: observedCodes, status: pass ? "pass" : "fail" });
  }
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

const failures = results.filter(({ status }) => status === "fail");
const receipt = {
  schema_version: "domainspec-ontology-form-validator-self-test/v1",
  status: failures.length === 0 ? "pass" : "block",
  cases: results,
  authority_effect: "none"
};
process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
process.exitCode = failures.length === 0 ? 0 : 1;
