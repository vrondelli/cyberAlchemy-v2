#!/usr/bin/env python3
"""Build exact owner-separated material packages from staged refresh outputs."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


RUN = Path(__file__).resolve().parent
REPO = RUN.parents[5]
STAGED_PREFIX = RUN.relative_to(REPO) / "staging/outputs"

SOURCES = [
    "cyberAlchemy-v2/development/agent-reasoning-engine/refresh/2026-07-23-orchestrator-alignment/REFRESH-PATCH-PROPOSAL.md",
    "cyberAlchemy-v2/development/agent-reasoning-engine/refresh/2026-07-23-orchestrator-alignment/CONTEXT-PACK.md",
    "cyberAlchemy-v2/development/agent-reasoning-engine/refresh/2026-07-23-orchestrator-alignment/apply-approved/AUTHORIZATION.md",
    "cyberAlchemy-v2/implementation/agent-reasoning-engine/generated/runs/evaluator-v1-20260723T-session-001/TERMINAL-RECEIPT.json",
]

PACKAGES = {
    "invoke": {
        "id": "ARE-ORCHESTRATOR-ALIGNMENT-INVOKE-APPLY-20260723",
        "targets": [
            "cyberAlchemy-v2/development/agent-reasoning-engine/spec/SPEC.md",
            "cyberAlchemy-v2/development/agent-reasoning-engine/design/ARCHITECTURE.md",
            "cyberAlchemy-v2/development/agent-reasoning-engine/planning/WORK-PACK.md",
            "cyberAlchemy-v2/development/agent-reasoning-engine/planning/work-pack/tasks/TASK-ARE-PROTOCOL-001.md",
            "cyberAlchemy-v2/development/agent-reasoning-engine/planning/work-pack/tasks/TASK-ARE-GOVERNANCE-001.md",
            "cyberAlchemy-v2/development/agent-reasoning-engine/planning/work-pack/waves/W1-L1.md",
        ],
        "validation": [
            "python3 cyberAlchemy-v2/development/agent-reasoning-engine/refresh/2026-07-23-orchestrator-alignment/apply-approved/validate_sync.py --surface target"
        ],
    },
    "craft": {
        "id": "ARE-ORCHESTRATOR-ALIGNMENT-CRAFT-APPLY-20260723",
        "targets": [
            "cyberAlchemy-v2/development/agent-reasoning-engine/.craft/ledger.yml",
            "cyberAlchemy-v2/development/agent-reasoning-engine/.craft/index.json",
            "cyberAlchemy-v2/development/agent-reasoning-engine/CRAFT.md",
        ],
        "validation": [
            "python3 cyberAlchemy-v2/development/agent-reasoning-engine/refresh/2026-07-23-orchestrator-alignment/apply-approved/validate_sync.py --surface target"
        ],
    },
    "inventory": {
        "id": "ARE-ORCHESTRATOR-ALIGNMENT-INVENTORY-APPLY-20260723",
        "targets": [
            ".arcanum/inventory/entries/agent-reasoning-engine-contract-strategy-result-synthesis.md",
            ".arcanum/inventory/entries/cyberalchemy-orchestrator-reasoning-engine-purpose-strategy-result-synthesis.md",
            ".arcanum/inventory/index.md",
            ".arcanum/inventory/index.json",
            ".arcanum/inventory/log.md",
        ],
        "validation": [
            "python3 cyberAlchemy-v2/development/agent-reasoning-engine/refresh/2026-07-23-orchestrator-alignment/apply-approved/validate_sync.py --surface target",
            ".agents/skills/inventory/scripts/validate-index-json.sh .arcanum/inventory/index.json",
        ],
    },
}


def exact_ref(path: Path) -> dict[str, object]:
    content = (REPO / path).read_bytes()
    return {
        "path": path.as_posix(),
        "sha256": hashlib.sha256(content).hexdigest(),
        "size_bytes": len(content),
    }


def build(owner: str, config: dict[str, object]) -> dict[str, object]:
    targets: list[str] = config["targets"]  # type: ignore[assignment]
    changes = []
    target_inventory = []
    dependencies = []
    for ordinal, target in enumerate(targets, 1):
        target_path = Path(target)
        dependency_id = f"baseline-{ordinal}"
        changes.append(
            {
                "target_path": target,
                "operation": "update",
                "output_ref": exact_ref(STAGED_PREFIX / target_path),
            }
        )
        target_inventory.append(
            {
                "target_path": target,
                "lifecycle_owner": owner,
                "authority_class": "private",
                "publication_class": "internal",
                "dependency_ids": [dependency_id],
            }
        )
        dependencies.append(
            {
                "dependency_id": dependency_id,
                "artifact_ref": exact_ref(target_path),
            }
        )
    return {
        "schema_version": "1.0.0",
        "package_id": config["id"],
        "mutation_mode": "apply-approved",
        "mutation_state": "materialized",
        "lifecycle_owner": owner,
        "authority_class": "private",
        "publication_class": "internal",
        "source_artifacts": [
            {**exact_ref(Path(path)), "authority_class": "private"}
            for path in SOURCES
        ],
        "changes": changes,
        "target_inventory": target_inventory,
        "dependencies": dependencies,
        "mirror_groups": [],
        "approval": {
            "class": "explicit-apply",
            "owner": owner,
            "scope_paths": targets,
            "authority_classes": ["private"],
            "publication_classes": ["internal"],
        },
        "validation_commands": config["validation"],
    }


def main() -> None:
    for owner, config in PACKAGES.items():
        package = build(owner, config)
        (RUN / f"{owner}-material-package.json").write_text(
            json.dumps(package, indent=2) + "\n",
            encoding="utf-8",
        )
    print("MATERIAL_PACKAGES=pass owners=invoke,craft,inventory")


if __name__ == "__main__":
    main()
