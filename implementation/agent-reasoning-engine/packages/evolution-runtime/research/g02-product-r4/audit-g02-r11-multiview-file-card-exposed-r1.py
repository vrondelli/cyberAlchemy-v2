#!/usr/bin/env python3
"""Evaluator-only audit of sealed G02 r11 multi-view file-card rankings."""

import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as parquet


ARCHIVE = Path("/home/vlad_/are-benchmark-archive")
SOURCE = ARCHIVE / "g02-r11-multiview-file-card-exposed-r1-20261004/SOURCE-SEAL.json"
SOURCE_SHA = "2f01525c5e58f35755a3943462d9d90fcac23c1386587ea02aae4620592cd8fb"
PACKETS = ARCHIVE / "g02-r11-search-packets-exposed-r1-20261004/PACKETS.json"
PACKETS_SHA = "2c10c75d0e9ddf495210db994bc34b63c4cb3cec0cf46079ef4a630c5a6cfb6b"
UNION = ARCHIVE / "g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json"
UNION_SHA = "7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291"
BASELINE = ARCHIVE / "g02-r11-fullrepo-lexical-exposed-r1-20261004/EVALUATOR-AUDIT.json"
BASELINE_SHA = "2894b8b0f15ce200a64932f5fa84d6fa0dc441215dd400b8ed80cc9b97879dfe"
PARQUET = ARCHIVE / "g01-r8-eight-task-evaluator-r1/full.parquet"
PARQUET_SHA = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"
OUTPUT = SOURCE.parent / "EVALUATOR-AUDIT.json"


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def normalize(path):
    path = path.replace("\\", "/")
    if path.startswith("/testbed/"):
        path = path[len("/testbed/"):]
    elif path.startswith("/workspace/"):
        parts = path[len("/workspace/"):].split("/", 1)
        path = parts[1] if len(parts) == 2 else parts[0]
    return path.lstrip("/").removeprefix("./")


def main():
    pins = {SOURCE: SOURCE_SHA, PACKETS: PACKETS_SHA, UNION: UNION_SHA,
            BASELINE: BASELINE_SHA, PARQUET: PARQUET_SHA}
    actual = {path: sha(path) for path in pins}
    if OUTPUT.exists() or any(actual[path] != expected for path, expected in pins.items()):
        raise SystemExit("output-exists-or-input-drift:" + json.dumps(
            {str(path): [actual[path], pins[path]] for path in pins if actual[path] != pins[path]}))
    source = json.loads(SOURCE.read_text())
    packets = json.loads(PACKETS.read_text())["ordered_packets"]
    union = {row["ordinal"]: row for row in json.loads(UNION.read_text())["rows"]}
    baseline = json.loads(BASELINE.read_text())
    references = parquet.read_table(
        PARQUET, columns=["instance_id", "base_commit", "gold_context"]
    ).to_pylist()
    gold_by_id = {row["instance_id"]: row for row in references}
    if len(gold_by_id) != len(references) or len(source["rows"]) != 12 or len(packets) != 12:
        raise SystemExit("cohort-shape")

    depths = (12, 24, 48, 96)
    summary = {depth: {"hits": 0, "outside_relation_union_hits": 0,
                       "repositories_with_hit": set()} for depth in depths}
    rows = []
    undelivered_total = 0
    for ranked, packet in zip(source["rows"], packets):
        ordinal = packet["ordinal"]
        reference = gold_by_id[packet["instance_id"]]
        relation = union[ordinal]
        if (ranked["ordinal"] != ordinal or ranked["instance_id"] != packet["instance_id"]
                or ranked["base_commit"] != packet["base_commit"]
                or reference["base_commit"] != packet["base_commit"]
                or relation["instance_id"] != packet["instance_id"]):
            raise SystemExit(f"identity-drift:{ordinal}")
        gold = {normalize(item["file"]) for item in json.loads(reference["gold_context"])}
        delivered = {normalize(path) for path in packet["delivered_paths"]}
        missing = gold - delivered
        relation_paths = {item["path"] for item in relation["candidates"]}
        ranked_paths = [item["path"] for item in ranked["ranked"]]
        if len(ranked_paths) != len(set(ranked_paths)) or set(ranked_paths) & delivered:
            raise SystemExit(f"ranking-invalid:{ordinal}")
        undelivered_total += len(missing)
        counts = {}
        for depth in depths:
            hits = set(ranked_paths[:depth]) & missing
            outside = hits - relation_paths
            summary[depth]["hits"] += len(hits)
            summary[depth]["outside_relation_union_hits"] += len(outside)
            if hits:
                summary[depth]["repositories_with_hit"].add(packet["repo"])
            counts[str(depth)] = {"new_gold_hits": len(hits),
                                  "outside_relation_union_hits": len(outside),
                                  "hit_paths": sorted(hits)}
        rows.append({"ordinal": ordinal, "repo": packet["repo"],
                     "undelivered_gold_count": len(missing), "depth_counts": counts})

    depth_summary = {
        str(depth): {"hits": item["hits"],
                     "outside_relation_union_hits": item["outside_relation_union_hits"],
                     "repositories_with_hit": len(item["repositories_with_hit"])}
        for depth, item in summary.items()
    }
    gate = source["policy"]["advancement_gate"]
    top = depth_summary["24"]
    gate_pass = (top["hits"] >= gate["top24_new_gold_hits_min"]
                 and top["outside_relation_union_hits"] >= gate["top24_outside_relation_union_gold_min"]
                 and top["repositories_with_hit"] >= gate["repositories_with_hit_min"])
    baseline_top = baseline["depth_summary"]["24"]
    report = {
        "schema_version": "g02.r11-multiview-file-card-evaluator-r1/v1",
        "posture": "evaluator-only-exposed-development-no-model-or-actual-reads",
        "input_sha256": {str(path): expected for path, expected in pins.items()},
        "script_sha256": sha(Path(__file__)),
        "undelivered_gold_total": undelivered_total,
        "gate": gate,
        "gate_pass": gate_pass,
        "depth_summary": depth_summary,
        "top24_change_vs_code_lexical": {
            "hits": top["hits"] - baseline_top["hits"],
            "outside_relation_union_hits": (top["outside_relation_union_hits"]
                                              - baseline_top["outside_relation_union_hits"]),
            "repositories_with_hit": top["repositories_with_hit"] - baseline_top["repositories_with_hit"],
        },
        "rows": rows,
        "claim_ceiling": "Exposed candidate-acquisition coverage only; no model choice, actual ARE reads, native F1, independent transfer, or superiority.",
    }
    data = (json.dumps(report, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"undelivered_gold_total": undelivered_total,
                      "depth_summary": depth_summary,
                      "top24_change_vs_code_lexical": report["top24_change_vs_code_lexical"],
                      "gate_pass": gate_pass,
                      "sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
