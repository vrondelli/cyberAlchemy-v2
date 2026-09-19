#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[8]
HERE = Path(__file__).resolve().parent
BASE = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "goal-runs/20260806T010816Z-whole-work-pack/rounds/017-ts004-command-path-repair"
)
TARGETS = [
    "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/tasks/TASK-APE-L1-ENUM-TYPESCRIPT.md",
    "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/SWU-MANIFEST.json",
]
DEPENDENCY = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "instances/enum/receipts/SWU-APE-ENUM-TS-003.json"
)


def ref(path: str) -> dict[str, object]:
    data = (ROOT / path).read_bytes()
    return {"path": path, "sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data)}


package_path = HERE / "material/MATERIAL-PACKAGE.json"
package = {
    "schema_version": "1.0.0",
    "package_id": "dsv2-ape-ts004-command-path-repair-20260806T024500Z",
    "mutation_mode": "apply-approved",
    "mutation_state": "materialized",
    "lifecycle_owner": "projects/domainspec-v2",
    "authority_class": "private",
    "publication_class": "internal",
    "source_artifacts": [
        {**ref(DEPENDENCY), "authority_class": "private"},
        {**ref("projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md"), "authority_class": "private"},
    ],
    "changes": [
        {
            "target_path": target,
            "operation": "update",
            "output_ref": ref(f"{BASE}/material/staged/{target}"),
        }
        for target in TARGETS
    ],
    "target_inventory": [
        {
            "target_path": target,
            "lifecycle_owner": "projects/domainspec-v2",
            "authority_class": "private",
            "publication_class": "internal",
            "dependency_ids": ["SWU-APE-ENUM-TS-003"],
        }
        for target in TARGETS
    ],
    "dependencies": [
        {"dependency_id": "SWU-APE-ENUM-TS-003", "artifact_ref": ref(DEPENDENCY)}
    ],
    "mirror_groups": [],
    "approval": {
        "class": "explicit-apply",
        "owner": "projects/domainspec-v2",
        "scope_paths": TARGETS,
        "authority_classes": ["private"],
        "publication_classes": ["internal"],
    },
    "validation_commands": [
        f"python3 -m json.tool {TARGETS[1]}",
        "git diff --check -- " + " ".join(TARGETS),
    ],
}
package_path.write_text(json.dumps(package, indent=2, sort_keys=True) + "\n", encoding="utf-8")
receipt_path = HERE / "material/MATERIAL-RECEIPT.json"
subprocess.run(
    [
        "python3",
        ".agents/skills/invoke/scripts/material_package_validator.py",
        "--root", ".",
        "--schema-dir", ".agents/skills/invoke/schemas",
        "--output", str(receipt_path.relative_to(ROOT)),
        str(package_path.relative_to(ROOT)),
    ],
    cwd=ROOT,
    check=True,
)
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
request_path = HERE / "material/REFRESH-HANDOFF-REQUEST.json"
request_path.write_text(json.dumps(request, indent=2, sort_keys=True) + "\n", encoding="utf-8")
subprocess.run(
    [
        "python3",
        ".agents/skills/invoke/scripts/refresh_material_handoff.py",
        "--receipt-schema", ".agents/skills/invoke/schemas/material-package-receipt.schema.json",
        "--output", str((HERE / "material/REFRESH-HANDOFF-RESULT.json").relative_to(ROOT)),
        str(request_path.relative_to(ROOT)),
    ],
    cwd=ROOT,
    check=True,
)
