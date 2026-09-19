#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  lstatSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

const CANDIDATE_PATH =
  "projects/domainspec-v2/development/remaining-meta-types/candidates/operation.json";
const TERMINAL_RECEIPT_PATH =
  "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-OP-010.json";
const CANDIDATE_VALIDATOR_PATH =
  "projects/domainspec-v2/development/remaining-meta-types/active-types/operation/admission/validate-candidate.mjs";
const ADMISSION_VALIDATOR_PATH =
  "projects/domainspec-v2/development/remaining-meta-types/active-types/operation/admission/validate-admission.mjs";
const EPOCH_ID = "WP-RMT-002/S1/2026-08-16";
const CONTRACT_DIGEST =
  "75fd21cd605735b9ca76ed42e46d126850b6c94ea976f55347aa35fd61d530b7";
const REGISTRY_PATH =
  "projects/domainspec-v2/impl/architecture-conformance/factory/registry/factory-node-registry-v1.ts";
const ONTOLOGY_PATH =
  "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json";
const REQUEST_PATH =
  "projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-operation-wp-rmt-002.request.json";
const HOSTILE_CATALOGUE_PATH =
  "projects/domainspec-v2/development/refinement-runs/" +
  "20260814T193343Z-active-meta-type-implementations/refreshes/" +
  "20260821T023424Z-wp-rmt-002-integrated-reuse-refresh/staged/" +
  "HOSTILE-CATALOGUE.json";
const S1_HOSTILE_IDS = [
  "s1/before-state-write-failure",
  "s1/between-state-and-outbox-failure",
  "s1/missing-member",
  "s1/mixed-commit",
  "s1/rollback-after-commit",
];

const EXTERNAL_EFFECTS = {
  network: false,
  git_stage: false,
  git_commit: false,
  git_push: false,
  registry_write: false,
  ontology_mutation: false,
  promotion: false,
  publication: false,
  release: false,
  deployment: false,
  production: false,
};

const TARGETS = [
  {
    language: "typescript",
    form_id: "typescript.bound-operation-function",
    provider_id: "operation-typescript-v1",
    registered: false,
    source: {
      path: "projects/domainspec-v2/impl/architecture-conformance/targets/typescript/operation-v1.ts",
      sha256: "abbd57adf9587ef4436524148482a9ab5b92954d49e61dc444f57036874679f4",
      size_bytes: 7824,
    },
    provider: {
      path: "projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/operation-typescript-v1.ts",
      sha256: "1bc82cc0284069bfaa115f4bd51e423e259c6b38428a6a8d980132e9ba05a06f",
      size_bytes: 2150,
    },
    binding: {
      path: "projects/domainspec-v2/impl/architecture-conformance/realizations/operation/typescript/state-changing-v1/typescript-binding.json",
      sha256: "c54431ee5d946415df30fffab71528df1928bc8b8f2bdfb49ccc6df7784952b1",
      size_bytes: 9655,
    },
  },
  {
    language: "python",
    form_id: "python.bound-operation-function",
    provider_id: "operation-python-v1",
    registered: false,
    source: {
      path: "projects/domainspec-v2/impl/architecture-conformance/targets/python/remaining_types/operation_v1.py",
      sha256: "d5783a8c8e52971036efd3e230ad83e7379050da63ae6383533fe9f917406d49",
      size_bytes: 7879,
    },
    provider: {
      path: "projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/operation-python-v1.ts",
      sha256: "04c5931e9daa3a281f49d506889058df991170f5f21b8766a5b48d7ff2f9a967",
      size_bytes: 4504,
    },
    binding: {
      path: "projects/domainspec-v2/impl/architecture-conformance/realizations/operation/python/state-changing-v1/python-binding.json",
      sha256: "15545ea614fd9521b53f8f2605fcefbce8d6be334bd9909a7f9271cd1d6774d2",
      size_bytes: 9900,
    },
  },
  {
    language: "rust",
    form_id: "rust.bound-operation-function",
    provider_id: "operation-rust-v1",
    registered: false,
    source: {
      path: "projects/domainspec-v2/impl/architecture-conformance/targets/rust/src/remaining_types/operation_v1.rs",
      sha256: "49723621b79c30372b9871f1ff09a595aff0a88f63d58c5dad8ce1ca7edbdb62",
      size_bytes: 10409,
    },
    provider: {
      path: "projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/operation-rust-v1.ts",
      sha256: "c34962ceef4fa5eabd6ccef9f7df100e31e3296ae7beef1f68d19aeb317f3629",
      size_bytes: 3928,
    },
    binding: {
      path: "projects/domainspec-v2/impl/architecture-conformance/realizations/operation/rust/state-changing-v1/rust-binding.json",
      sha256: "e3ab4c0f5c3cae3edebc136eea34c6277214cb5e9a1878d81bad73ff07623db2",
      size_bytes: 9616,
    },
  },
];

