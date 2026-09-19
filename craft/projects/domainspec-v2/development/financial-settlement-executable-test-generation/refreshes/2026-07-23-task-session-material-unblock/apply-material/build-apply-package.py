#!/usr/bin/env python3
"""Build the one-file Invoke Refresh apply package for current readiness evidence."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


PACKAGE_ID = "dsv2-fstg-refresh-evidence-apply-20260723"
LIFECYCLE_OWNER = "projects/domainspec-v2"
TARGET = (
    "projects/domainspec-v2/development/"
    "financial-settlement-executable-test-generation/INVOKE-EVIDENCE.json"
)
REFRESH_ROOT = (
    "projects/domainspec-v2/development/"
    "financial-settlement-executable-test-generation/refreshes/"
    "2026-07-23-task-session-material-unblock"
)
SESSION_ROOT = (
    "projects/domainspec-v2/development/"
    "financial-settlement-executable-test-generation/session-evidence/"
    "SWU-FSTG-001/20260723T174139Z-declared-subset-mode"
)


def find_repo_root() -> Path:
    for candidate in Path(__file__).resolve().parents:
        if (candidate / ".git").exists():
            return candidate
    raise RuntimeError("repository root not found")


REPO_ROOT = find_repo_root()
APPLY_ROOT = Path(__file__).resolve().parent
STAGED_PREFIX = APPLY_ROOT.relative_to(REPO_ROOT) / "staged"
OUTPUT = APPLY_ROOT / "MATERIAL-PACKAGE.json"

SOURCES = [
    TARGET,
    f"{SESSION_ROOT}/mutation-admission-receipt.json",
    f"{SESSION_ROOT}/continuation-handoff.json",
]
DEPENDENCIES = {
    "execution-material-receipt": f"{REFRESH_ROOT}/material/MATERIAL-RECEIPT.json",
    "execution-material-handoff": f"{REFRESH_ROOT}/material/REFRESH-HANDOFF-RESULT.json",
    "task-session-admission-probe": f"{REFRESH_ROOT}/ADMISSION-PROBE-RECEIPT.json",
    "refresh-dispatch": f"{REFRESH_ROOT}/EXECUTION-DISPATCH.json",
}
VALIDATION_COMMANDS = [
    f"python3 -m json.tool {TARGET}",
    (
        "python3 .agents/skills/dispatch-spec/scripts/validate-dispatch.py "
        f"{REFRESH_ROOT}/EXECUTION-DISPATCH.json"
    ),
]


def sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def exact_ref(path: str) -> dict[str, object]:
    content = (REPO_ROOT / path).read_bytes()
    return {
        "path": path,
        "sha256": sha256(content),
        "size_bytes": len(content),
    }


def main() -> None:
    evidence = json.loads((REPO_ROOT / TARGET).read_text(encoding="utf-8"))
    evidence["refresh"] = {
        "execution_path": [
            "strict Context Builder pack reuse",
            "exact SWU-FSTG-001 post-image materialization",
            "Invoke producer validation",
            "Refresh handoff resolution",
            "Task Session mutation-admission probe",
            "one-file readiness evidence apply",
        ],
        "dispatch_trace": (
            "refreshes/2026-07-23-task-session-material-unblock/"
            "DISPATCH-TRACE.md"
        ),
        "source_evidence": [
            (
                "session-evidence/SWU-FSTG-001/"
                "20260723T174139Z-declared-subset-mode/"
                "mutation-admission-receipt.json"
            ),
            (
                "session-evidence/SWU-FSTG-001/"
                "20260723T174139Z-declared-subset-mode/"
                "continuation-handoff.json"
            ),
            (
                "refreshes/2026-07-23-task-session-material-unblock/"
                "material/MATERIAL-RECEIPT.json"
            ),
            (
                "refreshes/2026-07-23-task-session-material-unblock/"
                "material/REFRESH-HANDOFF-RESULT.json"
            ),
            (
                "refreshes/2026-07-23-task-session-material-unblock/"
                "ADMISSION-PROBE-RECEIPT.json"
            ),
        ],
        "target_inventory": [TARGET],
        "activation_source": "direct-user",
        "mutation_mode": "apply-approved",
        "mutation_mode_source": "explicit",
        "phase_status": "pass",
        "handoff_status": "ready",
        "blocker_scopes": {
            "refresh-authoring": 0,
            "apply-authorization": 0,
            "target-lifecycle": 1,
            "audit": 0,
        },
        "material_package": {
            "execution_package": (
                "refreshes/2026-07-23-task-session-material-unblock/"
                "material/MATERIAL-PACKAGE.json"
            ),
            "execution_receipt": (
                "refreshes/2026-07-23-task-session-material-unblock/"
                "material/MATERIAL-RECEIPT.json"
            ),
            "producer_receipt_schema": (
                ".agents/skills/invoke/schemas/"
                "material-package-receipt.schema.json"
            ),
            "package_id": "dsv2-fstg-swu-001-20260723T174139Z",
            "package_digest": (
                "a096012153a1813bf8a5599d84289d743e2693d80bcc067716b23abfdde7fcb2"
            ),
            "validated_paths": [
                "projects/domainspec-v2/impl/package.json",
                (
                    "projects/domainspec-v2/impl/test-derivation-engine/"
                    "src/bte/development-engine.test.ts"
                ),
                (
                    "projects/domainspec-v2/impl/test-derivation-engine/"
                    "src/bte/development-engine.ts"
                ),
            ],
        },
        "mutation_ready": True,
        "result": "pass",
        "next_route": "task-session:execute:SWU-FSTG-001",
    }
    evidence["capability_ceiling"] = {
        "artifact_authored": "pass",
        "registry_released": False,
        "mutation_runtime_ready": True,
        "capability_status_result": (
            "refreshes/2026-07-23-task-session-material-unblock/"
            "CAPABILITY-STATUS-RESULT.json"
        ),
        "note": (
            "Refresh mutation runtime is receipt-backed; this does not apply "
            "the staged implementation or complete SWU-FSTG-001."
        ),
    }

    staged_relative = (STAGED_PREFIX / TARGET).as_posix()
    staged_path = REPO_ROOT / staged_relative
    staged_path.parent.mkdir(parents=True, exist_ok=True)
    staged_path.write_text(
        json.dumps(evidence, indent=2) + "\n",
        encoding="utf-8",
    )

    dependency_ids = list(DEPENDENCIES)
    document = {
        "schema_version": "1.0.0",
        "package_id": PACKAGE_ID,
        "mutation_mode": "apply-approved",
        "mutation_state": "materialized",
        "lifecycle_owner": LIFECYCLE_OWNER,
        "authority_class": "private",
        "publication_class": "internal",
        "source_artifacts": [
            {**exact_ref(path), "authority_class": "private"}
            for path in SOURCES
        ],
        "changes": [
            {
                "target_path": TARGET,
                "operation": "update",
                "output_ref": exact_ref(staged_relative),
            }
        ],
        "target_inventory": [
            {
                "target_path": TARGET,
                "lifecycle_owner": LIFECYCLE_OWNER,
                "authority_class": "private",
                "publication_class": "internal",
                "dependency_ids": dependency_ids,
            }
        ],
        "dependencies": [
            {
                "dependency_id": dependency_id,
                "artifact_ref": exact_ref(path),
            }
            for dependency_id, path in DEPENDENCIES.items()
        ],
        "mirror_groups": [],
        "approval": {
            "class": "explicit-apply",
            "owner": LIFECYCLE_OWNER,
            "scope_paths": [TARGET],
            "authority_classes": ["private"],
            "publication_classes": ["internal"],
        },
        "validation_commands": VALIDATION_COMMANDS,
    }
    OUTPUT.write_text(
        json.dumps(document, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
