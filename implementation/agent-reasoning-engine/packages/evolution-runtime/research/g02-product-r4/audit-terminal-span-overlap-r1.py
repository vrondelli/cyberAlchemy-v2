#!/usr/bin/env python3
"""Evaluator-only positional span overlap for terminal-visible omitted G02 gold."""

import argparse
import hashlib
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path


EXPECTED_VISIBILITY_SHA256 = "1ae69eb4625e286a519d94b621868aaf7237748afe37ce79580155d5c4cba0f2"
UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def merged(ranges):
    result = []
    for start, end in sorted(ranges):
        if not isinstance(start, int) or not isinstance(end, int) or start < 1 or end < start:
            raise ValueError("invalid line range")
        if result and start <= result[-1][1] + 1:
            result[-1] = (result[-1][0], max(result[-1][1], end))
        else:
            result.append((start, end))
    return result


def coverage(gold, observed):
    gold = merged(gold)
    observed = merged(observed)
    total = sum(end - start + 1 for start, end in gold)
    overlap = 0
    for start, end in gold:
        for left, right in observed:
            if right < start:
                continue
            if left > end:
                break
            overlap += max(0, min(end, right) - max(start, left) + 1)
    return total, overlap


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("visibility_result", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.visibility_result) != EXPECTED_VISIBILITY_SHA256:
        raise SystemExit("visibility receipt hash mismatch")
    prior = json.loads(args.visibility_result.read_text())
    if len(prior["rows"]) != 32:
        raise SystemExit("wrong scored denominator")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path

    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    totals = defaultdict(Counter)
    results = []
    for row in prior["rows"]:
        cohort = row["cohort"]
        prefix = "pr2" if cohort == "r2" else "pr3"
        repo_slug = {"qutebrowser/qutebrowser": "qut", "internetarchive/openlibrary": "open",
                     "navidrome/navidrome": "nav", "element-hq/element-web": "elem"}[row["repo"]]
        root = Path(f"/opt/are-benchmark-runs/g02-cross-layer-{prefix}-{repo_slug}-{row['id_suffix']}")
        pred_path = root / "evidence/run/prediction.json"
        episode_path = root / "evidence/run/episode.json"
        if sha(pred_path) != row["prediction_sha256"] or sha(episode_path) != row["episode_sha256"]:
            raise ValueError("prior receipt input drift")
        pred = json.loads(pred_path.read_text())
        episode = json.loads(episode_path.read_text())
        packet = episode["terminal_evidence_presentations"][0]["packet"]
        delivered = {path for step in pred["traj_data"]["pred_steps"] for path in step["files"]}
        omitted = (set(loader.get(pred["instance_id"]).files()) & delivered) - set(pred["traj_data"]["pred_files"])
        if len(omitted) != row["delivered_omitted_gold"]:
            raise ValueError("prior omitted-file count drift")
        gold = loader.get(pred["instance_id"])
        gold_ranges = defaultdict(list)
        for item in gold.init + gold.add:
            path = _normalize_rel_path(item.get("file", ""))
            if path:
                gold_ranges[path].append((item.get("start_line", 1), item.get("end_line", 1)))
        for path in sorted(omitted):
            shown_ranges = [(span["start_line"], span["end_line"])
                            for binding in packet["private"]["bindings"] if binding["path"] == path
                            for span in binding["base_spans"]]
            delivered_ranges = [(span["start"], span["end"])
                                for step in pred["traj_data"]["pred_steps"]
                                for span in step["spans"].get(path, [])]
            total, shown_overlap = coverage(gold_ranges[path], shown_ranges)
            _, delivered_overlap = coverage(gold_ranges[path], delivered_ranges)
            result = {"cohort": cohort, "repo": row["repo"], "id_suffix": row["id_suffix"],
                      "gold_line_units": total, "shown_overlap_units": shown_overlap,
                      "delivered_overlap_units": delivered_overlap,
                      "classification": "shown_gold_lines" if shown_overlap else
                        "delivered_gold_lines_hidden" if delivered_overlap else "no_gold_lines_delivered"}
            results.append(result)
            totals[cohort]["omitted_gold_files"] += 1
            totals[cohort][result["classification"]] += 1
            totals[cohort]["gold_line_units"] += total
            totals[cohort]["shown_overlap_units"] += shown_overlap
            totals[cohort]["delivered_overlap_units"] += delivered_overlap
    if totals["r2"]["omitted_gold_files"] != 22 or totals["r3"]["omitted_gold_files"] != 3:
        raise SystemExit("omitted-file denominator mismatch")
    output = {"schema_version": "g02.terminal-span-overlap-exposed-audit/v1",
              "posture": "evaluator-only-positional-development-no-prediction-or-score-change",
              "visibility_result_sha256": EXPECTED_VISIBILITY_SHA256,
              "totals": {key: dict(sorted(value.items())) for key, value in sorted(totals.items())},
              "rows": results,
              "claim_ceiling": "Positional overlap with native gold annotations, not semantic sufficiency, label-lineage proof, native rescore, or superiority."}
    with args.output.open("x") as handle:
        json.dump(output, handle, sort_keys=True, indent=2)
        handle.write("\n")
    print(json.dumps({"totals": output["totals"], "output_sha256": sha(args.output)}))


if __name__ == "__main__":
    main()
