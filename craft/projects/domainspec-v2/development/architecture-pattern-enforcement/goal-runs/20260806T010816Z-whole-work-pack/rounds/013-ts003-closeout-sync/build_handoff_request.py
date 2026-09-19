#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
receipt = json.loads((HERE / "material/MATERIAL-RECEIPT.json").read_text(encoding="utf-8"))
request = {
    "activationSource": "direct-user",
    "mutationMode": "apply-approved",
    "authoredPhaseStatus": "pass",
    "requestedHandoff": "ready",
    "expectedPackageId": receipt["packageId"],
    "expectedPackageDigest": receipt["packageDigest"],
    "materialReceipt": receipt,
}
(HERE / "material/REFRESH-HANDOFF-REQUEST.json").write_text(
    json.dumps(request, indent=2, sort_keys=True) + "\n", encoding="utf-8"
)