const RECEIPTS = [
  {
    key: "parity_receipt",
    swu_id: "RMT-OP-006",
    stage: "parity",
    schema_version: "domainspec.remaining-meta-type-operation-parity-receipt/v1",
    path: "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-OP-006.json",
    predecessor: null,
    material_paths: [
      "projects/domainspec-v2/impl/architecture-conformance/acceptance/operation/wp-rmt-002/parity/",
    ],
    prototype: {
      path: ".task-session/runs/rmt-op-006-20260820T230000Z/PROTOTYPE-VALIDATION.json",
      sha256: "3f77ea2b6b9207f40c39f509bf2e23244879b07d87fe04ba1d03533ee094b82b",
      size_bytes: 6833,
    },
    files: [
      ["projects/domainspec-v2/impl/architecture-conformance/acceptance/operation/wp-rmt-002/parity/evaluate-operation-parity.test.ts", "9a075be3e8f5c55080cdce11e05b36a2bf8e3a9ac3e4d31562a26bd8bc5bd135", 12945],
      ["projects/domainspec-v2/impl/architecture-conformance/acceptance/operation/wp-rmt-002/parity/evaluate-operation-parity.ts", "d3e15649819d7c95c607679be4e2dcf61f938030a5c7862ec07a4a6b48a5d36d", 33412],
      ["projects/domainspec-v2/impl/architecture-conformance/acceptance/operation/wp-rmt-002/parity/live-operation-parity.test.ts", "a830f1e19134830db139639b9babf894ddadbef0e859068ead162af6bb0dda9c", 8129],
    ],
  },
  {
    key: "replay_receipt",
    swu_id: "RMT-OP-007",
    stage: "replay",
    schema_version: "domainspec.remaining-meta-type-operation-replay-receipt/v1",
    path: "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-OP-007.json",
    predecessor: "RMT-OP-006",
    material_paths: [
      "projects/domainspec-v2/impl/architecture-conformance/acceptance/operation/wp-rmt-002/replay/",
      "projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-operation-wp-rmt-002.request.json",
      "projects/domainspec-v2/impl/architecture-conformance/factory/tests/rmt-operation-wp-rmt-002.test.ts",
    ],
    prototype: {
      path: ".task-session/runs/rmt-op-007-20260820T220143Z/PROTOTYPE-VALIDATION.json",
      sha256: "0162578c89a9776f4412a283bd848debcace606e957214dda9b232942133f311",
      size_bytes: 7916,
    },
    files: [
      ["projects/domainspec-v2/impl/architecture-conformance/acceptance/operation/wp-rmt-002/replay/execute-operation-replay.ts", "639f299f51779629bb3f6918e19abe0c72f42c16d96c16a005433504bd2ab23d", 6407],
      ["projects/domainspec-v2/impl/architecture-conformance/acceptance/operation/wp-rmt-002/replay/operation-replay-v1.ts", "8672fb6af7d3bf9a9a6c1d4b4a1fbb85c47a4c93137e07e3c4ac64aff76ac6c6", 11235],
      ["projects/domainspec-v2/impl/architecture-conformance/acceptance/operation/wp-rmt-002/replay/run-operation-replay.ts", "446df7b31a7c642ecdbbab7e16b0a034dce7a9738f5f44ad9051a6f1818a4e0e", 26546],
      ["projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-operation-wp-rmt-002.request.json", "b7fe9598fdb169a4775518cc8d4fd517dad41648805ff09c171e53bf7af37cf0", 38396],
      ["projects/domainspec-v2/impl/architecture-conformance/factory/tests/rmt-operation-wp-rmt-002.test.ts", "dfefb341898e3f3df266f083006b89985e9f5f4b170e2b93d8e9d5abfc8297be", 9657],
    ],
  },
  {
    key: "relations_receipt",
    swu_id: "RMT-OP-008",
    stage: "relations",
    schema_version: "domainspec.remaining-meta-type-operation-relations-receipt/v1",
    path: "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-OP-008.json",
    predecessor: "RMT-OP-007",
    material_paths: [
      "projects/domainspec-v2/impl/architecture-conformance/acceptance/operation/wp-rmt-002/relations/",
    ],
    prototype: {
      path: ".task-session/runs/rmt-op-008-20260820T230532Z/PROTOTYPE-VALIDATION.json",
      sha256: "f07f85c05883ea4b3a1810eae340a5eaba8ffb9e9483221b307c61b3a76059d2",
      size_bytes: 9258,
    },
    files: [
      ["projects/domainspec-v2/impl/architecture-conformance/acceptance/operation/wp-rmt-002/relations/operation-relation-binding.json", "24a0527d7e938a3ad8b2a31fd0a1308a2e320bd1b8dc7324fd051468374f916e", 11693],
      ["projects/domainspec-v2/impl/architecture-conformance/acceptance/operation/wp-rmt-002/relations/operation-relation-proof-v1.ts", "2c92481cd6a55e1d34bae1521e4606b16e49b09f626279c4cf6cb47d7c05dbe5", 33805],
      ["projects/domainspec-v2/impl/architecture-conformance/acceptance/operation/wp-rmt-002/relations/operation-relation-proof.test.ts", "ffb00f626a372512aeccf4a72de48bcd4cb68184e0bdb7ebf8c468504b5e0894", 14621],
    ],
  },
  {
    key: "registry_negative_receipt",
    swu_id: "RMT-OP-009",
    stage: "registry-negative",
    schema_version: "domainspec.remaining-meta-type-operation-registry-negative-receipt/v1",
    path: "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-OP-009.json",
    predecessor: "RMT-OP-008",
    material_paths: [
      "projects/domainspec-v2/impl/architecture-conformance/acceptance/operation/wp-rmt-002/registry-negative/",
    ],
    prototype: {
      path: ".task-session/runs/rmt-op-009-20260820T234235Z/PROTOTYPE-VALIDATION.json",
      sha256: "c836f37277df6a2153ec26911342f25c48b0c69ef05fc39e98e0719f99440a01",
      size_bytes: 5359,
    },
    files: [
      ["projects/domainspec-v2/impl/architecture-conformance/acceptance/operation/wp-rmt-002/registry-negative/evaluate-operation-registry-negative.test.ts", "2454e4abb704afba9938c3c98a796bbf838a0dec0eb6aff8fe4d2b2a96e221aa", 13618],
      ["projects/domainspec-v2/impl/architecture-conformance/acceptance/operation/wp-rmt-002/registry-negative/evaluate-operation-registry-negative.ts", "703b45ef8925a2a40916360ceb43f14e0874634f084ce597573ad87a08247607", 36778],
      ["projects/domainspec-v2/impl/architecture-conformance/acceptance/operation/wp-rmt-002/registry-negative/operation-registry-negative-binding.json", "861d170de263882f8bae0ae58dc580337e220699af89fac121bc3902672cf1d1", 7872],
    ],
  },
].map((receipt) => ({
  ...receipt,
  files: receipt.files.map(([path, sha256, size_bytes]) => ({ path, sha256, size_bytes })),
}));

const checks = [];

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function passed(id) {
  checks.push(id);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function equal(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function exactKeys(value, keys, label) {
  check(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  check(equal(Object.keys(value).sort(), [...keys].sort()), `${label} keys mismatch`);
}

function validateJsonGrammarAndDuplicateKeys(text, label) {
  let cursor = 0;
  const whitespace = /\s/;

  function skipWhitespace() {
    while (cursor < text.length && whitespace.test(text[cursor])) cursor += 1;
  }

  function parseString() {
    check(text[cursor] === '"', `${label} expected string at byte ${cursor}`);
    const start = cursor;
    cursor += 1;
    while (cursor < text.length) {
      if (text[cursor] === "\\") {
        cursor += 2;
        continue;
      }
      if (text[cursor] === '"') {
        cursor += 1;
        return JSON.parse(text.slice(start, cursor));
      }
      cursor += 1;
    }
    throw new Error(`${label} has an unterminated string`);
  }

  function parseValue() {
    skipWhitespace();
    const token = text[cursor];
    if (token === "{") return parseObject();
    if (token === "[") return parseArray();
    if (token === '"') return parseString();
    const start = cursor;
    while (cursor < text.length && !/[\s,\]}]/.test(text[cursor])) cursor += 1;
    check(cursor > start, `${label} expected value at byte ${cursor}`);
    JSON.parse(text.slice(start, cursor));
    return undefined;
  }

  function parseObject() {
    cursor += 1;
    skipWhitespace();
    const keys = new Set();
    if (text[cursor] === "}") {
      cursor += 1;
      return;
    }
    while (cursor < text.length) {
      skipWhitespace();
      const key = parseString();
      check(!keys.has(key), `${label} has duplicate key ${key}`);
      keys.add(key);
      skipWhitespace();
      check(text[cursor] === ":", `${label} expected colon at byte ${cursor}`);
      cursor += 1;
      parseValue();
      skipWhitespace();
      if (text[cursor] === "}") {
        cursor += 1;
        return;
      }
      check(text[cursor] === ",", `${label} expected comma at byte ${cursor}`);
      cursor += 1;
    }
    throw new Error(`${label} has an unterminated object`);
  }

  function parseArray() {
    cursor += 1;
    skipWhitespace();
    if (text[cursor] === "]") {
      cursor += 1;
      return;
    }
    while (cursor < text.length) {
      parseValue();
      skipWhitespace();
      if (text[cursor] === "]") {
        cursor += 1;
        return;
      }
      check(text[cursor] === ",", `${label} expected comma at byte ${cursor}`);
      cursor += 1;
    }
    throw new Error(`${label} has an unterminated array`);
  }

  parseValue();
  skipWhitespace();
  check(cursor === text.length, `${label} has trailing JSON content`);
}

function resolveInside(root, path, label) {
  check(typeof path === "string" && path.length > 0, `${label} path is missing`);
  check(!isAbsolute(path) && !path.includes("\0") && !path.split("/").includes(".."), `${label} path escapes repository root`);
  const absolute = resolve(root, path);
  const rel = relative(root, absolute);
  check(!rel.startsWith("..") && !isAbsolute(rel), `${label} resolves outside repository root`);
  return absolute;
}

function readBytes(root, path, label) {
  const absolute = resolveInside(root, path, label);
  const stat = lstatSync(absolute);
  check(stat.isFile() && !stat.isSymbolicLink(), `${label} is not a regular non-symlink file`);
  const canonical = realpathSync(absolute);
  const rel = relative(root, canonical);
  check(!rel.startsWith("..") && !isAbsolute(rel), `${label} real path escapes repository root`);
  return { absolute, bytes: readFileSync(absolute), stat };
}

function readStrictJson(root, path, label) {
  const artifact = readBytes(root, path, label);
  const text = new TextDecoder("utf-8", { fatal: true }).decode(artifact.bytes);
  check(text.endsWith("\n"), `${label} lacks a final newline`);
  check(!text.split("\n").some((line) => /[ \t]+$/.test(line)), `${label} has trailing whitespace`);
  validateJsonGrammarAndDuplicateKeys(text, label);
  return { ...artifact, value: JSON.parse(text) };
}

function validateRef(root, ref, expectedPath, label) {
  exactKeys(ref, ["path", "sha256", "size_bytes"], label);
  check(ref.path === expectedPath, `${label} path mismatch`);
  check(/^[0-9a-f]{64}$/.test(ref.sha256), `${label} SHA-256 shape mismatch`);
  check(Number.isInteger(ref.size_bytes) && ref.size_bytes > 0, `${label} size mismatch`);
  const artifact = readBytes(root, ref.path, label);
  check(artifact.bytes.length === ref.size_bytes, `${label} size drift`);
  check(sha256(artifact.bytes) === ref.sha256, `${label} hash drift`);
  return artifact;
}

function validatePinnedRef(root, ref, expected, label) {
  check(equal(ref, expected), `${label} binding mismatch`);
  return validateRef(root, ref, expected.path, label);
}

function aggregateInventory(files) {
  const rows = [...files]
    .sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)))
    .map((entry) => `${entry.sha256}\t${entry.size_bytes}\t${entry.path}\n`)
    .join("");
  return sha256(Buffer.from(rows, "utf8"));
}

