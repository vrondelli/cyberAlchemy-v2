#!/usr/bin/env python3
"""Bind passing material receipts into Invoke Refresh handoff requests."""

from __future__ import annotations

import json
from pathlib import Path


RUN = Path(__file__).resolve().parent


def main() -> None:
    for owner in ("invoke", "craft"):
        receipt_path = RUN / f"{owner}-material-receipt.json"
        receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
        request = {
            "activationSource": "direct-user",
            "mutationMode": "apply-approved",
            "authoredPhaseStatus": "pass",
            "requestedHandoff": "ready",
            "expectedPackageId": receipt["packageId"],
            "expectedPackageDigest": receipt["packageDigest"],
            "materialReceipt": receipt,
        }
        (RUN / f"{owner}-handoff-request.json").write_text(
            json.dumps(request, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
    print("HANDOFF_REQUESTS=2")


if __name__ == "__main__":
    main()

