#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from pathlib import Path


PLAN_ROOT = Path(__file__).resolve().parents[1]
DOMAIN_ROOT = next(path for path in PLAN_ROOT.parents if path.name == "domainspec-core")
AUTH_ROOT = DOMAIN_ROOT / "projects/auth-foundation/implementation/authentication-https"
OUTPUT_ROOT = PLAN_ROOT / "execution/p0"


INPUTS = {
    "identity": AUTH_ROOT / "src/identity.mjs",
    "application": AUTH_ROOT / "src/app.mjs",
    "server": AUTH_ROOT / "src/server.mjs",
    "setup": AUTH_ROOT / "scripts/setup.mjs",
    "compose": AUTH_ROOT / "compose.yaml",
    "proxy": AUTH_ROOT / "proxy/nginx.conf",
    "documentation": AUTH_ROOT / "README.md",
}


GAPS = [
    {
        "id": "remote-host-profile",
        "finding": "Runtime identity and ingress assumptions are bound to localhost rather than an exact remote staging profile.",
        "affected_inputs": ["identity", "application", "server", "proxy"],
        "required_repair": "Introduce an exact validated remote host, issuer, origin, and forwarded-host profile while retaining fail-closed host checks.",
    },
    {
        "id": "managed-secret-injection",
        "finding": "Setup creates local runtime secret material; the service has no managed-secret identity and injection contract for remote staging.",
        "affected_inputs": ["setup", "compose"],
        "required_repair": "Consume secrets by managed identity or mounted secret reference and keep values out of evidence.",
    },
    {
        "id": "product-observability",
        "finding": "Local health counters do not provide the correlation, redaction, conservation, retention, and alert evidence required by the ORODI profile.",
        "affected_inputs": ["application", "server", "compose"],
        "required_repair": "Add product telemetry with stable event identities, request-to-decision correlation, loss accounting, and redaction tests.",
    },
    {
        "id": "backup-restore",
        "finding": "The local composition has persistent data but no exact remote backup, recovery-point, or isolated restore contract.",
        "affected_inputs": ["compose", "documentation"],
        "required_repair": "Bind backup creation, recovery-point identity, isolated restoration, RPO, and RTO evidence.",
    },
    {
        "id": "rollback-controller",
        "finding": "No complete resource inventory or ordered rollback controller proves restoration to the stable identity.",
        "affected_inputs": ["compose", "documentation"],
        "required_repair": "Create a complete inventory and idempotent rollback sequence with independent zero-candidate-reference verification.",
    },
    {
        "id": "idempotent-configuration-composition",
        "finding": "Predecessor evidence records that the deployment harness can overwrite the durable MFA overlay.",
        "affected_inputs": ["setup"],
        "required_repair": "Make configuration application compositional and prove repeated execution preserves the MFA overlay.",
    },
]


def main() -> int:
    refs = []
    for role, path in INPUTS.items():
        if not path.is_file():
            raise FileNotFoundError(path)
        refs.append({"role": role, "path": str(path), "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
    result = {
        "schema_version": "auth.orodi-p0-product-gap-assessment/v1-candidate",
        "node": "P0",
        "status": "passed",
        "assessment_complete": True,
        "product_change_required": True,
        "selected_source_inputs": refs,
        "gaps": GAPS,
        "next_node": "P1",
        "p1_state": "missing",
        "p1_blockers": [
            "B0 owner decisions and exact profile bounds are not bound.",
            "An exact successor change set cannot be frozen before those decisions select the remote product contract.",
        ],
        "secret_values_observed_or_recorded": False,
        "deployment_effect": False,
        "authority_effect": "none",
    }
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    (OUTPUT_ROOT / "RESULT.json").write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
