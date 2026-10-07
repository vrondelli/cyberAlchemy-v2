#!/usr/bin/env python3
"""Evaluator-only summary-path signal for delivered but unselected G02 files."""

import argparse
import hashlib
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path


EXPECTED_VISIBILITY_SHA256 = "1ae69eb4625e286a519d94b621868aaf7237748afe37ce79580155d5c4cba0f2"
UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")
REPO_SLUG = {"qutebrowser/qutebrowser": "qut", "internetarchive/openlibrary": "open",
             "navidrome/navidrome": "nav", "element-hq/element-web": "elem"}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def exact_mention(summary, value):
    pattern = r"(?<![A-Za-z0-9_./-])" + re.escape(value) + r"(?![A-Za-z0-9_./-])"
    return re.search(pattern, summary, re.I) is not None


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
    from contextbench.parsers.gold import GoldLoader

    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    totals = defaultdict(Counter)
    rows = []
    for row in prior["rows"]:
        cohort = row["cohort"]
        prefix = "pr2" if cohort == "r2" else "pr3"
        root = Path(f"/opt/are-benchmark-runs/g02-cross-layer-{prefix}-{REPO_SLUG[row['repo']]}-{row['id_suffix']}")
        pred_path = root / "evidence/run/prediction.json"
        episode_path = root / "evidence/run/episode.json"
        if sha(pred_path) != row["prediction_sha256"] or sha(episode_path) != row["episode_sha256"]:
            raise ValueError("prior receipt input drift")
        pred = json.loads(pred_path.read_text())
        episode = json.loads(episode_path.read_text())
        summary = episode["selection"]["summary"]
        if not isinstance(summary, str):
            raise ValueError("missing final summary")
        delivered = {path for step in pred["traj_data"]["pred_steps"] for path in step["files"]}
        selected = set(pred["traj_data"]["pred_files"])
        unselected = delivered - selected
        gold = set(loader.get(pred["instance_id"]).files())
        if len((gold & delivered) - selected) != row["delivered_omitted_gold"]:
            raise ValueError("prior omitted denominator drift")
        basename_counts = Counter(Path(path).name.casefold() for path in delivered)
        full = {path for path in unselected if exact_mention(summary, path)}
        basename = {path for path in unselected if len(Path(path).name) >= 8 and
                    basename_counts[Path(path).name.casefold()] == 1 and
                    exact_mention(summary, Path(path).name)}
        fields = {"unselected_files": len(unselected),
                  "unselected_gold": len(unselected & gold),
                  "full_path_mentions": len(full), "full_path_gold": len(full & gold),
                  "unique_basename_mentions": len(basename),
                  "unique_basename_gold": len(basename & gold),
                  "either_mentions": len(full | basename),
                  "either_gold": len((full | basename) & gold)}
        rows.append({"cohort": cohort, "repo": row["repo"],
                     "id_suffix": row["id_suffix"], **fields})
        totals[cohort]["scored_pairs"] += 1
        for key, value in fields.items():
            totals[cohort][key] += value
    output = {"schema_version": "g02.summary-path-consistency-exposed-audit/v1",
              "posture": "evaluator-only-exposed-diagnostic-no-prediction-or-score-change",
              "visibility_result_sha256": EXPECTED_VISIBILITY_SHA256,
              "totals": {key: dict(sorted(value.items())) for key, value in sorted(totals.items())},
              "rows": rows,
              "claim_ceiling": "Exact summary-text mention diagnostic only; not a semantic entailment, native rescore, or superiority result."}
    with args.output.open("x") as handle:
        json.dump(output, handle, sort_keys=True, indent=2)
        handle.write("\n")
    print(json.dumps({"totals": output["totals"], "output_sha256": sha(args.output)}))


if __name__ == "__main__":
    main()
