#!/usr/bin/env python3
"""Evaluator-only transfer of the fixed G02 r3 acquisition model to exposed r2."""

import argparse
import hashlib
import importlib.util
import json
import os
import sys
from collections import defaultdict
from pathlib import Path


R3_SEAL_SHA256 = "2f946fcdbc8b522572880677b8b2d1e0aa9b42d5b312b648029ad545a848a1bc"
R2_SEAL_SHA256 = "bf259969469096c07b7b0d59c71f9c9db95a5d630e7c431e9b9e07b28bb9db9d"
TRAINER_SHA256 = "7e20acf8394fb16ad35f4bb0713f07764abfb757f2c1fd190e53bb5b1f588d75"
UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def module_at(path):
    spec = importlib.util.spec_from_file_location("g02_acquisition_trainer", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("r3_feature_seal", type=Path)
    parser.add_argument("r2_feature_seal", type=Path)
    parser.add_argument("trainer", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if (sha(args.r3_feature_seal), sha(args.r2_feature_seal), sha(args.trainer)) != \
            (R3_SEAL_SHA256, R2_SEAL_SHA256, TRAINER_SHA256):
        raise SystemExit("fixed input hash mismatch")
    r3 = json.loads(args.r3_feature_seal.read_text())
    r2 = json.loads(args.r2_feature_seal.read_text())
    if len(r3["rows"]) != 12 or len(r2["rows"]) != 24 or \
            r3["feature_names"] != r2["feature_names"]:
        raise SystemExit("feature population or schema mismatch")
    if set(row["instance_id"] for row in r3["rows"]) & set(row["instance_id"] for row in r2["rows"]):
        raise SystemExit("r2/r3 ID overlap")
    trainer = module_at(args.trainer)
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader

    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    training = []
    for row in r3["rows"]:
        gold = set(loader.get(row["instance_id"]).files())
        training.extend({**candidate, "is_gold": int(candidate["path"] in gold)}
                        for candidate in row["candidates"])
    weights = trainer.train(training)
    totals = defaultdict(int)
    by_repo = defaultdict(lambda: defaultdict(int))
    rows = []
    for row in r2["rows"]:
        gold = set(loader.get(row["instance_id"]).files())
        candidates = row["candidates"]
        raw = candidates[:3]
        learned = sorted(candidates,
                         key=lambda candidate: (-sum(a * b for a, b in zip(weights, trainer.vector(candidate))),
                                                candidate["raw_rank"], candidate["path"]))[:3]
        repo = row["pair_root"].split("/g02-cross-layer-pr2-")[-1].split("-")[0]
        record = {"repo": repo, "instance_id": row["instance_id"],
                  "candidate_count": len(candidates), "candidate_gold": sum(x["path"] in gold for x in candidates),
                  "raw_top3_count": len(raw), "raw_top3_gold": sum(x["path"] in gold for x in raw),
                  "learned_top3_count": len(learned), "learned_top3_gold": sum(x["path"] in gold for x in learned)}
        rows.append(record)
        for key in ("candidate_count", "candidate_gold", "raw_top3_count", "raw_top3_gold",
                    "learned_top3_count", "learned_top3_gold"):
            totals[key] += record[key]
            by_repo[repo][key] += record[key]
        by_repo[repo]["tasks"] += 1
    output = {"schema_version": "g02.cross-repo-acquisition-r2-transfer-audit/v1",
              "posture": "evaluator-only-exposed-development-no-native-rescore-or-new-reads",
              "r3_feature_seal_sha256": R3_SEAL_SHA256, "r2_feature_seal_sha256": R2_SEAL_SHA256,
              "trainer_sha256": TRAINER_SHA256,
              "training_candidates": len(training), "training_gold": sum(x["is_gold"] for x in training),
              "weights": [round(weight, 6) for weight in weights],
              "totals": dict(sorted(totals.items())),
              "by_repository": {key: dict(sorted(value.items())) for key, value in sorted(by_repo.items())},
              "rows": rows,
              "claim_ceiling": "Cross-cohort exposed acquisition diagnostic only; no receipt-backed reads, native F1, costs, or superiority."}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as handle:
        handle.write(data)
    print(json.dumps({"totals": output["totals"], "by_repository": output["by_repository"],
                      "result_sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
