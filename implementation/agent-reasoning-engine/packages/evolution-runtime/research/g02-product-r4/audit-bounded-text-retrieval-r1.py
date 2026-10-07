#!/usr/bin/env python3
"""Evaluator-only replay and gold audit of exposed bounded-text retrieval."""

import argparse
import hashlib
import json
import subprocess
import sys
from collections import defaultdict
from pathlib import Path


EXPECTED_SEAL_SHA256 = "e2e7937535dd93d8d1a13cd153c6a21b44cd513ea42ceec82ecf574947e2ad83"
EXPECTED_RANKER_SHA256 = "a39eff11ae5ae29e18ca7e5594a7273520a7f40f2e24d76f3b8d00d9b9e79eea"
UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")
CODE_EXTS = {".c", ".cc", ".cpp", ".go", ".h", ".java", ".js", ".jsx",
             ".kt", ".py", ".rs", ".ts", ".tsx"}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def new_paths(paths, delivered, budget):
    return [path for path in paths if path not in delivered][:budget]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("seal", type=Path)
    parser.add_argument("ranker", type=Path)
    parser.add_argument("old_ranker", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.seal) != EXPECTED_SEAL_SHA256 or sha(args.ranker) != EXPECTED_RANKER_SHA256:
        raise SystemExit("source-only seal/code hash mismatch")
    seal = json.loads(args.seal.read_text())
    if seal["schema_version"] != "g02.bounded-text-retrieval-exposed-seal/v1" or len(seal["results"]) != 12:
        raise SystemExit("unexpected seal")
    if seal["script_sha256"] != EXPECTED_RANKER_SHA256 or seal["candidate_read_budget_per_task"] != 3:
        raise SystemExit("unbound script or budget")
    # Re-run source-only ranking before touching evaluator gold.
    replay_path = args.output.parent / "REPLAY.json"
    subprocess.check_output([sys.executable, str(args.ranker),
        str(args.seal.parent / "G02-R3-RETRIEVAL-FIRST-PRE-SCORE-SEAL.json"),
        str(args.old_ranker), str(replay_path)], text=True)
    if sha(replay_path) != EXPECTED_SEAL_SHA256:
        raise SystemExit("source-only replay mismatch")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader

    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    rows = []
    by_repo = defaultdict(lambda: {"tasks": 0, "code_gold": 0, "text_gold": 0,
                                   "code_false": 0, "text_false": 0,
                                   "text_new_extension_gold": 0})
    for row in seal["results"]:
        delivered = set(row["delivered_paths"])
        gold = set(loader.get(row["instance_id"]).files())
        code = new_paths(row["code_only_top30"], delivered, 3)
        text = new_paths([item["path"] for item in row["bounded_text_top30"]], delivered, 3)
        if len(code) != 3 or len(text) != 3 or len(set(text)) != 3:
            raise SystemExit("incomplete or duplicate read budget")
        repo = row["pair_root"].split("/g02-cross-layer-pr3-")[-1].split("-")[0]
        result = {"repo": repo, "id_suffix": row["instance_id"].split("__")[-1],
                  "undelivered_gold_count": len(gold - delivered),
                  "code_gold": len(set(code) & gold), "text_gold": len(set(text) & gold),
                  "code_false": len(set(code) - gold), "text_false": len(set(text) - gold),
                  "text_new_extension_gold": sum(Path(path).suffix.casefold() not in CODE_EXTS
                                                 for path in set(text) & gold)}
        rows.append(result)
        by_repo[repo]["tasks"] += 1
        for key in result.keys() - {"repo", "id_suffix", "undelivered_gold_count"}:
            by_repo[repo][key] += result[key]
    totals = {key: sum(row[key] for row in rows) for key in
              ("undelivered_gold_count", "code_gold", "text_gold", "code_false", "text_false",
               "text_new_extension_gold")}
    pass_gate = (totals["text_gold"] >= totals["code_gold"] + 6 and
                 all(item["text_gold"] >= item["code_gold"] for item in by_repo.values()))
    result = {"schema_version": "g02.bounded-text-retrieval-exposed-audit/v1",
              "posture": "evaluator-only-exposed-development-no-native-score-or-superiority",
              "seal_sha256": EXPECTED_SEAL_SHA256, "ranker_sha256": EXPECTED_RANKER_SHA256,
              "replay": "12/12 exact source-only rows", "read_budget_per_task": 3,
              "development_gate": "+6 gold hits over code-only top-3 and no repository losing hits",
              "development_gate_pass": pass_gate,
              "rows": rows, "by_repo": dict(sorted(by_repo.items())), "totals": totals}
    with args.output.open("x") as handle:
        json.dump(result, handle, sort_keys=True, indent=2)
        handle.write("\n")
    print(json.dumps({"gate_pass": pass_gate, "totals": totals,
                      "output_sha256": sha(args.output)}))


if __name__ == "__main__":
    main()
