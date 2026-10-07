#!/usr/bin/env python3
"""Deterministic fresh G01 candidate after r5 manifests; source-only output."""
import argparse
from collections import Counter
import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as pq

from importlib.util import module_from_spec, spec_from_file_location


SEED = "are-g01-cross-branch-cohort-candidate-r2"
QUOTAS = {
    ("c", "ponylang/ponyc", "Multi"): 6,
    ("go", "cli/cli", "Multi"): 3,
    ("go", "grpc/grpc", "Multi"): 2,
    ("go", "zeromicro/go", "Multi"): 1,
    ("javascript", "sveltejs/svelte", "Multi"): 3,
    ("javascript", "serverless/serverless", "Poly"): 3,
    ("rust", "tokio-rs/bytes", "Multi"): 3,
    ("rust", "BurntSushi/ripgrep", "Multi"): 2,
    ("rust", "sharkdp/bat", "Multi"): 1,
}
SOURCE_FIELDS = ["instance_id", "original_inst_id", "repo", "repo_url", "language",
                 "base_commit", "problem_statement", "source"]
ELIGIBILITY_FIELDS = {"instance_id", "repo", "language", "source",
                      "native_gold_files_present", "loader_error"}


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def prior_selector(path: Path):
    spec = spec_from_file_location("g01_prior_source_selector", path)
    if spec is None or spec.loader is None:
        raise ValueError("prior selector unavailable")
    module = module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def propose(eligibility: dict, eligibility_sha: str, source_rows: list[dict]) -> dict:
    rows = eligibility.get("rows")
    if (eligibility.get("schema_version") != "are.g01-g02-cross-branch-gold-eligibility/v1" or
            eligibility.get("status") != "passed" or
            eligibility.get("gold_paths_or_values_exported") is not False or
            eligibility.get("model_calls") != 0 or
            eligibility.get("source_only_rows") != 907 or
            eligibility.get("totals") != {"eligible": 905, "ineligible": 2} or
            not isinstance(rows, list) or len(rows) != 907 or
            any(set(row) != ELIGIBILITY_FIELDS or row["loader_error"] is not False
                for row in rows) or
            len({row["instance_id"] for row in rows}) != len(rows)):
        raise ValueError("eligibility population or schema drift")
    selected, supply = [], {}
    for key, count in QUOTAS.items():
        candidates = [row for row in rows if row["native_gold_files_present"] and
                      (row["language"], row["repo"], row["source"]) == key]
        candidates.sort(key=lambda row: (digest((SEED + "\0" + row["instance_id"]).encode()), row["instance_id"]))
        if len(candidates) < count:
            raise ValueError(f"insufficient source-only supply: {key}")
        supply["/".join(key)] = len(candidates)
        selected.extend({field: row[field] for field in ("instance_id", "repo", "language", "source")}
                        for row in candidates[:count])
    if len(selected) != 24 or len({row["instance_id"] for row in selected}) != 24 or \
            Counter(row["language"] for row in selected) != {"c": 6, "go": 6, "javascript": 6, "rust": 6}:
        raise ValueError("selected cohort invariant")
    lookup = {row["instance_id"]: row for row in source_rows}
    if len(lookup) != len(source_rows) or any(set(row) != set(SOURCE_FIELDS) for row in source_rows):
        raise ValueError("source projection shape or duplicate ID")
    augmented = []
    for selected_row in selected:
        source = lookup.get(selected_row["instance_id"])
        if (source is None or any(source[field] != selected_row[field]
                                  for field in ("repo", "language", "source")) or
                not source["repo_url"].startswith("https://github.com/") or
                not isinstance(source["base_commit"], str) or len(source["base_commit"]) != 40 or
                any(char not in "0123456789abcdef" for char in source["base_commit"])):
            raise ValueError("selected source identity invalid")
        augmented.append({field: source[field] for field in SOURCE_FIELDS})
    return {"schema_version": "are.g01-source-only-cohort-candidate/v1",
            "status": "preflight-only-not-frozen", "seed": SEED,
            "eligibility_receipt_sha256": eligibility_sha,
            "source_supply_sha256": eligibility["source_supply_sha256"],
            "source_parquet_sha256": eligibility["source_parquet_sha256"],
            "quota_by_language_repo_source": {"/".join(key): value for key, value in QUOTAS.items()},
            "available_by_quota": supply, "ordered_tasks": augmented,
            "task_id_set_sha256": digest(("\n".join(sorted(row["instance_id"] for row in augmented)) + "\n").encode()),
            "source_commit_join_verified": True, "gold_values_or_paths_used": False, "model_calls": 0,
            "claim_ceiling": "Source-only deterministic candidate draw; not a frozen cohort, cache/index proof, score, or superiority result.",
            "open_questions": ["Will all 24 exact commits and runner-cache identities pass no-model preflight?",
                               "Will this cross-repository mix fit the VPS storage budget?",
                               "Will a separately frozen campaign pass all primary gates?"]}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--eligibility-receipt", type=Path, required=True)
    parser.add_argument("--expected-sha256", required=True)
    parser.add_argument("--source-supply-receipt", type=Path, required=True)
    parser.add_argument("--prior-selector", type=Path, required=True)
    parser.add_argument("--evolution-root", type=Path, required=True)
    parser.add_argument("--runs-root", type=Path, required=True)
    parser.add_argument("--source-parquet", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    receipt_raw = args.eligibility_receipt.read_bytes()
    if digest(receipt_raw) != args.expected_sha256:
        raise ValueError("eligibility receipt hash drift")
    eligibility = json.loads(receipt_raw)
    supply_raw = args.source_supply_receipt.read_bytes()
    if digest(supply_raw) != eligibility.get("source_supply_sha256"):
        raise ValueError("source supply receipt hash drift")
    prior = prior_selector(args.prior_selector)
    prior.verify_exposure_snapshot(json.loads(supply_raw), args.evolution_root, args.runs_root)
    if digest(args.source_parquet.read_bytes()) != eligibility.get("source_parquet_sha256"):
        raise ValueError("source parquet hash drift")
    if str(args.source_parquet) != json.loads(supply_raw).get("source_parquet"):
        raise ValueError("source parquet path drift")
    source_rows = pq.read_table(args.source_parquet, columns=SOURCE_FIELDS).to_pylist()
    candidate = propose(eligibility, args.expected_sha256, source_rows)
    if not args.out.is_absolute() or not args.out.parent.is_dir():
        raise ValueError("fresh absolute output path in existing directory required")
    data = (json.dumps(candidate, indent=2) + "\n").encode()
    descriptor = os.open(args.out, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "wb") as stream:
        stream.write(data)
    print(json.dumps({"path": str(args.out), "sha256": digest(data),
                      "task_count": len(candidate["ordered_tasks"]), "id_set_sha256": candidate["task_id_set_sha256"]}))


if __name__ == "__main__":
    main()
