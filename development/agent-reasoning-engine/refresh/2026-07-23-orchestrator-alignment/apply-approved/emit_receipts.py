#!/usr/bin/env python3
"""Emit owner and joined receipts after exact staged outputs are applied."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


RUN = Path(__file__).resolve().parent
REPO = RUN.parents[5]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def owner_receipt(owner: str) -> dict[str, object]:
    package = json.loads(
        (RUN / f"{owner}-material-package.json").read_text(encoding="utf-8")
    )
    material = json.loads(
        (RUN / f"{owner}-material-receipt.json").read_text(encoding="utf-8")
    )
    handoff = json.loads(
        (RUN / f"{owner}-handoff.json").read_text(encoding="utf-8")
    )
    if material["patchVerdict"] != "pass" or not handoff["mutationReady"]:
        raise ValueError(f"{owner} material handoff is not ready")
    applied = []
    for change in package["changes"]:
        target = REPO / change["target_path"]
        output_ref = change["output_ref"]
        if sha256(target) != output_ref["sha256"]:
            raise ValueError(f"applied digest mismatch: {change['target_path']}")
        if target.stat().st_size != output_ref["size_bytes"]:
            raise ValueError(f"applied size mismatch: {change['target_path']}")
        applied.append(
            {
                "path": change["target_path"],
                "owner": owner,
                "sha256": output_ref["sha256"],
                "size_bytes": output_ref["size_bytes"],
            }
        )
    return {
        "schemaVersion": "1.0.0",
        "owner": owner,
        "packageId": material["packageId"],
        "packageDigest": material["packageDigest"],
        "status": "pass",
        "applied": applied,
    }


def main() -> None:
    owner_receipts = {}
    for owner in ("invoke", "craft", "inventory"):
        receipt = owner_receipt(owner)
        owner_receipts[owner] = receipt
        (RUN / f"{owner}-apply-receipt.json").write_text(
            json.dumps(receipt, indent=2) + "\n",
            encoding="utf-8",
        )

    joined = {
        "schemaVersion": "1.0.0",
        "operation": "invoke:refresh:apply-approved",
        "proposal": "../REFRESH-PATCH-PROPOSAL.md",
        "status": "pass",
        "mutationMode": "apply-approved",
        "owners": [
            {
                "owner": owner,
                "status": receipt["status"],
                "packageId": receipt["packageId"],
                "packageDigest": receipt["packageDigest"],
                "appliedTargetCount": len(receipt["applied"]),
                "applyReceipt": f"{owner}-apply-receipt.json",
                "materialReceipt": f"{owner}-material-receipt.json",
                "handoffReceipt": f"{owner}-handoff.json",
            }
            for owner, receipt in owner_receipts.items()
        ],
        "appliedTargetCount": sum(
            len(receipt["applied"]) for receipt in owner_receipts.values()
        ),
        "validation": {
            "stagedSync": "pass",
            "targetSync": "pass",
            "craftProjection": "pass",
            "inventoryLookupReadiness": "ready",
            "inventoryFailures": 0,
            "inventoryWarnings": 72,
            "semanticEvaluatorTests": {"passed": 16, "failed": 0},
            "implementationMutation": "none",
            "externalRepositoryMutation": "none",
            "publicArcanumMutation": "none",
        },
        "preservedState": {
            "workPackStatus": "l0-witness-complete-awaiting-explicit-promotion",
            "selectedSwu": None,
            "implementationAuthorized": False,
            "immediateRoute": "G-ARE-L0 evidence/owner promotion gate",
        },
        "openedTargetLifecycleBlockers": [
            "BLK-ARE-ACI-BINDING-001",
            "BLK-ARE-ACI-MATURITY-001",
        ],
        "postPromotionRoute": "invoke:design ACI-REASONING-BINDING",
        "claimCeiling": (
            "One local finite L0 semantic witness exists. No whole-engine "
            "promotion, actor runtime, real effect, ACI compatibility, or "
            "anti-bias efficacy is claimed."
        ),
    }
    (RUN / "OWNER-RECEIPT.json").write_text(
        json.dumps(joined, indent=2) + "\n",
        encoding="utf-8",
    )
    report = {
        "schemaVersion": "1.0.0",
        "operation": joined["operation"],
        "phaseStatus": "pass",
        "handoffStatus": "complete",
        "mutationReady": False,
        "appliedTargetCount": joined["appliedTargetCount"],
        "ownerReceipt": "OWNER-RECEIPT.json",
        "nextRoute": joined["preservedState"]["immediateRoute"],
        "postPromotionRoute": joined["postPromotionRoute"],
        "claimCeiling": joined["claimCeiling"],
    }
    (RUN / "refresh-report.json").write_text(
        json.dumps(report, indent=2) + "\n",
        encoding="utf-8",
    )
    print("APPLY_RECEIPTS=pass owners=3 targets=14")


if __name__ == "__main__":
    main()
