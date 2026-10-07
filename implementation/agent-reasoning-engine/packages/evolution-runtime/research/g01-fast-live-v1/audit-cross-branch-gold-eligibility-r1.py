#!/usr/bin/env python3
"""Evaluator-only native-gold file-presence bits for the source-only G01/G02 pool.

No gold paths, labels, patches, scores, or source content are exported. The
running arms and the source-only selector must not receive this evaluator root.
"""
import argparse
from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path

import pyarrow.parquet as pq


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def source_auditor(path: Path):
    spec = importlib.util.spec_from_file_location("g01_cross_branch_supply", path)
    if spec is None or spec.loader is None:
        raise ValueError("source auditor unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def eligible_source_rows(rows: list[dict], fields: tuple[str, ...], excluded: set[str]) -> list[dict]:
    seen = set()
    admitted = []
    for row in rows:
        identifier = row["instance_id"]
        if identifier in seen:
            raise ValueError("duplicate parquet instance_id")
        seen.add(identifier)
        if identifier in excluded or not all(isinstance(row[field], str) and row[field] for field in fields):
            continue
        commit = row["base_commit"]
        if len(commit) != 40 or any(char not in "0123456789abcdef" for char in commit):
            continue
        admitted.append({key: row[key] for key in ("instance_id", "repo", "language", "source")})
    return admitted


def evaluate(rows: list[dict], loader) -> tuple[list[dict], dict]:
    output = []
    counts = Counter()
    for row in rows:
        identifier = row["instance_id"]
        try:
            gold = loader.get(identifier)
            eligible = bool(gold and gold.files())
            error = False
        except Exception:
            eligible, error = False, True
        output.append({**row, "native_gold_files_present": eligible, "loader_error": error})
        counts["eligible" if eligible else "ineligible"] += 1
        if error:
            counts["loader_errors"] += 1
    return output, dict(counts)


def audit(parquet: Path, evolution_root: Path, runs_root: Path, source_audit_path: Path, auditor_path: Path, loader) -> dict:
    if not all(path.is_absolute() and path.exists() for path in (parquet, evolution_root, runs_root, source_audit_path, auditor_path)):
        raise ValueError("absolute existing inputs required")
    source = source_auditor(auditor_path)
    prior = json.loads(source_audit_path.read_text())
    seen = source.exposure(evolution_root, runs_root)
    if (prior.get("schema_version") != "are.g01-g02-cross-branch-source-supply/v1" or
            prior.get("source_parquet_sha256") != digest(parquet) or
            prior.get("auditor_sha256") != digest(auditor_path) or
            prior.get("exposure_set_sha256") != seen["digests"] or
            prior.get("exposure_counts") != seen["counts"]):
        raise ValueError("source-only supply receipt drift")
    source_rows = eligible_source_rows(pq.read_table(parquet, columns=list(source.FIELDS)).to_pylist(),
                                       source.FIELDS, seen["union"])
    if len(source_rows) != prior["remaining_rows"]:
        raise ValueError("source-only row count drift")
    evaluated, totals = evaluate(source_rows, loader)
    by_language = {}
    for language in sorted({row["language"] for row in evaluated}):
        group = [row for row in evaluated if row["language"] == language]
        by_language[language] = {"total": len(group), "eligible": sum(row["native_gold_files_present"] for row in group)}
    return {"schema_version": "are.g01-g02-cross-branch-gold-eligibility/v1",
            "status": "passed" if not totals.get("loader_errors", 0) else "loader-errors",
            "source_supply_sha256": digest(source_audit_path), "source_parquet_sha256": digest(parquet),
            "source_auditor_sha256": digest(auditor_path), "eligibility_auditor_sha256": digest(Path(__file__)),
            "native_gold_loader": "GoldLoader.files()", "source_only_rows": len(source_rows),
            "totals": totals, "by_language": by_language, "rows": evaluated,
            "gold_paths_or_values_exported": False, "model_calls": 0,
            "claim_ceiling": "Evaluator-only file-presence bits; no score, cache readiness, cohort freeze, or benchmark quality evidence.",
            "open_questions": ["Which eligible rows have verified source caches and source-index support?",
                               "How will G01/G02 select disjoint, representative frozen cohorts without outcome-based choice?"]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--parquet", required=True, type=Path)
    parser.add_argument("--evolution-root", required=True, type=Path)
    parser.add_argument("--runs-root", required=True, type=Path)
    parser.add_argument("--source-audit", required=True, type=Path)
    parser.add_argument("--source-auditor", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    if args.out.exists() or not args.out.parent.is_dir():
        raise ValueError("fresh output file in existing directory required")
    from contextbench.parsers.gold import GoldLoader
    result = audit(args.parquet, args.evolution_root, args.runs_root, args.source_audit,
                   args.source_auditor, GoldLoader(str(args.parquet)))
    descriptor = os.open(args.out, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w") as stream:
        json.dump(result, stream, indent=2)
        stream.write("\n")
    print(json.dumps({"path": str(args.out), "sha256": digest(args.out),
                      "source_only_rows": result["source_only_rows"],
                      "totals": result["totals"], "by_language": result["by_language"]}))


if __name__ == "__main__":
    main()