function validateSemanticPlanBinding(binding, label) {
  exactKeys(binding, ["epoch_id", "contract_digest"], label);
  check(binding.epoch_id === EPOCH_ID, `${label} epoch mismatch`);
  check(binding.contract_digest === CONTRACT_DIGEST, `${label} contract digest mismatch`);
}

function validateReceiptRef(root, ref, spec, label) {
  exactKeys(ref, [
    "swu_id",
    "stage",
    "path",
    "sha256",
    "size_bytes",
    "required_result",
    "required_authority_effect",
    "semantic_plan_epoch_id",
    "semantic_contract_digest",
  ], label);
  check(ref.swu_id === spec.swu_id && ref.stage === spec.stage, `${label} identity mismatch`);
  check(ref.path === spec.path, `${label} path mismatch`);
  check(ref.required_result === "pass" && ref.required_authority_effect === "none", `${label} result or authority requirement mismatch`);
  check(ref.semantic_plan_epoch_id === EPOCH_ID && ref.semantic_contract_digest === CONTRACT_DIGEST, `${label} S1 binding mismatch`);
  check(!ref.path.includes("PROTOTYPE-VALIDATION"), `${label} substitutes prototype evidence`);
  return validateRef(root, { path: ref.path, sha256: ref.sha256, size_bytes: ref.size_bytes }, spec.path, label);
}

