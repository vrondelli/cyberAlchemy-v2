#!/usr/bin/env python3
"""Score the explicitly exposed 16-case r63 diagnostic; never repair r62."""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np

PINS = {
    "r62_seal": "10b0fbc0b3be589a755879b3751210eaf0086ebc838f1a84c799326612aa6a89",
    "r62_rankings": "bbf94499a5e49016507dc957d6a8f2ec51a5ea9876417109c3ce165f77693858",
    "r41_census": "88f011f1c532609e633e0f6a023c23c8894068babd4655436c64e38c200bf78e",
    "r36_projection": "14766f233d6b369551b94fc7d3372b85d3cb88f0936b337024d7bb7247188395",
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def metrics(ranking, gold):
    positions = [position for position, path in enumerate(ranking, 1) if path in gold]
    first = min(positions) if positions else 10**9
    return {"mrr_at_8": 1 / first if first <= 8 else 0.0,
            "hit_at_3": float(first <= 3),
            "recall_at_20": len(gold.intersection(ranking[:20])) / len(gold)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", type=Path, required=True)
    ap.add_argument("--r62", type=Path, required=True)
    ap.add_argument("--output", type=Path, required=True)
    args = ap.parse_args()
    files = {"r62_seal": args.r62 / "source-run/SOURCE-SEAL.json",
             "r62_rankings": args.r62 / "source-run/RANKINGS.jsonl",
             "r41_census": args.base / "selective-r28/evaluator-census-r41/CENSUS-RESULT.json",
             "r36_projection": args.base / "selective-r28/code-projection-r36/RESULT.json"}
    for name, path in files.items():
        if sha(path) != PINS[name]:
            raise SystemExit(f"input drift: {name}")
    source_seal = json.loads(files["r62_seal"].read_text())
    if source_seal["status"] != "complete" or source_seal["cases"] != 17 or source_seal["gold_opened"]:
        raise SystemExit("r62 source not sealed")
    source = [json.loads(line) for line in files["r62_rankings"].read_text().splitlines()]
    census = json.loads(files["r41_census"].read_text())
    labels = {row["ordinal"]: row for row in census["combined_results"]}
    projections = {row["slot"]: row for row in json.loads(files["r36_projection"].read_text())["records"]}
    if len(source) != 17 or len(labels) != 24 or set(row["ordinal"] for row in source) - set(labels):
        raise SystemExit("denominator/identity drift")
    excluded = []
    per = []
    for row in source:
        slot = row["ordinal"]
        label = labels[slot]
        projection = projections[slot]
        if (row["id"] != label["id"] or row["repo"] != label["repo"] or
                row["repo"] != projection["repo"] or label["failed_sha"] != projection["failed_commit"]):
            raise SystemExit("case identity mismatch")
        if not label["gold_admissible"]:
            excluded.append({"ordinal": slot, "id": row["id"], "reason": label.get("inadmissible_reason")})
            continue
        gold = set(label["source_gold_paths"])
        if not gold or not gold.issubset(row["base"]) or len(row["base"]) != len(row["treatment"]):
            raise SystemExit("gold not in failed-source universe")
        per.append({"ordinal": slot, "id": row["id"], "repo": row["repo"],
                    "gold": sorted(gold),
                    "metrics": {arm: metrics(row[arm], gold) for arm in ("base", "treatment")}})
    if len(per) != 16 or excluded != [{"ordinal": 15, "id": "OpenNMT-OpenNMT-py-19529228404",
                                      "reason": "no-changed-language-path-present-in-failed-source"}]:
        raise SystemExit("admissible subset drift")
    aggregate = {arm: {name: float(np.mean([row["metrics"][arm][name] for row in per]))
                       for name in ("mrr_at_8", "hit_at_3", "recall_at_20")}
                 for arm in ("base", "treatment")}
    differences = np.asarray([row["metrics"]["treatment"]["mrr_at_8"]
                              - row["metrics"]["base"]["mrr_at_8"] for row in per], dtype=np.float64)
    rng = np.random.default_rng(6301)
    draws = rng.integers(0, len(differences), size=(100000, len(differences)))
    paired = {"mean": float(np.mean(differences)),
              "repository_interval_95": [float(x) for x in np.quantile(differences[draws].mean(axis=1), [0.025, 0.975])],
              "wins": int(sum(differences > 0)), "ties": int(sum(differences == 0)),
              "losses": int(sum(differences < 0))}
    result = {"schema_version": "are.g01-r63-exposed-diagnostic/v1", "status": "complete",
              "claim_ceiling": "exposed diagnostic only; no r62 repair or superiority",
              "cases": 16, "excluded_from_r62": excluded, "aggregate": aggregate,
              "paired_difference": paired, "input_sha256": PINS,
              "protocol_sha256": sha(Path(__file__).with_name("PROTOCOL.md")),
              "per_case_private": per}
    if args.output.exists():
        raise SystemExit("output exists")
    args.output.write_text(json.dumps(result, sort_keys=True, indent=2) + "\n")
    print(json.dumps({key: result[key] for key in ("cases", "aggregate", "paired_difference", "claim_ceiling")}, sort_keys=True))


if __name__ == "__main__":
    main()
