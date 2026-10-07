#!/usr/bin/env python3
"""Evaluate sealed compact-representation ranks on exposed labels only."""

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath

PINS = {
    "gitbug": {"ranking": "4f2c83cdef8897d053c9fc527ed1cb6fae235c16e2f64796fb2859bbc60276d1",
               "prior": "e1ef342e646806d223b3e8bf02c06c45f2f9b4f116b064aeaa708bf8cd6e774d",
               "gold": "63ebd2880c6f12304052db8d83705afaf2dcab6e9136f4807c359a90cd51572f",
               "count": 12, "gold_key": "results", "baseline": "a_are_raw", "prior_safe": "c_safe"},
    "bears": {"ranking": "1ebeccb86a2fd489a9b1da9c4e1880fbf3a735d382c1950c701a4d41ba467578",
              "prior": "da2a143c1d2eb6cdfe0f9906b962df7d4ea64c104aa313744a2021cfa577a08f",
              "gold": "44bfee25a52adce3df5dbd449f218eb404ff1a00cae3199bfe9628620070f642",
              "count": 24, "gold_key": "rows", "baseline": "a", "prior_safe": "safe"},
}
ARMS = {"strong": "strong_raw_symbol_structure",
        "treatment": "treatment_are_raw_symbol_structure",
        "safe": "treatment_safe"}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def score(rank, gold):
    first = min(rank.index(path) + 1 for path in gold)
    return {"first_rank": first, "rr8": 1 / first if first <= 8 else 0,
            "hit3": int(first <= 3),
            "recall20": sum(path in rank[:20] for path in gold) / len(gold)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--population", required=True, choices=sorted(PINS))
    for name in ("ranking", "prior", "gold", "output"):
        parser.add_argument("--" + name, required=True, type=Path)
    args = parser.parse_args()
    pin = PINS[args.population]
    if (args.output.exists() or any(sha(getattr(args, key).read_bytes()) != pin[key]
                                    for key in ("ranking", "prior", "gold"))):
        raise SystemExit("output-or-input-drift")
    ranks = [json.loads(x) for x in args.ranking.read_text().splitlines()]
    prior = [json.loads(x) for x in args.prior.read_text().splitlines()]
    labels = json.loads(args.gold.read_bytes())[pin["gold_key"]]
    if any(len(x) != pin["count"] for x in (ranks, prior, labels)):
        raise SystemExit("population-drift")
    rows = []
    for i, (rank, old, label) in enumerate(zip(ranks, prior, labels, strict=True), 1):
        if (not (rank["ordinal"] == old["ordinal"] == label["ordinal"] == i)
                or not (rank["repo"] == old["repo"] == label["repo"])):
            raise SystemExit("case-binding-drift")
        if args.population == "gitbug" and not label["admissible"]:
            raise SystemExit("inadmissible-label")
        gold = label["gold_paths"]
        arms = {"baseline": old[pin["baseline"]],
                "prior_safe": old[pin["prior_safe"]]}
        arms.update({name: rank[key] for name, key in ARMS.items()})
        results = {}
        for mode in ("all", "production"):
            results[mode] = {}
            for name, order in arms.items():
                if mode == "production":
                    order = [path for path in order
                             if "test" not in PurePosixPath(path).parts
                             and "tests" not in PurePosixPath(path).parts]
                if any(path not in order for path in gold):
                    raise SystemExit("gold-excluded-by-source-role")
                results[mode][name] = score(order, gold)
        rows.append({"ordinal": i, "repo": rank["repo"], "scores": results})
    aggregate = {mode: {arm: {metric: sum(r["scores"][mode][arm][metric] for r in rows) / len(rows)
                             for metric in ("rr8", "hit3", "recall20")}
                        for arm in ("baseline", "prior_safe", "strong", "treatment", "safe")}
                 for mode in ("all", "production")}
    comparison = {}
    for mode in aggregate:
        a = [r["scores"][mode]["strong"]["rr8"] for r in rows]
        b = [r["scores"][mode]["safe"]["rr8"] for r in rows]
        comparison[mode] = {"safe_minus_strong_mrr8": sum(y-x for x,y in zip(a,b,strict=True)) / len(a),
                            "wins": sum(y>x for x,y in zip(a,b,strict=True)),
                            "ties": sum(y==x for x,y in zip(a,b,strict=True)),
                            "losses": sum(y<x for x,y in zip(a,b,strict=True))}
    args.output.mkdir(mode=0o700, parents=True)
    result = {"schema_version": "are.g01-r91-exposed-structure-evaluation/v1",
              "population": args.population, "cases": len(rows),
              "input_sha256": {key: pin[key] for key in ("ranking", "prior", "gold")},
              "scores": aggregate, "comparisons": comparison, "rows": rows,
              "claim_eligible": False}
    fd = os.open(args.output / "EXPOSED-EVALUATION.json", os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write("\n")
    print(json.dumps({"production": aggregate["production"],
                      "comparison": comparison["production"]}, sort_keys=True))


if __name__ == "__main__":
    main()
