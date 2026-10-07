#!/usr/bin/env python3
"""Open BugsInPy labels and evaluate sealed G01 r54 predictions."""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import pathlib
import random
import re
import statistics
import tarfile


ARCHIVE_SHA256 = "8b242a0a62b91002fedaff64e112ba8b761d15e805d4635098f51b173fff5548"
FREEZE_SHA256 = "85226a48b5c5cbbbfb7edd725038e576ac7e5e0e9541f002fc5d3ac89a29ca9d"
PREDICTIONS_SHA256 = "d63bf39b9876a7335510e7c3f7c692e315c52be045004cf733fe95f83445f637"
PREFIX = "BugsInPy-316b95e2353ecda832bad9b42f86fa7c2fcec8ac/"
DIFF = re.compile(r"^diff --git a/(.+) b/(.+)$")
BOOTSTRAPS = 100_000
BOOTSTRAP_SEED = 54054


def digest(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def changed_paths(patch: bytes) -> set[str]:
    paths = set()
    for line in patch.decode("utf-8", errors="replace").splitlines():
        match = DIFF.fullmatch(line)
        if match is None:
            continue
        for value in match.groups():
            rel = pathlib.PurePosixPath(value)
            if rel.is_absolute() or ".." in rel.parts or not value or "\\" in value:
                raise ValueError("unsafe patch path")
            paths.add(value)
    return paths


def complete(partial: list[str], are: list[str]) -> list[str]:
    return list(dict.fromkeys(partial + are))


def rrf(are: list[str], glms: list[list[str]]) -> list[str]:
    rankings = [are] + [complete(ranking, are) for ranking in glms]
    positions = [{path: index + 1 for index, path in enumerate(ranking)} for ranking in rankings]
    are_position = {path: index for index, path in enumerate(are)}
    return sorted(are, key=lambda path: (
        -sum(1 / (60 + position[path]) for position in positions), are_position[path], path))


def score(ranking: list[str], gold: set[str]) -> dict:
    positions = {path: index + 1 for index, path in enumerate(ranking)}
    first = min((positions[path] for path in gold if path in positions), default=None)
    return {
        "first_gold_rank": first,
        "mrr_at_8": 1 / first if first is not None and first <= 8 else 0.0,
        "hit_at_3": float(first is not None and first <= 3),
        "recall_at_20": sum(positions.get(path, 10**9) <= 20 for path in gold) / len(gold),
    }


def aggregate(rows: list[dict], arm: str) -> dict:
    values = [row["metrics"][arm] for row in rows if row["metrics"].get(arm) is not None]
    return {
        "cases": len(values),
        "mrr_at_8": statistics.mean(row["mrr_at_8"] for row in values) if values else None,
        "hit_at_3": statistics.mean(row["hit_at_3"] for row in values) if values else None,
        "recall_at_20": statistics.mean(row["recall_at_20"] for row in values) if values else None,
    }


def percentile(values: list[float], fraction: float) -> float:
    ordered = sorted(values)
    place = (len(ordered) - 1) * fraction
    lower = int(place)
    upper = min(lower + 1, len(ordered) - 1)
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (place - lower)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("archive", "freeze", "packets", "predictions", "prediction-seal", "output"):
        parser.add_argument(f"--{name}", type=pathlib.Path, required=True)
    args = parser.parse_args()
    if args.output.exists() or digest(args.archive) != ARCHIVE_SHA256 \
            or digest(args.freeze) != FREEZE_SHA256 \
            or digest(args.predictions) != PREDICTIONS_SHA256:
        raise SystemExit("output exists or input drift")
    seal = json.loads(args.prediction_seal.read_text())
    if seal["predictions_sha256"] != PREDICTIONS_SHA256 or seal["gold_opened"] is not False:
        raise SystemExit("prediction seal invalid")
    cohort = json.loads(args.freeze.read_text())["selected"]
    packets = [json.loads(line) for line in args.packets.read_text().splitlines()]
    predictions = [json.loads(line) for line in args.predictions.read_text().splitlines()]
    if len(cohort) != 24 or len(packets) != 72 or len(predictions) != 72:
        raise SystemExit("denominator drift")
    packet_by_id = {(row["case_id"], row["view"]): row for row in packets}
    prediction_by_id = {(row["case_id"], row["view"]): row for row in predictions}
    case_ids = {f"{row['repo']}/{row['bugid']}" for row in cohort}
    if {case for case, _ in packet_by_id} != case_ids or set(packet_by_id) != set(prediction_by_id):
        raise SystemExit("case identity drift")

    labels = {}
    label_receipts = {}
    with tarfile.open(args.archive, "r:gz") as archive:
        for item in cohort:
            case = f"{item['repo']}/{item['bugid']}"
            member = archive.getmember(PREFIX + f"projects/{item['repo']}/bugs/{item['bugid']}/bug_patch.txt")
            if not member.isfile() or member.size > 2_000_000:
                raise SystemExit(f"patch member invalid: {case}")
            stream = archive.extractfile(member)
            if stream is None:
                raise SystemExit(f"patch member missing: {case}")
            raw = stream.read()
            labels[case] = changed_paths(raw)
            label_receipts[case] = hashlib.sha256(raw).hexdigest()

    records = []
    for case in sorted(case_ids):
        views = {view: packet_by_id[(case, view)] for view in ("original", "reverse", "rotate_half")}
        decisions = {view: prediction_by_id[(case, view)] for view in views}
        first = views["original"]
        are = first["are_ranked_files"]
        chunk = first["chunk_ranked_files"]
        if any(view["are_ranked_files"] != are or view["chunk_ranked_files"] != chunk
               for view in views.values()) or len(are) != len(set(are)) or set(are) != set(chunk):
            raise SystemExit(f"ranking universe drift: {case}")
        gold_all = labels[case]
        gold = gold_all & set(are)
        complete_views = all(decision["valid"] for decision in decisions.values())
        treatment = rrf(are, [decisions[view]["selected_paths"] for view in views]) \
            if complete_views else None
        if treatment is not None and (len(treatment) != len(are) or set(treatment) != set(are)):
            raise SystemExit(f"treatment universe drift: {case}")
        records.append({
            "case_id": case,
            "repo": first["repo"],
            "patch_sha256": label_receipts[case],
            "changed_paths": sorted(gold_all),
            "admitted_paths": sorted(gold),
            "outside_universe_paths": sorted(gold_all - set(are)),
            "label_valid": bool(gold_all and gold),
            "three_view_complete": complete_views,
            "metrics": {
                "are": score(are, gold) if gold else None,
                "chunk": score(chunk, gold) if gold else None,
                "rrf": score(treatment, gold) if treatment is not None and gold else None,
            },
        })
    valid_labels = sum(row["label_valid"] for row in records)
    complete_rows = [row for row in records if row["three_view_complete"] and row["label_valid"]]
    overall = {arm: aggregate(records, arm) for arm in ("are", "chunk", "rrf")}
    complete_subset = {arm: aggregate(complete_rows, arm) for arm in ("are", "chunk", "rrf")}
    stronger = max(("are", "chunk"), key=lambda arm: complete_subset[arm]["mrr_at_8"])
    deltas = {arm: [row["metrics"]["rrf"]["mrr_at_8"] - row["metrics"][arm]["mrr_at_8"]
                    for row in complete_rows] for arm in ("are", "chunk")}
    grouped = collections.defaultdict(list)
    for row in complete_rows:
        grouped[row["repo"]].append(row)
    rng = random.Random(BOOTSTRAP_SEED)
    repos = sorted(grouped)
    intervals = {}
    for arm in ("are", "chunk"):
        draws = []
        for _ in range(BOOTSTRAPS):
            picked = [repos[rng.randrange(len(repos))] for _ in repos]
            draws.append(statistics.mean(
                row["metrics"]["rrf"]["mrr_at_8"] - row["metrics"][arm]["mrr_at_8"]
                for repo in picked for row in grouped[repo]))
        intervals[arm] = [percentile(draws, 0.025), percentile(draws, 0.975)]
    by_repo = {repo: {arm: statistics.mean(row["metrics"][arm]["mrr_at_8"] for row in rows)
                      for arm in ("are", "chunk", "rrf")} for repo, rows in sorted(grouped.items())}
    repo_wins = sum(values["rrf"] > values[stronger] for values in by_repo.values())
    strict_complete = seal["valid_responses"] == 72 and len(complete_rows) == 24
    gates = {
        "tokenizer_72_and_valid_generations_72": seal["tokenizer_admissions"] == 72
            and seal["valid_responses"] == 72,
        "valid_labels_and_sources_24": valid_labels == 24,
        "identical_universes_24": len(records) == 24,
        "rrf_mrr_gain_at_least_point_10": strict_complete and
            complete_subset["rrf"]["mrr_at_8"] - complete_subset[stronger]["mrr_at_8"] >= 0.10,
        "repo_bootstrap_lower_above_zero_both": strict_complete and
            all(intervals[arm][0] > 0 for arm in ("are", "chunk")),
        "rrf_hit3_not_below_stronger": strict_complete and
            complete_subset["rrf"]["hit_at_3"] >= complete_subset[stronger]["hit_at_3"],
        "repo_gains_at_least_8_of_12": strict_complete and repo_wins >= 8,
        "rrf_recall20_not_below_baselines": strict_complete and all(
            complete_subset["rrf"]["recall_at_20"] >= complete_subset[arm]["recall_at_20"]
            for arm in ("are", "chunk")),
    }
    report = {
        "schema_version": "are.g01-rrf-confirm-r54-evaluation/v1",
        "status": "protocol-failed-diagnostic-evaluation",
        "interpretation": "The 72/72 response-validity gate failed. RRF metrics are descriptive only on the 15 prospectively valid complete cases and cannot support the frozen superiority claim.",
        "cases": 24,
        "valid_labels": valid_labels,
        "complete_three_view_cases": len(complete_rows),
        "aggregate_full_baselines": {arm: overall[arm] for arm in ("are", "chunk")},
        "diagnostic_complete_subset": complete_subset,
        "diagnostic_delta_mrr_at_8": {arm: statistics.mean(values) for arm, values in deltas.items()},
        "diagnostic_repository_bootstrap_95_interval": intervals,
        "diagnostic_repositories": len(repos),
        "diagnostic_repo_wins_vs_stronger": repo_wins,
        "stronger_subset_baseline": stronger,
        "bootstrap": {"repetitions": BOOTSTRAPS, "seed": BOOTSTRAP_SEED},
        "gate_checks": gates,
        "advancement_gate_passed": all(gates.values()),
        "superiority_claim_supported": False,
        "claim_ceiling": "failed private confirmation; diagnostic mechanism evidence only",
        "input_sha256": {
            "archive": ARCHIVE_SHA256,
            "freeze": FREEZE_SHA256,
            "packets": digest(args.packets),
            "predictions": PREDICTIONS_SHA256,
            "prediction_seal": digest(args.prediction_seal),
        },
        "rows_private": records,
    }
    args.output.mkdir(parents=True)
    output = args.output / "EVALUATION.json"
    output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "rows_private"}, sort_keys=True))


if __name__ == "__main__":
    main()
