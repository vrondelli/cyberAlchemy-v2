#!/usr/bin/env python3
"""Evaluator-only replay and label audit of sealed G02 r2 artifact-channel choices."""

import argparse
import hashlib
import json
import subprocess
import sys
from collections import defaultdict
from pathlib import Path


EXPECTED_SEAL_SHA256 = "ff74bed6110f942a5a6dcf0c35d7b2373326984d6fdcdc91a1f21803507b0c52"
EXPECTED_RULE_SHA256 = "7fc82e5eafb7d2174b292a0cbd05072049464ee5d95c7c32aa9346ff9f0d75c7"
UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("seal", type=Path)
    parser.add_argument("rule", type=Path)
    parser.add_argument("broad_ranker", type=Path)
    parser.add_argument("old_ranker", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.seal) != EXPECTED_SEAL_SHA256 or sha(args.rule) != EXPECTED_RULE_SHA256:
        raise SystemExit("source-only seal or rule hash mismatch")
    seal = json.loads(args.seal.read_text())
    if seal["schema_version"] != "g02.two-channel-artifact-exposed-seal/v1" or \
            len(seal["rows"]) != 24 or seal["candidate_read_budget_per_task"] != 3:
        raise SystemExit("unexpected source-only seal")
    if seal["script_sha256"] != EXPECTED_RULE_SHA256:
        raise SystemExit("unbound rule")
    # Exact source-only replay precedes evaluator gold loading.
    replay_path = args.output.parent / "REPLAY.json"
    subprocess.check_output([sys.executable, str(args.rule),
        str(args.seal.parent / "R2-SOURCE-SEAL.json"), str(args.broad_ranker),
        str(args.old_ranker), str(replay_path)], text=True)
    if sha(replay_path) != EXPECTED_SEAL_SHA256:
        raise SystemExit("source-only replay mismatch")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader

    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    rows = []
    by_repo = defaultdict(lambda: {"tasks": 0, "baseline_gold": 0, "choice_gold": 0,
                                   "artifact_choices": 0, "artifact_gold": 0,
                                   "displaced_code_gold": 0})
    for row in seal["rows"]:
        gold = set(loader.get(row["instance_id"]).files())
        baseline = set(row["code_top3"])
        choice = set(row["choice_top3"])
        artifact = row["artifact_choice"]
        repo = Path(row["pair_root"]).name.split("g02-cross-layer-pr2-")[-1].split("-")[0]
        result = {"repo": repo, "id_suffix": row["instance_id"].split("__")[-1],
                  "baseline_gold": len(baseline & gold),
                  "choice_gold": len(choice & gold),
                  "artifact_choice": artifact is not None,
                  "artifact_gold": int(artifact in gold) if artifact else 0,
                  "displaced_code_gold": int(row["code_top3"][2] in gold) if artifact else 0}
        rows.append(result)
        by_repo[repo]["tasks"] += 1
        for key in ("baseline_gold", "choice_gold", "artifact_gold", "displaced_code_gold"):
            by_repo[repo][key] += result[key]
        by_repo[repo]["artifact_choices"] += result["artifact_choice"]
    totals = {key: sum(row[key] for row in rows) for key in
              ("baseline_gold", "choice_gold", "artifact_gold", "displaced_code_gold")}
    totals["artifact_choices"] = sum(row["artifact_choice"] for row in rows)
    pass_gate = (totals["choice_gold"] >= totals["baseline_gold"] + 4 and
                 totals["artifact_gold"] * 2 >= totals["artifact_choices"] and
                 all(item["choice_gold"] >= item["baseline_gold"] for item in by_repo.values()))
    result = {"schema_version": "g02.two-channel-artifact-exposed-audit/v1",
              "posture": "evaluator-only-exposed-r2-development-no-native-score-or-superiority",
              "seal_sha256": EXPECTED_SEAL_SHA256,
              "rule_sha256": EXPECTED_RULE_SHA256,
              "replay": "24/24 exact source-only rows",
              "read_budget_per_task": 3,
              "development_gate": "net +4 gold hits, >=50% artifact-choice precision, no repository losing hits",
              "development_gate_pass": pass_gate,
              "rows": rows, "by_repo": dict(sorted(by_repo.items())), "totals": totals}
    with args.output.open("x") as handle:
        json.dump(result, handle, sort_keys=True, indent=2)
        handle.write("\n")
    print(json.dumps({"gate_pass": pass_gate, "totals": totals,
                      "output_sha256": sha(args.output)}))


if __name__ == "__main__":
    main()
