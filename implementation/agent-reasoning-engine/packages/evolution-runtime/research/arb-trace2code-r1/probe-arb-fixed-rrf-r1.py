#!/usr/bin/env python3
"""Gold-blind fixed RRF of chunk and file rankings on exposed ARB cases."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib


GIN_ARB_SHA256 = "1d8b81e146fa0d01911e4a03d75db64e79af8020030cbead889beadb44505e78"
GIN_ARE_SHA256 = "1e6d8d4170163318b05a693950db6609c21f7aef2d11911747e4f29c0cc30bcd"
NONGIN_ARB_SHA256 = "6dabb71899d0b3e8d35dae30658e8f803aec09fd67dbd973a06ad3f67b6d82f7"
NONGIN_ARE_SHA256 = "3a024e28c5abaeefdbc7db0ea056e8bc3a002a0d31f1589b754014f161236bcd"
K = 60


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def load(path: pathlib.Path) -> dict[str, dict]:
    rows = [json.loads(line) for line in path.read_text().splitlines()]
    by_id = {row["id"]: row for row in rows}
    if len(rows) != len(by_id):
        raise SystemExit("duplicate case ID")
    return by_id


def fuse(left: list[str], right: list[str]) -> list[str]:
    if len(left) != len(right) or set(left) != set(right):
        raise SystemExit("candidate universe mismatch")
    left_rank = {path: rank for rank, path in enumerate(left, 1)}
    right_rank = {path: rank for rank, path in enumerate(right, 1)}
    return sorted(left, key=lambda path: (-(1 / (K + left_rank[path]) + 1 / (K + right_rank[path])), path))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("gin-arb", "gin-are", "nongin-arb", "nongin-are", "output"):
        parser.add_argument(f"--{name}", type=pathlib.Path, required=True)
    args = parser.parse_args()
    paths = tuple(path.resolve(strict=True) for path in
                  (args.gin_arb, args.gin_are, args.nongin_arb, args.nongin_are))
    if args.output.exists() or tuple(map(sha256_file, paths)) != (
            GIN_ARB_SHA256, GIN_ARE_SHA256, NONGIN_ARB_SHA256, NONGIN_ARE_SHA256):
        raise SystemExit("output exists or input pin drift")
    gin_arb, gin_are, nongin_arb, nongin_are = (load(path) for path in paths)
    if len(gin_arb) != 56 or len(gin_are) != 56 or set(gin_arb) != set(gin_are) or \
            len(nongin_arb) != 45 or len(nongin_are) != 45 or set(nongin_arb) != set(nongin_are) or \
            set(gin_arb) & set(nongin_arb):
        raise SystemExit("exposed cohort drift")
    output = []
    for baseline, candidate in ((gin_arb, gin_are), (nongin_arb, nongin_are)):
        for item_id in sorted(baseline):
            a, r = baseline[item_id], candidate[item_id]
            if a["repo"] != r["repo"] or a["base_commit"] != r["base_commit"]:
                raise SystemExit("case identity drift")
            if a["repo"] == "gin-gonic/gin":
                left, right = a["rankings"]["edge_failure"], r["edge_trace_text"]
                query_hash = a["query_sha256"]["edge_failure"]
                if query_hash != r["query_sha256"]:
                    raise SystemExit("Gin query mismatch")
            else:
                if r["status"] != "ranked_all_files":
                    raise SystemExit("non-Gin coverage failure")
                left, right = a["rankings"]["edge_failure"], r["trace_text_ranked_files"]
                query_hash = a["query_sha256"]["edge_failure"]
                if query_hash != r["query_sha256"]:
                    raise SystemExit("non-Gin query mismatch")
            if len(left) != a["candidate_count"] or len(right) != a["candidate_count"]:
                raise SystemExit("candidate count drift")
            output.append({"id": item_id, "repo": a["repo"], "base_commit": a["base_commit"],
                           "candidate_count": a["candidate_count"], "query_sha256": query_hash,
                           "arb_edge_bm25": left, "are_edge_trace_text": right,
                           "fixed_rrf_k60": fuse(left, right)})
    if len(output) != 101:
        raise SystemExit("total denominator drift")
    args.output.mkdir(parents=True, exist_ok=False)
    path = args.output / "DEVELOPMENT-RANKINGS.jsonl"
    path.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in output))
    seal = {"schema": "are.arb-exposed-fixed-rrf-source-r1/v1",
            "posture": "post-confirmation exposed development only; fixed equal-weight reciprocal-rank fusion k=60",
            "input_sha256": dict(zip(("gin_arb", "gin_are", "nongin_arb", "nongin_are"),
                                     (GIN_ARB_SHA256, GIN_ARE_SHA256, NONGIN_ARB_SHA256, NONGIN_ARE_SHA256))),
            "prediction_sha256": sha256_file(path), "cases": len(output), "gold_opened": False,
            "model_calls": 0}
    (args.output / "SOURCE-SEAL.json").write_text(json.dumps(seal, indent=2, sort_keys=True) + "\n")
    print(json.dumps(seal, sort_keys=True))


if __name__ == "__main__":
    main()
