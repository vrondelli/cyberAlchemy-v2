#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[8]
HERE = Path(__file__).resolve().parent
BASE = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "goal-runs/20260806T010816Z-whole-work-pack/rounds/004-ts001b-closeout-sync"
)
STAGED = f"{BASE}/material/staged"
RECEIPT = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "instances/enum/receipts/SWU-APE-ENUM-TS-001B.json"
)
TARGETS = [
    "projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md",
    "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/tasks/TASK-APE-L1-ENUM-TYPESCRIPT.md",
    "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/SWU-MANIFEST.json",
    RECEIPT,
]


def ref(path: str) -> dict[str, Any]:
    data = (ROOT / path).read_bytes()
    return {"path": path, "sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data)}


commands = [
    f"python3 -m json.tool {TARGETS[2]}",
    f"python3 -m json.tool {RECEIPT}",
    "node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/enum/profiles/check-profile-resolution.mjs",
    "cmp <two captured TypeScript profile-resolver outputs>",
    "node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs",
    "git diff --check -- " + " ".join(TARGETS),
]
package = {
    "schema_version": "1.0.0",
    "package_id": "dsv2-ape-ts001b-closeout-20260806T013630Z",
    "mutation_mode": "apply-approved",
    "mutation_state": "materialized",
    "lifecycle_owner": "projects/domainspec-v2",
    "authority_class": "private",
    "publication_class": "internal",
    "source_artifacts": [
        {**ref(RECEIPT), "authority_class": "private"},
        {**ref("projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json"), "authority_class": "private"},
        {**ref("projects/domainspec-v2/development/architecture-pattern-enforcement/goal-runs/20260806T010816Z-whole-work-pack/rounds/003-ts001b-task-session/task-joined.json"), "authority_class": "private"},
    ],
    "changes": [
        {
            "target_path": target,
            "operation": "update",
            "output_ref": ref(f"{STAGED}/{target}"),
        }
        for target in TARGETS
    ],
    "target_inventory": [
        {
            "target_path": target,
            "lifecycle_owner": "projects/domainspec-v2",
            "authority_class": "private",
            "publication_class": "internal",
            "dependency_ids": ["SWU-APE-ENUM-TS-001B"],
        }
        for target in TARGETS
    ],
    "dependencies": [
        {"dependency_id": "SWU-APE-ENUM-TS-001B", "artifact_ref": ref(RECEIPT)}
    ],
    "mirror_groups": [],
    "approval": {
        "class": "explicit-apply",
        "owner": "projects/domainspec-v2",
        "scope_paths": TARGETS,
        "authority_classes": ["private"],
        "publication_classes": ["internal"],
    },
    "validation_commands": commands,
}
(HERE / "material/MATERIAL-PACKAGE.json").write_text(
    json.dumps(package, indent=2, sort_keys=True) + "\n", encoding="utf-8"
)