function validateReceiptProof(receipt, spec) {
  const proof = receipt.proof_closure;
  if (spec.swu_id === "RMT-OP-006") {
    exactKeys(proof, ["direct_provider_ids", "direct_provider_count", "all_direct_providers_unregistered", "portable_semantic_obligations_pass", "same_occurrence_id_across_retry", "native_evidence_retained_separately", "native_hash_byte_comparison", "raw_inputs_immutable", "repeat_execution_digest_stability", "binding_refs_exact", "s1_cross_boundary_controls", "s1_hostile_ids", "s1_proof_owner", "s1_required_residue_observed"], `${spec.swu_id} proof closure`);
    check(equal(proof.direct_provider_ids, TARGETS.map(({ provider_id }) => provider_id)), "RMT-OP-006 provider order mismatch");
    check(proof.direct_provider_count === 3 && proof.all_direct_providers_unregistered === true, "RMT-OP-006 provider evidence mismatch");
    check(proof.portable_semantic_obligations_pass === true && proof.same_occurrence_id_across_retry === true, "RMT-OP-006 portable S1 parity mismatch");
    check(proof.native_evidence_retained_separately === true && proof.native_hash_byte_comparison === false, "RMT-OP-006 native evidence boundary mismatch");
    check(equal(proof.binding_refs_exact, { typescript: "34/34", python: "35/35", rust: "34/34" }), "RMT-OP-006 binding closure mismatch");
    check(proof.s1_cross_boundary_controls === "5/5" && equal(proof.s1_hostile_ids, S1_HOSTILE_IDS) && proof.s1_proof_owner === "RMT-OP-006" && proof.s1_required_residue_observed === true, "RMT-OP-006 S1 cross-boundary closure mismatch");
  } else if (spec.swu_id === "RMT-OP-007") {
    exactKeys(proof, ["input_ref_occurrences", "unique_roles", "unique_paths", "live_hash_and_size_defects", "semantic_request_sha256", "factory_lock_sha256", "factory_run_id", "replay_provider_id", "replay_provider_registered", "direct_operation_providers_registered", "normalized_parity_sha256", "positive_cases", "mutants", "fresh_factory_child_processes", "native_provider_processes", "semantic_direct_child_replay_equal", "parent_nonce_bound", "actual_coordinator_pid_bound", "strict_child_output_decoder", "candidate_workspace_residue_count", "cleanup_failure_is_blocking", "prior_primary_failure_preserved", "acknowledgement_ambiguity_preserves_durable_facts", "s1_cross_boundary_replayed", "s1_semantic_identity_stable"], `${spec.swu_id} proof closure`);
    check(proof.input_ref_occurrences === 109 && proof.unique_roles === 109 && proof.unique_paths === 49 && proof.live_hash_and_size_defects === 0, "RMT-OP-007 source closure mismatch");
    check(proof.replay_provider_registered === false && proof.direct_operation_providers_registered === false, "RMT-OP-007 registry overclaim");
    check(proof.semantic_direct_child_replay_equal === true && proof.parent_nonce_bound === true && proof.actual_coordinator_pid_bound === true, "RMT-OP-007 replay evidence mismatch");
    check(proof.candidate_workspace_residue_count === 0 && proof.cleanup_failure_is_blocking === true && proof.prior_primary_failure_preserved === true, "RMT-OP-007 cleanup evidence mismatch");
    check(proof.acknowledgement_ambiguity_preserves_durable_facts === true, "RMT-OP-007 acknowledgement semantics mismatch");
    check(proof.s1_cross_boundary_replayed === "5/5" && proof.s1_semantic_identity_stable === true, "RMT-OP-007 S1 replay closure mismatch");
  } else if (spec.swu_id === "RMT-OP-008") {
    exactKeys(proof, ["relation_contract_count", "blueprint_relation_count", "materialized_relation_count", "relation_contracts", "relation_hostiles_killed", "s1_handle", "source_role_count", "transitive_input_ref_occurrences", "transitive_unique_paths", "s1_materialized_field_occurrences", "live_relation_materialized", "relation_topology_changed", "ontology_authority_changed", "integrated_refresh_sources_exact"], `${spec.swu_id} proof closure`);
    check(proof.relation_contract_count === 4 && proof.blueprint_relation_count === 4 && proof.materialized_relation_count === 0, "RMT-OP-008 relation accounting mismatch");
    check(Array.isArray(proof.relation_contracts) && proof.relation_contracts.length === 4, "RMT-OP-008 relation set mismatch");
    for (const relation of proof.relation_contracts) {
      exactKeys(relation, ["contract_id", "architecture_direction", "evidence_mode"], "RMT-OP-008 relation");
      check(relation.evidence_mode === "blueprint", "RMT-OP-008 relation materialization overclaim");
    }
    exactKeys(proof.s1_handle, ["schema_id", "fields", "materialized", "evidence_sha256", "publication_authority"], "RMT-OP-008 S1 handle");
    check(equal(proof.s1_handle.fields, ["transaction_id", "effect_group_id", "state_write_id", "outbox_checkpoint_id", "occurrence_id", "commit_outcome"]), "RMT-OP-008 S1 handle fields mismatch");
    check(proof.s1_handle.materialized === false && proof.s1_handle.evidence_sha256 === null && proof.s1_handle.publication_authority === false, "RMT-OP-008 S1 handle overclaim");
    check(proof.s1_materialized_field_occurrences === 0 && proof.live_relation_materialized === false && proof.relation_topology_changed === false && proof.ontology_authority_changed === false, "RMT-OP-008 materialization or authority overclaim");
    check(proof.transitive_input_ref_occurrences === 109 && proof.transitive_unique_paths === 49 && proof.integrated_refresh_sources_exact === true, "RMT-OP-008 integrated source closure mismatch");
  } else {
    exactKeys(proof, ["provider_files_exact", "provider_ids", "canonical_registry", "provider_bindings_retained", "providers_executed", "registry_write", "s1_providers_unregistered", "s1_binding_retained", "integrated_refresh_sources_exact"], `${spec.swu_id} proof closure`);
    check(equal(proof.provider_ids, TARGETS.map(({ provider_id }) => provider_id)), "RMT-OP-009 provider order mismatch");
    exactKeys(proof.canonical_registry, ["path", "sha256", "size_bytes", "provider_imports", "provider_symbols", "runtime_identities", "legacy_typescript_operation_provider_present", "direct_operation_provider_ids_absent", "before_after_bytes_equal", "before_after_stat_equal"], "RMT-OP-009 registry closure");
    check(proof.canonical_registry.path === REGISTRY_PATH && proof.canonical_registry.sha256 === "2497f2e047e023de2738bac4b815e6b0212560dcfc8053982c94f4a529a9f51b" && proof.canonical_registry.size_bytes === 5105, "RMT-OP-009 registry binding mismatch");
    check(proof.canonical_registry.direct_operation_provider_ids_absent === 3 && proof.canonical_registry.legacy_typescript_operation_provider_present === true, "RMT-OP-009 registry identity mismatch");
    check(proof.canonical_registry.before_after_bytes_equal === true && proof.canonical_registry.before_after_stat_equal === true && proof.registry_write === false, "RMT-OP-009 registry mutation evidence mismatch");
    check(proof.s1_providers_unregistered === true && proof.s1_binding_retained === true, "RMT-OP-009 S1 registry boundary mismatch");
    check(equal(proof.provider_bindings_retained, { typescript: "34/34", python: "35/35", rust: "34/34" }) && proof.integrated_refresh_sources_exact === true, "RMT-OP-009 provider binding closure mismatch");
  }
}

