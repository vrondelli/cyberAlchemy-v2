#!/usr/bin/env python3
"""Propose, but never freeze, a G01 cohort from evaluator-exported eligibility bits.

The input contains identifiers, repository/language/source, and a file-presence
Boolean. It must contain no gold locations, labels, patches, scores, or runs.
No parquet or prior predictions are read, and this command writes nothing.
"""
import argparse
from collections import Counter
import hashlib
import json
import os
from pathlib import Path


QUOTAS = {
    ("c", "ponylang/ponyc", "Multi"): 6,
    ("go", "cli/cli", "Multi"): 3,
    ("go", "grpc/grpc", "Multi"): 3,
    ("javascript", "sveltejs/svelte", "Multi"): 3,
    ("javascript", "serverless/serverless", "Poly"): 3,
    ("rust", "tokio-rs/tracing", "Multi"): 3,
    ("rust", "sharkdp/fd", "Multi"): 3,
}
ROW_KEYS = {"instance_id", "repo", "language", "source", "native_gold_files_present", "loader_error"}
SEED = "are-g01-cross-branch-cohort-candidate-r1"


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def verify_exposure_snapshot(supply: dict, evolution_root: Path, runs_root: Path) -> None:
    if supply.get("schema_version") != "are.g01-g02-cross-branch-source-supply/v1":
        raise ValueError("source supply shape changed")
    expected = supply.get("manifest_files")
    if not isinstance(expected, list) or not expected:
        raise ValueError("source supply manifest list missing")
    g01_patterns = ("g01-*/CONFIG.json", "g01-*/*/CONFIG.json", "g01-*/*/*/CONFIG.json",
                    "hen-*/CONFIG.json", "g01-*/tasks/*.json")
    g02_patterns = ("g02-*/COHORT.json", "g02-*/tasks/*.json")
    paths = {path for pattern in g01_patterns for path in evolution_root.glob(pattern)}
    for root in (evolution_root, runs_root):
        paths.update(path for pattern in g02_patterns for path in root.glob(pattern)
                     if path.name not in {"binding.json", "SOURCE-ONLY-MANIFEST.json"})
    paths.add(evolution_root / "g02-product-replication-cohort-r1.json")
    if {str(path) for path in paths} != {row.get("path") for row in expected}:
        raise ValueError("manifest inventory changed since source supply audit")
    if any(sha256(Path(row["path"]).read_bytes()) != row.get("sha256") for row in expected):
        raise ValueError("manifest content changed since source supply audit")


def propose(receipt: dict, receipt_sha256: str) -> dict:
    if (receipt.get("schema_version") != "are.g01-g02-cross-branch-gold-eligibility/v1" or
            receipt.get("status") != "passed" or receipt.get("gold_paths_or_values_exported") is not False or
            receipt.get("model_calls") != 0 or receipt.get("source_only_rows") != 931 or
            receipt.get("totals") != {"eligible": 929, "ineligible": 2} or
            not isinstance(receipt.get("rows"), list) or len(receipt["rows"]) != 931 or
            any(set(row) != ROW_KEYS or not isinstance(row["instance_id"], str) or
                not row["instance_id"] or not isinstance(row["native_gold_files_present"], bool) or
                row["loader_error"] is not False for row in receipt["rows"])):
        raise ValueError("eligibility receipt shape or expected source population changed")
    rows = receipt["rows"]
    if len({row["instance_id"] for row in rows}) != len(rows):
        raise ValueError("duplicate source ID")
    if sum(row["native_gold_files_present"] for row in rows) != 929:
        raise ValueError("eligibility count changed")
    selected = []
    available = {}
    for key, count in QUOTAS.items():
        candidates = [row for row in rows if row["native_gold_files_present"] and
                      (row["language"], row["repo"], row["source"]) == key]
        candidates.sort(key=lambda row: (sha256((SEED + "\0" + row["instance_id"]).encode()), row["instance_id"]))
        if len(candidates) < count:
            raise ValueError(f"insufficient source-only supply: {key}")
        available["/".join(key)] = len(candidates)
        selected.extend({field: row[field] for field in ("instance_id", "repo", "language", "source")}
                        for row in candidates[:count])
    if len(selected) != 24 or len({row["instance_id"] for row in selected}) != 24 or Counter(row["language"] for row in selected) != {"c": 6, "go": 6, "javascript": 6, "rust": 6}:
        raise ValueError("candidate cohort invariant")
    return {"schema_version": "are.g01-source-only-cohort-candidate/v1", "status": "preflight-only-not-frozen",
            "seed": SEED, "eligibility_receipt_sha256": receipt_sha256,
            "source_supply_sha256": receipt["source_supply_sha256"],
            "source_parquet_sha256": receipt["source_parquet_sha256"],
            "quota_by_language_repo_source": {"/".join(key): value for key, value in QUOTAS.items()},
            "available_by_quota": available, "ordered_tasks": selected,
            "task_id_set_sha256": sha256(("\n".join(sorted(row["instance_id"] for row in selected)) + "\n").encode()),
            "gold_values_or_paths_used": False, "model_calls": 0,
            "claim_ceiling": "Source-only deterministic candidate draw; not a frozen cohort, cache/index proof, score, or superiority result.",
            "open_questions": ["Do all selected commits have independent source checkouts and settled indexes?",
                               "Is the current manifested exposure union unchanged since the eligibility audit?",
                               "Does the selected candidate pass a fixed cost/storage preflight before freeze?"]}


