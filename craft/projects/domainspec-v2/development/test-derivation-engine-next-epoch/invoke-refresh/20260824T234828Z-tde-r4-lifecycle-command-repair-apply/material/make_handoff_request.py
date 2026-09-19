#!/usr/bin/env python3
"""Bind the exact current material receipt into the Refresh apply handoff request."""

import hashlib
import json
from pathlib import Path


RUN = Path(__file__).resolve().parents[1]
receipt_path = RUN / "material/material-package-receipt.json"
receipt_bytes = receipt_path.read_bytes()
receipt = json.loads(receipt_bytes)
request = {
    "schemaVersion": "1.0.0",
    "activationSource": "direct-user",
    "mutationMode": "apply-approved",
    "authoredPhaseStatus": "pass",
    "requestedHandoff": "ready",
    "expectedPackageId": "tde-r4-lifecycle-command-repair-apply-20260824T234828Z",
    "expectedPackageDigest": "fe48f463b428afec6c8126b33bd4de454b38f5fb362b36306c62a5cedfa9d1ad",
    "expectedMaterialReceiptSha256": hashlib.sha256(receipt_bytes).hexdigest(),
    "materialReceipt": receipt,
}
(RUN / "material/refresh-material-handoff-request.json").write_text(
    json.dumps(request, indent=2, sort_keys=True) + "\n", encoding="utf-8"
)
