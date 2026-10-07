#!/usr/bin/env python3
"""Evaluator-only coverage gate for the frozen G02 r3 shortlist."""

import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path("/home/vlad_/are-benchmark-archive")
PACKETS = ROOT / "g02-r11-guarded-delta-packets-exposed-r3-20261004/PACKETS.json"
PACKETS_SHA = "a9dc4039a4d859423ab33265c8283a13c4bb79aa6eefa28bd35b2876f5d63e61"
PARQUET = ROOT / "g01-r8-eight-task-evaluator-r1/full.parquet"
PARQUET_SHA = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"
OUTPUT = PACKETS.parent / "COVERAGE-AUDIT.json"


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
    if (OUTPUT.exists() or sha(PACKETS) != PACKETS_SHA
            or sha(PARQUET) != PARQUET_SHA):
        raise SystemExit("output-exists-or-input-drift")
    data = json.loads(PACKETS.read_text())
    packets = data["ordered_packets"]
    references = parquet.read_table(
        PARQUET, columns=["instance_id", "base_commit", "gold_context"]
    ).to_pylist()
    native = {row["instance_id"]: row for row in references}
    if len(native) != len(references) or [row["ordinal"] for row in packets] != list(range(1, 13)):
        raise SystemExit("cohort-shape")

    rows = []
    repository_hits = defaultdict(int)
    for packet in packets:
        reference = native[packet["instance_id"]]
        if reference["base_commit"] != packet["base_commit"]:
            raise SystemExit(f"identity-drift:{packet['ordinal']}")
        gold = {normalize(item["file"]) for item in json.loads(reference["gold_context"])}
        delivered = {normalize(path) for path in packet["already_read_paths"]}
        candidates = {item["path"] for item in packet["candidates"]}
        if candidates & delivered or len(candidates) != len(packet["candidates"]):
            raise SystemExit(f"candidate-invalid:{packet['ordinal']}")
        undelivered = gold - delivered
        hits = candidates & undelivered
        repository_hits[packet["repo"]] += len(hits)
        rows.append({
            "ordinal": packet["ordinal"],
            "repo": packet["repo"],
            "shortlist_size": len(candidates),
            "undelivered_gold_count": len(undelivered),
            "new_gold_hits": len(hits),
            "new_gold_paths": sorted(hits),
        })

    summary = {
        "tasks": len(rows),
        "shortlisted_candidates": sum(row["shortlist_size"] for row in rows),
        "undelivered_gold_occurrences": sum(row["undelivered_gold_count"] for row in rows),
        "new_gold_hits": sum(row["new_gold_hits"] for row in rows),
        "repositories_with_hit": sum(value > 0 for value in repository_hits.values()),
        "by_repository_hits": dict(sorted(repository_hits.items())),
    }
    gate = data["policy"]["coverage_gate"]
    passed = (summary["new_gold_hits"] >= gate["minimum_new_gold_hits"]
              and summary["repositories_with_hit"] >= gate["minimum_repositories_with_hit"])
    report = {
        "schema_version": "g02.r11-guarded-delta-shortlist-audit-exposed-r3/v1",
        "posture": "evaluator-only-exposed-coverage-gate-before-provider-requests",
        "packet_sha256": PACKETS_SHA,
        "parquet_sha256": PARQUET_SHA,
        "script_sha256": sha(Path(__file__)),
        "gate": gate,
        "gate_pass": passed,
        "summary": summary,
        "rows": rows,
        "claim_ceiling": "Exposed shortlist coverage only; no provider output, actual reads, native score, transfer, or superiority.",
    }
    encoded = (json.dumps(report, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"summary": summary, "gate_pass": passed,
                      "sha256": hashlib.sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
