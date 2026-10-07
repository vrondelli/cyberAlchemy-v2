#!/usr/bin/env python3
"""Report exact Auth evidence links without rewriting historical records."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
IMPLEMENTATION = ROOT / "implementation"
CONFORMANCE = IMPLEMENTATION / "standard-conformance"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def check_reference(record: dict, path: Path) -> dict:
    if not path.resolve().is_relative_to(ROOT):
        raise ValueError(f"evidence path escapes Auth root: {path}")
    actual = sha256(path) if path.is_file() else None
    return {
        "path": str(path.relative_to(ROOT)),
        "expected_sha256": record["sha256"],
        "actual_sha256": actual,
        "status": "current" if actual == record["sha256"] else "stale",
    }


def source_reference(record: dict, prefix: str) -> dict:
    path = ROOT / record[f"{prefix}_path"]
    return check_reference({"sha256": record[f"{prefix}_sha256"]}, path)


def inspect() -> dict:
    provider_construction = load(IMPLEMENTATION / "provider-construction-binding.json")
    runtime_evidence = load(CONFORMANCE / "runtime-evidence.json")
    provider_evidence = load(CONFORMANCE / "provider-evidence.json")
    provider_binding = load(CONFORMANCE / "trusted-input-provider-binding.json")
    service_binding = load(CONFORMANCE / "authorization-service-binding.json")
    trusted_evidence = load(CONFORMANCE / "trusted-input-evidence.json")
    chain = load(IMPLEMENTATION / "d65-chain.json")
    stages = {row["stage"]: row for row in chain["stages"]}

    references = {
        "provider_construction.runtime_implementation": check_reference(
            provider_construction["predecessor_runtime_implementation"],
            ROOT / provider_construction["predecessor_runtime_implementation"]["path"],
        ),
        "runtime_evidence.runtime_implementation": check_reference(
            runtime_evidence["runtime_implementation_binding"],
            ROOT / runtime_evidence["runtime_implementation_binding"]["path"],
        ),
        "provider_evidence.provider_implementation": check_reference(
            provider_evidence["provider_implementation_binding"],
            ROOT / provider_evidence["provider_implementation_binding"]["path"],
        ),
        "provider_construction.runtime_evidence": check_reference(
            provider_construction["predecessor_runtime_evidence"],
            ROOT / provider_construction["predecessor_runtime_evidence"]["path"],
        ),
        "provider_evidence.runtime_evidence": check_reference(
            provider_evidence["predecessor_runtime_evidence"],
            ROOT / provider_evidence["predecessor_runtime_evidence"]["path"],
        ),
        "service_binding.legacy_trusted_input_provider_predecessor": check_reference(
            service_binding["legacy_trusted_input_provider_predecessor"],
            ROOT / service_binding["legacy_trusted_input_provider_predecessor"]["path"],
        ),
        "trusted_evidence.provider_binding": check_reference(
            trusted_evidence["provider_binding"],
            ROOT / trusted_evidence["provider_binding"]["path"],
        ),
        "trusted_evidence.service_binding": check_reference(
            trusted_evidence["service_binding"],
            ROOT / trusted_evidence["service_binding"]["path"],
        ),
    }
    for name in (
        "legacy_trusted_boundary_predecessor",
        "accepted_command_boundary_meaning",
        "accepted_meaning_owner_decision",
        "owner_downstream_endpoint_scope",
        "selected_transaction_reader",
        "selected_public_api",
        "selected_admission_service",
        "selected_ready_authority",
        "selected_admission_kernel",
        "selected_ready_decision",
        "selected_generated_policy",
        "selected_authorization_state_reader",
        "selected_authorization_metadata_reader",
    ):
        ref = service_binding[name]
        references[f"service_binding.{name}"] = check_reference(ref, ROOT / ref["path"])
        if "manifest_path" in ref:
            references[f"service_binding.{name}.manifest"] = check_reference(
                {"sha256": ref["manifest_sha256"]}, ROOT / ref["manifest_path"]
            )
    historical = service_binding["historical_sfol_relation"]
    for name in ("claim", "admission"):
        references[f"service_binding.historical_sfol_{name}"] = check_reference(
            {"sha256": historical[f"{name}_sha256"]}, ROOT / historical[f"{name}_path"]
        )
    for stage, name in (
        ("runtime_evidence", "runtime_evidence"),
        ("provider_evidence", "provider_evidence"),
        ("trusted_input_provider_implementation", "trusted_input_provider"),
        ("authorization_service_implementation", "authorization_service"),
        ("trusted_input_conformance_evidence", "trusted_input_evidence"),
        ("accepted_command_boundary_meaning", "accepted_command_boundary_meaning"),
        ("accepted_command_boundary_meaning_decision", "accepted_meaning_owner_decision"),
        ("owner_downstream_endpoint_scope", "owner_downstream_endpoint_scope"),
        ("command_boundary_sfol_formal_claim", "historical_sfol_claim"),
        ("command_boundary_sfol_formal_claim_admission", "historical_sfol_admission"),
    ):
        row = stages[stage]
        references[f"d65_chain.{name}"] = check_reference(row, ROOT / row["path"])

    sources = {
        f"provider_binding.{name}": source_reference(provider_binding["implementation"], name)
        for name in ("generated_query", "generated_integration", "source", "tests")
    }
    sources["runtime_evidence.adapter_source"] = source_reference(runtime_evidence["adapter"], "source")
    sources.update({
        f"service_binding.{name}": source_reference(service_binding["implementation"], name)
        for name in ("source", "tests")
    })
    for name in ("selected_admission_service", "selected_ready_authority", "selected_ready_decision"):
        sources[f"service_binding.{name}.tests"] = source_reference(service_binding[name], "tests")
    return {
        "schema_version": "auth-foundation.evidence-freshness-inspection/v1",
        "status": "current" if all(
            row["status"] == "current" for row in (*references.values(), *sources.values())
        ) else "stale",
        "references": references,
        "sources": sources,
        "authority_effect": "none",
        "claim_limit": "Read-only link and source-byte inspection; not evidence reissuance, admission, or runtime-guarantee observation.",
    }


if __name__ == "__main__":
    result = inspect()
    print(json.dumps(result, indent=2))
    raise SystemExit(0 if result["status"] == "current" else 1)
