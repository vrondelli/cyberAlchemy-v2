#!/usr/bin/env python3
"""Bounded source-only C++ read-choice packets; exposed r11 development only."""

import argparse
import hashlib
import json
import os
import re
from pathlib import Path


OLD_PACKET_SHA = "8b4c4939cf328374c295864223a2a431f39cdf89881a63728cff013128e464a8"
PRIOR_SHA = "eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901"
GRAPH_SHA = "031c44de02388b89261a921ef3def5a17eecae5c5faa8f308594e9b3a645c15d"
MAX_FILE_BYTES = 262144
MAX_PACKET_BYTES = 65536


def sha(data):
    return hashlib.sha256(data).hexdigest()


def terms(text):
    return {term.casefold() for term in re.findall(r"[A-Za-z_][A-Za-z_0-9]{3,}", text)}


def windows(content, issue_terms):
    lines = content.splitlines()
    ranked = []
    for index, line in enumerate(lines):
        if not line.strip() or len(line) > 1200:
            continue
        overlap = len(terms(line) & issue_terms)
        structural = bool(re.search(r"\b(class|struct|template|using|typedef|enum)\b|#\s*define", line))
        if overlap or structural:
            ranked.append((-(4 * overlap + int(structural)), index))
    ranked.sort()
    picked = []
    for _, index in ranked:
        if any(abs(index - old) <= 2 for old in picked):
            continue
        picked.append(index)
        if len(picked) == 3:
            break
    return [{"line": index + 1,
             "text": "\n".join(lines[max(0, index - 1):min(len(lines), index + 2)])[:450]}
            for index in picked]


def main():
    ap = argparse.ArgumentParser()
    for name in ("old_packets", "prior_seal", "graph_seal", "output"):
        ap.add_argument(name, type=Path)
    args = ap.parse_args()
    if (sha(args.old_packets.read_bytes()) != OLD_PACKET_SHA or
            sha(args.prior_seal.read_bytes()) != PRIOR_SHA or
            sha(args.graph_seal.read_bytes()) != GRAPH_SHA):
        raise SystemExit("frozen source input drift")
    old = json.loads(args.old_packets.read_text())
    prior = json.loads(args.prior_seal.read_text())
    graph = json.loads(args.graph_seal.read_text())
    if ([packet["ordinal"] for packet in old["ordered_packets"]] != [4, 8, 12] or
            [row["ordinal"] for row in graph["rows"]] != [4, 8, 12]):
        raise SystemExit("task order drift")
    rows = {row["ordinal"]: row for row in graph["rows"]}
    packets = []
    for packet in old["ordered_packets"]:
        ordinal = packet["ordinal"]
        base = (Path(prior["archive"]) / "pairs" /
                f"{ordinal:02d}-pr11-mixed-{ordinal:02d}" / "raw/sources/session/base")
        graph_candidates = {item["path"]: item for item in rows[ordinal]["candidates"]}
        chosen = []
        issue_terms = terms(packet["issue"]) - {"from", "with", "this", "that", "should", "when", "there", "their", "have", "into"}
        for item in packet["candidates"]:
            path = item["path"]
            source = graph_candidates[path]
            file = base / path
            if (source["bytes"] > MAX_FILE_BYTES or file.is_symlink() or not file.is_file() or
                    file.stat().st_size != source["bytes"] or
                    item["included_by_delivered"] != source["included_by_delivered"][:4] or
                    item["includes_delivered"] != source["includes_delivered"][:4]):
                raise SystemExit("candidate source drift")
            content = file.read_bytes().decode("utf-8", "replace")
            chosen.append({"path": path,
                           "included_by_delivered": source["included_by_delivered"],
                           "includes_delivered": source["includes_delivered"],
                           "code_windows": windows(content, issue_terms)})
        new_packet = {"ordinal": ordinal, "instance_id": packet["instance_id"],
                      "issue": packet["issue"], "already_read_paths": packet["already_read_paths"],
                      "maximum_new_reads": 3, "candidates": chosen}
        if len(json.dumps(new_packet).encode()) > MAX_PACKET_BYTES:
            raise SystemExit("packet byte cap exceeded")
        packets.append(new_packet)
    result = {"schema_version": "g02.r11-relational-packets-exposed-r2/v1",
              "posture": "source-only-exposed-development-no-gold-dsh-or-score",
              "old_packet_sha256": OLD_PACKET_SHA, "prior_sha256": PRIOR_SHA,
              "graph_sha256": GRAPH_SHA,
              "script_sha256": sha(Path(__file__).read_bytes()),
              "policy": "all <=262144-byte direct-include candidates; up to three <=450-character source windows per candidate ranked by issue-token overlap plus structural declarations; complete direct include edges; maximum three reads",
              "ordered_packets": packets,
              "claim_ceiling": "Exposed source-only read-choice development; no independent quality or superiority claim."}
    data = (json.dumps(result, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as target:
        target.write(data)
    print(json.dumps({"sha256": sha(data), "packet_bytes": [len(json.dumps(p).encode()) for p in packets],
                      "candidates": [len(p["candidates"]) for p in packets]}))


if __name__ == "__main__":
    main()
