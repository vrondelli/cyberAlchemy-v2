#!/usr/bin/env python3
"""Build the review-only M11 legacy retirement manifest.

Open questions: ../authority/definitions/DEFINITIONS.md#open-questions.
"""
from __future__ import annotations

import hashlib
import json
import os
from collections import Counter
from pathlib import Path


CA2 = Path(__file__).resolve().parents[2]
EXTERNAL = Path("/home/vrondelli/projects/cya-orquestrator")
M0 = CA2 / "orchestrator/migration/m0/SOURCE-MANIFEST.json"
OUT = CA2 / "orchestrator/migration/m11"
LOCAL_ROOTS = {"work-orchestration", "work-orchestration-implementation"}
EXTERNAL_ROOTS = {
    "cyberAlchemy-v2/work-orchestration-implementation",
    "cyberAlchemy-v2/product/orchestrator",
    "projects/cyberalchemy-orchestrator",
}
CACHE_NAMES = {".git", ".playwright-cli", "__pycache__", "node_modules", "target"}


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            value.update(chunk)
    return value.hexdigest()


def tree_digest(path: Path) -> str | None:
    if not path.exists():
        return None
    value = hashlib.sha256()
    for item in sorted(candidate for candidate in path.rglob("*") if candidate.is_file()):
        if any(part in CACHE_NAMES for part in item.relative_to(path).parts):
            continue
        relative = item.relative_to(path).as_posix()
        value.update(relative.encode())
        value.update(b"\0")
        value.update(digest(item).encode())
        value.update(b"\n")
    return value.hexdigest()


def responsibility(entry: dict) -> str:
    path = entry["source_path"].lower()
    if "/frontend/" in f"/{path}/" or path.endswith("/frontend"):
        return "orchestrator/frontend"
    if "/deployment/" in f"/{path}/":
        return "orchestrator/deployment"
    if "/schemas/" in f"/{path}/" or path.endswith(".schema.json"):
        return "orchestrator/contracts"
    if "/product/orchestrator/" in f"/{path}/" or "/product/" in f"/{path}/":
        return "orchestrator/product"
    if any(token in path for token in ("strategy", "dispatch", "gateway_agent", "agent-turn", "research_contract")):
        return "orchestrator/capabilities"
    if any(token in path for token in ("/runtime/src/dag", "rwo-rust", "unified_work", "unified_composition")):
        return "orchestrator/rwo"
    if "/runtime/" in f"/{path}/":
        return "orchestrator/runtime"
    if "/docs/" in f"/{path}/" or path.endswith(".md"):
        return "orchestrator/docs"
    if entry["source_root"] == "work-orchestration":
        if any(token in path for token in ("nodes.json", "relations.json")):
            return "orchestrator/ontology"
        return "orchestrator/authority"
    return "orchestrator/migration/m0/SOURCE-MANIFEST.json"


def source_path(entry: dict) -> Path:
    if entry["repo_id"] == "cyberalchemy-v2":
        return CA2 / entry["source_path"]
    return EXTERNAL / entry["source_path"]


def selected(entry: dict) -> bool:
    return (
        entry["repo_id"] == "cyberalchemy-v2" and entry["source_root"] in LOCAL_ROOTS
    ) or (entry["repo_id"] == "cya-orquestrator" and entry["source_root"] in EXTERNAL_ROOTS)


