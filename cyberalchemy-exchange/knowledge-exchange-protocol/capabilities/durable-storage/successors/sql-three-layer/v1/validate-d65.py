#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent


class D65Error(Exception):
    pass


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> dict:
    return json.loads(path.read_text())


def run(command: list[str], cwd: Path) -> dict:
    result = subprocess.run(
        command, cwd=cwd, text=True, capture_output=True, check=False
    )
    if result.returncode != 0:
        raise D65Error(
            f"gate failed ({' '.join(command)}): {(result.stdout + result.stderr)[-2000:]}"
        )
    try:
        value = json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise D65Error(f"gate did not return JSON: {' '.join(command)}") from error
    if value.get("result", value.get("status")) != "PASS":
        raise D65Error(f"gate blocked: {value}")
    return value


def gate_status(value: dict) -> str:
    return value.get("result", value.get("status", "BLOCK"))


def require_digest(record: dict, key_path: tuple[str, ...], path: Path) -> None:
    value = record
    for key in key_path:
        value = value[key]
    actual = sha256(path)
    if value != actual:
        raise D65Error(f"digest drift for {path.relative_to(ROOT)}: {value} != {actual}")


def validate() -> dict:
    definitions = run(["python3", "validate.py"], ROOT / "definitions")
    capability = run(["python3", "validate-product-capability.py"], ROOT)
    ontology = run(["python3", "validate.py"], ROOT / "ontology")
    domainspec = run(["python3", "validate.py"], ROOT / "domainspec")
    compilation = run(["python3", "compile.py", "--check"], ROOT / "domainspec")
    runtime = run(["python3", "validate.py"], ROOT / "runtime")

    decisions = ROOT / "decisions"
    definition_decision = load(decisions / "definition-acceptance-001.json")
    capability_decision = load(decisions / "product-capability-adoption-001.json")
    ontology_decision = load(decisions / "ontology-admission-001.json")
    domainspec_decision = load(decisions / "domainspec-source-admission-001.json")
    system_decision = load(decisions / "system-ontology-admission-001.json")
    conformance_decision = load(decisions / "local-conformance-acceptance-001.json")

    expected_statuses = [
        (definition_decision, "acceptance", "accepted"),
        (capability_decision, "adoption", "adopted"),
        (ontology_decision, "admission", "admitted"),
        (domainspec_decision, "admission", "admitted"),
        (system_decision, "admission", "admitted"),
        (conformance_decision, "acceptance", "accepted-local-conformance"),
    ]
    for record, section, expected in expected_statuses:
        if record[section]["lifecycle_status"] != expected:
            raise D65Error(f"decision status mismatch: {record['decision_id']}")

    require_digest(
        capability_decision,
        ("predecessor", "definition_acceptance_sha256"),
        decisions / "definition-acceptance-001.json",
    )
    require_digest(
        ontology_decision,
        ("predecessors", "product_capability_adoption_sha256"),
        decisions / "product-capability-adoption-001.json",
    )
    require_digest(
        domainspec_decision,
        ("predecessor", "ontology_admission_sha256"),
        decisions / "ontology-admission-001.json",
    )
    require_digest(
        system_decision,
        ("predecessor", "domainspec_source_admission_sha256"),
        decisions / "domainspec-source-admission-001.json",
    )
    require_digest(
        conformance_decision,
        ("subject", "implementation_binding_sha256"),
        ROOT / "runtime/implementation-binding.json",
    )
    require_digest(
        conformance_decision,
        ("subject", "conformance_receipt_sha256"),
        ROOT / "runtime/conformance-receipt.json",
    )

    return {
        "schema_version": "cav2-kep-dst3-d65-aggregate-validation/v1",
        "result": "PASS",
        "construction_chain": [
            "accepted canonical definitions",
            "adopted Product Capability",
            "admitted capability-local business ontology",
            "admitted DomainSpec v2 source",
            "admitted deterministic compiled graph and system ontology",
            "exact Rust implementation binding",
            "accepted bounded local conformance evidence",
        ],
        "gate_results": {
            "definitions": gate_status(definitions),
            "product_capability": gate_status(capability),
            "business_ontology": gate_status(ontology),
            "domainspec_v2": gate_status(domainspec),
            "compiled_system_ontology": gate_status(compilation),
            "runtime": gate_status(runtime),
        },
        "system_ontology_sha256": system_decision["subject"][
            "system_ontology_sha256"
        ],
        "implementation_binding_sha256": sha256(
            ROOT / "runtime/implementation-binding.json"
        ),
        "conformance_receipt_sha256": sha256(ROOT / "runtime/conformance-receipt.json"),
        "authority_effect": "none; validation only",
        "claim_ceiling": conformance_decision["claim_ceiling"],
        "external_effect": "none",
    }


def main() -> int:
    try:
        result = validate()
    except Exception as error:
        result = {
            "result": "BLOCK",
            "error": str(error),
            "authority_effect": "none",
            "external_effect": "none",
        }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["result"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
