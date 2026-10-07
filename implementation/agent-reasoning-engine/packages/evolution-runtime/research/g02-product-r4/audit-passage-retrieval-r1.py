#!/usr/bin/env python3
"""Evaluator-only replay and gold audit of a sealed exposed passage ranking."""

import argparse
import hashlib
import json
import subprocess
import sys
from collections import defaultdict
from pathlib import Path


EXPECTED_SEAL_SHA256 = "57ba08f71926656ea258b58436565a656b6e61ee4f3c338153555d5a7fe6b8f4"
EXPECTED_RANKER_SHA256 = "06439255fb3ff8a8a82c19885eec1983c0a02a68259e57852bb4023833ce2e53"
UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def first_undelivered(paths, delivered, count):
    return [path for path in paths if path not in delivered][:count]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("seal", type=Path)
    parser.add_argument("ranker", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.seal) != EXPECTED_SEAL_SHA256 or sha(args.ranker) != EXPECTED_RANKER_SHA256:
        raise SystemExit("sealed source-only input hash mismatch")
    seal = json.loads(args.seal.read_text())
    if seal["schema_version"] != "g02.passage-retrieval-exposed-seal/v1" or len(seal["results"]) != 12:
        raise SystemExit("unexpected source-only seal")
    if seal["script_sha256"] != EXPECTED_RANKER_SHA256 or seal["candidate_read_budget_per_task"] != 3:
        raise SystemExit("unbound script or budget")
    # Replay every source-only decision before loading evaluator gold.
    replay_path = args.output.parent / "REPLAY.json"
    subprocess.check_output([sys.executable, str(args.ranker),
        str(args.seal.parent / "G02-R3-RETRIEVAL-FIRST-PRE-SCORE-SEAL.json"),
        str(replay_path)], text=True)
    if sha(replay_path) != EXPECTED_SEAL_SHA256:
        # Replays use the same deterministic script and inputs, so any byte
        # difference is a source or implementation drift before gold access.
        raise SystemExit("source-only replay mismatch")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader

    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    rows = []
    by_repo = defaultdict(lambda: {"tasks": 0, "raw_gold": 0, "passage_gold": 0,
                                   "raw_false": 0, "passage_false": 0})
    for row in seal["results"]:
        delivered = set(row["delivered_paths"])
        gold = set(loader.get(row["instance_id"]).files())
        raw = first_undelivered(row["raw_top30"], delivered, 3)
        passage = first_undelivered([item["path"] for item in row["passage_top30"]], delivered, 3)
        if len(raw) != 3 or len(passage) != 3 or len(set(passage)) != 3:
            raise SystemExit("incomplete or duplicate read budget")
        repo = row["pair_root"].split("/g02-cross-layer-pr3-")[-1].split("-")[0]
        result = {"repo": repo, "id_suffix": row["instance_id"].split("__")[-1],
                  "undelivered_gold_count": len(gold - delivered),
                  "raw_gold": len(set(raw) & (gold - delivered)),
                  "passage_gold": len(set(passage) & (gold - delivered)),
                  "raw_false": len(set(raw) - gold),
                  "passage_false": len(set(passage) - gold)}
        rows.append(result)
        by_repo[repo]["tasks"] += 1
        for key in ("raw_gold", "passage_gold", "raw_false", "passage_false"):
            by_repo[repo][key] += result[key]
    totals = {key: sum(row[key] for row in rows)
              for key in ("undelivered_gold_count", "raw_gold", "passage_gold", "raw_false", "passage_false")}
    # Fixed before opening labels: meaningful improvement over the already
    # weak raw top-3 requires +6 gold hits and no repository losing hits.
    pass_gate = (totals["passage_gold"] >= totals["raw_gold"] + 6 and
                 all(item["passage_gold"] >= item["raw_gold"] for item in by_repo.values()))
    result = {"schema_version": "g02.passage-retrieval-exposed-audit/v1",
              "posture": "evaluator-only-exposed-development-no-native-score-or-superiority",
              "seal_sha256": EXPECTED_SEAL_SHA256,
              "ranker_sha256": EXPECTED_RANKER_SHA256,
              "replay": "12/12 exact source-only rows",
              "read_budget_per_task": 3, "rows": rows,
              "by_repo": dict(sorted(by_repo.items())), "totals": totals,
              "development_gate": "+6 gold hits over raw top-3 and no repository losing hits",
              "development_gate_pass": pass_gate}
    with args.output.open("x") as handle:
        json.dump(result, handle, sort_keys=True, indent=2)
        handle.write("\n")
    print(json.dumps({"gate_pass": pass_gate, "totals": totals,
                      "output_sha256": sha(args.output)}))


if __name__ == "__main__":
    main()