function validateCanonicalReceipt(root, ref, spec, priorRef) {
  const artifact = validateReceiptRef(root, ref, spec, `${spec.swu_id} candidate receipt ref`);
  const parsed = readStrictJson(root, spec.path, `${spec.swu_id} canonical receipt`);
  const receipt = parsed.value;
  exactKeys(receipt, ["schema_version", "receipt_id", "captured_at_utc", "work_pack_id", "task_id", "swu_id", "stage", "result", "semantic_plan_binding", "write_scope", "dependency_receipts", "prototype_origin", "material_inventory", "proof_closure", "validation", "failed_attempts_preserved", "external_effects", "successor", "authority_effect", "claim_ceiling"], `${spec.swu_id} canonical receipt`);
  check(receipt.schema_version === spec.schema_version, `${spec.swu_id} receipt schema mismatch`);
  check(receipt.work_pack_id === "WP-RMT-002" && receipt.task_id === "TASK-RMT-OP" && receipt.swu_id === spec.swu_id && receipt.stage === spec.stage, `${spec.swu_id} receipt identity mismatch`);
  check(receipt.result === "pass" && receipt.authority_effect === "none", `${spec.swu_id} result or authority mismatch`);
  validateSemanticPlanBinding(receipt.semantic_plan_binding, `${spec.swu_id} semantic plan binding`);

  exactKeys(receipt.write_scope, ["material_paths", "receipt_path", "receipt_written_last"], `${spec.swu_id} write scope`);
  check(equal(receipt.write_scope.material_paths, spec.material_paths) && receipt.write_scope.receipt_path === spec.path && receipt.write_scope.receipt_written_last === true, `${spec.swu_id} write scope mismatch`);

  if (spec.predecessor === null) {
    check(equal(receipt.dependency_receipts, []), `${spec.swu_id} unexpected dependency receipt`);
  } else {
    check(Array.isArray(receipt.dependency_receipts) && receipt.dependency_receipts.length === 1, `${spec.swu_id} dependency count mismatch`);
    exactKeys(receipt.dependency_receipts[0], ["swu_id", "path", "sha256", "size_bytes", "required_result"], `${spec.swu_id} dependency receipt`);
    check(priorRef && receipt.dependency_receipts[0].swu_id === spec.predecessor && receipt.dependency_receipts[0].path === priorRef.path && receipt.dependency_receipts[0].sha256 === priorRef.sha256 && receipt.dependency_receipts[0].size_bytes === priorRef.size_bytes && receipt.dependency_receipts[0].required_result === "pass", `${spec.swu_id} dependency receipt mismatch`);
  }

  exactKeys(receipt.prototype_origin, ["path", "sha256", "size_bytes", "result", "authority_class", "canonical_receipt_substitute"], `${spec.swu_id} prototype origin`);
  check(receipt.prototype_origin.path === spec.prototype.path && receipt.prototype_origin.sha256 === spec.prototype.sha256 && receipt.prototype_origin.size_bytes === spec.prototype.size_bytes, `${spec.swu_id} prototype provenance mismatch`);
  check(receipt.prototype_origin.result === "pass" && receipt.prototype_origin.authority_class === "candidate-local-provenance-only" && receipt.prototype_origin.canonical_receipt_substitute === false, `${spec.swu_id} prototype authority inflation`);
  const prototype = readStrictJson(root, spec.prototype.path, `${spec.swu_id} prototype provenance`);
  check(prototype.bytes.length === spec.prototype.size_bytes && sha256(prototype.bytes) === spec.prototype.sha256, `${spec.swu_id} prototype provenance drift`);
  check(prototype.value.schema_version === "domainspec.candidate-local-prototype-validation/v1" && prototype.value.result === "pass", `${spec.swu_id} prototype provenance status mismatch`);

  exactKeys(receipt.material_inventory, ["algorithm", "file_count", "size_bytes", "aggregate_sha256", "files"], `${spec.swu_id} material inventory`);
  check(equal(receipt.material_inventory.files, spec.files), `${spec.swu_id} material inventory rows mismatch`);
  check(receipt.material_inventory.file_count === spec.files.length, `${spec.swu_id} material count mismatch`);
  check(receipt.material_inventory.size_bytes === spec.files.reduce((sum, file) => sum + file.size_bytes, 0), `${spec.swu_id} material size mismatch`);
  check(receipt.material_inventory.aggregate_sha256 === aggregateInventory(spec.files), `${spec.swu_id} material aggregate mismatch`);
  let latestMaterialMtime = 0;
  for (const file of spec.files) {
    const live = validatePinnedRef(root, file, file, `${spec.swu_id} material ${file.path}`);
    latestMaterialMtime = Math.max(latestMaterialMtime, live.stat.mtimeMs);
  }
  check(parsed.stat.mtimeMs > latestMaterialMtime, `${spec.swu_id} receipt was not written after its materials`);

  check(Array.isArray(receipt.validation) && receipt.validation.length === 3, `${spec.swu_id} validation set mismatch`);
  exactKeys(receipt.validation[0], ["id", "command", "result", "exit_code", "test_files_passed", "tests_passed"], `${spec.swu_id} focused validation`);
  exactKeys(receipt.validation[1], ["id", "command", "result", "exit_code"], `${spec.swu_id} typecheck validation`);
  const closureKeys = ["id", "result", "files_exact", "prototype_report_used_as_receipt"];
  if (spec.swu_id !== "RMT-OP-006") closureKeys.push("dependency_receipts_exact");
  if (spec.swu_id === "RMT-OP-009") closureKeys.push("canonical_registry_exact");
  exactKeys(receipt.validation[2], closureKeys, `${spec.swu_id} closure validation`);
  for (const validation of receipt.validation) {
    check(validation.result === "pass", `${spec.swu_id} validation did not pass`);
  }
  check(receipt.validation[2].prototype_report_used_as_receipt === false, `${spec.swu_id} validation substitutes prototype authority`);
  check(Array.isArray(receipt.failed_attempts_preserved) && receipt.failed_attempts_preserved.every((entry) => typeof entry === "string" && entry.length > 0), `${spec.swu_id} failed-attempt history missing`);
  check(new Set(receipt.failed_attempts_preserved).size === receipt.failed_attempts_preserved.length, `${spec.swu_id} failed-attempt history contains duplicates`);
  check(equal(receipt.external_effects, EXTERNAL_EFFECTS), `${spec.swu_id} external effects mismatch`);
  exactKeys(receipt.successor, ["swu_id", "state"], `${spec.swu_id} successor`);
  const specIndex = RECEIPTS.findIndex(({ swu_id }) => swu_id === spec.swu_id);
  const expectedSuccessor = specIndex === RECEIPTS.length - 1 ? "RMT-OP-010" : RECEIPTS[specIndex + 1].swu_id;
  check(receipt.successor.swu_id === expectedSuccessor && receipt.successor.state === "canonical-receipt-ready", `${spec.swu_id} successor mismatch`);
  check(typeof receipt.claim_ceiling === "string" && receipt.claim_ceiling.includes("Canonical candidate-stage receipt") && receipt.claim_ceiling.includes("production claim"), `${spec.swu_id} claim ceiling missing`);
  validateReceiptProof(receipt, spec);
  return { artifact, receipt };
}

function validateRequestClosure(root, requestRef) {
  validateRef(root, requestRef, REQUEST_PATH, "candidate source-binding request");
  const request = readStrictJson(root, REQUEST_PATH, "Operation replay request").value;
  exactKeys(request, ["schema_version", "suite_id", "request_id", "purpose", "nodes", "authority_effect", "claim_ceiling"], "Operation replay request");
  check(request.schema_version === "FactoryRunRequest/v1" && request.request_id === "rmt-operation-wp-rmt-002-007", "Operation replay request identity mismatch");
  check(request.authority_effect === "none" && Array.isArray(request.nodes) && request.nodes.length === 1, "Operation replay request authority or node count mismatch");
  const node = request.nodes[0];
  exactKeys(node, ["node_id", "kind", "provider_id", "depends_on", "input_refs", "claim_ceiling"], "Operation replay node");
  check(node.node_id === "operation.replay.wp-rmt-002" && node.provider_id === "operation-wp-rmt-002-replay-v1" && equal(node.depends_on, []), "Operation replay node identity mismatch");
  check(Array.isArray(node.input_refs) && node.input_refs.length === 109, "Operation replay input-ref denominator mismatch");
  const roles = new Set();
  const paths = new Set();
  for (const input of node.input_refs) {
    exactKeys(input, ["role", "ref"], "Operation replay input ref");
    check(typeof input.role === "string" && input.role.length > 0 && !roles.has(input.role), `Operation replay role is missing or duplicate: ${input.role}`);
    roles.add(input.role);
    exactKeys(input.ref, ["path", "sha256"], `Operation replay ref ${input.role}`);
    check(/^[0-9a-f]{64}$/.test(input.ref.sha256), `Operation replay ref ${input.role} SHA-256 shape mismatch`);
    const live = readBytes(root, input.ref.path, `Operation replay ref ${input.role}`);
    check(sha256(live.bytes) === input.ref.sha256, `Operation replay ref ${input.role} hash drift`);
    paths.add(input.ref.path);
  }
  check(roles.size === 109 && paths.size === 49, "Operation replay role/path closure mismatch");
}

function validateTarget(root, target, expected) {
  exactKeys(target, ["language", "form_id", "provider_id", "registered", "source", "provider", "binding"], `candidate ${expected.language} target`);
  check(target.language === expected.language && target.form_id === expected.form_id && target.provider_id === expected.provider_id && target.registered === false, `candidate ${expected.language} target identity mismatch`);
  validatePinnedRef(root, target.source, expected.source, `candidate ${expected.language} source`);
  validatePinnedRef(root, target.provider, expected.provider, `candidate ${expected.language} provider`);
  validatePinnedRef(root, target.binding, expected.binding, `candidate ${expected.language} binding`);
}

function validateOntology(root, ref) {
  const before = validateRef(root, ref, ONTOLOGY_PATH, "candidate ontology baseline");
  const ontology = readStrictJson(root, ONTOLOGY_PATH, "ontology baseline").value;
  check(ontology.schema_version === "domainspec-architecture-property-ontology/v2" && ontology.status === "candidate" && ontology.authority_effect === "none", "ontology lifecycle or authority mismatch");
  check(Array.isArray(ontology.promotion_records) && ontology.promotion_records.length === 0, "ontology promotion records changed");
  check(Array.isArray(ontology.implementation_instances), "ontology implementation instances missing");
  const operationInstances = ontology.implementation_instances.filter((entry) => entry.canonical_meta_type_ref === "DS-D1.4" || entry.architecture_type_ref === "architecture.OperationImplementation");
  check(operationInstances.length === 0, "Operation was admitted into ontology");
  return { before, promotionRecords: ontology.promotion_records.length, operationInstances: operationInstances.length };
}

