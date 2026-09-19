#!/usr/bin/env python3
"""Create an isolated negative-approval controller probe for the staged TDE @4 plan."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


REPO = Path(__file__).resolve().parents[6]
RUN = Path(__file__).resolve().parent
OVERLAY = RUN / "validation/repository-overlay"
TARGET_REL = Path(
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-define-design-plan/20260825T001515Z-tde-multiformalism-profile-epoch-r4"
)
TARGET = OVERLAY / TARGET_REL


def exact_ref(path: Path) -> dict[str, object]:
    data = path.read_bytes()
    return {
        "path": path.relative_to(OVERLAY).as_posix(),
        "sha256": hashlib.sha256(data).hexdigest(),
        "size_bytes": len(data),
    }


manifest_path = TARGET / "readiness/wpra/plan-semantic-manifest.json"
report_path = TARGET / "readiness/wpra/work-pack-readiness-report-v2.json"
manifest = json.loads(manifest_path.read_text())
report = json.loads(report_path.read_text())
negative_approval = TARGET / "plan/EXECUTION-ENTRY.json"
config = {
    "schema_version": "1.0.0",
    "chain_id": "proposal-probe-tde-multiformalism-profile-epoch-r4-20260825T001515Z",
    "repository_root": ".",
    "state_directory": "controller-probe-state",
    "scope_id": "DS-TDE-MULTIFORMALISM-PROFILE-EPOCH@20260824T174651Z",
    "manifest_ref": exact_ref(manifest_path),
    "audit_report_ref": exact_ref(report_path),
    "wpra_v2": {
        "audit_config_ref": exact_ref(TARGET / "readiness/audit-config.json"),
        "execution_contracts_ref": exact_ref(TARGET / "plan/work-pack/shared/EXECUTION-CONTRACTS.json"),
        "selection_handoff_ref": exact_ref(TARGET / "readiness/wpra/selection-handoff.json"),
        "initial_selection_request_ref": exact_ref(negative_approval),
        "initial_selection_receipt_ref": exact_ref(negative_approval),
    },
    "audit_verdict": "pass",
    "audit_flags": [],
    "approved_epoch": {
        "epoch_id": manifest["plan_epoch_id"],
        "audit_projection_digest": report["audit_projection_digest"],
        "canonical_semantic_digest": manifest["canonical_semantic_digest"],
        "source_snapshot_digest": manifest["source_snapshot_digest"],
        "decision_gate_approval_receipt_ref": exact_ref(negative_approval),
        "approval_owner_ref": "Rondelli",
        "approval_status": "approved",
    },
    "finite_frontier": [f"TDE-EPOCH-{index:03d}" for index in range(1, 11)],
    "run_budget": {"max_task_session_requests": 10},
    "risk_ceiling": "bounded-write",
    "allowed_task_session_flags": [],
    "persistence": {"mode": "append-only-hash-chain", "collision_policy": "exclusive-create"},
    "compensation": {
        "mode": "none",
        "rationale": "Isolated proposal-only structural probe; no Task Session or canonical mutation is admitted.",
    },
}
output = OVERLAY / "controller-probe-chain-config.json"
output.write_text(json.dumps(config, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(output.relative_to(REPO).as_posix())