def attach_source_rows(candidate: dict, rows: list[dict]) -> dict:
    """Join exactly the eight permitted source-only parquet fields."""
    allowed = {"instance_id", "original_inst_id", "repo", "repo_url", "language",
               "source", "base_commit", "problem_statement"}
    if any(set(row) != allowed for row in rows):
        raise ValueError("source projection has unexpected fields")
    selected_ids = {row["instance_id"] for row in candidate["ordered_tasks"]}
    matches = [row for row in rows if row["instance_id"] in selected_ids]
    if len(matches) != 24 or len({row["instance_id"] for row in matches}) != 24:
        raise ValueError("selected parquet source rows missing or duplicated")
    lookup = {row["instance_id"]: row for row in matches}
    augmented = []
    for selected in candidate["ordered_tasks"]:
        source = lookup[selected["instance_id"]]
        if (any(source[key] != selected[key] for key in ("repo", "language", "source")) or
                not isinstance(source["repo_url"], str) or not source["repo_url"].startswith("https://github.com/") or
                not isinstance(source["original_inst_id"], str) or not source["original_inst_id"] or
                not isinstance(source["problem_statement"], str) or not source["problem_statement"] or
                not isinstance(source["base_commit"], str) or len(source["base_commit"]) != 40 or
                any(ch not in "0123456789abcdef" for ch in source["base_commit"])):
            raise ValueError("selected source identity invalid")
        augmented.append({key: source[key] for key in ("instance_id", "original_inst_id", "repo", "repo_url",
                                                    "language", "base_commit", "problem_statement", "source")})
    return {**candidate, "ordered_tasks": augmented, "source_commit_join_verified": True}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--eligibility-receipt", type=Path, required=True)
    parser.add_argument("--expected-sha256", required=True)
    parser.add_argument("--source-supply-receipt", type=Path, required=True)
    parser.add_argument("--evolution-root", type=Path, required=True)
    parser.add_argument("--runs-root", type=Path, required=True)
    parser.add_argument("--source-parquet", type=Path, required=True)
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()
    raw = args.eligibility_receipt.read_bytes()
    if sha256(raw) != args.expected_sha256:
        raise ValueError("eligibility receipt hash drift")
    eligibility = json.loads(raw)
    supply_raw = args.source_supply_receipt.read_bytes()
    if sha256(supply_raw) != eligibility.get("source_supply_sha256"):
        raise ValueError("source supply receipt hash drift")
    supply = json.loads(supply_raw)
    verify_exposure_snapshot(supply, args.evolution_root, args.runs_root)
    if sha256(args.source_parquet.read_bytes()) != eligibility.get("source_parquet_sha256") or \
            str(args.source_parquet) != supply.get("source_parquet"):
        raise ValueError("source parquet hash or path drift")
    import pyarrow.parquet as pq
    fields = ["instance_id", "original_inst_id", "repo", "repo_url", "language", "base_commit",
              "problem_statement", "source"]
    rows = pq.read_table(args.source_parquet, columns=fields).to_pylist()
    candidate = attach_source_rows(propose(eligibility, args.expected_sha256), rows)
    if args.out is None:
        print(json.dumps(candidate, indent=2))
    else:
        if not args.out.is_absolute() or not args.out.parent.is_dir():
            raise ValueError("fresh absolute output path in existing directory required")
        data = (json.dumps(candidate, indent=2) + "\n").encode()
        descriptor = os.open(args.out, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, "wb") as stream:
            stream.write(data)
        print(json.dumps({"path": str(args.out), "sha256": sha256(data),
                          "task_count": len(candidate["ordered_tasks"]), "status": candidate["status"]}))


if __name__ == "__main__":
    main()
