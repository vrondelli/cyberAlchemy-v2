#!/usr/bin/env python3
"""Independent Git-patch and paired metric audit of sealed BugsInPy r2b."""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import math
import pathlib
import subprocess
import tarfile


ARCHIVE_SHA256 = "8b242a0a62b91002fedaff64e112ba8b761d15e805d4635098f51b173fff5548"
PREDICTION_SHA256 = "45b0abd6cfa39d14299c3cd2e069458c82d84573b1406b8b9d9066f8f89a1130"
EVALUATOR_SHA256 = "b8a2d0829aba9d4838af53677d2503cb1c976c5cd3f55d3347f625e513ce1ae2"
PREFIX = "BugsInPy-316b95e2353ecda832bad9b42f86fa7c2fcec8ac/"


def digest(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def require(ok: bool, message: str) -> None:
    if not ok:
        raise SystemExit(message)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("archive", "predictions", "evaluator"):
        parser.add_argument(f"--{name}", type=pathlib.Path, required=True)
    args = parser.parse_args()
    require(digest(args.archive) == ARCHIVE_SHA256 and
            digest(args.predictions) == PREDICTION_SHA256 and
            digest(args.evaluator) == EVALUATOR_SHA256, "input digest drift")
    predictions = collections.defaultdict(dict)
    for row in (json.loads(line) for line in args.predictions.read_text().splitlines()):
        require(row["arm"] not in predictions[row["case_id"]], "duplicate arm")
        predictions[row["case_id"]][row["arm"]] = row
    report = json.loads(args.evaluator.read_text())
    scored = {row["id"]: row for row in report["per_case_private"]}
    require(len(predictions) == len(scored) == 24 and set(predictions) == set(scored),
            "case denominator mismatch")
    totals = {arm: collections.Counter() for arm in ("hinted", "unhinted", "are", "chunk")}
    union = collections.Counter()
    with tarfile.open(args.archive, "r:gz") as archive:
        for case, pair in predictions.items():
            require(set(pair) == {"hinted", "unhinted"}, f"paired arms: {case}")
            repo, bugid = case.split("/", 1)
            path = PREFIX + f"projects/{repo}/bugs/{bugid}/bug_patch.txt"
            stream = archive.extractfile(path)
            require(stream is not None, f"missing patch: {case}")
            raw = stream.read()
            git = subprocess.run(["git", "apply", "--numstat"], input=raw,
                                 capture_output=True, timeout=20, check=False)
            require(git.returncode == 0 and not git.stderr, f"Git patch parser failed: {case}")
            changed = set()
            for line in git.stdout.decode("utf-8", errors="replace").splitlines():
                fields = line.split("\t", 2)
                require(len(fields) == 3, f"Git numstat shape: {case}")
                changed.add(fields[2])
            universe = set(pair["unhinted"]["are_ranked_files"])
            gold = changed & universe
            expected = scored[case]
            require(gold and changed == set(expected["changed_paths"]) and
                    gold == set(expected["admitted_paths"]) and
                    hashlib.sha256(raw).hexdigest() == expected["patch_sha256"],
                    f"independent Git label mismatch: {case}")
            rankings = {"hinted": pair["hinted"]["proposal_ranked_files"],
                        "unhinted": pair["unhinted"]["proposal_ranked_files"],
                        "are": pair["unhinted"]["are_ranked_files"],
                        "chunk": pair["unhinted"]["chunk_ranked_files"]}
            for arm, ranking in rankings.items():
                positions = {name: index + 1 for index, name in enumerate(ranking)}
                require(len(positions) == len(universe) and set(positions) == universe,
                        f"ranking universe mismatch: {case}/{arm}")
                rank = min(positions[name] for name in gold)
                metrics = {"mrr_at_8": 1.0 / rank if rank <= 8 else 0.0,
                           "hit_at_3": float(rank <= 3),
                           "recall_at_20": sum(positions[name] <= 20 for name in gold) / len(gold)}
                for metric, value in metrics.items():
                    require(math.isclose(value, expected["metrics"][arm][metric], abs_tol=1e-12),
                            f"per-case metric mismatch: {case}/{arm}/{metric}")
                    totals[arm][metric] += value
            for arm in ("hinted", "unhinted"):
                hit = bool(gold.intersection(pair[arm]["candidate_paths"]))
                require(hit == expected["union_hit"][arm], f"union hit mismatch: {case}/{arm}")
                union[arm] += hit
    aggregate = {arm: {metric: value / 24 for metric, value in metrics.items()}
                 for arm, metrics in totals.items()}
    require(all(math.isclose(aggregate[arm][metric], report["aggregate"][arm][metric], abs_tol=1e-12)
                for arm in aggregate for metric in aggregate[arm]) and
            dict(union) == report["candidate_union_gold_cases"], "aggregate or union mismatch")
    effect = aggregate["hinted"]["mrr_at_8"] - aggregate["unhinted"]["mrr_at_8"]
    require(math.isclose(effect, report["paired_mrr_difference"], abs_tol=1e-12),
            "paired effect mismatch")
    print(json.dumps({"schema": "are.g01-bugsinpy-hints-r2b-independent-result-audit/v1",
                      "status": "passed", "cases": 24, "git_patch_paths_matched": 24,
                      "all_arm_metrics_matched": True, "candidate_union_gold_cases": dict(union),
                      "paired_mrr_difference": effect,
                      "evaluator_sha256": EVALUATOR_SHA256}, sort_keys=True))


if __name__ == "__main__":
    main()
