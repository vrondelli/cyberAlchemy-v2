#!/usr/bin/env python3
"""Run collect-all checks and emit bounded hosted-vertical evidence."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
ACCEPTANCE_DECISION_SHA256 = "993d8bb23435a0fe568b602f71f3988a2cf642ed5b529097499ca83f01991748"
ACCEPTED_BINDING_SHA256 = "50a0e5ce9cbc811c8e9d5249b28ae0c1bb4b19824d27a8b4adce7dd7afd2bf92"
ACCEPTED_MATERIAL_SHA256 = "e96a517ca08db35294010db5002a02ae8ccc37e1d2b0d14bc834cc2eca92795f"


def command(check_id: str, args: list[str], cwd: Path) -> dict:
    env = os.environ.copy()
    executable = Path(args[0])
    if executable.is_absolute():
        env["PATH"] = f"{executable.parent}:{env.get('PATH', '')}"
    result = subprocess.run(args, cwd=cwd, env=env, capture_output=True, text=True, check=False)
    return {
        "check_id": check_id,
        "status": "PASS" if result.returncode == 0 else "FAIL",
        "exit_code": result.returncode,
        "stdout": result.stdout[-4000:],
        "stderr": result.stderr[-4000:],
    }


def not_evaluable(check_id: str, blocker: str) -> dict:
    return {
        "check_id": check_id,
        "status": "not_evaluable",
        "causal_blocker": blocker,
    }


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def node_binary() -> str:
    available = shutil.which("node")
    if available:
        return available
    candidates = sorted(Path.home().glob(".nvm/versions/node/*/bin/node"), reverse=True)
    return str(candidates[0]) if candidates else "node"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-evidence", action="store_true")
    args = parser.parse_args()
    predecessor_checks = [
        command("definitions", ["python3", "validate.py"], ROOT / "definitions"),
        command("product-capability", ["python3", "validate-product-capability.py"], ROOT),
        command("ontology", ["python3", "validate.py"], ROOT / "ontology"),
        command("domainspec-source", ["python3", "validate.py"], ROOT / "domainspec"),
        command("system-ontology-admission", ["python3", "validate-system-ontology.py"], ROOT / "domainspec"),
        command("implementation-binding-acceptance", ["python3", "validate-binding-acceptance.py"], ROOT / "implementation"),
    ]

    decision_path = ROOT / "decisions/implementation-binding-acceptance-001.json"
    binding_path = ROOT / "implementation/implementation-binding.json"
    binding = json.loads(binding_path.read_text())
    actual_decision_sha256 = sha(decision_path)
    actual_binding_sha256 = sha(binding_path)
    actual_material_sha256 = binding.get("implementation_material_sha256")
    target_current = (
        actual_decision_sha256 == ACCEPTANCE_DECISION_SHA256
        and actual_binding_sha256 == ACCEPTED_BINDING_SHA256
        and actual_material_sha256 == ACCEPTED_MATERIAL_SHA256
    )
    currentness = {
        "check_id": "accepted-target-currentness",
        "status": "PASS" if target_current else "FAIL",
        "accepted": {
            "decision_sha256": ACCEPTANCE_DECISION_SHA256,
            "binding_record_sha256": ACCEPTED_BINDING_SHA256,
            "implementation_material_sha256": ACCEPTED_MATERIAL_SHA256,
        },
        "observed": {
            "decision_sha256": actual_decision_sha256,
            "binding_record_sha256": actual_binding_sha256,
            "implementation_material_sha256": actual_material_sha256,
        },
        "causal_blocker": None if target_current else "The current binding record and implementation material no longer match the exact owner-accepted target.",
    }
    current_binding_internal = command(
        "current-binding-internal-consistency",
        ["python3", "author_binding.py", "--check"],
        ROOT / "implementation",
    )

    dependency_blocker = (
        "Accepted target currentness failed; executing implementation tests would assess substituted bytes rather than accepted material e96a517c."
    )
    if target_current:
        node = node_binary()
        dependent_checks = [
            command("rust-format", ["cargo", "fmt", "--", "--check"], ROOT / "implementation"),
            command("browser-client-tests", [node, "--test", "ui-src/app.test.js"], ROOT / "implementation"),
            command("browser-bundle-current", [node, "ui-src/check-bundle.js"], ROOT / "implementation"),
            command("third-party-functional-test", ["cargo", "test", "--test", "third_party_vertical", "--", "--nocapture"], ROOT / "implementation"),
        ]
    else:
        dependent_checks = [
            not_evaluable("rust-format", dependency_blocker),
            not_evaluable("browser-client-tests", dependency_blocker),
            not_evaluable("browser-bundle-current", dependency_blocker),
            not_evaluable("third-party-functional-test", dependency_blocker),
        ]

    checks = predecessor_checks + [currentness, current_binding_internal] + dependent_checks
    all_pass = all(item["status"] == "PASS" for item in checks)
    functional_result = (
        "PASS"
        if target_current and all(item["status"] == "PASS" for item in dependent_checks)
        else "not_evaluable" if not target_current else "FAIL"
    )
    evidence = {
        "schema_version": "cav2-kep-hosted-conformance-assessment/v2",
        "assessment_id": "CA2-ASSESS-KEP-HOSTED-DEVNET-POST-ACCEPTANCE-002",
        "binding_id": "CA2-D65-KEP-HOSTED-DEVNET-RUST-001",
        "binding_acceptance": {
            "decision_id": "CA2-DECISION-KEP-HOSTED-DEVNET-IMPLEMENTATION-BINDING-ACCEPTANCE-001",
            "decision_sha256": ACCEPTANCE_DECISION_SHA256,
            "accepted_binding_record_sha256": ACCEPTED_BINDING_SHA256,
            "accepted_implementation_material_sha256": ACCEPTED_MATERIAL_SHA256,
        },
        "checks": checks,
        "assessment_result": "PASS_BOUNDED" if all_pass else "BLOCK",
        "functional_result": functional_result,
        "d65_conformance": "PASS_BOUNDED" if all_pass else "not_evaluable",
        "causal_blockers": [] if all_pass else [
            "The accepted binding record 50a0e5ce and implementation material e96a517c are no longer current; observed binding record is "
            + str(actual_binding_sha256)
            + " and observed material is "
            + str(actual_material_sha256)
            + ".",
            "Implementation-dependent checks are not evaluable until the accepted bytes are restored or a fresh binding candidate is reviewed and accepted."
        ],
        "external_effect": "none",
        "authority_effect": "none",
        "claim_limit": "Post-acceptance local D65 assessment only; never VPS readiness, deployment, production, security certification, credential use, RPC submission, or Devnet transaction evidence."
    }
    encoded = (json.dumps(evidence, indent=2, sort_keys=True) + "\n").encode()
    if args.write_evidence:
        target = ROOT / "evidence" / "conformance-assessment.json"
        target.write_bytes(encoded)
        digest = hashlib.sha256(encoded).hexdigest()
        print(json.dumps({"result":evidence["assessment_result"],"evidence":str(target),"sha256":digest,"d65_conformance":evidence["d65_conformance"],"authority_effect":"none"}, indent=2))
    else:
        print(encoded.decode(), end="")
    return 0 if all_pass else 1


if __name__ == "__main__":
    raise SystemExit(main())
