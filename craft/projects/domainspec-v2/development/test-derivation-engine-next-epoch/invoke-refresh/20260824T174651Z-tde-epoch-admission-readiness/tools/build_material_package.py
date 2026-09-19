#!/usr/bin/env python3
"""Freeze the exact create-only Invoke Refresh material package and handoff request."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


REPO = Path(__file__).resolve().parents[7]
REFRESH = Path("projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-refresh/20260824T174651Z-tde-epoch-admission-readiness")
TARGET = Path("projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-define-design-plan/20260824T174651Z-tde-multiformalism-profile-epoch-r2")
STAGED = REPO / REFRESH / "staging" / TARGET
MATERIAL_DIR = REPO / REFRESH / "material"
PACKAGE_PATH = MATERIAL_DIR / "MATERIAL-PACKAGE.json"
RECEIPT_PATH = MATERIAL_DIR / "MATERIAL-RECEIPT.json"


def exact(repo_path: Path) -> dict[str, object]:
    content = (REPO / repo_path).read_bytes()
    return {"path": repo_path.as_posix(), "sha256": hashlib.sha256(content).hexdigest(), "size_bytes": len(content)}


def exact_file(repo_path: Path, source: Path) -> dict[str, object]:
    content = source.read_bytes()
    return {"path": repo_path.as_posix(), "sha256": hashlib.sha256(content).hexdigest(), "size_bytes": len(content)}


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()


def dump(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def main() -> int:
    files = sorted(p for p in STAGED.rglob("*") if p.is_file())
    target_paths = [TARGET / path.relative_to(STAGED) for path in files]
    output_paths = [REFRESH / "staging" / TARGET / path.relative_to(STAGED) for path in files]
    dependency_sources = {
        "tde-epoch-v1": Path("projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-define-design-plan/20260824T165026Z-tde-multiformalism-profile-epoch/acceptance/CANDIDATE-MANIFEST.json"),
        "formalclaim-v3-acceptance": Path("projects/domainspec-v2/development/spec-ontology-branch-decision/invoke-design/20260824T150641Z-formalclaim-lean-evf-integration/owner-admission/RONDELLI-DESIGN-ACCEPTANCE.json"),
        "victor-premerge-rule": Path("projects/domainspec-v2/authority/decisions/2026-08-24-victor-pre-merge-structural-approval.md"),
    }
    package = {
        "schema_version": "1.0.0", "package_id": "invoke-refresh-tde-epoch-r2-20260824t174651z", "mutation_mode": "apply-approved", "mutation_state": "materialized", "lifecycle_owner": "Rondelli", "authority_class": "private", "publication_class": "private",
        "source_artifacts": [{**exact(path), "authority_class": "private"} for path in dependency_sources.values()],
        "changes": [{"target_path": target.as_posix(), "operation": "create", "output_ref": exact_file(output, source)} for target, output, source in zip(target_paths, output_paths, files)],
        "target_inventory": [{"target_path": target.as_posix(), "lifecycle_owner": "Rondelli", "authority_class": "private", "publication_class": "private", "dependency_ids": list(dependency_sources)} for target in target_paths],
        "dependencies": [{"dependency_id": dependency_id, "artifact_ref": exact(path)} for dependency_id, path in dependency_sources.items()], "mirror_groups": [],
        "approval": {"class": "explicit-apply", "owner": "Rondelli", "scope_paths": [path.as_posix() for path in target_paths], "authority_classes": ["private"], "publication_classes": ["private"]},
        "validation_commands": [
            "TDE unit-contract schema, positive fixture, adversarial fixture, and lossless WPRA projection validation",
            "installed Work-Pack execution-entry authoring validator",
            "WPRA v2 audit-config schema validation",
            "Dispatch Spec deterministic validation",
            "Inventory index lookup-readiness validation",
            "all staged JSON parse validation",
            "staged symlink and normalized-path validation",
            "staged Markdown trailing-whitespace and EOF validation",
            "strict Context Builder obligation coverage validation",
            "source-preservation and Define/Design semantic-equivalence validation",
            "Distill Standard/Validate closure and recomposition validation",
        ],
    }
    dump(PACKAGE_PATH, package)
    inventory_entries = [{"path": target.as_posix(), "sha256": hashlib.sha256(source.read_bytes()).hexdigest(), "size_bytes": len(source.read_bytes())} for target, source in zip(target_paths, files)]
    inventory_digest = canonical_digest(inventory_entries)
    dump(MATERIAL_DIR / "TARGET-INVENTORY.json", {"schema_version": "invoke.refresh-target-inventory/v1", "candidate_id": "dsv2-tde-multiformalism-profile-epoch@2", "inventory_scope": "exact create-only successor material", "file_count": len(inventory_entries), "entries": inventory_entries, "inventory_digest": inventory_digest, "authority_effect": "none"})
    if RECEIPT_PATH.is_file():
        receipt_bytes = RECEIPT_PATH.read_bytes()
        receipt = json.loads(receipt_bytes)
        dump(MATERIAL_DIR / "REFRESH-HANDOFF-REQUEST.json", {"activationSource": "direct-user", "authoredPhaseStatus": "pass", "requestedHandoff": "ready", "expectedPackageId": package["package_id"], "expectedPackageDigest": canonical_digest(package), "expectedMaterialReceiptSha256": hashlib.sha256(receipt_bytes).hexdigest(), "materialReceipt": receipt})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
