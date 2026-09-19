#!/usr/bin/env python3
"""Generate one run-local WPRA config for the SWU-FCL-001 completed prefix."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


REPOSITORY = Path(__file__).resolve().parents[9]
RUN_DIR = Path(__file__).resolve().parent
PLAN_ROOT = REPOSITORY / (
    "projects/domainspec-v2/development/spec-ontology-branch-decision/"
    "invoke-plan/20260824T165704Z-formalclaim-lean-evf-implementation"
)
SOURCE_CONFIG = PLAN_ROOT / "readiness/audit-config.json"
PREDECESSOR = REPOSITORY / (
    "projects/domainspec-v2/development/spec-ontology-branch-decision/"
    "evidence/formalclaim-lean-evf/SWU-FCL-001/RECEIPT.json"
)
BINDINGS = RUN_DIR / "CONTINUITY-BINDINGS.json"
OUTPUT = RUN_DIR / "CONTINUITY-AUDIT-CONFIG.json"


def exact_ref(path: Path) -> dict[str, object]:
    payload = path.read_bytes()
    return {
        "path": path.relative_to(REPOSITORY).as_posix(),
        "sha256": hashlib.sha256(payload).hexdigest(),
        "size_bytes": len(payload),
    }


def binding(binding_id: str, owner: str, artifact: Path, selector: str) -> dict[str, object]:
    return {
        "binding_id": binding_id,
        "owner_ref": owner,
        "artifact_ref": exact_ref(artifact),
        "selector": selector,
    }


def main() -> int:
    config = json.loads(SOURCE_CONFIG.read_text(encoding="utf-8"))
    completion = binding(
        "completed-SWU-FCL-001",
        "task-session",
        PREDECESSOR,
        "/result",
    )
    closeout = binding(
        "joined-closeout-SWU-FCL-001",
        "task-session",
        PREDECESSOR,
        "/lifecycle_owner_validation/status",
    )
    config["continuity_projection"] = {
        "cursor": "SWU-FCL-002",
        "completed_unit_receipt_refs": [completion],
        "joined_closeout_receipt_refs": [closeout],
        "projected_next_successor": {
            "unit_id": "SWU-FCL-002",
            "canonical_successor_ref": binding(
                "canonical-frontier-SWU-FCL-002",
                "invoke",
                BINDINGS,
                "/continuity/cursor",
            ),
            "projection_owner_ref": "work-pack-readiness-audit",
            "equivalence_validator_ref": binding(
                "continuity-equivalence-SWU-FCL-002",
                "work-pack-readiness-audit",
                BINDINGS,
                "/continuity/equivalence",
            ),
            "continuation_router_verification_receipt_ref": binding(
                "continuation-frontier-verification-SWU-FCL-002",
                "continuation-router",
                BINDINGS,
                "/continuity/verification",
            ),
            "authority_effect": "none",
        },
    }
    OUTPUT.write_text(
        json.dumps(config, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
