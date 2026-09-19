#!/usr/bin/env python3
"""Bind the file-backed material receipt into the Refresh handoff request."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


RUN = Path(
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-refresh/20260824T200520Z-tde-chain-controller-compatibility-apply"
)


def main() -> None:
    receipt_path = RUN / "material/material-package-receipt.json"
    receipt_bytes = receipt_path.read_bytes()
    receipt = json.loads(receipt_bytes.decode("utf-8"))
    if (
        receipt.get("packageId") != "tde-chain-controller-compatibility-apply-20260824T200520Z"
        or receipt.get("packageDigest") != "e01a2ba7da92fd08bb533826241b438c0fee6d5b5d608399bec17299632b4904"
        or receipt.get("patchVerdict") != "pass"
        or receipt.get("mutationHandoff") != "ready"
        or receipt.get("reasons") != []
        or len(receipt.get("validatedPaths", [])) != 84
    ):
        raise SystemExit("HANDOFF_BLOCK: material receipt is not the exact PASS/ready receipt")
    request = {
        "schemaVersion": "1.0.0",
        "activationSource": "direct-user",
        "mutationMode": "apply-approved",
        "authoredPhaseStatus": "pass",
        "requestedHandoff": "ready",
        "expectedPackageId": receipt["packageId"],
        "expectedPackageDigest": receipt["packageDigest"],
        "expectedMaterialReceiptSha256": hashlib.sha256(receipt_bytes).hexdigest(),
        "materialReceipt": receipt,
        "approvalEvidence": {
            "source": "direct-user",
            "request": "invoke:refresh:apply-approved",
            "owner": "Rondelli",
            "scopeRule": "exact equality with the 84 material-package paths",
            "authorityEffect": "none",
        },
    }
    path = RUN / "material/refresh-material-handoff-request.json"
    path.write_text(json.dumps(request, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"status": "pass", "request": str(path)}, sort_keys=True))


if __name__ == "__main__":
    main()
