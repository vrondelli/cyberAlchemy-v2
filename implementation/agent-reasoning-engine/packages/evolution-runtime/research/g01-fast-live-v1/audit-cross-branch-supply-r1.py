#!/usr/bin/env python3
"""Conservative G01/G02 task-supply census; projects only eight source fields.

This never loads patches, gold contexts, score files, or model transcripts.
Manifested IDs are excluded even when an earlier manifest was not dispatched.
"""
import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path

import pyarrow.parquet as pq

FIELDS = (
    "instance_id", "original_inst_id", "repo", "repo_url", "language",
    "base_commit", "problem_statement", "source",
)
G01_PATTERNS = (
    "g01-*/CONFIG.json", "g01-*/*/CONFIG.json", "g01-*/*/*/CONFIG.json",
    "hen-*/CONFIG.json", "g01-*/tasks/*.json",
)
G02_PATTERNS = ("g02-*/COHORT.json", "g02-*/tasks/*.json")
G02_TASK_AUXILIARY = {"binding.json", "SOURCE-ONLY-MANIFEST.json"}


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def manifest_paths(evolution_root: Path, runs_root: Path) -> tuple[list[Path], list[Path]]:
    g01 = sorted({path for pattern in G01_PATTERNS for path in evolution_root.glob(pattern)})
    g02 = sorted({path for root in (evolution_root, runs_root) for pattern in G02_PATTERNS
                  for path in root.glob(pattern) if path.name not in G02_TASK_AUXILIARY})
    prior = evolution_root / "g02-product-replication-cohort-r1.json"
    if not prior.is_file():
        raise ValueError("missing first G02 frozen cohort")
    g02 = sorted(set(g02) | {prior})
    if not g01 or not g02:
        raise ValueError("missing G01 or G02 manifest evidence")
    return g01, g02


def ids_from_manifest(path: Path, branch: str) -> set[str]:
    data = json.loads(path.read_text())
    if not isinstance(data, dict):
        raise ValueError(f"invalid manifest: {path}")
    if branch == "g01" and path.name == "CONFIG.json":
        rows = data.get("tasks")
    elif branch == "g02" and (path.name == "COHORT.json" or path.name == "g02-product-replication-cohort-r1.json"):
        rows = data.get("ordered_tasks")
    else:
        rows = [data]
    if not isinstance(rows, list) or not rows:
        raise ValueError(f"missing task rows: {path}")
    result = set()
    for row in rows:
        identifier = row.get("instance_id") if isinstance(row, dict) else None
        if not isinstance(identifier, str) or not identifier:
            raise ValueError(f"missing instance_id: {path}")
        result.add(identifier)
    return result


def exposure(evolution_root: Path, runs_root: Path) -> dict:
    g01_paths, g02_paths = manifest_paths(evolution_root, runs_root)
    ids = {"g01": set(), "g02": set()}
    files = []
    for branch, paths in (("g01", g01_paths), ("g02", g02_paths)):
        for path in paths:
            found = ids_from_manifest(path, branch)
            ids[branch].update(found)
            files.append({"branch": branch, "path": str(path), "sha256": digest(path), "id_count": len(found)})
    def set_digest(values):
        return hashlib.sha256(("\n".join(sorted(values)) + "\n").encode()).hexdigest()
    union = ids["g01"] | ids["g02"]
    return {"ids": ids, "union": union, "files": files,
            "counts": {"g01_manifested": len(ids["g01"]), "g02_manifested": len(ids["g02"]),
                       "cross_branch_overlap": len(ids["g01"] & ids["g02"]), "union": len(union)},
            "digests": {"g01": set_digest(ids["g01"]), "g02": set_digest(ids["g02"]),
                        "union": set_digest(union)}}


def audit_supply(parquet: Path, evolution_root: Path, runs_root: Path) -> dict:
    if not all(path.is_absolute() and path.exists() for path in (parquet, evolution_root, runs_root)):
        raise ValueError("absolute existing inputs required")
    seen = exposure(evolution_root, runs_root)
    # This projection is the gold-isolation boundary. Never replace it with
    # full-table materialization or use evaluator labels in the selector.
    rows = pq.read_table(parquet, columns=list(FIELDS)).to_pylist()
    remaining = defaultdict(lambda: Counter())
    invalid = Counter()
    all_ids = set()
    for row in rows:
        identifier = row["instance_id"]
        if identifier in all_ids:
            raise ValueError("duplicate parquet instance_id")
        all_ids.add(identifier)
        if identifier in seen["union"]:
            invalid["manifested_exposure"] += 1
            continue
        if not all(isinstance(row[field], str) and row[field] for field in FIELDS):
            invalid["missing_source_field"] += 1
            continue
        commit = row["base_commit"]
        if len(commit) != 40 or any(char not in "0123456789abcdef" for char in commit):
            invalid["invalid_commit"] += 1
            continue
        remaining[row["repo"]][row["source"]] += 1
    repositories = [{"repo": repo, "remaining_by_source": dict(sorted(source_counts.items())),
                     "remaining_total": sum(source_counts.values())}
                    for repo, source_counts in sorted(remaining.items())]
    return {"schema_version": "are.g01-g02-cross-branch-source-supply/v1",
            "status": "source-only-census", "source_parquet": str(parquet),
            "source_parquet_sha256": digest(parquet), "source_only_fields": list(FIELDS),
            "auditor_sha256": digest(Path(__file__)), "manifest_files": seen["files"],
            "exposure_counts": seen["counts"], "exposure_set_sha256": seen["digests"],
            "parquet_rows": len(rows), "excluded_rows": dict(sorted(invalid.items())),
            "remaining_rows": sum(row["remaining_total"] for row in repositories),
            "repositories": repositories,
            "claim_ceiling": "Conservative source-only supply census; not native-gold eligibility, cache readiness, sampling admission, or benchmark quality evidence.",
            "open_questions": ["Which remaining repositories have native-gold file presence and complete source-index caches?",
                               "Can a representative 24-pair cohort be frozen without using any prior G01 or G02 manifested task ID?"]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--parquet", required=True, type=Path)
    parser.add_argument("--evolution-root", required=True, type=Path)
    parser.add_argument("--runs-root", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    if args.out.exists() or not args.out.parent.is_dir():
        raise ValueError("fresh output file in existing directory required")
    result = audit_supply(args.parquet, args.evolution_root, args.runs_root)
    with args.out.open("x") as stream:
        json.dump(result, stream, indent=2)
        stream.write("\n")
    args.out.chmod(0o600)
    print(json.dumps({"path": str(args.out), "sha256": digest(args.out),
                      "exposure_counts": result["exposure_counts"], "remaining_rows": result["remaining_rows"],
                      "repositories": len(result["repositories"])}))


if __name__ == "__main__":
    main()
