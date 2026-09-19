#!/usr/bin/env python3
"""Validate the proposal-only EVF C0 contract against an in-memory cycle fixture."""

from __future__ import annotations

import copy
import hashlib
import json
import sys
from pathlib import Path
from typing import Any, Callable

from jsonschema import Draft202012Validator


SCHEMA_PATH = Path(__file__).with_name("c0-contract-bundle.v1.schema.json")
SAFE_INTEGER_MIN = -9007199254740991
SAFE_INTEGER_MAX = 9007199254740991
L1_TERMINAL_RECEIPT_PATH = "synthetic/l1-terminal-receipt.json"
DATALOG_ROWS_PATH = "synthetic/datalog-rows.json"
ALLOY_COUNTEREXAMPLE_PATH = "synthetic/alloy-counterexample.json"


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def digest_label(label: str) -> str:
    return sha256_bytes(label.encode("utf-8"))


def utf16_key(value: str) -> tuple[int, ...]:
    encoded = value.encode("utf-16-be", "surrogatepass")
    return tuple(int.from_bytes(encoded[index : index + 2], "big") for index in range(0, len(encoded), 2))


def canonical_text(value: Any) -> str:
    if value is None or isinstance(value, (bool, str)):
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    if isinstance(value, int):
        if not SAFE_INTEGER_MIN <= value <= SAFE_INTEGER_MAX:
            raise TypeError("evf-canonical-json/v1 integers must be JavaScript-safe")
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    if isinstance(value, float):
        raise TypeError("evf-canonical-json/v1 permits integer numeric values only")
    if isinstance(value, list):
        return "[" + ",".join(canonical_text(item) for item in value) + "]"
    if isinstance(value, dict):
        if not all(isinstance(key, str) for key in value):
            raise TypeError("JSON object keys must be strings")
        keys = sorted(value, key=utf16_key)
        return "{" + ",".join(
            canonical_text(key) + ":" + canonical_text(value[key]) for key in keys
        ) + "}"
    raise TypeError(f"unsupported JSON value: {type(value).__name__}")


def canonical_bytes(value: Any) -> bytes:
    return canonical_text(value).encode("utf-8")


def exact_ref(path: str, value: Any) -> dict[str, Any]:
    payload = value if isinstance(value, bytes) else canonical_bytes(value)
    return {"path": path, "sha256": sha256_bytes(payload), "size_bytes": len(payload)}


def utf16_tuple_key(*values: str) -> tuple[tuple[int, ...], ...]:
    return tuple(utf16_key(value) for value in values)


def sorted_facts(facts: dict[str, Any]) -> dict[str, Any]:
    return {
        "nodes": sorted(
            facts["nodes"],
            key=lambda node: utf16_tuple_key(
                node["node_id"], node["feature_id"], node["kind"]
            ),
        ),
        "edges": sorted(
            facts["edges"],
            key=lambda edge: utf16_tuple_key(
                edge["edge_id"], edge["predicate"], edge["from"], edge["to"]
            ),
        ),
    }


def facts_digest(facts: dict[str, Any]) -> str:
    node_ids = [node["node_id"] for node in facts["nodes"]]
    edge_ids = [edge["edge_id"] for edge in facts["edges"]]
    if len(node_ids) != len(set(node_ids)) or len(edge_ids) != len(set(edge_ids)):
        raise ValueError("duplicate fact IDs must be rejected before canonical sorting")
    return sha256_bytes(canonical_bytes(sorted_facts(facts)))


def semantic_digest(normalized_result: dict[str, Any]) -> str:
    return sha256_bytes(canonical_bytes(normalized_result))


def synthetic_external_artifacts() -> dict[str, dict[str, Any]]:
    return {
        L1_TERMINAL_RECEIPT_PATH: {
            "schema_version": "EVFL1TerminalReceipt/v1",
            "layer": "L1",
            "terminal_status": "pass",
            "admission_status": "admitted",
            "authority_effect": "none",
            "release_admission": "not-granted",
            "claim_ceiling": "l1-terminal-prerequisite-only",
        },
        DATALOG_ROWS_PATH: {
            "schema_version": "DatalogRows/v1",
            "rows": [
                {
                    "violation_id": "cycle-n1-n2",
                    "node_ids": ["n1", "n2"],
                }
            ],
        },
        ALLOY_COUNTEREXAMPLE_PATH: {
            "schema_version": "AlloyCounterexample/v1",
            "command_label": "SyntheticAcyclicity",
            "node_ids": ["n1", "n2"],
        },
    }


def resolve_exact_ref(
    ref: dict[str, Any], external_artifacts: dict[str, dict[str, Any]]
) -> dict[str, Any] | None:
    path = ref.get("path")
    payload = external_artifacts.get(path)
    if payload is None or exact_ref(path, payload) != ref:
        return None
    return payload


def is_admitted_l1_terminal_receipt(receipt: dict[str, Any] | None) -> bool:
    if receipt is None:
        return False
    return all(
        [
            receipt.get("schema_version") == "EVFL1TerminalReceipt/v1",
            receipt.get("layer") == "L1",
            receipt.get("terminal_status") == "pass",
            receipt.get("admission_status") == "admitted",
            receipt.get("authority_effect") == "none",
            receipt.get("release_admission") == "not-granted",
            receipt.get("claim_ceiling") == "l1-terminal-prerequisite-only",
        ]
    )


def contains_unsafe_integer(value: Any) -> bool:
    if isinstance(value, bool) or value is None:
        return False
    if isinstance(value, int):
        return not SAFE_INTEGER_MIN <= value <= SAFE_INTEGER_MAX
    if isinstance(value, list):
        return any(contains_unsafe_integer(item) for item in value)
    if isinstance(value, dict):
        return any(contains_unsafe_integer(item) for item in value.values())
    return False


