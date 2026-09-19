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
    "goal-runs/20260806T010816Z-whole-work-pack/rounds/020-ts004-closeout-sync"
)
STAGED = f"{BASE}/material/staged"
RECEIPT = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "instances/enum/receipts/SWU-APE-ENUM-TS-004.json"
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
    "npm --prefix projects/domainspec-v2/impl exec -- tsx projects/domainspec-v2/impl/architecture-conformance/typescript/runner/enum/cli.ts verify",
    "npm --prefix projects/domainspec-v2/impl exec -- vitest --root projects/domainspec-v2/impl run architecture-conformance/typescript/runner/enum/trust-proof.test.ts",
    "npm --prefix projects/domainspec-v2/impl exec -- tsc --noEmit -p projects/domainspec-v2/impl/architecture-conformance/typescript/runner/enum/tsconfig.json",
    "node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/enum/scenarios/check-evaluation-scenario.mjs",
    "npm --prefix projects/domainspec-v2/impl exec -- vitest --root projects/domainspec-v2/impl run test-derivation-engine/src/bte/proof-engine.test.ts",
    "npm --prefix projects/domainspec-v2/impl run typecheck -- --pretty false",
    "git diff --check -- " + " ".join(TARGETS),
]
package = {
    "schema_version": "1.0.0",
    "package_id": "dsv2-ape-ts004-closeout-20260806T025500Z",
    "mutation_mode": "apply-approved",
    "mutation_state": "materialized",
    "lifecycle_owner": "projects/domainspec-v2",
    "authority_class": "private",
    "publication_class": "internal",
    "source_artifacts": [
        {**ref(RECEIPT), "authority_class": "private"},
        {**ref("projects/domainspec-v2/impl/architecture-conformance/typescript/runner/enum/index.ts"), "authority_class": "private"},
        {**ref("projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/contracts/FROZEN-OBSERVATION.json"), "authority_class": "private"},
        {**ref("projects/domainspec-v2/development/architecture-pattern-enforcement/goal-runs/20260806T010816Z-whole-work-pack/rounds/019-ts004-task-session-repair/task-joined.json"), "authority_class": "private"},
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
            "dependency_ids": ["SWU-APE-ENUM-TS-004"],
        }
        for target in TARGETS
    ],
    "dependencies": [
        {"dependency_id": "SWU-APE-ENUM-TS-004", "artifact_ref": ref(RECEIPT)}
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
