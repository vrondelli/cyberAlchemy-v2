#!/usr/bin/env python3
"""Evaluator-only audit of source-only projected initial packets."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import statistics
import tarfile


ARCHIVE_SHA256 = "19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4"
DELIVERY_SHA256 = "dd08238e038cdb7431fb8c0943a6bdf2dafeb0a6a43a91204f727448789e2c79"
DEV_ID_SET_SHA256 = "603170065f9e8bc4d6334d16e073ac528bb29d5b61d0b02809208315c774e641"


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=pathlib.Path, required=True)
    parser.add_argument("--delivery", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    archive, delivery = (path.resolve(strict=True) for path in (args.archive, args.delivery))
    output = args.output.absolute()
    if output.exists() or sha256_file(archive) != ARCHIVE_SHA256 or sha256_file(delivery) != DELIVERY_SHA256:
        raise SystemExit("output exists or input hash mismatch")
    rows = [json.loads(line) for line in delivery.read_text().splitlines()]
    predicted = {row["id"]: row for row in rows}
    ids = set(predicted)
    if len(rows) != 56 or len(ids) != 56 or \
            hashlib.sha256(("\n".join(sorted(ids)) + "\n").encode()).hexdigest() != DEV_ID_SET_SHA256:
        raise SystemExit("development denominator drift")
    variants = ("are_line_tail", "candidate_bm25", "candidate_trace_text")
    scored = []
    with tarfile.open(archive, "r:zst") as tar:
        stream = tar.extractfile("./benchmark/v2_trace2code/samples.jsonl")
        if stream is None:
            raise SystemExit("benchmark samples missing")
        for line in stream:
            row = json.loads(line)
            if row["repo"] != "gin-gonic/gin":
                continue  # Held-out rows skipped before gold access.
            prediction = predicted.get(row["id"])
            if prediction is None or prediction["base_commit"] != row["base_commit"]:
                raise SystemExit("sample identity drift")
            gold = set(row["gold"]["root_cause_files"])
            if not gold:
                raise SystemExit("empty development gold")
            case = {"id": row["id"], "gold_file_count": len(gold), "variants": {}}
            for name in variants:
                packet = prediction["variants"][name]
                paths = packet["selected_paths"]
                if len(paths) > 3 or len(paths) != len(set(paths)) or \
                        [read["path"] for read in packet["reads"]] != paths or \
                        sum(read["bytes"] for read in packet["reads"]) != packet["delivered_bytes"] or \
                        packet["delivered_bytes"] > 49152:
                    raise SystemExit("packet contract drift")
                case["variants"][name] = {"hit_at_3": float(bool(gold.intersection(paths))),
                                          "recall_at_3": len(gold.intersection(paths)) / len(gold),
                                          "delivered_bytes": packet["delivered_bytes"]}
            scored.append(case)
    if len(scored) != 56 or {row["id"] for row in scored} != ids:
        raise SystemExit("scored denominator drift")
    aggregates = {}
    for name in variants:
        values = [row["variants"][name] for row in scored]
        aggregates[name] = {"hits": int(sum(value["hit_at_3"] for value in values)),
                            "mean_recall_at_3": statistics.mean(value["recall_at_3"] for value in values),
                            "mean_delivered_bytes": statistics.mean(value["delivered_bytes"] for value in values),
                            "max_delivered_bytes": max(value["delivered_bytes"] for value in values)}
    report = {"schema": "are.arb-trace2code-gin-initial-packet-audit-r1/v1",
              "posture": "development source projection; simulated read_file, not live ARE or official ARB context metric",
              "archive_sha256": ARCHIVE_SHA256, "delivery_sha256": DELIVERY_SHA256,
              "development_cases": len(scored), "gold_file_entries": sum(row["gold_file_count"] for row in scored),
              "heldout_gold_inspected": False, "aggregates": aggregates,
              "per_case_numeric_only": sorted(scored, key=lambda row: row["id"])}
    output.mkdir(parents=True, exist_ok=False)
    (output / "EVALUATOR-AUDIT.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "per_case_numeric_only"}, sort_keys=True))


if __name__ == "__main__":
    main()
