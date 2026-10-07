#!/usr/bin/env python3
"""Evaluator-only G02 file-error classification by terminal-handle visibility."""

import argparse
import hashlib
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path


UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("r2_plan", type=Path)
    parser.add_argument("r3_plan", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    plans = []
    for cohort, path, expected in (("r2", args.r2_plan, 24), ("r3", args.r3_plan, 12)):
        plan = json.loads(path.read_text())
        if plan.get("schema_version") != "are.g02-product-replication-execution/v1" or len(plan["ordered_pairs"]) != expected:
            raise SystemExit(f"bad {cohort} plan")
        plans.append((cohort, path, plan))
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader

    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    totals = defaultdict(Counter)
    by_repo = defaultdict(Counter)
    rows = []
    for cohort, _, plan in plans:
        for pair in plan["ordered_pairs"]:
            root = Path(pair["root"])
            pred_path = root / "evidence/run/prediction.json"
            native_path = root / "evidence/run/native-score.json"
            dsh_path = root / "dsh-export/native-score.json"
            episode_path = root / "evidence/run/episode.json"
            if not (pred_path.is_file() and native_path.is_file() and dsh_path.is_file()):
                totals[cohort]["unscored_attempts"] += 1
                continue
            prediction = json.loads(pred_path.read_text())
            episode = json.loads(episode_path.read_text())
            if prediction["instance_id"] != pair["instance_id"]:
                raise ValueError("pair identity mismatch")
            presentations = episode["terminal_evidence_presentations"]
            if len(presentations) != 1 or presentations[0]["packet"]["status"] != "ready":
                raise ValueError("missing actual terminal presentation")
            packet = presentations[0]["packet"]
            if packet["presentation_sha256"] != episode["terminal_evidence_packet"]["presentation_sha256"]:
                raise ValueError("terminal packet identity mismatch")
            presented = {binding["path"] for binding in packet["private"]["bindings"]}
            delivered = {path for step in prediction["traj_data"]["pred_steps"]
                         for path in step["files"]}
            selected = set(prediction["traj_data"]["pred_files"])
            gold = set(loader.get(pair["instance_id"]).files())
            if not selected <= delivered:
                raise ValueError("selected file lacks delivered read")
            omitted_delivered = (gold & delivered) - selected
            shown = omitted_delivered & presented
            hidden = omitted_delivered - presented
            fields = {"gold": len(gold), "selected_gold": len(gold & selected),
                      "never_delivered_gold": len(gold - delivered),
                      "delivered_omitted_gold": len(omitted_delivered),
                      "omitted_gold_shown": len(shown), "omitted_gold_hidden": len(hidden),
                      "delivered_files": len(delivered), "presented_files": len(presented),
                      "presented_handles": len(packet["private"]["bindings"]),
                      "omitted_eligible_handles": packet["fit"]["omitted_eligible"]}
            rows.append({"cohort": cohort, "repo": pair["repo"],
                         "id_suffix": pair["instance_id"].split("__")[-1],
                         "prediction_sha256": sha(pred_path), "episode_sha256": sha(episode_path),
                         **fields})
            totals[cohort]["scored_pairs"] += 1
            by_repo[pair["repo"]]["scored_pairs"] += 1
            for key, value in fields.items():
                totals[cohort][key] += value
                by_repo[pair["repo"]][key] += value
    if totals["r2"]["scored_pairs"] != 23 or totals["r3"]["scored_pairs"] != 9:
        raise SystemExit("scored denominator drift")
    output = {"schema_version": "g02.terminal-visibility-exposed-audit/v1",
              "posture": "evaluator-only-exposed-diagnostic-no-prediction-or-score-change",
              "plans": {cohort: sha(path) for cohort, path, _ in plans},
              "totals": {cohort: dict(sorted(values.items())) for cohort, values in sorted(totals.items())},
              "by_repo": {repo: dict(sorted(values.items())) for repo, values in sorted(by_repo.items())},
              "rows": rows,
              "claim_ceiling": "File availability versus terminal packet visibility diagnosis only; not a deployable selector or superiority result."}
    with args.output.open("x") as handle:
        json.dump(output, handle, sort_keys=True, indent=2)
        handle.write("\n")
    print(json.dumps({"totals": output["totals"], "output_sha256": sha(args.output)}))


if __name__ == "__main__":
    main()
