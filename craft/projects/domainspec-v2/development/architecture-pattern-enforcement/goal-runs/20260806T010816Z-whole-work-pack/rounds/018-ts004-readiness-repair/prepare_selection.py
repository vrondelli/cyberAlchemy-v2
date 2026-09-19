#!/usr/bin/env python3
"""Issue the exact non-authoritative TS004 plan selection receipt."""

from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[8]
RUN_DIR = Path(__file__).resolve().parent
MANIFEST_PATH = RUN_DIR / "run-1/plan-semantic-manifest.json"
CONFIG_PATH = RUN_DIR / "audit-config.json"
DECIDED_PATH = RUN_DIR / "implementation-readiness-decided.json"
TS003_RECEIPT = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "instances/enum/receipts/SWU-APE-ENUM-TS-003.json"
)
DECISION = (
    "projects/domainspec-v2/development/implementation-conformance/"
    "ontology-experiment/profiles/typescript-strict.profile.json"
)
APPROVAL = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "goal-runs/20260806T010816Z-whole-work-pack/rounds/"
    "018-ts004-readiness-repair/APPROVAL-EVIDENCE.json"
)


def exact_ref(path: Path, display_path: str | None = None) -> dict[str, object]:
    data = path.read_bytes()
    return {
        "path": display_path or path.relative_to(ROOT).as_posix(),
        "sha256": hashlib.sha256(data).hexdigest(),
        "size_bytes": len(data),
    }


decided = json.loads(DECIDED_PATH.read_text(encoding="utf-8"))
binding = decided["state"]["current_binding"]
request = {
    "schemaVersion": "1.0.0",
    "manifestRef": exact_ref(MANIFEST_PATH),
    "auditConfigPath": CONFIG_PATH.relative_to(ROOT).as_posix(),
    "taskId": "TASK-APE-L1-ENUM-TYPESCRIPT",
    "swuId": "SWU-APE-ENUM-TS-004",
    "executionIntentBinding": {
        "bindingId": binding["binding_id"],
        "sourceInvocationId": binding["source_invocation_id"],
        "workPackId": binding["work_pack_id"],
        "bindingDigest": binding["binding_digest"],
        "authorityEffect": binding["authority_effect"],
    },
    "dependencyReceipts": [
        {
            "dependencyId": "SWU-APE-ENUM-TS-003",
            "artifactRef": exact_ref(ROOT / TS003_RECEIPT, TS003_RECEIPT),
        }
    ],
    "lifecycleEligibility": {
        "eligible": True,
        "state": "selected",
        "evidenceRefs": [
            exact_ref(ROOT / APPROVAL, APPROVAL),
            exact_ref(ROOT / DECISION, DECISION),
            exact_ref(ROOT / TS003_RECEIPT, TS003_RECEIPT),
        ],
    },
}
request_path = RUN_DIR / "selection-request.json"
receipt_path = RUN_DIR / "selection-receipt.json"
request_path.write_text(
    json.dumps(request, indent=2, sort_keys=True) + "\n", encoding="utf-8"
)
subprocess.run(
    [
        "python3",
        str(
            ROOT
            / "arcanum/spells/work-pack-readiness-audit/scripts/verify_plan_selection.py"
        ),
        str(request_path),
        "--repository-root",
        str(ROOT),
        "--request-schema",
        str(
            ROOT
            / "arcanum/spells/work-pack-readiness-audit/schemas/selection-request.schema.json"
        ),
        "--receipt-schema",
        str(
            ROOT
            / "arcanum/spells/work-pack-readiness-audit/schemas/selection-receipt.schema.json"
        ),
        "--manifest-schema",
        str(
            ROOT
            / "arcanum/spells/work-pack-readiness-audit/schemas/plan-semantic-manifest.schema.json"
        ),
        "--config-schema",
        str(
            ROOT
            / "arcanum/spells/work-pack-readiness-audit/schemas/audit-config-v2.schema.json"
        ),
        "--output",
        str(receipt_path),
    ],
    cwd=ROOT,
    shell=False,
    check=True,
)
receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
if not (
    receipt["selectionVerdict"] == "select"
    and receipt["terminalCode"] == "SELECTION_READY"
    and receipt["swuId"] == "SWU-APE-ENUM-TS-004"
    and receipt["mutationReady"] is False
):
    raise SystemExit("TS004 selection receipt did not select exact unit")
print("PASS: TS004 exact plan selection receipt issued")
