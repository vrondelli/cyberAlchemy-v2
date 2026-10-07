#!/usr/bin/env python3
"""Independent Git-patch and ranking-metric audit of sealed BugsInPy r1."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import pathlib
import subprocess
import tarfile


ARCHIVE_SHA256 = "8b242a0a62b91002fedaff64e112ba8b761d15e805d4635098f51b173fff5548"
PREDICTION_SHA256 = "f72dc04c2d4305c6a2544dcbfe1fe0c4af362833f3349417c5959344100f27e9"
EVALUATOR_SHA256 = "c614d7d92a5901654ee0dde4f1e62ebd6bb43cb4a6807f39b66db3ab39cf68c0"
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
    rows = [json.loads(line) for line in args.predictions.read_text().splitlines()]
    report = json.loads(args.evaluator.read_text())
    scored = {row["id"]: row for row in report["per_case_private"]}
    require(len(rows) == len(scored) == 24 and {row["id"] for row in rows} == set(scored),
            "case denominator mismatch")
    totals = {arm: {metric: 0.0 for metric in ("mrr_at_8", "hit_at_3", "recall_at_20")}
              for arm in ("proposal", "are", "chunk")}
    with tarfile.open(args.archive, "r:gz") as archive:
        for row in rows:
            case = row["id"]
            repo, bugid = case.split("/", 1)
            path = PREFIX + f"projects/{repo}/bugs/{bugid}/bug_patch.txt"
            stream = archive.extractfile(path)
            require(stream is not None, f"missing patch: {case}")
            raw = stream.read()
            git = subprocess.run(["git", "apply", "--numstat"], input=raw,
                                 capture_output=True, timeout=20, check=False)
            require(git.returncode == 0 and not git.stderr, f"Git patch parser failed: {case}")
            names = set()
            for line in git.stdout.decode("utf-8", errors="replace").splitlines():
                fields = line.split("\t", 2)
                require(len(fields) == 3, f"Git numstat shape: {case}")
                names.add(fields[2])
            universe = set(row["are_ranked_files"])
            gold = names & universe
            expected = scored[case]
            require(gold and gold == set(expected["admitted_paths"]) and
                    names == set(expected["changed_paths"]) and
                    hashlib.sha256(raw).hexdigest() == expected["patch_sha256"],
                    f"independent Git label mismatch: {case}")
            for arm in totals:
                ranking = row[f"{arm}_ranked_files"]
                positions = {name: index + 1 for index, name in enumerate(ranking)}
                require(len(positions) == len(universe) and set(positions) == universe,
                        f"ranking universe mismatch: {case}/{arm}")
                rank = min(positions[name] for name in gold)
                values = {"mrr_at_8": 1.0 / rank if rank <= 8 else 0.0,
                          "hit_at_3": float(rank <= 3),
                          "recall_at_20": sum(positions[name] <= 20 for name in gold) / len(gold)}
                for metric, value in values.items():
                    require(math.isclose(value, expected["metrics"][arm][metric], abs_tol=1e-12),
                            f"per-case metric mismatch: {case}/{arm}/{metric}")
                    totals[arm][metric] += value
    averages = {arm: {metric: value / 24 for metric, value in metrics.items()}
                for arm, metrics in totals.items()}
    require(all(math.isclose(averages[arm][metric], report["aggregate"][arm][metric], abs_tol=1e-12)
                for arm in averages for metric in averages[arm]), "aggregate mismatch")
    print(json.dumps({"schema": "are.g01-bugsinpy-independent-result-audit-r1/v1",
                      "status": "passed", "cases": 24, "git_patch_paths_matched": 24,
                      "all_arm_metrics_matched": True, "aggregate": averages,
                      "evaluator_sha256": EVALUATOR_SHA256}, sort_keys=True))


if __name__ == "__main__":
    main()