def walk_source_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for directory, names, filenames in os.walk(root):
        names[:] = sorted(name for name in names if name not in CACHE_NAMES)
        for name in sorted(filenames):
            candidate = Path(directory) / name
            if candidate.is_file():
                files.append(candidate)
    return files


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    frozen = json.loads(M0.read_text(encoding="utf-8"))
    entries = [entry for entry in frozen["entries"] if selected(entry)]
    responsibility_digests: dict[str, str | None] = {}
    records = []
    known = {(entry["repo_id"], entry["source_path"]) for entry in entries}
    for index, entry in enumerate(entries):
        current = source_path(entry)
        current_sha = digest(current) if current.is_file() else None
        target = responsibility(entry)
        responsibility_digests.setdefault(target, tree_digest(CA2 / target))
        needs_review = bool(entry["owner_work"]) or current_sha != entry["sha256"]
        records.append(
            {
                "entry": index,
                "repo_id": entry["repo_id"],
                "source_path": entry["source_path"],
                "classification": entry["classification"],
                "git_state_at_m0": entry["git_state"],
                "owner_work_at_m0": entry["owner_work"],
                "m0_sha256": entry["sha256"],
                "current_sha256": current_sha,
                "matches_m0": current_sha == entry["sha256"],
                "m0_migration_decision": entry["migration_decision"],
                "responsibility_ref": target,
                "responsibility_tree_sha256": responsibility_digests[target],
                "evidence_ref": f"orchestrator/migration/m0/SOURCE-MANIFEST.json#entries[{index}]",
                "retirement_review": "required" if needs_review else "eligible-after-manifest-review",
            }
        )

    unrecorded = []
    for repo_id, base, roots in (
        ("cyberalchemy-v2", CA2, LOCAL_ROOTS),
        ("cya-orquestrator", EXTERNAL, EXTERNAL_ROOTS),
    ):
        for root in sorted(roots):
            for path in walk_source_files(base / root):
                relative = path.relative_to(base).as_posix()
                if (repo_id, relative) not in known:
                    unrecorded.append(
                        {"repo_id": repo_id, "source_path": relative, "sha256": digest(path)}
                    )

    external_residue = []
    canonical_matches = hashlib.sha256()
    canonical_match_count = 0
    selected_prefixes = tuple(root + "/" for root in EXTERNAL_ROOTS)
    for path in walk_source_files(EXTERNAL):
        relative = path.relative_to(EXTERNAL).as_posix()
        if relative in EXTERNAL_ROOTS or relative.startswith(selected_prefixes):
            continue
        external_sha = digest(path)
        canonical = None
        if relative.startswith("cyberAlchemy-v2/"):
            canonical = CA2 / relative.removeprefix("cyberAlchemy-v2/")
        if canonical and canonical.is_file() and digest(canonical) == external_sha:
            canonical_match_count += 1
            canonical_matches.update(relative.encode())
            canonical_matches.update(b"\0")
            canonical_matches.update(external_sha.encode())
            canonical_matches.update(b"\n")
            continue
        external_residue.append(
            {
                "source_path": relative,
                "sha256": external_sha,
                "size_bytes": path.stat().st_size,
                "canonical_ref": str(canonical.relative_to(CA2)) if canonical and canonical.exists() else None,
                "disposition": "preservation-review-required",
            }
        )

    path_manifest = OUT / "RETIREMENT-PATHS.jsonl"
    path_manifest.write_text(
        "".join(json.dumps(record, sort_keys=True) + "\n" for record in records),
        encoding="utf-8",
    )
    residue_manifest = OUT / "EXTERNAL-REPOSITORY-RESIDUE.jsonl"
    residue_manifest.write_text(
        "".join(json.dumps(record, sort_keys=True) + "\n" for record in external_residue),
        encoding="utf-8",
    )

    summary = {
        "schema_version": "cav2-orchestrator-retirement-manifest/v1-candidate",
        "manifest_id": "ORCH-MIGRATION-M11-RETIREMENT-20260913-001",
        "stage": "M11",
        "status": "review-required",
        "authority_effect": "none",
        "deletion_authorized": False,
        "deletion_performed": False,
        "retirement_roots": [
            str(CA2 / "work-orchestration"),
            str(CA2 / "work-orchestration-implementation"),
            str(EXTERNAL),
        ],
        "frozen_orchestration_paths": {
            "count": len(records),
            "path_manifest": "RETIREMENT-PATHS.jsonl",
            "path_manifest_sha256": digest(path_manifest),
            "classification_counts": dict(sorted(Counter(record["classification"] for record in records).items())),
            "review_counts": dict(sorted(Counter(record["retirement_review"] for record in records).items())),
            "m0_drift_count": sum(not record["matches_m0"] for record in records),
            "unrecorded_non_cache_paths": unrecorded,
        },
        "external_repository_residue": {
            "exact_canonical_match_count": canonical_match_count,
            "exact_canonical_match_set_sha256": canonical_matches.hexdigest(),
            "preservation_review_count": len(external_residue),
            "preservation_review_manifest": "EXTERNAL-REPOSITORY-RESIDUE.jsonl",
            "preservation_review_manifest_sha256": digest(residue_manifest),
        },
        "disposable_subtree_rules": [
            {"pattern": ".git/**", "classification": "version-control-metadata"},
            {"pattern": "**/target/**", "classification": "build-cache"},
            {"pattern": "**/node_modules/**", "classification": "dependency-cache"},
            {"pattern": "**/.playwright-cli/**", "classification": "browser-session-cache"},
            {"pattern": "**/__pycache__/**", "classification": "language-cache"},
        ],
        "blockers": [
            "Every M0 owner-work entry requires reviewer confirmation before deletion.",
            "Every external residue entry must be preserved or explicitly classified before whole-repository retirement.",
            "M12 and M13 require their own reviewed deletion effects."
        ],
        "claim_ceiling": "Reviewable candidate mapping only; no deletion, definition admission, deployment, publication, commit, push, or authority effect.",
        "open_questions_ref": "../../authority/definitions/DEFINITIONS.md#open-questions",
    }
    (OUT / "RETIREMENT-MANIFEST.json").write_text(
        json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    print(json.dumps({
        "status": summary["status"],
        "frozen_paths": len(records),
        "m0_drift": summary["frozen_orchestration_paths"]["m0_drift_count"],
        "unrecorded": len(unrecorded),
        "external_residue": len(external_residue),
        "canonical_matches": canonical_match_count,
    }, sort_keys=True))


if __name__ == "__main__":
    main()
