#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
import subprocess
from pathlib import Path


PLAN_ROOT = Path(__file__).resolve().parents[1]
DOMAIN_ROOT = next(path for path in PLAN_ROOT.parents if path.name == "domainspec-core")
CAV2_ROOT = DOMAIN_ROOT.parent / "cyberAlchemy-v2"
ORODI_ROOT = DOMAIN_ROOT / "projects/domainspec-v2/impl/operational-resilience"
OUTPUT_ROOT = PLAN_ROOT / "execution/z0"


def digest(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def file_ref(path: Path, role: str) -> dict[str, str]:
    return {"role": role, "path": str(path), "sha256": digest(path.read_bytes())}


def definition_bytes(text: str, definition_id: str) -> bytes:
    match = re.search(rf"^###? {re.escape(definition_id)}:.*$", text, re.MULTILINE)
    if match is None:
        raise ValueError(f"missing definition {definition_id}")
    next_match = re.search(r"^## CAV2-D\d+:.*$", text[match.end():], re.MULTILINE)
    end = match.end() + next_match.start() if next_match else len(text)
    return text[match.start():end].encode("utf-8")


def main() -> int:
    definitions = CAV2_ROOT / "authority/definitions/DEFINITIONS.md"
    definition_text = definitions.read_text(encoding="utf-8")
    selected_definitions = [
        {"definition_id": f"CAV2-D{number}", "source": str(definitions), "selector_sha256": digest(definition_bytes(definition_text, f"CAV2-D{number}"))}
        for number in range(83, 93)
    ]
    implementation_files = [
        file_ref(ORODI_ROOT / "contracts/operational-evidence.ts", "generic-evidence-contract"),
        file_ref(ORODI_ROOT / "contracts/evaluation-bundle.schema.json", "generic-bundle-schema"),
        file_ref(ORODI_ROOT / "contracts/evaluation-result.schema.json", "generic-result-schema"),
        file_ref(ORODI_ROOT / "src/validate-operational-evidence.ts", "generic-evidence-validator"),
        file_ref(ORODI_ROOT / "src/body_war_canary_contracts.py", "canary-contract-pattern"),
        file_ref(ORODI_ROOT / "src/body_war_canary_workload.py", "workload-safety-pattern"),
        file_ref(ORODI_ROOT / "src/body_war_canary_evaluator.py", "canary-evaluation-pattern"),
        file_ref(ORODI_ROOT / "src/body_war_canary_rollback.py", "ordered-rollback-pattern"),
    ]
    validator = CAV2_ROOT / "product/craft/capabilities/orodi/scripts/validate.py"
    run = subprocess.run(["python3", str(validator)], text=True, capture_output=True, check=False)
    try:
        package_receipt = json.loads(run.stdout)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"ORODI validator did not emit JSON: {exc}\n{run.stdout}\n{run.stderr}")
    status_exit_agreement = (package_receipt.get("status") == "pass") == (run.returncode == 0)
    selection = {
        "schema_version": "auth.orodi-z0-dependency-selection/v1-candidate",
        "selection_id": "AUTH-ORODI-Z0-SELECTION-001",
        "canonical_definitions": selected_definitions,
        "candidate_implementation_inputs": implementation_files,
        "source_package_currentness": {
            "status": "current" if package_receipt.get("status") == "pass" else "stale",
            "validator_exit": run.returncode,
            "validator_error_count": len(package_receipt.get("errors", [])),
            "status_exit_agreement": status_exit_agreement,
            "admission_use": "denied",
            "diagnostic": "Current source-package admissions are not consumed by the Auth-local candidate dependency.",
        },
        "use_boundary": "Exact active definitions and exact candidate implementation bytes only; no ORODI package admission, runtime truth, deployment, or authority is inherited.",
        "authority_effect": "none",
        "open_questions_ref": "../../PLAN.md#open-questions",
    }
    passed = len(selected_definitions) == 10 and len(implementation_files) == 8 and status_exit_agreement
    result = {
        "schema_version": "auth.orodi-z0-result/v1-candidate",
        "node_id": "Z0",
        "status": "passed" if passed else "failed",
        "selected_definition_count": len(selected_definitions),
        "selected_implementation_count": len(implementation_files),
        "orodi_source_package_state": selection["source_package_currentness"]["status"],
        "orodi_source_package_errors": selection["source_package_currentness"]["validator_error_count"],
        "stale_admission_use": "denied",
        "validator_status_exit_agreement": status_exit_agreement,
        "deployment_effect": False,
        "authority_effect": "none",
        "claim_ceiling": "Z0 proves exact local candidate dependency selection and preserves stale package admissions as denied; it proves no ORODI conformance or operational behavior.",
        "open_questions_ref": "../../PLAN.md#open-questions",
    }
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    (OUTPUT_ROOT / "DEPENDENCY-SELECTION.json").write_text(json.dumps(selection, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    (OUTPUT_ROOT / "ORODI-PACKAGE-VALIDATION.json").write_text(json.dumps(package_receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    (OUTPUT_ROOT / "RESULT.json").write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
