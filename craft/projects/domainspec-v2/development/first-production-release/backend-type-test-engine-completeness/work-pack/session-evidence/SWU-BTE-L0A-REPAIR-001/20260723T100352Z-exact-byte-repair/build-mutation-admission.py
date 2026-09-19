#!/usr/bin/env python3
"""Build the Task Session mutation-admission request from Invoke evidence."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


def sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def find_repo_root() -> Path:
    for candidate in Path(__file__).resolve().parents:
        if (candidate / ".git").exists():
            return candidate
    raise RuntimeError("repository root not found")


ROOT = find_repo_root()
SESSION = Path(__file__).resolve().parent
MATERIAL = SESSION / "invoke-material" / "MATERIAL-PACKAGE.json"
MATERIAL_RECEIPT = SESSION / "invoke-material" / "MATERIAL-RECEIPT.json"
PRODUCER_SCHEMA = (
    ROOT / ".agents/skills/invoke/schemas/material-package-receipt.schema.json"
)
OUTPUT = SESSION / "MUTATION-ADMISSION-REQUEST.json"

WORK_PACK = (
    "projects/domainspec-v2/development/first-production-release/"
    "backend-type-test-engine-completeness/WORK-PACK.md"
)
TASK_CONTRACT = (
    "projects/domainspec-v2/development/first-production-release/"
    "backend-type-test-engine-completeness/work-pack/tasks/"
    "TASK-BTE-L0-PROOF-PRIMITIVES.md"
)
CONTEXT_PACK = (
    SESSION / "context-index.json"
).relative_to(ROOT).as_posix()


def request_ref(path: str) -> dict[str, object]:
    content = (ROOT / path).read_bytes()
    return {
        "path": path,
        "sha256": sha256(content),
        "sizeBytes": len(content),
    }


def converted_ref(reference: dict[str, object]) -> dict[str, object]:
    return {
        "path": reference["path"],
        "sha256": reference["sha256"],
        "sizeBytes": reference["size_bytes"],
    }


def main() -> None:
    package = json.loads(MATERIAL.read_text(encoding="utf-8"))
    source_roles = {
        TASK_CONTRACT: "task-contract",
        WORK_PACK: "work-pack",
        CONTEXT_PACK: "context-pack",
    }
    controls = []
    for source in package["source_artifacts"]:
        path = source["path"]
        controls.append(
            {
                **request_ref(path),
                "role": source_roles[path],
                "authorityClass": source["authority_class"],
            }
        )

    request = {
        "schemaVersion": "1.0.0",
        "executionMode": "routed-mutation",
        "taskId": "TASK-BTE-L0-PROOF-PRIMITIVES",
        "swuId": "SWU-BTE-L0A-REPAIR-001",
        "controlArtifacts": controls,
        "dependencyFrontier": [
            {
                "dependencyId": dependency["dependency_id"],
                "artifactRef": converted_ref(dependency["artifact_ref"]),
            }
            for dependency in package["dependencies"]
        ],
        "materialPackage": request_ref(MATERIAL.relative_to(ROOT).as_posix()),
        "materialReceipt": request_ref(
            MATERIAL_RECEIPT.relative_to(ROOT).as_posix()
        ),
        "producerReceiptSchema": request_ref(
            PRODUCER_SCHEMA.relative_to(ROOT).as_posix()
        ),
        "allowedWrites": [
            change["target_path"] for change in package["changes"]
        ],
        "validationCommands": package["validation_commands"],
        "lifecycleOwner": package["lifecycle_owner"],
        "authorityClass": package["authority_class"],
        "publicationClass": package["publication_class"],
    }
    OUTPUT.write_text(
        json.dumps(request, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