function validateRegistry(root, registryRef) {
  const before = validateRef(root, registryRef, REGISTRY_PATH, "candidate registry baseline");
  const source = new TextDecoder("utf-8", { fatal: true }).decode(before.bytes);
  for (const providerId of TARGETS.map(({ provider_id }) => provider_id)) {
    check(!source.includes(providerId), `direct provider is registered: ${providerId}`);
  }
  check(source.includes("typescript-operation-v1"), "legacy TypeScript Operation provider identity is missing");
  return before;
}

function validateTerminalReceipt(root, candidate, candidateArtifact, receiptRefs, ontologySnapshot) {
  const terminalPath = resolveInside(root, TERMINAL_RECEIPT_PATH, "RMT-OP-010 terminal receipt");
  let stat;
  try {
    stat = lstatSync(terminalPath);
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
  check(stat.isFile() && !stat.isSymbolicLink(), "RMT-OP-010 terminal receipt is not a regular non-symlink file");
  const parsed = readStrictJson(root, TERMINAL_RECEIPT_PATH, "RMT-OP-010 terminal receipt");
  const receipt = parsed.value;
  exactKeys(receipt, ["schema_version", "receipt_id", "captured_at_utc", "work_pack_id", "task_id", "swu_id", "stage", "result", "semantic_plan_binding", "candidate_projection", "predecessor_receipts", "validator_artifacts", "ontology_invariance", "lifecycle", "validation", "receipt_written_last", "external_effects", "authority_effect", "claim_ceiling"], "RMT-OP-010 terminal receipt");
  check(receipt.schema_version === "domainspec.meta-type-candidate-projection-receipt/v1", "RMT-OP-010 terminal receipt schema mismatch");
  check(receipt.work_pack_id === "WP-RMT-002" && receipt.task_id === "TASK-RMT-OP" && receipt.swu_id === "RMT-OP-010" && receipt.stage === "candidate", "RMT-OP-010 terminal receipt identity mismatch");
  check(receipt.result === "pass" && receipt.authority_effect === "none", "RMT-OP-010 terminal result or authority mismatch");
  validateSemanticPlanBinding(receipt.semantic_plan_binding, "RMT-OP-010 terminal semantic plan binding");
  exactKeys(receipt.candidate_projection, ["path", "sha256", "size_bytes", "candidate_id", "required_lifecycle"], "RMT-OP-010 candidate projection");
  check(receipt.candidate_projection.path === CANDIDATE_PATH && receipt.candidate_projection.sha256 === sha256(candidateArtifact.bytes) && receipt.candidate_projection.size_bytes === candidateArtifact.bytes.length, "RMT-OP-010 candidate projection binding mismatch");
  check(receipt.candidate_projection.candidate_id === candidate.candidate_id && receipt.candidate_projection.required_lifecycle === "candidate-not-admitted", "RMT-OP-010 candidate lifecycle binding mismatch");
  check(equal(receipt.predecessor_receipts, receiptRefs), "RMT-OP-010 predecessor receipt chain mismatch");
  exactKeys(receipt.validator_artifacts, ["candidate_validator", "admission_validator", "command"], "RMT-OP-010 validator artifacts");
  check(equal(receipt.validator_artifacts.candidate_validator, candidate.validation_surface.candidate_validator) && equal(receipt.validator_artifacts.admission_validator, candidate.validation_surface.admission_validator), "RMT-OP-010 validator binding mismatch");
  check(receipt.validator_artifacts.command === candidate.validation_surface.command, "RMT-OP-010 validation command mismatch");
  exactKeys(receipt.ontology_invariance, ["path", "sha256", "size_bytes", "before_after_bytes_equal", "before_after_stat_equal", "promotion_records_before", "promotion_records_after", "operation_instances_before", "operation_instances_after"], "RMT-OP-010 ontology invariance");
  check(receipt.ontology_invariance.path === ONTOLOGY_PATH && receipt.ontology_invariance.sha256 === candidate.admitted_inputs.ontology.sha256 && receipt.ontology_invariance.size_bytes === candidate.admitted_inputs.ontology.size_bytes, "RMT-OP-010 ontology binding mismatch");
  check(receipt.ontology_invariance.before_after_bytes_equal === true && receipt.ontology_invariance.before_after_stat_equal === true, "RMT-OP-010 ontology changed during projection");
  check(receipt.ontology_invariance.promotion_records_before === 0 && receipt.ontology_invariance.promotion_records_after === 0 && receipt.ontology_invariance.operation_instances_before === 0 && receipt.ontology_invariance.operation_instances_after === 0, "RMT-OP-010 ontology lifecycle inflated");
  check(equal(receipt.lifecycle, candidate.lifecycle), "RMT-OP-010 lifecycle mismatch");
  check(Array.isArray(receipt.validation) && receipt.validation.length === 5, "RMT-OP-010 validation result count mismatch");
  exactKeys(receipt.validation[0], ["id", "command", "result", "exit_code", "terminal_receipt_present"], "RMT-OP-010 pre-terminal validation");
  exactKeys(receipt.validation[1], ["id", "result", "stage_receipts_exact", "live_material_files_exact", "source_binding_occurrences", "source_binding_unique_paths"], "RMT-OP-010 closure validation");
  exactKeys(receipt.validation[2], ["id", "result", "hostiles_rejected", "disposable_overlay_residue_count"], "RMT-OP-010 hostile validation");
  exactKeys(receipt.validation[3], ["id", "command", "result", "exit_code"], "RMT-OP-010 admission continuity validation");
  exactKeys(receipt.validation[4], ["id", "result", "ontology_bytes_equal", "ontology_stat_equal", "registry_bytes_equal", "registry_stat_equal", "promotion_records", "operation_instances"], "RMT-OP-010 invariance validation");
  check(receipt.validation.every((entry) => entry.result === "pass"), "RMT-OP-010 validation result mismatch");
  check(receipt.validation[0].command === candidate.validation_surface.command && receipt.validation[0].exit_code === 0 && receipt.validation[0].terminal_receipt_present === false, "RMT-OP-010 pre-terminal validation evidence mismatch");
  check(receipt.validation[1].stage_receipts_exact === "4/4" && receipt.validation[1].live_material_files_exact === "14/14" && receipt.validation[1].source_binding_occurrences === 109 && receipt.validation[1].source_binding_unique_paths === 49, "RMT-OP-010 closure accounting mismatch");
  check(receipt.validation[2].hostiles_rejected === "19/19" && receipt.validation[2].disposable_overlay_residue_count === 0, "RMT-OP-010 hostile accounting mismatch");
  check(receipt.validation[3].command === `node ${ADMISSION_VALIDATOR_PATH}` && receipt.validation[3].exit_code === 0, "RMT-OP-010 admission continuity evidence mismatch");
  check(receipt.validation[4].ontology_bytes_equal === true && receipt.validation[4].ontology_stat_equal === true && receipt.validation[4].registry_bytes_equal === true && receipt.validation[4].registry_stat_equal === true && receipt.validation[4].promotion_records === 0 && receipt.validation[4].operation_instances === 0, "RMT-OP-010 invariance evidence mismatch");
  check(receipt.receipt_written_last === true && parsed.stat.mtimeMs > candidateArtifact.stat.mtimeMs, "RMT-OP-010 receipt was not written after the candidate");
  check(equal(receipt.external_effects, EXTERNAL_EFFECTS), "RMT-OP-010 external effects mismatch");
  check(typeof receipt.claim_ceiling === "string" && receipt.claim_ceiling.includes("candidate") && !receipt.claim_ceiling.includes("production-ready"), "RMT-OP-010 claim ceiling mismatch");
  const ontologyAfter = readBytes(root, ONTOLOGY_PATH, "ontology post-validation");
  check(sha256(ontologyAfter.bytes) === candidate.admitted_inputs.ontology.sha256 && ontologyAfter.bytes.length === candidate.admitted_inputs.ontology.size_bytes, "ontology bytes changed during validation");
  check(ontologyAfter.stat.size === ontologySnapshot.before.stat.size && ontologyAfter.stat.mtimeMs === ontologySnapshot.before.stat.mtimeMs, "ontology stat changed during validation");
  return true;
}

try {
  const root = realpathSync(process.cwd());
  check(process.argv.length === 3, "usage: validate-candidate.mjs projects/domainspec-v2/development/remaining-meta-types/candidates/operation.json");
  const supplied = process.argv[2];
  check(supplied === CANDIDATE_PATH, "candidate path must be the exact canonical Operation candidate path");
  const candidateArtifact = readStrictJson(root, supplied, "Operation candidate");
  const candidate = candidateArtifact.value;
  exactKeys(candidate, ["schema_version", "candidate_id", "candidate_kind", "work_pack_id", "task_id", "projection_swu_id", "meta_type", "semantic_plan_binding", "projection_source", "admitted_inputs", "architecture_implementation", "targets", "portable_parity", "deterministic_replay", "architecture_relations", "registry_nonmembership", "lifecycle", "publication_class", "proof_projection_policy", "external_effects", "validation_surface", "claim_ceiling"], "Operation candidate");
  check(candidate.schema_version === "domainspec.meta-type-implementation-candidate/v1", "candidate schema mismatch");
  check(candidate.candidate_id === "candidate.settlement.complete-settlement.operation-implementation/v1" && candidate.candidate_kind === "MetaTypeImplementationSlice/v1", "candidate identity mismatch");
  check(candidate.work_pack_id === "WP-RMT-002" && candidate.task_id === "TASK-RMT-OP" && candidate.projection_swu_id === "RMT-OP-010", "candidate work-pack identity mismatch");
  exactKeys(candidate.meta_type, ["id", "label", "category", "plain_language"], "candidate meta type");
  check(equal(candidate.meta_type, { id: "DS-D1.4", label: "Operation", category: "behavioral", plain_language: "A business action that changes system state." }), "candidate meta type mismatch");
  validateSemanticPlanBinding(candidate.semantic_plan_binding, "candidate semantic plan binding");
  passed("candidate-identity-and-s1-binding-exact");

  exactKeys(candidate.projection_source, ["receipt_order", ...RECEIPTS.map(({ key }) => key)], "candidate projection source");
  check(equal(candidate.projection_source.receipt_order, RECEIPTS.map(({ swu_id }) => swu_id)), "candidate receipt order mismatch");
  const receiptRefs = [];
  let priorRef = null;
  for (const spec of RECEIPTS) {
    const ref = candidate.projection_source[spec.key];
    validateCanonicalReceipt(root, ref, spec, priorRef);
    receiptRefs.push(ref);
    priorRef = ref;
  }
  passed("canonical-predecessor-receipts-and-live-materials-exact");

  exactKeys(candidate.admitted_inputs, ["operation_admission", "operation_source_inventory", "hostile_catalogue", "ontology"], "candidate admitted inputs");
  validateRef(root, candidate.admitted_inputs.operation_admission, "projects/domainspec-v2/development/remaining-meta-types/active-types/operation/admission/admission.json", "candidate Operation admission");
  validateRef(root, candidate.admitted_inputs.operation_source_inventory, "projects/domainspec-v2/development/remaining-meta-types/active-types/operation/admission/source-inventory.json", "candidate Operation source inventory");
  const hostileCatalogue = validateRef(root, candidate.admitted_inputs.hostile_catalogue, HOSTILE_CATALOGUE_PATH, "candidate frozen hostile catalogue");
  const hostileDocument = JSON.parse(hostileCatalogue.bytes.toString("utf8"));
  const operationS1 = hostileDocument.cross_type_controls.filter((entry) => entry.fixture_owner_swu === "RMT-OP-002");
  check(operationS1.length === 5 && equal(operationS1.map(({ hostile_id }) => hostile_id), S1_HOSTILE_IDS) && operationS1.every(({ hostile_class, proof_owner_swu }) => hostile_class === "s1-cross-boundary" && proof_owner_swu === "RMT-OP-006"), "candidate frozen Operation S1 denominator mismatch");
  const ontologySnapshot = validateOntology(root, candidate.admitted_inputs.ontology);
  passed("admission-and-ontology-inputs-exact");

  exactKeys(candidate.architecture_implementation, ["architecture_type_id", "family_id", "evidence_status", "direct_provider_ids", "provider_registration_status", "source_binding_request"], "candidate architecture implementation");
  check(candidate.architecture_implementation.architecture_type_id === "architecture.OperationImplementation" && candidate.architecture_implementation.family_id === "state-changing-action/v1" && candidate.architecture_implementation.evidence_status === "candidate", "candidate architecture implementation identity mismatch");
  check(equal(candidate.architecture_implementation.direct_provider_ids, TARGETS.map(({ provider_id }) => provider_id)) && candidate.architecture_implementation.provider_registration_status === "unregistered", "candidate provider projection mismatch");
  exactKeys(candidate.architecture_implementation.source_binding_request, ["path", "sha256", "size_bytes", "input_ref_occurrences", "unique_roles", "unique_paths"], "candidate source-binding request");
  check(candidate.architecture_implementation.source_binding_request.input_ref_occurrences === 109 && candidate.architecture_implementation.source_binding_request.unique_roles === 109 && candidate.architecture_implementation.source_binding_request.unique_paths === 49, "candidate source-binding denominator mismatch");
  validateRequestClosure(root, { path: candidate.architecture_implementation.source_binding_request.path, sha256: candidate.architecture_implementation.source_binding_request.sha256, size_bytes: candidate.architecture_implementation.source_binding_request.size_bytes });
  check(Array.isArray(candidate.targets) && candidate.targets.length === TARGETS.length, "candidate target count mismatch");
  candidate.targets.forEach((target, index) => validateTarget(root, target, TARGETS[index]));
  passed("candidate-source-bindings-and-targets-exact");

  exactKeys(candidate.portable_parity, ["receipt_swu_id", "direct_provider_count", "portable_semantics_pass", "same_occurrence_id_across_retry", "native_evidence_separate", "native_hash_byte_comparison", "s1_cross_boundary_controls", "s1_hostile_ids", "s1_required_residue_observed"], "candidate portable parity");
  check(equal(candidate.portable_parity, { receipt_swu_id: "RMT-OP-006", direct_provider_count: 3, portable_semantics_pass: true, same_occurrence_id_across_retry: true, native_evidence_separate: true, native_hash_byte_comparison: false, s1_cross_boundary_controls: 5, s1_hostile_ids: S1_HOSTILE_IDS, s1_required_residue_observed: true }), "candidate portable parity mismatch");
  exactKeys(candidate.deterministic_replay, ["receipt_swu_id", "fresh_processes_bound", "semantic_replay_stable", "acknowledgement_ambiguity_preserves_durable_facts", "owned_transient_residue_count", "cleanup_failure_blocks"], "candidate deterministic replay");
  check(equal(candidate.deterministic_replay, { receipt_swu_id: "RMT-OP-007", fresh_processes_bound: true, semantic_replay_stable: true, acknowledgement_ambiguity_preserves_durable_facts: true, owned_transient_residue_count: 0, cleanup_failure_blocks: true }), "candidate deterministic replay mismatch");
  exactKeys(candidate.architecture_relations, ["receipt_swu_id", "mode", "relation_contract_ids", "materialized_relation_count", "s1_handle"], "candidate architecture relations");
  check(candidate.architecture_relations.receipt_swu_id === "RMT-OP-008" && candidate.architecture_relations.mode === "blueprint-only" && candidate.architecture_relations.materialized_relation_count === 0, "candidate relation mode mismatch");
  check(equal(candidate.architecture_relations.relation_contract_ids, ["op/enforced-by-to-guards", "op/exposed-by-to-exposes", "op/emitted-events-to-emits", "op/workflow-step-to-binds-step"]), "candidate relation contracts mismatch");
  exactKeys(candidate.architecture_relations.s1_handle, ["schema_id", "fields", "materialized", "evidence_sha256"], "candidate S1 handle");
  check(equal(candidate.architecture_relations.s1_handle.fields, ["transaction_id", "effect_group_id", "state_write_id", "outbox_checkpoint_id", "occurrence_id", "commit_outcome"]) && candidate.architecture_relations.s1_handle.materialized === false && candidate.architecture_relations.s1_handle.evidence_sha256 === null, "candidate S1 handle overclaim");
  exactKeys(candidate.registry_nonmembership, ["receipt_swu_id", "registry", "direct_provider_ids_absent", "legacy_typescript_operation_provider_present", "registry_changed"], "candidate registry nonmembership");
  check(equal(candidate.registry_nonmembership.registry, {
    path: REGISTRY_PATH,
    sha256: "2497f2e047e023de2738bac4b815e6b0212560dcfc8053982c94f4a529a9f51b",
    size_bytes: 5105,
  }), "candidate registry baseline mismatch");
  const registryBefore = validateRegistry(root, candidate.registry_nonmembership.registry);
  check(candidate.registry_nonmembership.receipt_swu_id === "RMT-OP-009" && candidate.registry_nonmembership.direct_provider_ids_absent === 3 && candidate.registry_nonmembership.legacy_typescript_operation_provider_present === true && candidate.registry_nonmembership.registry_changed === false, "candidate registry nonmembership mismatch");
  passed("parity-replay-relation-registry-semantics-exact");

  exactKeys(candidate.lifecycle, ["canonical_maturity", "architecture_mapping_status", "implementation_evidence_status", "admission_status", "promotion_status", "queue_readiness", "authority_effect"], "candidate lifecycle");
  check(equal(candidate.lifecycle, { canonical_maturity: "active", architecture_mapping_status: "candidate-mapped", implementation_evidence_status: "candidate", admission_status: "not-admitted", promotion_status: "not-promoted", queue_readiness: false, authority_effect: "none" }), "candidate lifecycle mismatch");
  check(candidate.publication_class === "internal", "candidate publication class mismatch");
  exactKeys(candidate.proof_projection_policy, ["adds_proof", "adds_implementation", "changes_direct_providers", "changes_registry", "changes_ontology", "materializes_relations", "materializes_s1_handle", "promotes_candidate", "claims_distributed_exactly_once", "claims_production_readiness"], "candidate proof projection policy");
  check(Object.values(candidate.proof_projection_policy).every((value) => value === false), "candidate proof projection policy overclaims an effect");
  check(equal(candidate.external_effects, EXTERNAL_EFFECTS), "candidate external effects mismatch");
  passed("candidate-lifecycle-authority-and-nonclaims-exact");

  exactKeys(candidate.validation_surface, ["command", "candidate_validator", "admission_validator", "admission_continuity_required"], "candidate validation surface");
  check(candidate.validation_surface.command === `node ${CANDIDATE_VALIDATOR_PATH} ${CANDIDATE_PATH}` && candidate.validation_surface.admission_continuity_required === true, "candidate validation command mismatch");
  const candidateValidator = validateRef(root, candidate.validation_surface.candidate_validator, CANDIDATE_VALIDATOR_PATH, "candidate validator binding");
  validateRef(root, candidate.validation_surface.admission_validator, ADMISSION_VALIDATOR_PATH, "admission validator binding");
  check(realpathSync(candidateValidator.absolute) === realpathSync(resolveInside(root, CANDIDATE_VALIDATOR_PATH, "running candidate validator")), "candidate validator does not bind the running validator");
  check(typeof candidate.claim_ceiling === "string" && candidate.claim_ceiling.includes("candidate") && candidate.claim_ceiling.includes("No admission") && candidate.claim_ceiling.includes("production"), "candidate claim ceiling is incomplete");
  passed("validator-bindings-and-claim-ceiling-exact");

  const terminalReceiptPresent = validateTerminalReceipt(root, candidate, candidateArtifact, receiptRefs, ontologySnapshot);
  if (terminalReceiptPresent) passed("projection-receipt-last-and-exact");
  else passed("projection-receipt-absent-before-terminal-write");

  const ontologyAfter = readBytes(root, ONTOLOGY_PATH, "ontology final snapshot");
  check(sha256(ontologyAfter.bytes) === candidate.admitted_inputs.ontology.sha256 && ontologyAfter.bytes.length === candidate.admitted_inputs.ontology.size_bytes, "ontology bytes changed during candidate validation");
  check(ontologyAfter.stat.mtimeMs === ontologySnapshot.before.stat.mtimeMs && ontologyAfter.stat.size === ontologySnapshot.before.stat.size, "ontology stat changed during candidate validation");
  const registryAfter = readBytes(root, REGISTRY_PATH, "registry final snapshot");
  check(sha256(registryAfter.bytes) === candidate.registry_nonmembership.registry.sha256 && registryAfter.bytes.length === candidate.registry_nonmembership.registry.size_bytes, "registry bytes changed during candidate validation");
  check(registryAfter.stat.mtimeMs === registryBefore.stat.mtimeMs && registryAfter.stat.size === registryBefore.stat.size, "registry stat changed during candidate validation");
  passed("ontology-and-registry-unchanged");

  process.stdout.write(`${JSON.stringify({
    schema_version: "domainspec.wp-rmt-002.operation-candidate-validation/v1",
    work_pack_id: "WP-RMT-002",
    task_id: "TASK-RMT-OP",
    swu_id: "RMT-OP-010",
    result: "pass",
    candidate_path: CANDIDATE_PATH,
    candidate_sha256: sha256(candidateArtifact.bytes),
    predecessor_receipts: RECEIPTS.length,
    source_binding_occurrences: 109,
    source_binding_unique_paths: 49,
    terminal_receipt_present: terminalReceiptPresent,
    semantic_plan_epoch_id: EPOCH_ID,
    semantic_contract_digest: CONTRACT_DIGEST,
    checks,
    authority_effect: "none",
  }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({
    schema_version: "domainspec.wp-rmt-002.operation-candidate-validation/v1",
    work_pack_id: "WP-RMT-002",
    task_id: "TASK-RMT-OP",
    swu_id: "RMT-OP-010",
    result: "block",
    checks,
    error: error.message,
    authority_effect: "none",
  }, null, 2)}\n`);
  process.exitCode = 1;
}
