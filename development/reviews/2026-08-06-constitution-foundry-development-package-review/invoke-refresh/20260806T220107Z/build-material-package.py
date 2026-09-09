#!/usr/bin/env python3
"""Build the exact-scope Invoke Refresh material package deterministically."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path.cwd()
RUN = Path(
    "cyberAlchemy-v2/development/reviews/"
    "2026-08-06-constitution-foundry-development-package-review/"
    "invoke-refresh/20260806T220107Z"
)
REVIEW = Path(
    "cyberAlchemy-v2/development/reviews/"
    "2026-08-06-constitution-foundry-development-package-review"
)


def file_ref(path: Path, authority_class: str | None = None) -> dict[str, object]:
    data = (ROOT / path).read_bytes()
    ref: dict[str, object] = {
        "path": str(path),
        "sha256": hashlib.sha256(data).hexdigest(),
        "size_bytes": len(data),
    }
    if authority_class is not None:
        ref["authority_class"] = authority_class
    return ref


approval = json.loads((ROOT / RUN / "source-evidence/direct-user-refresh.json").read_text())
scope_paths = approval["scope_paths"]

source_paths = [
    RUN / "source-evidence/direct-user-refresh.json",
    REVIEW / "findings.md",
    REVIEW / "verification.md",
    RUN / "context-pack.json",
    RUN / "dispatch-technique-trace.json",
    RUN / "STAGING-RECEIPT.json",
]

changes = []
inventory = []
for target_path in scope_paths:
    staged_path = RUN / "staging" / target_path
    changes.append(
        {
            "target_path": target_path,
            "operation": "update",
            "output_ref": file_ref(staged_path),
        }
    )
    inventory.append(
        {
            "target_path": target_path,
            "lifecycle_owner": "invoke:refresh:apply-approved",
            "authority_class": "private",
            "publication_class": "internal",
            "dependency_ids": [],
        }
    )

package = {
    "schema_version": "1.0.0",
    "package_id": "invoke-refresh/constitution-foundry/20260806T220107Z-review-fixes",
    "mutation_mode": "apply-approved",
    "mutation_state": "materialized",
    "lifecycle_owner": "invoke:refresh:apply-approved",
    "authority_class": "private",
    "publication_class": "internal",
    "source_artifacts": [file_ref(path, "private") for path in source_paths],
    "changes": changes,
    "target_inventory": inventory,
    "dependencies": [],
    "mirror_groups": [],
    "approval": {
        "class": "explicit-apply",
        "owner": "invoke:refresh:apply-approved",
        "scope_paths": scope_paths,
        "authority_classes": ["private"],
        "publication_classes": ["internal"],
    },
    "validation_commands": [
        "parse every staged JSON file with jq -e",
        "python3 .agents/skills/invoke/scripts/design_scope_extractor.py on staged S06 manifest and compare byte-for-byte with staged denominator receipt",
        "python3 .agents/skills/invoke/scripts/design_selection_validator.py on staged S06 artifacts and compare byte-for-byte with staged selection result",
        "python3 .agents/skills/dispatch-spec/scripts/validate-dispatch.py on staged REFINE-DISPATCH.json --json",
        "validate 19-node acyclic SWU graph, 40 unique routes, 19 readiness contracts, owner acceptance set, serialized/CAS closeout, and W5 route",
        "resolve and digest-check all 34 source-anchor aliases and all seven dispatch supersession bindings",
        "validate 14 exact conditioned negative cases across 12 mutation families",
        "git diff --no-index --check on each of the exact 27 live/staged path pairs",
        "sha256sum -c /tmp/cf-refresh-live-baseline.tsv before live apply",
    ],
}

(ROOT / RUN / "material-package.json").write_text(
    json.dumps(package, indent=2, ensure_ascii=False) + "\n"
)

receipt_path = ROOT / RUN / "material-package-receipt.json"
if receipt_path.is_file():
    material_receipt = json.loads(receipt_path.read_text())
    handoff_request = {
        "activationSource": "direct-user",
        "mutationMode": "apply-approved",
        "authoredPhaseStatus": "pass",
        "requestedHandoff": "ready",
        "expectedPackageId": material_receipt["packageId"],
        "expectedPackageDigest": material_receipt["packageDigest"],
        "materialReceipt": material_receipt,
    }
    (ROOT / RUN / "refresh-handoff-request.json").write_text(
        json.dumps(handoff_request, indent=2, ensure_ascii=False) + "\n"
    )
