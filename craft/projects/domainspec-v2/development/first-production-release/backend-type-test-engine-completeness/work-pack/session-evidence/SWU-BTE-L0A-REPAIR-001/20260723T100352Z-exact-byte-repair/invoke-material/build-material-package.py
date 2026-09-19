#!/usr/bin/env python3
"""Build the exact Invoke material handoff for SWU-BTE-L0A-REPAIR-001."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


PACKAGE_ID = "dsv2-bte-l0a-repair-20260723T100352Z"
LIFECYCLE_OWNER = "private DomainSpec v2 BTE implementation owner via task-session"


def sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def find_repo_root() -> Path:
    for candidate in Path(__file__).resolve().parents:
        if (candidate / ".git").exists():
            return candidate
    raise RuntimeError("repository root not found")


REPO_ROOT = find_repo_root()
MATERIAL_ROOT = Path(__file__).resolve().parent
SESSION_ROOT = MATERIAL_ROOT.parent
STAGED_PREFIX = MATERIAL_ROOT.relative_to(REPO_ROOT) / "staged"
OUTPUT = MATERIAL_ROOT / "MATERIAL-PACKAGE.json"
CONTEXT_INDEX = SESSION_ROOT / "context-index.json"

WORK_PACK = (
    "projects/domainspec-v2/development/first-production-release/"
    "backend-type-test-engine-completeness/WORK-PACK.md"
)
TASK_CONTRACT = (
    "projects/domainspec-v2/development/first-production-release/"
    "backend-type-test-engine-completeness/work-pack/tasks/"
    "TASK-BTE-L0-PROOF-PRIMITIVES.md"
)
CONTEXT_PACK = CONTEXT_INDEX.relative_to(REPO_ROOT).as_posix()
APPROVAL = (
    "projects/domainspec-v2/development/first-production-release/"
    "backend-type-test-engine-completeness/goals/"
    "bte-l0a-repair-through-l8-one-shot/APPROVAL-RECORD.json"
)

DEPENDENCIES = {
    "campaign-approval": APPROVAL,
    "l0a-execution-receipt": (
        "projects/domainspec-v2/development/first-production-release/"
        "backend-type-test-engine-completeness/work-pack/session-evidence/"
        "SWU-BTE-L0A-001/20260723T020759Z-contract-publication/"
        "execution-receipt.json"
    ),
    "l0a-continuation-handoff": (
        "projects/domainspec-v2/development/first-production-release/"
        "backend-type-test-engine-completeness/work-pack/session-evidence/"
        "SWU-BTE-L0A-001/20260723T020759Z-contract-publication/"
        "continuation-handoff.json"
    ),
    "l0a-publication-receipt": (
        "projects/domainspec-v2/development/first-production-release/"
        "backend-type-test-engine-completeness/runs/20260723T020759Z/l0a/"
        "contract-publication-receipt.json"
    ),
    "l0a-write-manifest": (
        "projects/domainspec-v2/development/first-production-release/"
        "backend-type-test-engine-completeness/runs/20260723T020759Z/l0a/"
        "output-write-manifest.json"
    ),
    "matching-contract-control": (
        "projects/domainspec-v2/impl/test-derivation-engine/src/bte/contracts/"
        "contract-publication-receipt.v1.schema.json"
    ),
}

VERIFY = (
    "python3 projects/domainspec-v2/development/first-production-release/"
    "backend-type-test-engine-completeness/work-pack/session-evidence/"
    "SWU-BTE-L0A-REPAIR-001/20260723T100352Z-exact-byte-repair/"
    "verify-byte-repair.py --mode post"
)

VALIDATION_COMMANDS = [
    VERIFY,
    "npm --prefix projects/domainspec-v2/impl run verify:bte:contract-publication",
    (
        "cd projects/domainspec-v2/impl/test-derivation-engine && "
        "npx vitest run src/bte/contract-publication.test.ts"
    ),
    "npm --prefix projects/domainspec-v2/impl run engine:test",
    "npm --prefix projects/domainspec-v2/impl run typecheck",
    "npm --prefix projects/domainspec-v2/impl run validate:docs",
    "git diff --check",
]


def exact_ref(path: str) -> dict[str, object]:
    content = (REPO_ROOT / path).read_bytes()
    return {
        "path": path,
        "sha256": sha256(content),
        "size_bytes": len(content),
    }


def main() -> None:
    context = json.loads(CONTEXT_INDEX.read_text(encoding="utf-8"))
    targets = [target["path"] for target in context["byte_targets"]]
    staged_paths: dict[str, str] = {}

    for target in context["byte_targets"]:
        live = (REPO_ROOT / target["path"]).read_bytes()
        if sha256(live) != target["pre_sha256"]:
            raise RuntimeError(f"preimage mismatch: {target['path']}")
        staged = live + b"\n"
        if sha256(staged) != target["post_sha256"]:
            raise RuntimeError(f"postimage mismatch: {target['path']}")
        staged_relative = (STAGED_PREFIX / target["path"]).as_posix()
        staged_path = REPO_ROOT / staged_relative
        staged_path.parent.mkdir(parents=True, exist_ok=True)
        staged_path.write_bytes(staged)
        staged_paths[target["path"]] = staged_relative

    dependency_ids = list(DEPENDENCIES)
    document = {
        "schema_version": "1.0.0",
        "package_id": PACKAGE_ID,
        "mutation_mode": "apply-approved",
        "mutation_state": "materialized",
        "lifecycle_owner": LIFECYCLE_OWNER,
        "authority_class": "private",
        "publication_class": "private",
        "source_artifacts": [
            {**exact_ref(TASK_CONTRACT), "authority_class": "private"},
            {**exact_ref(WORK_PACK), "authority_class": "private"},
            {**exact_ref(CONTEXT_PACK), "authority_class": "private"},
        ],
        "changes": [
            {
                "target_path": target,
                "operation": "update",
                "output_ref": exact_ref(staged_paths[target]),
            }
            for target in targets
        ],
        "target_inventory": [
            {
                "target_path": target,
                "lifecycle_owner": LIFECYCLE_OWNER,
                "authority_class": "private",
                "publication_class": "private",
                "dependency_ids": dependency_ids,
            }
            for target in targets
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
            "scope_paths": targets,
            "authority_classes": ["private"],
            "publication_classes": ["private"],
        },
        "validation_commands": VALIDATION_COMMANDS,
    }
    OUTPUT.write_text(
        json.dumps(document, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
