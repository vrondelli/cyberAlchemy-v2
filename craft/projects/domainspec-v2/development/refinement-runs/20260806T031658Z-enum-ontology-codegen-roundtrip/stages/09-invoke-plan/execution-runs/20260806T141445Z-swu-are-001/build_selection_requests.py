#!/usr/bin/env python3
"""Build deterministic outer-loop decide and plan-selection requests."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[9]
RUN = Path(__file__).resolve().parent


def exact(path: str) -> dict[str, object]:
    data = (ROOT / path).read_bytes()
    return {"path": path, "sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data)}


phase = sys.argv[1]
initialized = json.loads((RUN / "initialize-readiness-result.json").read_text(encoding="utf-8"))

if phase == "decide":
    request = {
        "operation": "decide",
        "policy": initialized["policy"],
        "state": initialized["state"],
        "available_inputs": [],
        "installed_owner_routes": [],
    }
    output = RUN / "selection-decide-request.json"
elif phase == "selection":
    decided = json.loads((RUN / "selection-decide-result.json").read_text(encoding="utf-8"))
    binding = decided["state"]["current_binding"]
    manifest_path = (
        "projects/domainspec-v2/development/refinement-runs/"
        "20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/"
        "execution-runs/20260806T141445Z-swu-are-001/readiness-run-1/"
        "plan-semantic-manifest.json"
    )
    entry_path = (
        "projects/domainspec-v2/development/refinement-runs/"
        "20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/"
        "EXECUTION-ENTRY.json"
    )
    request = {
        "schemaVersion": "1.0.0",
        "manifestRef": exact(manifest_path),
        "auditConfigPath": str((RUN / "audit-config.json").relative_to(ROOT)),
        "taskId": "TASK-ARE-L0-CONTRACTS",
        "swuId": "SWU-ARE-001",
        "executionIntentBinding": {
            "bindingId": binding["binding_id"],
            "sourceInvocationId": binding["source_invocation_id"],
            "workPackId": binding["work_pack_id"],
            "bindingDigest": binding["binding_digest"],
            "authorityEffect": "bounded-execution-only",
        },
        "dependencyReceipts": [],
        "lifecycleEligibility": {
            "eligible": True,
            "state": "selection-ready",
            "evidenceRefs": [exact(entry_path)],
        },
    }
    output = RUN / "selection-request.json"
else:
    raise SystemExit("phase must be decide or selection")

output.write_text(json.dumps(request, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
