#!/usr/bin/env python3
"""Run the no-effect ORODI Alert Profile D65 conformance suite."""

from __future__ import annotations

import hashlib
import json
import os
import subprocess
from pathlib import Path

from jsonschema import Draft202012Validator


ROOT = Path(__file__).resolve().parents[7]
PACKAGE = Path(__file__).resolve().parents[1]
IMPL = ROOT / "projects/domainspec-v2/impl/operational-resilience/orodi-alert-profile"
NODE = Path("/home/vrondelli/.nvm/versions/node/v22.13.0/bin/node")
TSX = ROOT / "projects/domainspec-v2/impl/node_modules/tsx/dist/cli.mjs"
TSC = ROOT / "projects/domainspec-v2/impl/node_modules/typescript/bin/tsc"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(command: list[str]) -> dict:
    env = dict(os.environ)
    env["TMPDIR"] = "/tmp"
    completed = subprocess.run(command, cwd=ROOT, env=env, text=True, capture_output=True)
    if completed.returncode != 0:
        raise RuntimeError(f"COMMAND_FAILED:{' '.join(command)}\n{completed.stdout}\n{completed.stderr}")
    output = completed.stdout.strip()
    return json.loads(output) if output.startswith("{") else {"output": output}


def main() -> int:
    checks: dict[str, dict] = {}
    errors: list[str] = []
    try:
        schema = json.loads((IMPL / "orodi-alert-profile.schema.json").read_text(encoding="utf-8"))
        instance = json.loads((IMPL / "body-war-canary.alert-profile.json").read_text(encoding="utf-8"))
        schema_errors = sorted(Draft202012Validator(schema).iter_errors(instance), key=lambda item: list(item.absolute_path))
        if schema_errors:
            errors.extend(f"profile-schema:{'.'.join(map(str, item.absolute_path))}:{item.message}" for item in schema_errors)
        checks["profile_schema"] = {"result":"pass" if not schema_errors else "fail", "violations":len(schema_errors)}
        checks["definition_pack"] = run(["python3", "-B", "cyberAlchemy-v2/define/candidates/orodi-alert-profile/validate.py"])
        checks["business_ontology"] = run(["python3", "-B", str(PACKAGE / "business-ontology/scripts/validate.py")])
        run([str(NODE), str(TSC), "--project", str(IMPL / "tsconfig.json")])
        checks["typecheck"] = {"result": "pass"}
        checks["implementation_tests"] = run([str(NODE), str(TSX), str(IMPL / "test.ts")])
        checks["renderer"] = run([str(NODE), str(TSX), str(IMPL / "cli.ts"), "check"])
        binding_validator = PACKAGE / "binding/validate.py"
        if binding_validator.is_file():
            checks["binding"] = run(["python3", "-B", str(binding_validator)])
        else:
            errors.append("binding-validator-missing")
    except (OSError, RuntimeError, json.JSONDecodeError) as exc:
        errors.append(str(exc))

    generated = IMPL / "generated/body-war-canary.grafana-alerts.yml"
    reference = ROOT / "projects/domainspec-v2/impl/operational-resilience/body-war-canary.grafana-alerts.yml"
    if not generated.is_file() or not reference.is_file() or generated.read_bytes() != reference.read_bytes():
        errors.append("rendered-reference-byte-drift")

    system_path = PACKAGE / "domainspec/generated/system-ontology.json"
    receipt_path = PACKAGE / "domainspec/generated/system-ontology-receipt.json"
    try:
        system = json.loads(system_path.read_text(encoding="utf-8"))
        receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
        node_ids = {row.get("node_id") for row in system.get("nodes", [])}
        required_nodes = {
            "orodi-alert-profile.AlertProfile",
            "orodi-alert-profile.AlertRuleSet",
            "orodi-alert-profile.AlertEvidenceState",
            "orodi-alert-profile.RenderAlertProfile",
            "orodi-alert-profile.CommissionRenderedAlerts",
            "orodi-alert-profile.NotificationDeliveryMustRemainSeparate",
        }
        if not required_nodes.issubset(node_ids): errors.append("system-ontology-node-coverage")
        if receipt.get("deterministic_runs") != 2 or receipt.get("equal_graph_bytes") is not True or receipt.get("equal_system_ontology_bytes") is not True:
            errors.append("system-ontology-determinism")
        if receipt.get("system_ontology_digest") != sha256(system_path): errors.append("system-ontology-digest")
        checks["domainspec_projection"] = {"result":"pass", "nodes":len(node_ids), "edges":len(system.get("edges", [])), "system_ontology_digest":sha256(system_path)}
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"system-ontology:{exc}")

    result = {
        "schema_version": "domainspec.orodi.alert-profile-conformance/v1",
        "result": "pass" if not errors else "fail",
        "checks": checks,
        "rendered_artifact_sha256": sha256(generated) if generated.is_file() else None,
        "reference_artifact_sha256": sha256(reference) if reference.is_file() else None,
        "errors": sorted(set(errors)),
        "runtime_executed": False,
        "notification_delivery": "absent",
        "authority_effect": "none",
        "claim_ceiling": "Candidate D65 structure and no-effect implementation conformance only; no admission, acceptance, runtime truth, publication, release, deployment, or external notification authority."
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