def synthetic_documents() -> dict[str, dict[str, Any]]:
    external_artifacts = synthetic_external_artifacts()
    refs = {
        name: exact_ref(f"synthetic/{name}.json", {"synthetic": name})
        for name in [
            "graph",
            "graph-schema",
            "source-manifest",
            "extractor",
            "extractor-config",
            "decision-gcp-003",
            "property-definition",
            "comparison-contract",
            "datalog-runtime",
            "datalog-adapter",
            "datalog-query",
            "datalog-invocation",
            "alloy-runtime",
            "alloy-adapter",
            "alloy-model",
            "alloy-invocation",
            "alloy-scope-contract",
            "datalog-input",
            "datalog-projection",
            "datalog-raw",
            "alloy-input",
            "alloy-projection",
            "alloy-raw",
        ]
    }
    refs["l1-terminal-receipt"] = exact_ref(
        L1_TERMINAL_RECEIPT_PATH,
        external_artifacts[L1_TERMINAL_RECEIPT_PATH],
    )
    refs["datalog-rows"] = exact_ref(
        DATALOG_ROWS_PATH,
        external_artifacts[DATALOG_ROWS_PATH],
    )
    refs["alloy-counterexample"] = exact_ref(
        ALLOY_COUNTEREXAMPLE_PATH,
        external_artifacts[ALLOY_COUNTEREXAMPLE_PATH],
    )
    registry_digests = {
        "profile": digest_label("profile"),
        "kinds": digest_label("kinds"),
        "relationships": digest_label("relationships"),
    }
    facts = {
        "nodes": [
            {"node_id": "n1", "feature_id": "feature-a", "kind": "rule"},
            {"node_id": "n2", "feature_id": "feature-b", "kind": "operation"},
        ],
        "edges": [
            {"edge_id": "e1", "predicate": "depends_on", "from": "n1", "to": "n2"},
            {"edge_id": "e2", "predicate": "depends_on", "from": "n2", "to": "n1"},
        ],
    }
    manifest = {
        "schema_version": "GraphFactManifest/v1",
        "manifest_id": "synthetic-cycle-facts-v1",
        "source": {
            "graph_ref": refs["graph"],
            "graph_schema_ref": refs["graph-schema"],
            "source_manifest_ref": refs["source-manifest"],
            "graph_authority_expected": "generated-semantic-read-model",
            "project_id": "synthetic-cycle",
            "source_set_digest": digest_label("source-set"),
            "registry_digests": registry_digests,
        },
        "extractor": {
            "extractor_id": "synthetic-graph-fact-projector",
            "extractor_version": "1.0.0",
            "extractor_ref": refs["extractor"],
            "configuration_ref": refs["extractor-config"],
            "canonicalization_profile": "evf-canonical-json/v1",
        },
        "projection": {
            "node_fields": ["node_id", "feature_id", "kind"],
            "edge_fields": ["edge_id", "predicate", "from", "to"],
            "graph_edge_type_maps_to": "predicate",
            "body_omitted": True,
            "no_inference": True,
            "no_inverse_generation": True,
            "no_case_folding": True,
            "no_unicode_normalization": True,
        },
        "facts": facts,
        "counts": {"nodes": 2, "edges": 2},
        "validation": {
            "node_ids_unique": True,
            "edge_ids_unique": True,
            "endpoints_total": True,
            "registry_digests_matched": True,
            "source_set_digest_matched": True,
        },
        "facts_digest": facts_digest(facts),
        "authority": "derived-non-authoritative-read-model",
        "claim_ceiling": "deterministic-structural-projection-only",
        "residue": [],
    }
    manifest_ref = exact_ref("synthetic/fact-manifest.json", manifest)
    request = {
        "schema_version": "GraphLawRequest/v1",
        "request_id": "synthetic-cycle-request-v1",
        "request_kind": "graph-law-evaluation",
        "request_state": "execution-ready",
        "decision_ref": refs["decision-gcp-003"],
        "admission": {
            "layer": "L2",
            "prerequisite_receipts": [refs["l1-terminal-receipt"]],
            "authority_effect": "none",
            "release_admission": "not-granted",
        },
        "subject": {
            "fact_manifest_ref": manifest_ref,
            "facts_digest": manifest["facts_digest"],
            "project_id": manifest["source"]["project_id"],
            "source_set_digest": manifest["source"]["source_set_digest"],
            "registry_digests": registry_digests,
        },
        "property": {
            "property_id": "synthetic-acyclicity",
            "property_version": "1",
            "definition_ref": refs["property-definition"],
            "property_class": "acyclicity",
            "result_semantics": "universal-via-violation-query",
        },
        "comparison_contract_ref": refs["comparison-contract"],
        "providers": [
            {
                "provider_kind": "datalog",
                "evaluator_id": "synthetic-datalog",
                "evaluator_version": "1.0.0",
                "runtime_ref": refs["datalog-runtime"],
                "adapter_ref": refs["datalog-adapter"],
                "query_or_model_ref": refs["datalog-query"],
                "invocation_contract_ref": refs["datalog-invocation"],
                "evaluation_domain": {
                    "kind": "exact-closed-world-fact-set",
                    "complete_relation_evaluation": True,
                },
            },
            {
                "provider_kind": "alloy",
                "evaluator_id": "synthetic-alloy",
                "evaluator_version": "1.0.0",
                "runtime_ref": refs["alloy-runtime"],
                "adapter_ref": refs["alloy-adapter"],
                "query_or_model_ref": refs["alloy-model"],
                "invocation_contract_ref": refs["alloy-invocation"],
                "evaluation_domain": {
                    "kind": "exact-closed-world-fact-set",
                    "scope_contract_ref": refs["alloy-scope-contract"],
                },
            },
        ],
        "execution_policy": {
            "timeout_ms": 1000,
            "max_output_bytes": 65536,
            "network": "forbidden",
            "working_directory": "synthetic/work",
            "environment_allowlist": ["LANG"],
            "deterministic_seed": 7,
        },
        "claim_ceiling": "request-only-no-evaluation-claim",
        "residue": [],
    }
    request_ref = exact_ref("synthetic/request.json", request)

    def provider_receipt(kind: str) -> dict[str, Any]:
        provider_request = request["providers"][0 if kind == "datalog" else 1]
        if kind == "datalog":
            row_payload = external_artifacts[DATALOG_ROWS_PATH]
            rows_digest = sha256_bytes(canonical_bytes(row_payload["rows"]))
            native = {
                "kind": "violation-relation",
                "relation_name": "acyclicity_violation",
                "row_schema_digest": digest_label("datalog-row-schema"),
                "row_count": len(row_payload["rows"]),
                "rows_digest": rows_digest,
                "rows_ref": refs["datalog-rows"],
            }
            evidence_ref = refs["datalog-rows"]
            result_payload_digest = rows_digest
        else:
            scope = {
                "canonical": "for exactly 2 Node",
                "overall_bound": 2,
                "exact_signatures": ["Node"],
            }
            native = {
                "kind": "alloy-command",
                "command_kind": "check",
                "command_label": "SyntheticAcyclicity",
                "scope": scope,
                "scope_digest": sha256_bytes(canonical_bytes(scope)),
                "outcome": "sat",
                "instance_or_counterexample_ref": refs["alloy-counterexample"],
                "solution_count": 1,
            }
            evidence_ref = refs["alloy-counterexample"]
            result_payload_digest = evidence_ref["sha256"]
        normalized = {
            "outcome": "counterexample",
            "domain_kind": "exact-closed-world-fact-set",
            "evidence_refs": [evidence_ref],
            "result_payload_digest": result_payload_digest,
        }
        return {
            "schema_version": "GraphLawProviderReceipt/v1",
            "receipt_id": f"synthetic-{kind}-receipt-v1",
            "receipt_family": "graph-relation" if kind == "datalog" else "formal-static",
            "request_ref": request_ref,
            "fact_manifest_ref": manifest_ref,
            "property_definition_ref": request["property"]["definition_ref"],
            "comparison_contract_ref": request["comparison_contract_ref"],
            "request_id": request["request_id"],
            "facts_digest": manifest["facts_digest"],
            "property_id": request["property"]["property_id"],
            "property_version": request["property"]["property_version"],
            "provider": {
                "kind": kind,
                "id": provider_request["evaluator_id"],
                "version": provider_request["evaluator_version"],
                "runtime_ref": provider_request["runtime_ref"],
                "adapter_ref": provider_request["adapter_ref"],
                "query_or_model_ref": provider_request["query_or_model_ref"],
                "invocation_contract_ref": provider_request["invocation_contract_ref"],
                "solver_id": "synthetic-solver" if kind == "alloy" else "synthetic-engine",
                "solver_version": "1.0.0",
                "options_digest": digest_label(f"{kind}-options"),
            },
            "translation": {
                "provider_input_ref": refs[f"{kind}-input"],
                "source_facts_digest": manifest["facts_digest"],
                "projection_receipt_ref": refs[f"{kind}-projection"],
                "omitted_fact_count": 0,
                "invented_fact_count": 0,
            },
            "execution": {
                "run_id": f"synthetic-{kind}-run-v1",
                "status": "completed",
                "exit_code": 0,
                "timed_out": False,
                "raw_output_ref": refs[f"{kind}-raw"],
            },
            "native_result": native,
            "normalized_result": normalized,
            "semantic_result_digest": semantic_digest(normalized),
            "residue": [],
            "authority_effect": "none",
            "release_admission": "not-granted",
            "claim_ceiling": (
                "exact-finite-corpus-relation-result-only"
                if kind == "datalog"
                else "bounded-static-model-result-only"
            ),
        }

    datalog = provider_receipt("datalog")
    alloy = provider_receipt("alloy")
    join = {
        "schema_version": "GraphLawJoinReceipt/v1",
        "join_receipt_id": "synthetic-cycle-join-v1",
        "request_ref": request_ref,
        "fact_manifest_ref": manifest_ref,
        "property_definition_ref": request["property"]["definition_ref"],
        "comparison_contract_ref": request["comparison_contract_ref"],
        "request_id": request["request_id"],
        "facts_digest": manifest["facts_digest"],
        "property_id": request["property"]["property_id"],
        "property_version": request["property"]["property_version"],
        "provider_receipts": {
            "datalog": {
                "receipt_ref": exact_ref("synthetic/datalog-receipt.json", datalog),
                "semantic_result_digest": datalog["semantic_result_digest"],
            },
            "alloy": {
                "receipt_ref": exact_ref("synthetic/alloy-receipt.json", alloy),
                "semantic_result_digest": alloy["semantic_result_digest"],
            },
        },
        "preflight": {
            "same_request": True,
            "same_facts": True,
            "same_property": True,
            "same_mapping": True,
            "provider_kinds_exact": True,
            "receipts_valid": True,
            "domains_comparable": True,
        },
        "mapped_results": {
            "datalog": {
                "outcome": datalog["normalized_result"]["outcome"],
                "domain_kind": datalog["normalized_result"]["domain_kind"],
            },
            "alloy": {
                "outcome": alloy["normalized_result"]["outcome"],
                "domain_kind": alloy["normalized_result"]["domain_kind"],
            },
        },
        "join_status": "consistent",
        "consistency_class": "counterexample-consistent",
        "evidence_refs": [
            refs["datalog-rows"],
            refs["alloy-counterexample"],
        ],
        "residue": [],
        "authority_effect": "none",
        "release_admission": "not-granted",
        "claim_ceiling": "property-specific-consistency-over-shared-facts-only",
    }
    return {
        "manifest": manifest,
        "request": request,
        "datalog": datalog,
        "alloy": alloy,
        "join": join,
    }


