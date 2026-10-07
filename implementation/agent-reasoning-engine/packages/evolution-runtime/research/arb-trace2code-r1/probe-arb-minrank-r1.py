#!/usr/bin/env python3
"""Gold-blind, fixed optimistic min-rank ordering on exposed ARB rankings."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib


INPUT_SHA256 = "90562963631facf609b1ee1599f190c307e95a8e99f45e7ac2e00581bad95b6a"


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def minrank(left: list[str], right: list[str]) -> list[str]:
    if len(left) != len(right) or set(left) != set(right):
        raise SystemExit("candidate universe drift")
    lrank = {path: rank for rank, path in enumerate(left, 1)}
    rrank = {path: rank for rank, path in enumerate(right, 1)}
    return sorted(left, key=lambda path: (min(lrank[path], rrank[path]),
                                          lrank[path] + rrank[path], path))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rankings", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    rankings = args.rankings.resolve(strict=True)
    if args.output.exists() or sha256_file(rankings) != INPUT_SHA256:
        raise SystemExit("output exists or input pin drift")
    seal = json.loads((rankings.parent / "SOURCE-SEAL.json").read_text())
    if seal.get("prediction_sha256") != INPUT_SHA256 or seal.get("gold_opened") is not False:
        raise SystemExit("source seal drift")
    rows = [json.loads(line) for line in rankings.read_text().splitlines()]
    if len(rows) != 101 or len({row["id"] for row in rows}) != 101:
        raise SystemExit("case-set drift")
    for row in rows:
        row["fixed_minrank"] = minrank(row["arb_edge_bm25"], row["are_edge_trace_text"])
    args.output.mkdir(parents=True, exist_ok=False)
    path = args.output / "DEVELOPMENT-RANKINGS.jsonl"
    path.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in rows))
    receipt = {"schema": "are.arb-exposed-minrank-source-r1/v1",
               "posture": "post-confirmation development; fixed minimum input rank, tie by rank sum then path",
               "input_sha256": INPUT_SHA256, "prediction_sha256": sha256_file(path),
               "cases": len(rows), "gold_opened": False, "model_calls": 0}
    (args.output / "SOURCE-SEAL.json").write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n")
    print(json.dumps(receipt, sort_keys=True))


if __name__ == "__main__":
    main()
