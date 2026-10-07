#!/usr/bin/env python3
"""Seal GLM reranks before gold; audit all 89 exposed ARB cases afterward."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import statistics
import tarfile

ARCHIVE_SHA256 = "19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4"
PACKET_SHA256 = "d61a29b6fdf1fcea16e8fc078e190fc99bdb56efe4af2e4ddaa8da1d0c7fd960"
FREEZE_SHA256 = "55d5720cc6d14144dbe01fa4614fbb708f3bf4859eb388c0574874c20214c13c"


def digest(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def load_rows(path: pathlib.Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines()]


def seal(root: pathlib.Path) -> None:
    packets_path, freeze_path = root / "PACKETS.jsonl", root / "FREEZE.json"
    output = root / "SEALED-RANKINGS.jsonl"
    receipt_path = root / "RANKING-SEAL.json"
    if output.exists() or receipt_path.exists() or digest(packets_path) != PACKET_SHA256 or \
            digest(freeze_path) != FREEZE_SHA256:
        raise SystemExit("output exists or freeze drift")
    packets = load_rows(packets_path)
    if len(packets) != 89 or len({row["id"] for row in packets}) != 89:
        raise SystemExit("packet denominator drift")
    scored = []
    response_hashes = {}
    for ordinal, packet in enumerate(packets, 1):
        path = root / f"RESPONSE-{ordinal}.json"
        response = json.loads(path.read_text())
        if response["ordinal"] != ordinal or response["id"] != packet["id"]:
            raise SystemExit("response identity drift")
        response_hashes[str(ordinal)] = digest(path)
        are = packet["are_ranked_files"]
        arb = packet["arb_ranked_files"]
        if len(are) != len(set(are)) or set(are) != set(arb):
            raise SystemExit("candidate universe drift")
        ids = response["selected_ids"] if response["status"] == "valid" else []
        if ids is None or len(ids) > 8 or len(ids) != len(set(ids)) or any(
                not isinstance(i, int) or i < 1 or i > len(packet["candidates"]) for i in ids):
            raise SystemExit("selected id drift")
        paths = [packet["candidates"][i - 1]["path"] for i in ids]
        if len(paths) != len(set(paths)) or not set(paths).issubset(set(are)):
            raise SystemExit("selected path drift")
        proposal = paths + [path for path in are if path not in set(paths)]
        scored.append({"id": packet["id"], "repo": packet["repo"],
                       "base_commit": packet["base_commit"], "status": response["status"],
                       "proposal_ranked_files": proposal, "are_ranked_files": are,
                       "arb_ranked_files": arb, "selected_count": len(paths)})
    output.write_text("\n".join(json.dumps(row, sort_keys=True) for row in scored) + "\n")
    receipt = {"schema": "are.arb-exposed-rerank-remaining-ranking-seal-r2/v1",
               "posture": "sealed before gold; invalid responses retain ARE baseline ordering",
               "packet_sha256": PACKET_SHA256, "freeze_sha256": FREEZE_SHA256,
               "response_sha256": response_hashes, "prediction_sha256": digest(output),
               "cases": 89, "valid_responses": sum(row["status"] == "valid" for row in scored),
               "gold_opened": False}
    receipt_path.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n")
    print(json.dumps(receipt, sort_keys=True))


def metrics(paths: list[str], gold: set[str]) -> dict:
    rank = min(paths.index(path) + 1 for path in gold)
    return {"mrr_at_8": 1 / rank if rank <= 8 else 0.0,
            "hit_at_3": int(rank <= 3),
            "recall_at_20": len(gold.intersection(paths[:20])) / len(gold)}


def audit(root: pathlib.Path, archive: pathlib.Path) -> None:
    receipt = json.loads((root / "RANKING-SEAL.json").read_text())
    sealed = root / "SEALED-RANKINGS.jsonl"
    output = root / "EVALUATOR-AUDIT.json"
    if output.exists() or digest(archive) != ARCHIVE_SHA256 or \
            receipt["prediction_sha256"] != digest(sealed) or receipt["cases"] != 89:
        raise SystemExit("output exists or source/archive drift")
    predictions = {row["id"]: row for row in load_rows(sealed)}
    if len(predictions) != 89:
        raise SystemExit("prediction denominator drift")
    records = []
    with tarfile.open(archive, "r:zst") as tar:
        source = tar.extractfile("./benchmark/v2_trace2code/samples.jsonl")
        if source is None:
            raise SystemExit("missing evaluator samples")
        for line in source:
            sample = json.loads(line)
            if sample["id"] not in predictions:
                continue
            prediction = predictions[sample["id"]]
            if sample["repo"] != prediction["repo"] or sample["base_commit"] != prediction["base_commit"]:
                raise SystemExit("gold identity drift")
            gold = set(sample["gold"]["root_cause_files"])
            if not gold or not gold.issubset(set(prediction["proposal_ranked_files"])):
                raise SystemExit("gold candidate universe drift")
            records.append({"id": sample["id"], "repo": sample["repo"],
                            "status": prediction["status"], "selected_count": prediction["selected_count"],
                            "metrics": {arm: metrics(prediction[f"{arm}_ranked_files"], gold)
                                        for arm in ("proposal", "are", "arb")}})
    if len(records) != 89:
        raise SystemExit("score denominator drift")
    aggregate = {arm: {metric: statistics.mean(row["metrics"][arm][metric] for row in records)
                       for metric in ("mrr_at_8", "hit_at_3", "recall_at_20")}
                 for arm in ("proposal", "are", "arb")}
    repos = sorted({row["repo"] for row in records})
    by_repo = {repo: {arm: statistics.mean(row["metrics"][arm]["mrr_at_8"]
                                            for row in records if row["repo"] == repo)
                      for arm in ("proposal", "are", "arb")} for repo in repos}
    gates = {"valid_responses_89": receipt["valid_responses"] == 89,
             "three_repositories_with_mrr_gain_vs_are": sum(
                 by_repo[repo]["proposal"] > by_repo[repo]["are"] for repo in repos) >= 3,
             "mean_mrr_no_worse_than_both": aggregate["proposal"]["mrr_at_8"] >= max(
                 aggregate["are"]["mrr_at_8"], aggregate["arb"]["mrr_at_8"])}
    report = {"schema": "are.arb-exposed-rerank-remaining-evaluator-audit-r2/v1",
              "posture": "89 exposed development cases, not independent or live ARE",
              "source_prediction_sha256": digest(sealed), "archive_sha256": ARCHIVE_SHA256,
              "cases": 89, "repositories": len(repos), "aggregate": aggregate,
              "per_repo": by_repo, "advancement_gates": gates,
              "advancement_passed": all(gates.values()),
              "per_case_numeric_only": sorted(records, key=lambda row: row["id"])}
    output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "per_case_numeric_only"}, sort_keys=True))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("seal", "audit"))
    parser.add_argument("--root", required=True, type=pathlib.Path)
    parser.add_argument("--archive", type=pathlib.Path)
    args = parser.parse_args()
    if args.mode == "seal":
        seal(args.root)
    elif args.archive:
        audit(args.root, args.archive)
    else:
        raise SystemExit("audit requires --archive")
