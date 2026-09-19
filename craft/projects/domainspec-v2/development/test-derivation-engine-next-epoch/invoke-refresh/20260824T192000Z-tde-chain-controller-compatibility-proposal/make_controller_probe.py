#!/usr/bin/env python3
"""Build a non-authoritative controller probe over the proposal staging overlay."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


REPO = Path(__file__).resolve().parents[6]
RUN = Path(__file__).resolve().parent
OVERLAY_ROOT = RUN / "validation/repository-overlay"
TARGET_REL = Path(
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-define-design-plan/20260824T192000Z-tde-multiformalism-profile-epoch-r3"
)
OVERLAY_TARGET = OVERLAY_ROOT / TARGET_REL


def exact_ref(path: Path) -> dict[str, object]:
    data = path.read_bytes()
    return {
        "path": path.relative_to(OVERLAY_ROOT).as_posix(),
        "sha256": hashlib.sha256(data).hexdigest(),
        "size_bytes": len(data),
    }


manifest_path = OVERLAY_TARGET / "readiness/wpra/plan-semantic-manifest.json"
report_path = OVERLAY_TARGET / "readiness/wpra/work-pack-readiness-report-v2.json"
manifest = json.loads(manifest_path.read_text())
report = json.loads(report_path.read_text())

config = {
    "schema_version": "1.0.0",
    "chain_id": "proposal-probe-tde-multiformalism-profile-epoch-r3-20260824T192000Z",
    "repository_root": ".",
    "state_directory": "controller-probe-state",
    "scope_id": "DS-TDE-MULTIFORMALISM-PROFILE-EPOCH@20260824T174651Z",
    "manifest_ref": exact_ref(manifest_path),
    "audit_report_ref": exact_ref(report_path),
    "wpra_v2": {
        "audit_config_ref": exact_ref(OVERLAY_TARGET / "readiness/audit-config.json"),
        "execution_contracts_ref": exact_ref(
            OVERLAY_TARGET / "plan/work-pack/shared/EXECUTION-CONTRACTS.json"
        ),
        "selection_handoff_ref": exact_ref(
            OVERLAY_TARGET / "readiness/wpra/selection-handoff.json"
        ),
        # These are intentionally real, incompatible non-selection artifacts. The probe must
        # stop at the earlier missing @3 epoch-approval lifecycle gate; it must not
        # invent selection authority merely to exercise controller structure.
        "initial_selection_request_ref": exact_ref(
            OVERLAY_TARGET / "plan/EXECUTION-ENTRY.json"
        ),
        "initial_selection_receipt_ref": exact_ref(
            OVERLAY_TARGET / "plan/EXECUTION-ENTRY.json"
        ),
    },
    "audit_verdict": "pass",
    "audit_flags": [],
    "approved_epoch": {
        "epoch_id": manifest["plan_epoch_id"],
        "audit_projection_digest": report["audit_projection_digest"],
        "canonical_semantic_digest": manifest["canonical_semantic_digest"],
        "source_snapshot_digest": manifest["source_snapshot_digest"],
        # The exact @3 execution entry is deliberately supplied as a negative
        # non-approval fixture. EPOCH_APPROVAL_INVALID is therefore the correct
        # expected lifecycle stop without copying or synthesizing approval bytes.
        "decision_gate_approval_receipt_ref": exact_ref(
            OVERLAY_TARGET / "plan/EXECUTION-ENTRY.json"
        ),
        "approval_owner_ref": "Rondelli",
        "approval_status": "approved",
    },
    "finite_frontier": [f"TDE-EPOCH-{index:03d}" for index in range(1, 11)],
    "run_budget": {"max_task_session_requests": 10},
    "risk_ceiling": "bounded-write",
    "allowed_task_session_flags": [],
    "persistence": {
        "mode": "append-only-hash-chain",
        "collision_policy": "exclusive-create",
    },
    "compensation": {
        "mode": "none",
        "rationale": (
            "This is an isolated proposal-only structural probe. No Task Session "
            "or canonical mutation is admitted."
        ),
    },
}

output = OVERLAY_ROOT / "controller-probe-chain-config.json"
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(config, indent=2, ensure_ascii=False) + "\n")
print(output.relative_to(REPO).as_posix())
