#!/usr/bin/env python3
"""Source-only bounded GLM read-choice packets for three exposed r11 C++ tasks."""

import argparse
import hashlib
import importlib.util
import json
import os
import re
from pathlib import Path


GRAPH_SHA256 = "031c44de02388b89261a921ef3def5a17eecae5c5faa8f308594e9b3a645c15d"
PRIOR_SHA256 = "eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901"
RANKER_SHA256 = "58838344fd19274387440748122e7e3086590304eb53dec8ecab3def4bfa8eed"
MAX_READ_BYTES = 262144


def sha(data):
    return hashlib.sha256(data).hexdigest()


def excerpt(content, issue_terms):
    best = (0, "")
    for line in content.splitlines():
        clean = line.strip()
        if not clean or len(clean) > 1000:
            continue
        words = {part.casefold() for part in re.findall(r"[A-Za-z][A-Za-z0-9_]{4,}", clean)}
        hits = len(words & issue_terms)
        if hits > best[0]:
            best = (hits, clean[:180])
    return best[1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("graph_seal", type=Path)
    parser.add_argument("prior_seal", type=Path)
    parser.add_argument("ranker", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if (sha(args.graph_seal.read_bytes()) != GRAPH_SHA256 or
            sha(args.prior_seal.read_bytes()) != PRIOR_SHA256 or
            sha(args.ranker.read_bytes()) != RANKER_SHA256):
        raise SystemExit("source input drift")
    spec = importlib.util.spec_from_file_location("fixed_file_bm25", args.ranker)
    ranker = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ranker)
    graph = json.loads(args.graph_seal.read_text())
    prior = json.loads(args.prior_seal.read_text())
    prior_rows = {row["ordinal"]: row for row in prior["rows"]}
    packets = []
    for row in graph["rows"]:
        ordinal = row["ordinal"]
        root = Path(prior["archive"]) / "pairs" / f"{ordinal:02d}-pr11-mixed-{ordinal:02d}" / "raw"
        base = root / "sources/session/base"
        tasks = [path for path in (root / "tasks").glob("*.json") if path.name != "binding.json"]
        if len(tasks) != 1:
            raise ValueError("task count")
        task = json.loads(tasks[0].read_text())
        issue = task["problem_statement"]
        source = prior_rows[ordinal]
        if (task["instance_id"] != source["instance_id"] or
                sha(issue.encode()) != source["issue_sha256"] or
                row["base_commit"] != source["base_commit"] or
                row["delivered_paths"] != source["delivered_paths"]):
            raise ValueError("source identity drift")
        terms = {word for word in ranker.terms(issue) if len(word) >= 5}
        candidates = []
        for item in row["candidates"]:
            if item["bytes"] > MAX_READ_BYTES:
                continue
            file = base / item["path"]
            if not file.is_file() or file.is_symlink() or file.stat().st_size != item["bytes"]:
                raise ValueError("candidate drift")
            content = file.read_bytes().decode("utf-8", "replace")
            candidates.append({"path": item["path"],
                               "included_by_delivered": item["included_by_delivered"][:4],
                               "includes_delivered": item["includes_delivered"][:4],
                               "issue_excerpt": excerpt(content, terms)})
        packet = {"ordinal": ordinal, "instance_id": row["instance_id"],
                  "issue": issue, "already_read_paths": row["delivered_paths"],
                  "maximum_new_reads": 3, "candidates": candidates}
        if len(json.dumps(packet).encode()) > 32768:
            raise ValueError("packet exceeds fixed byte cap")
        packets.append(packet)
    output = {"schema_version": "g02.r11-glm-include-choice-packets-exposed/v1",
              "posture": "source-only-exposed-development-no-gold-dsh-or-score",
              "graph_seal_sha256": GRAPH_SHA256,
              "prior_seal_sha256": PRIOR_SHA256,
              "ranker_sha256": RANKER_SHA256,
              "script_sha256": sha(Path(__file__).read_bytes()),
              "packet_policy": "eligible direct-include neighbors <=262144 bytes; at most one 180-character issue-term excerpt per candidate; no gold, score, or comparator fields",
              "ordered_packets": packets,
              "claim_ceiling": "Frozen source-only exposed-development packets; no quality or superiority claim."}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"tasks": len(packets), "candidates": [len(packet["candidates"]) for packet in packets],
                      "seal_sha256": sha(data)}))


if __name__ == "__main__":
    main()