def schema_error_code(document: dict[str, Any]) -> str:
    return {
        "GraphFactManifest/v1": "FACT_PROJECTION_DRIFT",
        "GraphLawRequest/v1": "GRAPH_REQUEST_SCHEMA_INVALID",
        "GraphLawProviderReceipt/v1": "PROVIDER_OUTPUT_INVALID",
        "GraphLawJoinReceipt/v1": "JOIN_RECEIPT_TAMPERED",
    }.get(document.get("schema_version", ""), "GRAPH_REQUEST_SCHEMA_INVALID")


def validate_manifest(manifest: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    nodes = manifest["facts"]["nodes"]
    edges = manifest["facts"]["edges"]
    node_ids = [node["node_id"] for node in nodes]
    edge_ids = [edge["edge_id"] for edge in edges]
    node_duplicate = len(node_ids) != len(set(node_ids))
    edge_duplicate = len(edge_ids) != len(set(edge_ids))
    if node_duplicate:
        errors.append("FACT_NODE_ID_DUPLICATE")
    if edge_duplicate:
        errors.append("FACT_EDGE_ID_DUPLICATE")
    if manifest["facts"] != sorted_facts(manifest["facts"]):
        errors.append("FACT_PROJECTION_DRIFT")
    node_set = set(node_ids)
    if any(edge["from"] not in node_set or edge["to"] not in node_set for edge in edges):
        errors.append("FACT_ENDPOINT_MISSING")
    if manifest["counts"] != {"nodes": len(nodes), "edges": len(edges)}:
        errors.append("FACT_PROJECTION_DRIFT")
    if not node_duplicate and not edge_duplicate and manifest["facts_digest"] != facts_digest(manifest["facts"]):
        errors.append("FACT_DIGEST_MISMATCH")
    return errors


def validate_request(
    request: dict[str, Any],
    manifest: dict[str, Any],
    external_artifacts: dict[str, dict[str, Any]],
) -> list[str]:
    errors: list[str] = []
    subject = request["subject"]
    if subject["fact_manifest_ref"] != exact_ref("synthetic/fact-manifest.json", manifest):
        errors.append("FACT_DIGEST_MISMATCH")
    if subject["facts_digest"] != manifest["facts_digest"]:
        errors.append("FACT_DIGEST_MISMATCH")
    if subject["source_set_digest"] != manifest["source"]["source_set_digest"]:
        errors.append("SOURCE_DIGEST_STALE")
    if subject["registry_digests"] != manifest["source"]["registry_digests"]:
        errors.append("REGISTRY_DIGEST_STALE")
    if request["request_state"] == "execution-ready":
        prerequisite_refs = request["admission"]["prerequisite_receipts"]
        if not prerequisite_refs:
            errors.append("L1_PREREQUISITE_MISSING")
        elif any(
            not is_admitted_l1_terminal_receipt(
                resolve_exact_ref(ref, external_artifacts)
            )
            for ref in prerequisite_refs
        ):
            errors.append("L1_PREREQUISITE_UNADMITTED")
    return errors


def expected_provider_outcome(receipt: dict[str, Any]) -> str:
    execution = receipt["execution"]
    if (
        execution["status"] != "completed"
        or execution["exit_code"] != 0
        or execution["timed_out"]
    ):
        return "unresolved"
    native = receipt["native_result"]
    if not isinstance(native, dict):
        return "invalid-native-result"
    if receipt["provider"]["kind"] == "datalog":
        return "counterexample" if native["row_count"] > 0 else "no-counterexample"
    if native["outcome"] == "unknown":
        return "unresolved"
    if native["command_kind"] == "check":
        return "counterexample" if native["outcome"] == "sat" else "no-counterexample"
    return "witness" if native["outcome"] == "sat" else "no-witness"


def validate_provider(
    receipt: dict[str, Any],
    kind: str,
    request: dict[str, Any],
    manifest: dict[str, Any],
    external_artifacts: dict[str, dict[str, Any]],
) -> list[str]:
    errors: list[str] = []
    request_provider = request["providers"][0 if kind == "datalog" else 1]
    execution = receipt["execution"]
    normalized = receipt["normalized_result"]
    native = receipt["native_result"]
    if execution["timed_out"]:
        errors.append("PROVIDER_TIMEOUT")
    if execution["exit_code"] not in {0, None}:
        errors.append("PROVIDER_EXECUTION_FAILED")
    if execution["status"] == "completed" and (
        execution["exit_code"] != 0 or execution["timed_out"]
    ):
        errors.append("PROVIDER_OUTPUT_INVALID")
    if receipt["provider"]["kind"] != kind:
        errors.append("PROVIDER_OUTPUT_INVALID")
    if receipt["request_ref"] != exact_ref("synthetic/request.json", request):
        errors.append("JOIN_REQUEST_MISMATCH")
    if receipt["fact_manifest_ref"] != exact_ref("synthetic/fact-manifest.json", manifest):
        errors.append("JOIN_FACT_DIGEST_MISMATCH")
    if receipt["request_id"] != request["request_id"]:
        errors.append("JOIN_REQUEST_MISMATCH")
    if receipt["facts_digest"] != manifest["facts_digest"]:
        errors.append("JOIN_FACT_DIGEST_MISMATCH")
    if (
        receipt["property_id"] != request["property"]["property_id"]
        or receipt["property_version"] != request["property"]["property_version"]
        or receipt["property_definition_ref"] != request["property"]["definition_ref"]
    ):
        errors.append("JOIN_PROPERTY_MISMATCH")
    if receipt["comparison_contract_ref"] != request["comparison_contract_ref"]:
        errors.append("JOIN_MAPPING_MISMATCH")
    if receipt["translation"]["source_facts_digest"] != manifest["facts_digest"]:
        errors.append("PROVIDER_INPUT_DIGEST_MISMATCH")
    if (
        receipt["translation"]["omitted_fact_count"] != 0
        or receipt["translation"]["invented_fact_count"] != 0
    ):
        errors.append("FACT_PROJECTION_DRIFT")
    for receipt_field, request_field in [
        ("id", "evaluator_id"),
        ("version", "evaluator_version"),
        ("runtime_ref", "runtime_ref"),
        ("adapter_ref", "adapter_ref"),
        ("query_or_model_ref", "query_or_model_ref"),
        ("invocation_contract_ref", "invocation_contract_ref"),
    ]:
        if receipt["provider"][receipt_field] != request_provider[request_field]:
            errors.append(
                "PROVIDER_VERSION_MISMATCH"
                if receipt_field in {"id", "version"}
                else "PROVIDER_ADAPTER_STALE"
            )
            break
    if normalized["domain_kind"] != request_provider["evaluation_domain"]["kind"]:
        errors.append("PROVIDER_SCOPE_INVALID")
    if not normalized["evidence_refs"]:
        errors.append("PROVIDER_OUTPUT_INVALID")
    if kind == "datalog" and isinstance(native, dict):
        rows_payload = resolve_exact_ref(native["rows_ref"], external_artifacts)
        rows = rows_payload.get("rows") if isinstance(rows_payload, dict) else None
        if not isinstance(rows, list):
            errors.append("PROVIDER_OUTPUT_INVALID")
        else:
            expected_rows_digest = sha256_bytes(canonical_bytes(rows))
            if (
                native["row_count"] != len(rows)
                or native["rows_digest"] != expected_rows_digest
                or native["rows_ref"] not in normalized["evidence_refs"]
            ):
                errors.append("PROVIDER_OUTPUT_INVALID")
            if normalized["result_payload_digest"] != expected_rows_digest:
                errors.append("PROVIDER_RECEIPT_TAMPERED")
    if kind == "alloy" and isinstance(native, dict):
        if native["scope_digest"] != sha256_bytes(canonical_bytes(native["scope"])):
            errors.append("PROVIDER_SCOPE_INVALID")
        if native["outcome"] == "sat":
            evidence_ref = native.get("instance_or_counterexample_ref")
            evidence_payload = (
                resolve_exact_ref(evidence_ref, external_artifacts)
                if isinstance(evidence_ref, dict)
                else None
            )
            if (
                evidence_payload is None
                or evidence_ref not in normalized["evidence_refs"]
                or native.get("solution_count", 0) < 1
            ):
                errors.append("PROVIDER_OUTPUT_INVALID")
            elif normalized["result_payload_digest"] != evidence_ref["sha256"]:
                errors.append("PROVIDER_RECEIPT_TAMPERED")
    expected_outcome = expected_provider_outcome(receipt)
    if expected_outcome == "invalid-native-result":
        errors.append("PROVIDER_OUTPUT_INVALID")
    elif normalized["outcome"] != expected_outcome:
        errors.append("PROVIDER_RESULT_UNMAPPED")
    if receipt["semantic_result_digest"] != semantic_digest(receipt["normalized_result"]):
        errors.append("PROVIDER_RECEIPT_TAMPERED")
    if execution["status"] != "completed" and (
        normalized["outcome"] != "unresolved"
        or receipt["claim_ceiling"] != "no-property-claim"
    ):
        errors.append("PROVIDER_OUTPUT_INVALID")
    return errors


def expected_join(datalog: dict[str, Any], alloy: dict[str, Any]) -> tuple[str, str, bool]:
    d_result = datalog["normalized_result"]
    a_result = alloy["normalized_result"]
    if "unresolved" in {d_result["outcome"], a_result["outcome"]}:
        return "unresolved", "not-comparable", False
    if a_result["outcome"] in {"witness", "no-witness"}:
        return "blocked", "not-comparable", False
    same_domain = d_result["domain_kind"] == a_result["domain_kind"]
    if same_domain and d_result["outcome"] == a_result["outcome"] == "counterexample":
        return "consistent", "counterexample-consistent", True
    if same_domain and d_result["outcome"] == a_result["outcome"] == "no-counterexample":
        return "consistent", "no-counterexample-consistent-under-declared-bounds", True
    if same_domain:
        return "unresolved", "provider-disagreement", True
    if (
        d_result["domain_kind"] == "exact-closed-world-fact-set"
        and d_result["outcome"] == "no-counterexample"
        and a_result["domain_kind"] == "bounded-model-space"
        and a_result["outcome"] == "counterexample"
    ):
        return "complementary", "exact-clean-bounded-model-counterexample", False
    return "blocked", "not-comparable", False


def validate_join(
    join: dict[str, Any],
    request: dict[str, Any],
    manifest: dict[str, Any],
    datalog: dict[str, Any],
    alloy: dict[str, Any],
) -> list[str]:
    errors: list[str] = []
    expected_evidence_refs: list[dict[str, Any]] = []
    if join["request_ref"] != exact_ref("synthetic/request.json", request) or join["request_id"] != request["request_id"]:
        errors.append("JOIN_REQUEST_MISMATCH")
    if join["fact_manifest_ref"] != exact_ref("synthetic/fact-manifest.json", manifest) or join["facts_digest"] != manifest["facts_digest"]:
        errors.append("JOIN_FACT_DIGEST_MISMATCH")
    if (
        join["property_id"] != request["property"]["property_id"]
        or join["property_version"] != request["property"]["property_version"]
        or join["property_definition_ref"] != request["property"]["definition_ref"]
    ):
        errors.append("JOIN_PROPERTY_MISMATCH")
    if join["comparison_contract_ref"] != request["comparison_contract_ref"]:
        errors.append("JOIN_MAPPING_MISMATCH")
    for kind, receipt in [("datalog", datalog), ("alloy", alloy)]:
        bound = join["provider_receipts"][kind]
        expected_ref = exact_ref(f"synthetic/{kind}-receipt.json", receipt)
        if bound["receipt_ref"] != expected_ref or bound["semantic_result_digest"] != receipt["semantic_result_digest"]:
            errors.append("JOIN_RECEIPT_MISSING")
        mapped = join["mapped_results"][kind]
        expected_mapped = {
            "outcome": receipt["normalized_result"]["outcome"],
            "domain_kind": receipt["normalized_result"]["domain_kind"],
        }
        if mapped != expected_mapped:
            errors.append("JOIN_RESULT_DISAGREEMENT")
        expected_evidence_refs.extend(receipt["normalized_result"]["evidence_refs"])
    if not join["evidence_refs"] or any(
        evidence_ref not in join["evidence_refs"]
        for evidence_ref in expected_evidence_refs
    ):
        errors.append("JOIN_RECEIPT_MISSING")
    expected_status, expected_class, comparable = expected_join(datalog, alloy)
    if join["preflight"]["domains_comparable"] != comparable:
        errors.append("JOIN_DOMAIN_INCOMPARABLE")
    if join["join_status"] != expected_status or join["consistency_class"] != expected_class:
        if expected_class == "not-comparable":
            errors.append("JOIN_DOMAIN_INCOMPARABLE")
        else:
            errors.append("JOIN_RESULT_DISAGREEMENT")
    if join["claim_ceiling"] != "property-specific-consistency-over-shared-facts-only":
        errors.append("JOIN_CLAIM_INFLATION")
    return errors


def validate_documents(
    schema: dict[str, Any],
    documents: dict[str, dict[str, Any]],
    external_artifacts: dict[str, dict[str, Any]] | None = None,
) -> list[str]:
    resolved_external_artifacts = external_artifacts or {}
    validator = Draft202012Validator(schema)
    errors: list[str] = []
    for document in documents.values():
        if contains_unsafe_integer(document):
            errors.append("CANONICALIZATION_UNSUPPORTED")
        if list(validator.iter_errors(document)):
            errors.append(schema_error_code(document))
    errors.extend(validate_manifest(documents["manifest"]))
    errors.extend(
        validate_request(
            documents["request"],
            documents["manifest"],
            resolved_external_artifacts,
        )
    )
    errors.extend(
        validate_provider(
            documents["datalog"],
            "datalog",
            documents["request"],
            documents["manifest"],
            resolved_external_artifacts,
        )
    )
    errors.extend(
        validate_provider(
            documents["alloy"],
            "alloy",
            documents["request"],
            documents["manifest"],
            resolved_external_artifacts,
        )
    )
    errors.extend(
        validate_join(
            documents["join"],
            documents["request"],
            documents["manifest"],
            documents["datalog"],
            documents["alloy"],
        )
    )
    return sorted(set(errors))


def refresh_provider_binding(documents: dict[str, dict[str, Any]], kind: str) -> None:
    receipt = documents[kind]
    receipt["semantic_result_digest"] = semantic_digest(receipt["normalized_result"])
    documents["join"]["provider_receipts"][kind] = {
        "receipt_ref": exact_ref(f"synthetic/{kind}-receipt.json", receipt),
        "semantic_result_digest": receipt["semantic_result_digest"],
    }
    documents["join"]["mapped_results"][kind] = {
        "outcome": receipt["normalized_result"]["outcome"],
        "domain_kind": receipt["normalized_result"]["domain_kind"],
    }


Mutation = tuple[str, str, Callable[[dict[str, dict[str, Any]]], None]]


def mutation_cases() -> list[Mutation]:
    def unsorted(documents: dict[str, dict[str, Any]]) -> None:
        documents["manifest"]["facts"]["nodes"].reverse()

    def unicode_scalar_order_instead_of_utf16(
        documents: dict[str, dict[str, Any]]
    ) -> None:
        replacements = {"n1": "\ue000", "n2": "\U00010000"}
        for node in documents["manifest"]["facts"]["nodes"]:
            node["node_id"] = replacements[node["node_id"]]
        for edge in documents["manifest"]["facts"]["edges"]:
            edge["from"] = replacements[edge["from"]]
            edge["to"] = replacements[edge["to"]]

    def duplicate_node(documents: dict[str, dict[str, Any]]) -> None:
        documents["manifest"]["facts"]["nodes"][1]["node_id"] = "n1"

    def duplicate_edge(documents: dict[str, dict[str, Any]]) -> None:
        documents["manifest"]["facts"]["edges"][1]["edge_id"] = "e1"

    def dangling_endpoint(documents: dict[str, dict[str, Any]]) -> None:
        documents["manifest"]["facts"]["edges"][0]["to"] = "missing"

    def stale_digest(documents: dict[str, dict[str, Any]]) -> None:
        documents["manifest"]["facts_digest"] = digest_label("stale")

    def omitted_fact(documents: dict[str, dict[str, Any]]) -> None:
        documents["datalog"]["translation"]["omitted_fact_count"] = 1

    def invented_fact(documents: dict[str, dict[str, Any]]) -> None:
        documents["alloy"]["translation"]["invented_fact_count"] = 1

    def datalog_mapping(documents: dict[str, dict[str, Any]]) -> None:
        documents["datalog"]["native_result"]["row_count"] = 0
        documents["datalog"]["semantic_result_digest"] = semantic_digest(documents["datalog"]["normalized_result"])

    def alloy_mapping(documents: dict[str, dict[str, Any]]) -> None:
        documents["alloy"]["native_result"]["outcome"] = "unsat"
        documents["alloy"]["semantic_result_digest"] = semantic_digest(documents["alloy"]["normalized_result"])

    def alloy_run_as_universal(documents: dict[str, dict[str, Any]]) -> None:
        documents["alloy"]["native_result"]["command_kind"] = "run"
        documents["alloy"]["native_result"]["outcome"] = "sat"
        documents["alloy"]["normalized_result"]["outcome"] = "witness"
        refresh_provider_binding(documents, "alloy")
        documents["join"]["preflight"]["domains_comparable"] = False

    def missing_l1(documents: dict[str, dict[str, Any]]) -> None:
        documents["request"]["admission"]["prerequisite_receipts"] = []

    def unadmitted_l1(documents: dict[str, dict[str, Any]]) -> None:
        documents["request"]["admission"]["prerequisite_receipts"] = [
            exact_ref("synthetic/not-an-l1-receipt.json", {"not": "a receipt"})
        ]

    def request_mismatch(documents: dict[str, dict[str, Any]]) -> None:
        documents["datalog"]["request_id"] = "different-request"

    def fact_mismatch(documents: dict[str, dict[str, Any]]) -> None:
        documents["alloy"]["facts_digest"] = digest_label("different-facts")

    def property_mismatch(documents: dict[str, dict[str, Any]]) -> None:
        documents["datalog"]["property_id"] = "different-property"

    def mapping_mismatch(documents: dict[str, dict[str, Any]]) -> None:
        documents["alloy"]["comparison_contract_ref"] = exact_ref(
            "synthetic/different-comparison.json", {"synthetic": "different-comparison"}
        )

    def failed_provider_claim(documents: dict[str, dict[str, Any]]) -> None:
        documents["datalog"]["execution"]["status"] = "failed"
        documents["datalog"]["execution"]["exit_code"] = 1
        documents["datalog"]["native_result"] = None

    def completed_without_native(documents: dict[str, dict[str, Any]]) -> None:
        documents["datalog"]["native_result"] = None

    def completed_with_nonzero_exit(documents: dict[str, dict[str, Any]]) -> None:
        documents["datalog"]["execution"]["exit_code"] = 7

    def completed_with_timeout(documents: dict[str, dict[str, Any]]) -> None:
        documents["alloy"]["execution"]["timed_out"] = True

    def stale_alloy_scope_digest(documents: dict[str, dict[str, Any]]) -> None:
        documents["alloy"]["native_result"]["scope_digest"] = digest_label(
            "stale-alloy-scope"
        )

    def missing_alloy_evidence(documents: dict[str, dict[str, Any]]) -> None:
        evidence_ref = documents["alloy"]["native_result"].pop(
            "instance_or_counterexample_ref"
        )
        documents["alloy"]["native_result"].pop("solution_count")
        documents["alloy"]["normalized_result"]["evidence_refs"] = []
        documents["join"]["evidence_refs"].remove(evidence_ref)

    def missing_join_evidence(documents: dict[str, dict[str, Any]]) -> None:
        documents["join"]["evidence_refs"] = []

    def datalog_row_count_mismatch(documents: dict[str, dict[str, Any]]) -> None:
        documents["datalog"]["native_result"]["row_count"] = 999

    def datalog_rows_digest_mismatch(documents: dict[str, dict[str, Any]]) -> None:
        documents["datalog"]["native_result"]["rows_digest"] = digest_label(
            "stale-datalog-rows"
        )

    def unsafe_integer(documents: dict[str, dict[str, Any]]) -> None:
        unsafe_ref = copy.deepcopy(documents["join"]["request_ref"])
        unsafe_ref["size_bytes"] = SAFE_INTEGER_MAX + 1
        documents["join"]["residue"].append(
            {
                "residue_id": "synthetic-unsafe-integer",
                "class": "coverage-gap",
                "severity": "blocking",
                "message": "Synthetic unsafe integer mutation.",
                "source_refs": [unsafe_ref],
                "claim_effect": "Canonicalization must reject this document.",
            }
        )

    def receipt_tamper(documents: dict[str, dict[str, Any]]) -> None:
        documents["alloy"]["semantic_result_digest"] = digest_label("tampered")

    def disagreement_as_consistency(documents: dict[str, dict[str, Any]]) -> None:
        documents["alloy"]["native_result"]["outcome"] = "unsat"
        documents["alloy"]["normalized_result"]["outcome"] = "no-counterexample"
        refresh_provider_binding(documents, "alloy")

    def claim_inflation(documents: dict[str, dict[str, Any]]) -> None:
        documents["join"]["claim_ceiling"] = "global-property-proof"

    return [
        ("unsorted-facts", "FACT_PROJECTION_DRIFT", unsorted),
        ("unicode-scalar-order-instead-of-utf16", "FACT_PROJECTION_DRIFT", unicode_scalar_order_instead_of_utf16),
        ("duplicate-node-id", "FACT_NODE_ID_DUPLICATE", duplicate_node),
        ("duplicate-edge-id", "FACT_EDGE_ID_DUPLICATE", duplicate_edge),
        ("dangling-endpoint", "FACT_ENDPOINT_MISSING", dangling_endpoint),
        ("stale-facts-digest", "FACT_DIGEST_MISMATCH", stale_digest),
        ("omitted-provider-fact", "FACT_PROJECTION_DRIFT", omitted_fact),
        ("invented-provider-fact", "FACT_PROJECTION_DRIFT", invented_fact),
        ("wrong-datalog-mapping", "PROVIDER_RESULT_UNMAPPED", datalog_mapping),
        ("wrong-alloy-check-mapping", "PROVIDER_RESULT_UNMAPPED", alloy_mapping),
        ("alloy-run-not-universal", "JOIN_DOMAIN_INCOMPARABLE", alloy_run_as_universal),
        ("execution-ready-without-l1", "L1_PREREQUISITE_MISSING", missing_l1),
        ("execution-ready-with-unadmitted-l1", "L1_PREREQUISITE_UNADMITTED", unadmitted_l1),
        ("request-join-key-mismatch", "JOIN_REQUEST_MISMATCH", request_mismatch),
        ("fact-join-key-mismatch", "JOIN_FACT_DIGEST_MISMATCH", fact_mismatch),
        ("property-join-key-mismatch", "JOIN_PROPERTY_MISMATCH", property_mismatch),
        ("comparison-mapping-mismatch", "JOIN_MAPPING_MISMATCH", mapping_mismatch),
        ("failed-provider-claims-result", "PROVIDER_OUTPUT_INVALID", failed_provider_claim),
        ("completed-provider-without-native-result", "PROVIDER_OUTPUT_INVALID", completed_without_native),
        ("completed-provider-with-nonzero-exit", "PROVIDER_EXECUTION_FAILED", completed_with_nonzero_exit),
        ("completed-provider-with-timeout", "PROVIDER_TIMEOUT", completed_with_timeout),
        ("stale-alloy-scope-digest", "PROVIDER_SCOPE_INVALID", stale_alloy_scope_digest),
        ("alloy-sat-without-evidence", "PROVIDER_OUTPUT_INVALID", missing_alloy_evidence),
        ("join-without-evidence", "JOIN_RECEIPT_MISSING", missing_join_evidence),
        ("datalog-row-count-mismatch", "PROVIDER_OUTPUT_INVALID", datalog_row_count_mismatch),
        ("datalog-rows-digest-mismatch", "PROVIDER_OUTPUT_INVALID", datalog_rows_digest_mismatch),
        ("unsafe-cross-language-integer", "CANONICALIZATION_UNSUPPORTED", unsafe_integer),
        ("provider-semantic-digest-tamper", "PROVIDER_RECEIPT_TAMPERED", receipt_tamper),
        ("provider-disagreement-claimed-consistent", "JOIN_RESULT_DISAGREEMENT", disagreement_as_consistency),
        ("join-claim-inflation", "JOIN_CLAIM_INFLATION", claim_inflation),
    ]


def main() -> int:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    expected_envelopes = [
        "#/$defs/graphFactManifest",
        "#/$defs/graphLawRequest",
        "#/$defs/graphLawProviderReceipt",
        "#/$defs/graphLawJoinReceipt",
    ]
    actual_envelopes = [entry.get("$ref") for entry in schema.get("oneOf", [])]
    shape_pass = actual_envelopes == expected_envelopes
    forbidden_constants = [
        "SWU-GCP-002",
        "financial-settlement",
        "key-door",
        "enforces",
        "O_spec",
        "expected_result",
    ]
    schema_text = json.dumps(schema, ensure_ascii=False)
    nonbinding_pass = not any(token in schema_text for token in forbidden_constants)
    unicode_probe = {
        "nodes": [
            {"node_id": "\ue000", "feature_id": "f", "kind": "k"},
            {"node_id": "\U00010000", "feature_id": "f", "kind": "k"},
        ],
        "edges": [],
    }
    utf16_fact_order_pass = [
        node["node_id"] for node in sorted_facts(unicode_probe)["nodes"]
    ] == ["\U00010000", "\ue000"]
    try:
        canonical_text(SAFE_INTEGER_MAX + 1)
        safe_integer_rejection_pass = False
    except TypeError:
        safe_integer_rejection_pass = True

    external_artifacts = synthetic_external_artifacts()
    baseline = synthetic_documents()
    baseline_errors = validate_documents(schema, baseline, external_artifacts)
    l1_external_resolver_pass = not any(
        error in {"L1_PREREQUISITE_MISSING", "L1_PREREQUISITE_UNADMITTED"}
        for error in validate_request(
            baseline["request"], baseline["manifest"], external_artifacts
        )
    )
    positive_results = []
    validator = Draft202012Validator(schema)
    for name in ["manifest", "request", "datalog", "alloy", "join"]:
        errors = list(validator.iter_errors(baseline[name]))
        positive_results.append({"document": name, "status": "pass" if not errors else "fail"})
    blocked_provider = copy.deepcopy(baseline["datalog"])
    blocked_provider["receipt_id"] = "synthetic-datalog-blocked-receipt-v1"
    blocked_provider["execution"]["status"] = "blocked"
    blocked_provider["execution"]["exit_code"] = None
    blocked_provider["native_result"] = None
    blocked_provider["normalized_result"]["outcome"] = "unresolved"
    blocked_provider["normalized_result"]["evidence_refs"] = [
        blocked_provider["execution"]["raw_output_ref"]
    ]
    blocked_provider["normalized_result"]["result_payload_digest"] = digest_label(
        "datalog-blocked-normalized-payload"
    )
    blocked_provider["semantic_result_digest"] = semantic_digest(blocked_provider["normalized_result"])
    blocked_provider["claim_ceiling"] = "no-property-claim"
    blocked_errors = list(validator.iter_errors(blocked_provider))
    positive_results.append(
        {"document": "blocked-provider", "status": "pass" if not blocked_errors else "fail"}
    )
    failed_provider = copy.deepcopy(blocked_provider)
    failed_provider["receipt_id"] = "synthetic-datalog-failed-receipt-v1"
    failed_provider["execution"]["status"] = "failed"
    failed_provider["execution"]["exit_code"] = 7
    failed_provider_errors = validate_provider(
        failed_provider,
        "datalog",
        baseline["request"],
        baseline["manifest"],
        external_artifacts,
    )
    failed_provider_pass = (
        not list(validator.iter_errors(failed_provider))
        and failed_provider_errors == ["PROVIDER_EXECUTION_FAILED"]
    )
    positive_results.append(
        {
            "document": "failed-provider-mapping",
            "status": "pass" if failed_provider_pass else "fail",
        }
    )
    timeout_provider = copy.deepcopy(blocked_provider)
    timeout_provider["receipt_id"] = "synthetic-alloy-timeout-receipt-v1"
    timeout_provider["receipt_family"] = "formal-static"
    timeout_provider["provider"] = copy.deepcopy(baseline["alloy"]["provider"])
    timeout_provider["execution"]["status"] = "failed"
    timeout_provider["execution"]["timed_out"] = True
    timeout_provider["normalized_result"]["domain_kind"] = baseline["alloy"][
        "normalized_result"
    ]["domain_kind"]
    timeout_provider["semantic_result_digest"] = semantic_digest(
        timeout_provider["normalized_result"]
    )
    timeout_provider_errors = validate_provider(
        timeout_provider,
        "alloy",
        baseline["request"],
        baseline["manifest"],
        external_artifacts,
    )
    timeout_provider_pass = (
        not list(validator.iter_errors(timeout_provider))
        and timeout_provider_errors == ["PROVIDER_TIMEOUT"]
    )
    positive_results.append(
        {
            "document": "timeout-provider-mapping",
            "status": "pass" if timeout_provider_pass else "fail",
        }
    )

    mutation_results = []
    for name, expected_error, mutate in mutation_cases():
        documents = copy.deepcopy(baseline)
        mutate(documents)
        observed = validate_documents(schema, documents, external_artifacts)
        mutation_results.append(
            {
                "mutation": name,
                "expected_error": expected_error,
                "observed_errors": observed,
                "status": "killed" if expected_error in observed else "survived",
            }
        )

    all_positive = all(result["status"] == "pass" for result in positive_results)
    all_mutations = all(result["status"] == "killed" for result in mutation_results)
    status = (
        "pass"
        if all(
            [
                shape_pass,
                nonbinding_pass,
                utf16_fact_order_pass,
                safe_integer_rejection_pass,
                l1_external_resolver_pass,
                failed_provider_pass,
                timeout_provider_pass,
                not baseline_errors,
                all_positive,
                all_mutations,
            ]
        )
        else "fail"
    )
    report = {
        "schema_version": "EVFC0ContractProposalValidation/v1",
        "status": status,
        "mode": "proposal-only-synthetic-in-memory",
        "schema_path": str(SCHEMA_PATH.relative_to(Path.cwd())),
        "checks": {
            "draft_2020_12_schema_valid": True,
            "top_level_envelopes_exactly_four": shape_pass,
            "l1_semantics_not_bound": nonbinding_pass,
            "utf16_fact_tuple_ordering": utf16_fact_order_pass,
            "safe_integer_bounds_enforced": safe_integer_rejection_pass,
            "external_l1_admission_resolved": l1_external_resolver_pass,
            "external_admission_boundary": "synthetic-resolver-required-schema-alone-is-insufficient",
            "nonzero_exit_maps_to_unresolved": failed_provider_pass,
            "timeout_maps_to_unresolved": timeout_provider_pass,
            "baseline_cross_contract_errors": baseline_errors,
            "positive_documents": positive_results,
            "mutations": mutation_results,
        },
        "counts": {
            "positive_documents": len(positive_results),
            "external_artifacts_resolved": len(external_artifacts),
            "mutations_total": len(mutation_results),
            "mutations_killed": sum(result["status"] == "killed" for result in mutation_results),
        },
        "claim_ceiling": "schema-synthetic-resolver-and-mutation-validation-only",
        "authority_effect": "none",
        "release_admission": "not-granted",
    }
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if status == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())
